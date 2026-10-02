<template>
  <div class="battery-detail">
    <b-tabs>
      <b-tab title="電池狀態">
        <div class="panel">
          <div class="circuit-bar">
            <span class="lamp" :class="charge_circuit_state ? 'is-on' : 'is-off'"></span>
            <div class="circuit-text">
              <div class="circuit-title">充電迴路</div>
              <div class="circuit-sub">{{ charge_circuit_state ? '迴路已開啟' : '迴路已關閉' }}</div>
            </div>
            <el-switch size="large" inline-prompt active-text="開啟" inactive-text="關閉" v-model="charge_circuit_state"
              @change="HandleChargeCircuitSwitch"></el-switch>
          </div>

          <div v-if="batteryList.length" class="summary">
            <div class="chip">
              <span>電池數</span>
              <strong>{{ batteryList.length }}</strong>
            </div>
            <div class="chip">
              <span>最低電量</span>
              <strong>{{ minSoc }}%</strong>
            </div>
            <div class="chip" :class="{ 'is-alert': hasBatteryFault }">
              <span>異常</span>
              <strong>{{ hasBatteryFault ? '有' : '無' }}</strong>
            </div>
          </div>

          <div v-if="!batteryList.length" class="empty-state">等待電池資料</div>

          <div v-else class="battery-grid">
            <article v-for="bat in batteryList" :key="bat.batteryID" class="bat-card" :class="'tone-' + levelTone(bat)">
              <header class="bat-head">
                <div class="bat-name">電池-{{ bat.batteryID }}</div>
                <span class="state-pill">{{ stateLabel(bat) }}</span>
                <span class="ecode" :class="{ 'is-fault': Number(bat.errorCode) !== 0 }">
                  異常碼 {{ bat.errorCode }}
                </span>
              </header>

              <div class="power-flow">
                <div class="pf-node">
                  <div class="pf-title">充電迴路</div>
                  <div class="pf-state" :class="charge_circuit_state ? 'is-on' : 'is-off'">
                    {{ charge_circuit_state ? '接通' : '斷開' }}
                  </div>
                  <div class="pf-read">{{ toAmp(bat.chargeCurrent) }}<span>A</span></div>
                </div>

                <div class="pf-link" :class="chargePathClass(bat)" aria-hidden="true">
                  <span class="pf-line"></span>
                </div>

                <div class="pf-node pf-battery">
                  <svg class="bat-glyph" viewBox="0 0 96 112" role="img"
                    :aria-label="`電池 ${bat.batteryID} 電量 ${soc(bat)}%`">
                    <defs>
                      <clipPath :id="clipId(bat)">
                        <rect x="10" y="36" width="76" height="68" />
                      </clipPath>
                    </defs>
                    <rect class="post" x="14" y="11" width="22" height="6" />
                    <rect class="post" x="60" y="11" width="22" height="6" />
                    <rect class="shell" x="6" y="16" width="84" height="92" />
                    <line class="lid" x1="6" y1="32" x2="90" y2="32" />
                    <g :clip-path="`url(#${clipId(bat)})`">
                      <rect class="fill" x="10" :y="fillY(bat)" width="76" :height="fillHeight(bat)" />
                    </g>
                    <path v-if="isCharging(bat)" class="bolt" d="M52 48 L38 74 H48 L41 98 L66 68 H54 Z" />
                  </svg>
                  <div class="soc">
                    <strong>{{ soc(bat) }}</strong><span>%</span>
                  </div>
                  <div class="pf-read">{{ toVolt(bat) }}<span>V</span></div>
                </div>

                <div class="pf-link" :class="dischargePathClass(bat)" aria-hidden="true">
                  <span class="pf-line"></span>
                </div>

                <div class="pf-node">
                  <div class="pf-title">車輛負載</div>
                  <div class="pf-state" :class="isDischarging(bat) ? 'is-on' : 'is-idle'">
                    {{ isDischarging(bat) ? '供電中' : '無負載' }}
                  </div>
                  <div class="pf-read">{{ toAmp(bat.dischargeCurrent) }}<span>A</span></div>
                  <div class="pf-sub">{{ dischargeWatt(bat) }} W</div>
                </div>
              </div>

              <div class="spec-grid">
                <div class="metric">
                  <div class="metric-label">循環次數</div>
                  <div class="metric-value">{{ displayValue(bat.cycle) }}<span>次</span></div>
                </div>
                <div class="metric">
                  <div class="metric-label">最低溫度</div>
                  <div class="metric-value">{{ displayValue(bat.minCellTemperature) }}<span>°C</span></div>
                </div>
                <div class="metric">
                  <div class="metric-label">最高溫度</div>
                  <div class="metric-value">{{ displayValue(bat.maxCellTemperature) }}<span>°C</span></div>
                </div>
                <div class="metric">
                  <div class="metric-label">狀態碼</div>
                  <div class="metric-value">{{ displayValue(bat.state) }}</div>
                </div>
                <div class="metric">
                  <div class="metric-label">充電時間</div>
                  <div class="metric-value">{{ displayValue(bat.chargeTime) }}</div>
                </div>
                <div class="metric">
                  <div class="metric-label">使用時間</div>
                  <div class="metric-value">{{ displayValue(bat.useTime) }}</div>
                </div>
              </div>
            </article>

          </div>


        </div>
      </b-tab>

      <b-tab title="歷史查詢">
        <div class="panel">
          <div class="query-card">
            <el-form label-position="left" label-width="80px">
              <el-form-item label="選擇電池">
                <el-select v-model="query_options.id" class="query-control">
                  <el-option v-for="i in batteryIDList" :key="i" :label="`電池-${i + 1}`" :value="i"></el-option>
                </el-select>
              </el-form-item>
              <el-form-item label="查詢項目">
                <el-select class="query-control" v-model="query_options.item">
                  <el-option label="電量" value="Level"></el-option>
                  <el-option label="電壓" value="Voltage"></el-option>
                  <el-option label="充電電流" value="Charge_current"></el-option>
                  <el-option label="放電電流" value="Discharge_current"></el-option>
                </el-select>
              </el-form-item>
              <el-form-item label="時間區間">
                <el-date-picker v-model="query_options.time_range" type="datetimerange" range-separator="至"
                  start-placeholder="開始時間" end-placeholder="結束時間" class="query-control"></el-date-picker>
              </el-form-item>
            </el-form>
            <div class="query-actions">
              <div class="query-submit">
                <b-button @click="HandleQueryButtonClick" variant="primary" :disabled="historyQuerying">{{
                  historyQuerying ? '查詢中' : '查詢' }}</b-button>
                <el-switch v-model="query_options.downsample" inline-prompt active-text="降取樣"
                  inactive-text="原始"></el-switch>
              </div>
              <div class="legend">
                <span><i class="dot dot-idle"></i>待機</span>
                <span><i class="dot dot-run"></i>運行</span>
                <span><i class="dot dot-down"></i>異常</span>
                <span><i class="dot dot-charge"></i>充電</span>
                <span><i class="dot dot-unknown"></i>未知</span>
              </div>
            </div>
          </div>
          <div class="chart-card" id="chart">
            <BatteryHistoryChart ref="historyChart"></BatteryHistoryChart>
          </div>
        </div>
      </b-tab>

      <b-tab v-if="isAdmin" title="假電池設定">
        <div class="panel">
          <div class="query-card">
            <div class="fake-hint">啟用後會覆寫實際電池回報的電量與電壓，僅供測試使用。</div>
            <el-form label-position="left" label-width="90px">
              <el-form-item label="啟用假資料">
                <el-switch v-model="fake_battery.enable" inline-prompt active-text="啟用" inactive-text="關閉"></el-switch>
              </el-form-item>
              <el-form-item label="電量 (%)">
                <el-input-number v-model="fake_battery.level" :min="0" :max="100" :step="1" controls-position="right"
                  class="query-control" :disabled="!fake_battery.enable"></el-input-number>
              </el-form-item>
              <el-form-item label="電壓 (mV)">
                <el-input-number v-model="fake_battery.voltage_mv" :min="0" :max="30000" :step="1" :precision="0"
                  controls-position="right" class="query-control" :disabled="!fake_battery.enable"></el-input-number>
              </el-form-item>
              <el-form-item label="異常碼">
                <div class="fake-error-row">
                  <el-input-number v-model="fake_battery.errorCode" :min="0" :max="255" :step="1" :precision="0"
                    controls-position="right" class="fake-error-input" :disabled="!fake_battery.enable"></el-input-number>
                  <el-select :model-value="matchedFakeErrorPreset" clearable placeholder="常用異常碼"
                    class="fake-error-preset" :disabled="!fake_battery.enable" @change="ApplyFakeErrorPreset">
                    <el-option :value="0" label="0 — 無異常"></el-option>
                    <el-option v-for="flag in batteryErrorFlags" :key="flag.value" :value="flag.value"
                      :label="`${flag.value} — ${flag.label}`"></el-option>
                  </el-select>
                </div>
              </el-form-item>
            </el-form>
            <div class="query-actions">
              <div class="query-submit">
                <b-button @click="HandleSetupFakeBattery" variant="primary" :disabled="fakeBatterySubmitting">
                  {{ fakeBatterySubmitting ? '套用中' : '套用設定' }}
                </b-button>
              </div>
              <div class="fake-status" :class="fake_battery.enable ? 'is-on' : 'is-off'">
                {{ fake_battery.enable ? '假資料已啟用（送出後生效）' : '假資料已關閉（送出後恢復真實值）' }}
              </div>
            </div>
          </div>
        </div>
      </b-tab>
    </b-tabs>
  </div>
