<template>
  <div class="fork-side-view-viz">
    <div class="d-flex flex-column gap-2">
      <div class="d-flex flex-row justify-content-between align-items-center flex-wrap gap-2">
        <div class="d-flex flex-row align-items-center gap-2 flex-wrap">
          <div class="pill">
            <span class="pill-label">{{ $t('fork_viz_vertical') }}</span>
            <span class="pill-value">{{ formatNum(forkHeight) }}</span>
            <span class="pill-unit">{{ $t('fork_viz_cm') }}</span>
          </div>
          <div v-if="isHorizonEnabled" class="pill">
            <span class="pill-label">{{ $t('fork_viz_horizon') }}</span>
            <span class="pill-value">{{ formatNum(forkExtension) }}</span>
          </div>
        </div>
        <div class="legend">
          <span class="legend-dot on"></span><span class="legend-text">{{ $t('fork_viz_on') }}</span>
          <span class="legend-dot off"></span><span class="legend-text">{{ $t('fork_viz_off') }}</span>
        </div>
      </div>

      <div class="viz-surface border rounded">
        <svg class="viz-svg" viewBox="0 0 360 240" role="img" aria-label="Fork side view">
          <!-- Ground -->
          <line x1="18" y1="214" x2="342" y2="214" class="ground" />

          <!-- Vehicle body -->
          <rect x="42" y="164" width="150" height="50" rx="8" class="body" />
          <rect x="58" y="178" width="36" height="14" rx="3" class="body-detail" />
          <circle cx="76" cy="216" r="10" class="wheel" />
          <circle cx="156" cy="216" r="10" class="wheel" />

          <!-- Mast -->
          <rect :x="mast.x" :y="mast.y" :width="mast.w" :height="mast.h" rx="6" class="mast" />

          <!-- Mast sensor markers (fixed locations) -->
          <g>
            <circle :cx="mastSensorX" :cy="mastSensors.up.y" r="7" :class="sensorClass(verticalUpLimitOn)" />
            <text :x="mastSensorLabelX" :y="mastSensors.up.y + 4" class="sensor-label">{{ $t('fork_viz_up_limit') }}</text>

            <circle :cx="mastSensorX" :cy="mastSensors.home.y" r="7" :class="sensorClass(verticalHomeOn)" />
            <text :x="mastSensorLabelX" :y="mastSensors.home.y + 4" class="sensor-label">{{ $t('fork_viz_home') }}</text>

            <circle :cx="mastSensorX" :cy="mastSensors.down.y" r="7" :class="sensorClass(verticalDownLimitOn)" />
            <text :x="mastSensorLabelX" :y="mastSensors.down.y + 4" class="sensor-label">{{ $t('fork_viz_down_limit') }}</text>
          </g>

          <!-- Carriage + fork group -->
          <g class="carriage" :transform="`translate(0 ${carriageTranslateY})`">
            <rect :x="carriage.x" :y="carriage.y" :width="carriage.w" :height="carriage.h" rx="6" class="carriage-rect" />

            <!-- Fork arm base -->
            <rect
              :x="forkBase.x"
              :y="forkBase.y"
              :width="forkBase.w"
              :height="forkBase.h"
              rx="4"
              class="fork-base"
            />

            <!-- Fork arm (scales by extension) -->
            <g v-if="isHorizonEnabled" class="fork-arm" :transform="`translate(${forkArm.originX} ${forkArm.originY}) scale(${forkArm.scaleX} 1) translate(${-forkArm.originX} ${-forkArm.originY})`">
              <rect :x="forkArm.x" :y="forkArm.y" :width="forkArm.w" :height="forkArm.h" rx="3" class="fork-arm-rect" />
            </g>

            <!-- Horizon sensor markers -->
            <g v-if="isHorizonEnabled">
              <circle :cx="horizonSensors.extend.x" :cy="horizonSensors.extend.y" r="7" :class="sensorClass(horizonExtendOn)" />
              <text :x="horizonSensors.extend.x + 12" :y="horizonSensors.extend.y + 4" class="sensor-label">{{ $t('fork_viz_extend_limit') }}</text>

              <circle :cx="horizonSensors.home.x" :cy="horizonSensors.home.y" r="7" :class="sensorClass(horizonHomeOn)" />
              <text :x="horizonSensors.home.x + 12" :y="horizonSensors.home.y + 4" class="sensor-label">{{ $t('fork_viz_home') }}</text>

              <circle :cx="horizonSensors.retract.x" :cy="horizonSensors.retract.y" r="7" :class="sensorClass(horizonRetractOn)" />
              <text :x="horizonSensors.retract.x + 12" :y="horizonSensors.retract.y + 4" class="sensor-label">{{ $t('fork_viz_retract_limit') }}</text>
            </g>
          </g>

          <!-- Axis readouts -->
          <text x="42" y="26" class="axis-title">{{ $t('fork_viz_side_view') }}</text>
          <text x="42" y="44" class="axis-sub">
            {{ $t('fork_viz_vertical') }}: {{ formatNum(forkHeight) }} {{ $t('fork_viz_cm') }}
            <tspan v-if="isHorizonEnabled">｜{{ $t('fork_viz_horizon') }}: {{ formatNum(forkExtension) }}</tspan>
          </text>
        </svg>
      </div>
    </div>
  </div>
