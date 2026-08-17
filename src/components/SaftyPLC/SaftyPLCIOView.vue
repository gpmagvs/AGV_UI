<template>
    <div class="safty-plc-io-view">
        <div class="header-bar d-flex align-items-center justify-content-between mb-2 px-1 gap-2 flex-wrap">
            <div class="d-flex align-items-center gap-3 flex-wrap">
                <span class="status-chip" :class="connected ? 'ok' : 'ng'">
                    {{ connected ? $t('SaftyPLC.connected') : $t('SaftyPLC.disconnected') }}
                </span>
                <span v-if="isSimulator" class="status-chip sim">{{ $t('SaftyPLC.simulator') }}</span>
                <span class="text-muted small">{{ $t('SaftyPLC.device') }}: {{ deviceStatus || '-' }}</span>
                <span class="text-muted small">{{ $t('SaftyPLC.updated') }}: {{ lastUpdateText }}</span>
            </div>
            <div class="d-flex align-items-center gap-2">
                <button
                    type="button"
                    class="help-icon-btn"
                    :title="$t('SaftyPLC.help_btn_title')"
                    :aria-label="$t('SaftyPLC.help_btn_title')"
                    @click="helpVisible = true">
                    <el-icon :size="16"><QuestionFilled /></el-icon>
                </button>
                <el-input
                    v-model="keyword"
                    clearable
                    size="small"
                    :placeholder="$t('SaftyPLC.search_placeholder')"
                    class="search-input"
                />
                <span class="text-muted small text-nowrap">{{ filteredSignals.length }} / {{ signals.length }}</span>
            </div>
        </div>

        <el-dialog
            v-model="helpVisible"
            :title="$t('SaftyPLC.help_title')"
            width="720px"
            top="8vh"
            draggable
            destroy-on-close
            class="safty-plc-help-dialog"
            append-to-body>
            <div class="help-body">
                <section class="help-section">
                    <h4>{{ $t('SaftyPLC.help_overview_title') }}</h4>
                    <p>{{ $t('SaftyPLC.help_overview_p1') }}</p>
                    <p>{{ $t('SaftyPLC.help_overview_p2') }}</p>
                </section>

                <section class="help-section">
                    <h4>{{ $t('SaftyPLC.help_status_title') }}</h4>
                    <ul>
                        <li><b>{{ $t('SaftyPLC.connected') }} / {{ $t('SaftyPLC.disconnected') }}</b> — {{ $t('SaftyPLC.help_status_conn') }}</li>
                        <li><b>{{ $t('SaftyPLC.simulator') }}</b> — {{ $t('SaftyPLC.help_status_sim') }}</li>
                        <li><b>{{ $t('SaftyPLC.device') }}</b> — {{ $t('SaftyPLC.help_status_device') }}</li>
                        <li><b>{{ $t('SaftyPLC.updated') }}</b> — {{ $t('SaftyPLC.help_status_updated') }}</li>
                    </ul>
                </section>

                <section class="help-section">
                    <h4>{{ $t('SaftyPLC.help_columns_title') }}</h4>
                    <div class="help-col">
                        <h5>{{ $t('SaftyPLC.col_address') }}</h5>
                        <p>{{ $t('SaftyPLC.help_col_address') }}</p>
                    </div>
                    <div class="help-col">
                        <h5>{{ $t('SaftyPLC.col_signal') }}</h5>
                        <p>{{ $t('SaftyPLC.help_col_signal') }}</p>
                    </div>
                    <div class="help-col">
                        <h5>{{ $t('SaftyPLC.col_description') }}</h5>
                        <p>{{ $t('SaftyPLC.help_col_description') }}</p>
                    </div>
                    <div class="help-col">
                        <h5>{{ $t('SaftyPLC.col_raw') }}</h5>
                        <p>{{ $t('SaftyPLC.help_col_raw') }}</p>
                    </div>
                    <div class="help-col">
                        <h5>{{ $t('SaftyPLC.col_logic') }}</h5>
                        <p>{{ $t('SaftyPLC.help_col_logic') }}</p>
                    </div>
                    <div class="help-col">
                        <h5>{{ $t('SaftyPLC.col_polarity') }}</h5>
                        <p>{{ $t('SaftyPLC.help_col_polarity') }}</p>
                    </div>
                </section>

                <section class="help-section">
                    <h4>{{ $t('SaftyPLC.help_relation_title') }}</h4>
                    <p>{{ $t('SaftyPLC.help_relation_p1') }}</p>
                    <ul>
                        <li>{{ $t('SaftyPLC.help_relation_high') }}</li>
                        <li>{{ $t('SaftyPLC.help_relation_low') }}</li>
                    </ul>
                    <p>{{ $t('SaftyPLC.help_relation_p2') }}</p>
                </section>

                <section class="help-section">
                    <h4>{{ $t('SaftyPLC.help_usage_title') }}</h4>
                    <ul>
                        <li>{{ $t('SaftyPLC.help_usage_search') }}</li>
                        <li>{{ $t('SaftyPLC.help_usage_raw') }}</li>
                        <li>{{ $t('SaftyPLC.help_usage_polarity') }}</li>
                        <li>{{ $t('SaftyPLC.help_usage_row_color') }}</li>
                    </ul>
                </section>

                <section class="help-section">
                    <h4>{{ $t('SaftyPLC.help_tips_title') }}</h4>
                    <ul>
                        <li>{{ $t('SaftyPLC.help_tips_xtdo') }}</li>
                        <li>{{ $t('SaftyPLC.help_tips_persist') }}</li>
                        <li>{{ $t('SaftyPLC.help_tips_logic_alarm') }}</li>
                    </ul>
                </section>
            </div>
            <template #footer>
                <el-button type="primary" @click="helpVisible = false">OK</el-button>
            </template>
        </el-dialog>

        <div ref="tableWrap" class="table-wrap">
            <el-table
                ref="table"
                size="small"
                :data="filteredSignals"
                border
                :height="tableHeight"
                row-key="Signal"
                :row-class-name="rowClassName"
                :empty-text="emptyText"
                style="width: 100%">
                <el-table-column :label="$t('SaftyPLC.col_address')" width="140" fixed="left">
                    <template #default="scope">
                        <div class="addr-cell">
                            <span class="addr-main">B{{ scope.row.ByteOffset }}.{{ scope.row.BitInByte }}</span>
                            <span class="addr-sub">IR{{ scope.row.ModbusRegister }}.{{ scope.row.BitInWord }}</span>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column :label="$t('SaftyPLC.col_signal')" prop="Signal" width="220" fixed="left"
                    show-overflow-tooltip />
                <el-table-column :label="$t('SaftyPLC.col_description')" prop="Description" min-width="200"
                    show-overflow-tooltip />
                <el-table-column :label="$t('SaftyPLC.col_raw')" width="88" align="center" fixed="right">
                    <template #default="scope">
                        <span
                            class="raw-badge"
                            :class="[
                                scope.row.RawBit ? 'hi' : 'lo',
                                { clickable: canToggleRaw, busy: togglingKey === rawKey(scope.row) }
                            ]"
                            @click="onRawClick(scope.row)">
                            {{ scope.row.RawBit ? 1 : 0 }}
                        </span>
                    </template>
                </el-table-column>
                <el-table-column :label="$t('SaftyPLC.col_logic')" width="72" align="center" fixed="right">
                    <template #default="scope">
                        <span class="logic-text" :class="scope.row.State ? 'on' : 'off'" :title="logicTitle(scope.row)">
                            {{ scope.row.State ? 'ON' : 'OFF' }}
                        </span>
                    </template>
                </el-table-column>
                <el-table-column :label="$t('SaftyPLC.col_polarity')" width="88" align="center" fixed="right">
                    <template #default="scope">
                        <span
                            class="polarity"
                            :class="{ clickable: canEditPolarity, busy: polarityKey === polarityEditKey(scope.row) }"
                            :title="polarityTitle(scope.row)"
                            @click="onPolarityClick(scope.row)">
                            {{ scope.row.ActiveHigh ? 'A-High' : 'A-Low' }}
                        </span>
                    </template>
                </el-table-column>
            </el-table>
        </div>
    </div>
