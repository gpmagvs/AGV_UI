<template>
  <div class="wheels-angle-adjust">
    <div class="panel-grid">
      <!-- 俯瞰可視化 -->
      <div class="viz-card">
        <div class="viz-header">
          <div class="viz-title">
            <span class="viz-title-text">四輪姿態調整</span>
            <span class="viz-subtitle">TOP 俯瞰視角 · 顯示實際姿態</span>
          </div>
          <div class="manual-mode-switch">
            <span class="manual-mode-label">手動控制模式</span>
            <el-switch
              v-model="isManualControlEnabled"
              :loading="isManualModeSyncing"
              :before-change="beforeManualModeChange"
              inline-prompt
              active-text="開"
              inactive-text="關"
              inactive-color="#ef4444"
            />
          </div>
        </div>

        <div class="viz-surface" :class="{ 'is-manual-off': !isManualControlEnabled }">
          <div v-if="!isManualControlEnabled" class="manual-off-hint">手動控制模式已關閉</div>
          <svg
            class="viz-svg"
            :viewBox="layout.viewBox"
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="四輪姿態俯瞰圖"
          >
            <defs>
              <pattern id="wheelsDotGrid" width="18" height="18" patternUnits="userSpaceOnUse">
                <circle cx="1.5" cy="1.5" r="1.2" fill="rgba(100,116,139,0.22)" />
              </pattern>
              <marker id="frontArrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
                <path d="M1,1 L7,4 L1,7 Z" fill="#3b82f6" />
              </marker>
            </defs>

            <rect
              :x="layout.bg.x"
              :y="layout.bg.y"
              :width="layout.bg.w"
              :height="layout.bg.h"
              rx="10"
              class="schem-bg"
            />
            <rect
              :x="layout.bg.x"
              :y="layout.bg.y"
              :width="layout.bg.w"
              :height="layout.bg.h"
              rx="10"
              fill="url(#wheelsDotGrid)"
            />

            <g class="chassis">
              <rect
                :x="layout.chassis.x"
                :y="layout.chassis.y"
                :width="layout.chassis.w"
                :height="layout.chassis.h"
                :rx="layout.chassis.rx"
                class="chassis-body"
              />
              <rect
                :x="layout.chassis.x + 10"
                :y="layout.chassis.y + 14"
                :width="layout.chassis.w - 20"
                :height="layout.chassis.h - 28"
                :rx="layout.chassis.rx - 4"
                class="chassis-inner"
              />
              <g class="front-marker">
                <line
                  :x1="layout.centerX"
                  :y1="layout.chassis.y + 28"
                  :x2="layout.centerX"
                  :y2="layout.chassis.y + 8"
                  class="front-line"
                  marker-end="url(#frontArrow)"
                />
                <text :x="layout.centerX" :y="layout.chassis.y + 48" class="front-text">FRONT</text>
              </g>
              <line
                :x1="layout.centerX - 18"
                :y1="layout.centerY"
                :x2="layout.centerX + 18"
                :y2="layout.centerY"
                class="center-cross"
              />
              <line
                :x1="layout.centerX"
                :y1="layout.centerY - 18"
                :x2="layout.centerX"
                :y2="layout.centerY + 18"
                class="center-cross"
              />
            </g>

            <g
              v-for="wheel in wheels"
              :key="wheel.id"
              class="wheel-group"
              :class="{
                'is-selected': isManualControlEnabled && selectedWheelId === wheel.id,
                'is-disabled': !isManualControlEnabled,
              }"
              @click="handleWheelClick(wheel.id)"
            >
              <g :transform="wheelTransform(wheel)">
                <rect
                  :x="-layout.wheel.w / 2"
                  :y="-layout.wheel.h / 2"
                  :width="layout.wheel.w"
                  :height="layout.wheel.h"
                  :rx="layout.wheel.rx"
                  class="wheel-body"
                />
                <circle cx="0" cy="0" r="4.2" class="wheel-hub-outer" />
                <circle cx="0" cy="0" r="2.4" class="wheel-pivot" />
                <line
                  x1="0"
                  :y1="-layout.wheel.h / 2 + 5"
                  x2="0"
                  :y2="-layout.wheel.h / 2 + 11"
                  class="wheel-dir"
                />
              </g>
              <text
                :x="wheel.labelPos.x"
                :y="wheel.labelPos.y"
                class="wheel-label"
                :text-anchor="wheel.labelAnchor"
              >
                {{ wheel.label }}
              </text>
              <text
                :x="wheel.labelPos.x"
                :y="wheel.labelPos.y + 14"
                class="wheel-angle"
                :text-anchor="wheel.labelAnchor"
              >
                {{ formatAngle(wheel.angle) }}°
              </text>
            </g>
          </svg>
        </div>
      </div>

      <!-- 角度控制面板 -->
      <div class="control-card" :class="{ 'is-disabled': !isManualControlEnabled }">
        <div class="ctl-header">
          <div class="ctl-title">角度控制</div>
          <div class="ctl-hint">0° 朝前 · 正值逆時針</div>
        </div>

        <div class="ctl-presets">
          <span class="ctl-presets-label">全部套用</span>
          <button
            v-for="preset in anglePresets"
            :key="'all-' + preset"
            type="button"
            class="btn-preset"
            :disabled="!isManualControlEnabled"
            @click="applyAngleToAll(preset)"
          >
            {{ preset }}°
          </button>
          <button
            type="button"
            class="btn-preset btn-preset--muted"
            :disabled="!isManualControlEnabled"
            @click="resetAllWheels"
          >
            歸零
          </button>
        </div>

        <div class="ctl-list">
          <div
            v-for="wheel in wheels"
            :key="'ctl-' + wheel.id"
            class="wheel-ctl"
            :class="{ 'is-active': selectedWheelId === wheel.id }"
            @click="handleWheelClick(wheel.id)"
          >
            <div class="wheel-ctl-head">
              <div class="wheel-ctl-name">
                <span>{{ wheel.label }}</span>
                <span class="wheel-ctl-actual">實際 {{ formatAngle(actualWheelAngles[wheel.id]) }}°</span>
              </div>
              <div class="wheel-ctl-value">
                <el-input-number
                  :model-value="wheelAngles[wheel.id]"
                  :min="angleMin"
                  :max="angleMax"
                  :step="1"
                  :precision="1"
                  :disabled="!isManualControlEnabled"
                  size="small"
                  controls-position="right"
                  @update:model-value="(v) => setWheelAngle(wheel.id, v)"
                  @click.stop
                />
                <span class="wheel-ctl-unit">°</span>
              </div>
            </div>

            <div class="wheel-ctl-slider" @click.stop>
              <el-slider
                :model-value="wheelAngles[wheel.id]"
                :min="angleMin"
                :max="angleMax"
                :step="1"
                :disabled="!isManualControlEnabled"
                :show-tooltip="true"
                @update:model-value="(v) => setWheelAngle(wheel.id, v)"
              />
            </div>

            <div class="wheel-ctl-actions" @click.stop>
              <button
                type="button"
                class="btn-jog"
                :disabled="!isManualControlEnabled"
                @click="nudgeWheel(wheel.id, -jogStep)"
              >
                −{{ jogStep }}°
              </button>
              <button
                v-for="preset in anglePresets"
                :key="wheel.id + '-' + preset"
                type="button"
                class="btn-jog btn-jog--preset"
                :disabled="!isManualControlEnabled"
                @click="setWheelAngle(wheel.id, preset)"
              >
                {{ preset }}°
              </button>
              <button
                type="button"
                class="btn-jog"
                :disabled="!isManualControlEnabled"
                @click="nudgeWheel(wheel.id, jogStep)"
              >
                +{{ jogStep }}°
              </button>
            </div>
          </div>
        </div>

        <div class="ctl-footer">
          <div class="jog-step">
            <span class="jog-step-label">微調步階</span>
            <el-radio-group v-model="jogStep" size="small" :disabled="!isManualControlEnabled">
              <el-radio-button :label="1">1°</el-radio-button>
              <el-radio-button :label="5">5°</el-radio-button>
              <el-radio-button :label="15">15°</el-radio-button>
            </el-radio-group>
          </div>
          <button
            type="button"
            class="btn-sync"
            :disabled="!isManualControlEnabled"
            @click="syncSelectedToAll"
          >
            選取輪角度套用全部
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { MOVEControl } from '@/api/VMSAPI'
import { ROS_STORE } from '@/store/ros_store'

