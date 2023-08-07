import axios from 'axios'
import param from '@/gpm_param'
var axios_entity = axios.create({
  baseURL: param.backend_host,
})

const MapAPI = {
  GetMapFromServer() {
    return axios_entity
      .get('api/map/GetMapFromServer')
      .then((ret) => {
        return ret.data
      })
      .catch((er) => {
        return undefined
      })
  },
  GetMapFromLocal() {
    return axios_entity
      .get('api/Map')
      .then((ret) => {
        return ret.data
      })
      .catch((err) => {
        return undefined
      })
  },
  GetMapTags() {
    return axios_entity
      .get('api/Map/Tags')
      .then((ret) => {
        return ret.data
      })
      .catch((err) => {
        return undefined
      })
  },
  SaveMap(_data) {
    return axios_entity
      .post('api/Map/SaveMap', _data)
      .then((ret) => {
        return true
      })
      .catch((err) => {
        return false
      })
  },
  ReloadMap() {
    return axios_entity
      .get('api/Map/ReloadMap')
      .then((ret) => {
        return ret.data
      })
      .catch((err) => {
        return undefined
      })
  },
  GetAGVList() {
    return axios_entity
      .get(`api/Map/AGVList`)
      .then((ret) => {
        return ret.data
      })
      .catch((err) => {
        return undefined
      })
  },
  PathPlanByTag(from, to) {
    return axios_entity
      .get(`api/Map/PathPlan?fromTag=${from}&toTag=${to}`)
      .then((ret) => {
        return ret.data
      })
      .catch((err) => {
        return undefined
      })
  },
  UploadCoordination(agv_name, tag, x, y, theta) {
    try {
      return axios_entity.get(`api/Map/UploadCoordination?AGVName=${agv_name}&tagNumber=${tag}&x=${x}&y=${y}&theta=${theta}`).
        then(ret => {
          return ret.data
        })
    } catch (error) {
      return false;
    }
  }
}

export default MapAPI
