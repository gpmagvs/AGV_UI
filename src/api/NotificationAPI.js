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

/**
 * List 回應是否為新版後端的清單格式 { Items: [] }。
 * 舊版車控沒有此 API 時，UseVueRouterHistory 會回 200 + index.html（字串），不是 404。
 */
export function IsNotificationListResponse(data) {
  return !!data && typeof data === 'object' && !Array.isArray(data) && Array.isArray(data.Items)
}

/** 後端不支援 api/Notification（舊版車控）時拋出，store 會退回舊版字串推播模式 */
export class NotificationUnsupportedError extends Error {
  constructor(message, detail = {}) {
    super(message)
    this.name = 'NotificationUnsupportedError'
    this.unsupported = true
    this.status = detail.status
    this.contentType = detail.contentType
  }
}

export const NotificationAPI = {
  /**
   * 取得訊息清單（新到舊）
   * 回應不是 JSON 或不是 { Items: [] } 時拋出 NotificationUnsupportedError。
   * @param {boolean} unreadOnly
   * @returns {Promise<{Items:Array, UnreadCount:number, Capacity:number}>}
   */
  async List(unreadOnly = false) {
    const ret = await http.get('api/Notification/List', { params: { unreadOnly } })
    const contentType = String(ret?.headers?.['content-type'] ?? '')
    if (contentType && !contentType.toLowerCase().includes('json'))
      throw new NotificationUnsupportedError(`api/Notification/List 回應非 JSON（${contentType}）`, { status: ret?.status, contentType })
    if (!IsNotificationListResponse(ret?.data))
      throw new NotificationUnsupportedError('api/Notification/List 回應格式不符', { status: ret?.status, contentType })
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
