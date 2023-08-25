var param = {
  get backend_host() {
    if (process.env.NODE_ENV == 'development') {
      return 'http://127.0.0.1:7025'
      return 'http://192.168.0.101:7025'
    } else {
      return `${window.location.protocol}//${window.location.host}`
    }
  },
}
export const version = '23.8.4.1'
export default param
