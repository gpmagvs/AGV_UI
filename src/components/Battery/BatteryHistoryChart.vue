<template>
  <div class="history-chart">
    <div class="history-chart-meta">
      <strong>{{ title }}</strong>
      <span>{{ hint }}</span>
    </div>
    <div class="history-chart-stage" ref="stage">
      <div ref="plotHost" class="history-chart-plot" v-once></div>
      <div v-show="overlayText" class="history-chart-empty">{{ overlayText }}</div>
      <div ref="tooltip" class="history-chart-tip">
        <div ref="tooltipTime"></div>
        <div ref="tooltipDetail"></div>
      </div>
    </div>
  </div>
</template>

<script>
import uPlot from 'uplot'
import 'uplot/dist/uPlot.min.css'
import {
  buildHistorySamples,
  drawStatusColumns,
  formatHistoryTime,
  formatHistoryValue,
  queryItemTitle,
  statusLabel,
  yAxisLabel,
  yRange
} from './batteryHistorySeries.js'

export default {
  data() {
    return {
      title: '電量',
      hint: '',
      overlayText: '請選擇條件後查詢'
    }
  },
  methods: {
    showMessage(text) {
      this.overlayText = text
      this.hint = ''
      this._samples = null
      this.hideTooltip()
      this.destroyPlot()
    },
    async renderRecords(records, item, downsample = true) {
      this.itemKey = item
      this._drawAsBars = downsample === false
      this.title = queryItemTitle(item)
      this.overlayText = '整理圖表資料…'
      this.hint = ''
      this.hideTooltip()
      const samples = await buildHistorySamples(records)
      if (!samples.count) {
        this.showMessage('此區間沒有電池紀錄')
        return
      }
      this._samples = samples
      this.overlayText = ''
      this.hint = `共 ${samples.count.toLocaleString('zh-TW')} 筆 · 滾輪縮放 · 拖曳平移 · 雙擊還原`
      this.mountPlot()
    },
    mountPlot() {
      const host = this.$refs.plotHost
      const samples = this._samples
      if (!host || !samples?.count)
        return
      this.destroyPlot()
      const width = Math.max(320, host.clientWidth || host.parentElement?.clientWidth || 640)
      const height = Math.max(240, host.clientHeight || 360)
      const item = this.itemKey
      const plot = new uPlot({
        width,
        height,
        ms: 1,
        padding: [8, 16, 0, 0],
        legend: { show: false },
        cursor: {
          drag: { x: false, y: false, setScale: false },
          points: { show: false }
        },
        select: { show: false, left: 0, top: 0, width: 0, height: 0 },
        scales: {
          x: {
            time: true,
            range: (_plot, min, max) => max > min ? [min, max] : [min - 60000, max + 60000]
          },
          y: {
            range: (_plot, min, max) => yRange(item, min, max)
          }
        },
        axes: [
          {
            stroke: '#64748b',
            grid: { stroke: '#e5e7eb', width: 1 },
            ticks: { stroke: '#cbd5e1', width: 1 }
          },
          {
            label: yAxisLabel(item),
            labelSize: 16,
            size: 64,
            stroke: '#64748b',
            grid: { stroke: '#e5e7eb', width: 1 },
            ticks: { stroke: '#cbd5e1', width: 1 }
          }
        ],
        series: [
          {},
          {
            label: queryItemTitle(item),
            stroke: 'transparent',
            width: 0,
            points: { show: false },
            paths: () => null
          }
        ],
        hooks: {
          drawClear: [(chart) => this.drawColumns(chart)],
          setCursor: [(chart) => this.showTooltip(chart)]
        },
        plugins: [this.interactionPlugin()]
      }, [samples.times, samples.values], host)
      this._plot = plot
      this.observeSize()
    },
    drawColumns(chart) {
      const samples = this._samples
      if (!samples?.count)
        return
      const xScale = chart.scales.x
      const yScale = chart.scales.y
      drawStatusColumns(chart.ctx, samples, {
        left: chart.bbox.left,
        top: chart.bbox.top,
        width: chart.bbox.width,
        height: chart.bbox.height,
        xMin: xScale.min,
        xMax: xScale.max,
        asBars: this._drawAsBars === true,
        yMin: yScale.min,
        yMax: yScale.max
      })
    },
    showTooltip(chart) {
      const tip = this.$refs.tooltip
      const samples = this._samples
      const index = chart.cursor.idx
      if (!tip || !samples || index == null || index < 0 || index >= samples.count) {
        this.hideTooltip()
        return
      }
      this.$refs.tooltipTime.textContent = formatHistoryTime(samples.times[index])
      this.$refs.tooltipDetail.textContent = `${formatHistoryValue(this.itemKey, samples.values[index])} · ${statusLabel(samples.statuses[index])}`
      const left = chart.cursor.left || 0
      const top = chart.cursor.top || 0
      const flip = left > chart.bbox.width * 0.62
      const x = (chart.bbox.left || 0) + left + (flip ? -12 : 14)
      const y = Math.max(8, (chart.bbox.top || 0) + top - 36)
      tip.style.visibility = 'visible'
      tip.style.transform = `translate(${x}px, ${y}px)${flip ? ' translateX(-100%)' : ''}`
    },
    hideTooltip() {
      if (this.$refs.tooltip)
        this.$refs.tooltip.style.visibility = 'hidden'
    },
    interactionPlugin() {
      return {
        hooks: {
          ready: (chart) => {
            const over = chart.over
            over.addEventListener('wheel', (event) => this.onWheel(chart, event), { passive: false })
            over.addEventListener('pointerdown', (event) => this.onPointerDown(chart, event))
            over.addEventListener('dblclick', (event) => {
              event.preventDefault()
              this.resetScale(chart)
            })
          },
          destroy: () => {
            if (this._panFrame) {
              cancelAnimationFrame(this._panFrame)
              this._panFrame = 0
            }
          }
        }
      }
    },
    onWheel(chart, event) {
      event.preventDefault()
      const samples = this._samples
      if (!samples?.count)
        return
      const rect = chart.over.getBoundingClientRect()
      const xValue = chart.posToVal(event.clientX - rect.left, 'x')
      const scale = chart.scales.x
      const span = scale.max - scale.min
      if (!(span > 0) || !Number.isFinite(xValue))
        return
      const zoom = event.deltaY < 0 ? 0.75 : 1 / 0.75
      const ratio = (xValue - scale.min) / span
      this.applyXScale(chart, xValue - ratio * span * zoom, xValue + (1 - ratio) * span * zoom)
    },
    onPointerDown(chart, event) {
      if (event.button !== 0 || !this._samples?.count)
        return
      chart.over.setPointerCapture(event.pointerId)
      const startX = event.clientX
      const startMin = chart.scales.x.min
      const startMax = chart.scales.x.max
      const move = (moveEvent) => {
        const deltaPx = moveEvent.clientX - startX
        const span = startMax - startMin
        const delta = deltaPx * (span / Math.max(1, chart.bbox.width))
        if (this._panFrame)
          cancelAnimationFrame(this._panFrame)
        this._panFrame = requestAnimationFrame(() => {
          this._panFrame = 0
          this.applyXScale(chart, startMin - delta, startMax - delta)
        })
      }
      const up = () => {
        chart.over.removeEventListener('pointermove', move)
        chart.over.removeEventListener('pointerup', up)
        chart.over.removeEventListener('pointercancel', up)
      }
      chart.over.addEventListener('pointermove', move)
      chart.over.addEventListener('pointerup', up)
      chart.over.addEventListener('pointercancel', up)
    },
    applyXScale(chart, min, max) {
      const samples = this._samples
      if (!samples?.count)
        return
      const fullMin = samples.times[0]
      const fullMax = samples.times[samples.count - 1]
      const span = Math.max(1000, max - min)
      let nextMin = min
      let nextMax = min + span
      if (nextMin < fullMin) {
        nextMin = fullMin
        nextMax = Math.min(fullMax, nextMin + span)
      }
      if (nextMax > fullMax) {
        nextMax = fullMax
        nextMin = Math.max(fullMin, nextMax - span)
      }
      if (nextMax <= nextMin)
        return
      chart.setScale('x', { min: nextMin, max: nextMax })
    },
    resetScale(chart) {
      const samples = this._samples
      if (!samples?.count)
        return
      chart.setScale('x', {
        min: samples.times[0],
        max: samples.times[samples.count - 1]
      })
    },
    observeSize() {
      if (this._resizeObserver || !this.$refs.stage)
        return
      this._resizeObserver = new ResizeObserver(() => {
        if (this._resizeFrame)
          cancelAnimationFrame(this._resizeFrame)
        this._resizeFrame = requestAnimationFrame(() => {
          this._resizeFrame = 0
          this.resizePlot()
        })
      })
      this._resizeObserver.observe(this.$refs.stage)
    },
    resizePlot() {
      const plot = this._plot
      const host = this.$refs.plotHost
      if (!plot || !host)
        return
      const width = host.clientWidth
      const height = host.clientHeight
      if (width < 10 || height < 10)
        return
      if (plot.width === width && plot.height === height)
        return
      plot.setSize({ width, height })
    },
    destroyPlot() {
      if (this._panFrame) {
        cancelAnimationFrame(this._panFrame)
        this._panFrame = 0
      }
      if (this._plot) {
        this._plot.destroy()
        this._plot = null
      }
    }
  },
  beforeUnmount() {
    if (this._resizeFrame)
      cancelAnimationFrame(this._resizeFrame)
    if (this._resizeObserver) {
      this._resizeObserver.disconnect()
      this._resizeObserver = null
    }
    this.destroyPlot()
  }
}
</script>

<style lang="scss" scoped>
.history-chart {
  display: flex;
  flex-direction: column;
  min-width: 0;
  color: #111827;
}

.history-chart-meta {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  min-height: 22px;
  padding: 4px 4px 6px;
  font-size: 13px;

  span {
    color: #64748b;
    font-size: 12px;
    text-align: right;
  }
}

.history-chart-stage {
  position: relative;
  height: 380px;
  min-height: 280px;
  contain: layout paint;
}

.history-chart-plot {
  width: 100%;
  height: 100%;
  touch-action: none;
  user-select: none;
}

.history-chart-plot :deep(.u-over) {
  cursor: grab;
}

.history-chart-empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  background: rgba(255, 255, 255, 0.86);
  pointer-events: none;
}

.history-chart-tip {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  padding: 6px 8px;
  border: 1px solid #d8dee6;
  border-radius: 6px;
  background: #ffffff;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
  color: #111827;
  font-size: 12px;
  line-height: 1.45;
  visibility: hidden;
  pointer-events: none;
  white-space: nowrap;
}
</style>
