/** 主內容區分頁（TabContainer）語意化 page id */
export const MAIN_TAB = Object.freeze({
  STATUS: 'status',
  ALARM: 'alarm',
  OPERATION: 'operation',
  E84: 'e84',
  MAP: 'map',
  CST_READER: 'cst-reader',
  OVERVIEW: 'overview',
  LOG: 'log'
})

/** 操作區子分頁（AgvOperator）語意化 page id */
export const OPERATOR_TAB = Object.freeze({
  MOVE_CONTROL: 'move-control',
  FORK: 'fork',
  INPUT: 'input',
  OUTPUT: 'output',
  MANUAL: 'manual',
  SENSOR: 'sensor',
  SAFETY_PLC: 'safety-plc',
  WHEELS: 'wheels'
})

export const MAIN_TAB_STORAGE_KEY = 'main_content_tab_id'
export const OPERATOR_TAB_STORAGE_KEY = 'agv_operator_tab_id'

/** 舊版數字 index storage，啟動時可清除 */
export const LEGACY_MAIN_TAB_STORAGE_KEY = 'main_content_tab'
export const LEGACY_OPERATOR_TAB_STORAGE_KEY = 'agv_operator_tab'
export const LEGACY_OPERATOR_TAB_SCHEMA_KEY = 'agv_operator_tab_schema'

/**
 * 在當下可見的 tab id 列表中解析 index。
 * @param {string[]} visibleIds
 * @param {string} targetId
 * @param {number} [fallback=0]
 * @returns {number}
 */
export function resolveTabIndex(visibleIds, targetId, fallback = 0) {
  if (!Array.isArray(visibleIds) || visibleIds.length === 0) {
    return fallback
  }
  const index = visibleIds.indexOf(targetId)
  return index >= 0 ? index : fallback
}

/**
 * 由 index 反查 id；越界時回傳第一個可見 id。
 * @param {string[]} visibleIds
 * @param {number} index
 * @returns {string|undefined}
 */
export function resolveTabId(visibleIds, index) {
  if (!Array.isArray(visibleIds) || visibleIds.length === 0) {
    return undefined
  }
  if (index >= 0 && index < visibleIds.length) {
    return visibleIds[index]
  }
  return visibleIds[0]
}

export function loadStoredTabId(storageKey, defaultId) {
  try {
    const raw = localStorage.getItem(storageKey)
    if (raw == null || raw === '') {
      return defaultId
    }
    return raw
  } catch {
    return defaultId
  }
}

export function saveStoredTabId(storageKey, tabId) {
  try {
    localStorage.setItem(storageKey, String(tabId))
  } catch {
    // ignore quota / private mode
  }
}

export function clearLegacyTabStorage() {
  try {
    localStorage.removeItem(LEGACY_MAIN_TAB_STORAGE_KEY)
    localStorage.removeItem(LEGACY_OPERATOR_TAB_STORAGE_KEY)
    localStorage.removeItem(LEGACY_OPERATOR_TAB_SCHEMA_KEY)
  } catch {
    // ignore
  }
}
