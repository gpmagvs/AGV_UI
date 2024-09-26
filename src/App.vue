<template>
  <!--<div class="appcontainer" v-bind:style="AppBorderStyle" style="width:100vw">-->
  <div
    class="appcontainer"
    style="width:100vw;height:100vh"
    v-loading.fullscreen.lock="loading"
    element-loading-text="GPM AGV"
    element-loading-background="rgba(0,0,0, 0.8)"
  >
    <div
      class="fixed-bottom text-right"
      v-if="CurrentAlarms != undefined && CurrentAlarms.length > 0"
      id="vcs-alarms"
    >
      <div v-for="(alarmObj, code) in AlarmCodesGroup" :key="code">
        <el-alert
          @click="HandleAlarmSheetClick(code)"
          show-icon
          :type="alarmObj.Alarm.ELevel == 0 ? 'warning' : 'error'"
          :title="`Alarm Code=${code} [${Timeformat(alarmObj.Alarm.Time)}]`"
          :description="`${alarmObj.Alarm.CN == '' ? alarmObj.Alarm.Description : alarmObj.Alarm.CN}(${alarmObj.Alarm.Description})`"
        ></el-alert>
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
    <AGVInitalizingNotify></AGVInitalizingNotify>
  </div>
</template>
<script>
import bus from '@/event-bus.js'
import SideMenuDrawer from '@/views/SideMenuDrawer.vue'
import { SystemMsgStore, AGVStatusStore, UserStore } from '@/store'
import { ElNotification } from 'element-plus'
import moment from 'moment'
import SystemSettingsView from '@/views/SystemSettingsView.vue'
import EQHandshakingNotify from '@/components/EQHandshakingNotify.vue'
import WaitAGVsNextMoveActionNotify from "@/components/WaitAGVsNextMoveActionNotify.vue"
import AGVInitalizingNotify from "@/components/AGVInitalizingNotify.vue"
import { Start } from './AGVDataFetchWorker.js'
import Vue3DeviceDetector from 'vue3-device-detector';
import { CargoStatusManualCheckDone } from '@/api/VMSAPI.js'

export default {
  components: {
    SideMenuDrawer, SystemSettingsView, EQHandshakingNotify, WaitAGVsNextMoveActionNotify, AGVInitalizingNotify
  },
  data() {
    return {
      showMenuToggleIcon: false,
      loading: true,
      isMobile: false
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
    IsVisitorUsing() {
      return UserStore.getters.IsVisitor;
    }
  },
  watch: {
    VehicleName(newValue, oldValue) {
      document.title = 'GPM-' + newValue;
    }
  },
  created() {
    const deviceDetector = Vue3DeviceDetector();
    this.isMobile = deviceDetector.isMobile
    console.info(this.isMobile)
    console.info(deviceDetector.device.model)
  },
  mounted() {
    Start();
    document.title = "GPM AGV";
    bus.on('/god_mode_changed', (is_god_mode_now) => {
      this.showMenuToggleIcon = is_god_mode_now
    });
    bus.on('idle', (arg) => {
      this.$router.push('/idle')
      // alert('idle 5 ^_^')
    })
    bus.on('ManualCheckCargoStatus', model => {
      // this.$swal.fire(
      //   {
      //     title: 'ManualCheckCargoStatus',
      //     text: JSON.stringify(model),
      //     icon: 'warning',
      //     showCancelButton: false,
      //     confirmButtonText: '完成確認',
      //     customClass: 'my-sweetalert'
      //   }).then(res => {
      //     CargoStatusManualCheckDone();
      //   })
      let timerInterval;
      this.$swal.fire({
        title: "貨物狀態確認(Cargo Status Confirm)",
        icon: 'warning',
        html: `<br/>倒數計時結束後將自動完成確認<br/>Confirmation will be automatically completed after the countdown ends.<br/> <b></b> `,
        // html: `<p>${JSON.stringify(model)}</p>` + `<br/>倒數計時結束後將自動完成確認<br/>Confirmation will be automatically completed after the countdown ends.<br/> <b></b> `,
        timer: model.Timeout * 1000,
        timerProgressBar: true,
        showCancelButton: true, // 顯示取消按鈕
        cancelButtonText: '完成確認', // 取消按鈕文本
        cancelButtonClass: 'bg-primary text-light',
        allowOutsideClick: false, // 禁止點擊遮罩關閉對話框
        didOpen: () => {
          this.$swal.showLoading();
          const timer = this.$swal.getPopup().querySelector("b");
          timerInterval = setInterval(() => {
            timer.textContent = `${(this.$swal.getTimerLeft() / 1000).toFixed(1)}`;
          }, 1000);
        },
        willClose: () => {
          clearInterval(timerInterval);
        }
      }).then((result) => {
        if (result.isConfirmed) {
          console.log("確認按鈕被點擊");
          // 在這裡可以執行確認後的操作
        } else if (result.dismiss === this.$swal.DismissReason.cancel) {
          CargoStatusManualCheckDone();
          clearInterval(timerInterval); // 中斷倒計時
        }
      });

    });

    bus.on('AGV-Notify-Message-Recieved', obj => {
      const title = obj.title;
      const message = obj.message;
      const alarmCode = obj.alarmCode;
      if (alarmCode == 10052) {
        this.$swal.fire(
          {
            title: title,
            text: `[${alarmCode}]${message}`,
            icon: 'error',
            showCancelButton: !this.IsVisitorUsing,
            confirmButtonText: 'OK',
            cancelButtonText: '前往設置',
            customClass: 'my-sweetalert'
          }).then(res => {
            if (!res.isConfirmed) {
              //show teach tools
              bus.emit('on-fork-height-click')
              bus.emit('open-fork-teach-table');
            }
          })
        return;
      }
      //alert(message)
      this.$swal.fire(
        {
          title: title,
          text: `[${alarmCode}]${message}`,
          icon: 'warning',
          showCancelButton: false,
          confirmButtonText: 'OK',
          customClass: 'my-sweetalert'
        })
    })
    setTimeout(() => {
      this.loading = false;
    }, 2000);
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
  z-index: 2027;
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