</template>

<script>
import { ROS_STORE } from '@/store/ros_store';
import { BatteryAPI } from '@/api/VMSAPI.js'
import { AGVStatusStore, UserStore } from '@/store'
import moment from 'moment'
import bus from '@/event-bus';
import BatteryHistoryChart from './BatteryHistoryChart.vue'
import { ElMessage } from 'element-plus'

const CHARGE_CURRENT_THRESHOLD_MA = 650
const CELL_BODY_TOP = 36
const CELL_BODY_HEIGHT = 68

const BATTERY_ERROR_FLAGS = [
  { value: 1, label: '在席異常' },
  { value: 2, label: '充電過電流' },
  { value: 4, label: '放電過電流' },
  { value: 8, label: '欠壓' },
  { value: 16, label: '低溫' },
  { value: 32, label: '過壓' },
  { value: 64, label: '短路' },
  { value: 128, label: '過溫' },
]

export default {
  components: { BatteryHistoryChart },
  data() {
    return {
      charge_circuit_state: false,
      batteries: {},
      batteryPollTimer: null,
      onChargeCircuitChanged: null,
      historyQuerying: false,
      fakeBatterySubmitting: false,
      batteryErrorFlags: BATTERY_ERROR_FLAGS,
      fake_battery: {
        enable: false,
        level: 100,
        voltage_mv: 24000,
        errorCode: 0
      },
      query_options: {
        id: 0,
        item: 'Level',
        downsample: true,
        time_range: ['', '']
      }
    }
  },
  computed: {
    battery_info() {
      return ROS_STORE.getters.BatteryInfo;
    },
    batteryList() {
      return Object.values(this.batteries || {})
        .filter(bat => bat && bat.batteryID !== undefined && bat.batteryID !== null)
        .sort((left, right) => Number(left.batteryID) - Number(right.batteryID))
    },
    minSoc() {
      if (!this.batteryList.length)
        return 0
      return Math.min(...this.batteryList.map(bat => this.soc(bat)))
    },
    hasBatteryFault() {
      return this.batteryList.some(bat => Number(bat.state) === -1 || Number(bat.errorCode) !== 0)
    },
    batteryIDList() {
      var id_list = [];
      for (let index = 0; index < this.batteryCount; index++) {
        id_list.push(index)
      }
      return id_list
    },
    batteryCount() {
      return AGVStatusStore.getters.BatteryCount
    },
    matchedFakeErrorPreset() {
      const code = Number(this.fake_battery.errorCode)
      if (code === 0)
        return 0
      return this.batteryErrorFlags.some(flag => flag.value === code) ? code : undefined
    },
    isAdmin() {
      return UserStore.getters.IsGodUser;
    }
  },
  methods: {
    ApplyFakeErrorPreset(value) {
      if (value === undefined || value === null || value === '') {
        this.fake_battery.errorCode = 0
        return
      }
      this.fake_battery.errorCode = Number(value)
    },
    clipId(bat) {
      return `bat-clip-${bat.batteryID}`
    },
    soc(bat) {
      const level = Number(bat?.batteryLevel ?? 0)
      if (Number.isNaN(level))
        return 0
      return Math.min(100, Math.max(0, level))
    },
    // 與車載 clsBattery.IsCharging 相同：充電電流大於 650mA 視為充電中
    isCharging(bat) {
      return Number(bat?.chargeCurrent || 0) > CHARGE_CURRENT_THRESHOLD_MA
    },
    isDischarging(bat) {
      return Number(bat?.dischargeCurrent || 0) > 100
    },
    chargePathClass(bat) {
      if (!this.charge_circuit_state)
        return 'is-open'
      if (this.isCharging(bat))
        return 'is-flow'
      return 'is-closed'
    },
    dischargePathClass(bat) {
      return this.isDischarging(bat) ? 'is-flow' : 'is-idle'
    },
    levelTone(bat) {
      if (Number(bat?.state) === -1 || Number(bat?.errorCode) !== 0)
        return 'fault'
      if (this.isCharging(bat))
        return 'charge'
      const level = this.soc(bat)
      if (level < 20)
        return 'low'
      if (level < 40)
        return 'warn'
      return 'ok'
    },
    stateLabel(bat) {
      if (Number(bat?.state) === -1)
        return '通訊異常'
      if (Number(bat?.errorCode) !== 0)
        return '異常'
      if (this.isCharging(bat))
        return '充電中'
      if (Number(bat?.dischargeCurrent) > 0)
        return '放電中'
      return '待命'
    },
    fillHeight(bat) {
      return (CELL_BODY_HEIGHT * this.soc(bat)) / 100
    },
    fillY(bat) {
      return CELL_BODY_TOP + CELL_BODY_HEIGHT - this.fillHeight(bat)
    },
    toVolt(bat) {
      const milliVolt = Number(bat?.voltage ?? bat?.Voltage ?? 0)
      return (milliVolt / 1000).toFixed(2)
    },
    toAmp(raw) {
      return (Number(raw || 0) / 1000).toFixed(2)
    },
    dischargeWatt(bat) {
      const volt = Number(bat?.voltage ?? bat?.Voltage ?? 0) / 1000
      return (volt * (Number(bat?.dischargeCurrent || 0) / 1000)).toFixed(1)
    },
    displayValue(value) {
      if (value === undefined || value === null || value === '')
        return '—'
      return value
    },
    async HandleChargeCircuitSwitch(enabled) {
      await BatteryAPI.ChargeCicuitSwitch(enabled)
    },
    async HandleQueryButtonClick() {
      if (this.historyQuerying)
        return
      const range = this.query_options.time_range
      if (!range?.[0] || !range?.[1]) {
        this.$refs.historyChart.showMessage('請先選擇時間區間')
        return
      }
      this.historyQuerying = true
      const queryToken = (this._historyQueryToken || 0) + 1
      this._historyQueryToken = queryToken
      try {
        const payload = {
          id: this.query_options.id,
          item: this.query_options.item,
          downsample: this.query_options.downsample,
          time_range: [
            moment(range[0]).format('YYYY/MM/DD HH:mm:ss'),
            moment(range[1]).format('YYYY/MM/DD HH:mm:ss')
          ]
        }
        const result = await BatteryAPI.Query(payload)
        if (queryToken !== this._historyQueryToken)
          return
        await this.$refs.historyChart.renderRecords(result, this.query_options.item, this.query_options.downsample)
      }
      catch (error) {
        console.error(error)
        if (queryToken === this._historyQueryToken)
          this.$refs.historyChart.showMessage('查詢失敗')
      }
      finally {
        if (queryToken === this._historyQueryToken)
          this.historyQuerying = false
      }
    },
    async UpdateChargeCircuitState() {
      this.charge_circuit_state = await BatteryAPI.GetChargeCicuitState()
    },
    async HandleSetupFakeBattery() {
      if (this.fakeBatterySubmitting)
        return
      const level = Math.min(100, Math.max(0, Math.round(Number(this.fake_battery.level) || 0)))
      const voltageMv = Math.min(65535, Math.max(0, Math.round(Number(this.fake_battery.voltage_mv) || 0)))
      const errorCode = Math.min(255, Math.max(0, Math.round(Number(this.fake_battery.errorCode) || 0)))
      this.fakeBatterySubmitting = true
      try {
        await BatteryAPI.SetupFakeBattery({
          enable: !!this.fake_battery.enable,
          level,
          voltage: voltageMv,
          errorCode
        })
        this.fake_battery.level = level
        this.fake_battery.voltage_mv = voltageMv
        this.fake_battery.errorCode = errorCode
        ElMessage.success('假電池設定已套用')
      }
      catch (error) {
        console.error(error)
        ElMessage.error('假電池設定失敗')
      }
      finally {
        this.fakeBatterySubmitting = false
      }
    },
    captureBatterySnapshot() {
      var battery = this.battery_info
      try {
        const batteryId = battery.batteryID
        this.batteries = {
          ...this.batteries,
          [batteryId]: { ...battery }
        }
      } catch (error) {
        // 電池主題尚未就緒時略過本次更新
      }
    }
  },
  mounted() {
    this.onChargeCircuitChanged = (isOpened) => {
      this.charge_circuit_state = isOpened
    }
    bus.on('ReChargeCircuitChanged', this.onChargeCircuitChanged)
    var timeNow = Date.now();
    var timeStart = moment(timeNow).add(-1, "day")
    this.query_options.time_range = [timeStart, timeNow];
    this.captureBatterySnapshot()
    this.batteryPollTimer = setInterval(() => {
      this.captureBatterySnapshot()
    }, 1000);
  },
  beforeUnmount() {
    if (this.batteryPollTimer)
      clearInterval(this.batteryPollTimer)
    if (this.onChargeCircuitChanged)
      bus.off('ReChargeCircuitChanged', this.onChargeCircuitChanged)
  },
}
</script>

