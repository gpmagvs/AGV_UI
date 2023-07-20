<template>
  <div class="battrey-group d-flex flex-row" @click="()=>{ show_battery_viewer=IsMiniAGV}">
    <div
      class="bat d-flex flex-row"
      v-bind:class="IsOnlyOneBattery?'w-100':'w-50'"
      v-for="i in bat_count==1?[0]: [0,bat_count-1]"
      :key="i"
    >
      <i
        v-if="GetBatteryStatus(i).IsCharging"
        style="color:limegreen"
        class="bi bi-battery-charging"
      ></i>
      <i v-else :class="'bi bi-battery-full'"></i>
      <b-progress class="flex-fill h-100" :max="100" animated>
        <b-progress-bar
          animated
          :value="GetBatteryStatus(i).BatteryLevel"
          :label="GetLabel(GetBatteryStatus(i))"
          v-bind:class="GetClass(GetBatteryStatus(i))"
          style="font-size:16px;"
        ></b-progress-bar>
      </b-progress>
      <div class="d-flex" v-if="GetBatteryStatus(i).IsCharging">
        <label for>充電電流:</label>
        {{123}}
        <span style="font-size:smaller;">mA</span>
      </div>
    </div>
    <el-drawer v-model="show_battery_viewer" direction="btt" size="600px" :show-close="false">
      <template #header="{ close}">
        <el-button
          class="border-bottom"
          style="z-index:9999"
          type="danger"
          size="large"
          @click="close"
        >
          <el-icon class="el-icon--left">
            <CircleCloseFilled />
          </el-icon>Close
        </el-button>
      </template>
      <MiniAGVBatteryViewer style="position:absolute;top:-50px;z-index: 1;"></MiniAGVBatteryViewer>
    </el-drawer>
  </div>
</template>

<script>
import BatteryStatus from '@/ViewModels/BatteryStatus';
import MiniAGVBatteryViewer from './MiniAGVBatteryViewer.vue'
import { AGVStatusStore } from '@/store'
export default {
  components: {
    MiniAGVBatteryViewer
  },
  props: {
    direction: {
      type: String,
      default: "horizon"
    },
    bat_count: {
      type: Number,
      default: 2
    },
    battery_states: {
      type: Array,
      default() {
        return [
          new BatteryStatus(),
          new BatteryStatus()
        ]
      }
    }
  },
  computed: {
    IsOnlyOneBattery() {
      return this.bat_count == 1;
    },
    IsMiniAGV() {
      return AGVStatusStore.getters.IsInspectionAGV
    }
  },
  data() {
    return {
      show_battery_viewer: false
    }
  },
  methods: {
    GetBatteryStatus(index) {
      var stat = this.battery_states[index]
      if (stat)
        return stat
      else
        return new BatteryStatus(100)

    },
    GetLabel(bat_status = new BatteryStatus) {
      if (!bat_status.IsCharging)
        return bat_status.BatteryLevel + "%";
      else {
        return bat_status.BatteryLevel + "(充電中)%";
      }
    },
    GetClass(bat_status = new BatteryStatus) {
      var batLevel = bat_status.BatteryLevel;
      if (!bat_status.IsCharging) {
        if (batLevel < 20)
          return 'bg-danger'
        else if (batLevel >= 20 && batLevel < 40)
          return 'bg-warning'
        else
          return 'bg-primary'
      }
      else {
        return 'bg-success'
      }
    },
    OnClick(i) {
      alert('wtf' + i)
    }
  },
}
</script>

<style lang="scss" scoped>
.battrey-group {
  height: 22px;
  margin-top: 2px;
  i {
    font-size: 20px;
    transform: rotate(-0.25turn);
    margin-right: 3px;
    position: relative;
    left: -2px;
  }
}
</style>