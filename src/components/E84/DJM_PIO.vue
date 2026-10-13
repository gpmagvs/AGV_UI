<template>
  <div class="djm-pio">
    <!-- Header: Mode + EQ 前端模擬 -->
    <div class="hs-header">
      <div class="mode-badge" :class="modeClass">{{ modeLabel }}</div>
      <div v-if="IsGodUse" class="eq-sim-switch" @click.stop>
        <el-switch
          v-model="eqSimulateEnabled"
          inline-prompt
          active-text="EQ模擬"
          inactive-text="實機"
          @change="onEqSimulateToggle"
        />
      </div>
    </div>
    <div v-if="eqSimulateEnabled" class="eq-sim-banner">
      EQ 前端模擬中：點擊下方 EQ 信號可本機開關，不會送到後端
    </div>

    <!-- Dual-lane signal board (AGV top / EQ bottom) -->
    <div class="signal-board">
      <div class="lane agv-lane">
        <div class="lane-title">
          <span class="lane-dot agv"></span>
          AGV（輸出 PIO）
        </div>
        <div class="signal-row">
          <button
            v-for="sig in agvSignals"
            :key="sig.key"
            type="button"
            class="signal-chip"
            :class="{
              on: sig.on,
              muted: sig.muted,
              editable: IsGodUse,
            }"
            :title="sig.fullName"
            :disabled="!IsGodUse"
            @click="SignalWriteChangeHandler('AGV', sig.key)"
          >
            <span class="chip-name">{{ sig.short }}</span>
            <span class="chip-state">{{ sig.on ? 'ON' : 'OFF' }}</span>
          </button>
        </div>
      </div>

      <div class="lane-divider" aria-hidden="true"></div>

      <div class="lane eq-lane" :class="{ simulating: eqSimulateEnabled }">
        <div class="lane-title">
          <span class="lane-dot eq"></span>
          EQ（輸入 PIO）
          <span v-if="eqSimulateEnabled" class="sim-tag">本機模擬</span>
        </div>
        <div class="signal-row">
          <button
            v-for="sig in eqSignals"
            :key="sig.key"
            type="button"
            class="signal-chip"
            :class="{
              on: sig.on,
              muted: sig.muted,
              editable: canToggleEqSignal,
            }"
            :title="eqSimulateEnabled ? `${sig.fullName}（前端模擬切換）` : sig.fullName"
            :disabled="!canToggleEqSignal"
            @click="EqSignalClickHandler(sig.key)"
          >
            <span class="chip-name">{{ sig.short }}</span>
            <span class="chip-state">{{ sig.on ? 'ON' : 'OFF' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Timer cards -->
    <div class="timer-section" @click="HandleTimerTBClick">
      <div class="timer-section-title">
        交握 Timer
        <span v-if="IsGodUse" class="timer-hint">（點擊開啟逾時設定）</span>
      </div>
      <div v-if="timerCards.length" class="timer-cards">
        <div
          v-for="timer in timerCards"
          :key="timer.name"
          class="timer-card"
          :class="{
            active: timer.active,
            overtime: timer.overtime,
          }"
        >
          <div class="timer-card-head">
            <span class="timer-name">{{ timer.name }}</span>
            <span class="timer-condition">{{ timer.condition }}</span>
          </div>
          <div class="timer-values">
            <span>PV {{ formatTimerValue(timer.pv) }}</span>
            <span class="sep">/</span>
            <span>SV {{ formatTimerValue(timer.sv) }}</span>
          </div>
          <div class="timer-bar">
            <div
              class="timer-bar-fill"
              :style="{ width: `${timer.progressPercent}%` }"
            ></div>
          </div>
        </div>
      </div>
      <div v-else class="timer-empty">尚無 Timer 資料</div>
    </div>
  </div>
</template>

<script>
import { AGVStatusStore, UserStore, SystemSettingsStore } from '@/store'
import { DIO } from '@/api/VMSAPI'
import bus from '@/event-bus.js'

export default {
  props: {
    Owner: {
      type: String,
      default: 'AGV',
    },
  },
  data() {
    return {
      /** 本輪曾見到的 REQ 方向；VALID 當下尚未收到 REQ 時為 null */
      lastKnownReqType: null, // 'LOAD' | 'UNLOAD' | null
      /** 僅前端模擬 EQ 輸入，不經後端 */
      eqSimulateEnabled: false,
      eqSimulatedSignals: {
        EQ_L_REQ: false,
        EQ_U_REQ: false,
        EQ_READY: false,
        EQ_BUSY: false,
        EQ_GO: false,
      },
    }
  },
  watch: {
    'eqState.EQ_L_REQ'(on) {
      if (on) this.lastKnownReqType = 'LOAD'
    },
    'eqState.EQ_U_REQ'(on) {
      if (on) this.lastKnownReqType = 'UNLOAD'
    },
    handshakeMode(mode) {
      if (mode === 'IDLE' && !this.eqSimulateEnabled) this.lastKnownReqType = null
    },
  },
  computed: {
    IsGodUse() {
      return UserStore.getters.IsGodUser
    },
    canToggleEqSignal() {
      return this.eqSimulateEnabled || this.IsGodUse
    },
    HandshakeSignals() {
      return AGVStatusStore.getters.Handshake_Signals
    },
    HSTimers() {
      return AGVStatusStore.getters.HSTimers
    },
    HSTimerSettings() {
      return SystemSettingsStore.getters.Settings?.EQHSTimeouts
    },
    agvState() {
      return this.HandshakeSignals?.AGV || {}
    },
    /** 實機 EQ（store） */
    realEqState() {
      return this.HandshakeSignals?.EQ || {}
    },
    /** 流程推導用：模擬開啟時改用本機 EQ 狀態 */
    eqState() {
      if (this.eqSimulateEnabled) {
        return { ...this.eqSimulatedSignals }
      }
      return this.realEqState
    },
    /** Load / Unload / Idle */
    handshakeMode() {
      const eq = this.eqState
      if (eq.EQ_L_REQ) return 'LOAD'
      if (eq.EQ_U_REQ) return 'UNLOAD'
      // VALID 已起但尚未 REQ：尚不知方向，暫標 Idle 流程中
      if (this.agvState.AGV_VALID || this.agvState.AGV_TR_REQ || this.agvState.AGV_BUSY || this.agvState.AGV_COMPT) {
        return 'HANDSHAKING'
      }
      return 'IDLE'
    },
    modeLabel() {
      switch (this.handshakeMode) {
        case 'LOAD':
          return 'Load 放貨'
        case 'UNLOAD':
          return 'Unload 取貨'
        case 'HANDSHAKING':
          return '交握中'
        default:
          return 'Idle 待機'
      }
    },
    modeClass() {
      return {
        load: this.handshakeMode === 'LOAD',
        unload: this.handshakeMode === 'UNLOAD',
        busy: this.handshakeMode === 'HANDSHAKING',
        idle: this.handshakeMode === 'IDLE',
      }
    },
    /** 目前是否已能判定 Load / Unload（有 L_REQ 或 U_REQ，或本輪曾見過） */
    isReqDirectionKnown() {
      return this.eqState.EQ_L_REQ || this.eqState.EQ_U_REQ || !!this.lastKnownReqType
    },
    activeReqKey() {
      if (this.eqState.EQ_L_REQ) return 'EQ_L_REQ'
      if (this.eqState.EQ_U_REQ) return 'EQ_U_REQ'
      if (this.lastKnownReqType === 'LOAD') return 'EQ_L_REQ'
      if (this.lastKnownReqType === 'UNLOAD') return 'EQ_U_REQ'
      return null
    },
    /** 已知方向時為 L_REQ / U_REQ；VALID 後尚未收到 REQ 時為 L/U_REQ */
    activeReqShort() {
      if (this.activeReqKey === 'EQ_U_REQ') return 'U_REQ'
      if (this.activeReqKey === 'EQ_L_REQ') return 'L_REQ'
      return 'L/U_REQ'
    },
    agvSignals() {
      const defs = [
        { key: 'AGV_VALID', short: 'VALID', fullName: 'AGV_VALID' },
        { key: 'AGV_TR_REQ', short: 'TR_REQ', fullName: 'AGV_TR_REQ' },
        { key: 'AGV_BUSY', short: 'BUSY', fullName: 'AGV_BUSY' },
        { key: 'AGV_COMPT', short: 'COMPT', fullName: 'AGV_COMPT' },
        { key: 'AGV_READY', short: 'AGV_READY', fullName: 'AGV_READY' },
      ]
      return defs.map((d) => ({
        ...d,
        on: !!this.agvState[d.key],
        muted: false,
      }))
    },
    eqSignals() {
      const mode = this.handshakeMode
      const defs = [
        { key: 'EQ_L_REQ', short: 'L_REQ', fullName: 'EQ_L_REQ' },
        { key: 'EQ_U_REQ', short: 'U_REQ', fullName: 'EQ_U_REQ' },
        { key: 'EQ_READY', short: 'EQ_READY', fullName: 'EQ_READY' },
        { key: 'EQ_BUSY', short: 'EQ_BUSY', fullName: 'EQ_BUSY' },
        { key: 'EQ_GO', short: 'GO', fullName: 'EQ_GO' },
      ]
      return defs.map((d) => {
        let muted = false
        // 僅在已確認方向後淡化另一側 REQ
        if (this.isReqDirectionKnown) {
          if (d.key === 'EQ_L_REQ' && (mode === 'UNLOAD' || this.lastKnownReqType === 'UNLOAD')) muted = true
          if (d.key === 'EQ_U_REQ' && (mode === 'LOAD' || this.lastKnownReqType === 'LOAD')) muted = true
        }
        if (d.key === 'EQ_GO' && !this.eqState.EQ_GO) muted = true
        return {
          ...d,
          on: !!this.eqState[d.key],
          muted,
        }
      })
    },
    HsTimerData() {
      if (!this.HSTimerSettings || !this.HSTimers) return []
      const reqLabel = this.isReqDirectionKnown ? this.activeReqShort : 'L/U_REQ'
      return [
        {
          name: 'TA1',
          condition: `Wait ${reqLabel} ON`,
          sv: this.HSTimerSettings.TA1_Wait_L_U_REQ_ON,
          pv: this.HSTimers.TA1_Wait_L_U_REQ_ON,
        },
        {
          name: 'TA2',
          condition: 'Wait EQ_READY ON',
          sv: this.HSTimerSettings.TA2_Wait_EQ_READY_ON,
          pv: this.HSTimers.TA2_Wait_EQ_READY_ON,
        },
        {
          name: 'TA3',
          condition: 'Wait EQ_BUSY ON',
          sv: this.HSTimerSettings.TA3_Wait_EQ_BUSY_ON,
          pv: this.HSTimers.TA3_Wait_EQ_BUSY_ON,
        },
        {
          name: 'TA4',
          condition: 'Wait EQ_BUSY OFF',
          sv: this.HSTimerSettings.TA4_Wait_EQ_BUSY_OFF,
          pv: this.HSTimers.TA4_Wait_EQ_BUSY_OFF,
        },
        {
          name: 'TA5',
          condition: `Wait ${reqLabel} OFF`,
          sv: this.HSTimerSettings.TA5_Wait_L_U_REQ_OFF,
          pv: this.HSTimers.TA5_Wait_L_U_REQ_OFF,
        },
      ]
    },
    timerCards() {
      return this.HsTimerData.map((t) => {
        const sv = Number(t.sv) || 0
        const pv = Number(t.pv) || 0
        const active = pv > 0
        const overtime = active && sv > 0 && pv >= sv
        const progressPercent =
          sv > 0 ? Math.min(100, Math.round((pv / sv) * 100)) : active ? 100 : 0
        return {
          ...t,
          active,
          overtime,
          progressPercent,
        }
      })
    },
  },
  methods: {
    formatTimerValue(value) {
      if (value === null || value === undefined || value === '') return '-'
      const num = Number(value)
      if (Number.isNaN(num)) return String(value)
      return Number.isInteger(num) ? String(num) : num.toFixed(1)
    },
    HandleTimerTBClick() {
      if (!this.IsGodUse) return
      // 導航至系統設定「設備取/放貨」頁並捲動至交握TIMEOUT
      bus.emit('show-settings', { tab: '5', scrollTo: 'eq-hs-timeout' })
    },
    onEqSimulateToggle(enabled) {
      if (enabled) {
        const real = this.realEqState
        this.eqSimulatedSignals = {
          EQ_L_REQ: !!real.EQ_L_REQ,
          EQ_U_REQ: !!real.EQ_U_REQ,
          EQ_READY: !!real.EQ_READY,
          EQ_BUSY: !!real.EQ_BUSY,
          EQ_GO: !!real.EQ_GO,
        }
      } else {
        this.lastKnownReqType = null
      }
    },
    async EqSignalClickHandler(signal_name) {
      if (this.eqSimulateEnabled) {
        this.eqSimulatedSignals[signal_name] = !this.eqSimulatedSignals[signal_name]
        return
      }
      await this.SignalWriteChangeHandler('EQ', signal_name)
    },
    async SignalWriteChangeHandler(owner, signal_name) {
      if (!this.IsGodUse) return
      const state_to_change = !this.HandshakeSignals[owner][signal_name]
      await DIO.HsSignalChange(owner, signal_name, state_to_change)
    },
  },
}
</script>

<style lang="scss" scoped>
.djm-pio {
  --hs-border: #d0d7de;
  --hs-agv: #0b6bcb;
  --hs-eq: #1a7f37;
  --hs-on: #1f9d55;
  --hs-off: #8b949e;
  --hs-warn: #cf222e;
  --hs-focus: #0969da;
  --hs-bg: #f6f8fa;
  --hs-card: #ffffff;

  width: min(920px, 100%);
  margin: 0 auto;
  padding: 16px 18px 18px;
  background: var(--hs-card);
  border: 1px solid var(--hs-border);
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(27, 31, 36, 0.06);
  text-align: left;
}

.hs-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.eq-sim-switch {
  margin-left: auto;
}

.eq-sim-banner {
  margin: -4px 0 12px;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #9a6700;
  background: #fff8c5;
  border: 1px solid #d4a72c66;
}

.sim-tag {
  margin-left: 6px;
  font-size: 11px;
  font-weight: 700;
  color: #9a6700;
  background: #fff8c5;
  border: 1px solid #d4a72c66;
  border-radius: 999px;
  padding: 1px 8px;
}

.lane.eq-lane.simulating {
  background: #fffdf5;
}

.mode-badge {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.02em;
  padding: 4px 12px;
  border-radius: 999px;
  border: 1px solid transparent;
  color: #fff;

  &.load {
    background: #1a7f37;
  }
  &.unload {
    background: #0969da;
  }
  &.busy {
    background: #9a6700;
  }
  &.idle {
    background: #656d76;
  }
}

.signal-board {
  border: 1px solid var(--hs-border);
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 14px;
}

.lane {
  padding: 12px 12px 14px;
  background: #fff;
}

.lane-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  color: #1f2328;
  margin-bottom: 10px;
}

