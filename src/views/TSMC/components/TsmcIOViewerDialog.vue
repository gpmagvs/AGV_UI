<template>
  <el-dialog
    :model-value="modelValue"
    title="Vehicle I/O Monitor"
    width="min(1100px, calc(100vw - 16px))"
    top="3vh"
    append-to-body
    destroy-on-close
    class="tsmc-io-dialog"
    @update:model-value="$emit('update:modelValue', $event)">
    <div class="io-viewer">
      <nav class="io-tabs" aria-label="I/O monitor type">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key">
          {{ tab.label }}
          <span>{{ tabCount(tab.key) }}</span>
        </button>
      </nav>

      <div class="io-toolbar">
        <div v-if="activeTab === 'safety'" class="device-state">
          <span class="state-dot" :class="plcConnected ? 'ok' : 'bad'"></span>
          Safety PLC {{ plcConnected ? 'CONNECTED' : 'OFFLINE' }}
          <small>{{ plcDeviceStatus || '—' }}</small>
        </div>
        <div v-else class="device-state">
          <span class="state-dot ok"></span>
          WAGO {{ activeTab.toUpperCase() }}
        </div>
        <label class="io-search">
          <span>FILTER</span>
          <input
            v-model.trim="keyword"
            type="search"
            autocomplete="off"
            placeholder="Address / signal / name" />
        </label>
      </div>

      <div class="io-table-wrap">
        <table v-if="activeTab === 'safety'" class="io-table safety-table">
          <thead>
            <tr>
              <th>Address</th>
              <th>Signal</th>
              <th>Description</th>
              <th class="center">Raw</th>
              <th class="center">Logic</th>
              <th class="center">Polarity</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in filteredSafetySignals" :key="row.Signal">
              <td class="mono address">
                B{{ row.ByteOffset }}.{{ row.BitInByte }}
                <small>IR{{ row.ModbusRegister }}.{{ row.BitInWord }}</small>
              </td>
              <td class="mono signal" :title="row.Signal">{{ row.Signal }}</td>
              <td class="description" :title="row.Description">{{ row.Description || '—' }}</td>
              <td class="center">
                <span class="value-badge" :class="row.RawBit ? 'on' : 'off'">
                  {{ row.RawBit ? 1 : 0 }}
                </span>
              </td>
              <td class="center">
                <span class="logic-value" :class="row.State ? 'on' : 'off'">
                  {{ row.State ? 'ON' : 'OFF' }}
                </span>
              </td>
              <td class="center mono">{{ row.ActiveHigh ? 'A-HIGH' : 'A-LOW' }}</td>
            </tr>
          </tbody>
        </table>

        <table v-else class="io-table dio-table">
          <thead>
            <tr>
              <th>Address</th>
              <th>Name</th>
              <th class="center">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in filteredDioRows" :key="row.Address">
              <td class="mono address">{{ row.Address }}</td>
              <td class="signal" :title="row.Name">{{ row.Name || '—' }}</td>
              <td class="center">
                <span class="value-badge" :class="row.State ? 'on' : 'off'">
                  {{ row.State ? 1 : 0 }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="!visibleRowCount" class="io-empty">
          No matching I/O signals
        </div>
      </div>

      <footer class="io-legend">
        <span><i class="state-dot ok"></i> ON / Logic active</span>
        <span><i class="state-dot bad"></i> OFF / Logic inactive</span>
        <span class="readonly-note">Monitor view — output control remains permission-protected in Operator tools.</span>
      </footer>
    </div>
  </el-dialog>
</template>

<script>
import { DIOStore, SaftyPLCStore } from '@/store'

export default {
  name: 'TsmcIOViewerDialog',
  props: {
    modelValue: { type: Boolean, default: false }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      activeTab: 'safety',
      keyword: '',
      tabs: [
        { key: 'safety', label: 'SAFETY PLC' },
        { key: 'input', label: 'INPUT' },
        { key: 'output', label: 'OUTPUT' }
      ]
    }
  },
  computed: {
    safetySignals() {
      return SaftyPLCStore.getters.Signals || []
    },
    plcConnected() {
      return SaftyPLCStore.getters.Connected
    },
    plcDeviceStatus() {
      return SaftyPLCStore.getters.DeviceStatus
    },
    inputs() {
      return DIOStore.getters.DIOStates?.Inputs || []
    },
    outputs() {
      return DIOStore.getters.DIOStates?.Outputs || []
    },
    normalizedKeyword() {
      return this.keyword.toLowerCase()
    },
    filteredSafetySignals() {
      const kw = this.normalizedKeyword
      if (!kw) return this.safetySignals
      return this.safetySignals.filter(row => [
        row.Signal,
        row.Description,
        row.AddressDisplay,
        `B${row.ByteOffset}.${row.BitInByte}`,
        `IR${row.ModbusRegister}.${row.BitInWord}`
      ].some(value => String(value || '').toLowerCase().includes(kw)))
    },
    filteredDioRows() {
      const source = this.activeTab === 'output' ? this.outputs : this.inputs
      const kw = this.normalizedKeyword
      if (!kw) return source
      return source.filter(row =>
        `${row.Address || ''} ${row.Name || ''}`.toLowerCase().includes(kw))
    },
    visibleRowCount() {
      return this.activeTab === 'safety'
        ? this.filteredSafetySignals.length
        : this.filteredDioRows.length
    }
  },
  watch: {
    activeTab() {
      this.keyword = ''
    }
  },
  methods: {
    tabCount(key) {
      if (key === 'safety') return this.safetySignals.length
      if (key === 'output') return this.outputs.length
      return this.inputs.length
    }
  }
}
</script>

