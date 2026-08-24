<template>
  <section class="tsmc-panel health-panel">
    <h2 class="tsmc-panel__title">Vehicle Health</h2>
    <dl class="tsmc-kv">
      <dt>LiDAR</dt>
      <dd :class="lidarClass">{{ lidarText }}</dd>
      <dt>Safety PLC</dt>
      <dd :class="plcClass">{{ plcText }}</dd>
      <dt>Motor</dt>
      <dd :class="motorClass">{{ motorText }}</dd>
      <dt>Lifter</dt>
      <dd>{{ lifterText }}</dd>
      <dt>Tag</dt>
      <dd>{{ tagText }}</dd>
      <dt>Loc</dt>
      <dd>{{ locText }}</dd>
    </dl>
  </section>
</template>

<script>
import { AGVStatusStore, DIOStore, SaftyPLCStore } from '@/store'

export default {
  name: 'TsmcHealthPanel',
  computed: {
    lidarAlarm() {
      return DIOStore.getters.IsLaserFrontAlarm
        || DIOStore.getters.IsLaserBackAlarm
        || DIOStore.getters.IsLaserLeftAlarm
        || DIOStore.getters.IsLaserRightAlarm
    },
    lidarWarn() {
      return DIOStore.getters.IsLaserFrontWarning || DIOStore.getters.IsLaserBackWarning
    },
    lidarText() {
      if (this.lidarAlarm) return 'STOP ZONE'
      if (this.lidarWarn) return 'SLOW ZONE'
      return 'OK'
    },
    lidarClass() {
      if (this.lidarAlarm) return 'bad'
      if (this.lidarWarn) return 'warn'
      return 'ok'
    },
    plcConnected() {
      return SaftyPLCStore.getters.Connected
    },
    plcText() {
      if (!this.plcConnected) return 'OFFLINE'
      return SaftyPLCStore.getters.DeviceStatus || 'OK'
    },
    plcClass() {
      return this.plcConnected ? 'ok' : 'warn'
    },
    motorAlarm() {
      return DIOStore.getters.IsLeftMotorAlarm
        || DIOStore.getters.IsRightMotorAlarm
        || DIOStore.getters.IsVerticalMotorAlarm
    },
    motorText() {
      return this.motorAlarm ? 'ALARM' : 'NORMAL'
    },
    motorClass() {
      return this.motorAlarm ? 'bad' : 'ok'
    },
    lifterText() {
      const h = AGVStatusStore.getters.ForkHeight
      if (h == null || Number.isNaN(Number(h))) return '—'
      const val = Math.round(Number(h) * 10) / 10
      return Math.abs(val) < 0.5 ? `Docked (${val})` : `${val}`
    },
    tagText() {
      const tag = AGVStatusStore.getters.AGVStatus?.Tag
      return tag == null || tag < 0 ? '—' : String(tag)
    },
    locText() {
      const loc = AGVStatusStore.getters.AGVStatus?.LocStatus
      const rate = AGVStatusStore.getters.AGVStatus?.MapComparsionRate
      const rateText = rate >= 0 ? ` ${rate}%` : ''
      return loc == null ? '—' : `${loc}${rateText}`
    }
  }
}
</script>

<style scoped>
.health-panel {
  display: flex;
  flex-direction: column;
  padding-bottom: 6px;
}

.tsmc-kv {
  padding: 6px 12px 4px;
  flex: 1 1 auto;
  min-height: 0;
  align-content: start;
}

.ok { color: var(--tsmc-ok); }
.warn { color: var(--tsmc-warn); }
.bad { color: var(--tsmc-alarm); }

@media (max-width: 1199px), (max-height: 699px) {
  .tsmc-kv {
    padding: 4px 8px 2px;
    gap: 2px 8px;
  }
}
</style>
