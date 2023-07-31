<template>
  <div>
    <!-- {{ SensorStatus }} -->
    <AngleDisplay status="safe" :sensor_data="SensorStatus"></AngleDisplay>
  </div>
</template>

<script>
import { AGVStatusStore } from '@/store';
import AngleDisplay from '@/components/AngleDisplay.vue'
export default {
  components: {
    AngleDisplay,
  },
  computed: {
    SensorStatus() {
      return AGVStatusStore.getters.AGV_Sensors_States
    }
  },
}
</script>

<style lang="scss" scoped>
</style>