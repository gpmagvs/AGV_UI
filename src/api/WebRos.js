import param from "@/gpm_param"
import ROSLIB from "roslib";
import { SystemSettingsStore } from '@/store'
import { ROS_STORE } from "@/store/ros_store";
import { SystemAPI } from '@/api/VMSAPI';

var ros = new ROSLIB.Ros({
    url: param.ros_bridge_url
})

var ros_version = 'ROS1';
var keyboard_move_topic = null;
console.log('ros url:' + param.ros_bridge_url);

/** 重連退避設定 */
var RECONNECT_BASE_DELAY_MS = 1000;
var RECONNECT_MAX_DELAY_MS = 15000;
var CONNECTION_CHECK_INTERVAL_MS = 5000;
var reconnectAttempt = 0;
var reconnectTimer = null;
var isReconnecting = false;

SystemAPI.GetROS_VERSION().then(version => {
    ros_version = version;
    console.log('ROS version:' + ros_version);
    ensureKeyboardMoveTopic();
}).catch(error => {
    console.error('Failed to get ROS version:', error);
    ensureKeyboardMoveTopic();
});

function getCmdVelMessageType() {
    return ros_version == 'ROS1' ? 'geometry_msgs/Twist' : 'geometry_msgs/msg/Twist';
}

function ensureKeyboardMoveTopic() {
    if (keyboard_move_topic) {
        return;
    }
    keyboard_move_topic = new ROSLIB.Topic({
        ros: ros,
        name: '/cmd_vel',
        messageType: getCmdVelMessageType(),
        queue_length: 1,
        throttle_rate: 300,
    });
}

function clearReconnectTimer() {
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }
}

function getReconnectDelayMs() {
    var delay = RECONNECT_BASE_DELAY_MS * Math.pow(2, reconnectAttempt);
    return Math.min(delay, RECONNECT_MAX_DELAY_MS);
}

/** 嘗試重新連線 rosbridge */
function reconnectRos(reason) {
    if (ros.isConnected || isReconnecting || reconnectTimer) {
        return;
    }

    var socketState = ros.socket ? ros.socket.readyState : WebSocket.CLOSED;
    // 已在連線中則不重複排程；OPEN 但 isConnected=false 時改強制關閉，交給 close 事件重連
    if (socketState === WebSocket.CONNECTING) {
        return;
    }
    if (socketState === WebSocket.OPEN) {
        console.warn(`[WebRos] socket 仍為 OPEN 但未連線標記，強制關閉後重連 (${reason})`);
        try {
            ros.socket.close();
        } catch (closeError) {
            console.warn('[WebRos] 強制關閉 socket 失敗:', closeError);
        }
        return;
    }
    if (socketState === WebSocket.CLOSING) {
        return;
    }

    isReconnecting = true;
    var delay = getReconnectDelayMs();
    console.warn(`[WebRos] 準備重連 (${reason})，${delay}ms 後嘗試 (第 ${reconnectAttempt + 1} 次)`);

    reconnectTimer = setTimeout(function () {
        reconnectTimer = null;

        if (ros.isConnected) {
            isReconnecting = false;
            return;
        }

        try {
            console.log('[WebRos] 正在重連:', param.ros_bridge_url);
            ros.connect(param.ros_bridge_url);
            reconnectAttempt += 1;
        } catch (error) {
            console.error('[WebRos] 重連失敗:', error);
            reconnectAttempt += 1;
            isReconnecting = false;
            reconnectRos('connect-error');
            return;
        }
        isReconnecting = false;
    }, delay);
}

/** 發布前確認連線；未連線則觸發重連並略過本次發布 */
function ensureRosConnectedAndTopic() {
    ensureKeyboardMoveTopic();

    if (!ros.isConnected) {
        reconnectRos('publish-while-disconnected');
        console.warn('[WebRos] ROS 未連線，已觸發重連，略過本次 publish');
        return false;
    }

    if (!keyboard_move_topic) {
        console.warn('[WebRos] keyboard_move_topic 尚未初始化');
        return false;
    }

    return true;
}

function publishCmdVel(message) {
    if (!ensureRosConnectedAndTopic()) {
        return;
    }
    keyboard_move_topic.publish(new ROSLIB.Message(message));
}

