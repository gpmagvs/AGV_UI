var param = {
  /**後端Server URL */
  get backend_host() {
    if (import.meta.env.DEV) {
      return 'http://192.168.0.105:7025'
      return 'http://127.0.0.1:7025'
      return 'http://192.168.0.125:7025'
      return 'http://192.168.0.112:7025'
      return 'http://192.168.0.111:7025'
      return 'http://192.168.0.103:7025'
      return 'http://192.168.206.134:7025'
      return 'http://10.22.141.223:7025'
      return 'http://10.22.141.218:7025'
      return 'http://172.20.10.2:7025'
      return 'http://192.168.0.55:7025'
      return 'http://192.168.0.101:7025'
      return 'http://192.168.0.106:7025'
      return 'http://192.168.1.100:7025'
      return 'http://192.168.0.200:7000'
    } else {
      return `${window.location.protocol}//${window.location.host}`
    }
  },

  get OTA_Update_URL() {
    return this.backend_host.replace(/:\d+/, ':' + 7026 + '/api/ota');
  },
  /**ROS Bridge Server Weboscket URL */
  get ros_bridge_url() {
    if (import.meta.env.DEV) {
      return 'ws://192.168.0.126:9090'
      return 'ws://10.22.141.218:9090'
      return 'ws://192.168.76.128:9090'
      return 'ws://127.0.0.1:9090'
      return 'ws://192.168.1.100:9090'
      return 'ws://192.168.1.100:9090'
    } else {
      return `ws://${window.location.hostname}:9090`
    }
  }
}
export default param
