<template>
  <div class="fork-side-panel" v-loading="!controlsEnabled" :element-loading-spinner="false"
    :element-loading-background="controlsEnabled ? 'rgba(0,0,0,0)' : 'rgba(255,255,255,0.55)'">
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
              <div class="metric-value">{{ formatNum(forkHeight) }}<span class="metric-unit">{{ $t('fork_viz_cm')
                  }}</span></div>
            </div>
            <div v-if="isHorizonEnabled" class="metric">
              <div class="metric-label">{{ $t('fork_viz_horizon') }}</div>
              <div class="metric-value">{{ formatNum(forkExtension) }}<span class="metric-unit">mm</span></div>
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
          <svg class="viz-svg" :viewBox="schem.viewBox" preserveAspectRatio="xMidYMid meet" role="img"
            :aria-label="$t('fork_side_panel_title')">
            <defs>
              <pattern id="dotGrid" width="18" height="18" patternUnits="userSpaceOnUse">
                <circle cx="1.5" cy="1.5" r="1.2" fill="rgba(100,116,139,0.22)" />
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
            <rect x="0" :y="schem.vbMinY" :width="schem.vbW" :height="schem.vbH" rx="6" class="schem-bg" />
            <rect x="0" :y="schem.vbMinY" :width="schem.vbW" :height="schem.vbH" rx="6" fill="url(#dotGrid)" />

            <!-- Mast + chassis (dark gray body) -->
            <path :d="schem.outlinePath" class="schem-body" />
            <!-- 立柱與底盤交接橫線 -->
            <line :x1="schem.bodyJoint.x1" :y1="schem.bodyJoint.y" :x2="schem.bodyJoint.x2" :y2="schem.bodyJoint.y"
              class="schem-body-joint" />

            <!-- 滑架：僅隨升降移動，水平固定；牙叉+擋片為剛體水平平移 -->
            <g :transform="`translate(0 ${schem.fork.translateY})`">
              <path :d="schem.carriagePath" class="schem-fork-assembly" />
              <g :transform="`translate(${schem.fork.translateX} 0)`">
                <path :d="schem.forkTinePath" class="schem-fork-assembly" />
                <rect v-if="isHorizonEnabled" :x="schem.triggerPlate.x" :y="schem.triggerPlate.y"
                  :width="schem.triggerPlate.w" :height="schem.triggerPlate.h" class="schem-trigger-plate" rx="0.5" />
              </g>

              <!-- Horizon sensors 固定在車體座標（不隨牙叉平移） -->
              <g v-if="isHorizonEnabled" class="sensors">
                <g v-for="mark in schem.horizonSensorMarks" :key="'h-' + mark.key">
                  <circle :cx="mark.x" :cy="mark.y" :r="schem.horizonSensorR" :class="sensorDotClass(mark.isOn)"
                    filter="url(#softGlow)" />
                  <path v-if="mark.leader" :d="mark.leader" class="sensor-leader" />
                  <text :x="mark.labelX" :y="mark.labelY" class="sensor-text sensor-text-center">{{ $t(mark.labelKey)
                    }}</text>
                </g>
              </g>
            </g>

            <!-- Vertical sensors embedded on mast (labels stagger with leaders when close) -->
            <g class="sensors">
              <g v-for="mark in schem.verticalSensorMarks" :key="mark.key">
                <circle :cx="mark.x" :cy="mark.y" :r="schem.sensorR" :class="sensorDotClass(mark.isOn)"
                  filter="url(#softGlow)" />
                <path v-if="mark.leader" :d="mark.leader" class="sensor-leader" />
                <text :x="mark.labelX" :y="mark.labelY" class="sensor-text sensor-text-left">{{ $t(mark.labelKey)
                  }}</text>
              </g>
            </g>

            <!-- Dimension: chassis top ↔ fork tine centerline (live height) -->
            <g v-if="schem.heightDim.visible" class="height-dim" aria-hidden="true">
              <!-- Extension ticks -->
              <line :x1="schem.heightDim.tickX1" :y1="schem.heightDim.yTop" :x2="schem.heightDim.tickX2"
                :y2="schem.heightDim.yTop" class="height-dim-tick" />
              <line :x1="schem.heightDim.tickX1" :y1="schem.heightDim.yBot" :x2="schem.heightDim.tickX2"
                :y2="schem.heightDim.yBot" class="height-dim-tick" />
              <!-- Vertical dimension line -->
              <line :x1="schem.heightDim.x" :y1="schem.heightDim.yTop" :x2="schem.heightDim.x"
                :y2="schem.heightDim.yBot" class="height-dim-line" />
              <!-- Arrowheads (filled triangles) -->
              <polygon :points="schem.heightDim.arrowTop" class="height-dim-arrow" />
              <polygon :points="schem.heightDim.arrowBot" class="height-dim-arrow" />
              <!-- Height label -->
              <text :x="schem.heightDim.labelX" :y="schem.heightDim.labelY" class="sensor-text height-dim-label">{{
                formatNum(forkHeight) }} {{ $t('fork_viz_cm') }}</text>
            </g>

            <!-- Dimension: chassis front ↔ fork tip (live extension overhang) -->
            <g v-if="schem.overhangDim.visible" class="overhang-dim" aria-hidden="true">
              <template v-if="schem.overhangDim.showLine">
                <!-- Extension ticks -->
                <line :x1="schem.overhangDim.xLeft" :y1="schem.overhangDim.tickY1" :x2="schem.overhangDim.xLeft"
                  :y2="schem.overhangDim.tickY2" class="height-dim-tick" />
                <line :x1="schem.overhangDim.xRight" :y1="schem.overhangDim.tickY1" :x2="schem.overhangDim.xRight"
                  :y2="schem.overhangDim.tickY2" class="height-dim-tick" />
                <!-- Horizontal dimension line -->
                <line :x1="schem.overhangDim.xLeft" :y1="schem.overhangDim.y" :x2="schem.overhangDim.xRight"
                  :y2="schem.overhangDim.y" class="height-dim-line" />
                <!-- Arrowheads (filled triangles) -->
                <polygon :points="schem.overhangDim.arrowLeft" class="height-dim-arrow" />
                <polygon :points="schem.overhangDim.arrowRight" class="height-dim-arrow" />
              </template>
              <!-- Overhang label：一律顯示，不因間距隱藏 -->
              <text :x="schem.overhangDim.labelX" :y="schem.overhangDim.labelY"
                class="sensor-text height-dim-label overhang-dim-label">{{ formatNum(schem.overhangDim.cm) }} {{
                  $t('fork_viz_cm')
                }}</text>
            </g>
          </svg>
        </div>
      </div>

      <div class="control-card">
        <div class="ctl-zones" :class="{ 'has-float-pin': isPinMounted }">
          <!-- 升降 -->
          <section class="ctl-zone ctl-zone--lift">
            <header class="zone-bar">
              <div class="zone-title">{{ $t('fork_ctl_lift') }}</div>
              <div class="zone-bar-actions">
                <div class="zone-safety">
                  <span class="zone-safety__label">{{ $t('fork_ctl_safety') }}</span>
                  <el-switch
                    :inline-prompt="true"
                    v-model="verticalActionSafetyProtection"
                    :active-text="$t('fork_ctl_on')"
                    :inactive-text="$t('fork_ctl_off')"
                    inactive-color="#ef4444" />
                </div>
                <button class="btn teach" type="button" @click="ShowTeachView">
                  <i class="bi bi-table"></i><span>{{ $t('fork_ctl_teach') }}</span>
                </button>
              </div>
            </header>

            <div class="zone-primary">
              <div class="btn-col">
                <button class="btn ctl" :disabled="btnDisabled('Vertical')" @click="forkAction('Vertical', 'up_limit')">
                  <i class="bi bi-chevron-bar-up"></i><span>{{ $t('up_limit_pose') }}</span>
                </button>
                <button class="btn ctl" :disabled="btnDisabled('Vertical')" @click="forkAction('Vertical', 'up')">
                  <i class="bi bi-chevron-up"></i><span>{{ $t('jog_positive') }}</span>
                </button>
                <div class="btn-mid-row">
                  <button class="btn ctl" :disabled="btnDisabled('Vertical')" @click="forkAction('Vertical', 'home')">
                    <i class="bi bi-house-fill"></i><span>{{ $t('original') }}</span>
                  </button>
                  <button class="btn ctl stop" :disabled="stopDisabled('Vertical')" @click="forkAction('Vertical', 'stop')">
                    <i class="bi bi-stop-circle-fill"></i><span>{{ $t('stop') }}</span>
                  </button>
                </div>
                <button class="btn ctl" :disabled="btnDisabled('Vertical')" @click="forkAction('Vertical', 'down')">
                  <i class="bi bi-chevron-down"></i><span>{{ $t('jog_navigate') }}</span>
                </button>
                <button class="btn ctl" :disabled="btnDisabled('Vertical')" @click="forkAction('Vertical', 'down_limit')">
                  <i class="bi bi-chevron-bar-down"></i><span>{{ $t('down_limit_pose') }}</span>
                </button>
              </div>
            </div>

            <div class="zone-secondary">
              <div class="sec-label">{{ $t('fork_ctl_advanced') }}</div>
              <div class="sec-actions">
                <button class="btn subtle" :disabled="btnDisabled('Vertical')" @click="forkAction('Vertical', 'up_search')">
                  <i class="bi bi-chevron-bar-up"></i><span>{{ $t('fork_ctl_up_search') }}</span>
                </button>
                <button class="btn subtle" :disabled="btnDisabled('Vertical')" @click="forkAction('Vertical', 'down_search')">
                  <i class="bi bi-chevron-bar-down"></i><span>{{ $t('fork_ctl_down_search') }}</span>
                </button>
                <button class="btn subtle" :disabled="findHomeDisabled('Vertical')" @click="findHome('Vertical')">
                  <i class="bi bi-bullseye"></i><span>{{ $t('fork_ctl_find_home') }}</span>
                </button>
              </div>
              <div class="sec-bypass">
                <div class="bypass-row">
                  <span class="bypass-label">{{ $t('fork_ctl_hw_bypass_label') }}</span>
                  <el-tag v-if="verticalHardwareBypass" class="bypass-tag" effect="dark" type="danger" size="large"
                    @click="ControlHardwareLimitSensor(true)">{{ $t('fork_ctl_bypass') }}</el-tag>
                  <el-tag v-else class="bypass-tag" effect="dark" type="success" size="large"
                    @click="ControlHardwareLimitSensor(false)">{{ $t('fork_ctl_no_bypass') }}</el-tag>
                </div>
                <div class="bypass-row">
                  <span class="bypass-label">{{ $t('fork_ctl_under_press_bypass_label') }}</span>
                  <el-tag v-if="verticalUnderPressingBypass" class="bypass-tag" effect="dark" type="danger" size="large"
                    @click="ControlUnderPressingSensorBypass(true)">{{ $t('fork_ctl_bypass') }}</el-tag>
                  <el-tag v-else class="bypass-tag" effect="dark" type="success" size="large"
                    @click="ControlUnderPressingSensorBypass(false)">{{ $t('fork_ctl_no_bypass') }}</el-tag>
                </div>
              </div>
            </div>
          </section>

          <!-- 浮動牙叉 -->
          <section v-if="isPinMounted" class="ctl-zone ctl-zone--float">
            <header class="zone-bar">
              <div class="zone-title">{{ $t('fork_ctl_float_pin') }}</div>
              <div class="zone-status">{{ floatPinStatusText }}</div>
            </header>
            <div class="zone-primary">
              <div class="btn-col">
                <button class="btn ctl" :disabled="floatPinLockDisabled" @click="ForkFloatPinDriverControlHandler(true)">
                  <i class="bi bi-lock-fill"></i><span>{{ $t('fork_ctl_float_lock') }}</span>
                </button>
                <button class="btn ctl" :disabled="floatPinReleaseDisabled" @click="ForkFloatPinDriverControlHandler(false)">
                  <i class="bi bi-unlock-fill"></i><span>{{ $t('fork_ctl_float_release') }}</span>
                </button>
                <button class="btn ctl warn" :disabled="floatPinInitDisabled" @click="ForkFloatPinInit()">
                  <i class="bi bi-arrow-repeat"></i><span>{{ $t('fork_ctl_float_init') }}</span>
                </button>
              </div>
            </div>
          </section>

          <!-- 伸縮 -->
          <section v-if="isHorizonEnabled" class="ctl-zone ctl-zone--telescope">
            <header class="zone-bar">
              <div class="zone-title">{{ $t('fork_ctl_telescope') }}</div>
              <div class="zone-safety">
                <span class="zone-safety__label">{{ $t('fork_ctl_safety') }}</span>
                <el-switch
                  :inline-prompt="true"
                  v-model="horizonActionSafetyProtection"
                  :active-text="$t('fork_ctl_on')"
                  :inactive-text="$t('fork_ctl_off')"
                  inactive-color="#ef4444" />
              </div>
            </header>

            <div class="zone-primary">
              <div class="btn-row">
                <button class="btn ctl" :disabled="btnDisabled('Horizon')" @click="forkAction('Horizon', 'down_limit')">
                  <i class="bi bi-chevron-double-left"></i><span>{{ $t('fork_retract') }}</span>
                </button>
                <button class="btn ctl" disabled :title="$t('fork_ctl_jog_disabled_hint')">
                  <i class="bi bi-chevron-left"></i><span>{{ $t('jog_navigate') }}</span>
                </button>
                <button class="btn ctl" :disabled="btnDisabled('Horizon')" @click="forkAction('Horizon', 'home')">
                  <i class="bi bi-house-fill"></i><span>{{ $t('original') }}</span>
                </button>
                <button class="btn ctl stop" :disabled="stopDisabled('Horizon')" @click="forkAction('Horizon', 'stop')">
                  <i class="bi bi-stop-circle-fill"></i><span>{{ $t('stop') }}</span>
                </button>
                <button class="btn ctl" disabled :title="$t('fork_ctl_jog_disabled_hint')">
                  <i class="bi bi-chevron-right"></i><span>{{ $t('jog_positive') }}</span>
                </button>
                <button class="btn ctl" :disabled="btnDisabled('Horizon')" @click="forkAction('Horizon', 'up_limit')">
                  <i class="bi bi-chevron-double-right"></i><span>{{ $t('fork_extend') }}</span>
                </button>
              </div>
            </div>

            <div class="zone-secondary zone-secondary--compact">
              <div class="sec-label">{{ $t('fork_ctl_advanced') }}</div>
              <div class="sec-actions">
                <button class="btn subtle" :disabled="findHomeDisabled('Horizon')" @click="findHome('Horizon')">
                  <i class="bi bi-bullseye"></i><span>{{ $t('fork_ctl_find_home') }}</span>
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>

    <el-drawer
      v-model="show_teach_page"
      direction="btt"
      size="99%"
      :title="$t('fork_ctl_teach_title')"
      @close="TeachDrawerClosingHandle">
      <forkTeachEditor ref="fork_teach"></forkTeachEditor>
    </el-drawer>
  </div>
