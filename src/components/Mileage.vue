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
  line-height: 1.2;

  > div {
    display: inline-flex;
    align-items: baseline;
    line-height: 1.2;
    min-height: 24px;
  }

  span {
    font-size: 0.65em;
    line-height: 1;
    opacity: 0.75;
  }
}
</style>