ros.on('connection', function () {
    console.log('[WebRos] ros bridge server connected!');
    reconnectAttempt = 0;
    isReconnecting = false;
    clearReconnectTimer();
    linear_speed = 0.0;
    angular_speed = 0.0;
    ensureKeyboardMoveTopic();
    publishCmdVel({
        linear: { x: 0, y: 0, z: 0 },
        angular: { x: 0, y: 0, z: 0 },
    });
});

ros.on('error', function (error) {
    console.warn('[WebRos] ROS Connection error:', error);
});

ros.on('close', function () {
    console.warn('[WebRos] ros bridge connection closed');
    isReconnecting = false;
    clearReconnectTimer();
    reconnectRos('socket-close');
});

/** 頁面重新可見時主動檢查並重連 */
function handleVisibilityChange() {
    if (typeof document === 'undefined') {
        return;
    }
    if (document.hidden || document.visibilityState === 'hidden') {
        return;
    }
    if (!ros.isConnected) {
        console.log('[WebRos] 頁面重新顯示且 ROS 未連線，觸發重連');
        reconnectRos('visibility-visible');
    }
}

if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityChange);
}

/** 週期檢查連線狀態，補捉未觸發 close 的僵死連線 */
setInterval(function () {
    if (typeof document !== 'undefined' && (document.hidden || document.visibilityState === 'hidden')) {
        return;
    }
    if (!ros.isConnected) {
        reconnectRos('periodic-check');
        return;
    }
    var socket = ros.socket;
    if (socket && (socket.readyState === WebSocket.CLOSING || socket.readyState === WebSocket.CLOSED)) {
        console.warn('[WebRos] 偵測到 socket 已關閉但 isConnected 仍為 true，觸發重連');
        ros.isConnected = false;
        reconnectRos('stale-socket');
    }
}, CONNECTION_CHECK_INTERVAL_MS);

var lastInput = Date.now();
/**直線速度 */
export var linear_speed = 0.0
/**角速度 */
export var angular_speed = 0.0

var _ls_delta = 0.05;
var _as_delta = 0.05;

var _max_linear_speed = 0.8;
var _max_angular_speed = 0.5;

var _keyboardControlEnable = false;

var current_action = 'stop';

export function KeyboardControlEnable(enable) {
    if (SystemSettingsStore.getters.Settings?.WebKeyboardMoveControl) {
        _keyboardControlEnable = enable;
    }
}
export function Stop() {
    current_action = 'stop';
    linear_speed = 0.0
    angular_speed = 0.0
}

function checkInputInterval() {
    if (Date.now() - lastInput > 100) {
        lastInput = Date.now();
        return true;
    } else {
        return false;
    }
}


/**當前是否在執行曲線轉向動作 */
function isCurrentActionIsCurving() {
    const curingActions = ['forward_right', 'forward_left', 'backward_right', 'backward_left'];
    return curingActions.includes(current_action);
}

export function ResetSpeed() {
    linear_speed = 0.0;
    angular_speed = 0.0;
}

export function subscribeModuleInfoAndStore() {

    var module_info_listener = new ROSLIB.Topic({
        ros: ros,
        name: '/module_information',
        messageType: ros_version == 'ROS1' ? 'gpm_msgs/ModuleInformation' : 'gpm_msgs/msg/ModuleInformation',
        throttle_rate: 300,
        queue_length: 1,

    })
    module_info_listener.subscribe(function (module_info) {
        ROS_STORE.commit('update_module_info', module_info)
    })
}
export function AGVMoveUp() {

    if (isCurrentActionIsCurving()) {
        linear_speed = 0;
    }
    angular_speed = 0;
    if (!checkInputInterval())
        return;

    current_action = 'up';
    if (Math.abs(linear_speed) >= _max_linear_speed)
        return;
    linear_speed = linear_speed + 0.05;
    publishCmdVel({
        linear: {
            x: linear_speed,
            y: 0,
            z: 0,
        },
        angular: {
            x: 0,
            y: 0,
            z: 0,
        }
    })
}
export function AGVMoveDown() {

    if (isCurrentActionIsCurving()) {
        linear_speed = 0;
    }
    angular_speed = 0;
    if (!checkInputInterval())
        return;
    current_action = 'down';
    if (Math.abs(linear_speed) >= _max_linear_speed)
        return;
    linear_speed = linear_speed - 0.05;
    publishCmdVel({
        linear: {
            x: linear_speed,
            y: 0,
            z: 0,
        },
        angular: {
            x: 0,
            y: 0,
            z: 0,
        }
    })
}

