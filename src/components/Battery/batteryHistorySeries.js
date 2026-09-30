const STATUS_COLOR = {
  1: '#ffc600',
  2: '#0d6efd',
  3: '#ff4a4a',
  4: '#1fff74',
  5: '#38bdf8',
  6: '#ff4a4a',
  7: '#f59e0b'
}

const UNKNOWN_COLOR = '#5e6a75'

const STATUS_LABEL = {
  1: '待機',
  2: '運行',
  3: '異常',
  4: '充電',
  5: '初始化',
  6: '警報',
  7: '警告'
}

export function statusColor(status) {
  return STATUS_COLOR[status] || UNKNOWN_COLOR
}

export function statusLabel(status) {
  return STATUS_LABEL[status] || '未知'
}

export function queryItemTitle(item) {
  const titles = {
    Level: '電量',
    Voltage: '電壓',
    Charge_current: '充電電流',
    Discharge_current: '放電電流'
  }
  return titles[item] || item
}

export function yAxisLabel(item) {
  if (item === 'Level')
    return '電量(%)'
  if (item === 'Voltage')
    return '電壓(V)'
  if (item === 'Charge_current' || item === 'Discharge_current')
    return `${queryItemTitle(item)}(A)`
  return queryItemTitle(item)
}

export function formatHistoryValue(item, value) {
  const number = Number(value)
  if (!Number.isFinite(number))
    return '—'
  if (item === 'Level')
    return `${number.toFixed(1)}%`
  if (item === 'Voltage')
    return `${number.toFixed(2)} V`
  return `${number.toFixed(2)} A`
}

