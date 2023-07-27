import { AGVStatusStore, DIOStore } from "./store";
import WebSocketHelp from "./api/WebSocketHepler";
import param from "./gpm_param";
var agv_status_ws = new WebSocketHelp('/ws/AGVCState')
var agv_dio_ws = new WebSocketHelp('ws/DIOTableData')

agv_status_ws.Connect();
agv_status_ws.onmessage = (evt) => {
    var VMSData = JSON.parse(evt.data);
    AGVStatusStore.commit('updateStatus', VMSData)
}


agv_dio_ws.Connect();
agv_dio_ws.onmessage = (evt) => {
    var DIOTableData = JSON.parse(evt.data)
    DIOStore.commit('updateStatus', DIOTableData)
}