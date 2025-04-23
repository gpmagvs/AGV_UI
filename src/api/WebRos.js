
import param from "@/gpm_param"
import ROSLIB from "roslib";
var ros = new ROSLIB.Ros({
    url: param.ros_bridge_url
})
import { SystemSettingsStore } from '@/store'
import { ROS_STORE } from "@/store/ros_store";
console.log('ros url:' + param.ros_bridge_url);

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

ros.on('connection', function () {
    console.log('ros bridge server connected!');
    linear_speed = 0.0
    angular_speed = 0.0

})
ros.on('error', function () {
    console.warn('ROS Connection not estimated');
})
var keyboard_move_topic = new ROSLIB.Topic({
    ros: ros,
    name: '/cmd_vel',
    messageType: 'geometry_msgs/Twist'
})

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
        messageType: 'gpm_msgs/ModuleInformation',
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
    keyboard_move_topic.publish(new ROSLIB.Message({
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
    }))
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
    keyboard_move_topic.publish(new ROSLIB.Message({
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
    }))
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
    keyboard_move_topic.publish(new ROSLIB.Message({
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
    }))
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
    keyboard_move_topic.publish(new ROSLIB.Message({
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
    }))
}
export function AGVMove_FordwardRight(linear, rotation) {

    current_action = 'forward_right';
    keyboard_move_topic.publish(new ROSLIB.Message({
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
    }))
}

export function AGVMove_FordwardLeft(linear, rotation) {
    current_action = 'forward_left';
    keyboard_move_topic.publish(new ROSLIB.Message({
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
    }))
}


export function AGVMove_BackwardLeft(linear, rotation) {
    current_action = 'backward_left';
    keyboard_move_topic.publish(new ROSLIB.Message({
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
    }))
}


export function AGVMove_BackwardRight(linear, rotation) {
    current_action = 'backward_right';
    keyboard_move_topic.publish(new ROSLIB.Message({
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
    }))
}

export function AGVMove_ShiftLeft() {

    angular_speed = 0;
    if (!checkInputInterval())
        return;
    current_action = 'shift_left';
    if (Math.abs(linear_speed) >= _max_linear_speed)
        return;
    linear_speed = linear_speed + 0.05;

    keyboard_move_topic.publish(new ROSLIB.Message({
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
    }))
}
export function AGVMove_ShiftRight() {

    angular_speed = 0;
    if (!checkInputInterval())
        return;
    current_action = 'shift_right';
    if (Math.abs(linear_speed) >= _max_linear_speed)
        return;
    linear_speed = linear_speed - 0.05;

    keyboard_move_topic.publish(new ROSLIB.Message({
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
    }))
}

export function AGVStop() {
    current_action = 'stop';
    linear_speed = angular_speed = 0;
    keyboard_move_topic.publish(new ROSLIB.Message({
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
    }))
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
