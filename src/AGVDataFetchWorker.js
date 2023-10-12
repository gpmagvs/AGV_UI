import { AGVStatusStore, DIOStore, RDTestDataStore } from "./store";
import WebSocketHelp from "./api/WebSocketHepler";
import param from "./gpm_param";
import bus from '@/event-bus.js'
var agv_status_ws = new WebSocketHelp('/ws/AGVCState')
var agv_dio_ws = new WebSocketHelp('ws/DIOTableData')
var rd_test_ws = new WebSocketHelp('ws/RDTestData')

var previous_vms_data_json = ''
var previous_DIOTableData_json = ''



function DIOWS() {
    previous_DIOTableData_json = '';
    agv_dio_ws.Connect();
    agv_dio_ws.onmessage = (evt) => {
        if (evt.data != previous_DIOTableData_json) {
            var DIOTableData = JSON.parse(evt.data)
            previous_DIOTableData_json = evt.data;
            DIOStore.commit('updateStatus', DIOTableData)
        }

    }
}

function RDTESTWS() {

    rd_test_ws.Connect();
    rd_test_ws.onmessage = (evt) => {
        var testData = JSON.parse(evt.data)
        RDTestDataStore.commit('SetData', testData)
    }
}

var StateWsOnmessageHandler = (evt) => {
    agv_status_ws.connected = true;
    if (evt.data != previous_vms_data_json) {
        var VMSData = JSON.parse(evt.data);
        previous_vms_data_json = evt.data;
        AGVStatusStore.commit('updateStatus', VMSData)
    }
}

agv_status_ws.Connect();
agv_status_ws.onclose = () => {
    console.log('vms ws disconnected...')
    bus.emit('ws_disconnect');
    agv_status_ws.connected = false;

    var interval_ = setInterval(() => {
        if (!agv_status_ws.connected) {
            agv_status_ws.Connect();
            agv_status_ws.onmessage = StateWsOnmessageHandler
        }
        else {
            clearInterval(interval_);
            setTimeout(() => {
                location.reload();
            }, 500);
        }
    }, 1000);
}
agv_status_ws.onmessage = StateWsOnmessageHandler


DIOWS();
RDTESTWS();