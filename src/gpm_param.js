var param = {
  /**後端Server URL */
  get backend_host() {
    if (process.env.NODE_ENV == 'development') {
      return 'http://10.22.141.219:7025'
      return 'http://127.0.0.1:7025'
      return 'http://192.168.0.102:7025'
      return 'http://192.168.0.200:7000'
    } else {
      return `${window.location.protocol}//${window.location.host}`
    }
  },
  /**ROS Bridge Server Weboscket URL */
  get ros_bridge_url() {
    if (process.env.NODE_ENV == 'development') {
      return 'ws://192.168.235.130:9090'
      return 'ws://127.0.0.1:7025'
      return 'ws://10.22.141.219:9090'
      return 'ws://192.168.0.102:9090'
    } else {
      return `ws://${window.location.hostname}:9090`
    }
  }
}
export default param
