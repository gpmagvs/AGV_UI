<template>
  <div class="alarm-history">
    <!-- Toolbar -->
    <header class="alarm-toolbar">
      <div class="toolbar-left">
        <div class="title-block">
          <span class="title-icon" aria-hidden="true">
            <i class="bi bi-exclamation-triangle-fill"></i>
          </span>
          <div class="title-text">
            <h3 class="title">{{ $t('abnormal-record') }}</h3>
            <p class="subtitle">
              {{ $t('AlarmHistory.total_count', { count: totalAlarmNum }) }}
              <span v-if="TimeRangeOpt === 'limit'" class="range-hint">· {{ $t('AlarmHistory.range_hint_custom') }}</span>
              <span v-else class="range-hint">· {{ $t('AlarmHistory.range_hint_recent') }}</span>
            </p>
          </div>
        </div>

        <div class="level-filter" role="group" :aria-label="$t('alarm-type')">
          <button
            v-for="opt in levelOptions"
            :key="opt.value"
            type="button"
            class="level-chip"
            :class="[opt.tone, { active: DisplaySelected === opt.value }]"
            @click="selectLevel(opt.value)"
          >
            <span class="chip-dot"></span>
            {{ $t(opt.labelKey) }}
          </button>
        </div>
      </div>

      <div class="toolbar-actions">
        <el-button :loading="loading" @click="AlarmDownload">
          <i class="bi bi-arrow-clockwise me-1"></i>
          {{ $t('refresh') }}
        </el-button>
        <el-button :type="filterExpanded ? 'primary' : 'default'" @click="filterExpanded = !filterExpanded">
          <i class="bi bi-funnel me-1"></i>
          {{ filterExpanded ? $t('AlarmHistory.collapse_filter') : $t('AlarmHistory.expand_filter') }}
          <i class="bi ms-1" :class="filterExpanded ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
        </el-button>
        <el-button
          v-if="clear_alarm_btn_visible"
          type="danger"
          plain
          @click="ClearAlarmAlert"
        >
          <i class="bi bi-trash3 me-1"></i>
          {{ $t('clear_alarm_records') }}
        </el-button>
        <el-button
          v-if="clear_alarm_btn_visible"
          type="primary"
          plain
          @click="EditAlarmTable"
        >
          <i class="bi bi-pencil-square me-1"></i>
          {{ $t('AlarmHistory.edit_alarm_table') }}
        </el-button>
      </div>
    </header>

    <!-- 進階篩選（展開於工具列下方，單列精簡高度） -->
    <transition name="filter-slide">
      <div v-show="filterExpanded" class="filter-panel">
        <div class="filter-inline">
          <label class="filter-inline-label">{{ $t('AlarmHistory.time_range') }}</label>
          <el-radio-group
            v-model="TimeRangeOpt"
            class="time-radios"
            size="small"
            @change="() => { AlarmDownload() }"
          >
            <el-radio-button label="no-limit">{{ $t('AlarmHistory.range_opt_recent') }}</el-radio-button>
            <el-radio-button label="limit">{{ $t('AlarmHistory.range_opt_custom') }}</el-radio-button>
          </el-radio-group>
          <el-date-picker
            class="range-picker"
            size="small"
            v-model="TimeRange_Picker"
            type="datetimerange"
            :shortcuts="dateShortcuts"
            :range-separator="$t('AlarmHistory.range_separator')"
            :start-placeholder="$t('AlarmHistory.start_placeholder')"
            :end-placeholder="$t('AlarmHistory.end_placeholder')"
            value-format="YYYY/MM/DD HH:mm:ss"
            :disabled="TimeRangeOpt != 'limit'"
            @change="() => { AlarmDownload() }"
          />
          <div class="filter-code-group">
            <label class="filter-inline-label code-label">{{ $t('AlarmHistory.alarm_code') }}</label>
            <el-select
              class="alarm-code-select"
              size="small"
              v-model="AlarmClassSelected"
              filterable
              clearable
              allow-create
              default-first-option
              :filter-method="filterAlarmCodeOptions"
              :placeholder="$t('AlarmHistory.code_search_placeholder')"
              :no-data-text="$t('AlarmHistory.code_no_match')"
              @visible-change="onAlarmCodeDropdownVisible"
              @clear="onAlarmCodeCleared"
              @change="HandleAlarmCodeChanged"
            >
              <el-option
                v-for="al in filteredAlarmOptions"
                :key="al.Code"
                :label="formatAlarmOptionLabel(al)"
                :value="al.Code"
              />
            </el-select>
          </div>
        </div>
      </div>
    </transition>

    <!-- Table：flex 填滿剩餘空間，分頁固定在底部 -->
    <div class="table-panel" v-loading="loading">
      <div ref="tableBodyRef" class="table-body">
        <el-table
          :data="alarms"
          row-key="Time"
          :row-class-name="tb_row_class"
          border
          stripe
          :height="tableHeight"
          size="default"
          :empty-text="$t('AlarmHistory.empty')"
          class="alarm-table"
        >
          <el-table-column
            :label="$t('AlarmHistory.col_time')"
            prop="Time"
            width="176"
            class-name="time-col"
            :formatter="TimeFormmter"
          >
            <template #default="{ row }">
              <span class="time-cell">{{ TimeFormmter(row, null, row.Time) }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('AlarmHistory.col_code')" prop="Code" width="100" align="center">
            <template #default="{ row }">
              <span class="code-pill">{{ row.Code }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('AlarmHistory.col_description')" min-width="220">
            <template #default="{ row }">
              <span class="desc-cell">{{ lang === 'zh-TW' ? (row.CN || row.Description) : row.Description }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('AlarmHistory.col_level')" prop="Level" width="120" align="center">
            <template #default="{ row }">
              <span class="level-badge" :class="levelTone(row.Level)">
                {{ row.Level || '—' }}
              </span>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="table-footer">
        <div class="footer-meta">
          <span v-if="alarms.length" class="page-info">
            {{ $t('AlarmHistory.page_info', { page, shown: alarms.length, total: totalAlarmNum }) }}
          </span>
          <span v-else class="page-info muted">{{ $t('AlarmHistory.no_data') }}</span>
        </div>
        <el-pagination
          background
          layout="prev, pager, next"
          :total="totalAlarmNum"
          :page-size="page_size"
          :current-page="page"
          @current-change="PageChangeHandler"
        />
      </div>
    </div>

  </div>
</template>

<script>
import { AlarmTableAPI } from '@/api/VMSAPI';
import moment from 'moment';
import bus from '@/event-bus.js'
import Notifier from '@/api/NotifyHelper';
import { UserStore, AGVStatusStore, UIStore } from '@/store'
import { MAIN_TAB } from '@/constants/tabPages'
import { getAppBottomReservedPx } from '@/utils/layoutInsets'

export default {
  data() {
    return {
      alarms: [],
      totalAlarmNum: 0,
      page: 1,
      page_size: 15,
      lang: 'zh-TW',
      loading: false,
      DisplaySelected: 'All',
      filterExpanded: false,
      tableHeight: 528,
      _tableResizeObserver: null,
      _onWindowResize: null,
      _autoRefreshTimer: null,
      _lastLiveAlarmFingerprint: '',
      _onAlarmTabClick: null,
      _onLangChanged: null,
      TimeRangeOpt: 'no-limit',
      TimeRange: ['1997/1/1 00:00:00', '2100/12/31 00:00:00'],
      TimeRange_Picker: ['1997/1/1 00:00:00', '2100/12/31 00:00:00'],
      alarmClasifies: [],
      filteredAlarmOptions: [],
      AlarmClassSelected: 0,
      alarmCodeListLoading: false,
      levelOptions: [
        { value: 'All', labelKey: 'AlarmHistory.level_all', tone: 'all' },
        { value: 'Alarm', labelKey: 'AlarmHistory.level_alarm', tone: 'alarm' },
        { value: 'Warning', labelKey: 'AlarmHistory.level_warning', tone: 'warning' },
      ],
    }
  },
  methods: {
    selectLevel(value) {
      if (this.DisplaySelected === value) return
      this.DisplaySelected = value
      this.HandleAlarmTypeChanged()
    },
    levelTone(level) {
      if (level === 'Alarm') return 'alarm'
      if (level === 'Warning') return 'warning'
      return 'other'
    },
    EditAlarmTable() {
      this.$router.push({ name: 'alarmTableEdit' })
    },
    tb_row_class({ row, rowIndex }) {
      if (rowIndex < 0 || !row) return ''
      if (row.Level === 'Warning') return 'warning-row'
      if (row.Level === 'Alarm') return 'alarm-row'
      return 'normal-row'
    },
    TimeFormmter(row, column, cellValue) {
      return moment(cellValue).format('YYYY/MM/DD HH:mm:ss')
    },
    async PageChangeHandler(page) {
      this.page = page
      await this.AlarmDownload()
    },
    async AlarmDownload({ silent = false } = {}) {
      const threeMonthRange = () => {
        const end = new Date()
        end.setDate(end.getDate() + 1)
        end.setHours(0, 0, 0, 0)
        const start = new Date(end)
        start.setMonth(start.getMonth() - 3)
        const startISO = new Date(start.getTime() - start.getTimezoneOffset() * 60000).toISOString()
        const endISO = new Date(end.getTime() - end.getTimezoneOffset() * 60000).toISOString()
        return [startISO, endISO]
      }
      const timeRange = this.TimeRangeOpt == 'no-limit' ? threeMonthRange() : this.TimeRange_Picker
      if (!silent) this.loading = true
      try {
        this.totalAlarmNum = await AlarmTableAPI.TotalAlarmCount(
          timeRange[0],
          timeRange[1],
          this.DisplaySelected,
          this.AlarmClassSelected
        )
        this.alarms = await AlarmTableAPI.QueryByPage(
          timeRange[0],
          timeRange[1],
          this.page,
          this.page_size,
          this.DisplaySelected,
          this.AlarmClassSelected
        )
      } finally {
        if (!silent) this.loading = false
      }
    },
    /** 檢視中收到即時異常時，防抖後刷新歷史（回第 1 頁看最新） */
    scheduleHistoryAutoRefresh() {
      if (this._autoRefreshTimer) clearTimeout(this._autoRefreshTimer)
      this._autoRefreshTimer = setTimeout(async () => {
        this._autoRefreshTimer = null
        if (!this.isAlarmTabActive) return
        this.page = 1
        await this.AlarmDownload({ silent: true })
      }, 700)
    },
    ClearAlarmAlert() {
      this.$swal.fire({
        title: this.$t('AlarmHistory.clear_dialog_title'),
        text: `${this.$t('clear-alarm-data-confirm-text')}`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'OK',
        customClass: 'my-sweetalert',
      }).then((result) => {
        if (result.isConfirmed) {
          this.ClearAlarmRecords()
        }
      })
    },
    async ClearAlarmRecords() {
      await AlarmTableAPI.ClearAlarms()
      Notifier.Success('Alarm Clear', 'bottom', 1000)
      await this.AlarmDownload()
    },
    async HandleAlarmTypeChanged() {
      this.page = 1
      await this.AlarmDownload()
    },
    async loadAlarmCodeList() {
      this.alarmCodeListLoading = true
      try {
        // 優先完整 Alarm Table；失敗則改取歷史出現過的分類清單
        let list = []
        try {
          list = await AlarmTableAPI.GetAlarmTable()
        } catch (error) {
          console.warn('GetAlarmTable 失敗，改用 GetAlarmClassifies', error)
          list = await AlarmTableAPI.GetAlarmClassifies()
        }
        this.alarmClasifies = (list || [])
          .filter((al) => Number(al?.Code) > 0)
          .sort((a, b) => Number(a.Code) - Number(b.Code))
        this.resetAlarmCodeFilter()
      } catch (error) {
        console.warn('載入異常碼列表失敗', error)
        this.alarmClasifies = []
        this.resetAlarmCodeFilter()
      } finally {
        this.alarmCodeListLoading = false
      }
    },
    allAlarmCodeOption() {
      const label = this.$t('AlarmHistory.code_all')
      return { Code: 0, Description: label, CN: label }
    },
    resetAlarmCodeFilter() {
      this.filteredAlarmOptions = [this.allAlarmCodeOption(), ...this.alarmClasifies]
    },
    formatAlarmOptionLabel(al) {
      if (!al || Number(al.Code) === 0) return this.$t('AlarmHistory.code_all')
      const text = this.lang === 'zh-TW'
        ? (al.CN || al.Description || '')
        : (al.Description || al.CN || '')
      return text ? `${al.Code} · ${text}` : String(al.Code)
    },
    filterAlarmCodeOptions(query) {
      const q = String(query || '').trim().toLowerCase()
      if (!q) {
        this.resetAlarmCodeFilter()
        return
      }
      this.filteredAlarmOptions = this.alarmClasifies.filter((al) => {
        const code = String(al.Code ?? '')
        const desc = String(al.Description ?? '').toLowerCase()
        const cn = String(al.CN ?? '').toLowerCase()
        return code.includes(q) || desc.includes(q) || cn.includes(q)
      })
    },
    onAlarmCodeDropdownVisible(visible) {
      if (visible) this.resetAlarmCodeFilter()
    },
    onAlarmCodeCleared() {
      this.AlarmClassSelected = 0
      this.resetAlarmCodeFilter()
      this.HandleAlarmTypeChanged()
    },
    HandleAlarmCodeChanged(value) {
      // allow-create 可能帶入字串；空白／清除視為「全部」
      if (value === '' || value === null || value === undefined) {
        this.AlarmClassSelected = 0
      } else if (typeof value === 'string') {
        const parsed = Number.parseInt(value, 10)
        this.AlarmClassSelected = Number.isFinite(parsed) ? parsed : 0
      } else {
        this.AlarmClassSelected = Number(value) || 0
      }
      this.HandleAlarmTypeChanged()
    },
    updateTableHeight() {
      const body = this.$refs.tableBodyRef
      if (!body) return
      const pager = this.$el?.querySelector?.('.table-footer')
      const pagerH = Math.max(pager?.offsetHeight || 0, 52)
      const bodyTop = body.getBoundingClientRect().top
      const appBottom = getAppBottomReservedPx()
      // 視窗可用高度：扣掉分頁列 + 主頁 fixed footer（避免被遮擋）
      const byWindow = Math.floor(window.innerHeight - bodyTop - pagerH - appBottom)
      // flex 分配高度（父層已 padding-bottom 避開 footer）
      const byFlex = Math.floor(body.clientHeight)
      const candidates = [byWindow]
      if (byFlex > 80) candidates.push(byFlex)
      const height = Math.max(160, Math.min(...candidates))
      if (Math.abs(height - this.tableHeight) > 1) {
        this.tableHeight = height
      }
    },
    setupTableResizeObserver() {
      this.$nextTick(() => {
        this.updateTableHeight()
        const panel = this.$el?.querySelector?.('.table-panel')
        if (panel && typeof ResizeObserver !== 'undefined') {
          this._tableResizeObserver = new ResizeObserver(() => {
            this.updateTableHeight()
          })
          this._tableResizeObserver.observe(panel)
        }
        this._onWindowResize = () => this.updateTableHeight()
        window.addEventListener('resize', this._onWindowResize)
      })
    },
    teardownTableResizeObserver() {
      this._tableResizeObserver?.disconnect()
      this._tableResizeObserver = null
      if (this._onWindowResize) {
        window.removeEventListener('resize', this._onWindowResize)
        this._onWindowResize = null
      }
    },
  },
  computed: {
    clear_alarm_btn_visible() {
      return UserStore.getters.CurrentUserRole != 0
    },
    isAlarmTabActive() {
      return UIStore.getters.mainTabId === MAIN_TAB.ALARM
    },
    /** 即時 AlarmCodes 指紋；內容不變時狀態輪詢不會誤觸刷新 */
    liveAlarmFingerprint() {
      const alarms = AGVStatusStore.state.AGVStatus?.AlarmCodes || []
      return alarms
        .filter((a) => a && Number(a.Code) !== 0)
        .map((a) => `${a.Code}|${a.Time || ''}|${a.Level || a.ELevel || ''}`)
        .sort()
        .join(';')
    },
    dateShortcuts() {
      return [
        {
          text: this.$t('AlarmHistory.shortcut_last_week'),
          value: () => {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
            return [start, end]
          },
        },
        {
          text: this.$t('AlarmHistory.shortcut_last_month'),
          value: () => {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
            return [start, end]
          },
        },
        {
          text: this.$t('AlarmHistory.shortcut_last_3_months'),
          value: () => {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
            return [start, end]
          },
        },
      ]
    },
  },
  watch: {
    filterExpanded(opened) {
      if (opened && !this.alarmClasifies.length && !this.alarmCodeListLoading) {
        this.loadAlarmCodeList()
      }
      this.$nextTick(() => {
        requestAnimationFrame(() => this.updateTableHeight())
      })
    },
    liveAlarmFingerprint(fingerprint) {
      if (!this.isAlarmTabActive) return
      if (fingerprint === this._lastLiveAlarmFingerprint) return
      this._lastLiveAlarmFingerprint = fingerprint
      this.scheduleHistoryAutoRefresh()
    },
    isAlarmTabActive(active) {
      if (!active) return
      this._lastLiveAlarmFingerprint = this.liveAlarmFingerprint
    },
  },
  async mounted() {
    this._lastLiveAlarmFingerprint = this.liveAlarmFingerprint
    this.resetAlarmCodeFilter()
    this.loadAlarmCodeList()
    this.AlarmDownload()
    this.setupTableResizeObserver()
    this._onAlarmTabClick = async () => {
      this._lastLiveAlarmFingerprint = this.liveAlarmFingerprint
      await this.AlarmDownload()
      this.$nextTick(() => {
        requestAnimationFrame(() => this.updateTableHeight())
      })
    }
    this._onLangChanged = (locale) => {
      this.lang = locale
      this.resetAlarmCodeFilter()
    }
    bus.on('/alarmtable_tab_click', this._onAlarmTabClick)
    bus.on('/lang_changed', this._onLangChanged)
  },
  beforeUnmount() {
    if (this._autoRefreshTimer) {
      clearTimeout(this._autoRefreshTimer)
      this._autoRefreshTimer = null
    }
    if (this._onAlarmTabClick) bus.off('/alarmtable_tab_click', this._onAlarmTabClick)
    if (this._onLangChanged) bus.off('/lang_changed', this._onLangChanged)
    this.teardownTableResizeObserver()
  },
}
</script>

<style lang="scss" scoped>
.alarm-history {
  --ah-bg: #f4f6f8;
  --ah-panel: #ffffff;
  --ah-border: #e2e8f0;
  --ah-text: #1e293b;
  --ah-muted: #64748b;
  --ah-alarm: #dc2626;
  --ah-alarm-soft: #fef2f2;
  --ah-warn: #d97706;
  --ah-warn-soft: #fffbeb;
  --ah-accent: #0f766e;
  --ah-radius: 10px;

  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  color: var(--ah-text);
  font-family: 'Segoe UI', 'Noto Sans TC', system-ui, sans-serif;
}

.alarm-toolbar {
  flex-shrink: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px 16px;
  padding: 10px 14px;
  background: var(--ah-panel);
  border: 1px solid var(--ah-border);
  border-radius: var(--ah-radius);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.toolbar-left {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px 20px;
  min-width: 0;
}

.title-block {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-icon {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 8px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  font-size: 1.05rem;
  flex-shrink: 0;
}

.title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: #334155;
  letter-spacing: 0.06em;
  line-height: 1.25;
}

.subtitle {
  margin: 2px 0 0;
  font-size: 0.78rem;
  color: var(--ah-muted);

  strong {
    color: var(--ah-text);
    font-variant-numeric: tabular-nums;
  }
}

.range-hint {
  color: #94a3b8;
}

.level-filter {
  display: inline-flex;
  padding: 3px;
  gap: 2px;
  background: #f1f5f9;
  border-radius: 999px;
  border: 1px solid var(--ah-border);
}

.level-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 0;
  background: transparent;
  color: var(--ah-muted);
  font-size: 0.8rem;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;

  .chip-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #94a3b8;
  }

  &.alarm .chip-dot {
    background: var(--ah-alarm);
  }

  &.warning .chip-dot {
    background: var(--ah-warn);
  }

  &:hover {
    color: var(--ah-text);
  }

  &.active {
    background: #fff;
    color: var(--ah-text);
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.12);
  }

  &.active.alarm {
    color: var(--ah-alarm);
  }

  &.active.warning {
    color: var(--ah-warn);
  }
}

.toolbar-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.table-panel {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--ah-panel);
  border: 1px solid var(--ah-border);
  border-radius: var(--ah-radius);
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.table-body {
  /* height:0 讓 flex 正確吃掉剩餘高度，分頁列才能固定可見 */
  flex: 1 1 auto;
  height: 0;
  min-height: 0;
  overflow: hidden;
}

.alarm-table {
  --el-table-header-bg-color: #f8fafc;
  --el-table-header-text-color: #475569;
  --el-table-border-color: #e2e8f0;
  --el-table-row-hover-bg-color: #f1f5f9;

  :deep(th.el-table__cell) {
    font-weight: 700;
    font-size: 0.8rem;
    letter-spacing: 0.04em;
    text-transform: none;
  }

  :deep(td.el-table__cell) {
    font-size: 0.875rem;
  }

  :deep(td.time-col .cell) {
    white-space: nowrap;
  }

  :deep(.el-table__empty-text) {
    color: var(--ah-muted);
  }
}

.time-cell {
  display: inline-block;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  font-family: ui-monospace, 'Cascadia Mono', 'Consolas', monospace;
  font-size: 0.8rem;
  color: #334155;
}

.code-pill {
  display: inline-block;
  min-width: 52px;
  padding: 2px 8px;
  border-radius: 6px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  font-family: ui-monospace, 'Cascadia Mono', 'Consolas', monospace;
  font-weight: 700;
  font-size: 0.8rem;
  font-variant-numeric: tabular-nums;
  color: #0f172a;
}

.desc-cell {
  color: #1e293b;
  line-height: 1.45;
}

.level-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 76px;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;

  &.alarm {
    color: #991b1b;
    background: var(--ah-alarm-soft);
    border: 1px solid #fecaca;
  }

  &.warning {
    color: #92400e;
    background: var(--ah-warn-soft);
    border: 1px solid #fde68a;
  }

  &.other {
    color: #334155;
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
  }
}

