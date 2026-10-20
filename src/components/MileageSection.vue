<template>
  <SideMetricSection :title="titleText" icon-class="bi bi-mastodon">
    <Mileage />
  </SideMetricSection>
</template>

<script>
import SideMetricSection from '@/components/SideMetricSection.vue'
import Mileage from '@/components/Mileage.vue'

export default {
  name: 'MileageSection',
  components: {
    SideMetricSection,
    Mileage,
  },
  computed: {
    titleText() {
      return this.$t('mileage')
    },
  },
}
</script>