<style lang="scss" scoped>
.battery-detail {
  flex: 1 1 auto;
  width: 100%;
  max-width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: auto;
  box-sizing: border-box;
  color: #111827;
  text-align: left;
}

.panel {
  min-width: 0;
  max-width: 100%;
  padding: 8px 0 16px;
}

.circuit-bar,
.bat-card,
.query-card,
.chart-card {
  background: #ffffff;
  border: 1px solid #d8dee6;
  border-radius: 8px;
}

.fake-hint {
  margin-bottom: 10px;
  padding: 8px 10px;
  font-size: 12px;
  color: #92400e;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 6px;
}

.fake-error-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.fake-error-input {
  width: 140px;
  flex: 0 0 auto;
}

.fake-error-preset {
  flex: 1 1 auto;
  min-width: 0;
}

.fake-status {
  font-size: 12px;
  font-weight: 700;

  &.is-on {
    color: #b45309;
  }

  &.is-off {
    color: #64748b;
  }
}

.circuit-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
}

.lamp {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex: 0 0 auto;
  box-shadow: 0 0 0 4px rgba(148, 163, 184, 0.16);

  &.is-on {
    background: #16a34a;
    box-shadow: 0 0 0 4px rgba(22, 163, 74, 0.16);
  }

  &.is-off {
    background: #dc2626;
    box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.12);
  }
}