const angleMin = -180
const angleMax = 180
const anglePresets = [0, 45, 90, -45, -90]
const ANGLE_SUBMIT_DEBOUNCE_MS = 500

/**
 * 四輪目標角度（度）— 手動控制下發用
 * 0° = 朝前；正值 = 俯視逆時針
 */
const wheelAngles = ref({
  fl: 0,
  fr: 0,
  rl: 0,
  rr: 0,
})

/** 四輪實際角度（來自 SignalR ReceiveCurrentMotorValue） */
const actualWheelAngles = computed(() => {
  const ang = ROS_STORE.state.currentMotorValue?.ang ?? []
  return {
    fl: Number(ang[0] ?? 0),
    fr: Number(ang[1] ?? 0),
    rl: Number(ang[2] ?? 0),
    rr: Number(ang[3] ?? 0),
  }
})

const selectedWheelId = ref('fl')
const jogStep = ref(5)
const isSubmittingAngles = ref(false)
const isManualModeSyncing = ref(false)

/** 手動控制模式：關閉時僅顯示姿態，不接受操作 */
const isManualControlEnabled = ref(false)

function debounce(func, delay) {
  let timeoutId
  const debounced = (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(null, args), delay)
  }
  debounced.cancel = () => clearTimeout(timeoutId)
  return debounced
}

