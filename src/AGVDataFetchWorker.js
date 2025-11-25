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

// 记录上次页面隐藏日志的时间戳
var lastHiddenLogTime = 0;
var HIDDEN_LOG_INTERVAL = 3000;

// 页面隐藏状态管理
var pageHiddenStartTime = null; // 頁面隱藏開始時間
var hiddenCheckTimer = null; // 檢查隱藏時間的定時器
var HIDDEN_DISCONNECT_DELAY = 10000; // 10秒
var isDisconnectedByHidden = false; // 標記是否因隱藏而斷開連接

// 檢測頁面是否處於隱藏狀態
function isPageHidden() {
    if (typeof document === 'undefined') {
        return false; // 在非瀏覽器環境中，假設頁面可見
    }
    return document.hidden || document.visibilityState === 'hidden';
}

// 記錄頁面隱藏狀態的日誌（間隔需大於3秒）
function logPageHiddenIfNeeded() {
    if (isPageHidden()) {
        var now = Date.now();
        if (now - lastHiddenLogTime > HIDDEN_LOG_INTERVAL) {
            console.log('[AGVDataFetchWorker] 頁面處於隱藏狀態，已跳過數據存儲和事件發送');
            lastHiddenLogTime = now;
        }
    }
}

// 銷毀連接
function destroyConnection() {
    if (HubConnection) {
        try {
            isDisconnectedByHidden = true;
            HubConnection.stop().then(() => {
                console.log('[AGVDataFetchWorker] 因頁面隱藏超過10秒，已斷開連接');
                HubConnection = null;
            }).catch(err => {
                console.error('[AGVDataFetchWorker] 斷開連接時出錯:', err);
                HubConnection = null;
            });
        } catch (error) {
            console.error('[AGVDataFetchWorker] 銷毀連接時出錯:', error);
            HubConnection = null;
        }
    }
}

// 處理頁面可見性變化
function handleVisibilityChange() {
    if (isPageHidden()) {
        // 頁面隱藏
        pageHiddenStartTime = Date.now();
        console.log('[AGVDataFetchWorker] 頁面已隱藏，將在10秒後斷開連接');

        // 清除之前的定时器
        if (hiddenCheckTimer) {
            clearTimeout(hiddenCheckTimer);
        }

        // 設置定時器，10秒後斷開連接
        hiddenCheckTimer = setTimeout(() => {
            if (isPageHidden() && HubConnection) {
                destroyConnection();
            }
        }, HIDDEN_DISCONNECT_DELAY);
    } else {
        // 頁面顯示
        if (pageHiddenStartTime !== null) {
            var hiddenDuration = Date.now() - pageHiddenStartTime;
            console.log(`[AGVDataFetchWorker] 頁面已重新顯示（隱藏時長: ${Math.round(hiddenDuration / 1000)}秒）`);
            pageHiddenStartTime = null;
        }

        // 清除定時器
        if (hiddenCheckTimer) {
            clearTimeout(hiddenCheckTimer);
            hiddenCheckTimer = null;
        }

        // 如果連接因隱藏而斷開，重新建立連接
        if (isDisconnectedByHidden && !HubConnection) {
            console.log('[AGVDataFetchWorker] 重新建立連接...');
            isDisconnectedByHidden = false;
            StartHubConnection();
        }
    }
}

// 封裝的 bus.emit 方法，頁面隱藏時不執行
function safeEmit(event, ...args) {
    if (!isPageHidden()) {
        bus.emit(event, ...args);
    } else {
        logPageHiddenIfNeeded();
    }
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
var user_id = generateRandomUserID(8);

function StoreData(data) {
    // 頁面隱藏時不執行數據存儲
    if (isPageHidden()) {
        logPageHiddenIfNeeded();
        return;
    }
    try {
        var ConnectionData = data.ConnectionStatesVM;
        var VMSData = data.VMSStatesVM;
        var testData = data.RDTestData;

        if (VMSData)
            AGVStatusStore.commit('updateStatus', VMSData)
        if (ConnectionData)
            UIStore.commit("StoreConnectionState", ConnectionData);
        if (testData)
            RDTestDataStore.commit('SetData', testData)
    } catch (error) {

    }

}
function StoreDIOData(DIOTableData) {
    // 頁面隱藏時不執行數據存儲
    if (isPageHidden()) {
        logPageHiddenIfNeeded();
        return;
    }
    try {
        DIOStore.commit('updateStatus', DIOTableData);
    } catch (error) {
        console.error(error);
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

    HubConnection.on('DIOStatus', (DIOTableData) => {
        StoreDIOData(DIOTableData);
    })
    HubConnection.on('ModuleInformation', moduleInformation => {
        ROS_STORE.commit('update_module_info', moduleInformation)
    })
    HubConnection.on('VehicleError', message => {
        safeEmit('VehicleError', message)
    })
    HubConnection.on('DiskUsageError', message => {
        safeEmit('DiskUsageError', message)
    })
    HubConnection.on('AGV-Notify-Message', (obj) => {
        safeEmit('AGV-Notify-Message-Recieved', obj)
    })
    HubConnection.on('close-notify-dialog', (code) => {
        safeEmit('close-notify-dialog', code)

    })
    HubConnection.on('BackendExceptionMessage', (obj = { message: '', stacktrace: '' }) => {
        safeEmit('BackendExceptionMessage', obj)
    })
    HubConnection.on('DebugMessage', (message) => {
        safeEmit('DebugMessage', message)
    })
    HubConnection.on('ManualCheckCargoStatus', (obj) => {
        safeEmit('ManualCheckCargoStatus', obj)
    })
    HubConnection.on('ParameterChanged', (param) => {
        SystemSettingsStore.commit('setSettings', param)
        safeEmit('ParameterChanged', param)
    })
    HubConnection.on('ReChargeCircuitChanged', (isOpened) => {
        safeEmit('ReChargeCircuitChanged', isOpened)
    })
    HubConnection.on('CargoStatus', obj => {
        safeEmit('CargoStatusChanged', obj)
    })
    HubConnection.on('DiskStatus', obj => {
        SystemMsgStore.dispatch('UpdateDiskStatus', obj)
    })
    //CheckCargoStatus
    HubConnection.on('CheckCargoStatus', tag => {
        safeEmit('CheckCargoStatusWhenUnloadFail', tag);
    })

    HubConnection.on('CurrentRobotSpeedCommand', cmdStr => {
        AGVStatusStore.commit('setCurrentRobotSpeedCommand', cmdStr)
    })

    HubConnection.onreconnecting(() => {
        console.warn('reconnecting');
        safeEmit('hub-reconnecting');
    })

    HubConnection.on('maintain-mode-status', data => {
        AGVStatusStore.commit('setMaintainModeStatus', data)
    })

    HubConnection.onclose(() => {
        console.log('SignalR  Disconnect');
        safeEmit('ws_disconnect', undefined);
        // 如果不是因隱藏而斷開，則自動重連
        if (!isDisconnectedByHidden) {
            setTimeout(() => {
                StartHubConnection();
            }, 1000);
        }
    })
    try {
        HubConnection.start()
            .then(() => {
                console.info('SignalR Connected!');
                isDisconnectedByHidden = false; // 重置標誌
                safeEmit('hub-connected');
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
    MapAPI.GetMapFromServer();

    // 監聽頁面可見性變化
    if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', handleVisibilityChange);
    }
}


