<template>
  <div class="fixed-top">
    <div class="setting-icon  px-2" style="width:50px;position:absolute;cursor: pointer;">
      <i v-if="IsGodUser" @click="HandleSettingIconClick" class=" bi bi-sliders"></i>
    </div>
    <div class="status d-flex flex-row bg-light">
      <div v-if="maintainStatus.IsMaintainMode" class="d-flex flex-fill">
        <div
          v-bind:class="SubStatus == '' ? 'down' : SubStatus.toLowerCase()"
          class="agvc-name px-5"
          @dblclick="where_r_u()">
          <i class="bi bi-truck-front mx-1"></i> {{ AGVName == "" ? "AGV" : AGVName }}
        </div>
        <div class="agvc-name flex-fill d-flex justify-content-between align-items-center maintain-display px-2">
          <span>維護模式</span>
          <el-button @click="HandleCloseMaintainModeBtnClick">關閉</el-button>
        </div>
        <div
          @dblclick="VersionTextClickHandle()"
          class="version-name px-3"
          v-bind:class="IsBackendDisconnected ? 'bg-danger' : ''">{{ VersionShowUI ? UIVersion + "(UI)" : APPVersion }}</div>
      </div>
      <div v-else class="d-flex flex-fill">
        <div
          class="sys-name flex-fill"
          v-bind:class="IsBackendDisconnected ? 'backend-disconnected' : ''">
          <div @click="() => { VersionShowUI = !VersionShowUI }">{{ AGVBrandName }}</div>
        </div>
        <div
          v-bind:class="SubStatus == '' ? 'down' : SubStatus.toLowerCase()"
          class="agvc-name flex-fill"
          @dblclick="where_r_u()">
          <i class="bi bi-truck-front mx-1"></i> {{ AGVName == "" ? "AGV" : AGVName }}
        </div>
        <div
          class="account-name flex-fill"
          v-bind:class="IsBackendDisconnected ? 'backend-disconnected' : ''">
          <i class="bi bi-people mx-1"></i> {{ UserName }}
        </div>
        <div
          @dblclick="VersionTextClickHandle()"
          class="version-name flex-fill"
          v-bind:class="IsBackendDisconnected ? 'bg-danger' : ''">{{ VersionShowUI ? UIVersion + "(UI)" : APPVersion }}</div>
      </div>
      <!--語系切換按鈕-->
      <div class="lang-switch">
        <jw_switch
          @switch="LangChangeHandle"
          :default="IsUseChinese"
          active_text="EN"
          active_color="rgb(0, 204, 0)"
          inactive_text="中文"
          inactive_color="rgb(9, 76, 176)"></jw_switch>
      </div>
      <!--視窗與電腦控制-->
      <div class="system-control">
        <b-dropdown variant="danger" right>
          <template #button-content>
            <i class="bi bi-three-dots-vertical me-1"></i> SYSTEM </template>
          <b-dropdown-item @click="toggleFullScreen">
            <i class="bi bi-fullscreen me-2"></i> 全螢幕切換 </b-dropdown-item>
          <b-dropdown-item v-if="IsGodUser">
            <i class="bi bi-pin-map me-2"></i>
            <el-button @click="HandleAGVLocating" :disabled="IsAGVRunning" class="system-control-button" text>車輛定位</el-button>
          </b-dropdown-item>
          <b-dropdown-item v-if="IsGodUser" @click="HandleSickLidarLocBtnClick">
            <i class="bi bi-pin-map me-2"></i> Sick::LidarLoc Website </b-dropdown-item>
          <b-dropdown-item v-if="IsGodUser">
            <i class="bi bi-file-arrow-up-fill me-2"></i>
            <el-button @click="() => { uploadVisible = true }" :disabled="IsAGVRunning" class="system-control-button" text>車載更新</el-button>
          </b-dropdown-item>
          <b-dropdown-item @click="shutdown">
            <i class="bi bi-power me-2"></i> 關機 </b-dropdown-item>
          <b-dropdown-item v-if="false" @click="restart">
            <i class="bi bi-arrow-clockwise me-2"></i>重新啟動 </b-dropdown-item>
        </b-dropdown>
      </div>
      <el-dialog draggable title="更新檔上傳" v-model="uploadVisible" @closed="() => {
        $refs.uploader.handleRemove();
      }">
        <uploader ref="uploader"></uploader>
      </el-dialog>
    </div>
  </div>
