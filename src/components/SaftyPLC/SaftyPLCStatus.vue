<template>
    <div v-if="hasStatus" class="safty-plc-status">
        <el-tooltip placement="top" :show-after="300" :offset="10">
            <template #content>
                <div class="chip-tip">
                    <div class="chip-tip-title">{{ $t('SaftyPLCOverview.title') }}</div>
                    <div class="chip-tip-row">
                        <span>{{ $t('SaftyPLCOverview.motor_1') }}</span>
                        <b :class="signalTipClass(motor1)">{{ signalStateText(motor1) }}</b>
                    </div>
                    <div class="chip-tip-row">
                        <span>{{ $t('SaftyPLCOverview.motor_2') }}</span>
                        <b :class="signalTipClass(motor2)">{{ signalStateText(motor2) }}</b>
                    </div>
                    <div class="chip-tip-row">
                        <span>{{ $t('SaftyPLCOverview.meta_connection') }}</span>
                        <b :class="connected ? 'tip-on' : 'tip-off'">
                            {{ connected ? $t('SaftyPLC.connected') : $t('SaftyPLC.disconnected') }}
                        </b>
                    </div>
                    <div v-if="abnormalSignals.length" class="chip-tip-row">
                        <span>{{ $t('SaftyPLCOverview.stat_abnormal') }}</span>
                        <b class="tip-off">{{ abnormalSignals.length }}</b>
                    </div>
                    <div class="chip-tip-hint">{{ $t('SaftyPLCOverview.chip_hint') }}</div>
                </div>
            </template>
            <button type="button" class="motor-chip" :class="`is-${motorChipState}`" @click="showDialog = true">
                <el-icon class="chip-icon" :size="15">
                    <Lightning />
                </el-icon>
                <span class="chip-label">{{ $t('SaftyPLCOverview.chip_label') }}</span>
                <span class="chip-state">
                    <i class="chip-dot"></i>
                    {{ motorChipText }}
                </span>
                <span v-if="abnormalSignals.length" class="chip-alert">
                    <el-icon :size="12">
                        <WarningFilled />
                    </el-icon>
                    {{ abnormalSignals.length }}
                </span>
            </button>
        </el-tooltip>

        <el-dialog
            v-model="showDialog"
            width="1080px"
            top="4vh"
            draggable
            destroy-on-close
            append-to-body
            :show-close="false"
            :z-index="1200000"
            class="safty-plc-overview-dialog">
            <template #header>
                <div class="ov-header">
                    <div class="ov-header-icon">
                        <el-icon :size="20">
                            <Cpu />
                        </el-icon>
                    </div>
                    <div class="ov-header-text">
                        <h3>{{ $t('SaftyPLCOverview.title') }}</h3>
                        <span>{{ $t('SaftyPLCOverview.subtitle') }}</span>
                    </div>
                    <div class="ov-header-chips">
                        <span class="pill" :class="connected ? 'pill-ok' : 'pill-ng'">
                            <el-icon :size="12">
                                <component :is="connected ? 'CircleCheck' : 'CircleClose'" />
                            </el-icon>
                            {{ connected ? $t('SaftyPLC.connected') : $t('SaftyPLC.disconnected') }}
                        </span>
                        <span class="pill" :class="isSimulator ? 'pill-sim' : 'pill-plain'">
                            {{ isSimulator ? $t('SaftyPLCOverview.mode_simulator') : $t('SaftyPLCOverview.mode_real') }}
                        </span>
                        <span class="pill" :class="andOk ? 'pill-ok' : 'pill-ng'">
                            AND {{ andOk ? 'OK' : 'NG' }}
                        </span>
                    </div>
                    <el-button type="primary" class="ov-close-btn" @click="showDialog = false">
                        {{ $t('SaftyPLCOverview.close') }}
                    </el-button>
                </div>
            </template>

            <div class="ov-body">
                <section class="ov-meta">
                    <div class="meta-tile">
                        <span class="meta-key">{{ $t('SaftyPLCOverview.meta_device') }}</span>
                        <span class="meta-val">{{ deviceStatus || '-' }}</span>
                    </div>
                    <div class="meta-tile">
                        <span class="meta-key">{{ $t('SaftyPLCOverview.meta_updated') }}</span>
                        <span class="meta-val">{{ lastUpdateText }}</span>
                    </div>
                    <div class="meta-tile" :class="abnormalSignals.length ? 'is-bad' : 'is-good'">
                        <span class="meta-key">{{ $t('SaftyPLCOverview.stat_abnormal') }}</span>
                        <span class="meta-val">
                            {{ abnormalSignals.length || $t('SaftyPLCOverview.stat_all_normal') }}
                        </span>
                    </div>
                    <div class="meta-tile">
                        <span class="meta-key">{{ $t('SaftyPLCOverview.diagram_legend') }}</span>
                        <span class="meta-val legend-line">
                            <i class="lg on"></i>{{ $t('SaftyPLCOverview.state_on') }}
                            <i class="lg off"></i>{{ $t('SaftyPLCOverview.state_off') }}
                        </span>
                    </div>
                </section>

                <!-- Safety chain diagram -->
                <section class="diagram" :class="{ offline: !connected }">
                    <div class="diagram-stage-labels">
                        <span class="col-inputs">{{ $t('SaftyPLCOverview.stage_inputs') }} / {{ $t('SaftyPLCOverview.stage_or') }}</span>
                        <span class="col-and">{{ $t('SaftyPLCOverview.stage_and') }}</span>
                        <span class="col-reset">{{ $t('SaftyPLCOverview.stage_reset') }}</span>
                        <span class="col-output">{{ $t('SaftyPLCOverview.stage_output') }}</span>
                    </div>

                    <div class="diagram-grid">
                        <!-- Left: channel rows -->
                        <div class="diagram-channels">
                            <div
                                v-for="ch in channels"
                                :key="ch.key"
                                class="channel-row"
                                :class="{ 'is-fault': !ch.orOk }">
                                <div class="channel-inputs">
                                    <div class="channel-title">{{ ch.label }}</div>
                                    <div class="pill-stack">
                                        <span
                                            v-for="node in ch.inputs"
                                            :key="node.key"
                                            class="sig-pill"
                                            :class="node.on ? 'is-on' : 'is-off'"
                                            :title="node.hint">
                                            <i class="sig-slash" v-if="!node.on"></i>
                                            {{ node.label }}
                                        </span>
                                        <span v-if="!ch.inputs.length" class="sig-pill is-missing">—</span>
                                    </div>
                                </div>

                                <div class="wire" :class="ch.orOk ? 'hi' : 'lo'"></div>

                                <div class="gate gate-or" :class="ch.orOk ? 'is-on' : 'is-off'" :title="ch.orHint">
                                    <span class="gate-symbol">≥1</span>
                                    <span class="gate-name">OR</span>
                                    <span v-if="ch.bypassed" class="gate-byp">BYP</span>
                                </div>

                                <div class="wire wire-to-bus" :class="ch.orOk ? 'hi' : 'lo'"></div>
                            </div>
                        </div>

                        <!-- Vertical bus into AND -->
                        <div class="diagram-bus" :class="andOk ? 'hi' : 'lo'">
                            <div class="bus-line"></div>
                        </div>

                        <!-- AND -->
                        <div class="diagram-and">
                            <div class="gate gate-and" :class="andOk ? 'is-on' : 'is-off'">
                                <span class="gate-symbol">&</span>
                                <span class="gate-name">AND</span>
                                <span class="gate-count">{{ andOkCount }}/{{ channels.length }}</span>
                            </div>
                        </div>

                        <div class="wire wire-mid" :class="andOk ? 'hi' : 'lo'"></div>

                        <!-- Reset -->
                        <div class="diagram-reset">
                            <div class="reset-block" :class="resetArmed ? 'is-ready' : 'is-wait'">
                                <div class="reset-title">{{ $t('SaftyPLCOverview.stage_reset') }}</div>
                                <div class="reset-pins">
                                    <span class="pin" :class="andOk ? 'is-on' : 'is-off'">Release</span>
                                    <button
                                        type="button"
                                        class="pin pin-btn clickable"
                                        :class="[
                                            softwareResetPin.on || resetBusy ? 'is-on' : 'is-off',
                                            { busy: resetBusy }
                                        ]"
                                        :disabled="resetBusy"
                                        :title="$t('SaftyPLCOverview.reset_sw_hint')"
                                        @click="onSoftwareResetClick">
                                        {{ $t('SaftyPLCOverview.reset_sw') }}
                                        <span v-if="resetBusy" class="pin-busy">…</span>
                                    </button>
                                    <span
                                        class="pin"
                                        :class="hardwareResetPin.on ? 'is-on' : 'is-off'"
                                        :title="hardwareResetPin.hint">
                                        {{ $t('SaftyPLCOverview.reset_hw') }}
                                    </span>
                                </div>
                                <div class="reset-out" :class="motorAnyOn ? 'is-on' : 'is-off'">
                                    Enabled
                                </div>
                            </div>
                        </div>

                        <div class="wire wire-mid" :class="motorAnyOn ? 'hi' : 'lo'"></div>

                        <!-- Motor outputs -->
                        <div class="diagram-output">
                            <div
                                v-for="m in motorOutputs"
                                :key="m.key"
                                class="motor-node"
                                :class="m.on ? 'is-on' : 'is-off'"
                                :title="m.hint">
                                <el-icon :size="16">
                                    <Lightning />
                                </el-icon>
                                <div class="motor-node-text">
                                    <span class="motor-node-label">{{ m.label }}</span>
                                    <span class="motor-node-state">{{ m.on ? 'ON' : 'OFF' }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <p class="diagram-note">{{ $t('SaftyPLCOverview.diagram_note') }}</p>
                </section>

                <!-- Collapsible signal details -->
                <el-collapse v-model="openPanels" class="ov-details">
                    <el-collapse-item name="signals" :title="$t('SaftyPLCOverview.signal_details')">
                        <div class="detail-toolbar">
                            <el-input
                                v-model="keyword"
                                clearable
                                size="small"
                                class="ov-search"
                                :placeholder="$t('SaftyPLCOverview.search_placeholder')" />
                            <el-checkbox v-model="onlyAbnormal" size="small">
                                {{ $t('SaftyPLCOverview.filter_abnormal') }}
                            </el-checkbox>
                            <span class="ov-count">{{ filteredSignals.length }} / {{ signals.length }}</span>
                        </div>
                        <div v-if="!filteredSignals.length" class="ov-empty">
                            {{ signals.length ? $t('SaftyPLCOverview.no_match') : $t('SaftyPLCOverview.no_data') }}
                        </div>
                        <div v-else class="detail-table">
                            <div
                                v-for="item in filteredDecorated"
                                :key="item.Signal"
                                class="detail-row"
                                :class="{ 'is-abnormal': item.abnormal }">
                                <code class="detail-addr">{{ item.address }}</code>
                                <span class="detail-name" :title="item.Signal">{{ item.shortName }}</span>
                                <span class="mini-badge" :class="item.RawBit ? 'hi' : 'lo'">
                                    {{ item.RawBit ? 1 : 0 }}
                                </span>
                                <span class="detail-logic" :class="item.State ? 'on' : 'off'">
                                    {{ item.State ? 'ON' : 'OFF' }}
                                </span>
                                <span class="mini-badge plain">{{ polarityText(item) }}</span>
                            </div>
                        </div>
                    </el-collapse-item>
                    <el-collapse-item name="json" :title="$t('SaftyPLCOverview.raw_json')">
                        <pre class="ov-raw-json">{{ prettyJson }}</pre>
                    </el-collapse-item>
                </el-collapse>
            </div>
        </el-dialog>
    </div>
</template>

<script>
import {
    CircleCheck,
    CircleClose,
    Cpu,
    Lightning,
    WarningFilled
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { DIO } from '@/api/VMSAPI'
import { SaftyPLCStore } from '@/store'

function notifyResetResult(type, message) {
    ElMessage({
        type,
        message,
        showClose: true,
        duration: 3000,
        // EP 此版會忽略 zIndex，改靠全域 .el-message CSS；customClass 雙保險
        customClass: 'safty-plc-msg-over-dialog',
        offset: 24
    })
}

const MOTOR_1 = 'CPUC200_Q1_Motor_Power_1'
const MOTOR_2 = 'CPUC200_Q2_Motor_Power_2'

/** 對應 Safety Designer：部分通道以 XTDO Status（IR259.x）作為迴路結果 */
const CHANNEL_DEFS = [
    {
        key: 'emo',
        labelKey: 'ch_emo',
        sensors: ['CPUC200_I1_EMO1', 'CPUC200_I2_EMO2'],
        bypasses: [],
        status: 'XTDO1_Q2_EMO_Status',
        useStatus: false
    },
    {
        key: 'bumper',
        labelKey: 'ch_bumper',
        sensors: ['CPUC200_I3_Bumper1', 'CPUC200_I4_Bumper2'],
        bypasses: [],
        status: 'XTDO1_Q1_Bumper_Status',
        useStatus: false
    },
    {
        key: 'front_lidar',
        labelKey: 'ch_front_lidar',
        sensors: ['CPUC200_I5_Front_Lidar_1', 'CPUC200_I6_Front_Lidar_2'],
        bypasses: ['CPUC200_I15_Front_Lidar_Bypass'],
        status: 'XTDO1_Q3_Front_Lidar_Status', // IR259.10
        useStatus: true
    },
    {
        key: 'back_lidar',
        labelKey: 'ch_back_lidar',
        sensors: ['CPUC200_I7_Back_Lidar_1', 'CPUC200_I8_Back_Lidar_2'],
        bypasses: ['CPUC200_I16_Back_Lidar_Bypass'],
        status: 'XTDO1_Q4_Back_Lidar_Status', // IR259.11
        useStatus: true
    },
    {
        key: 'right_lidar',
        labelKey: 'ch_right_lidar',
        sensors: ['CPUC200_I9_Right_Lidar_1'],
        bypasses: ['CPUC200_I17_Right_Lidar_Bypass'],
        status: 'XTDO1_Q5_Right_Lidar_Status', // IR259.12
        useStatus: true
    },
    {
        key: 'left_lidar',
        labelKey: 'ch_left_lidar',
        sensors: ['CPUC200_I10_Left_Lidar_1'],
        bypasses: ['CPUC200_I18_Left_Lidar_Bypass'],
        status: 'XTDO1_Q6_Left_Lidar_Status', // IR259.13
        useStatus: true
    },
    {
        key: 'front_hole',
        labelKey: 'ch_front_hole',
        sensors: ['CPUC200_I11_Front_Ground_Hole_Lidar_1'],
        bypasses: ['CPUC200_I19_Front_Ground_Hole_Lidar_Bypass'],
        status: 'XTDO1_Q7_Front_Ground_Hole_Status', // IR259.14
        useStatus: true
    },
    {
        key: 'back_hole',
        labelKey: 'ch_back_hole',
        sensors: ['CPUC200_I12_Back_Ground_Hole_Lidar_1'],
        bypasses: ['CPUC200_I20_Back_Ground_Hole_Lidar_Bypass'],
        status: 'XTDO1_Q8_Back_Ground_Hole_Status', // IR259.15
        useStatus: true
    }
]

const RESET_DEFS = [
    { key: 'sw', signal: 'XTDO1_I1_Reset_Software', labelKey: 'reset_sw' },
    { key: 'hw', signal: 'XTDO1_I2_Reset_Hardware', labelKey: 'reset_hw' }
]

const ALARM_ON_LOGIC_OFF = new Set([
    MOTOR_1,
    MOTOR_2,
    'XTDO1_Q1_Bumper_Status',
    'XTDO1_Q2_EMO_Status',
    'XTDO1_Q3_Front_Lidar_Status',
    'XTDO1_Q4_Back_Lidar_Status',
    'XTDO1_Q5_Right_Lidar_Status',
    'XTDO1_Q6_Left_Lidar_Status',
    'XTDO1_Q7_Front_Ground_Hole_Status',
    'XTDO1_Q8_Back_Ground_Hole_Status'
])

const MODULE_PREFIX = /^(?:CPUC200|XTDO1)_[IQX]\d+_/

export default {
    name: 'SaftyPLCStatus',
    components: {
        CircleCheck,
        CircleClose,
        Cpu,
        Lightning,
        WarningFilled
    },
    data() {
        return {
            showDialog: false,
            keyword: '',
            onlyAbnormal: false,
            openPanels: [],
            resetBusy: false
        }
    },
    computed: {
        status() {
            return SaftyPLCStore.getters.Status
        },
        hasStatus() {
            return SaftyPLCStore.getters.HasStatus
        },
        signals() {
            return SaftyPLCStore.getters.Signals
        },
        signalMap() {
            const map = new Map()
            for (const s of this.signals) map.set(s.Signal, s)
            return map
        },
        connected() {
            return SaftyPLCStore.getters.Connected
        },
        isSimulator() {
            return SaftyPLCStore.getters.IsSimulator
        },
        deviceStatus() {
            return SaftyPLCStore.getters.DeviceStatus
        },
        lastUpdateText() {
            const t = this.status?.LastUpdateTime
            if (!t) return '-'
            const d = new Date(t)
            if (Number.isNaN(d.getTime()) || d.getFullYear() < 2000) return '-'
            return d.toLocaleString()
        },
        motor1() {
            return this.signalMap.get(MOTOR_1)
        },
        motor2() {
            return this.signalMap.get(MOTOR_2)
        },
        motorChipState() {
            return this.signalState(this.motor1)
        },
        motorChipText() {
            return this.signalStateText(this.motor1)
        },
        channels() {
            return CHANNEL_DEFS.map(def => {
                const sensors = def.sensors.map(name => this.toNode(name, 'sensor')).filter(Boolean)
                const bypasses = def.bypasses.map(name => this.toNode(name, 'bypass')).filter(Boolean)
                const statusSig = this.signalMap.get(def.status)
                const statusNode = statusSig
                    ? this.toNode(def.status, 'status')
                    : null

                // Bypass ON → 迴路通；否則：有 Status 通道看 STS，其餘看全部 Sensor ON
                const bypassOn = bypasses.some(n => n.on)
                const sensorOk = sensors.length > 0 && sensors.every(n => n.on)
                const statusOk = !!statusSig?.State
                const baseOk = def.useStatus ? statusOk : sensorOk
                const orOk = bypassOn || baseOk

                const inputs = def.useStatus && statusNode
                    ? [statusNode, ...bypasses]
                    : [...sensors, ...bypasses]

                return {
                    key: def.key,
                    label: this.$t(`SaftyPLCOverview.${def.labelKey}`),
                    inputs,
                    orOk,
                    bypassed: bypassOn,
                    orHint: bypassOn
                        ? this.$t('SaftyPLCOverview.or_hint_bypass')
                        : def.useStatus
                            ? this.$t('SaftyPLCOverview.or_hint_status', {
                                addr: statusSig?.AddressDisplay || def.status,
                                result: orOk ? 'ON' : 'OFF'
                            })
                            : this.$t('SaftyPLCOverview.or_hint_sensor', {
                                result: orOk ? 'ON' : 'OFF',
                                status: statusSig ? `${statusSig.State ? 'ON' : 'OFF'}` : '-'
                            })
                }
            })
        },
        andOkCount() {
            return this.channels.filter(c => c.orOk).length
        },
        andOk() {
            return this.channels.length > 0 && this.andOkCount === this.channels.length
        },
        resetSignals() {
            return RESET_DEFS.map(def => {
                const sig = this.signalMap.get(def.signal)
                return {
                    key: def.key,
                    label: this.$t(`SaftyPLCOverview.${def.labelKey}`),
                    on: !!sig?.State,
                    hint: sig ? this.nodeHint(sig) : def.signal
                }
            })
        },
        softwareResetPin() {
            return this.resetSignals.find(r => r.key === 'sw') || { on: false, hint: '' }
        },
        hardwareResetPin() {
            return this.resetSignals.find(r => r.key === 'hw') || { on: false, hint: '' }
        },
        resetArmed() {
            return this.andOk
        },
        motorOutputs() {
            return [
                { key: 'm1', label: this.$t('SaftyPLCOverview.motor_1'), signal: this.motor1 },
                { key: 'm2', label: this.$t('SaftyPLCOverview.motor_2'), signal: this.motor2 }
            ].map(m => ({
                ...m,
                on: !!m.signal?.State && this.connected,
                hint: m.signal ? this.nodeHint(m.signal) : this.$t('SaftyPLCOverview.motor_missing')
            }))
        },
        motorAnyOn() {
            return this.motorOutputs.some(m => m.on)
        },
        abnormalSignals() {
            if (!this.connected) return []
            return this.signals.filter(s => ALARM_ON_LOGIC_OFF.has(s.Signal) && !s.State)
        },
        filteredSignals() {
            const kw = this.keyword.trim().toLowerCase()
            return this.signals.filter(s => {
                if (this.onlyAbnormal && !this.isAbnormal(s)) return false
                if (!kw) return true
                const haystack = [
                    s.Signal,
                    s.Description,
                    this.addressOf(s),
                    this.shortNameOf(s.Signal),
                    s.State ? 'on' : 'off'
                ].join(' ').toLowerCase()
                return haystack.includes(kw)
            })
        },
        filteredDecorated() {
            return this.filteredSignals.map(s => this.decorate(s))
        },
        prettyJson() {
            return JSON.stringify(this.status ?? {}, null, 2)
        }
    },
    methods: {
        async onSoftwareResetClick() {
            if (this.resetBusy)
                return

            this.resetBusy = true
            try {
                const ret = await DIO.SafetyRelaysReset()
                if (ret?.confirm) {
                    notifyResetResult('success', ret.message || this.$t('SaftyPLCOverview.reset_sw_ok'))
                } else {
                    notifyResetResult('error', ret?.message || this.$t('SaftyPLCOverview.reset_sw_failed'))
                }
            } catch (error) {
                notifyResetResult('error', error?.message || this.$t('SaftyPLCOverview.reset_sw_failed'))
            } finally {
                this.resetBusy = false
            }
        },
        toNode(signalName, kind) {
            const sig = this.signalMap.get(signalName)
            if (!sig) return null
            const short = this.shortNameOf(signalName)
            let label = short
            if (kind === 'bypass') label = short.replace(/ Bypass$/i, '') + ' BYP'
            if (kind === 'status') label = short.replace(/ Status$/i, '') + ' STS'
            return {
                key: signalName,
                label,
                on: !!sig.State,
                hint: this.nodeHint(sig)
            }
        },
        nodeHint(sig) {
            return `${sig.Signal}\n${sig.Description || ''}\n${this.addressOf(sig)}\nRaw=${sig.RawBit ? 1 : 0} → ${sig.State ? 'ON' : 'OFF'}`
        },
        decorate(signal) {
            return {
                ...signal,
                shortName: this.shortNameOf(signal.Signal),
                address: this.addressOf(signal),
                abnormal: this.isAbnormal(signal)
            }
        },
        shortNameOf(name) {
            return String(name || '').replace(MODULE_PREFIX, '').replace(/_/g, ' ')
        },
        addressOf(signal) {
            if (!signal) return '-'
            if (signal.AddressDisplay) return signal.AddressDisplay
            return `B${signal.ByteOffset}.${signal.BitInByte} / IR${signal.ModbusRegister}.${signal.BitInWord}`
        },
        polarityText(signal) {
            return signal?.ActiveHigh ? 'A-High' : 'A-Low'
        },
        isAbnormal(signal) {
            return this.connected && ALARM_ON_LOGIC_OFF.has(signal.Signal) && !signal.State
        },
        signalState(signal) {
            if (!this.connected) return 'offline'
            if (!signal) return 'unknown'
            return signal.State ? 'on' : 'off'
        },
        signalStateText(signal) {
            return this.$t(`SaftyPLCOverview.state_${this.signalState(signal)}`)
        },
        signalTipClass(signal) {
            const state = this.signalState(signal)
            if (state === 'on') return 'tip-on'
            if (state === 'off') return 'tip-off'
            return 'tip-idle'
        }
    }
}
</script>

<style lang="scss" scoped>
$c-ok: #2e7d32;
$c-ng: #c62828;
$c-idle: #90a4ae;
$c-gate: #f9a825;
$c-gate-border: #f57f17;
$c-reset: #e53935;
$mono: Consolas, 'Courier New', monospace;
$wire-hi: #43a047;
$wire-lo: #78909c;

.safty-plc-status {
    display: inline-flex;
    align-items: center;
}

/* ---------- 觸發 chip ---------- */
.motor-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 26px;
    padding: 0 8px;
    border: 1px solid #cfd8dc;
    border-radius: 13px;
    background: #fff;
    font-size: 12px;
    line-height: 1;
    color: #455a64;
    cursor: pointer;
    transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;

    &:hover {
        background: #f5f7f8;
        box-shadow: 0 1px 4px rgba(38, 50, 56, 0.18);
    }

    &:active {
        transform: translateY(1px);
    }

    .chip-icon {
        color: $c-idle;
    }

    .chip-label {
        font-weight: 600;
        white-space: nowrap;
    }

    .chip-state {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 7px;
        border-radius: 9px;
        font-family: $mono;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.4px;
        background: #eceff1;
        color: #607d8b;
    }

    .chip-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: currentColor;
    }

    .chip-alert {
        display: inline-flex;
        align-items: center;
        gap: 2px;
        padding: 1px 6px;
        border-radius: 9px;
        background: $c-ng;
        color: #fff;
        font-size: 11px;
        font-weight: 700;
    }

    &.is-on {
        border-color: #a5d6a7;
        background: #f1f8e9;

        .chip-icon {
            color: $c-ok;
        }

        .chip-state {
            background: $c-ok;
            color: #fff;
        }
    }

    &.is-off {
        border-color: #ef9a9a;
        background: #fdecea;

        .chip-icon {
            color: $c-ng;
        }

        .chip-state {
            background: $c-ng;
            color: #fff;
            animation: chip-pulse 1.4s ease-in-out infinite;
        }
    }
}

