import WebSocketHelp from "./api/WebSocketHepler";
import { SystemMsgStore } from '@/store'
import bus from "./event-bus";
var ws = new WebSocketHelp('ws/Sys_Messages');
ws.Connect();
ws.onmessage = (ev) => {

    var sysmessage = JSON.parse(ev.data)
    bus.emit('system_msg_updated', sysmessage)
    //SystemMsgStore.dispatch('Update', sysmessage)
}

document.addEventListener('close', () => {
    alert(1213)
})