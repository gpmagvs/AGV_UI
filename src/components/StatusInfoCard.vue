<template>
  <div class="status-board" :class="stateTone">
    <!-- 主狀態：進入畫面第一眼錨點 -->
    <header class="board-hero" :class="stateTone">
      <div class="hero-left">
        <div class="hero-title">{{ $t('status') }}</div>
        <div class="hero-state">{{ stateLabel }}</div>
      </div>
    </header>

    <!-- 異常摘要 -->
    <div v-if="alertItems.length" class="alert-bar" role="status">
      <i class="bi bi-exclamation-triangle-fill" aria-hidden="true"></i>
      <div class="alert-list">
        <span v-for="item in alertItems" :key="item.key" class="alert-chip">{{ item.text }}</span>
      </div>
    </div>

    <div class="board-body">
      <!-- 導航路徑 -->
      <section class="block path-block">
        <div class="path-row">
          <div class="path-end">
            <span class="path-label">{{ $t('current_position') }}</span>
            <span class="path-value">{{ currentPointText }}</span>
          </div>
          <div class="path-mid" aria-hidden="true">
            <span class="path-line"></span>
            <i class="bi bi-caret-right-fill"></i>
            <span class="path-line"></span>
          </div>
          <div class="path-end">
            <span class="path-label">{{ $t('target_position') }}</span>
            <span class="path-value">{{ targetPointText }}</span>
          </div>
        </div>
      </section>

      <!-- 感測＋定位合併為一列，大螢幕較飽滿 -->
      <section class="block metrics-block">
        <div class="kv-grid" :class="metricsGridClass">
          <div class="kv-item" :class="tagTone">
            <span class="kv-label">{{ $t('tag_read_status') }}</span>
            <span class="kv-value">{{ tagReadText }}</span>
            <span class="kv-hint">{{ tagHint }}</span>
          </div>
          <div v-if="!IsInspectionAGV" class="kv-item" :class="carrierTone">
            <span class="kv-label">{{ $t('carrier_id') }}</span>
            <span class="kv-value">{{ carrierText }}</span>
            <span class="kv-hint">{{ carrierHint }}</span>
          </div>
          <div class="kv-item" :class="locTone">
            <span class="kv-label">{{ $t('localization-state') }}</span>
            <span class="kv-value">{{ LocStatusDisplay }}</span>
            <span class="kv-hint">{{ locHint }}</span>
          </div>
          <div class="kv-item" :class="matchTone">
            <span class="kv-label">{{ $t('map-matching-rate') }}</span>
            <span class="kv-value">{{ matchRateText }}</span>
            <span class="kv-hint">{{ matchHint }}</span>
          </div>
          <div v-if="isForkAgv" class="kv-item" :class="forkTone">
            <span class="kv-label">{{ $t('StatusInfo.fork_height') }}</span>
            <span class="kv-value">{{ forkHeightText }}</span>
            <span class="kv-hint">{{ forkSafetyText }}</span>
          </div>
          <div
            class="kv-item tone-neutral"
            :class="{ clickable: IsGodUser }"
            :role="IsGodUser ? 'button' : undefined"
            :tabindex="IsGodUser ? 0 : undefined"
            :title="IsGodUser ? $t('StatusInfo.laser_goto_manual') : $t('sys_laser_hint')"
            @click="HandleLsrModeTagClick"
            @keydown.enter="HandleLsrModeTagClick"
          >
            <span class="kv-label">{{ $t('sys_laser_label') }}</span>
            <span class="kv-value">{{ laserModeText }}</span>
          </div>
        </div>
      </section>

      <!-- God -->
      <section v-if="IsGodUser" class="block god-block">
        <el-button type="primary" plain size="large" @click="show_module_info_drawer = true">
          <i class="bi bi-cpu me-1"></i>
          {{ $t('StatusInfo.show_module_info') }}
        </el-button>
      </section>
    </div>

    <el-drawer :title="$t('StatusInfo.module_info_title')" size="50%" v-model="show_module_info_drawer"
      class="module-info-drawer">
      <el-scrollbar always class="module-info-scrollbar">
        <pre class="module-info-pre w-100 border rounded bg-light text-start">{{ module_information }}</pre>
      </el-scrollbar>
    </el-drawer>
  </div>
</template>

<script>
import { ROS_STORE } from '@/store/ros_store'
import { UserStore, UIStore } from '@/store'
import { MAIN_TAB, OPERATOR_TAB } from '@/constants/tabPages'

