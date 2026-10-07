import axios from 'axios'
import param from '@/gpm_param'

/**
 * 車控提示訊息管理 API（GPMVehicleControlSystem NotificationController）。
 * 回傳欄位與後端序列化完全一致（PascalCase）：
 * NotificationMessage = { MsgID, Title, Message, Source, ReceivedTime, IsRead, ReadTime }
 *
 * 使用獨立 axios（不掛全域錯誤提示），避免重連補拉時跳出錯誤訊息。
 */
const http = axios.create({
  baseURL: param.backend_host,
  timeout: 8000
})

export const NotificationAPI = {
  /**
   * 取得訊息清單（新到舊）
   * @param {boolean} unreadOnly
   * @returns {Promise<{Items:Array, UnreadCount:number, Capacity:number}>}
   */
  async List(unreadOnly = false) {
    const ret = await http.get('api/Notification/List', { params: { unreadOnly } })
    return ret.data
  },
  /**
   * 將指定訊息標為已讀
   * @param {string} msgID
   */
  async Read(msgID) {
    const ret = await http.post('api/Notification/Read', null, { params: { msgID } })
    return ret.data
  },
  /** 全部標為已讀，回傳 { Count } */
  async ReadAll() {
    const ret = await http.post('api/Notification/ReadAll')
    return ret.data
  },
  /** 刪除全部訊息，回傳 { Count } */
  async Clear() {
    const ret = await http.post('api/Notification/Clear')
    return ret.data
  }
}

export default NotificationAPI