</template>

<script>
import { AGVStatusStore, DIOStore, SystemSettingsStore } from '@/store'

function clamp01(n) {
  if (Number.isNaN(n)) return 0
  return Math.max(0, Math.min(1, n))
}

function safeRange(minVal, maxVal, fallbackMin = 0, fallbackMax = 1) {
  const minN = Number(minVal)
  const maxN = Number(maxVal)
  if (!Number.isFinite(minN) || !Number.isFinite(maxN) || maxN <= minN) {
    return { min: fallbackMin, max: fallbackMax }
  }
  return { min: minN, max: maxN }
}

export default {
  name: 'ForkSideViewVisualization',
  computed: {
    forkHeight() {
      return AGVStatusStore.getters.ForkHeight
    },
    forkExtension() {
      return AGVStatusStore.state.AGVStatus.ForkHorizonDriverState?.position ?? 0
    },
    forkSettings() {
      return SystemSettingsStore.state.Settings?.ForkAGV
    },
    isHorizonEnabled() {
      const fork = this.forkSettings
      return fork?.IsForkIsExtendable === true && fork?.HorizonArmConfigs?.ControlType === 1
    },
    verticalRange() {
      const fork = this.forkSettings
      return safeRange(fork?.DownlimitPose, fork?.UplimitPose, 0, 35)
    },
    horizonRange() {
      const cfg = this.forkSettings?.HorizonArmConfigs
      return safeRange(cfg?.ShortenPose, cfg?.ExtendPose, 0, 1)
    },
    verticalRatio() {
      const { min, max } = this.verticalRange
      const v = (Number(this.forkHeight) - min) / (max - min)
      return clamp01(v)
    },
    horizonRatio() {
      const { min, max } = this.horizonRange
      const v = (Number(this.forkExtension) - min) / (max - min)
      return clamp01(v)
    },

    verticalUpLimitOn() {
      return DIOStore.getters.ZAxisUplimitSensorState
    },
    verticalDownLimitOn() {
      return DIOStore.getters.ZAxisDownlimitSensorState
    },
    verticalHomeOn() {
      return DIOStore.getters.ZAxisHomePoseSensorState
    },
    horizonExtendOn() {
      return DIOStore.getters.ForkHorizonExtendSensorState
    },
    horizonRetractOn() {
      return DIOStore.getters.ForkHorizonShortedSensorState
    },
    horizonHomeOn() {
      return DIOStore.getters.ForkHorizonHomePoseSensorState
    },

    mast() {
      return { x: 210, y: 54, w: 28, h: 150 }
    },
    mastSensorX() {
      return this.mast.x + this.mast.w / 2
    },
    mastSensorLabelX() {
      return this.mast.x - 64
    },
    mastSensors() {
      const top = this.mast.y + 14
      const mid = this.mast.y + this.mast.h * 0.52
      const bot = this.mast.y + this.mast.h - 14
      return {
        up: { y: top },
        home: { y: mid },
        down: { y: bot }
      }
    },
    carriage() {
      return { x: 186, y: 0, w: 78, h: 34 }
    },
    carriageTranslateY() {
      const yTop = this.mast.y + 12
      const yBottom = this.mast.y + this.mast.h - 28
      const y = yBottom - this.verticalRatio * (yBottom - yTop)
      return y
    },
    forkBase() {
      return { x: 236, y: 22, w: 22, h: 10 }
    },
    forkArm() {
      const baseX = 256
      const baseY = 22
      const w = 110
      const h = 10
      const scaleX = 0.18 + this.horizonRatio * 0.82
      return {
        x: baseX,
        y: baseY,
        w,
        h,
        scaleX,
        originX: baseX,
        originY: baseY + h / 2
      }
    },
    horizonSensors() {
      const y = 22 + 5
      return {
        extend: { x: 256 + 110, y },
        home: { x: 256 + 55, y: y + 18 },
        retract: { x: 256 + 16, y }
      }
    }
  },
  methods: {
    formatNum(val) {
      const n = Number(val)
      if (!Number.isFinite(n)) return '--'
      return n.toFixed(2)
    },
    sensorClass(isOn) {
      return isOn ? 'sensor-dot sensor-on' : 'sensor-dot sensor-off'
    }
  }
}
</script>