export default {
  props: {
    VMSData: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      show_module_info_drawer: false,
    }
  },
  computed: {
    vms_data() {
      return this.VMSData
    },
    IsGodUser() {
      return UserStore.getters.IsGodUser
    },
    IsInspectionAGV() {
      return this.vms_data.Agv_Type == 2
    },
    isForkAgv() {
      return this.vms_data.Agv_Type == 0
    },
    stateRaw() {
      const sub = (this.vms_data.SubState || '').toString().trim()
      return sub || 'ERROR'
    },
    stateLabel() {
      return this.stateRaw
    },
    stateTone() {
      const s = this.stateRaw.toUpperCase()
      if (['DOWN', 'ALARM', 'STOP', 'SYSTEM_INIT', 'ERROR'].includes(s)) return 'tone-danger'
      if (['INITIALIZE', 'INITIALIZING', 'CHARGING'].includes(s)) return 'tone-info'
      if (['RUN', 'WORKING'].includes(s)) return 'tone-ok'
      if (['IDLE', 'WARNING'].includes(s)) return 'tone-warn'
      return 'tone-neutral'
    },
    laserModeText() {
      const mode = this.vms_data.Current_LASER_MODE
      return mode === null || mode === undefined || mode === '' ? '—' : String(mode)
    },
    currentPointText() {
      return this.vms_data.Last_Visit_MapPoint?.Graph?.Display || '—'
    },
    targetPointText() {
      return this.vms_data.NavInfo?.DestinationMapPoint?.Graph?.Display || '—'
    },
    tagId() {
      if (this.IsInspectionAGV) return null
      return this.vms_data.BCR_State_MoveBase?.tagID
    },
    tagReadText() {
      if (this.IsInspectionAGV) return '—'
      const id = this.tagId
      return id === null || id === undefined || id === '' ? '—' : String(id)
    },
    tagTone() {
      if (this.IsInspectionAGV) return 'tone-neutral'
      return Number(this.tagId) > 0 ? 'tone-ok' : 'tone-danger'
    },
    tagHint() {
      if (this.IsInspectionAGV) return this.$t('StatusInfo.na')
      return Number(this.tagId) > 0
        ? this.$t('StatusInfo.tag_ok')
        : this.$t('StatusInfo.tag_missing')
    },
    carrierText() {
      const cst = this.vms_data.CST_Data
      return cst ? String(cst) : '—'
    },
    carrierTone() {
      // 無載物多屬正常待機，勿用紅底嚇使用者；有 ID 用中性偏正面
      return this.vms_data.CST_Data ? 'tone-ok' : 'tone-neutral'
    },
    carrierHint() {
      return this.vms_data.CST_Data
        ? this.$t('StatusInfo.carrier_present')
        : this.$t('StatusInfo.carrier_empty')
    },
    LocStatusDisplay() {
      const locStatus = this.vms_data.LocStatus
      if (locStatus == 10) return this.$t('StatusInfo.loc_ok')
      if (locStatus == 20) return this.$t('StatusInfo.loc_warning')
      if (locStatus == 30) return this.$t('StatusInfo.loc_not_localized')
      if (locStatus == 40) return this.$t('StatusInfo.loc_system_error')
      return this.$t('StatusInfo.loc_unknown')
    },
    locTone() {
      const locStatus = this.vms_data.LocStatus
      if (locStatus == 10) return 'tone-ok'
      if (locStatus == 20) return 'tone-warn'
      if (locStatus == 30 || locStatus == 40) return 'tone-danger'
      return 'tone-neutral'
    },
    locHint() {
      const locStatus = this.vms_data.LocStatus
      if (locStatus == 10) return this.$t('StatusInfo.loc_hint_ok')
      if (locStatus == 20) return this.$t('StatusInfo.loc_hint_warning')
      return this.$t('StatusInfo.loc_hint_bad')
    },
    matchRateText() {
      const rate = this.vms_data.MapComparsionRate
      if (rate === null || rate === undefined || rate === '') return '—'
      return String(rate)
    },
    matchTone() {
      return this.vms_data.MapComparsionRate != 0 ? 'tone-ok' : 'tone-danger'
    },
    matchHint() {
      return this.vms_data.MapComparsionRate != 0
        ? this.$t('StatusInfo.match_ok')
        : this.$t('StatusInfo.match_bad')
    },
    forkHeightText() {
      const pos = this.vms_data.ZAxisDriverState?.position
      if (pos === null || pos === undefined || Number.isNaN(Number(pos))) return '—'
      return `${Number(pos).toFixed(2)} cm`
    },
    forkSafetyText() {
      return this.vms_data.IsForkHeightAboveSafty
        ? this.$t('StatusInfo.fork_above_safe')
        : this.$t('StatusInfo.fork_safe')
    },
    forkTone() {
      return this.vms_data.IsForkHeightAboveSafty ? 'tone-danger' : 'tone-ok'
    },
    metricsGridClass() {
      // Tag +（載具）+ 定位 + 匹配 + 雷射 +（牙叉）
      let count = 4
      if (!this.IsInspectionAGV) count += 1
      if (this.isForkAgv) count += 1
      return `cols-${count}`
    },
    /** 危險項置頂摘要（不含主狀態，已由 hero 大字顯示） */
    alertItems() {
      const items = []
      if (!this.IsInspectionAGV && this.tagTone === 'tone-danger') {
        items.push({ key: 'tag', text: this.$t('StatusInfo.tag_missing') })
      }
      if (this.locTone === 'tone-danger') {
        items.push({ key: 'loc', text: this.$t('StatusInfo.loc_hint_bad') })
      }
      if (this.matchTone === 'tone-danger') {
        items.push({ key: 'match', text: this.$t('StatusInfo.match_bad') })
      }
      if (this.isForkAgv && this.forkTone === 'tone-danger') {
        items.push({ key: 'fork', text: this.$t('StatusInfo.fork_above_safe') })
      }
      return items
    },
    module_information() {
      return ROS_STORE.getters.Module_Information
    },
  },
  methods: {
    HandleLsrModeTagClick() {
      if (!this.IsGodUser) return
      UIStore.dispatch('navigateTabPage', {
        main: MAIN_TAB.OPERATION,
        operator: OPERATOR_TAB.MANUAL,
      })
    },
  },
}
</script>

