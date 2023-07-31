<template>
  <div class="home-view-header text-light">
    <div class="agv-name bg-primary d-flex justify-content-center">
      <div class="w-25 status border">
        <span>{{ AGVName }}</span>
      </div>
      <div class="w-25 border bg-primary">
        <span v-text="UserName"></span>
      </div>
      <div class="w-25 border bg-light text-dark">
        <span v-text="APPVersion"></span>
      </div>
      <div class="w-25 border bg-light text-dark">
        <span v-text="APPVersion"></span>
      </div>
    </div>
    <BatteryGroupVue></BatteryGroupVue>
  </div>
</template>

<script>
import { AGVStatusStore, UserStore } from '@/store'
import BatteryGroupVue from '@/components/Battery/BatteryGroup.vue'
export default {
  components: {
    BatteryGroupVue,
  },
  computed: {
    AGVName() {
      return AGVStatusStore.getters.AGVName;
    },
    APPVersion() {
      return AGVStatusStore.getters.AGVStatus.APPVersion;
    },
    UserName() {
      return UserStore.getters.CurrentUserName
    }
  },
}
</script>

<style lang="scss" >
.home-view-header {
  .agv-name {
    font-weight: bold;
    font-size: 20px;
  }
}
</style>