.table-footer {
  flex: 0 0 auto;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 14px;
  border-top: 1px solid var(--ah-border);
  background: #fafbfc;
  z-index: 1;
}

.page-info {
  font-size: 0.8rem;
  color: var(--ah-text);
  font-variant-numeric: tabular-nums;

  &.muted {
    color: var(--ah-muted);
  }
}

.filter-panel {
  flex-shrink: 0;
  padding: 6px 12px;
  background: #f8fafc;
  border: 1px solid var(--ah-border);
  border-radius: var(--ah-radius);
}

.filter-inline {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
}

.filter-inline-label {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 700;
  color: #64748b;
  letter-spacing: 0.04em;
  white-space: nowrap;
  /* 與異常碼列共用標籤欄寬，換行後可上下對齊 */
  flex: 0 0 4.5rem;
  width: 4.5rem;
}

.filter-code-group {
  display: inline-flex;
  align-items: center;
  gap: 8px 12px;

  .filter-inline-label {
    flex: 0 0 4.5rem;
    width: 4.5rem;
  }
}

.time-radios {
  flex-shrink: 0;
}

.range-picker {
  width: 340px;
  max-width: 100%;
}

.alarm-code-select {
  width: 280px;
  max-width: 100%;
}

.me-1 {
  margin-right: 0.25rem;
}

