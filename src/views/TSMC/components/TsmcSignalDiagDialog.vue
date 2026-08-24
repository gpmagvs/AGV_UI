<template>
  <el-dialog
    :model-value="modelValue"
    title="Hardware I/O Signal Diagnosis"
    width="min(760px, calc(100vw - 24px))"
    top="4vh"
    append-to-body
    class="tsmc-diag-dialog"
    @update:model-value="$emit('update:modelValue', $event)">
    <div class="diag-body">
      <section>
        <h4>Active Alarms</h4>
        <ul v-if="alarms.length">
          <li v-for="a in alarms" :key="a.Code">
            <b>{{ a.Code }}</b> {{ a.CN || a.Description }}
          </li>
        </ul>
        <p v-else class="muted">No active alarm codes.</p>
      </section>

      <section>
        <h4>Safety PLC (logic OFF)</h4>
        <ul v-if="plcAbnormal.length">
          <li v-for="s in plcAbnormal" :key="s.Signal">
            <span class="addr">B{{ s.ByteOffset }}.{{ s.BitInByte }}</span>
            <b>{{ s.Signal }}</b>
            <span>Raw={{ s.RawBit ? 1 : 0 }} Logic=OFF</span>
          </li>
        </ul>
        <p v-else class="muted">{{ plcHint }}</p>
      </section>

      <section>
        <h4>DIO abnormal (typical safety bits OFF)</h4>
        <ul v-if="dioAbnormal.length">
          <li v-for="d in dioAbnormal" :key="d.key">
            <span class="addr">{{ d.address }}</span>
            <b>{{ d.name }}</b>
            <span>{{ d.detail }}</span>
          </li>
        </ul>
        <p v-else class="muted">No mapped DIO safety faults detected.</p>
      </section>
    </div>
  </el-dialog>
</template>

<script>
import { AGVStatusStore, DIOStore, SaftyPLCStore } from '@/store'

export default {
  name: 'TsmcSignalDiagDialog',
  props: {
    modelValue: { type: Boolean, default: false }
  },
  emits: ['update:modelValue'],
  computed: {
    alarms() {
      return AGVStatusStore.getters.AlarmCodes || []
    },
    plcHint() {
      if (!SaftyPLCStore.getters.Connected) return 'Safety PLC offline — cannot diagnose mapped bits.'
      return 'All mapped Safety PLC result signals are logic ON.'
    },
    plcAbnormal() {
      return (SaftyPLCStore.getters.Signals || []).filter(s => s && s.State === false)
    },
    dioAbnormal() {
      const checks = [
        { key: 'emo', on: this.findInputFalse('EMO') || this.findInputByName('EMO_Button'), name: 'EMO', detail: 'E-stop circuit open' },
        { key: 'bumper', on: DIOStore.getters.IsBumperTrigger, name: 'Bumper', address: 'X000A', detail: 'Bumper triggered' },
        { key: 'lf', on: DIOStore.getters.IsLaserFrontAlarm, name: 'Front LiDAR stop', address: 'X0032', detail: 'Area 3 OFF' },
        { key: 'lb', on: DIOStore.getters.IsLaserBackAlarm, name: 'Back LiDAR stop', address: 'X0036', detail: 'Area 3 OFF' },
        { key: 'll', on: DIOStore.getters.IsLaserLeftAlarm, name: 'Left LiDAR', address: 'X000E', detail: 'Protection OFF' },
        { key: 'lr', on: DIOStore.getters.IsLaserRightAlarm, name: 'Right LiDAR', address: 'X000F', detail: 'Protection OFF' },
        { key: 'ml', on: DIOStore.getters.IsLeftMotorAlarm, name: 'Left motor', address: 'X0017', detail: 'Driver alarm' },
        { key: 'mr', on: DIOStore.getters.IsRightMotorAlarm, name: 'Right motor', address: 'X0015', detail: 'Driver alarm' },
        { key: 'mv', on: DIOStore.getters.IsVerticalMotorAlarm, name: 'Lifter motor', address: 'X0019', detail: 'Driver alarm' }
      ]
      return checks.filter(c => c.on).map(c => ({
        ...c,
        address: c.address || this.findAddress(c.name) || '—'
      }))
    }
  },
  methods: {
    findInputFalse(keyword) {
      const inputs = DIOStore.getters.DIOStates?.Inputs || []
      const hit = inputs.find(r => (r.Name || '').toUpperCase().includes(keyword.toUpperCase()))
      return hit ? hit.State === false : false
    },
    findInputByName(name) {
      const inputs = DIOStore.getters.DIOStates?.Inputs || []
      const hit = inputs.find(r => r.Name === name)
      return hit ? hit.State === false : false
    },
    findAddress(keyword) {
      const inputs = DIOStore.getters.DIOStates?.Inputs || []
      const hit = inputs.find(r => (r.Name || '').toUpperCase().includes(keyword.toUpperCase()))
      return hit?.Address || hit?.address_display
    }
  }
}
</script>

<style scoped>
.diag-body {
  max-height: min(68vh, calc(100dvh - 140px));
  overflow: auto;
  color: #e8eef7;
}

section {
  margin-bottom: 16px;
}

h4 {
  margin: 0 0 8px;
  font-size: 13px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #8ea0b8;
}

ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

li {
  display: grid;
  grid-template-columns: minmax(56px, 72px) minmax(0, 1fr) auto;
  gap: 8px;
  padding: 8px 10px;
  margin-bottom: 6px;
  background: #182132;
  border: 1px solid #2a3a52;
  border-left: 3px solid #ff4d6d;
  font-size: 13px;
}

.addr {
  font-family: 'IBM Plex Mono', Consolas, monospace;
  color: #4cc9f0;
}

.muted {
  color: #8ea0b8;
  font-size: 13px;
}

@media (max-width: 899px), (max-height: 540px) {
  .diag-body {
    max-height: calc(100dvh - 110px);
  }

  li {
    grid-template-columns: 56px minmax(0, 1fr);
    font-size: 12px;
    padding: 6px 8px;
  }

  li span:last-child {
    grid-column: 2;
  }
}
</style>

<style>
.tsmc-diag-dialog.el-dialog {
  max-width: calc(100vw - 16px);
  margin-top: 4vh !important;
}

.tsmc-diag-dialog .el-dialog__body {
  padding: 8px 12px 16px;
}

@media (max-height: 540px) {
  .tsmc-diag-dialog .el-dialog__header {
    padding: 8px 12px 4px;
  }
}
</style>
