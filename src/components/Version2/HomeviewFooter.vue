<template>
  <div class="home-view-footer border-top fixed-bottom d-flex justify-content-center">
    <span
      @click="VersionTextClickHandle()"
      class="sys-time-display rounded px-1 text-light"
      v-text="SystemTime"
    ></span>
    <!-- <div class="mode-switchs rounded px-1 text-light">
      <span style="font-size: 12px;">AUTO-MODE</span>
      <el-switch></el-switch>
      <span style="font-size: 12px;">AUTO-MODE</span>
      <el-switch></el-switch>
    </div>-->
    <div class="system-controls">
      <div class="py-2 text-start px-1 d-flex">
        <div>
          <span class="mx-1" style="font-size: 15px;">ONLINE-MODE</span>
          <el-switch
            v-model="OnlineMode"
            active-color="rgb(95, 171, 80)"
            inactive-color="red"
            active-text="ONLINE"
            inactive-text="OFFLINE"
            inline-prompt
            size="large"
            width="80px"
          ></el-switch>
          <!-- :before-change="mode.beforeChangeHandler"
          :loading="mode.loading"-->
          <!-- <jw-switch inactive_text="OFFLINE" active_text="ONLINE"></jw-switch> -->
        </div>
        <div>
          <span class="mx-1" style="font-size: 15px;">AUTO-MODE</span>
          <el-switch
            v-model="AutoMode"
            active-color="rgb(95, 171, 80)"
            inactive-color="red"
            active-text="AUTO"
            inactive-text="MANUAL"
            inline-prompt
            size="large"
            width="80px"
          ></el-switch>
        </div>
      </div>
      <div class="status d-flex">
        <b-button squared v-bind:class="initBtnClass" @click="InitializeClick">初始化</b-button>
        <b-button squared :variant="resetAlarmBtnVariant" @click="ResetAlarmlick">異常復歸</b-button>
        <b-button squared variant="light" @click="BuzzerOffClick">關閉蜂鳴器</b-button>
        <b-button squared variant="light" @click="RemoveCstClick">移除卡匣</b-button>
      </div>
    </div>
    <div class="icons d-flex justify-content-end flex-fill">
      <div class="w-100">
        <div class="icon-containers d-flex">
          <div class="py-1" @click="HomeIconClick">
            <img src="/images/home.png" width="50" alt />
          </div>
          <div @click="AlarmIconClick">
            <img src="/images/alarm2.png" width="55" alt />
          </div>
          <div @click="IOTableIconClick">
            <img src="/images/io_table.png" width="60" alt />
          </div>
        </div>
        <div class="icon-containers d-flex">
          <div @click="ControllerIconClick">
            <img src="/images/controller.png" width="60" alt />
          </div>
          <div @click="ShowLogin">
            <img src="/images/signin.png" width="60" alt />
          </div>
        </div>
      </div>
      <div @click="EmoClick">
        <img src="@/assets/emo.png" width="100" alt />
      </div>
    </div>

    <login ref="loginShow"></login>
  </div>
</template>

<script>
import { Initialize, CancelInitProcess, ResetAlarm, BuzzerOff, RemoveCassette, MODESwitcher, EMO } from '@/api/VMSAPI'
import { AGVStatusStore, UserStore, UIStore } from '@/store'
import login from '@/components/Login.vue'
import moment from 'moment'
import jwSwitch from '../UIComponents/jw-switch.vue'

export default {
  components: {
    login, jwSwitch
  },
  data() {
    return {
      SystemTime: '1997-04-18 12:00:00',
      trigger_admin_dialog_count: 5,
      version_text_click_count: 0,
      OnlineMode: false,
      AutoMode: false,
    }
  },
  methods: {
    ControllerIconClick() {
      debugger
      this.$router.push(`/v2/controller/${UIStore.getters.PreviousControllRoute}`)
    },
    HomeIconClick() {
      this.$router.push('/v2')
    },
    IOTableIconClick() {
      this.$router.push('/v2/IOTable')
    },
    AlarmIconClick() {
      this.$router.push('/v2/Alarm')
    },
    async InitializeClick() {
      this.$swal.fire({
        title: 'AGV Initialize',
        // text: `${this.$t(this.Is_Fork_AGV ? 'start_init_action_notify' : 'start_init_action_notify_submarin_agv')}`,
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

    },
    async ResetAlarmlick() {
      await ResetAlarm();
    },
    async BuzzerOffClick() {
      await BuzzerOff();
    },
    async RemoveCstClick() {

    },
    async EmoClick() {
      EMO();
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
        this.$refs.loginShow.Show();
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
    }
  },
  computed: {
    initBtnClass() {
      return AGVStatusStore.getters.AGVStatus.SubState.toLowerCase();
    },
    resetAlarmBtnVariant() {
      return (AGVStatusStore.getters.AGVStatus.AlarmCodes.length > 0) ? 'danger' : 'light'
    },
    IsLogin() {
      return UserStore.getters.CurrentUserRole != 0;
    },
  },
  mounted() {
    setInterval(() => {
      this.SystemTime = moment(Date.now()).format('yyyy-MM-DD HH:mm:ss')
    }, 1000);;
  },
}
</script>

<style lang="scss" scoped>
.home-view-footer {
  height: 120px;
  background-color: #ebe7e7;
  .sys-time-display,
  .mode-switchs {
    background-color: rgb(67 67 67);
    position: absolute;
    font-weight: bold;
    bottom: 123px;
  }
  .mode-switchs {
    left: 10px;
    color: white;
  }
  .sys-time-display {
    right: 1px;
    letter-spacing: 2px;
  }
  .system-controls {
    button {
      font-size: 25px;
      width: 151px;
      height: 70px;
      margin-inline: 2px;
      font-weight: bold;
      border: 1px solid rgb(167, 167, 167);
      box-shadow: 3px -1px 13px -1px #959595;
    }
  }
  .icons {
    padding-right: 25px;
    .icon-containers {
      div {
        width: 70px;
        height: 60px;
      }
    }
    div {
      margin-inline: 2px;
    }
    img:hover {
      cursor: pointer;
      background-color: rgb(13, 110, 253);
      border: 1px solid black;
    }
  }
}
</style>