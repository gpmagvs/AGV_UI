var param = {
  get backend_host() {
    if (process.env.NODE_ENV == 'development') {
      return 'http://10.22.141.219:7025'
      return 'http://127.0.0.1:7025'
      return 'http://192.168.0.101:7025'
    } else {
      return `${window.location.protocol}//${window.location.host}`
    }
  },
  get ros_bridge_url() {
    if (process.env.NODE_ENV == 'development') {
      return 'ws://10.22.141.219:9090'
      return 'ws://127.0.0.1:7025'
      return 'ws://192.168.0.101:9090'
    } else {
      return `ws://${window.location.hostname}:9090`
    }
  }
}
export const version = 'U.23.9.19.1'
export default param