@keyframes chip-pulse {
    0%,
    100% {
        box-shadow: 0 0 0 0 rgba(198, 40, 40, 0.55);
    }

    50% {
        box-shadow: 0 0 0 4px rgba(198, 40, 40, 0);
    }
}

.chip-tip {
    min-width: 210px;
    font-size: 12px;
    line-height: 1.6;
}

.chip-tip-title {
    margin-bottom: 4px;
    font-weight: 700;
}

.chip-tip-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
}

.chip-tip-hint {
    margin-top: 5px;
    padding-top: 4px;
    border-top: 1px solid rgba(255, 255, 255, 0.25);
    opacity: 0.75;
}

.tip-on {
    color: #81c784;
}

.tip-off {
    color: #ef9a9a;
}

.tip-idle {
    color: #cfd8dc;
}

/* ---------- Dialog header / meta ---------- */
.ov-header {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding-right: 0;
}

.ov-close-btn {
    flex: 0 0 auto;
    margin-left: 4px;
}

.ov-header-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: linear-gradient(135deg, #1565c0, #42a5f5);
    color: #fff;
    flex: 0 0 auto;
}

.ov-header-text {
    min-width: 0;

    h3 {
        margin: 0;
        font-size: 17px;
        font-weight: 700;
        color: #1c2833;
    }

    span {
        font-size: 11px;
        color: #78909c;
        font-family: $mono;
    }
}