.lane-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  &.agv {
    background: var(--hs-agv);
  }
  &.eq {
    background: var(--hs-eq);
  }
}

.lane-divider {
  height: 0;
  border-top: 2px dashed #1a7f37;
  margin: 0 10px;
}

.signal-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.signal-chip {
  appearance: none;
  border: 1px solid var(--hs-border);
  background: #f6f8fa;
  color: #656d76;
  border-radius: 10px;
  min-width: 88px;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: default;
  transition: transform 0.12s ease, box-shadow 0.12s ease, border-color 0.12s ease;

  &:disabled {
    opacity: 1;
  }

  &.editable {
    cursor: pointer;
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 6px rgba(27, 31, 36, 0.12);
    }
  }

  .chip-name {
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.02em;
  }
  .chip-state {
    font-size: 11px;
    font-weight: 700;
  }

  &.on {
    background: #dafbe1;
    border-color: #4ac26b;
    color: #1a7f37;
  }

  &.muted {
    opacity: 0.42;
  }
}

.timer-section {
  border: 1px solid var(--hs-border);
  border-radius: 10px;
  padding: 10px 12px 12px;
  background: var(--hs-bg);
  cursor: default;
}

.timer-section-title {
  font-size: 13px;
  font-weight: 700;
  color: #1f2328;
  margin-bottom: 8px;
}