function clampAngle(value) {
  const n = Number(value)
  if (Number.isNaN(n)) return 0
  return Math.min(angleMax, Math.max(angleMin, n))
}

function buildAnglesPayload() {
  return {
    fl: wheelAngles.value.fl,
    fr: wheelAngles.value.fr,
    rl: wheelAngles.value.rl,
    rr: wheelAngles.value.rr,
  }
}

function formatAnglesMessage(payload) {
  return `左前 ${formatAngle(payload.fl)}° / 右前 ${formatAngle(payload.fr)}° / 左後 ${formatAngle(payload.rl)}° / 右後 ${formatAngle(payload.rr)}°`
}

/** 從後端同步手動模式狀態 */
async function syncManualControlState() {
  try {
    const state = await MOVEControl.GetWheelsManualControlState()
    isManualControlEnabled.value = !!state
  } catch (error) {
    console.error(error)
    ElMessage.warning('無法取得四輪手動控制模式狀態')
  }
}

/** el-switch before-change：先呼叫後端再允許切換 */
async function beforeManualModeChange() {
  if (isManualModeSyncing.value) return false

  const targetMode = !isManualControlEnabled.value
  isManualModeSyncing.value = true
  try {
    const isSuccess = await MOVEControl.WheelsOptManualModeSwitch(targetMode)
    if (!isSuccess) {
      ElMessage.error('手動控制模式切換失敗')
      return false
    }
    // 開啟手動模式時，以當前實際姿態作為初始目標值，避免突發跳角
    if (targetMode) {
      wheelAngles.value = { ...actualWheelAngles.value }
    }
    ElMessage.success(targetMode ? '已開啟四輪手動控制模式' : '已關閉四輪手動控制模式')
    return true
  } catch (error) {
    console.error(error)
    ElMessage.error('手動控制模式切換失敗，請稍後再試')
    return false
  } finally {
    isManualModeSyncing.value = false
  }
}

/** 一次將四輪角度設定下發後端（debounce 後執行） */
async function submitWheelAngles() {
  if (!isManualControlEnabled.value || isSubmittingAngles.value) return

  const payload = buildAnglesPayload()
  isSubmittingAngles.value = true

  try {
    const isSuccess = await MOVEControl.AdjustWheelsAngles(payload)
    if (!isSuccess) {
      ElMessage.error('四輪角度下發失敗')
      return
    }
    ElMessage.success(`四輪角度已下發：${formatAnglesMessage(payload)}`)
  } catch (error) {
    console.error(error)
    ElMessage.error('四輪角度下發失敗，請稍後再試')
  } finally {
    isSubmittingAngles.value = false
  }
}

const debouncedSubmitWheelAngles = debounce(submitWheelAngles, ANGLE_SUBMIT_DEBOUNCE_MS)

watch(
  wheelAngles,
  () => {
    if (!isManualControlEnabled.value) return
    debouncedSubmitWheelAngles()
  },
  { deep: true },
)

