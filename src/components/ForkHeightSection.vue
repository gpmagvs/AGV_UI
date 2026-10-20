<template>
  <SideMetricSection
    title="牙叉高度"
    icon-class="bi bi-arrow-down-up"
    clickable
    @label-click="NavigateToForkPage"
  >
    <ForkHeight />
  </SideMetricSection>
</template>

<script>
import SideMetricSection from '@/components/SideMetricSection.vue'
import ForkHeight from '@/components/ForkHeight.vue'
import { UIStore } from '@/store'
import { MAIN_TAB, OPERATOR_TAB } from '@/constants/tabPages'

export default {
  name: 'ForkHeightSection',
  components: {
    SideMetricSection,
    ForkHeight,
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