.ov-header-chips {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
}

.pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 10px;
    border-radius: 11px;
    font-size: 11px;
    font-weight: 700;
    white-space: nowrap;

    &.pill-ok {
        background: #e8f5e9;
        color: $c-ok;
    }

    &.pill-ng {
        background: #fdecea;
        color: $c-ng;
    }

    &.pill-sim {
        background: #ede7f6;
        color: #5e35b1;
    }

    &.pill-plain {
        background: #eceff1;
        color: #546e7a;
    }
}

.ov-body {
    /* 捲動交給 dialog body，header（含關閉鈕）固定在上方 */
    max-height: none;
    overflow: visible;
    padding-right: 4px;
}

.ov-meta {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 8px;
    margin-bottom: 12px;
}

.meta-tile {
    padding: 7px 10px;
    border: 1px solid #eceff1;
    border-radius: 7px;
    background: #f7f9fa;

    &.is-good {
        border-color: #c8e6c9;
        background: #f4faf3;
    }

    &.is-bad {
        border-color: #ffcdd2;
        background: #fdf5f4;
    }
}

.meta-key {
    display: block;
    font-size: 11px;
    color: #90a4ae;
}

.meta-val {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: #37474f;
    word-break: break-word;

    .is-bad & {
        color: $c-ng;
    }
}