export function AGVMoveRight() {

    if (isCurrentActionIsCurving()) {
        angular_speed = 0;
    }
    linear_speed = 0;
    if (!checkInputInterval())
        return;
    current_action = 'right';
    if (Math.abs(angular_speed) >= _max_angular_speed)
        return;
    angular_speed = angular_speed - 0.05;
    publishCmdVel({
        linear: {
            x: 0,
            y: 0,
            z: 0,
        },
        angular: {
            x: 0,
            y: 0,
            z: angular_speed,
        }
    })
}


export function AGVMoveLeft() {
    if (isCurrentActionIsCurving()) {
        angular_speed = 0;
    }
    linear_speed = 0;
    if (!checkInputInterval())
        return;
    current_action = 'left';
    if (Math.abs(angular_speed) >= _max_angular_speed)
        return;
    angular_speed = angular_speed + 0.05;
    publishCmdVel({
        linear: {
            x: 0,
            y: 0,
            z: 0,
        },
        angular: {
            x: 0,
            y: 0,
            z: angular_speed,
        }
    })
}
export function AGVMove_FordwardRight(linear, rotation) {

    current_action = 'forward_right';
    publishCmdVel({
        linear: {
            x: linear,
            y: 0,
            z: 0,
        },
        angular: {
            x: 0,
            y: 0,
            z: -rotation,
        }
    })
}

export function AGVMove_FordwardLeft(linear, rotation) {
    current_action = 'forward_left';
    publishCmdVel({
        linear: {
            x: linear,
            y: 0,
            z: 0,
        },
        angular: {
            x: 0,
            y: 0,
            z: rotation,
        }
    })
}


export function AGVMove_BackwardLeft(linear, rotation) {
    current_action = 'backward_left';
    publishCmdVel({
        linear: {
            x: -linear,
            y: 0,
            z: 0,
        },
        angular: {
            x: 0,
            y: 0,
            z: -rotation,
        }
    })
}


export function AGVMove_BackwardRight(linear, rotation) {
    current_action = 'backward_right';
    publishCmdVel({
        linear: {
            x: -linear,
            y: 0,
            z: 0,
        },
        angular: {
            x: 0,
            y: 0,
            z: rotation,
        }
    })
}

export function AGVMove_ShiftLeft() {

    angular_speed = 0;
    if (!checkInputInterval())
        return;
    current_action = 'shift_left';
    if (Math.abs(linear_speed) >= _max_linear_speed)
        return;
    linear_speed = linear_speed + 0.05;

    publishCmdVel({
        linear: {
            x: 0,
            y: linear_speed,
            z: 0,
        },
        angular: {
            x: 0,
            y: 0,
            z: 0,
        }
    })
}
export function AGVMove_ShiftRight() {

    angular_speed = 0;
    if (!checkInputInterval())
        return;
    current_action = 'shift_right';
    if (Math.abs(linear_speed) >= _max_linear_speed)
        return;
    linear_speed = linear_speed - 0.05;

    publishCmdVel({
        linear: {
            x: 0,
            y: linear_speed,
            z: 0,
        },
        angular: {
            x: 0,
            y: 0,
            z: 0,
        }
    })
}

export function AGVStop() {
    current_action = 'stop';
    linear_speed = angular_speed = 0;
    publishCmdVel({
        linear: {
            x: 0,
            y: 0,
            z: 0,
        },
        angular: {
            x: 0,
            y: 0,
            z: 0,
        }
    })
}
document.addEventListener('keydown', (event) => {
    var name = event.key;
    var code = event.code;
    if (!_keyboardControlEnable)
        return;

    if (code == 'KeyW') {
        linear_speed += _ls_delta
    }
    if (code == 'KeyX') {
        linear_speed -= _ls_delta
    }
    if (code == 'KeyS' || code == 'Space') {
        linear_speed = 0.0
        angular_speed = 0.0
    }
    if (code == 'KeyD') {
        angular_speed += _as_delta
    }
    if (code == 'KeyA') {
        angular_speed -= _as_delta
    }
    // console.log('linear speed:' + linear_speed);
    // console.log('angular speed:' + angular_speed);
})