<style scoped>
.io-viewer {
  height: min(76dvh, 720px);
  min-height: 300px;
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr) auto;
  gap: 8px;
  color: var(--tsmc-text, #e8eef7);
  font-family: var(--tsmc-font, sans-serif);
}

.io-tabs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}

.io-tabs button {
  min-height: 48px;
  border: 1px solid #2a3a52;
  border-radius: 4px;
  background: #182132;
  color: #8ea0b8;
  font: 700 13px var(--tsmc-font, sans-serif);
  letter-spacing: 0.06em;
  cursor: pointer;
}

.io-tabs button span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 20px;
  margin-left: 8px;
  border-radius: 10px;
  background: #101824;
  font-family: var(--tsmc-mono, monospace);
  font-size: 11px;
}

.io-tabs button.active {
  color: #e8eef7;
  border-color: #4cc9f0;
  background: #1d3a4a;
}

.io-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 38px;
}

.device-state {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
  font-size: 12px;
  font-weight: 700;
}

.device-state small {
  color: #8ea0b8;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.state-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex: 0 0 auto;
}

.state-dot.ok { background: #2ee59d; }
.state-dot.bad { background: #ff4d6d; }

.io-search {
  width: min(360px, 48%);
  display: flex;
  align-items: center;
  gap: 8px;
  color: #8ea0b8;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
}

.io-search input {
  width: 100%;
  min-width: 0;
  height: 36px;
  padding: 0 10px;
  border: 1px solid #2a3a52;
  border-radius: 4px;
  outline: none;
  background: #101824;
  color: #e8eef7;
  font-family: var(--tsmc-mono, monospace);
}

.io-search input:focus {
  border-color: #4cc9f0;
}

.io-table-wrap {
  min-height: 0;
  overflow: auto;
  border: 1px solid #2a3a52;
  border-radius: 4px;
  background: #101824;
}

.io-table {
  width: 100%;
  min-width: 620px;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 12px;
}

.io-table th {
  position: sticky;
  top: 0;
  z-index: 2;
  height: 36px;
  padding: 0 10px;
  border-bottom: 1px solid #3a4d67;
  background: #202c40;
  color: #8ea0b8;
  text-align: left;
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.io-table td {
  height: 38px;
  padding: 4px 10px;
  border-bottom: 1px solid #243247;
  color: #d9e2ef;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.io-table tbody tr:nth-child(even) td {
  background: rgba(42, 58, 82, 0.18);
}

.io-table tbody tr:hover td {
  background: rgba(76, 201, 240, 0.1);
}

.safety-table th:nth-child(1) { width: 125px; }
.safety-table th:nth-child(2) { width: 230px; }
.safety-table th:nth-child(4) { width: 70px; }
.safety-table th:nth-child(5) { width: 76px; }
.safety-table th:nth-child(6) { width: 94px; }
.dio-table th:nth-child(1) { width: 130px; }
.dio-table th:nth-child(3) { width: 90px; }

.center {
  text-align: center !important;
}

.mono {
  font-family: var(--tsmc-mono, monospace);
}

.address {
  color: #4cc9f0 !important;
}

.address small {
  display: block;
  color: #71849c;
  font-size: 9px;
}

.value-badge,
.logic-value {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  height: 24px;
  border: 1px solid currentColor;
  border-radius: 3px;
  font-family: var(--tsmc-mono, monospace);
  font-weight: 700;
}

.value-badge.on,
.logic-value.on {
  color: #2ee59d;
  background: rgba(46, 229, 157, 0.09);
}

.value-badge.off,
.logic-value.off {
  color: #ff4d6d;
  background: rgba(255, 77, 109, 0.09);
}

.io-empty {
  padding: 36px 12px;
  color: #8ea0b8;
  text-align: center;
}

.io-legend {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 18px;
  color: #8ea0b8;
  font-size: 11px;
}

.io-legend span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.readonly-note {
  margin-left: auto;
}

@media (max-width: 899px), (max-height: 540px) {
  .io-viewer {
    height: calc(100dvh - 76px);
    min-height: 260px;
    gap: 4px;
  }

  .io-tabs button {
    min-height: 44px;
    font-size: 11px;
  }

  .io-toolbar {
    min-height: 32px;
  }

  .io-search {
    width: 45%;
  }

  .io-search span,
  .device-state small,
  .readonly-note {
    display: none;
  }

  .io-search input {
    height: 32px;
  }

  .io-table {
    font-size: 11px;
  }

  .io-table th {
    height: 30px;
  }

  .io-table td {
    height: 32px;
    padding: 2px 8px;
  }

  .io-legend {
    font-size: 10px;
  }
}
</style>

<style>
.tsmc-io-dialog.el-dialog {
  max-width: calc(100vw - 8px);
  margin-top: 3vh !important;
  border: 1px solid #2a3a52;
  background: #121826;
}

.tsmc-io-dialog .el-dialog__header {
  margin-right: 0;
  padding: 12px 16px 8px;
  border-bottom: 1px solid #2a3a52;
}

.tsmc-io-dialog .el-dialog__title {
  color: #e8eef7;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.tsmc-io-dialog .el-dialog__headerbtn {
  width: 48px;
  height: 48px;
  top: 0;
}

.tsmc-io-dialog .el-dialog__close {
  color: #e8eef7;
  font-size: 22px;
}

.tsmc-io-dialog .el-dialog__body {
  padding: 10px 14px 12px;
}

@media (max-height: 540px) {
  .tsmc-io-dialog.el-dialog {
    margin-top: 1vh !important;
  }

  .tsmc-io-dialog .el-dialog__header {
    padding: 6px 12px 4px;
  }

  .tsmc-io-dialog .el-dialog__body {
    padding: 4px 8px 6px;
  }
}
</style>