</template>

<script>
import { QuestionFilled } from '@element-plus/icons-vue'
import { SaftyPLCStore, UserStore } from '@/store'
import { SaftyPLCAPI } from '@/api/SaftyPLCAPI.js'

const BOTTOM_RESERVED_PX = 24
const MIN_TABLE_HEIGHT_PX = 240

export default {
    name: 'SaftyPLCIOView',
    components: {
        QuestionFilled
    },
    data() {
        return {
            keyword: '',
            tableHeight: 400,
            resizeObserver: null,
            togglingKey: null,
            polarityKey: null,
            helpVisible: false
        }
    },
    computed: {
        status() {
            return SaftyPLCStore.getters.Status
        },
        signals() {
            return SaftyPLCStore.getters.Signals
        },
        filteredSignals() {
            const kw = (this.keyword || '').trim().toLowerCase()
            if (!kw) return this.signals

            return this.signals.filter(s => {
                const address = `b${s.ByteOffset}.${s.BitInByte} ir${s.ModbusRegister}.${s.BitInWord} ${s.AddressDisplay || ''}`
                const raw = s.RawBit ? '1' : '0'
                const logic = s.State ? 'on' : 'off'
                const polarity = s.ActiveHigh ? 'a-high activehigh' : 'a-low activelow'
                const haystack = [
                    s.Signal,
                    s.Description,
                    address,
                    `raw${raw}`,
                    `raw=${raw}`,
                    logic,
                    polarity
                ].join(' ').toLowerCase()
                return haystack.includes(kw)
            })
        },
        emptyText() {
            if (this.signals.length && this.keyword.trim() && !this.filteredSignals.length)
                return this.$t('SaftyPLC.no_match')
            return this.$t('SaftyPLC.no_data')
        },
        connected() {
            return SaftyPLCStore.getters.Connected
        },
        isSimulator() {
            return SaftyPLCStore.getters.IsSimulator
        },
        canToggleRaw() {
            return this.connected && this.isSimulator && UserStore.getters.CurrentUserRole != 0
        },
        canEditPolarity() {
            return UserStore.getters.CurrentUserRole != 0
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
        }
    },
    mounted() {
        this.updateTableSize()
        window.addEventListener('resize', this.updateTableSize)
        if (typeof ResizeObserver !== 'undefined' && this.$refs.tableWrap) {
            this.resizeObserver = new ResizeObserver(() => this.updateTableSize())
            this.resizeObserver.observe(this.$refs.tableWrap)
        }
    },
    beforeUnmount() {
        window.removeEventListener('resize', this.updateTableSize)
        if (this.resizeObserver) {
            this.resizeObserver.disconnect()
            this.resizeObserver = null
        }
    },
    methods: {
        /** 表格高度取「視窗底部扣掉表格起始位置」，寬度由 el-table 隨容器自動計算 */
        updateTableSize() {
            this.$nextTick(() => {
                const wrap = this.$refs.tableWrap
                if (wrap) {
                    const top = wrap.getBoundingClientRect().top
                    const available = Math.floor(window.innerHeight - top - BOTTOM_RESERVED_PX)
                    this.tableHeight = Math.max(available, MIN_TABLE_HEIGHT_PX)
                }
                this.$refs.table?.doLayout?.()
            })
        },
        rowClassName({ row }) {
            return row.RawBit ? 'row-raw-hi' : 'row-raw-lo'
        },
        logicTitle(row) {
            const polarity = row.ActiveHigh ? 'ActiveHigh' : 'ActiveLow'
            return `${polarity} : Raw=${row.RawBit ? 1 : 0} -> Logic ${row.State ? 'ON' : 'OFF'}`
        },
        polarityTitle(row) {
            const base = row.ActiveHigh
                ? this.$t('SaftyPLC.polarity_high_hint')
                : this.$t('SaftyPLC.polarity_low_hint')
            if (!this.canEditPolarity)
                return base
            return `${base}\n${this.$t('SaftyPLC.polarity_click_hint')}`
        },
        rawKey(row) {
            return `${row.ByteOffset}.${row.BitInByte}`
        },
        polarityEditKey(row) {
            return row.Signal
        },
        async onRawClick(row) {
            if (!this.canToggleRaw)
                return
            if (this.togglingKey || this.polarityKey) {
                this.$message?.warning?.(this.$t('SaftyPLC.toggle_busy'))
                return
            }

            const nextValue = !row.RawBit
            const confirmText = this.$t('SaftyPLC.toggle_confirm_text', {
                signal: row.Signal,
                byte: row.ByteOffset,
                bit: row.BitInByte,
                value: nextValue ? 1 : 0
            })

            const result = await this.$swal.fire({
                title: this.$t('SaftyPLC.toggle_confirm_title'),
                text: confirmText,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'OK',
                customClass: 'my-sweetalert'
            })

            if (!result.isConfirmed)
                return

            this.togglingKey = this.rawKey(row)
            try {
                const ret = await SaftyPLCAPI.SetSimulatorResultBit(row.ByteOffset, row.BitInByte, nextValue)
                if (!ret?.confirm) {
                    this.$message?.error?.(ret?.message || this.$t('SaftyPLC.toggle_failed'))
                }
            } catch (error) {
                this.$message?.error?.(error?.message || this.$t('SaftyPLC.toggle_failed'))
            } finally {
                this.togglingKey = null
            }
        },
        async onPolarityClick(row) {
            if (!this.canEditPolarity)
                return
            if (this.togglingKey || this.polarityKey) {
                this.$message?.warning?.(this.$t('SaftyPLC.toggle_busy'))
                return
            }

            const nextActiveHigh = !row.ActiveHigh
            const nextPolarity = nextActiveHigh ? 'ActiveHigh' : 'ActiveLow'
            const confirmText = this.$t('SaftyPLC.polarity_confirm_text', {
                signal: row.Signal,
                polarity: nextPolarity
            })

            const result = await this.$swal.fire({
                title: this.$t('SaftyPLC.polarity_confirm_title'),
                text: confirmText,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'OK',
                customClass: 'my-sweetalert'
            })

            if (!result.isConfirmed)
                return

            this.polarityKey = this.polarityEditKey(row)
            try {
                const ret = await SaftyPLCAPI.SetActiveHigh(row.Signal, nextActiveHigh)
                if (!ret?.confirm) {
                    this.$message?.error?.(ret?.message || this.$t('SaftyPLC.polarity_failed'))
                }
            } catch (error) {
                this.$message?.error?.(error?.message || this.$t('SaftyPLC.polarity_failed'))
            } finally {
                this.polarityKey = null
            }
        }
    }
}
</script>

