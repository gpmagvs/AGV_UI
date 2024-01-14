<template>
  <!--<div class="appcontainer" v-bind:style="AppBorderStyle" style="width:100vw">-->
  <div class="appcontainer" style="width:100vw;height:100vh" v-loading.fullscreen.lock="loading" element-loading-text="GPM AGV"
    element-loading-background="rgba(0,0,0, 0.8)">
    <div
      class="fixed-bottom text-right"
      v-if="CurrentAlarms != undefined && CurrentAlarms.length > 0"
      id="vcs-alarms">
      <div v-for="(alarmObj, code) in AlarmCodesGroup" :key="code">
        <el-alert
          @click="HandleAlarmSheetClick(code)"
          show-icon
          :type="alarmObj.Alarm.ELevel == 0 ? 'warning' : 'error'"
          :title="`Alarm Code=${code} [${Timeformat(alarmObj.Alarm.Time)}]`"
          :description="`${alarmObj.Alarm.CN == '' ? alarmObj.Alarm.Description : alarmObj.Alarm.CN}(${alarmObj.Alarm.Description})`"></el-alert>
      </div>
    </div>
    <i @click="ToggleMenu" v-show="false" class="bi text-primary bi-list menu-toggle-icon"></i>
    <SideMenuDrawer ref="side_menu"></SideMenuDrawer>
    <router-view v-slot="{ Component }">
      <keep-alive>
        <component :is="Component" />
      </keep-alive>
    </router-view>
    <SystemSettingsView></SystemSettingsView>
    <EQHandshakingNotify></EQHandshakingNotify>
    <WaitAGVsNextMoveActionNotify></WaitAGVsNextMoveActionNotify>
  </div>
</template>

<script>
import bus from '@/event-bus.js'
import SideMenuDrawer from '@/views/SideMenuDrawer.vue'
import { SystemMsgStore, AGVStatusStore } from '@/store'
import { ElNotification } from 'element-plus'
import moment from 'moment'
import SystemSettingsView from '@/views/SystemSettingsView.vue'
import EQHandshakingNotify from '@/components/EQHandshakingNotify.vue'
import WaitAGVsNextMoveActionNotify from "@/components/WaitAGVsNextMoveActionNotify.vue"
export default {
  components: {
    SideMenuDrawer, SystemSettingsView, EQHandshakingNotify, WaitAGVsNextMoveActionNotify
  },
  data() {
    return {
      showMenuToggleIcon: false,
      loading: true
    }
  },
  methods: {
    ToggleMenu() {
      this.$refs.side_menu.Show();
    },
    Timeformat(time, format = 'yyyy-MM-DD HH:mm:ss') {
      return moment(time).format(format)
    },
    async HandleAlarmSheetClick(code) {
      await AGVStatusStore.dispatch('clear_alarm_with_code', code)
    }
  },
  computed: {
    CurrentSystemMsg() {
      return SystemMsgStore.getters.SysMessages
    },
    CurrentAlarms() {

      return AGVStatusStore.getters.AlarmCodes
    },
    AlarmCodesGroup() {
      return AGVStatusStore.getters.AlarmGroup;
    },
    VehicleName() {
      return AGVStatusStore.getters.AGVName;
    },
    AppBorderStyle() {

      if (this.AlarmCodesGroup) {

        var alarms = Object.values(this.AlarmCodesGroup)
        var any_alarm = alarms.filter(al => al.Alarm.ELevel != 0).length != 0
        return {
          border: alarms.length == 0 ? '' : any_alarm ? '5px solid red' : '5px solid gold'
        }
      }
    },

  },
  watch: {
    VehicleName(newValue, oldValue) {
      document.title = 'GPM-' + newValue;
    }
  },
  mounted() {
    document.title = "GPM AGV";
    bus.on('/god_mode_changed', (is_god_mode_now) => {
      this.showMenuToggleIcon = is_god_mode_now
    });
    bus.on('idle', (arg) => {
      this.$router.push('/idle')
      // alert('idle 5 ^_^')
    })
    setTimeout(() => {
      this.loading = false;
    }, 1000);
  },
};
</script>

<style lang="scss">
.menu-toggle-icon {
  position: absolute;
  left: 0;
  font-size: 26px;
  cursor: pointer;
}

#app {
  //font-family: Avenir, Helvetica, Arial, sans-serif;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
    Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  height: 100%;
  overflow: hidden;
}

nav {
  padding: 30px;

  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}

body,
html {
  height: 100%;
  // -webkit-user-select: none;
  // /* Chrome, Safari, Opera */
  // -moz-user-select: none;
  // /* Firefox */
  // -ms-user-select: none;
  /* IE 10+ */
  //user-select: none;
}

#vcs-alarms {
  position: absolute;
  left: 42%;
  z-index: 9999;
  bottom: 3px;
  width: 57%;

  span {
    // color: rgb(0, 123, 255);
    color: rgb(182, 179, 179);
  }

  p {
    text-align: left;
    font-weight: bold;
    font-size: 20px;
    padding: 0 auto;
  }

  .el-alert {
    margin: 3px auto;
    text-align: left;
    --el-alert-icon-large-size: 37px;

    .el-alert__close-btn {
      font-size: 30px;
    }
  }
}
</style>