watch(isManualControlEnabled, (enabled) => {
  if (!enabled) debouncedSubmitWheelAngles.cancel()
})

/** 非手動模式：目標值跟隨實際姿態，方便顯示與之後開啟手動時銜接 */
watch(
  actualWheelAngles,
  (angles) => {
    if (isManualControlEnabled.value) return
    wheelAngles.value = { ...angles }
  },
  { deep: true },
)

onMounted(() => {
  wheelAngles.value = { ...actualWheelAngles.value }
  syncManualControlState()
})

onUnmounted(() => {
  debouncedSubmitWheelAngles.cancel()
})

function setWheelAngle(wheelId, value) {
  if (!isManualControlEnabled.value) return
  wheelAngles.value[wheelId] = clampAngle(value)
  selectedWheelId.value = wheelId
}

function nudgeWheel(wheelId, delta) {
  setWheelAngle(wheelId, wheelAngles.value[wheelId] + delta)
}

function applyAngleToAll(angle) {
  if (!isManualControlEnabled.value) return
  const next = clampAngle(angle)
  wheelAngles.value = { fl: next, fr: next, rl: next, rr: next }
}

function resetAllWheels() {
  applyAngleToAll(0)
}

function syncSelectedToAll() {
  applyAngleToAll(wheelAngles.value[selectedWheelId.value])
}

function handleWheelClick(wheelId) {
  if (!isManualControlEnabled.value) return
  selectedWheelId.value = wheelId
}

const layout = {
  viewBox: '0 0 360 420',
  bg: { x: 0, y: 0, w: 360, h: 420 },
  centerX: 180,
  centerY: 218,
  chassis: { x: 96, y: 88, w: 168, h: 260, rx: 18 },
  wheel: { w: 24, h: 54, rx: 8 },
  positions: {
    fl: { x: 135, y: 148 },
    fr: { x: 225, y: 148 },
    rl: { x: 135, y: 288 },
    rr: { x: 225, y: 288 },
  },
  labelOffsetX: 46,
  labelOffsetY: -8,
}

const wheelMeta = [
  { id: 'fl', label: '左前', side: 'left' },
  { id: 'fr', label: '右前', side: 'right' },
  { id: 'rl', label: '左後', side: 'left' },
  { id: 'rr', label: '右後', side: 'right' },
]

const wheels = computed(() =>
  wheelMeta.map((meta) => {
    const pos = layout.positions[meta.id]
    const isLeft = meta.side === 'left'
    return {
      ...meta,
      // 俯瞰圖一律顯示實際姿態
      angle: actualWheelAngles.value[meta.id],
      x: pos.x,
      y: pos.y,
      labelPos: {
        x: pos.x + (isLeft ? -layout.labelOffsetX : layout.labelOffsetX),
        y: pos.y + layout.labelOffsetY,
      },
      labelAnchor: isLeft ? 'end' : 'start',
    }
  }),
)

/** SVG rotate：正角度為順時針，故取負號對應俯視逆時針為正 */
function wheelTransform(wheel) {
  return `translate(${wheel.x} ${wheel.y}) rotate(${-wheel.angle})`
}

function formatAngle(angle) {
  const n = Number(angle)
  if (Number.isNaN(n)) return '—'
  return n.toFixed(1)
}
</script>

<style lang="scss" scoped>
.wheels-angle-adjust {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.panel-grid {
  flex: 1 1 auto;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(280px, 1fr) minmax(300px, 380px);
  gap: 10px;
  overflow: hidden;
}

.viz-card,
.control-card {
  min-height: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #fff;
  overflow: hidden;
}

.viz-header,
.ctl-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  border-bottom: 1px solid #e2e8f0;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  flex-shrink: 0;
}

