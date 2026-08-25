<template>
  <!--<div class="appcontainer" v-bind:style="AppBorderStyle" style="width:100vw">-->
  <div class="appcontainer" style="width:100vw;height:100vh" v-loading.fullscreen.lock="loading"
    element-loading-text="GPM AGV" element-loading-background="rgba(0,0,0, 0.8)">
    <div v-if="connectionAlertVisible" class="connection-alert-bar">
      <div class="connection-alert-card" role="alert">
        <div class="connection-alert-icon" aria-hidden="true">
          <el-icon :size="22"><WarningFilled /></el-icon>
        </div>
        <div class="connection-alert-body">
          <div class="connection-alert-heading">通訊連線異常</div>
          <ul class="connection-alert-list">
            <li v-for="(line, idx) in connectionAlertLines" :key="idx">{{ line }}</li>
          </ul>
        </div>
        <div class="connection-alert-actions">
          <el-button type="danger" size="small" @click="reloadPage">Reload</el-button>
          <button
            type="button"
            class="connection-alert-close"
            aria-label="Close"
            @click="connectionAlertVisible = false">
            <el-icon :size="16"><Close /></el-icon>
          </button>
        </div>
      </div>
    </div>
    <div class="fixed-bottom text-right" style="bottom:40px !important;"
      v-if="!isTsmcHmi && CurrentAlarms != undefined && CurrentAlarms.length > 0" id="vcs-alarms">
      <div v-for="(alarmObj, code) in AlarmCodesGroup" :key="code">
        <el-alert @click="HandleAlarmSheetClick(code)" show-icon
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
    <AGVInitalizingNotify></AGVInitalizingNotify>
    <SystemErrorNotify></SystemErrorNotify>
    <BackendExceptionMessageDisplay></BackendExceptionMessageDisplay>
  </div>
</template>
<script>
import bus from '@/event-bus.js'
import SideMenuDrawer from '@/views/SideMenuDrawer.vue'
import { SystemMsgStore, AGVStatusStore, UserStore, SystemSettingsStore, UIStore } from '@/store'
import { ElMessage, ElNotification } from 'element-plus'
import moment from 'moment'
import SystemSettingsView from '@/views/SystemSettingsView.vue'
import EQHandshakingNotify from '@/components/EQHandshakingNotify.vue'
import WaitAGVsNextMoveActionNotify from "@/components/WaitAGVsNextMoveActionNotify.vue"
import AGVInitalizingNotify from "@/components/AGVInitalizingNotify.vue"
import SystemErrorNotify from "@/components/SystemErrorNotify.vue"
import { Start } from './AGVDataFetchWorker.js'
import Vue3DeviceDetector from 'vue3-device-detector';
import { CargoStatusManualCheckDone, CargoStatusManualCheckDoneWhenUnloadFailure, GetMaintainModeStatus } from '@/api/VMSAPI.js'
import { ForkAPI } from '@/api/VMSAPI.js'
import BackendExceptionMessageDisplay from '@/components/BackendExceptionMessageDisplay.vue'
import { Close, WarningFilled } from '@element-plus/icons-vue'

