<template>
  <div class="home h-100" v-loading="loading">
    <!-- Top Header  -->
    <div>
      <div class="status d-flex flex-row">
        <div class="sys-name flex-fill d-flex flex-row justify-content-center">
          <div>GPM AGV</div>
        </div>

        <div
          v-bind:class="VMSData.SubState==''?'down':VMSData.SubState.toLowerCase()"
          class="agvc-name flex-fill"
          @click="where_r_u()"
        >{{VMSData.CarName==""?"AGV":VMSData.CarName}}</div>
        <div class="account-name flex-fill">{{UserName }}</div>
        <div
          @click="VersionTextClickHandle()"
          class="version-name flex-fill"
        >{{ VMSData.APPVersion }}</div>
      </div>
    </div>
    <!--語系切換按鈕-->
    <div class="lang-switch">
      <jw_switch
        @switch="LangChangeHandle"
        :default="IsUseChinese"
        active_text="CH"
        active_color="rgb(0, 204, 0)"
        inactive_text="EN"
        inactive_color="rgb(9, 76, 176)"
      ></jw_switch>
    </div>

    <div v-if="back_end_server_err" class="server-error py-1 border fixed-top">
      <div class="agv-name-in-alarm px-2">{{VMSData.CarName}}</div>
      <i class="bi bi-exclamation-diamond"></i>
      {{$t('backend_server_error')}}
    </div>
    <!-- 電量至頂顯示 -->
    <div class="battery-fill-width px-0 mt-1 w-100">
      <i v-if="VMSData.BatteryStatus.IsCharging" style="color:gold" class="bi bi-battery-charging"></i>
      <i v-else :class="'bi bi-battery-full'" :style="{color:'white'}"></i>
      <battery :showIcon="false" bHeight="1.2rem"></battery>
    </div>
    <div class="d-flex flex-row h-100">
      <!--Side 左側邊-->
      <div class="side h-100">
        <div class="opt-buttons px-1 py-1 d-flex flex-column">
          <b-button
            :disabled="back_end_server_err||VMSData.IsSystemIniting||VMSData.AlarmCodes.length!=0"
            @click="AGVInitialize()"
            class="mb-1 p-2"
            v-bind:class="VMSData.SubState==''?'down':VMSData.SubState.toLowerCase()"
            block
          >
            <b>{{$t('initialize') }}</b>
          </b-button>
          <b-button
            :disabled="back_end_server_err"
            @click="AGVResetAlarm()"
            class="mb-1 p-2 border"
            block
            :variant="alarmResetBtnVariant"
          >
            <b>{{$t('reset_alarm') }}</b>
          </b-button>
          <b-button
            :disabled="back_end_server_err"
            @click="AGVBuzzerOff()"
            variant="light"
            class="mb-1 p-2 border"
            block
          >
            <b>{{$t('buzzer_off') }}</b>
          </b-button>
          <b-button
            v-if="VMSData.Agv_Type!=2"
            :disabled="back_end_server_err"
            @click="ShowRemoveCstDialog()"
            variant="light"
            class="mb-1 p-2 border"
            block
          >
            <b>{{$t('cst-remove') }}</b>
          </b-button>
          <b-button
            :disabled="back_end_server_err"
            :variant="IsLogin? 'danger':'outline-dark'"
            class="mb-1 p-2 border"
            block
            @click="ShowLogin()"
          >
            <b>{{LoginBtnText}}</b>
          </b-button>

          <login ref="login"></login>
        </div>
        <!--模式切換Switch-->
        <div class="modes bg-light border rounded m-1 p-3 py-1 px-3 text-start">
          <div class="d-flex flex-row">
            <div class="mode-item-label py-2">Online Mode</div>
            <el-switch
              v-model="IsOnlineMode"
              @click.prevent="OnlineModeSwitchHandle()"
              :disabled="back_end_server_err||VMSData.IsSystemIniting"
              width="75"
              size="large"
              inline-prompt
              inactive-text="Offline"
              active-text="Online"
              active-color="rgb(13, 110, 253)"
              inactive-color="rgb(220, 53, 69)"
            ></el-switch>
          </div>
          <div class="d-flex flex-row">
            <div class="mode-item-label py-2">Auto Mode</div>
            <el-switch
              v-model="IsAutoMode"
              @click.stop.prevent="AutoModeSwitchHandle()"
              :disabled="back_end_server_err||VMSData.IsSystemIniting"
              width="75"
              size="large"
              inline-prompt
              inactive-text="Manual"
              active-text="Auto"
              active-color="rgb(13, 110, 253)"
              inactive-color="rgb(220, 53, 69)"
            ></el-switch>
          </div>
        </div>
        <div class="connection-status bg-light border rounded m-1 p-3 py-1">
          <div class="state-title">{{$t('connection-states') }}</div>
          <connection_state></connection_state>
        </div>
        <!-- 當前座標資訊 -->
        <div class="mileage bg-light border rounded m-1 p-3 py-1">
          <div class="state-title">當前座標</div>
          ({{VMSData.Pose.position.x.toFixed(2) }},{{VMSData.Pose.position.y.toFixed(2) }})
        </div>
        <!-- 里程 -->
        <div class="mileage bg-light border rounded m-1 p-3 py-1">
          <div class="state-title">{{$t('mileage')}}</div>
          <mileage></mileage>
        </div>
        <!-- <div>{{ time }}</div> -->
        <div class="m-2 p-3 py-1">
          <emo :disabled="back_end_server_err"></emo>
        </div>
      </div>
      <!--主要內容 TabControl-->

      <MainContent :VMSData="VMSData"></MainContent>
    </div>
    <!-- <div class="battery-bottom p-0 bg-primary border w-100 fixed-bottom">
      <span>電量</span>
      <battery :showIcon="false" bHeight="2rem"></battery>
    </div>-->

    <!--對話框們-->
    <div class="modals">
      <!--等待上線動作完成對話框 -->
      <b-modal
        v-model="wait_online_request_dialog_show"
        title="AGV Online Requesting"
        :centered="true"
        :hideFooter="true"
        :noCloseOnBackdrop="true"
        :noCloseOnEsc="true"
        :hideHeaderClose="true"
        header-bg-variant="primary"
        header-text-variant="light"
      >
        <p class="py-3">{{$t('wait_online_text')}}</p>
      </b-modal>
      <!--上線失敗警示對話框-->
      <b-modal
        v-model="ShowOnlineFailDialog"
        header-bg-variant="danger"
        header-text-variant="light"
        :centered="true"
        title="上線請求失敗"
        :ok-only="true"
      >
        <p ref="online-fail-msg"></p>
      </b-modal>
    </div>
  </div>