.timer-hint {
  font-size: 11px;
  font-weight: 500;
  color: #656d76;
}

.timer-cards {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
}

.timer-card {
  background: #fff;
  border: 1px solid var(--hs-border);
  border-radius: 8px;
  padding: 8px;
  min-height: 78px;

  &.active {
    border-color: #54aeff;
    box-shadow: 0 0 0 1px #54aeff55;
  }
  &.overtime {
    border-color: var(--hs-warn);
    background: #ffebe9;
  }
}

.timer-card-head {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 6px;
}

.timer-name {
  font-size: 12px;
  font-weight: 800;
  color: #1f2328;
}

.timer-condition {
  font-size: 10px;
  color: #656d76;
  line-height: 1.25;
}

.timer-values {
  font-size: 11px;
  color: #1f2328;
  font-variant-numeric: tabular-nums;
  margin-bottom: 6px;
  .sep {
    color: #8b949e;
    margin: 0 2px;
  }
}

.timer-bar {
  height: 4px;
  background: #eaeef2;
  border-radius: 999px;
  overflow: hidden;
}

.timer-bar-fill {
  height: 100%;
  background: #0969da;
  border-radius: 999px;
  transition: width 0.2s ease;
}

.timer-card.overtime .timer-bar-fill {
  background: var(--hs-warn);
}

.timer-empty {
  font-size: 12px;
  color: #656d76;
  padding: 8px 0;
}

@media (max-width: 760px) {
  .timer-cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .signal-chip {
    min-width: 76px;
  }
}
</style>
