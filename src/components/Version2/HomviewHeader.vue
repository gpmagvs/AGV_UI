<template>
  <div class="home-view-header text-light">
    <div class="agv-name bg-primary">
      <span>{{ AGVName }}</span>
    </div>
    <BatteryGroupVue></BatteryGroupVue>
  </div>
</template>

<script>
import { AGVStatusStore } from '@/store'
import BatteryGroupVue from '@/components/Battery/BatteryGroup.vue'
export default {
  components: {
    BatteryGroupVue,
  },
  computed: {
    AGVName() {
      return AGVStatusStore.getters.AGVName;
    }
  },
}
</script>

<style lang="scss" scoped>
.home-view-header {
  .agv-name {
    font-weight: bold;
    font-size: 20px;
  }
}
</style>