<style scoped lang="scss">
.fork-side-view-viz {
  width: 100%;
}

.pill {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.04);
  color: inherit;
}

.pill-label {
  font-weight: 700;
  opacity: 0.85;
}
.pill-value {
  font-variant-numeric: tabular-nums;
  font-weight: 700;
}
.pill-unit {
  opacity: 0.8;
}

.legend {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  user-select: none;
  opacity: 0.9;
}
.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  display: inline-block;
}
.legend-dot.on {
  background: #28a745;
}
.legend-dot.off {
  background: #9aa4ad;
}
.legend-text {
  font-size: 12px;
  margin-right: 10px;
}

.viz-surface {
  padding: 8px;
  background: rgba(255, 255, 255, 0.5);
}

.viz-svg {
  width: 100%;
  height: auto;
  display: block;
}

.ground {
  stroke: rgba(0, 0, 0, 0.25);
  stroke-width: 2;
}

.body {
  fill: rgba(92, 92, 92, 0.18);
  stroke: rgba(0, 0, 0, 0.28);
  stroke-width: 2;
}
.body-detail {
  fill: rgba(0, 0, 0, 0.18);
}
.wheel {
  fill: rgba(0, 0, 0, 0.3);
}

.mast {
  fill: rgba(28, 92, 92, 0.22);
  stroke: rgba(0, 0, 0, 0.28);
  stroke-width: 2;
}

.carriage {
  transition: transform 140ms ease-out;
}
.carriage-rect {
  fill: rgba(30, 120, 253, 0.25);
  stroke: rgba(0, 0, 0, 0.25);
  stroke-width: 2;
}

.fork-base {
  fill: rgba(0, 0, 0, 0.26);
}
.fork-arm {
  transition: transform 140ms ease-out;
}
.fork-arm-rect {
  fill: rgba(0, 0, 0, 0.24);
}

.sensor-dot {
  stroke: rgba(0, 0, 0, 0.35);
  stroke-width: 1.5;
}
.sensor-on {
  fill: #28a745;
}
.sensor-off {
  fill: #9aa4ad;
}
.sensor-label {
  font-size: 12px;
  fill: currentColor;
  opacity: 0.92;
}

.axis-title {
  font-size: 14px;
  font-weight: 700;
  fill: currentColor;
}
.axis-sub {
  font-size: 12px;
  fill: currentColor;
  opacity: 0.85;
}

@media (prefers-color-scheme: dark) {
  .pill {
    background: rgba(255, 255, 255, 0.08);
  }
  .viz-surface {
    background: rgba(0, 0, 0, 0.18);
  }
  .ground {
    stroke: rgba(255, 255, 255, 0.25);
  }
  .body,
  .mast,
  .carriage-rect {
    stroke: rgba(255, 255, 255, 0.22);
  }
  .sensor-dot {
    stroke: rgba(255, 255, 255, 0.28);
  }
}
</style>