export function formatHistoryTime(timeMs) {
  const date = new Date(timeMs)
  const pad = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export function yRange(item, min, max) {
  if (item === 'Level')
    return [0, 100]
  if (!Number.isFinite(min) || !Number.isFinite(max))
    return [0, 1]
  const span = max - min
  const pad = span === 0 ? Math.max(Math.abs(max) * 0.08, 0.5) : span * 0.08
  return [Math.min(0, min), max + pad]
}

// 後端字典鍵可能是 ISO 或 yyyy/MM/dd HH:mm:ss，避免在大量資料上使用 moment
export function parseRecordTime(text) {
  if (typeof text === 'number' && Number.isFinite(text))
    return text
  const parsed = Date.parse(text)
  if (!Number.isNaN(parsed))
    return parsed
  const matched = /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/.exec(String(text).trim())
  if (!matched)
    return NaN
  return new Date(
    Number(matched[1]),
    Number(matched[2]) - 1,
    Number(matched[3]),
    Number(matched[4] || 0),
    Number(matched[5] || 0),
    Number(matched[6] || 0)
  ).getTime()
}

function yieldToMain() {
  if (typeof scheduler !== 'undefined' && typeof scheduler.yield === 'function')
    return scheduler.yield()
  return new Promise((resolve) => {
    setTimeout(resolve, 0)
  })
}

// 轉成 TypedArray，不進入 Vue 響應式。同一時間戳只留最後一筆，並保證時間遞增。
export async function buildHistorySamples(records, yieldEvery = 8000) {
  const keys = records ? Object.keys(records) : []
  const capacity = keys.length
  const times = new Float64Array(capacity)
  const values = new Float64Array(capacity)
  const statuses = new Uint8Array(capacity)
  let write = 0
  let previous = -Infinity
  let ordered = true

  for (let index = 0; index < capacity; index++) {
    const point = records[keys[index]]
    const time = parseRecordTime(keys[index])
    const value = Number(point?.value)
    if (!Number.isFinite(time) || !Number.isFinite(value))
      continue
    if (write > 0 && time < previous)
      ordered = false
    if (write > 0 && time === previous) {
      values[write - 1] = value
      statuses[write - 1] = Number(point?.status) || 0
      continue
    }
    times[write] = time
    values[write] = value
    statuses[write] = Number(point?.status) || 0
    previous = time
    write += 1
    if (yieldEvery > 0 && index > 0 && index % yieldEvery === 0)
      await yieldToMain()
  }

  let usedTimes = times.subarray(0, write)
  let usedValues = values.subarray(0, write)
  let usedStatuses = statuses.subarray(0, write)
  if (!ordered && write > 1) {
    const sorted = sortSamples(usedTimes, usedValues, usedStatuses)
    usedTimes = sorted.times
    usedValues = sorted.values
    usedStatuses = sorted.statuses
  }

  return {
    count: usedTimes.length,
    times: usedTimes,
    values: usedValues,
    statuses: usedStatuses
  }
}

function sortSamples(times, values, statuses) {
  const count = times.length
  const order = Array.from({ length: count }, (_, index) => index)
  order.sort((left, right) => times[left] - times[right])
  const sortedTimes = new Float64Array(count)
  const sortedValues = new Float64Array(count)
  const sortedStatuses = new Uint8Array(count)
  let write = 0
  for (let index = 0; index < count; index++) {
    const source = order[index]
    if (write > 0 && sortedTimes[write - 1] === times[source]) {
      sortedValues[write - 1] = values[source]
      sortedStatuses[write - 1] = statuses[source]
      continue
    }
    sortedTimes[write] = times[source]
    sortedValues[write] = values[source]
    sortedStatuses[write] = statuses[source]
    write += 1
  }
  return {
    times: sortedTimes.subarray(0, write),
    values: sortedValues.subarray(0, write),
    statuses: sortedStatuses.subarray(0, write)
  }
}

function lowerBound(times, target) {
  let low = 0
  let high = times.length
  while (low < high) {
    const mid = (low + high) >> 1
    if (times[mid] < target)
      low = mid + 1
    else
      high = mid
  }
  return low
}

function upperBound(times, target) {
  let low = 0
  let high = times.length
  while (low < high) {
    const mid = (low + high) >> 1
    if (times[mid] <= target)
      low = mid + 1
    else
      high = mid
  }
  return low
}

// 點比像素多時，降取樣查詢畫成該欄高低區間；原始資料仍從 0 畫長條，高度取該欄最大值。
export function drawStatusColumns(ctx, samples, layout) {
  const { times, values, statuses, count } = samples
  if (!count)
    return 0
  const { left, top, width, height, xMin, xMax, yMin, yMax } = layout
  if (!(width > 0) || !(height > 0) || !(xMax > xMin))
    return 0

  const start = lowerBound(times, xMin)
  const end = upperBound(times, xMax)
  if (start >= end)
    return 0

  const ySpan = (yMax - yMin) || 1
  const xSpan = xMax - xMin
  const toY = (value) => top + height - ((value - yMin) / ySpan) * height
  const visible = end - start
  const asBars = layout.asBars === true
  const zeroY = Math.max(top, Math.min(top + height, toY(0)))

  ctx.save()
  ctx.beginPath()
  ctx.rect(left, top, width, height)
  ctx.clip()

  let drawn = 0
  if (visible <= width * 1.2) {
    const barWidth = Math.min(8, Math.max(1, (width / visible) * 0.72))
    for (let index = start; index < end; index++) {
      const x = left + ((times[index] - xMin) / xSpan) * width
      const y = toY(values[index])
      ctx.fillStyle = statusColor(statuses[index])
      const yTop = Math.min(y, zeroY)
      ctx.fillRect(x - barWidth / 2, yTop, barWidth, Math.max(1, Math.abs(zeroY - y)))
      drawn += 1
    }
  }
  else if (asBars) {
    const pixelCount = Math.max(1, Math.floor(width))
    const maxValue = new Float64Array(pixelCount)
    const columnStatus = new Uint8Array(pixelCount)
    const seen = new Uint8Array(pixelCount)
    for (let index = start; index < end; index++) {
      const raw = ((times[index] - xMin) / xSpan) * width
      if (raw < 0 || raw >= width)
        continue
      const pixel = raw | 0
      const value = values[index]
      if (!seen[pixel] || value >= maxValue[pixel]) {
        seen[pixel] = 1
        maxValue[pixel] = value
        columnStatus[pixel] = statuses[index]
      }
    }
    for (let pixel = 0; pixel < pixelCount; pixel++) {
      if (!seen[pixel])
        continue
      const y = toY(maxValue[pixel])
      ctx.fillStyle = statusColor(columnStatus[pixel])
      const yTop = Math.min(y, zeroY)
      ctx.fillRect(left + pixel, yTop, 1, Math.max(1, Math.abs(zeroY - y)))
      drawn += 1
    }
  }
  else {
    const pixelCount = Math.max(1, Math.floor(width))
    const minValue = new Float64Array(pixelCount)
    const maxValue = new Float64Array(pixelCount)
    const columnStatus = new Uint8Array(pixelCount)
    const seen = new Uint8Array(pixelCount)
    for (let index = start; index < end; index++) {
      const raw = ((times[index] - xMin) / xSpan) * width
      if (raw < 0 || raw >= width)
        continue
      const pixel = raw | 0
      const value = values[index]
      if (!seen[pixel]) {
        seen[pixel] = 1
        minValue[pixel] = value
        maxValue[pixel] = value
      }
      else {
        if (value < minValue[pixel])
          minValue[pixel] = value
        if (value > maxValue[pixel])
          maxValue[pixel] = value
      }
      columnStatus[pixel] = statuses[index]
    }
    for (let pixel = 0; pixel < pixelCount; pixel++) {
      if (!seen[pixel])
        continue
      const yTop = toY(maxValue[pixel])
      const yBottom = toY(minValue[pixel])
      ctx.fillStyle = statusColor(columnStatus[pixel])
      ctx.fillRect(left + pixel, yTop, 1, Math.max(2, yBottom - yTop))
      drawn += 1
    }
  }

  ctx.restore()
  return drawn
}
