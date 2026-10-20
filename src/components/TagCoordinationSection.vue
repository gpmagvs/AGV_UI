<template>
  <div class="tag-coordination">
    <div class="side-metrics__row">
      <template v-if="showOffsetDetail">
        <SideMetricSection title="Tag">
          <div class="side-metric-value" :class="{ 'is-warning': !hasValidTag }">
            <div>{{ tagText }}</div>
          </div>
        </SideMetricSection>
        <SideMetricSection title="X">
          <div class="side-metric-value">
            <div>{{ offsetXText }}</div>
          </div>
        </SideMetricSection>
        <SideMetricSection title="Y">
          <div class="side-metric-value">
            <div>{{ offsetYText }}</div>
          </div>
        </SideMetricSection>
      </template>
      <template v-else>
        <SideMetricSection :title="primaryTitle">
          <div class="side-metric-value" :class="{ 'is-warning': !isInspectionAgv && !hasValidTag }">
            <div>{{ primaryValueText }}</div>
          </div>
        </SideMetricSection>
        <SideMetricSection :title="$t('coordination')">
          <div class="side-metric-value is-coord" :class="{ 'is-warning': !isLocalized }">
            <div>{{ coordinationText }}</div>
          </div>
        </SideMetricSection>
      </template>
    </div>
    <el-button
      v-if="isInspectionAgv"
      class="loc-btn"
      effect="dark"
      size="small"
      @click="$emit('localize')"
    >
      定位
    </el-button>
  </div>
</template>

<script>
import SideMetricSection from '@/components/SideMetricSection.vue'

/**
 * 側欄 Tag／座標顯示：與牙叉高度、里程數相同的計量排版，不使用 input。
 */
export default {
  name: 'TagCoordinationSection',
  components: {
    SideMetricSection,
  },
  props: {
    vmsData: { type: Object, required: true },
    ioConnected: { type: Boolean, default: false },
    isBrakeSwitchRelease: { type: Boolean, default: false },
    isInspectionAgv: { type: Boolean, default: false },
  },
  emits: ['localize'],
  computed: {
    showOffsetDetail() {
      return this.ioConnected && this.isBrakeSwitchRelease && !this.isInspectionAgv
    },
    tagId() {
      return this.vmsData?.BCR_State_MoveBase?.tagID
    },
    hasValidTag() {
      return Number(this.tagId) > 0
    },
    tagText() {
      if (this.tagId === null || this.tagId === undefined || this.tagId === '') return '—'
      return String(this.tagId)
    },
    offsetXText() {
      return this.formatNumber(this.vmsData?.BCR_State_MoveBase?.xValue)
    },
    offsetYText() {
      return this.formatNumber(this.vmsData?.BCR_State_MoveBase?.yValue)
    },
    primaryTitle() {
      return this.isInspectionAgv ? 'Location' : 'Tag'
    },
    primaryValueText() {
      if (this.isInspectionAgv) {
        const tag = this.vmsData?.Last_Visited_Tag
        return tag === null || tag === undefined || tag === '' ? '—' : String(tag)
      }
      return this.tagText
    },
    coordinationText() {
      const x = this.vmsData?.Pose?.position?.x
      const y = this.vmsData?.Pose?.position?.y
      if (!Number.isFinite(Number(x)) || !Number.isFinite(Number(y))) return '—'
      return `(${Number(x).toFixed(2)}, ${Number(y).toFixed(2)})`
    },
    isLocalized() {
      return this.vmsData?.LocStatus == 10
    },
  },
  methods: {
    formatNumber(value) {
      const num = Number(value)
      return Number.isFinite(num) ? num.toFixed(2) : '—'
    },
  },
}
</script>

<style scoped lang="scss">
.tag-coordination {
  width: 100%;
}

.side-metrics__row {
  display: flex;
  width: 100%;
  gap: 6px;
}

.loc-btn {
  margin-top: 4px;
}

/* 座標字串較長，略縮小；Firefox 字寬較大，再縮一級避免換行 */
.side-metric-value.is-coord {
  font-size: 16px;
}

@supports (-moz-appearance: none) {
  .side-metric-value.is-coord {
    font-size: 13px;
  }
}
</style>
