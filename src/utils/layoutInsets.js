/**
 * 主頁底部 fixed footer 預留高度工具。
 * HomeView QuickActions 等 fixed-bottom 會蓋住內容，後續 UI 計算高度時應使用此方法。
 */

export const APP_BOTTOM_FOOTER_FALLBACK_PX = 38
export const APP_BOTTOM_GAP_PX = 8

/**
 * 量測畫面底部被 fixed footer 佔用的像素（含小間距）。
 * 會查詢 `.app-bottom-footer` / `.home-view-footer` / `.fixed-bottom`。
 * @returns {number}
 */
export function getAppBottomReservedPx() {
  const selectors = ['.app-bottom-footer', '.home-view-footer', '.fixed-bottom']
  let maxCovered = 0

  for (const selector of selectors) {
    const nodes = document.querySelectorAll(selector)
    nodes.forEach((node) => {
      const style = window.getComputedStyle(node)
      if (style.display === 'none' || style.visibility === 'hidden') return
      const rect = node.getBoundingClientRect()
      if (rect.height <= 0) return
      // 只計貼近視窗底部的固定列
      if (rect.bottom < window.innerHeight - 2) return
      const covered = Math.max(0, Math.ceil(window.innerHeight - rect.top))
      if (covered > maxCovered) maxCovered = covered
    })
  }

  if (maxCovered > 0) return maxCovered + APP_BOTTOM_GAP_PX

  const cssVar = getComputedStyle(document.documentElement)
    .getPropertyValue('--app-bottom-footer-height')
    .trim()
  const fromVar = Number.parseInt(cssVar, 10)
  if (Number.isFinite(fromVar) && fromVar > 0) {
    return fromVar + APP_BOTTOM_GAP_PX
  }

  return APP_BOTTOM_FOOTER_FALLBACK_PX + APP_BOTTOM_GAP_PX
}