.ms-1 {
  margin-left: 0.25rem;
}

.filter-slide-enter-active,
.filter-slide-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.filter-slide-enter-from,
.filter-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (max-width: 900px) {
  .alarm-toolbar {
    align-items: stretch;
  }

  .toolbar-actions {
    width: 100%;
  }

  .filter-code-group {
    flex: 0 0 100%;
    width: 100%;
    box-sizing: border-box;
    /* 與上方「時間區間」同一左緣、標籤欄寬對齊 */
    gap: 8px 12px;
  }

  .range-picker {
    width: 100%;
  }

  .alarm-code-select {
    flex: 1 1 auto;
    width: auto;
    min-width: 0;
  }
}
</style>

<style lang="scss">
/* row-class-name 需非 scoped；底色整列 + 左側加寬色條 */
.alarm-history .alarm-table .el-table__body tr.warning-row > td.el-table__cell {
  background-color: #fffbeb !important;
}

.alarm-history .alarm-table .el-table__body tr.warning-row > td.el-table__cell:first-child {
  box-shadow: inset 8px 0 0 #d97706;
}

.alarm-history .alarm-table .el-table__body tr.alarm-row > td.el-table__cell {
  background-color: #fecaca !important;
}

.alarm-history .alarm-table .el-table__body tr.alarm-row > td.el-table__cell:first-child {
  box-shadow: inset 8px 0 0 #dc2626;
}

.alarm-history .alarm-table .el-table__body tr.normal-row > td.el-table__cell:first-child {
  box-shadow: inset 8px 0 0 transparent;
}

</style>
