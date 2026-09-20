<template>
  <div class="fork-side-panel" v-loading="!controlsEnabled" :element-loading-spinner="false"
    :element-loading-background="controlsEnabled ? 'rgba(0,0,0,0)' : 'rgba(8,12,18,0.55)'">
    <div v-show="!controlsEnabled" class="disable-hint">{{ $t('zaxis_control_notify_text') }}</div>

    <div class="panel-grid">
      <div class="viz-card">
        <div class="viz-header">
          <div class="viz-title">
            <span class="viz-title-text">{{ $t('fork_side_panel_title') }}</span>
          </div>
          <div class="viz-metrics">
            <div class="metric">
              <div class="metric-label">{{ $t('fork_viz_vertical') }}</div>
              <div class="metric-value">{{ formatNum(forkHeight) }}<span class="metric-unit">{{ $t('fork_viz_cm') }}</span></div>
            </div>
            <div v-if="isHorizonEnabled" class="metric">
              <div class="metric-label">{{ $t('fork_viz_horizon') }}</div>
              <div class="metric-value">{{ formatNum(forkExtension) }}</div>
            </div>
            <div class="metric small">
              <div class="metric-label">{{ $t('fork_ctl_state') }}</div>
              <div class="metric-value">{{ verticalDriverState?.state ?? 0 }}</div>
            </div>
            <div class="metric small">
              <div class="metric-label">{{ $t('fork_ctl_ecode') }}</div>
              <div class="metric-value">{{ verticalDriverState?.errorCode ?? 0 }}</div>
            </div>
          </div>
        </div>

        <div class="viz-surface">
          <svg class="viz-svg" viewBox="0 0 900 420" role="img" :aria-label="$t('fork_side_panel_title')">
            <defs>
              <pattern id="dotGrid" width="18" height="18" patternUnits="userSpaceOnUse">
                <circle cx="1.5" cy="1.5" r="1.2" fill="rgba(148,163,184,0.18)" />
              </pattern>
              <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2.4" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <!-- Background -->
            <rect x="0" y="0" width="900" height="420" rx="18" class="schem-bg" />
            <rect x="0" y="0" width="900" height="420" rx="18" fill="url(#dotGrid)" />

            <!-- Unified mast + base outline (one body) -->
            <path :d="schem.outlinePath" class="schem-outline" />

            <!-- Fork + carriage (moves vertically) -->
            <g :transform="`translate(0 ${schem.fork.translateY})`">
              <rect :x="schem.carriage.x" :y="schem.carriage.y" :width="schem.carriage.w" :height="schem.carriage.h" rx="8" class="schem-carriage" />
              <rect :x="schem.fork.x" :y="schem.fork.y" :width="schem.fork.w" :height="schem.fork.h" rx="6" class="schem-fork" />

              <!-- Horizon sensors embedded on fork -->
              <g v-if="isHorizonEnabled" class="sensors">
                <g :transform="sensorGroupTransform(schem.horizonSensors.retract)">
                  <circle :r="schem.sensorR" :class="sensorDotClass(horizonRetractOn)" filter="url(#softGlow)" />
                  <text x="12" y="4" class="sensor-text">{{ $t('fork_viz_retract_limit') }}</text>
                </g>
                <g :transform="sensorGroupTransform(schem.horizonSensors.home)">
                  <circle :r="schem.sensorR" :class="sensorDotClass(horizonHomeOn)" filter="url(#softGlow)" />
                  <text x="12" y="4" class="sensor-text">{{ $t('fork_viz_home') }}</text>
                </g>
                <g :transform="sensorGroupTransform(schem.horizonSensors.extend)">
                  <circle :r="schem.sensorR" :class="sensorDotClass(horizonExtendOn)" filter="url(#softGlow)" />
                  <text x="12" y="4" class="sensor-text">{{ $t('fork_viz_extend_limit') }}</text>
                </g>
              </g>
            </g>

            <!-- Vertical sensors embedded on mast -->
            <g class="sensors">
              <g :transform="sensorGroupTransform(schem.verticalSensors.up)">
                <circle :r="schem.sensorR" :class="sensorDotClass(verticalUpLimitOn)" filter="url(#softGlow)" />
                <text x="-10" y="-10" class="sensor-text sensor-text-left">{{ $t('fork_viz_up_limit') }}</text>
              </g>
              <g :transform="sensorGroupTransform(schem.verticalSensors.home)">
                <circle :r="schem.sensorR" :class="sensorDotClass(verticalHomeOn)" filter="url(#softGlow)" />
                <text x="-10" y="-10" class="sensor-text sensor-text-left">{{ $t('fork_viz_home') }}</text>
              </g>
              <g :transform="sensorGroupTransform(schem.verticalSensors.down)">
                <circle :r="schem.sensorR" :class="sensorDotClass(verticalDownLimitOn)" filter="url(#softGlow)" />
                <text x="-10" y="-10" class="sensor-text sensor-text-left">{{ $t('fork_viz_down_limit') }}</text>
              </g>
            </g>
          </svg>
        </div>
      </div>

      <div class="control-card">
        <div class="control-top">
          <div class="control-title">{{ $t('fork_ctl_controls') }}</div>
          <div class="control-legend">
            <span class="legend-dot on"></span><span class="legend-text">{{ $t('fork_viz_on') }}</span>
            <span class="legend-dot off"></span><span class="legend-text">{{ $t('fork_viz_off') }}</span>
          </div>
        </div>

        <div class="ctl-group">
          <div class="ctl-head">
            <div class="ctl-head-left">
              <div class="ctl-name">{{ $t('fork_ctl_lift') }}</div>
              <div class="ctl-sub">
                <span class="chip">{{ $t('fork_ctl_position') }}: {{ formatNum(forkHeight) }} {{ $t('fork_viz_cm') }}</span>
                <span class="chip">{{ $t('fork_ctl_state') }}: {{ verticalDriverState?.state ?? 0 }}</span>
                <span class="chip">{{ $t('fork_ctl_ecode') }}: {{ verticalDriverState?.errorCode ?? 0 }}</span>
              </div>
            </div>
            <div class="ctl-head-right">
              <div class="safety">
                <span class="safety-label">{{ $t('fork_ctl_safety') }}</span>
                <el-switch :inline-prompt="true" v-model="verticalActionSafetyProtection"
                  :active-text="$t('fork_ctl_on')" :inactive-text="$t('fork_ctl_off')" inactive-color="#ef4444" />
              </div>
            </div>
          </div>

          <div class="btn-grid">
            <button class="btn ctl" :disabled="btnDisabled('Vertical')" @click="forkAction('Vertical','up_limit')">
              <i class="bi bi-chevron-bar-up"></i><span>{{ $t('up_limit_pose') }}</span>
            </button>
            <button class="btn ctl" :disabled="btnDisabled('Vertical')" @click="forkAction('Vertical','up')">
              <i class="bi bi-chevron-up"></i><span>{{ $t('up') }}</span>
            </button>
            <button class="btn ctl" :disabled="btnDisabled('Vertical')" @click="forkAction('Vertical','home')">
              <i class="bi bi-house-fill"></i><span>{{ $t('original') }}</span>
            </button>
            <button class="btn ctl stop" :disabled="stopDisabled('Vertical')" @click="forkAction('Vertical','stop')">
              <i class="bi bi-stop-circle-fill"></i><span>{{ $t('stop') }}</span>
            </button>
            <button class="btn ctl" :disabled="btnDisabled('Vertical')" @click="forkAction('Vertical','down')">
              <i class="bi bi-chevron-down"></i><span>{{ $t('down') }}</span>
            </button>
            <button class="btn ctl" :disabled="btnDisabled('Vertical')" @click="forkAction('Vertical','down_limit')">
              <i class="bi bi-chevron-bar-down"></i><span>{{ $t('down_limit_pose') }}</span>
            </button>
          </div>

          <div class="group-actions">
            <button class="btn subtle" :disabled="findHomeDisabled('Vertical')" @click="findHome('Vertical')">
              <i class="bi bi-bullseye"></i><span>{{ $t('fork_ctl_find_home') }}</span>
            </button>
            <span v-if="verticalHardwareBypass" class="warn">{{ $t('fork_ctl_hw_bypass_on') }}</span>
          </div>
        </div>

        <div v-if="isHorizonEnabled" class="ctl-group">
          <div class="ctl-head">
            <div class="ctl-head-left">
              <div class="ctl-name">{{ $t('fork_ctl_telescope') }}</div>
              <div class="ctl-sub">
                <span class="chip">{{ $t('fork_ctl_position') }}: {{ formatNum(forkExtension) }}</span>
                <span class="chip">{{ $t('fork_ctl_state') }}: {{ horizonDriverState?.state ?? 0 }}</span>
                <span class="chip">{{ $t('fork_ctl_ecode') }}: {{ horizonDriverState?.errorCode ?? 0 }}</span>
              </div>
            </div>
            <div class="ctl-head-right">
              <div class="safety">
                <span class="safety-label">{{ $t('fork_ctl_safety') }}</span>
                <el-switch :inline-prompt="true" v-model="horizonActionSafetyProtection"
                  :active-text="$t('fork_ctl_on')" :inactive-text="$t('fork_ctl_off')" inactive-color="#ef4444" />
              </div>
            </div>
          </div>

          <div class="btn-grid">
            <button class="btn ctl" :disabled="btnDisabled('Horizon')" @click="forkAction('Horizon','up_limit')">
              <i class="bi bi-chevron-bar-up"></i><span>{{ $t('fork_extend') }}</span>
            </button>
            <button class="btn ctl" disabled :title="$t('fork_ctl_jog_disabled_hint')">
              <i class="bi bi-chevron-right"></i><span>{{ $t('fork_extend_jog') }}</span>
            </button>
            <button class="btn ctl" :disabled="btnDisabled('Horizon')" @click="forkAction('Horizon','home')">
              <i class="bi bi-house-fill"></i><span>{{ $t('original') }}</span>
            </button>
            <button class="btn ctl stop" :disabled="stopDisabled('Horizon')" @click="forkAction('Horizon','stop')">
              <i class="bi bi-stop-circle-fill"></i><span>{{ $t('stop') }}</span>
            </button>
            <button class="btn ctl" disabled :title="$t('fork_ctl_jog_disabled_hint')">
              <i class="bi bi-chevron-left"></i><span>{{ $t('fork_retract_jog') }}</span>
            </button>
            <button class="btn ctl" :disabled="btnDisabled('Horizon')" @click="forkAction('Horizon','down_limit')">
              <i class="bi bi-chevron-bar-down"></i><span>{{ $t('fork_retract') }}</span>
            </button>
          </div>

          <div class="group-actions">
            <button class="btn subtle" :disabled="findHomeDisabled('Horizon')" @click="findHome('Horizon')">
              <i class="bi bi-bullseye"></i><span>{{ $t('fork_ctl_find_home') }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ForkAPI } from '@/api/VMSAPI'
