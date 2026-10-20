<template>
  <div class="idle-view">
    {{ AGVName }}
    <div class>{{ AGVStatus.MainState }}</div>
    <div class>{{ AGVStatus.SubState }}</div>
    <div class>{{ AGVStatus.OnlineMode }}</div>
    <div class>{{ AGVStatus.AutoMode }}</div>
    <div class>{{ formattedMileage }}</div>
    <div class>{{ AGVStatus.Laser_Mode }}</div>
  </div>
</template>

<script>
import { AGVStatusStore } from '@/store';
export default {
  data() {
    return {

    }
  },
  computed: {
    AGVName: () => { return AGVStatusStore.getters.AGVName },
    AGVStatus: () => { return AGVStatusStore.getters.AGVStatus },
    formattedMileage() {
      const mileage = Number(this.AGVStatus?.Mileage)
      return Number.isFinite(mileage) ? mileage.toFixed(2) : '0.00'
    }
  }
}
</script>

<style>
.idle-view {
  background-color: rbg(51, 51, 51);
  height: 100px;
}
</style>