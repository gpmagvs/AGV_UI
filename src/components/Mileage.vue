<template>
  <div class="side-metric-value">
    <div>
      {{ mileage }}
      <span>km</span>
    </div>
  </div>
</template>

<script>
import bus from '@/event-bus.js'

export default {
  name: 'Mileage',
  data() {
    return {
      val: 0,
    }
  },
  computed: {
    mileage() {
      const value = Number(this.val)
      return Number.isFinite(value) ? value.toFixed(2) : '0.00'
    },
  },
  mounted() {
    bus.on('/mileage', (data) => {
      this.val = data
    })
  },
}
</script>

<style lang="scss">
/* 側欄計量數值共用樣式（里程數、牙叉高度） */
.side-metric-value {
  font-size: 20px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--side-text, #0f172a);

  > div {
    display: inline-flex;
    align-items: baseline;
    line-height: 1.2;
    min-height: 24px;
  }

  span {
    font-size: 0.65em;
    font-weight: 500;
    line-height: 1;
    color: var(--side-muted, #64748b);
    opacity: 0.85;
  }

  /* 警示僅改顏色，不改變盒模型（牙叉超高、Tag／定位異常等） */
  &.is-warning > div {
    color: #b45309;
  }
}
</style>