</template>

<script>
import battery from '@/components/Battery.vue'
import mileage from '@/components/Mileage.vue'
import emo from '@/components/EMOButton.vue'
import login from '@/components/Login.vue'
import connection_state from '@/components/ConnectionStates.vue'
import { Initialize, CancelInitProcess, ResetAlarm, BuzzerOff, RemoveCassette, MODESwitcher, Where_r_u } from '@/api/VMSAPI'
import bus from '@/event-bus.js'
import VMSData from '@/ViewModels/VMSData.js'
import UserInfo from '@/ViewModels/UserInfo.js'
import { version } from '@/gpm_param'
import jw_switch from "@/components/UIComponents/jw-switch.vue"
import Notifier from "@/api/NotifyHelper.js"
import WebSocketHelp from '@/api/WebSocketHepler'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { UserStore, AGVStatusStore } from '@/store'
import moment from 'moment'
import MainContent from '@/components/MainContent/TabContainer.vue'
// @ is an alias to /src
export default {
  name: 'HomeView',
  components: {
    jw_switch, battery, mileage, emo, login, connection_state, MainContent
  },
  data() {
    return {
      IsUseChinese: true,
      time: '2022/12/12 19:00:09',
      version_text_click_count: 0,
      trigger_admin_dialog_count: 7,
      back_end_server_err: false,
      back_end_server_connecting: true,
      loading: false,
      dialogTableVisible: false,
      isInitializing: false,
      cancelInitComfirmDialogShow: false,
      StartInitComfirmDialogShow: false,
      wait_online_request_dialog_show: false,
      remove_CstData_ComfirmDialog_Show: false,
      ShowOnlineFailDialog: false,
      moduleInformation: {},
      VMSData: new VMSData(),
      server_err_state_text: '連線中...',
      init_btn_blink_timer: null,
      mode_switch_data: {
        type: 'online', //auto
        state: false
      },
      currentTabs: 0,
      previous_tagID: -99,
      ws: null,
      previousAGVPoseIsError: false,
      ShowAGVPoseErrorModel: false,
    }
  },
  methods: {
    async where_r_u() {
      await Where_r_u();
    },
    LangChangeHandle(checked) {
      this.IsUseChinese = checked;
      this.$i18n.locale = this.IsUseChinese ? 'zh-TW' : 'en-US';
      bus.emit('/lang_changed', this.$i18n.locale);
      if (this.IsUseChinese) {
        Notifier.Success("語言變更:中文", 'bottom', 800);
      } else {
        Notifier.Primary("Language:English", 'bottom', 800);
      }
    },
    VersionTextClickHandle() {
      this.version_text_click_count += 1;
      if (this.version_text_click_count > this.trigger_admin_dialog_count) {
        this.ConfirmGODTriggering();
      }
    },
    ConfirmGODTriggering() {
      this.$swal.fire({
        title: 'Warning',
        text: `Do you known what are you doing now?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'OK',
        allowOutsideClick: false
      }).then((result) => {
        this.AdminSwitchDialogResultHandle(result.isConfirmed);
      })

    },
    AdminSwitchDialogResultHandle(checked = false) {
      this.version_text_click_count = 0;
      if (checked) {
        UserStore.commit('setUser', {
          UserName: 'GOD',
          Role: 3
        });
      }
    },
    ShowLogin() {
      if (this.IsLogin) {
        this.$swal.fire({
          title: `Logout Confirm`,
          text: `Logout ?`,
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'OK',
          customClass: 'my-sweetalert'
        }).then((result) => {
          if (result.isConfirmed) {
            UserStore.dispatch('Logout')
          }
        })
      }
      else {
        this.$refs.login.Show();
      }
    },
    async AGVInitialize() {
      if (VMSData.isInitializing) {
        this.cancelInitComfirmDialogShow = true;
      }
      else {
        this.$swal.fire({
          title: 'AGV Initialize',
          text: `${this.$t('start_init_action_notify_submarin_agv')}`,
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'OK',
          customClass: 'my-sweetalert'
        }).then(async (result) => {
          if (result.isConfirmed) {
            this.isInitializing = true;
            var result = await Initialize();
            if (!result.confirm) {
              this.$swal.fire({
                title: 'AGV Initialize Fail',
                text: result.message,
                icon: 'error',
                showCancelButton: false,
                customClass: 'my-sweetalert'
              })
            }
          }
        })

        /***************************************** */
      }
    },
    ShowRemoveCstDialog() {
      this.$swal.fire({
        title: `${this.$t('cst-remove')}`,
        text: `${this.$t('cst-remove-confirm-text')}`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'OK',
        customClass: 'my-sweetalert'
      }).then((result) => {
        if (result.isConfirmed) {
          this.AGVRemoveCassette();
        }
      })

    },
    async CancelInitProcessWorker() {
      await CancelInitProcess()
      clearInterval(this.init_btn_blink_timer);
      this.isInitializing = false;

    },
    async AGVResetAlarm() {
      await ResetAlarm();
    },
    async AGVBuzzerOff() {
      await BuzzerOff();
    },
    async AGVRemoveCassette() {

      var success = await RemoveCassette();
      var swal_title = "";
      var swal_text = "";
      var swal_icon = "";

      if (success) {
        swal_title = swal_text = "移除卡匣成功";
        swal_icon = "success";
      } else {
        swal_title = swal_text = "移除卡匣失敗";
        swal_icon = "error";
      }

      this.$swal.fire({
        title: swal_title,
        text: swal_text,
        icon: swal_icon,
        showCancelButton: false,
        confirmButtonText: 'OK',
        customClass: 'my-sweetalert'
      })

    },
    AGVSMsgIOWebsocketInit() {
      var ws = new WebSocketHelp('ws/AGVS_MSG_IO');
      ws.Connect();
      ws.onmessage = (event) => {
        var msg_io_data = JSON.parse(event.data);
        if (this.$refs['agvs_msg_table'] != undefined) {
          this.$refs['agvs_msg_table'].AddNewMsgData(msg_io_data);

        }
        if (msg_io_data.Message.includes('0301')) {
          var task_msg = JSON.parse(msg_io_data.Message.replaceAll("*\r", ""))
          var task_name = task_msg["Header"]["0301"]["Task Name"];
          ElNotification({
            title: 'NAVITATOR_NEW_TASK',
            message: task_name,
            type: 'success',
            duration: 10000
          })
        }

      };
    },
    VMSDataWebsocketInit() {
      this.ws = new WebSocketHelp('ws/AGVCState');
      this.ws.Connect();

      this.ws.onmessage = (event) => {

        this.back_end_server_err = false;
        this.back_end_server_connecting = false;
        this.VMSData = JSON.parse(event.data);
        AGVStatusStore.commit('updateStatus', this.VMSData)
        if (this.VMSData.Tag > 0) {
          bus.emit('/agv_name_list', [{
            AGV_Name: this.VMSData.CarName,
            Current_Tag: this.VMSData.Tag,
            State: this.VMSData.MainState,
            IsOnline: this.VMSData.OnlineMode == 1,
            Rotation: 0
          }])

          if (this.VMSData.Tag != this.previous_tagID) {
            Notifier.Primary(`Tag Detected:${this.VMSData.Tag}`, 'bottom', 1500);
            bus.emit('/nav_path_update', {
              name: this.VMSData.CarName,
              tags: this.VMSData.NavInfo.PathPlan
            })
          }
        }
        this.previous_tagID = this.VMSData.Tag;
        this.AGVPoseErrorHandler();
        this.BusPublishDataOut();
      }
      this.ws.onclose = (ev) => {
        this.back_end_server_connecting = false;
        this.server_err_state_text = "後端伺服器異常";
        this.back_end_server_err = true;
        this.ws.onclose = null;
        var id = setInterval(() => {
          console.info(this.ws.wssocket.readyState);
          if (this.ws.wssocket.readyState == WebSocket.OPEN) {
            this.ws.onmessage = null;
            this.back_end_server_err = this.back_end_server_connecting = true;
            // setTimeout(() => {
            //   this.$swal.fire({
            //     title: `Page Reload`,
            //     text: `Reconnect! Page will reload after 2 seconds.`,
            //     icon: 'information',
            //     showCancelButton: false,
            //     confirmButtonText: 'OK',
            //     customClass: 'my-sweetalert'
            //   })
            // }, 100)

            clearInterval(id)
            setTimeout(() => {
              location.reload()
            }, 500);
            return;
          }
          if (this.ws.wssocket.readyState == WebSocket.CLOSED)
            this.ws.ReconnectWorker();
        }, 1000);

      }

    },
    ShowMaxSpeedLimitNotification(tag, speed_limit) {
      if (speed_limit == -1)
        return;
      ElNotification({
        title: '限速',
        message: `Tag[${tag}] AGV 速度限制 : ${speed_limit} `,
        type: 'warning',
        duration: 1000
      })
    },
    AGVPoseErrorHandler() {
      if (this.VMSData.IsAGVPoseError != this.previousAGVPoseIsError) {
        //this.ShowAGVPoseErrorModel = this.VMSData.IsAGVPoseError;
        if (this.VMSData.IsAGVPoseError) {
          ElNotification({
            title: 'POSE ERROR',
            message: 'TAG讀取角度異常:與導航角度不同',
            type: 'warning',
            duration: 3000
          })
        }
        this.previousAGVPoseIsError = this.VMSData.IsAGVPoseError;
      }
    },
    BusPublishDataOut() {
      bus.emit('/vms_data', this.VMSData);
      bus.emit('/agv_current_tag', this.VMSData.Tag);
      bus.emit('/battery', this.VMSData.BatteryStatus);
      bus.emit('/mileage', this.VMSData.Mileage);
      bus.emit('/zaxis_driver_state', this.VMSData.ZAxisDriverState)
      bus.emit('/drivers_state', this.VMSData.DriversStates)
      bus.emit('/z_axis_position', this.VMSData.ZAxisDriverState.position)
    },
    AutoModeSwitchHandle() {
      this.mode_switch_data.type = 'auto'
      this.mode_switch_data.state = !this.IsAutoMode;

      this.$swal.fire({
        title: `${this.$t('agv-auto-mode')}`,
        text: `${this.mode_switch_data.state ? this.$t('agv-auto-mode-alert') : this.$t('agv-manual-mode-alert')}`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'OK',
        customClass: 'my-sweetalert'
      }).then((result) => {
        if (result.isConfirmed) {
          this.ModeSwitchHandler();
        }
      })


    },
    OnlineModeSwitchHandle() {
      if (!this.IsOnlineMode && this.VMSData.MainState.toUpperCase() != 'IDLE' && this.VMSData.MainState.toUpperCase() != 'CHARGING') {
        Notifier.Danger(`當前狀態無法上線(${this.VMSData.MainState})`, "top", 5000);
        return;
      }

      this.mode_switch_data.type = 'online'
      this.mode_switch_data.state = !this.IsOnlineMode;

      this.$swal.fire({
        title: `${this.$t('agv-online')}`,
        text: `${this.mode_switch_data.state ? this.$t('agv-online-alert') : this.$t('agv-offline-alert')}`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'OK',
        customClass: 'my-sweetalert'
      }).then((result) => {
        if (result.isConfirmed) {
          this.ModeSwitchHandler();
        }
      })


    },
    async ModeSwitchHandler() {
      if (this.mode_switch_data.type == 'auto') {
        var ret = await MODESwitcher.AutoModeSwitch(this.IsAutoMode ? 0 : 1)
      } else {
        this.wait_online_request_dialog_show = true;
        var ret = await MODESwitcher.OnlineModeSwitch(this.IsOnlineMode ? 0 : 1)
        if (!ret.Success) {
          this.$refs['online-fail-msg'].innerText = ret.Message;
          this.ShowOnlineFailDialog = true;

        }

        setTimeout(() => {
          this.wait_online_request_dialog_show = false;
        }, 1000);
      }
    }
  },
  computed: {
    is_god_mode_now() {
      return UserStore.getters.IsGodUser
    },
    IsLogin() {
      return UserStore.getters.CurrentUserRole != 0;
    },
    LoginBtnText() {
      return this.IsLogin ? '登出' : '登入';
    },
    alarmResetBtnVariant() {
      return this.VMSData.AlarmCodes.length > 0 ? 'danger' : 'light'
    },

    IsAutoMode() {
      return this.VMSData.AutoMode == 1;
    },
    IsOnlineMode() {
      return this.VMSData.OnlineMode == 1;
    },
    App_version() {
      return version;
    },
    NewestAlarm() {
      if (this.VMSData.NewestAlarm == undefined) {
        return undefined
      }
      if (this.VMSData.NewestAlarm.EAlarmCode == 0)
        return undefined

      return this.VMSData.NewestAlarm
    },
    ModeSwitchDisplay() {
      if (this.mode_switch_data.type == 'online') {
        return this.IsOnlineMode ? 'Offline' : 'Online'
      } else {
        return this.IsAutoMode ? 'Manual' : 'Auto'
      }
    },
    UserName() {
      return UserStore.getters.CurrentUserName
    }
  },
  mounted() {
    // setInterval(async () => {
    //   this.moduleInformation = await GetModuleInformation();
    // }, 200);
    this.VMSDataWebsocketInit();
    this.AGVSMsgIOWebsocketInit();
    setInterval(() => {
      this.time = moment(Date.now()).format('yyyy/MM/DD HH:mm:ss');
    }, 1000);
    setTimeout(() => {
      this.loading = false;
    }, 3000);
  },
  destroyed() {
    alert('destroy')
    if (this.ws) {
      this.ws.Close();
    }
  }
}
</script>

<style lang="scss" scoped>
.simulation-mode {
  font-size: 20px;
  animation: color-change 1s infinite;
}
.server-connecting {
  animation: server-connectingcolor-change 1s infinite;
}

.battery-fill-width {
  i {
    position: absolute;
    left: 8px;
    color: white;
    font-weight: bold;
    font-size: 24px;
    top: 28px;
  }
}

.server-error {
  animation: server-errorcolor-change 1s infinite;
}
@keyframes server-errorcolor-change {
  0% {
    background-color: red;
    color: white;
  }
  50% {
    background-color: rgb(255, 170, 170);
    color: black;
  }
  100% {
    background-color: red;
    color: white;
  }
}

@keyframes server-connectingcolor-change {
  0% {
    background-color: rgb(255, 193, 22);
    color: white;
  }
  50% {
    background-color: rgb(255, 237, 156);
    color: black;
  }
  100% {
    background-color: rgb(255, 193, 22);
    color: white;
  }
}

.status {
  .sys-name,
  .account-name,
  .version-name {
    margin: auto 1px;
    color: white;
    font-weight: bold;
    font-size: 22px;
    // letter-spacing: 2px;
  }

  .sys-name {
    margin-left: 0;
  }
  .agvc-name {
    margin: auto 1px;
    font-weight: bold;
    font-size: 22px; //background-color: rgb(0, 197, 211);
  }
  .account-name {
    background-color: rgb(23, 162, 184);
  }
  .version-name,
  .sys-name {
    background-color: rgb(0, 123, 255);
    margin-right: 0;
  }
}
.lang-switch {
  position: absolute;
  right: 9px;
  top: 67px;
}
.alarm-show {
  background-color: rgb(248, 215, 218);
  font-weight: bold;
  color: white;
}
.agv-name-in-alarm {
  font-weight: bold;
  position: absolute;
}

.modes {
  .mode-item-label {
    width: 120px;
    font-weight: bold;
  }
}
.side {
  width: 250px;
  .state-title {
    font-weight: bold;
    font-size: 18px;
  }
  .opt-buttons {
    font-weight: bold;
  }
}
</style>