.circuit-text {
  flex: 1;
  min-width: 0;
}

.circuit-title {
  font-size: 14px;
  font-weight: 700;
}

.circuit-sub {
  font-size: 12px;
  color: #64748b;
}

.summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 8px;
  min-width: 0;
  max-width: 100%;
}

.chip {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
  padding: 8px 12px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 8px;

  span {
    font-size: 12px;
    color: #64748b;
  }

  strong {
    font-size: 18px;
    font-variant-numeric: tabular-nums;
  }

  &.is-alert strong {
    color: #dc2626;
  }
}

.empty-state {
  margin-top: 12px;
  padding: 28px 12px;
  text-align: center;
  color: #64748b;
  background: #f8fafc;
  border: 1px dashed #d8dee6;
  border-radius: 8px;
}

.battery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 420px), 1fr));
  gap: 10px;
  margin-top: 10px;
  min-width: 0;
  max-width: 100%;
}

.bat-card {
  overflow: hidden;
  min-width: 0;
  max-width: 100%;
  --soc: #0d6efd;

  &.tone-ok {
    --soc: #0d6efd;
  }

  &.tone-warn {
    --soc: #d97706;
  }

  &.tone-low,
  &.tone-fault {
    --soc: #dc2626;
  }

  &.tone-charge {
    --soc: #16a34a;
  }
}

