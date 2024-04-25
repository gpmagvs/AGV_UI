
let socket;
let _ws_url = 'ws://127.0.0.1:7025/ws/VMSStatus'
var auto_reconnect = true;
function initWebsocket(ws_url) {
    _ws_url = ws_url;
    socket = new WebSocket(ws_url)
    socket.onopen = () => {
        SendKeepAlive(socket);
    }
    socket.onmessage = (ev) => {
        var data_json = ev.data;
        self.postMessage(JSON.parse(data_json))

    }
    socket.onclose = (ev) => {
        if (auto_reconnect)
            TryReConnect();
    }
    socket.onerror = (ev) => {
        if (auto_reconnect)
            TryReConnect();
    }
}
function closeWebsocket(_auto_reconnec = false) {
    auto_reconnect = _auto_reconnec;
    if (socket)
        socket.close();
}
function handleMessage(message) {
}

var previous_data_json = ''

function SendKeepAlive(socket) {
    var timer = setInterval(() => {

        if (socket.readyState != 1) {
            clearInterval(timer);
            return;
        }
        console.log(socket.readyState);
        socket.send('ping');

    }, 1000);

}
function TryReConnect() {

    setTimeout(() => {
        var _socket = new WebSocket(_ws_url)

        _socket.onopen = (ev) => {
            SendKeepAlive(_socket)
            socket = _socket
            socket.onmessage = (ev) => {
                self.postMessage(JSON.parse(ev.data))
            }
        }
        _socket.onclose = (ev) => {
            self.postMessage('closed')
            TryReConnect()
        }
    }, 3000);

}
self.onmessage = function (event) {
    console.log(event);

    const data = event.data;
    if (data.command == 'connect') {
        initWebsocket(data.ws_url)
    }
    if (data.command == 'disconnect') {
        closeWebsocket(false)
    }
    if (data.command == 'disconnect') {
        socket.send('close');
        socket.close();
        console.log('websocket closed');
    }
}