<style lang="scss" scoped>
.status-board {
  --sb-text: #0f172a;
  --sb-muted: #475569;
  --sb-line: #dbe3ee;
  --sb-bg: #f7f9fc;
  --sb-surface: #ffffff;
  --sb-ok: #166534;
  --sb-warn: #a16207;
  --sb-danger: #b91c1c;
  --sb-info: #0369a1;
  --sb-bar: #64748b;

  margin: 4px;
  background: var(--sb-surface);
  border: 1px solid var(--sb-line);
  border-radius: 4px;
  overflow: hidden;
  color: var(--sb-text);
  font-family: 'Segoe UI', 'Noto Sans TC', system-ui, sans-serif;

  &.tone-ok {
    --sb-bar: #16a34a;
  }

  &.tone-warn {
    --sb-bar: #ca8a04;
  }

  &.tone-danger {
    --sb-bar: #dc2626;
  }

  &.tone-info {
    --sb-bar: #0284c7;
  }

  &.tone-neutral {
    --sb-bar: #64748b;
  }
}

.board-hero {
  --hero-fg: #0f172a;
  --hero-muted: #475569;
  --hero-bg: #eef2f7;
  --hero-edge: #94a3b8;

  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 132px;
  margin: 12px 12px 0;
  padding: 22px 22px 20px;
  background: var(--hero-bg);
  border: 1px solid var(--sb-line);
  border-bottom: 6px solid var(--hero-edge);
  border-radius: 4px;
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.04);
  color: var(--hero-fg);

  &.tone-ok {
    --hero-fg: #14532d;
    --hero-muted: #166534;
    --hero-bg: linear-gradient(180deg, #dcfce7 0%, #bbf7d0 100%);
    --hero-edge: #22c55e;
  }

  &.tone-warn {
    --hero-fg: #854d0e;
    --hero-muted: #a16207;
    --hero-bg: linear-gradient(180deg, #fef9c3 0%, #fde68a 100%);
    --hero-edge: #eab308;
  }

  &.tone-danger {
    --hero-fg: #7f1d1d;
    --hero-muted: #b91c1c;
    --hero-bg: linear-gradient(180deg, #fee2e2 0%, #fecaca 100%);
    --hero-edge: #ef4444;
    border-top-color: #fecaca;
    border-left-color: #fecaca;
    border-right-color: #fecaca;
    border-bottom-color: var(--hero-edge);
  }

  &.tone-info {
    --hero-fg: #0c4a6e;
    --hero-muted: #0369a1;
    --hero-bg: linear-gradient(180deg, #e0f2fe 0%, #bae6fd 100%);
    --hero-edge: #0ea5e9;
  }

  &.tone-neutral {
    --hero-fg: #0f172a;
    --hero-muted: #475569;
    --hero-bg: linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%);
    --hero-edge: #94a3b8;
  }
}

.hero-left {
  min-width: 0;
  text-align: center;
}

.hero-title {
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--hero-muted);
  margin-bottom: 8px;
  opacity: 0.9;
}

.hero-state {
  font-size: clamp(2.8rem, 5.5vw, 4.2rem);
  font-weight: 900;
  line-height: 1;
  letter-spacing: 0.04em;
  font-variant-numeric: tabular-nums;
  color: var(--hero-fg);
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.35);
}