export default {
  components: {
    SystemErrorNotify,
    SideMenuDrawer,
    SystemSettingsView,
    EQHandshakingNotify,
    WaitAGVsNextMoveActionNotify,
    AGVInitalizingNotify,
    BackendExceptionMessageDisplay,
    Close,
    WarningFilled
  },
  data() {
    return {
      showMenuToggleIcon: false,
      loading: true,
      isMobile: false,
      connectionAlertVisible: false,
      connectionAlertLines: []
    }
  },
  methods: {
    ToggleMenu() {
      this.$refs.side_menu.Show();
    },
    reloadPage() {
      window.location.reload();
    },
    Timeformat(time, format = 'yyyy-MM-DD HH:mm:ss') {
      return moment(time).format(format)
    },
    async HandleAlarmSheetClick(code) {
      await AGVStatusStore.dispatch('clear_alarm_with_code', code)
    },
    async loadSystemSettings(retryCount = 0) {
      try {
        this.loading = true;
        await SystemSettingsStore.dispatch('downloadSettings');
        setTimeout(() => {
          this.loading = false;
        }, 1000);
      } catch (error) {
        console.warn('系統參數加載失敗:', error);
        if (retryCount < 3) {
          setTimeout(() => {
            this.loadSystemSettings(retryCount + 1);
          }, 1000);
        } else {
          this.$swal.fire({
            title: '警告',
            text: '系統參數加載失敗，將使用預設設定',
            icon: 'warning',
            confirmButtonText: '確定'
          });
          setTimeout(() => {
            this.loading = false;
          }, 1000);
        }
      }
    },
    checkConnectionStatus() {
      let rosConnState = UIStore.state.ConnectionStateData.RosbridgeServer;
      const isROSConnecting = rosConnState == 2 || rosConnState == 1;

      let ioConnState = UIStore.state.ConnectionStateData.WAGO;
      const isDIOConnecting = ioConnState == 2 || ioConnState == 1;

      let agvsConnState = UIStore.state.ConnectionStateData.VMS;
      const isAGVSConnecting = agvsConnState == 2 || agvsConnState == 1;

      if ((isROSConnecting || isDIOConnecting || isAGVSConnecting)) {
        const rosBridgeServerIP = SystemSettingsStore.state.Settings.Connections.RosBridge.IP;
        const rosBridgeServerPort = SystemSettingsStore.state.Settings.Connections.RosBridge.Port;
        const wagoIP = SystemSettingsStore.state.Settings.Connections.Wago.IP;
        const wagoPort = SystemSettingsStore.state.Settings.Connections.Wago.Port;
        const agvsIP = SystemSettingsStore.state.Settings.Connections.AGVS.IP;
        const agvsPort = SystemSettingsStore.state.Settings.Connections.AGVS.Port;

        const lines = [];
        if (isROSConnecting) {
          lines.push(`[ROS服務器] 連接失敗..請確認連線 (${rosBridgeServerIP}:${rosBridgeServerPort})`);
        }
        if (isDIOConnecting) {
          lines.push(`[IO模組] 連接失敗..請確認連線 (${wagoIP}:${wagoPort})`);
        }
        if (isAGVSConnecting) {
          lines.push(`[派車系統] 連接失敗..請確認連線 (${agvsIP}:${agvsPort})`);
        }
        this.connectionAlertLines = lines;
        this.connectionAlertVisible = true;
      } else {
        this.connectionAlertVisible = false;
        this.connectionAlertLines = [];
      }
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
    isTsmcHmi() {
      return this.$route?.name === 'tsmc-hmi' || this.$route?.path === '/tsmc'
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
  },
  created() {
    const deviceDetector = Vue3DeviceDetector();
    this.isMobile = deviceDetector.isMobile

    console.log(`~佛祖保佑， BUG 退散~
                           _
                        _ooOoo_
                       o8888888o
                       88" . "88
                       (| -_- |)
                       O\\  =  /O
                    ____/\`---'\\____
                  .'  \\\\|     |//  \`.
                 /  \\\\|||  :  |||//  \\
                /  _||||| -:- |||||_  \\
                |   | \\\\\\  -  /'| |   |
                | \\_|  \`\\\`---'//  |_/ |
                \\  .-\\__ \`-. -'__/-.  /
              ___\`. .'  /--.--\\  \`. .'___
           ."" '<  \`.___\\_<|>_/___.' _> \\\""".
          | | :  \`- \\\`. ;\`. _/; .'/ /  .' ; |
          \\  \\ \`-.   \\_\\_\\\`. _.'_/_/  -' _.' /
===========\`-.\\___\`-.__\\ \\___  /__.-'_.'_.-'================
                        \`=--=-'                    
`);

    console.log(`
_      \`-._     \`-.     \`.   \\      :      /   .'     .-'     _.-'      _
 \`--._     \`-._    \`-.    \`.  \`.    :    .'  .'    .-'    _.-'     _.--'
      \`--._    \`-._   \`-.   \`.  \\   :   /  .'   .-'   _.-'    _.--'
\`--.__     \`--._   \`-._  \`-.  \`. \`. : .' .'  .-'  _.-'   _.--'     __.--'
__    \`--.__    \`--._  \`-._ \`-. \`. \\:/ .' .-' _.-'  _.--'    __.--'    __
  \`--..__   \`--.__   \`--._ \`-._\`-.\`_=_\`.-'_.-' _.--'   __.--'   __..--'
--..__   \`--..__  \`--.__  \`--._\`-q(-_-)p-'_.--'  __.--'  __..--'   __..--
      \`\`--..__  \`--..__ \`--.__ \`-'_) (_\`-' __.--' __..--'  __..--''
...___        \`\`--..__ \`--..__\`--/__/  \\--'__..--' __..--''        ___...
      \`\`\`---...___    \`\`--..__\`_ (<_   _/)_'__..--''    ___...---'''
\`\`\`-----....._____ \`\`\`---...___(__\\_\\_|_/__)___...---'''_____.....-----'''
 ___   __  ________   _______   _       _   _______    ___   __   _______
|| \\\\  ||     ||     ||_____))  \\\\     //  ||_____||  || \\\\  ||  ||_____||
||  \\\\_||  ___||___  ||     \\\\   \\\\___//   ||     ||  ||  \\\\_||  ||     ||
`);



  },
  async mounted() {
    AGVStatusStore.dispatch('restoreAgvBasicInfo');
    this.loadSystemSettings();

    try {
      GetMaintainModeStatus().then(data => {
        AGVStatusStore.commit('setMaintainModeStatus', data)
      })
    } catch (error) {
      console.warn('取得維護狀態數據失敗:', error);
    }

    try {
      await UIStore.dispatch('GetConnectionState');
    } catch (error) {
      console.warn('連接狀態檢查失敗:', error);
    }

    Start();
    document.title = "GPM AGV";

    setTimeout(() => {
      document.title = (process.env.NODE_ENV === 'development' ? '[Dev] ' : '') + 'GPM-' + this.VehicleName;
    }, 2000)

    setTimeout(() => {
      this.checkConnectionStatus();
    }, 6000);

    bus.on('/god_mode_changed', (is_god_mode_now) => {
      this.showMenuToggleIcon = is_god_mode_now
    });
    bus.on('idle', (arg) => {
      this.$router.push('/idle')
      // alert('idle 5 ^_^')
    })
    //bus.emit('CheckCargoStatusWhenUnloadFail', tag);
    bus.on('CheckCargoStatusWhenUnloadFail', tag => {
      let timerInterval;
      this.$swal.fire({
        title: "貨物在席檢知異常! 請確認貨物放置狀態!",
        icon: 'warning',
        html: `<br/>倒數計時結束後仍未確認此取貨任務將會失敗<br/>Task will failure after the countdown ends without any confirm or check.<br/>若無法復原貨物狀態請按下按壓實體或軟體EMO按鈕，或是踢BUMPER。 <b></b> `,
        timer: 5 * 60 * 1000,
        timerProgressBar: true,
        showCancelButton: true, // 顯示取消按鈕
        cancelButtonText: '完成確認', // 取消按鈕文本
        cancelButtonClass: 'bg-primary text-light',
        allowOutsideClick: true, // 禁止點擊遮罩關閉對話框
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
        } else if (result.dismiss === this.$swal.DismissReason.cancel) {
          CargoStatusManualCheckDoneWhenUnloadFailure();
          clearInterval(timerInterval); // 中斷倒計時
        }
      });


    });

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
        } else if (result.dismiss === this.$swal.DismissReason.cancel) {
          CargoStatusManualCheckDone();
          clearInterval(timerInterval); // 中斷倒計時
        }
      });

    });
    bus.on('DebugMessage', message => {
      ElMessage.info({
        message: message,
        showClose: true,
        duration: 1000,
      })
    })
    bus.on('AGV-Notify-Message-Recieved', obj => {
      const title = obj.title;
      const message = obj.message;
      const alarmCode = obj.alarmCode;
      if (alarmCode == 10052) {
        const swal = this.$swal.fire(
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

        UIStore.commit('SetSwalShowing', { code: alarmCode, instance: swal });

        return;
      }

      if (alarmCode == 3383) {
        let timerInterval;
        const swal = this.$swal.fire({
          title: title,
          icon: 'warning',
          html: `${message} <b></b> `,
          timer: 10000,
          timerProgressBar: true,
          didOpen: () => {
            this.$swal.showLoading();
            const timer = this.$swal.getPopup().querySelector("b");
            timerInterval = setInterval(() => {
              timer.textContent = `${(this.$swal.getTimerLeft() / 1000).toFixed(1)}`;
            }, 1000);
          },
          willClose: () => {
            clearInterval(timerInterval);
            location.reload();
          }
        }).then((result) => {
        });
        UIStore.commit('SetSwalShowing', { code: alarmCode, instance: swal });

        return;
      }

      if (message.includes("Fork Vertical Driver Unkonwn, Initialize Action Confirm")) {
        const swal = this.$swal.fire(
          {
            title: '垂直牙叉驅動器狀態異常',
            text: `垂直牙叉驅動器狀態異常,是否要略過初始化流程?`,
            icon: 'warning',
            showCancelButton: true,
            customClass: 'my-sweetalert'
          }).then(res => {
            ForkAPI.ForkVerticalInitActionResume(res.isConfirmed)
          })
        UIStore.commit('SetSwalShowing', { code: alarmCode, instance: swal });
        return;
      }

      //alert(message)
      const swal = this.$swal.fire(
        {
          title: title,
          text: `[${alarmCode}]${message}`,
          icon: 'warning',
          showCancelButton: false,
          confirmButtonText: 'OK',
          customClass: 'my-sweetalert',
          allowOutsideClick: false // 禁止點擊遮罩關閉對話框
        })
      UIStore.commit('SetSwalShowing', { code: alarmCode, instance: swal });

      //系統重啟中
      if (alarmCode == 3384) {
        setTimeout(() => {
          location.reload();
        }, 8000);
      }
    })

    bus.on('close-notify-dialog', code => {
      console.log('close-notify-dialog', code);
      let swalStore = UIStore.state.SwalShowing;
      const closable = swalStore.code == code;
      if (closable && swalStore.instance != undefined) {
        this.$swal.close()
        UIStore.commit('SetSwalShowing', {
          code: undefined,
          instance: undefined
        })
      }
    })

    bus.on('CargoStatusChanged', obj => {
    })
  },
};
</script>
<style lang="scss">
.connection-alert-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1300001;
  padding: 10px 14px;
  pointer-events: none;
}

.connection-alert-card {
  pointer-events: auto;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  max-width: 960px;
  margin: 0 auto;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid #ef9a9a;
  background: linear-gradient(180deg, #ffebee 0%, #ffcdd2 100%);
  box-shadow: 0 6px 20px rgba(183, 28, 28, 0.22);
  color: #b71c1c;
  text-align: left;
}

.connection-alert-icon {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #c62828;
  color: #fff;
}

.connection-alert-body {
  flex: 1 1 auto;
  min-width: 0;
  padding-top: 2px;
}

.connection-alert-heading {
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 800;
  line-height: 1.3;
  color: #b71c1c;
}

.connection-alert-list {
  margin: 0;
  padding-left: 1.15rem;
  font-size: 13px;
  line-height: 1.55;
  color: #c62828;

  li + li {
    margin-top: 2px;
  }
}

.connection-alert-actions {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 2px;
}

.connection-alert-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid #ef9a9a;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.7);
  color: #c62828;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.1s ease;

  &:hover {
    background: #fff;
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.96);
  }
}

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