</template>
<script>
import { AGVStatusStore, UserStore, UIStore } from '@/store'
import { Localization, Where_r_u, SystemAPI, SwitchMaintainMode } from '@/api/VMSAPI'
import uploader from '@/components/Upload/index.vue'
import bus from '@/event-bus.js'
import jw_switch from "@/components/UIComponents/jw-switch.vue"
import Notifier from "@/api/NotifyHelper.js"
import { SystemSettingsStore } from '@/store'
export default {
  components: {
    uploader, jw_switch
  },
  data() {
    return {
      uploadVisible: false,
      IsUseChinese: true,
      APPVersionDisplay: '',
      VersionShowUI: false,
      isFullScreenNow: false,
    }
  },
  computed: {
    maintainStatus() {
      return AGVStatusStore.state.maintainStatus;
    },
    SubStatus() {
      return AGVStatusStore.getters.AGVStatus.SubState;
    },
    AGVBrandName() {
      // 0:FORK, 1:SUBMERGED_SHIELD, 2:INSPECTION_AGV, 3:UNKNOWN
      var _agv_type = AGVStatusStore.getters.AGVStatus.Agv_Type;
      if (_agv_type == 0)
        return 'GPM FORK AGV';
      else if (_agv_type == 1)
        return 'GPM YTFORK';
      else if (_agv_type == 2)
        return 'GPM Inspection AGV';
      else if (_agv_type == 3)
        return 'GPM Submarine AGV';
      else if (_agv_type == 4)
        return 'GPM Parts AGV';
      else
        return 'GPM AGV'
    },
    AGVName() {
      return AGVStatusStore.getters.AGVStatus.CarName;
    },
    APPVersion() {
      return AGVStatusStore.getters.AGVStatus.APPVersion;
    },
    UIVersion() {
      return import.meta.env.VITE_PACKAGE_VERSION || UIStore.getters.CurrentUIVersion
    },
    UserName() {
      return UserStore.getters.CurrentUserName
    },
    IsGodUser() {
      return UserStore.getters.IsGodUser
    },
    IsAGVRunning() {
      return AGVStatusStore.state.AGVStatus.SubState == 'RUN';
    }
  },
  methods: {
    async where_r_u() {
      await Where_r_u();
    },
    VersionTextClickHandle() {
      this.ConfirmGODTriggering();
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
    async HandleSettingIconClick() {
      bus.emit('show-settings')
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
    toggleFullScreen() {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen();
          this.isFullScreenNow = true;
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
          this.isFullScreenNow = false;
        }
      }
    },
    shutdown() {
      this.$swal.fire(
        {
          title: '確定要關閉車載電腦?',
          text: '',
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'OK',
          customClass: 'my-sweetalert'
        }).then(async (res) => {
          if (!res.isConfirmed)
            return;
          await SystemAPI.ShutdownPC();
          let timerInterval;
          this.$swal.fire({
            title: "PC Close!",
            icon: 'warning',
            html: "PC will close in <b></b> seconds...",
            timer: 5000,
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
            }
          }).then((result) => {
            /* Read more about handling dismissals below */
            if (result.dismiss === this.$swal.DismissReason.timer) {
              console.log("I was closed by the timer");
            }
          });
        })
    },
    restart() {
      this.$swal.fire(
        {
          title: '確定要重新啟動車載電腦?',
          text: '',
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'OK',
          customClass: 'my-sweetalert'
        }).then(res => {
          if (!res.isConfirmed)
            return;

        })
    },
    async HandleAGVLocating() {
      var response = await Localization();//{Success,Message}
      if (response.Success) {
        this.$swal.fire(
          {
            title: '定位完成',
            text: '',
            icon: 'success',
            showCancelButton: false,
            confirmButtonText: 'OK',
            customClass: 'my-sweetalert'
          })
      } else {
        this.$swal.fire(
          {
            title: '定位失敗',
            text: response.Message,
            icon: 'error',
            showCancelButton: false,
            confirmButtonText: 'OK',
            customClass: 'my-sweetalert'
          })
      }
    },
    HandleSickLidarLocBtnClick() {
      window.open('http://192.168.1.1');
    },
    async HandleCloseMaintainModeBtnClick() {
      await SwitchMaintainMode(false);
    }

  },
  mounted() {
    document.addEventListener('fullscreenchange', this.handleFullscreenChange);
  },
  beforeUnmount() {
    //document.removeEventListener('fullscreenchange', this.handleFullscreenChange);

  },
  props: {
    IsBackendDisconnected: {
      type: Boolean,
      default: true
    },
  },
}
</script>
<style lang="scss" scoped>
.setting-icon {
  color: white;
  font-size: 23px;
}

.status {
  height: 37px;

  .sys-name,
  .agvc-name,
  .account-name,
  .version-name {
    color: white;
    font-weight: bold;
    font-size: 22px;
    // letter-spacing: 2px;
    margin-right: 1px;
    -webkit-user-select: none;
    /* Chrome/Safari */
    -moz-user-select: none;
    /* Firefox */
    -ms-user-select: none;
    /* IE10+ */
    user-select: none;
    /* Standard syntax */
  }

  .version-name {
    cursor: pointer;
  }

  .account-name {
    background-color: rgb(23, 162, 184);
  }

  .version-name,
  .sys-name {
    background-color: rgb(0, 123, 255);
  }

  .backend-disconnected {
    background-color: rgb(255, 67, 67);
    color: white;
  }

  .system-control {
    height: 100%;
    margin-left: 2px;

    :deep(.btn-group > .btn) {
      border-radius: 0;
      height: 37px;
    }
  }

  .system-control-button {
    width: 100%;
    font-family: inherit;
    font-size: inherit;
    line-height: inherit;
    padding-left: -124px;
    color: inherit;

    :deep(span) {
      left: -56px !important;
      position: relative !important;
    }

    :deep(:active) {
      background-color: rgb(0, 123, 255) !important;
    }
  }

  .maintain-display {
    background-color: red;
    animation: maintain-mode-blink 1s infinite;
  }

  @keyframes maintain-mode-blink {

    0%,
    100% {
      background-color: red;
      color: white;
    }

    50% {
      background-color: rgb(253, 143, 143);
      color: rgb(255, 174, 0);
    }
  }

}
</style>