import { AGVStatusStore, DIOStore, SystemSettingsStore, UserStore } from '@/store'
import { ElMessage } from 'element-plus'

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
  props: {
    enabled: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      isZAxisMoving: false,
      isHorizonMoving: false,
      verticalActionSafetyProtection: true,
      horizonActionSafetyProtection: true,
      isVerticalFindHomeProcessing: false,
      isHorizonFindHomeProcessing: false
    }
  },
  computed: {
    isUserLogin() {
      return UserStore.getters.CurrentUserRole != 0
    },
    isGodUser() {
      return UserStore.getters.IsGodUser
    },
    controlsEnabled() {
      if (this.isGodUser) return true
      return (this.isUserLogin && !this.isAuto && !this.isOnline)
    },
    forkHeight() {
      return AGVStatusStore.getters.ForkHeight
    },
    forkExtension() {
      return AGVStatusStore.state.AGVStatus.ForkHorizonDriverState?.position ?? 0
    },
    verticalDriverState() {
      return AGVStatusStore.state.AGVStatus.ZAxisDriverState
    },
    horizonDriverState() {
      return AGVStatusStore.state.AGVStatus.ForkHorizonDriverState
    },
    isAuto() {
      return AGVStatusStore.getters.IsAuto
    },
    isOnline() {
      return AGVStatusStore.getters.IsOnline
    },
    isAgvRunning() {
      return AGVStatusStore.state.AGVStatus.SubState === 'RUN'
    },
    forkSettings() {
      return SystemSettingsStore.state.Settings?.ForkAGV
    },
    vehicleSettings() {
      return SystemSettingsStore.state.Settings
    },
    vehicleLengthCm() {
      const s = this.vehicleSettings
      return Number(s?.VehielLength ?? s?.VehicleLength ?? s?.ForkAGV?.VehielLength ?? s?.ForkAGV?.VehicleLength ?? 145)
    },
    vehicleHeightCm() {
      const s = this.vehicleSettings
      return Number(s?.VehicleHeight ?? s?.ForkAGV?.VehicleHeight ?? 200)
    },
    vehicleWidthCm() {
      const s = this.vehicleSettings
      return Number(s?.VehicleWidth ?? s?.ForkAGV?.VehicleWidth ?? 90)
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

    verticalHardwareBypass() {
      return DIOStore.getters.Vertical_Hardware_limit_bypass
    },

    schem() {
      const vLen = Number.isFinite(this.vehicleLengthCm) && this.vehicleLengthCm > 0 ? this.vehicleLengthCm : 145
      const vH = Number.isFinite(this.vehicleHeightCm) && this.vehicleHeightCm > 0 ? this.vehicleHeightCm : 200
      const vW = Number.isFinite(this.vehicleWidthCm) && this.vehicleWidthCm > 0 ? this.vehicleWidthCm : 90

      const padX = 90
      const padY = 40
      const availW = 900 - padX * 2
      const availH = 420 - padY * 2
      const scale = Math.max(0.6, Math.min(2.2, Math.min(availW / (vLen * 1.15), availH / (vH * 1.05))))

      const mastH = vH * scale
      const mastW = Math.max(12, Math.min(22, vW * 0.06 * scale))
      const baseLen = vLen * scale
      const baseThick = Math.max(16, Math.min(28, vW * 0.09 * scale))

      const mast = { x: padX + 30, y: padY, w: mastW, h: mastH }
      const base = { x: mast.x - Math.max(6, mastW * 0.25), y: mast.y + mast.h, w: baseLen, h: baseThick }

      const outlinePath = [
        `M ${mast.x} ${mast.y}`,
        `L ${mast.x + mast.w} ${mast.y}`,
        `L ${mast.x + mast.w} ${base.y}`,
        `L ${base.x + base.w} ${base.y}`,
        `L ${base.x + base.w} ${base.y + base.h}`,
        `L ${base.x} ${base.y + base.h}`,
        `L ${base.x} ${base.y}`,
        `L ${mast.x} ${base.y}`,
        `L ${mast.x} ${mast.y}`,
        'Z'
      ].join(' ')

      const yTop = mast.y + mast.h * 0.08
      const yBottom = mast.y + mast.h * 0.92
      const forkY = yBottom - this.verticalRatio * (yBottom - yTop)

      const forkThickness = Math.max(10, Math.min(16, baseThick * 0.55))
      const carriageW = mastW * 2.4
      const carriageH = Math.max(48, Math.min(78, mastH * 0.22))
      const carriage = { x: mast.x + mast.w - carriageW * 0.18, y: -(carriageH / 2), w: carriageW, h: carriageH }

      const forkStartX = mast.x + mast.w + 18
      const forkMinLen = baseLen * 0.62
      const forkExtra = baseLen * 0.55
      const forkLen = forkMinLen + (this.isHorizonEnabled ? (forkExtra * this.horizonRatio) : 0)
      const fork = { x: forkStartX, y: -(forkThickness / 2), w: forkLen, h: forkThickness, translateY: forkY }

      const verticalSensors = {
        up: { x: mast.x + mast.w / 2, y: yTop },
        home: { x: mast.x + mast.w / 2, y: mast.y + mast.h * 0.52 },
        down: { x: mast.x + mast.w / 2, y: yBottom }
      }

      const horizonSensors = {
        retract: { x: forkStartX + 14, y: 26 },
        home: { x: forkStartX + (forkLen * 0.5), y: 26 },
        extend: { x: forkStartX + forkLen - 14, y: 26 }
      }

      const sensorR = Math.max(5, Math.min(7, mastW * 0.34))

      return {
        mast,
        base,
        outlinePath,
        carriage,
        fork,
        verticalSensors,
        horizonSensors,
        sensorR
      }
    }
  },
  methods: {
    formatNum(val) {
      const n = Number(val)
      if (!Number.isFinite(n)) return '--'
      return n.toFixed(2)
    },
    sensorDotClass(isOn) {
      return isOn ? 'sensor-dot sensor-on' : 'sensor-dot sensor-off'
    },
    sensorGroupTransform(p) {
      return `translate(${p.x} ${p.y})`
    },
    btnDisabled(dir) {
      if (!this.controlsEnabled) return true
      return this.isActing(dir)
    },
    stopDisabled(dir) {
      if (!this.controlsEnabled) return true
      return false
    },
    findHomeDisabled(dir) {
      if (!this.controlsEnabled) return true
      if (this.isAgvRunning) return true
      return this.isFindHomeProcessing(dir)
    },
    isFindHomeProcessing(dir) {
      return dir === 'Vertical' ? this.isVerticalFindHomeProcessing : this.isHorizonFindHomeProcessing
    },
    isActing(dir) {
      return dir === 'Vertical' ? this.isZAxisMoving : this.isHorizonMoving
    },
    setActing(dir, isActing) {
      if (dir === 'Vertical') this.isZAxisMoving = isActing
      else this.isHorizonMoving = isActing
    },
    async forkAction(dir, action) {
      const isVertical = dir === 'Vertical'
      if (!this.controlsEnabled) return
      if (dir === 'Horizon' && (action === 'up' || action === 'down')) return
      let canceled = false

      if (isVertical && action !== 'home' && action !== 'stop' && this.verticalHardwareBypass) {
        await this.$swal.fire({
          title: this.$t('fork_ctl_hw_bypass_confirm', { action }),
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'OK',
          customClass: 'my-sweetalert'
        }).then(res => {
          canceled = !res.isConfirmed
        })
      }
      if (canceled) return

      try {
        this.setActing(dir, true)
        const safety = isVertical ? this.verticalActionSafetyProtection : this.horizonActionSafetyProtection
        const ret = await ForkAPI.Action(dir, action, 0, 0, safety)
        this.setActing(dir, false)
        if (!ret?.confirm) {
          this.$swal.fire({
            text: ret?.message ?? '',
            icon: 'error',
            title: this.$t('fork_ctl_forbidden')
          })
        }
      } catch (e) {
        this.setActing(dir, false)
        this.$swal.fire({
          text: String(e?.message ?? e),
          icon: 'error',
          title: this.$t('fork_ctl_failed')
        })
      }
    },
    async findHome(dir) {
      const actionName = dir === 'Vertical' ? this.$t('fork_ctl_lift') : this.$t('fork_ctl_telescope')
      if (!this.controlsEnabled) return
      this.$swal.fire({
        title: this.$t('fork_ctl_find_home_confirm', { name: actionName }),
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'OK',
        cancelButtonText: this.$t('fork_ctl_cancel'),
        customClass: 'my-sweetalert'
      }).then(async res => {
        if (!res.isConfirmed) {
          ElMessage.warning(this.$t('fork_ctl_cancelled'))
          return
        }
        if (this.isAuto) {
          this.$swal.fire({
            title: this.$t('fork_ctl_auto_block'),
            icon: 'warning',
            showCancelButton: false,
            confirmButtonText: 'OK',
            customClass: 'my-sweetalert'
          })
          return
        }
        if (this.isOnline) {
          this.$swal.fire({
            title: this.$t('fork_ctl_online_block'),
            icon: 'warning',
            showCancelButton: false,
            confirmButtonText: 'OK',
            customClass: 'my-sweetalert'
          })
          return
        }
        if (dir === 'Vertical') this.isVerticalFindHomeProcessing = true
        else this.isHorizonFindHomeProcessing = true

        let ret
        try {
          ret = await ForkAPI.FindHome(dir)
        } catch (e) {
          this.$swal.fire({
            title: this.$t('fork_ctl_failed'),
            text: String(e?.message ?? e),
            icon: 'error',
            showCancelButton: false,
            confirmButtonText: 'OK',
            customClass: 'my-sweetalert'
          })
          return
        } finally {
          if (dir === 'Vertical') this.isVerticalFindHomeProcessing = false
          else this.isHorizonFindHomeProcessing = false
        }

        if (!ret?.success) {
          this.$swal.fire({
            title: this.$t('fork_ctl_find_home_failed', { name: actionName, alarm: ret?.alarm ?? '' }),
            icon: 'error',
            showCancelButton: false,
            confirmButtonText: 'OK',
            customClass: 'my-sweetalert'
          })
          return
        }
        this.$swal.fire({
          title: this.$t('fork_ctl_find_home_done', { name: actionName }),
          icon: 'success',
          showCancelButton: false,
          confirmButtonText: 'OK',
          customClass: 'my-sweetalert'
        })
      })
    }
  }
}
</script>