.bat-head {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 10px 12px;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
}

.bat-name {
  font-size: 15px;
  font-weight: 800;
}

.state-pill {
  padding: 2px 8px;
  border-radius: 999px;
  background: #f1f5f9;
  color: var(--soc);
  font-size: 12px;
  font-weight: 700;
}

.ecode {
  margin-left: auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  font-variant-numeric: tabular-nums;

  &.is-fault {
    color: #dc2626;
  }
}

.power-flow {
  display: grid;
  grid-template-columns: 104px minmax(28px, 1fr) 112px minmax(28px, 1fr) 104px;
  align-items: center;
  gap: 6px;
  padding: 12px 10px 4px;
  background: #f8fafc;
}

.pf-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-width: 0;
  min-height: 132px;
  padding: 8px 4px;
  background: #ffffff;
  border: 1px solid #d8dee6;
  border-radius: 6px;
  text-align: center;
}

.pf-title {
  font-size: 12px;
  font-weight: 800;
  color: #334155;
}

.pf-state {
  font-size: 13px;
  font-weight: 800;

  &.is-on {
    color: #15803d;
  }

  &.is-off {
    color: #b91c1c;
  }

  &.is-idle {
    color: #64748b;
  }
}

.pf-read {
  font-size: 16px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;

  span {
    margin-left: 2px;
    font-size: 11px;
    font-weight: 700;
    color: #64748b;
  }
}