.alert-bar {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  background: #fef2f2;
  border-bottom: 1px solid #fecaca;
  color: var(--sb-danger);

  >i {
    margin-top: 2px;
    font-size: 1.15rem;
    flex-shrink: 0;
  }
}

.alert-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.alert-chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border: 1px solid #fecaca;
  background: #fff;
  border-radius: 4px;
  font-size: 0.95rem;
  font-weight: 700;
}

.board-body {
  padding: 0;
}

.block {
  padding: 14px 16px;
  border-bottom: 1px solid var(--sb-line);

  &:last-child {
    border-bottom: 0;
  }
}

.path-block {
  background: #fafbfc;
}

.metrics-block {
  padding-top: 12px;
  padding-bottom: 12px;
}

.path-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 16px 24px;
  align-items: center;
}

.path-end {
  min-width: 0;
}

.path-label {
  display: block;
  margin-bottom: 4px;
  font-size: 1rem;
  font-weight: 700;
  color: var(--sb-muted);
}

.path-value {
  display: block;
  font-size: 1.55rem;
  font-weight: 800;
  line-height: 1.2;
  word-break: break-word;
  font-variant-numeric: tabular-nums;
}

.path-mid {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #94a3b8;
  padding-top: 18px;

  i {
    font-size: 1.1rem;
  }
}

.path-line {
  display: block;
  width: 18px;
  height: 2px;
  background: #cbd5e1;
}

.kv-grid {
  display: grid;
  gap: 10px 16px;
  grid-template-columns: repeat(2, minmax(0, 1fr));

  &.cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  &.cols-4 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  &.cols-5 {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }

  &.cols-6 {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
}

.kv-item {
  position: relative;
  padding: 10px 12px 12px;
  min-width: 0;
  border-radius: 4px;
  background: #f8fafc;
  border: 1px solid var(--sb-line);
  border-bottom: 6px solid #cbd5e1;
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.04);

  &.tone-ok {
    border-bottom-color: #22c55e;
  }

  &.tone-warn {
    border-bottom-color: #eab308;
  }

  &.tone-danger {
    border-top-color: #fecaca;
    border-left-color: #fecaca;
    border-right-color: #fecaca;
    border-bottom-color: #ef4444;
    background: #fff7f7;
  }

  &.tone-neutral {
    border-bottom-color: #94a3b8;
  }
}

.kv-item.clickable {
  cursor: pointer;

  &:hover {
    background: #eef2f7;
  }
}

.kv-label {
  display: block;
  font-size: 1rem;
  font-weight: 700;
  color: var(--sb-muted);
  margin-bottom: 4px;
}

.kv-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 800;
  line-height: 1.15;
  word-break: break-word;
  font-variant-numeric: tabular-nums;
}

.kv-hint {
  display: block;
  margin-top: 2px;
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--sb-muted);
}

.kv-item.tone-ok .kv-hint {
  color: var(--sb-ok);
}

.kv-item.tone-warn .kv-hint {
  color: var(--sb-warn);
}

.kv-item.tone-danger .kv-hint {
  color: var(--sb-danger);
}

.god-block {
  padding-top: 12px;
  padding-bottom: 14px;
}

.me-1 {
  margin-right: 0.25rem;
}

@media (max-width: 1400px) {
  .kv-grid.cols-6 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 1200px) {
  .kv-grid.cols-6,
  .kv-grid.cols-5 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 1100px) {
  .kv-grid.cols-6,
  .kv-grid.cols-5,
  .kv-grid.cols-4,
  .kv-grid.cols-3 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .board-hero {
    min-height: 108px;
    padding: 18px 16px 16px;
  }

  .hero-state {
    font-size: 2.6rem;
  }

  .path-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .path-mid {
    justify-content: center;
    padding-top: 0;
    transform: rotate(90deg);
  }

  /* 窄螢幕維持兩欄，避免指標＋牙叉疊成過高單欄 */
  .kv-grid,
  .kv-grid.cols-6,
  .kv-grid.cols-5,
  .kv-grid.cols-4,
  .kv-grid.cols-3 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>

<style lang="scss">
.module-info-drawer {
  .el-drawer__body {
    height: calc(100% - 60px);
    overflow: hidden;
    padding-right: 4px;
  }

  .module-info-scrollbar {
    height: 100%;

    .el-scrollbar__bar.is-vertical {
      width: 20px !important;
      right: 2px;
    }

    .el-scrollbar__thumb {
      background-color: rgba(90, 90, 90, 0.75) !important;
      border-radius: 10px;
      opacity: 1 !important;
    }

    .el-scrollbar__bar.is-horizontal {
      height: 20px !important;
    }
  }

  .module-info-pre {
    margin: 0;
    padding: 12px;
    white-space: pre-wrap;
    word-break: break-word;
  }
}
</style>
