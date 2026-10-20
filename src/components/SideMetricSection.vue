<template>
  <div class="side-metric-section">
    <div
      class="side-metric-section__label"
      :class="{ 'is-clickable': clickable }"
      @click="HandleLabelClick"
    >
      <i v-if="iconClass" :class="iconClass"></i>
      <span>{{ title }}</span>
    </div>
    <slot />
  </div>
</template>

<script>
/**
 * 側欄計量區塊：標題列（icon + 標題）＋數值 slot。
 * 牙叉高度、里程數等共用此結構，避免各自複製排版樣式。
 */
export default {
  name: 'SideMetricSection',
  props: {
    title: { type: String, required: true },
    iconClass: { type: String, default: '' },
    clickable: { type: Boolean, default: false },
  },
  emits: ['label-click'],
  methods: {
    HandleLabelClick() {
      if (!this.clickable) return
      this.$emit('label-click')
    },
  },
}
</script>

<style scoped lang="scss">
.side-metric-section {
  flex: 1 1 0;
  min-width: 0;
  padding: 0;
  background: transparent;
  border: 0;
}

.side-metric-section__label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--side-muted, #64748b);
  line-height: 1.2;

  > i {
    font-size: 0.95em;
    opacity: 0.85;
  }

  > span {
    font-size: inherit;
  }

  &.is-clickable {
    cursor: pointer;
  }
}
</style>