.pf-sub {
  font-size: 12px;
  font-weight: 700;
  color: #475569;
  font-variant-numeric: tabular-nums;
}

.pf-link {
  position: relative;
  height: 16px;
}

.pf-line {
  display: block;
  height: 6px;
  margin-top: 5px;
  border-radius: 999px;
  background: #cbd5e1;
}

.pf-link.is-closed .pf-line {
  background: #334155;
}

.pf-link.is-idle .pf-line {
  background: #cbd5e1;
}

.pf-link.is-open .pf-line {
  background: linear-gradient(90deg, #cbd5e1 0 40%, transparent 40% 60%, #cbd5e1 60% 100%);
}

.pf-link.is-flow .pf-line {
  background: repeating-linear-gradient(90deg, #16a34a 0 12px, #bbf7d0 12px 20px);
  background-size: 20px 100%;
  animation: pf-flow 2.2s linear infinite;
}

.pf-link.is-flow::after {
  content: '';
  position: absolute;
  top: 2px;
  right: -1px;
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
  border-left: 8px solid #16a34a;
}

.bat-glyph {
  width: 56px;
  height: 66px;
  color: var(--soc);

  .shell,
  .lid {
    fill: none;
    stroke: #334155;
    stroke-width: 3;
  }

  .post {
    fill: #334155;
  }

  .fill {
    fill: currentColor;
  }

  .bolt {
    fill: #ffffff;
    stroke: rgba(15, 23, 42, 0.25);
    stroke-width: 1;
  }
}

.soc {
  margin-top: 4px;
  line-height: 1;
  font-variant-numeric: tabular-nums;

  strong {
    font-size: 22px;
    font-weight: 800;
  }

  span {
    margin-left: 2px;
    font-size: 13px;
    color: #64748b;
  }
}

.power {
  margin-top: 4px;
  font-size: 12px;
  font-weight: 700;
  color: #475569;
  font-variant-numeric: tabular-nums;
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px;
  background: #f8fafc;
  border-radius: 6px;
}

.metric-label {
  font-size: 12px;
  color: #64748b;
}

.metric-value {
  font-size: 20px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;

  span {
    margin-left: 3px;
    font-size: 12px;
    font-weight: 700;
    color: #64748b;
  }
}

.spec-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  min-width: 0;
  padding: 10px 12px 12px;
}

.flow {
  grid-column: 1 / -1;
  padding: 8px;
  border: 1px solid #eef2f7;
  border-radius: 6px;
}

.flow {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.flow-row {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr) 64px;
  align-items: center;
  gap: 8px;
}

.flow-name,
.stat-row span {
  font-size: 12px;
  color: #64748b;
}

.track {
  position: relative;
  height: 8px;
  background: #e5e7eb;
  border-radius: 999px;
  overflow: hidden;
}

.bar {
  height: 100%;
  border-radius: 999px;
}

.bar-charge {
  background: #16a34a;
}

.bar-discharge {
  background: #0d6efd;
}

.flow-num,
.stat-row strong {
  font-variant-numeric: tabular-nums;
  font-weight: 700;
}

.flow-num {
  text-align: right;
  font-size: 13px;
}

.stat-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  padding: 8px 12px;
  background: #fafbfc;
  border-top: 1px solid #eef2f7;

  div {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  strong {
    font-size: 14px;
  }
}

.query-card {
  padding: 12px 12px 8px;
}

.query-control {
  width: 100%;
}

:deep(.el-date-editor),
:deep(.el-select) {
  width: 100%;
  max-width: 100%;
}

.query-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding-top: 4px;
}

.query-submit {
  display: flex;
  align-items: center;
  gap: 10px;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 12px;
  color: #475569;

  span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
}

.dot-idle {
  background: #ffc600;
}

.dot-run {
  background: #0d6efd;
}

.dot-down {
  background: #ff4a4a;
}

.dot-charge {
  background: #1fff74;
}

.dot-unknown {
  background: #5e6a75;
}

.chart-card {
  margin-top: 10px;
  padding: 4px 8px 8px;
}

.tone-charge .fill {
  animation: charge-pulse 1.8s ease-in-out infinite;
}

@keyframes charge-pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.45;
  }
}

@keyframes pf-flow {
  to {
    background-position: 20px 0;
  }
}

@media (max-width: 520px) {

  .battery-grid,
  .power-flow,
  .summary,
  .spec-grid {
    grid-template-columns: 1fr;
  }

  .flow,
  .ecode {
    margin-left: 0;
  }
}
</style>
