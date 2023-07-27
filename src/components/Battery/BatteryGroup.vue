<template>
  <div class="battrey-group d-flex flex-row" @click="()=>{ show_battery_viewer=IsMiniAGV}">
    <div
      class="bat d-flex flex-row"
      v-bind:class="IsMiniAGV?'w-50':'w-100'"
      v-for="i in IsMiniAGV?[1,2]:[0]"
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
      <div class="d-flex px-2" v-if="GetBatteryStatus(i).IsCharging">
        <label for>充電電流:</label>
        {{GetBatteryStatus(i).ChargeCurrent}}
        <span
          class="px-1"
          style="font-size:smaller;"
        >mA</span>
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
  },
  computed: {
    IsMiniAGV() {
      return AGVStatusStore.getters.IsInspectionAGV
    },
    battery_states() {
      return AGVStatusStore.getters.BatteryStatus
    }
  },
  data() {
    return {
      show_battery_viewer: false
    }
  },
  methods: {
    GetBatteryStatus(index) {
      try {
        var stat = this.battery_states.find(bat => bat.BatteryID == index)
        if (stat)
          return stat
        else
          return new BatteryStatus(100)
      } catch (error) {
        return new BatteryStatus(100)
      }
    },
    GetLabel(bat_status = new BatteryStatus) {
      if (!bat_status.IsCharging)
        return bat_status.BatteryLevel + "%";
      else {
        return bat_status.BatteryLevel + "%(充電中)";
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
        return 'charging'
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
  .charging {
    background-color: limegreen;
  }
}
</style>