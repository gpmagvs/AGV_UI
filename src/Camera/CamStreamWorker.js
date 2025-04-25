// import param from "./gpm_param";
import * as signalR from "@microsoft/signalr";
const workerName = 'CamStreamWorker';
import { CamStore } from "@/store";
export function Connect() {
    let HubConnection = new signalR.HubConnectionBuilder()
        .withUrl(`http://192.168.0.105:5000/VideoStream`, {
            withCredentials: true
        })
        .withAutomaticReconnect([0, 1000, 2000, 3000])
        .build();

    HubConnection.on('H264Stream', data => {
        // console.log(data)
        CamStore.commit('setH264', data);
    })

    try {
        HubConnection.start().then(() => {
            console.info('HubConnection Connected!');
        }).catch(er => {
            console.log('SignalR Connection Error', er);
            setTimeout(() => {
                Connect();
            }, 10000);
        });
    } catch (error) {
        console.log(error);
    }
}