<style lang="scss" scoped>
.safty-plc-io-view {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.header-bar {
    flex: 0 0 auto;
    min-height: 28px;
}

.search-input {
    width: min(280px, 100%);
}

.help-icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    border: 1px solid #90a4ae;
    border-radius: 50%;
    background: #fff;
    color: #546e7a;
    cursor: pointer;
    flex: 0 0 auto;
    transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;

    &:hover {
        color: #1565c0;
        border-color: #1565c0;
        background: #e3f2fd;
        box-shadow: 0 0 0 2px rgba(21, 101, 192, 0.18);
    }

    &:active {
        transform: scale(0.96);
    }
}

.help-body {
    max-height: min(70vh, 640px);
    overflow-y: auto;
    padding-right: 4px;
    font-size: 13px;
    line-height: 1.55;
    color: #37474f;
}

.help-section {
    margin-bottom: 1.1rem;

    &:last-child {
        margin-bottom: 0;
    }

    h4 {
        margin: 0 0 0.45rem;
        font-size: 15px;
        font-weight: 700;
        color: #263238;
    }

    h5 {
        margin: 0.55rem 0 0.2rem;
        font-size: 13px;
        font-weight: 700;
        color: #455a64;
    }

    p {
        margin: 0 0 0.4rem;
    }

    ul {
        margin: 0.2rem 0 0.4rem;
        padding-left: 1.2rem;

        li {
            margin-bottom: 0.28rem;
        }
    }
}