.viz-title,
.ctl-title {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.viz-title-text,
.ctl-title {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: 0.02em;
}

.viz-subtitle,
.ctl-hint {
  font-size: 11px;
  color: #64748b;
}

.manual-mode-switch {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  border-radius: 6px;
  background: #fff;
  border: 1px solid #e2e8f0;
}

.manual-mode-label {
  font-size: 12px;
  font-weight: 600;
  color: #334155;
  white-space: nowrap;
}

.viz-surface {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;

  &.is-manual-off .viz-svg {
    opacity: 0.72;
  }
}

.manual-off-hint {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  background: rgba(248, 250, 252, 0.92);
  border: 1px solid #e2e8f0;
  pointer-events: none;
}

.viz-svg {
  width: 100%;
  height: 100%;
  max-height: 520px;
  user-select: none;
}

.schem-bg {
  fill: #f8fafc;
  stroke: #e2e8f0;
  stroke-width: 1;
}

.chassis-body {
  fill: #334155;
  stroke: #1e293b;
  stroke-width: 1.5;
}

.chassis-inner {
  fill: #475569;
  stroke: rgba(148, 163, 184, 0.35);
  stroke-width: 1;
  stroke-dasharray: 4 3;
}

.front-line {
  stroke: #3b82f6;
  stroke-width: 2;
}

.front-text {
  fill: #3b82f6;
  font-size: 11px;
  font-weight: 700;
  text-anchor: middle;
  letter-spacing: 0.08em;
}

.center-cross {
  stroke: rgba(148, 163, 184, 0.55);
  stroke-width: 1;
}

.wheel-group {
  cursor: pointer;

  .wheel-body {
    fill: #1f1f1f;
    stroke: #0a0a0a;
    stroke-width: 1.2;
  }

  .wheel-hub-outer {
    fill: #4b5563;
    stroke: #1f2937;
    stroke-width: 0.8;
  }

  .wheel-pivot {
    fill: #9ca3af;
    stroke: #374151;
    stroke-width: 0.7;
  }

  .wheel-dir {
    stroke: rgba(56, 189, 248, 0.75);
    stroke-width: 1.6;
    stroke-linecap: round;
  }

  .wheel-label {
    fill: #334155;
    font-size: 12px;
    font-weight: 700;
  }

  .wheel-angle {
    fill: #64748b;
    font-size: 12px;
    font-variant-numeric: tabular-nums;
  }

  &:hover:not(.is-disabled) .wheel-body {
    stroke: #38bdf8;
  }

  &.is-selected .wheel-body {
    stroke: #38bdf8;
    stroke-width: 2;
  }

  &.is-selected .wheel-label {
    fill: #0369a1;
  }

  &.is-selected .wheel-angle {
    fill: #0284c7;
    font-weight: 700;
  }

  &.is-disabled {
    cursor: default;
  }
}

.control-card {
  &.is-disabled {
    opacity: 0.72;
  }
}

.ctl-presets {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.ctl-presets-label {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  margin-right: 2px;
}

.btn-preset {
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #334155;
  border-radius: 6px;
  padding: 3px 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;

  &:hover:not(:disabled) {
    border-color: #38bdf8;
    color: #0369a1;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  &--muted {
    color: #64748b;
  }
}

.ctl-list {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.wheel-ctl {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 8px 10px;
  background: #f8fafc;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;

  &.is-active {
    border-color: #38bdf8;
    background: #f0f9ff;
    box-shadow: 0 0 0 1px rgba(56, 189, 248, 0.25);
  }
}

.wheel-ctl-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 2px;
}

.wheel-ctl-name {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
}

.wheel-ctl-actual {
  font-size: 11px;
  font-weight: 600;
  color: #0284c7;
  font-variant-numeric: tabular-nums;
}

.wheel-ctl-value {
  display: flex;
  align-items: center;
  gap: 4px;

  :deep(.el-input-number) {
    width: 120px;
  }
}

.wheel-ctl-unit {
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
}

.wheel-ctl-slider {
  padding: 0 4px;
}

.wheel-ctl-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 2px;
}

.btn-jog {
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #334155;
  border-radius: 5px;
  padding: 2px 6px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  min-width: 40px;

  &:hover:not(:disabled) {
    border-color: #38bdf8;
    color: #0369a1;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  &--preset {
    color: #64748b;
  }
}

.ctl-footer {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid #e2e8f0;
  flex-shrink: 0;
  background: #f8fafc;
}

.jog-step {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.jog-step-label {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
}

.btn-sync {
  width: 100%;
  border: 1px solid #0ea5e9;
  background: #0284c7;
  color: #fff;
  border-radius: 7px;
  padding: 7px 10px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: #0369a1;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
}

@media (max-width: 960px) {
  .panel-grid {
    grid-template-columns: 1fr;
    overflow: auto;
  }

  .viz-card {
    min-height: 320px;
  }
}
</style>
