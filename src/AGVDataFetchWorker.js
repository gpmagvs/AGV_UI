import { AGVStatusStore, DIOStore, RDTestDataStore, UIStore, SystemSettingsStore, SystemMsgStore } from "./store";
import { ROS_STORE } from "./store/ros_store";
import param from "./gpm_param";
import MapAPI from './api/MapAPI'
import bus from "./event-bus";
import * as signalR from "@microsoft/signalr";
// ElLoading.service({
//     lock: true,
//     text: 'Loading',
//     background: 'rgba(0, 0, 0, 0.7)',
// })
var HubConnection = null;

function generateRandomUserID(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
var user_id = generateRandomUserID(8);

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
    HubConnection.on('ModuleInformation', moduleInformation => {
        ROS_STORE.commit('update_module_info', moduleInformation)
    })
    HubConnection.on('VehicleError', message => {
        bus.emit('VehicleError', message)
    })
    HubConnection.on('DiskUsageError', message => {
        bus.emit('DiskUsageError', message)
    })
    HubConnection.on('AGV-Notify-Message', (obj) => {
        bus.emit('AGV-Notify-Message-Recieved', obj)
    })
    HubConnection.on('close-notify-dialog', (code) => {
        bus.emit('close-notify-dialog', code)

    })
    HubConnection.on('DebugMessage', (message) => {
        bus.emit('DebugMessage', message)
    })
    HubConnection.on('ManualCheckCargoStatus', (obj) => {
        bus.emit('ManualCheckCargoStatus', obj)
    })
    HubConnection.on('ParameterChanged', (param) => {
        SystemSettingsStore.commit('setSettings', param)
        bus.emit('ParameterChanged', param)
    })
    HubConnection.on('ReChargeCircuitChanged', (isOpened) => {
        bus.emit('ReChargeCircuitChanged', isOpened)
    })
    HubConnection.on('CargoStatus', obj => {
        bus.emit('CargoStatusChanged', obj)
    })
    HubConnection.on('DiskStatus', obj => {
        SystemMsgStore.dispatch('UpdateDiskStatus', obj)
    })
    //CheckCargoStatus
    HubConnection.on('CheckCargoStatus', tag => {
        bus.emit('CheckCargoStatusWhenUnloadFail', tag);
    })

    HubConnection.on('CurrentRobotSpeedCommand', cmdStr => {
        AGVStatusStore.commit('setCurrentRobotSpeedCommand', cmdStr)
    })

    HubConnection.onreconnecting(() => {
        console.warn('reconnecting');
        bus.emit('hub-reconnecting');
    })

    HubConnection.on('maintain-mode-status', data => {
        AGVStatusStore.commit('setMaintainModeStatus', data)
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

export function Start() {
    StartHubConnection();
    MapAPI.GetMapFromServer()
}