.legend-line {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
    font-size: 12px;
}

.lg {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 2px;

    &.on {
        background: $wire-hi;
    }

    &.off {
        background: #cfd8dc;
        border: 1px solid #b0bec5;
    }
}

/* ---------- Logic diagram ---------- */
.diagram {
    margin-bottom: 12px;
    padding: 12px;
    border: 1px solid #e0e6e9;
    border-radius: 10px;
    background:
        linear-gradient(#eceff1 1px, transparent 1px) 0 0 / 16px 16px,
        linear-gradient(90deg, #eceff1 1px, transparent 1px) 0 0 / 16px 16px,
        #fafbfc;

    &.offline {
        opacity: 0.72;
    }
}

.diagram-stage-labels {
    display: grid;
    grid-template-columns: minmax(260px, 1.5fr) 18px 72px 28px 120px 28px minmax(140px, 0.85fr);
    gap: 0 6px;
    margin-bottom: 8px;
    padding: 0 4px;
    font-size: 11px;
    font-weight: 700;
    color: #78909c;
    text-transform: uppercase;
    letter-spacing: 0.4px;

    .col-inputs {
        grid-column: 1;
    }

    .col-and {
        grid-column: 3;
        text-align: center;
    }

    .col-reset {
        grid-column: 5;
        text-align: center;
    }

    .col-output {
        grid-column: 7;
    }
}

.diagram-grid {
    display: grid;
    grid-template-columns: minmax(260px, 1.5fr) 18px 72px 28px 120px 28px minmax(140px, 0.85fr);
    gap: 0 6px;
    align-items: stretch;
}

.diagram-channels {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.channel-row {
    display: grid;
    grid-template-columns: 1fr 18px 52px 18px;
    align-items: center;
    min-height: 52px;
    padding: 4px 0;

    &.is-fault .channel-title {
        color: $c-ng;
    }
}

.channel-inputs {
    min-width: 0;
}

.channel-title {
    margin-bottom: 3px;
    font-size: 11px;
    font-weight: 700;
    color: #546e7a;
}

.pill-stack {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
}

.sig-pill {
    position: relative;
    display: inline-flex;
    align-items: center;
    max-width: 100%;
    padding: 3px 8px;
    border-radius: 4px 10px 10px 4px;
    border: 1px solid #cfd8dc;
    background: #fff;
    color: #607d8b;
    font-size: 11px;
    font-weight: 600;
    line-height: 1.3;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    &.is-on {
        background: #e8f5e9;
        border-color: #81c784;
        color: $c-ok;
    }

    &.is-off {
        background: #fff;
        border-color: #ef9a9a;
        color: #90a4ae;
    }

    &.is-missing {
        color: #b0bec5;
        border-style: dashed;
    }
}

.sig-slash {
    position: absolute;
    inset: 0;
    pointer-events: none;

    &::after {
        content: '';
        position: absolute;
        left: 8%;
        right: 8%;
        top: 50%;
        height: 2px;
        background: rgba(198, 40, 40, 0.55);
        transform: rotate(-18deg);
    }
}

.wire {
    height: 3px;
    border-radius: 2px;
    background: $wire-lo;

    &.hi {
        background: $wire-hi;
        box-shadow: 0 0 0 1px rgba(67, 160, 71, 0.2);
    }

    &.lo {
        background: $wire-lo;
        opacity: 0.55;
    }
}

.wire-mid {
    align-self: center;
}

.gate {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 48px;
    min-height: 44px;
    margin: 0 auto;
    border-radius: 4px;
    border: 1px solid $c-gate-border;
    background: linear-gradient(180deg, #ffecb3, #ffd54f);
    color: #5d4037;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5);

    &.is-on {
        border-color: #2e7d32;
        box-shadow: 0 0 0 2px rgba(46, 125, 50, 0.2);
    }

    &.is-off {
        filter: grayscale(0.35);
        opacity: 0.85;
    }
}

.gate-symbol {
    font-family: $mono;
    font-size: 14px;
    font-weight: 800;
    line-height: 1;
}

.gate-name {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.3px;
}

.gate-count {
    margin-top: 2px;
    font-family: $mono;
    font-size: 10px;
    font-weight: 700;
}

.gate-byp {
    margin-top: 2px;
    padding: 0 4px;
    border-radius: 3px;
    background: #5e35b1;
    color: #fff;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.3px;
}

.gate-and {
    width: 56px;
    min-height: 120px;
    height: 100%;
}

.diagram-bus {
    position: relative;
    margin: 10px 0;

    .bus-line {
        position: absolute;
        left: 50%;
        top: 0;
        bottom: 0;
        width: 3px;
        transform: translateX(-50%);
        border-radius: 2px;
        background: $wire-lo;
    }

    &.hi .bus-line {
        background: $wire-hi;
    }
}

.diagram-and,
.diagram-reset,
.diagram-output {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 8px;
}

.reset-block {
    padding: 8px;
    border-radius: 6px;
    border: 2px solid $c-reset;
    background: #fff5f5;
    text-align: center;

    &.is-ready {
        border-color: $c-ok;
        background: #f1f8e9;
    }
}

.reset-title {
    margin-bottom: 6px;
    font-size: 11px;
    font-weight: 800;
    color: $c-reset;
    letter-spacing: 0.3px;

    .is-ready & {
        color: $c-ok;
    }
}

.reset-pins {
    display: flex;
    flex-direction: column;
    gap: 3px;
}

.pin {
    padding: 2px 6px;
    border-radius: 3px;
    border: 1px solid #cfd8dc;
    background: #fff;
    font-size: 10px;
    font-weight: 600;
    color: #78909c;

    &.is-on {
        background: #e8f5e9;
        border-color: #81c784;
        color: $c-ok;
    }

    &.is-off {
        color: #b0bec5;
    }
}

.pin-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 2px;
    width: 100%;
    cursor: default;
    font: inherit;
    line-height: 1.4;
    transition: transform 0.1s ease, box-shadow 0.1s ease, background 0.15s ease;

    &.clickable {
        cursor: pointer;
        border-color: #90caf9;
        color: #1565c0;
        background: #e3f2fd;

        &:hover:not(:disabled) {
            transform: scale(1.03);
            box-shadow: 0 0 0 2px rgba(21, 101, 192, 0.22);
            background: #bbdefb;
            color: #0d47a1;
        }

        &:active:not(:disabled) {
            transform: scale(0.98);
        }
    }

    &.busy,
    &:disabled:not(.clickable) {
        opacity: 0.55;
        cursor: not-allowed;
        pointer-events: none;
    }

    &.clickable:disabled {
        opacity: 0.7;
        cursor: wait;
        pointer-events: none;
    }
}

.pin-busy {
    font-family: $mono;
    font-weight: 800;
}

.reset-out {
    margin-top: 6px;
    padding: 3px 6px;
    border-radius: 3px;
    font-size: 11px;
    font-weight: 800;
    background: #eceff1;
    color: #90a4ae;

    &.is-on {
        background: $c-ok;
        color: #fff;
    }
}

.motor-node {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border-radius: 8px;
    border: 1px solid #cfd8dc;
    background: #fff;
    color: #78909c;

    &.is-on {
        border-color: #81c784;
        background: #e8f5e9;
        color: $c-ok;
    }

    &.is-off {
        border-color: #ef9a9a;
        background: #fdecea;
        color: $c-ng;
    }
}

.motor-node-text {
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.motor-node-label {
    font-size: 12px;
    font-weight: 700;
    white-space: nowrap;
}

.motor-node-state {
    font-family: $mono;
    font-size: 14px;
    font-weight: 800;
    line-height: 1.1;
}

.diagram-note {
    margin: 10px 0 0;
    font-size: 11px;
    color: #90a4ae;
    line-height: 1.45;
}

/* ---------- Details ---------- */
.ov-details {
    border-top: 1px solid #eceff1;
}

.detail-toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
    flex-wrap: wrap;
}

.ov-search {
    width: min(320px, 100%);
}

.ov-count {
    margin-left: auto;
    font-family: $mono;
    font-size: 12px;
    color: #90a4ae;
}

.ov-empty {
    padding: 18px 0;
    text-align: center;
    font-size: 13px;
    color: #b0bec5;
}

.detail-table {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-height: 280px;
    overflow: auto;
}

.detail-row {
    display: grid;
    grid-template-columns: 140px 1fr 36px 44px 56px;
    gap: 8px;
    align-items: center;
    padding: 5px 8px;
    border-radius: 5px;
    border: 1px solid #eceff1;
    background: #fff;
    font-size: 12px;

    &.is-abnormal {
        border-color: #ef9a9a;
        background: #fdf5f4;
    }
}

.detail-addr {
    font-family: $mono;
    font-size: 11px;
    color: #78909c;
    background: none;
    padding: 0;
}

.detail-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 600;
    color: #37474f;
}

.detail-logic {
    font-family: $mono;
    font-weight: 700;
    font-size: 11px;
    text-align: center;

    &.on {
        color: $c-ok;
    }

    &.off {
        color: #9e9e9e;
    }
}

.mini-badge {
    display: inline-flex;
    justify-content: center;
    padding: 1px 6px;
    border-radius: 4px;
    font-family: $mono;
    font-size: 10px;
    font-weight: 700;
    line-height: 1.5;

    &.hi {
        background: #e8f5e9;
        color: $c-ok;
        border: 1px solid #c8e6c9;
    }

    &.lo {
        background: #eceff1;
        color: #78909c;
        border: 1px solid #dde3e6;
    }

    &.plain {
        background: #fff;
        color: #90a4ae;
        border: 1px solid #e0e6e9;
    }
}

.ov-raw-json {
    max-height: 280px;
    overflow: auto;
    margin: 0;
    padding: 10px;
    border-radius: 6px;
    background: #263238;
    color: #cfd8dc;
    font-family: $mono;
    font-size: 11px;
    line-height: 1.5;
}

:deep(.el-collapse-item__header) {
    font-size: 12px;
    font-weight: 600;
    color: #607d8b;
}

@media (max-width: 960px) {
    .diagram-stage-labels {
        display: none;
    }

    .diagram-grid {
        grid-template-columns: 1fr;
        gap: 10px;
    }

    .channel-row {
        grid-template-columns: 1fr 40px;
        grid-template-rows: auto auto;

        .wire-to-bus {
            display: none;
        }

        .gate-or {
            grid-column: 2;
            grid-row: 1 / span 2;
        }
    }

    .diagram-bus {
        display: none;
    }

    .wire-mid {
        display: none;
    }

    .detail-row {
        grid-template-columns: 1fr auto auto;
        grid-template-areas:
            'name logic pol'
            'addr raw pol';

        .detail-addr {
            grid-area: addr;
        }

        .detail-name {
            grid-area: name;
        }
    }
}
</style>

<!-- append-to-body 的 dialog 需非 scoped，才能固定 header、只捲動 body -->
<style lang="scss">
.safty-plc-overview-dialog.el-dialog,
.el-dialog.safty-plc-overview-dialog {
    display: flex;
    flex-direction: column;
    max-height: 92vh;
    margin-bottom: 0;
    overflow: hidden;
}

.safty-plc-overview-dialog .el-dialog__header {
    flex: 0 0 auto;
    margin-right: 0;
    padding: 14px 16px 10px;
    border-bottom: 1px solid #eceff1;
    background: #fff;
}

.safty-plc-overview-dialog .el-dialog__body {
    flex: 1 1 auto;
    min-height: 0;
    max-height: none;
    overflow-y: auto;
    padding: 12px 16px 16px;
}

.safty-plc-overview-dialog .el-dialog__footer {
    display: none;
}

/* 蓋過 overview dialog (z-index 1200000)；EP Message 的 inline z-index 需 !important */
.el-message.safty-plc-msg-over-dialog {
    z-index: 1300000 !important;
}
</style>