.help-col {
    padding: 0.35rem 0.55rem;
    margin-bottom: 0.35rem;
    border-left: 3px solid #90caf9;
    background: #f5f9fc;
    border-radius: 0 4px 4px 0;
}

.table-wrap {
    flex: 1 1 auto;
    min-width: 0;
    min-height: 0;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    overflow: hidden;
}

.status-chip {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    color: #fff;

    &.ok {
        background: #28a745;
    }

    &.ng {
        background: #dc3545;
    }

    &.sim {
        background: #6f42c1;
    }
}

.addr-cell {
    display: flex;
    flex-direction: column;
    line-height: 1.25;
}

.addr-main {
    font-family: Consolas, 'Courier New', monospace;
    font-weight: 600;
    font-size: 13px;
}

.addr-sub {
    font-family: Consolas, 'Courier New', monospace;
    font-size: 11px;
    color: #888;
}

.raw-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 28px;
    border-radius: 4px;
    font-family: Consolas, 'Courier New', monospace;
    font-size: 16px;
    font-weight: 700;
    user-select: none;

    &.hi {
        background: #2e7d32;
        color: #fff;
    }

    &.lo {
        background: #eceff1;
        color: #546e7a;
        border: 1px solid #cfd8dc;
    }

    &.clickable {
        cursor: pointer;
        transition: transform 0.1s ease, box-shadow 0.1s ease;

        &:hover {
            transform: scale(1.08);
            box-shadow: 0 0 0 2px rgba(111, 66, 193, 0.35);
        }
    }

    &.busy {
        opacity: 0.55;
        pointer-events: none;
    }
}

.logic-text {
    font-size: 12px;
    font-weight: 600;

    &.on {
        color: #2e7d32;
    }

    &.off {
        color: #9e9e9e;
    }
}

.polarity {
    font-size: 11px;
    color: #757575;
    user-select: none;

    &.clickable {
        cursor: pointer;
        padding: 4px 6px;
        border-radius: 4px;
        border: 1px solid #cfd8dc;
        transition: transform 0.1s ease, box-shadow 0.1s ease, background 0.1s ease;

        &:hover {
            transform: scale(1.05);
            background: #eceff1;
            box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.25);
            color: #37474f;
        }
    }

    &.busy {
        opacity: 0.55;
        pointer-events: none;
    }
}

:deep(.row-raw-hi) {
    --el-table-tr-bg-color: #f1f8e9;
}

:deep(.row-raw-lo) {
    --el-table-tr-bg-color: #fff;
}

:deep(.el-table) {
    width: 100% !important;
}

:deep(.el-table .cell) {
    line-height: 1.3;
}
</style>
