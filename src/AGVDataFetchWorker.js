import { AGVStatusStore, DIOStore, RDTestDataStore, UIStore } from "./store";
import param from "./gpm_param";
import MapAPI from './api/MapAPI'


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

const throttledHandleBackendData = Throttle(function (event) {
    if (event.data != 'error' && event.data != 'closed') {
        var ConnectionData = event.data.ConnectionStatesVM;
        var VMSData = event.data.VMSStatesVM;
        var DIOTableData = event.data.DIOTableVM;
        var testData = event.data.RDTestData;
        UIStore.commit("StoreConnectionState", ConnectionData);
        AGVStatusStore.commit('updateStatus', VMSData)
        DIOStore.commit('updateStatus', DIOTableData);
        RDTestDataStore.commit('SetData', testData)

    }
}, 33);


const backend_websocket_worker = new Worker('/websocket_worker.js')
backend_websocket_worker.onmessage = (event) => throttledHandleBackendData(event)
backend_websocket_worker.postMessage({ command: 'connect', ws_url: backend_ws_host + `/ws?user_id=${user_id}` });


setTimeout(() => {
    MapAPI.GetMapFromServer()
}, 500);

