var param = {
  get backend_host() {
    if (process.env.NODE_ENV == 'development') {
      return 'http://127.0.0.1:7025'
      return 'http://192.168.0.102:7025'
      return 'http://10.22.141.218:7025'
    } else {
      return `${window.location.protocol}//${window.location.host}`
    }
  },
  get ros_bridge_url() {
    if (process.env.NODE_ENV == 'development') {
      return 'ws://192.168.0.102:9090'
      return 'ws://127.0.0.1:7025'
      return 'ws://10.22.141.218:7025'
    } else {
      return `ws://${window.location.hostname}:9090`
    }
  }
}
export const version = 'U.23.9.14.1'
export default param
