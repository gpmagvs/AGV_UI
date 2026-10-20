<template>
  <div
    class="side-metric-value"
    :class="{ 'is-warning': IsForkHeightAboveSafty }"
    @click="NavigateToForkPage"
  >
    <div>
      {{ height }}
      <span>cm</span>
    </div>
  </div>
</template>

<script>
import { AGVStatusStore, UIStore } from '@/store'
import { MAIN_TAB, OPERATOR_TAB } from '@/constants/tabPages'

export default {
  name: 'ForkHeight',
  computed: {
    height() {
      const position = AGVStatusStore.getters.AGVStatus?.ZAxisDriverState?.position
      const value = Number(position)
      return Number.isFinite(value) ? value.toFixed(2) : '0.00'
    },
    IsForkHeightAboveSafty() {
      return !!AGVStatusStore.getters.AGVStatus?.IsForkHeightAboveSafty
    },
  },
  methods: {
    NavigateToForkPage() {
      UIStore.dispatch('navigateTabPage', {
        main: MAIN_TAB.OPERATION,
        operator: OPERATOR_TAB.FORK,
      })
    },
  },
}
</script>