<style scoped lang="scss">
.fork-side-panel {
  width: 100%;
  min-height: 520px;
  position: relative;
}

.disable-hint {
  color: #fecaca;
  font-weight: 700;
  margin: 6px 4px 10px;
}

.panel-grid {
  display: grid;
  grid-template-columns: minmax(420px, 1.35fr) minmax(340px, 1fr);
  gap: 14px;
  align-items: stretch;
}

.viz-card,
.control-card {
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.viz-card {
  background: rgba(10, 12, 18, 0.92);
}

.viz-header {
  padding: 14px 14px 10px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.viz-title-text {
  color: rgba(255, 255, 255, 0.92);
  font-weight: 800;
  letter-spacing: 0.2px;
}

.viz-metrics {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.metric {
  padding: 8px 10px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  min-width: 92px;
}
.metric.small {
  min-width: 72px;
}
.metric-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.72);
}
.metric-value {
  font-variant-numeric: tabular-nums;
  color: rgba(255, 255, 255, 0.95);
  font-weight: 800;
  font-size: 16px;
}
.metric-unit {
  font-size: 12px;
  font-weight: 700;
  margin-left: 4px;
  opacity: 0.8;
}

.viz-surface {
  padding: 10px 12px 14px;
}

.viz-svg {
  width: 100%;
  height: auto;
  display: block;
}

.schem-bg {
  fill: rgba(8, 11, 16, 0.96);
}

.schem-outline {
  fill: rgba(226, 232, 240, 0.02);
  stroke: rgba(226, 232, 240, 0.78);
  stroke-width: 4;
  stroke-linejoin: miter;
  stroke-linecap: square;
}

.schem-carriage {
  fill: transparent;
  stroke: rgba(226, 232, 240, 0.72);
  stroke-width: 3;
}

.schem-fork {
  fill: transparent;
  stroke: rgba(226, 232, 240, 0.78);
  stroke-width: 4;
}

.sensor-dot {
  stroke: rgba(255, 255, 255, 0.18);
  stroke-width: 2;
}
.sensor-on {
  fill: #22d3ee;
}
.sensor-off {
  fill: rgba(148, 163, 184, 0.45);
}
.sensor-text {
  fill: rgba(255, 255, 255, 0.86);
  font-size: 11px;
  font-weight: 700;
  paint-order: stroke;
  stroke: rgba(0, 0, 0, 0.55);
  stroke-width: 3px;
}
.sensor-text-left {
  text-anchor: end;
}

.control-card {
  background: linear-gradient(180deg, rgba(11, 13, 18, 0.92), rgba(6, 7, 10, 0.95));
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  color: rgba(255, 255, 255, 0.92);
}

.control-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}
.control-title {
  font-weight: 900;
  letter-spacing: 0.2px;
}
.control-legend {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  opacity: 0.95;
}
.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  display: inline-block;
}
.legend-dot.on {
  background: #22d3ee;
}
.legend-dot.off {
  background: rgba(148, 163, 184, 0.65);
}
.legend-text {
  font-size: 12px;
  margin-right: 10px;
}

.ctl-group {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
}
.ctl-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 10px;
}
.ctl-name {
  font-weight: 900;
  font-size: 14px;
}
.ctl-sub {
  margin-top: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.chip {
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  opacity: 0.95;
}
.safety {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.safety-label {
  font-size: 12px;
  font-weight: 800;
  opacity: 0.86;
}

.btn-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.btn {
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.92);
  border-radius: 12px;
  padding: 10px 10px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background 120ms ease, transform 120ms ease, border-color 120ms ease;
  user-select: none;
}
.btn i {
  font-size: 16px;
}
.btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(34, 211, 238, 0.35);
}
.btn:active:not(:disabled) {
  transform: translateY(1px);
}
.btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.btn.stop {
  background: rgba(239, 68, 68, 0.16);
  border-color: rgba(239, 68, 68, 0.35);
}
.btn.stop:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.22);
  border-color: rgba(239, 68, 68, 0.55);
}
.btn.subtle {
  padding: 8px 10px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
}

.group-actions {
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}
.warn {
  color: #fca5a5;
  font-size: 12px;
  font-weight: 800;
}

@media (max-width: 1199.98px) {
  .panel-grid {
    grid-template-columns: 1fr;
  }
  .control-card {
    padding: 12px;
  }
}
</style>
