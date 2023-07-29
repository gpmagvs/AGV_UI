<template>
  <div>{{ SensorStatus }}</div>
</template>

<script>
import { AGVStatusStore } from '@/store';
export default {
  computed: {
    SensorStatus() {
      return AGVStatusStore.getters.AGV_Sensors_States
    }
  },
}
</script>

<style lang="scss" scoped>
</style>