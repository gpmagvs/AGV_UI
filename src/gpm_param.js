const DEFAULT_DEV_BACKEND_HOST = 'http://127.0.0.1:7025'

var param = {
  /**後端Server URL */
  get backend_host() {
    if (import.meta.env.DEV) {
      return import.meta.env.VITE_BACKEND_HOST || DEFAULT_DEV_BACKEND_HOST
    }
    return `${window.location.protocol}//${window.location.host}`
  },

  get OTA_Update_URL() {
    return this.backend_host.replace(/:\d+/, ':' + 7026 + '/api/ota');
  },
  /**ROS Bridge Server Weboscket URL */
  get ros_bridge_url() {
    var _backendHost = this.backend_host;
    //replace http to ws or https to wss , and change port to 9090
    const _rosBridgeHost = _backendHost.replace(/http:\/\//, 'ws://').replace(/https:\/\//, 'wss://').replace(/:\d+/, ':9090');
    return _rosBridgeHost;

  }
}

if (import.meta.env.DEV) {
  const envBackendHost = import.meta.env.VITE_BACKEND_HOST
  console.info('[gpm_param] 開發模式後端設定', {
    VITE_BACKEND_HOST: envBackendHost ?? '(未設定)',
    resolved_backend_host: param.backend_host,
    using_default: !envBackendHost,
    ros_bridge_url: param.ros_bridge_url,
    OTA_Update_URL: param.OTA_Update_URL,
    MODE: import.meta.env.MODE,
  })
}

export default param