</template>

<script>
import { ForkAPI } from '@/api/VMSAPI'
import { AGVStatusStore, DIOStore, ForkTeachStore, SystemSettingsStore, UserStore } from '@/store'
import { ROS_STORE } from '@/store/ros_store'
import { ElMessage } from 'element-plus'
import bus from '@/event-bus'
import forkTeachEditor from './WorkStation/ForkTeachEditor.vue'

function clamp01(n) {
  if (Number.isNaN(n)) return 0
  return Math.max(0, Math.min(1, n))
}

export default {
  name: 'ForkSideViewVisualization',
  components: {
    forkTeachEditor
  },
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
      isHorizonFindHomeProcessing: false,
      pinActionRunning: false,
      pinInitRunning: false,
      show_teach_page: false
    }
  },
  watch: {
    verticalHardwareBypass(newValue) {
      ElMessage({
        message: this.$t(newValue ? 'fork_ctl_hw_bypass_state_on' : 'fork_ctl_hw_bypass_state_off'),
        type: newValue ? 'error' : 'success',
        duration: 1000
      })
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
    isPinMounted() {
      if (!AGVStatusStore.getters.IsForkAGV || !SystemSettingsStore.getters.Settings) return false
      return SystemSettingsStore.getters.Settings.ForkAGV?.IsPinMounted === true
    },
    isPinModuleRosBase() {
      return AGVStatusStore.state.AGVStatus.IsPinMoudleRosBase
    },
    isPinFloatOutputOn() {
      return DIOStore.getters.IsPinFloatOuputON
    },
    pinState() {
      return ROS_STORE.getters.Pin_State || { pose: '' }
    },
    floatPinStatusText() {
      if (this.pinInitRunning) return this.$t('fork_ctl_float_initing')
      if (this.isPinModuleRosBase) {
        const pose = String(this.pinState?.pose || '').toUpperCase()
        return pose || '--'
      }
      return this.isPinFloatOutputOn
        ? this.$t('fork_ctl_float_release')
        : this.$t('fork_ctl_float_lock')
    },
    floatPinLockDisabled() {
      if (!this.controlsEnabled || this.pinInitRunning) return true
      if (this.isPinModuleRosBase) {
        return this.pinState?.pose === 'lock' || this.pinActionRunning
      }
      return !this.isPinFloatOutputOn
    },
    floatPinReleaseDisabled() {
      if (!this.controlsEnabled || this.pinInitRunning) return true
      if (this.isPinModuleRosBase) {
        return this.pinState?.pose === 'release' || this.pinActionRunning
      }
      return this.isPinFloatOutputOn
    },
    floatPinInitDisabled() {
      return !this.controlsEnabled || this.pinInitRunning
    },
    /** 繪圖用（mm）；實際顯示用 forkExtension。position<0 時切齊車頭 */
    forkExtensionDrawMm() {
      const pos = Number(this.forkExtension)
      if (!Number.isFinite(pos) || pos < 0) return 0
      return pos
    },
    /** 側視圖車體尺寸為 cm，將 mm 轉成 cm */
    forkExtensionCm() {
      return this.forkExtensionDrawMm / 10
    },
    verticalRatio() {
      const vH = Number(this.vehicleHeightCm)
      const h = Number(this.forkHeight)
      if (!Number.isFinite(vH) || vH <= 0) return 0
      if (!Number.isFinite(h)) return 0
      return clamp01(h / vH)
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
    horizonExtendSlowdownOn() {
      return DIOStore.getters.ForkHorizonExtendSlowdownSensorState
    },
    horizonRetractSlowdownOn() {
      return DIOStore.getters.ForkHorizonRetractSlowdownSensorState
    },

    verticalHardwareBypass() {
      return DIOStore.getters.Vertical_Hardware_limit_bypass
    },
    verticalUnderPressingBypass() {
      return DIOStore.getters.Vertical_Under_Pressing_Sensor_Bypass
    },

    schem() {
      const vLen = Number.isFinite(this.vehicleLengthCm) && this.vehicleLengthCm > 0 ? this.vehicleLengthCm : 145
      const vH = Number.isFinite(this.vehicleHeightCm) && this.vehicleHeightCm > 0 ? this.vehicleHeightCm : 200
      const vW = Number.isFinite(this.vehicleWidthCm) && this.vehicleWidthCm > 0 ? this.vehicleWidthCm : 90

      // Tight pads + higher scale so the L fills the viewBox; leave room for left sensor labels.
      const padX = 44
      const padY = 22
      const extensionCm = this.isHorizonEnabled ? this.forkExtensionCm : 0
      // 縮放只依設定最大全長，勿跟 live 伸出量，避免伸縮時整圖縮放
      const extendOverallForScale = Number(
        this.forkSettings?.VehielLengthWitchForkArmExtend
        ?? this.vehicleSettings?.ForkAGV?.VehielLengthWitchForkArmExtend
        ?? (vLen + 15)
      )
      const drawLen = Math.max(
        vLen,
        Number.isFinite(extendOverallForScale) ? extendOverallForScale : vLen
      )
      // Preferred drawing box (replaces old 900×420 with huge horizontal waste). Cap raised 2.2→4; slack 1.08/1.05→1.03/1.02.
      const availW = 500
      const availH = 360
      const scale = Math.max(0.6, Math.min(4, Math.min(availW / (drawLen * 1.03), availH / (vH * 1.02))))

      const mastH = vH * scale
      // 實際立柱較厚，示意加寬
      const mastW = Math.max(28, Math.min(52, Math.max(vW * 0.16, vH * 0.045) * scale))
      const baseLen = vLen * scale
      // 經典 L：底盤自門架底交界向下長
      const baseThick = Math.max(36, Math.min(64, Math.max(vW * 0.18, vH * 0.08) * scale))
      const forkThickness = Math.max(10, Math.min(16, baseThick * 0.35))
      const plateH = Math.max(forkThickness + 18, 30)

      // padX reserves label margin; modest extra for leaders
      const mastTop = padY
      const mastX = padX + 24
      const mast = { x: mastX, y: mastTop, w: mastW, h: mastH }
      // 底盤頂面 = 門架底交界
      const base = {
        x: mast.x - Math.max(6, mastW * 0.25),
        y: mast.y + mast.h,
        w: baseLen,
        h: baseThick
      }

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

      // 立柱與底盤頂面接續的橫向介面線
      const bodyJoint = {
        x1: mast.x,
        x2: base.x + base.w,
        y: base.y
      }

      // 行程：最低位時擋片底緣切齊底盤頂面，牙叉／滑架都在底盤之上（不貫穿）
      const yTop = mast.y + mast.h * 0.08
      const yBottom = base.y - plateH / 2
      const yAtHeight = (heightCm) => {
        const h = Number(heightCm)
        if (!Number.isFinite(h) || !Number.isFinite(vH) || vH <= 0) return yBottom
        const r = clamp01(h / vH)
        return yBottom - r * (yBottom - yTop)
      }
      const forkY = yBottom - this.verticalRatio * (yBottom - yTop)

      const carriageH = Math.max(36, Math.min(56, mastH * 0.16))
      const forkLocalBottom = forkThickness / 2
      // 縮回基準：牙叉＋擋片往左延伸，完全縮回時左緣約對齊滑架左側；前端切齊車頭
      const bodyFrontX = base.x + base.w
      const carriageHomeX = mast.x + mast.w - 3
      // 滑架略加寬承托牙叉／擋片，避免縮回時看起來懸空（勿過寬）
      const carriageW = Math.max(mastW * 2.2, 48)
      // 完全縮回：牙叉左緣 ≈ 滑架左緣
      const forkStartHomeX = carriageHomeX
      const forkLen = Math.max(24, bodyFrontX - forkStartHomeX)
      const forkLenMax = forkLen
      const forkHomeX = forkStartHomeX
      const extendOverallCm = Number(
        this.forkSettings?.VehielLengthWitchForkArmExtend
        ?? this.vehicleSettings?.ForkAGV?.VehielLengthWitchForkArmExtend
        ?? (vLen + 15)
      )
      const configExtraCm = Math.max(0, (Number.isFinite(extendOverallCm) ? extendOverallCm : vLen) - vLen)
      // driver position(mm)→cm：剛體只改 X；viewBox／最大行程用設定值，不跟 live 伸出
      const forkSlide = this.isHorizonEnabled ? extensionCm * scale : 0
      const maxTravelCm = configExtraCm
      const maxForkSlide = this.isHorizonEnabled ? maxTravelCm * scale : 0
      // 牙叉與擋片略上移
      const forkLiftUp = 6
      const carriage = {
        x: carriageHomeX,
        y: forkLocalBottom - carriageH,
        w: carriageW,
        h: carriageH
      }
      const fork = {
        x: forkHomeX,
        y: -forkLocalBottom - forkLiftUp,
        w: forkLen,
        h: forkThickness,
        translateY: forkY,
        translateX: forkSlide
      }

      // 剛體：牙叉 + 擋片（路徑用縮回基準座標，再以 translateX 平移；滑架水平固定）
      const cL = carriage.x
      const cR = carriage.x + carriage.w
      const cT = carriage.y
      const cB = carriage.y + carriage.h
      const fT = fork.y
      const fB = fork.y + fork.h
      const fL = fork.x
      const fTipHome = fork.x + fork.w
      const fTip = fTipHome + forkSlide
      const tipR = Math.min(6, forkThickness / 2)
      const carriagePath = [
        `M ${cL} ${cT}`,
        `L ${cR} ${cT}`,
        `L ${cR} ${cB}`,
        `L ${cL} ${cB}`,
        'Z'
      ].join(' ')
      const forkTinePath = [
        `M ${fL} ${fT}`,
        `L ${fTipHome - tipR} ${fT}`,
        `Q ${fTipHome} ${fT} ${fTipHome} ${fT + tipR}`,
        `L ${fTipHome} ${fB - tipR}`,
        `Q ${fTipHome} ${fB} ${fTipHome - tipR} ${fB}`,
        `L ${fL} ${fB}`,
        'Z'
      ].join(' ')

      // 供後續 sensor / viewBox 使用
      const forkStartX = forkStartHomeX
      const forkExtra = maxForkSlide

      const forkCfg = this.forkSettings
      const downPoseCm = Number(forkCfg?.DownlimitPose ?? 0)
      const upPoseCm = Number(forkCfg?.UplimitPose ?? 0)
      // Home sensor 位置用 StandbyPose，勿與下極限共用 DownlimitPose（即使 Home 動作走下極限）
      let homePoseCm = Number(forkCfg?.StandbyPose)
      if (!Number.isFinite(homePoseCm)) homePoseCm = downPoseCm

      const sensorR = Math.max(2.4, Math.min(3.2, mastW * 0.16))
      const horizonSensorR = Math.max(2.0, Math.min(2.8, mastW * 0.12))
      const minSensorDotGap = Math.max(14, sensorR * 3.2)

      let homeY = yAtHeight(homePoseCm)
      const downY = yAtHeight(Number.isFinite(downPoseCm) ? downPoseCm : 0)
      const upY = yAtHeight(Number.isFinite(upPoseCm) ? upPoseCm : 0)
      // SVG Y 向下增大：Home 應在下極限上方；過近時把 Home 往上錯開
      if (Math.abs(homeY - downY) < minSensorDotGap) {
        homeY = downY - minSensorDotGap
      }

      const verticalSensors = {
        up: { x: mast.x + mast.w / 2, y: upY },
        home: { x: mast.x + mast.w / 2, y: homeY },
        down: { x: mast.x + mast.w / 2, y: downY }
      }

      // 近距標記用引線錯開標籤，避免 Home / 下極限文字重疊
      const rawMarks = [
        { key: 'up', labelKey: 'fork_viz_up_limit', x: verticalSensors.up.x, y: verticalSensors.up.y, isOn: this.verticalUpLimitOn },
        { key: 'home', labelKey: 'fork_viz_home', x: verticalSensors.home.x, y: verticalSensors.home.y, isOn: this.verticalHomeOn },
        { key: 'down', labelKey: 'fork_viz_down_limit', x: verticalSensors.down.x, y: verticalSensors.down.y, isOn: this.verticalDownLimitOn }
      ].sort((a, b) => a.y - b.y)

      const minGap = Math.max(22, sensorR * 3.2)
      const labelYs = rawMarks.map((m) => m.y)
      for (let i = 1; i < labelYs.length; i++) {
        if (labelYs[i] - labelYs[i - 1] < minGap) {
          labelYs[i] = labelYs[i - 1] + minGap
        }
      }
      // 若底部被往下擠過頭，整組往上收一點
      const maxY = mast.y + mast.h + 8
      if (labelYs[labelYs.length - 1] > maxY) {
        const shift = labelYs[labelYs.length - 1] - maxY
        for (let i = 0; i < labelYs.length; i++) labelYs[i] -= shift
      }

      const verticalSensorMarks = rawMarks.map((m, i) => {
        const labelX = mast.x - 18
        const labelY = labelYs[i]
        const elbowX = mast.x - 8
        // 一律用折線引線：近距時標籤會被推開，引線接到真實 sensor 點
        const leader = `M ${m.x - sensorR - 1} ${m.y} L ${elbowX} ${m.y} L ${elbowX} ${labelY} L ${labelX - 2} ${labelY}`
        return {
          ...m,
          labelX,
          labelY: labelY + 4,
          leader
        }
      })

      // Horizon sensors：維持原間距，縮回極限對齊牙叉根部（縮回基準）
      const rootTravel = this.isHorizonEnabled ? Math.max(forkExtra, 0) : 0
      const travelEndX = forkStartX
      const travelStartX = forkStartX - rootTravel
      const horizonSensorCount = 4
      const minDotGap = Math.max(20, horizonSensorR * 5)
      const minStripWidth = minDotGap * (horizonSensorCount - 1)
      const stripWidth = Math.max(travelEndX - travelStartX, minStripWidth)
      // 牙叉+擋片縮回時最左側 = 牙叉根部
      const stripStartX = forkStartHomeX
      // 伸縮 sensor 放在牙叉底與擋片底之間，避免掉進底盤
      const sensorYBelow = Math.min(
        plateH / 2 - horizonSensorR - 1,
        forkLocalBottom + Math.max(8, (plateH / 2 - forkLocalBottom) * 0.55)
      )
      const horizonXs = Array.from({ length: horizonSensorCount }, (_, i) =>
        stripStartX + (stripWidth * i) / (horizonSensorCount - 1)
      )
      const horizonSensors = {
        retract: { x: horizonXs[0], y: sensorYBelow },
        retractSlowdown: { x: horizonXs[1], y: sensorYBelow },
        extendSlowdown: { x: horizonXs[2], y: sensorYBelow },
        extend: { x: horizonXs[3], y: sensorYBelow }
      }

      // 標籤水平／垂直皆錯開，避免文字重疊
      const horizonRawMarks = [
        { key: 'retract', labelKey: 'fork_viz_retract_limit', x: horizonSensors.retract.x, y: horizonSensors.retract.y, isOn: this.horizonRetractOn },
        { key: 'retractSlowdown', labelKey: 'fork_viz_retract_slowdown', x: horizonSensors.retractSlowdown.x, y: horizonSensors.retractSlowdown.y, isOn: this.horizonRetractSlowdownOn },
        { key: 'extendSlowdown', labelKey: 'fork_viz_extend_slowdown', x: horizonSensors.extendSlowdown.x, y: horizonSensors.extendSlowdown.y, isOn: this.horizonExtendSlowdownOn },
        { key: 'extend', labelKey: 'fork_viz_extend_limit', x: horizonSensors.extend.x, y: horizonSensors.extend.y, isOn: this.horizonExtendOn }
      ]

      const hMinGap = Math.max(52, minDotGap * 1.6)
      const labelXs = horizonRawMarks.map((m) => m.x)
      for (let i = 1; i < labelXs.length; i++) {
        // 僅「縮回極限」做水平錯開；減速／伸出側標籤貼近圓圈
        if (horizonRawMarks[i].key !== 'retract') continue
        if (labelXs[i] - labelXs[i - 1] < hMinGap) {
          labelXs[i] = labelXs[i - 1] + hMinGap
        }
      }

      const labelBelowBaseY = sensorYBelow + horizonSensorR + 12
      const labelAboveBaseY = sensorYBelow - horizonSensorR - 10
      const yStep = 12
      const horizonSensorMarks = this.isHorizonEnabled
        ? horizonRawMarks.map((m, i) => {
          const labelAbove = m.key === 'extendSlowdown' || m.key === 'extend'
          if (labelAbove) {
            // 伸出側：標籤緊貼圓圈上方，僅小幅垂直錯開
            const aboveIndex = m.key === 'extend' ? 1 : 0
            const labelX = m.x
            const labelY = labelAboveBaseY - aboveIndex * yStep
            const elbowY = sensorYBelow - horizonSensorR - 4 - aboveIndex * 2
            const leader = `M ${m.x} ${m.y - horizonSensorR - 1} L ${m.x} ${elbowY} L ${labelX} ${elbowY} L ${labelX} ${labelY + 4}`
            return { ...m, labelX, labelY, labelAbove, leader }
          }
          if (m.key === 'retractSlowdown') {
            // 縮回減速：緊貼圓圈下方
            const labelX = m.x
            const labelY = labelBelowBaseY
            const elbowY = sensorYBelow + horizonSensorR + 4
            const leader = `M ${m.x} ${m.y + horizonSensorR + 1} L ${m.x} ${elbowY} L ${labelX} ${elbowY} L ${labelX} ${labelY - 4}`
            return { ...m, labelX, labelY, labelAbove: false, leader }
          }
          // 縮回極限：下方並略水平錯開
          const labelX = labelXs[i]
          const labelY = labelBelowBaseY + yStep
          const elbowY = sensorYBelow + horizonSensorR + 5
          const leader = `M ${m.x} ${m.y + horizonSensorR + 1} L ${m.x} ${elbowY} L ${labelX} ${elbowY} L ${labelX} ${labelY - 6}`
          return { ...m, labelX, labelY, labelAbove: false, leader }
        })
        : []

      // 擋片在牙叉根部左側；完全縮回時左緣約對齊滑架左側
      const plateW = Math.max(3, Math.min(5, forkThickness * 0.32))
      const triggerPlate = {
        x: fork.x,
        y: -plateH / 2 - forkLiftUp,
        w: plateW,
        h: plateH
      }

      // Classic vertical dimension: chassis top (base.y) ↔ fork tine centerline (forkY)
      // Place just outside chassis front so it sits in the fork span without covering the L body.
      const dimX = bodyFrontX + 18
      const dimYTop = Math.min(forkY, base.y)
      const dimYBot = Math.max(forkY, base.y)
      const dimGap = dimYBot - dimYTop
      const dimMinGap = 14
      const dimVisible = dimGap >= dimMinGap
      const arrowH = 7
      const arrowHalfW = 4.5
      const tickHalf = 7
      const heightDim = {
        visible: dimVisible,
        x: dimX,
        yTop: dimYTop,
        yBot: dimYBot,
        tickX1: dimX - tickHalf,
        tickX2: dimX + tickHalf,
        arrowTop: `${dimX},${dimYTop} ${dimX - arrowHalfW},${dimYTop + arrowH} ${dimX + arrowHalfW},${dimYTop + arrowH}`,
        arrowBot: `${dimX},${dimYBot} ${dimX - arrowHalfW},${dimYBot - arrowH} ${dimX + arrowHalfW},${dimYBot - arrowH}`,
        labelX: dimX + 10,
        labelY: (dimYTop + dimYBot) / 2 + 4
      }

      // Classic horizontal dimension: chassis front (bodyFrontX) ↔ fork tip (fTip)
      // Place just above the fork tine so it stays clear of crowding below / vertical height dim.
      const ohXLeft = Math.min(bodyFrontX, fTip)
      const ohXRight = Math.max(bodyFrontX, fTip)
      const ohGap = ohXRight - ohXLeft
      const ohMinGap = 14
      const ohShowLine = ohGap >= ohMinGap
      // 伸縮啟用時一律顯示伸出量，不因間距太小而隱藏
      const ohVisible = this.isHorizonEnabled
      const ohY = forkY - forkThickness / 2 - 16 - forkLiftUp
      const overhangCm = Math.max(0, extensionCm)
      const overhangDim = {
        visible: ohVisible,
        showLine: ohShowLine,
        xLeft: ohXLeft,
        xRight: ohXRight,
        y: ohY,
        cm: overhangCm,
        tickY1: ohY - tickHalf,
        tickY2: ohY + tickHalf,
        arrowLeft: `${ohXLeft},${ohY} ${ohXLeft + arrowH},${ohY - arrowHalfW} ${ohXLeft + arrowH},${ohY + arrowHalfW}`,
        arrowRight: `${ohXRight},${ohY} ${ohXRight - arrowH},${ohY - arrowHalfW} ${ohXRight - arrowH},${ohY + arrowHalfW}`,
        labelX: ohShowLine ? (ohXLeft + ohXRight) / 2 : ohXRight + 36,
        labelY: ohY - 8
      }

      // viewBox 依設定最大行程固定，伸縮時比例不變
      const horizonLabelExtra = this.isHorizonEnabled ? 78 : 12
      const horizonLabelRight = this.isHorizonEnabled && horizonSensorMarks.length
        ? Math.max(...horizonSensorMarks.map((m) => m.labelX)) + 48
        : 0
      const contentRight = Math.max(
        base.x + base.w,
        bodyFrontX + maxForkSlide + horizonLabelExtra,
        forkStartX + forkLenMax + maxForkSlide + 16,
        mast.x + mast.w + carriageW + 8,
        dimX + 72,
        horizonLabelRight
      )
      // Size for fork at lowest pose (full vertical travel) — do not tie vbH to live forkY
      // Horizon labels live in fork-local Y; pad from lowest fork pose so leaders aren't clipped
      const belowLabelYs = horizonSensorMarks.filter((m) => !m.labelAbove).map((m) => m.labelY)
      const aboveLabelYs = horizonSensorMarks.filter((m) => m.labelAbove).map((m) => m.labelY)
      const horizonLabelPad = this.isHorizonEnabled && belowLabelYs.length
        ? Math.max(...belowLabelYs) + 10
        : (this.isHorizonEnabled ? 52 : 8)
      const forkBottom = yBottom + Math.max(forkThickness / 2, 0) + horizonLabelPad
      const labelBottom = Math.max(...verticalSensorMarks.map((m) => m.labelY))
      const contentBottom = Math.max(base.y + base.h, forkBottom, labelBottom) + 10
      // Expand viewBox upward when overhang dim + label sit near/above y=0
      const overhangTop = ohVisible ? (ohY - 22) : 0
      // 伸出側上方標籤：以最高行程估算上緣，避免裁切
      const horizonAboveTop = this.isHorizonEnabled && aboveLabelYs.length
        ? yTop + Math.min(...aboveLabelYs) - 10
        : 0
      const vbMinY = Math.min(0, Math.floor(overhangTop), Math.floor(horizonAboveTop))
      const vbW = Math.ceil(Math.max(contentRight + 16, 360))
      const vbH = Math.ceil(Math.max(contentBottom - vbMinY + 8, 300))
      const viewBox = `0 ${vbMinY} ${vbW} ${vbH}`

      return {
        mast,
        base,
        outlinePath,
        bodyJoint,
        carriage,
        fork,
        carriagePath,
        forkTinePath,
        verticalSensors,
        verticalSensorMarks,
        horizonSensors,
        horizonSensorMarks,
        triggerPlate,
        heightDim,
        overhangDim,
        sensorR,
        horizonSensorR,
        vbMinY,
        vbW,
        vbH,
        viewBox
      }
    }
  },
  created() {
    bus.on('open-fork-teach-table', this.ShowTeachView)
  },
  beforeUnmount() {
    bus.off('open-fork-teach-table', this.ShowTeachView)
  },
  methods: {
    formatNum(val) {
      const n = Number(val)
      if (!Number.isFinite(n)) return '--'
      return n.toFixed(2)
    },
    ShowTeachView() {
      this.show_teach_page = true
      this.$nextTick(() => {
        if (this.$refs.fork_teach) {
          this.$refs.fork_teach.reload()
        }
      })
    },
    TeachDrawerClosingHandle() {
      if (!ForkTeachStore.getters.IsAnyChanged) return
      this.$swal.fire({
        icon: 'warning',
        text: this.$t('fork_ctl_teach_unsaved_leave'),
        showConfirmButton: true,
        showCancelButton: true
      }).then((user_response) => {
        if (!user_response.isConfirmed) {
          this.show_teach_page = true
        }
      })
    },
    async ForkFloatPinInit() {
      this.pinInitRunning = true
      ElMessage.warning(this.$t('fork_ctl_float_initing'))
      try {
        const result = await ForkAPI.PIN_INIT()
        if (!result.confirm) {
          this.$swal.fire({
            text: '',
            title: result.message,
            icon: 'error',
            showCancelButton: false,
            confirmButtonText: 'OK',
            customClass: 'my-sweetalert'
          })
        } else {
          this.$swal.fire({
            title: this.$t('fork_ctl_float_init_success_title'),
            text: this.$t('fork_ctl_float_init_success_text'),
            icon: 'success',
            showCancelButton: false,
            confirmButtonText: 'OK',
            customClass: 'my-sweetalert'
          })
        }
      } catch (error) {
        this.$swal.fire({
          text: error?.message || String(error),
          title: this.$t('fork_ctl_float_init_failed_title'),
          icon: 'error',
          showCancelButton: false,
          confirmButtonText: 'OK',
          customClass: 'my-sweetalert'
        })
      } finally {
        this.pinInitRunning = false
      }
    },
    async ForkFloatPinDriverControlHandler(isLock) {
      this.pinActionRunning = true
      try {
        const result = isLock
          ? await ForkAPI.PIN_LOCK()
          : await ForkAPI.PIN_RELEASE()
        if (!result.confirm) {
          this.$swal.fire({
            text: '',
            title: result.message,
            icon: 'error',
            showCancelButton: false,
            confirmButtonText: 'OK',
            customClass: 'my-sweetalert'
          })
        }
      } finally {
        this.pinActionRunning = false
      }
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
    ControlHardwareLimitSensor(active) {
      // active === currently bypassed (ON). Click Bypass → turn OFF; click No-Bypass → confirm then ON.
      if (!active) {
        this.$swal.fire({
          title: this.$t('fork_ctl_hw_bypass_enable_confirm'),
          text: '',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'OK',
          cancelButtonText: this.$t('fork_ctl_cancel'),
          customClass: 'my-sweetalert'
        }).then(res => {
          if (!res.isConfirmed) return
          DIOStore.dispatch('ControlHardwareLimiSensor', true)
        })
      } else {
        DIOStore.dispatch('ControlHardwareLimiSensor', !active)
      }
    },
    ControlUnderPressingSensorBypass(active) {
      if (!active) {
        this.$swal.fire({
          title: this.$t('fork_ctl_under_press_bypass_enable_confirm'),
          text: '',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'OK',
          cancelButtonText: this.$t('fork_ctl_cancel'),
          customClass: 'my-sweetalert'
        }).then(res => {
          if (!res.isConfirmed) return
          DIOStore.dispatch('ControlUnderPressingSensorBypass', true)
        })
      } else {
        DIOStore.dispatch('ControlUnderPressingSensorBypass', !active)
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
  height: 100%;
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
  position: relative;
  overflow: auto;
  box-sizing: border-box;
  /* edge 留白 — content inset from panel border */
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
}

.disable-hint {
  color: #b91c1c;
  font-weight: 700;
  margin: 4px 2px 8px;
  flex-shrink: 0;
}

.panel-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.35fr);
  gap: 8px;
  align-items: stretch;
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
}

.viz-card,
.control-card {
  border-radius: 6px;
  border: 1px solid #d8dee6;
  overflow: hidden;
  background: #f7f8fa;
  min-height: 0;
  min-width: 0;
  height: 100%;
}

.viz-card {
  background: #f3f5f7;
  display: flex;
  flex-direction: column;
}

.viz-header {
  padding: 8px 10px 6px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  flex-shrink: 0;
}

.viz-title-text {
  color: #1f2937;
  font-weight: 800;
  letter-spacing: 0.2px;
}

.viz-metrics {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.metric {
  padding: 4px 8px;
  border-radius: 4px;
  background: #ffffff;
  border: 1px solid #d8dee6;
  min-width: 84px;
}

.metric.small {
  min-width: 64px;
}

.metric-label {
  font-size: 12px;
  color: #6b7280;
}

.metric-value {
  font-variant-numeric: tabular-nums;
  color: #111827;
  font-weight: 800;
  font-size: 15px;
}

.metric-unit {
  font-size: 12px;
  font-weight: 700;
  margin-left: 4px;
  opacity: 0.8;
}

.viz-surface {
  padding: 4px 6px 6px;
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  align-items: stretch;
}

.viz-svg {
  width: 100%;
  height: 100%;
  display: block;
}

.schem-bg {
  fill: #eef1f4;
}

.schem-outline,
.schem-body {
  /* 深灰車體（立柱＋底盤） */
  fill: #3a3d42;
  stroke: #2a2d32;
  stroke-width: 3.5;
  stroke-linejoin: miter;
  stroke-linecap: square;
}

.schem-body-joint {
  stroke: #1f2226;
  stroke-width: 3;
  stroke-linecap: square;
}

.schem-carriage {
  fill: transparent;
  stroke: rgba(226, 232, 240, 0.72);
  stroke-width: 3;
}

.schem-fork-assembly {
  /* 莫蘭迪藍牙叉／滑架結構 */
  fill: #7a93a8;
  stroke: #5f7588;
  stroke-width: 3.25;
  stroke-linejoin: miter;
  stroke-linecap: square;
}

.schem-trigger-plate {
  /* 機構根部觸發薄板 — 略深於牙叉莫蘭迪藍 */
  fill: #5a7388;
  stroke: #455a6b;
  stroke-width: 1.5;
  stroke-linejoin: miter;
}

.schem-fork {
  fill: transparent;
  stroke: rgba(226, 232, 240, 0.78);
  stroke-width: 4;
}

.sensor-dot {
  stroke: rgba(31, 41, 55, 0.25);
  stroke-width: 2;
}

.sensor-on {
  fill: #0ea5e9;
}

.sensor-off {
  fill: #94a3b8;
}

.sensor-text {
  fill: #1f2937;
  font-size: 8px;
  font-weight: 700;
  paint-order: stroke;
  stroke: rgba(255, 255, 255, 0.85);
  stroke-width: 2px;
}

.sensor-text-left {
  text-anchor: end;
}

.sensor-text-center {
  text-anchor: middle;
}

.sensor-leader {
  fill: none;
  stroke: rgba(71, 85, 105, 0.45);
  stroke-width: 1.25;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.height-dim-line,
.height-dim-tick {
  fill: none;
  stroke: #475569;
  stroke-width: 1.35;
  stroke-linecap: square;
}

.height-dim-arrow {
  fill: #475569;
  stroke: #475569;
  stroke-width: 0.5;
  stroke-linejoin: miter;
}

.height-dim-label {
  fill: #334155;
  font-size: 11px;
  font-weight: 700;
  text-anchor: start;
  font-variant-numeric: tabular-nums;
}

.overhang-dim-label {
  text-anchor: middle;
}

.control-card {
  background: #f3f4f6;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: #1f2937;
  width: 100%;
}

.ctl-zones {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  width: 100%;

  &.has-float-pin {
    grid-template-columns: minmax(0, 1fr) 156px;
    grid-template-areas:
      "lift float"
      "telescope telescope";
  }

  &:not(.has-float-pin) {
    .ctl-zone--lift,
    .ctl-zone--telescope {
      grid-column: 1 / -1;
    }
  }
}

.ctl-zone--lift {
  grid-area: lift;
}

.ctl-zone--float {
  grid-area: float;
}

.ctl-zone--telescope {
  grid-area: telescope;
}

.ctl-zones:not(.has-float-pin) .ctl-zone--lift {
  grid-area: auto;
}

.ctl-zones:not(.has-float-pin) .ctl-zone--telescope {
  grid-area: auto;
}

.ctl-zone {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  background: #ffffff;
  border: 1px solid #d8dee6;
  border-radius: 6px;
  padding: 0;
  overflow: hidden;
}

.zone-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
}

.zone-title {
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: #111827;
  white-space: nowrap;
}

.zone-status {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #64748b;
  font-variant-numeric: tabular-nums;
}

.zone-bar-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.zone-safety {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.zone-safety__label {
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  white-space: nowrap;
}

:deep(.el-drawer__header) {
  height: 30px !important;
  padding-bottom: 0 !important;
  margin-bottom: 0 !important;
}

.zone-primary {
  padding: 0 10px;
}

.zone-secondary {
  margin-top: auto;
  padding: 8px 10px;
  border-top: 1px solid #eef2f7;
  background: #fafbfc;
  display: flex;
  flex-direction: column;
  gap: 6px;

  &--compact {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.sec-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #94a3b8;
}

.sec-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.sec-bypass {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 4px;
  border-top: 1px dashed #e5e7eb;
}

.btn-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
}

.btn-col>.btn {
  width: 100%;
}

.btn-mid-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
}

.btn-row {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: 4px;
  align-items: stretch;
  width: 100%;
}

.btn-row>.btn {
  flex: 1 1 0;
  min-width: 0;
  padding: 7px 4px;
}

.btn {
  border: 1px solid #cfd6de;
  background: #ffffff;
  color: #1f2937;
  border-radius: 4px;
  padding: 7px 8px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: background 120ms ease, transform 120ms ease, border-color 120ms ease;
  user-select: none;
}

.btn i {
  font-size: 16px;
}

.btn:hover:not(:disabled) {
  background: #f0f4f8;
  border-color: #94a3b8;
}

.btn:active:not(:disabled) {
  transform: translateY(1px);
}

.btn.teach {
  width: auto;
  min-height: 30px;
  padding: 0 10px;
  border-color: #2563eb;
  background: #2563eb;
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
}

.btn.teach:hover:not(:disabled) {
  background: #1d4ed8;
  border-color: #1d4ed8;
  color: #ffffff;
}

.btn.teach:active:not(:disabled) {
  background: #1e40af;
  border-color: #1e40af;
}

.btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn.stop {
  background: #fef2f2;
  border-color: #fca5a5;
  color: #b91c1c;
}

.btn.stop:hover:not(:disabled) {
  background: #fee2e2;
  border-color: #f87171;
}

.btn.warn {
  background: #fffbeb;
  border-color: #fcd34d;
  color: #b45309;
}

.btn.warn:hover:not(:disabled) {
  background: #fef3c7;
  border-color: #fbbf24;
}

.btn.subtle {
  padding: 5px 8px;
  border-radius: 4px;
  background: #ffffff;
  font-size: 12px;
}

.bypass-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.bypass-label {
  color: #b91c1c;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

.bypass-tag {
  cursor: pointer;
  user-select: none;
}

.warn {
  color: #b91c1c;
  font-size: 12px;
  font-weight: 800;
}

/* 內容區常小於視窗（有側欄／tab），以容器寬為準 */
@media (max-width: 1199.98px) {
  .panel-grid {
    grid-template-columns: 1fr;
  }

  .control-card {
    padding: 8px;
  }
}

@media (max-width: 1024px) {
  .panel-grid {
    grid-template-columns: 1fr;
  }

  .viz-metrics {
    gap: 4px;
  }

  .metric {
    min-width: 72px;
    padding: 3px 6px;
  }

  .ctl-zones.has-float-pin {
    grid-template-columns: minmax(0, 1fr) 140px;
  }

  .btn-row>.btn {
    min-width: 48px;
    padding: 6px 3px;
    font-size: 12px;
  }
}

@media (max-height: 800px) {
  .fork-side-panel {
    min-height: 0;
  }

  .viz-surface {
    padding: 4px 6px 6px;
  }

  .zone-bar {
    padding: 6px 8px;
  }

  .zone-primary {
    padding: 0 8px;
  }

  .zone-secondary {
    padding: 6px 8px;
  }

  .btn-col,
  .btn-mid-row,
  .btn-row {
    gap: 3px;
  }
}
</style>
