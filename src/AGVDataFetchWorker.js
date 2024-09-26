import { AGVStatusStore, DIOStore, RDTestDataStore, UIStore } from "./store";
import { ROS_STORE } from "./store/ros_store";
import param from "./gpm_param";
import MapAPI from './api/MapAPI'
import bus from "./event-bus";
import { ElNotification, ElLoading } from "element-plus";
import { subscribeModuleInfoAndStore } from './api/WebRos'
import * as signalR from "@microsoft/signalr";

// ElLoading.service({
//     lock: true,
//     text: 'Loading',
//     background: 'rgba(0, 0, 0, 0.7)',
// })
console.log('Fetch Worker Start');
const channel = new BroadcastChannel('vcs_data');
const rosDataChannel = new BroadcastChannel('ros_data');
let _hasData = true;
let _isLeader = false;
var HubConnection = null;

function Throttle(func, limit) {
    let inThrottle;
    return function () {
        const context = this, args = arguments;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}
function generateRandomUserID(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
var backend_ws_host = param.backend_host.replace('http', 'ws')
var user_id = generateRandomUserID(8);
var _isDisconnceted = false;



function StoreData(data) {
    try {
        var ConnectionData = data.ConnectionStatesVM;
        var VMSData = data.VMSStatesVM;
        var DIOTableData = data.DIOTableVM;
        var testData = data.RDTestData;

        if (VMSData)
            AGVStatusStore.commit('updateStatus', VMSData)
        if (ConnectionData)
            UIStore.commit("StoreConnectionState", ConnectionData);
        if (DIOTableData)
            DIOStore.commit('updateStatus', DIOTableData);
        if (testData)
            RDTestDataStore.commit('SetData', testData)
    } catch (error) {

    }

}

const throttledHandleBackendData = Throttle(function (event) {
    if (event.data != 'error' && event.data != 'closed') {
        if (_isDisconnceted) {
            location.reload();
        }
        let _data = event.data;
        StoreData(_data);
        var postData = {
            type: 'data',
            payload: _data
        }
        channel.postMessage(postData)
    } else {
        _isDisconnceted = true;
        bus.emit('ws_disconnect');
    }
}, 50);

function StartHubConnection() {
    HubConnection = new signalR.HubConnectionBuilder()
        .withUrl(`${param.backend_host}/FrontendHub`)
        .withAutomaticReconnect([0, 1000, 2000, 3000])
        .build();
    HubConnection.on('ReceiveData', (user, data) => {
        StoreData(data);
        var postData = {
            type: 'data',
            payload: data
        }
        channel.postMessage(postData)
    })
    HubConnection.on('AGV-Notify-Message', (obj) => {
        bus.emit('AGV-Notify-Message-Recieved', obj)
    })
    HubConnection.on('ManualCheckCargoStatus', (obj) => {
        bus.emit('ManualCheckCargoStatus', obj)
    })
    HubConnection.onreconnecting(() => {
        console.warn('reconnecting');
        bus.emit('hub-reconnecting');
    })
    HubConnection.onclose(() => {
        console.log('SignalR  Disconnect');
        bus.emit('ws_disconnect', undefined);
        setTimeout(() => {
            StartHubConnection();
        }, 1000);
    })
    try {
        HubConnection.start()
            .then(() => {
                console.info('SignalR Connected!');
                bus.emit('hub-connected');
            })
            .catch(er => {
                console.log('SignalR Connection Error');
                setTimeout(() => {
                    StartHubConnection();
                }, 10000);
            });
    } catch {
    }
}

function BecomeLeader() {
    if (_isLeader)
        return;

    var postData = {
        type: 'data',
        payload: {}
    }
    channel.postMessage(postData)
    channel.postMessage({
        type: 'heartbeat'
    })
    _isLeader = true;
    subscribeModuleInfoAndStore();
    StartHubConnection();
    console.log('As data brocaster');
    setInterval(() => {
        channel.postMessage({
            type: 'heartbeat'
        })
    }, 50);
    setInterval(() => {
        var dataPayload = ROS_STORE.getters.Module_Information;
        rosDataChannel.postMessage({
            type: 'data',
            payload: JSON.stringify(dataPayload)
        })
    }, 100);
    ElNotification.info({
        message: 'Start ROS and Backend Data Fetch',
        duration: 1000
    })
}

let lastHeartbeat = Date.now();
function checkLeaderAlive() {
    lastHeartbeat = Date.now();
    setInterval(() => {
        var interval = Date.now() - lastHeartbeat;
        if (interval > 700) {
            _hasData = false;
            setTimeout(() => {
                if (!_hasData)
                    BecomeLeader()
            }, 700);

        }
    }, 300);

}

export function Start() {

    setTimeout(() => {

        rosDataChannel.onmessage = (event) => {
            if (_isLeader)
                return;
            if (event.data.type == 'data') {
                var moduleInfoData = JSON.parse(event.data.payload)
                ROS_STORE.commit('update_module_info', moduleInfoData)
            }
        }

        lastHeartbeat = Date.now();
        channel.onmessage = (event) => {
            if (_isLeader)
                return;
            if (event.data.type == 'data') {
                lastHeartbeat = Date.now();
                _hasData = true;
                var _data = event.data.payload;
                StoreData(_data);
            } else if (event.data.type == 'heartbeat') {
                _hasData = true;
                lastHeartbeat = Date.now();
            }
        }
        checkLeaderAlive();

    }, 800);
    MapAPI.GetMapFromServer()
}


