<template>
  <div class="fixed-top">
    <div class="status d-flex flex-row bg-light">
      <div
        class="sys-name flex-fill"
        v-bind:class="IsBackendDisconnected ? 'backend-disconnected' : ''"
      >
        <div class="px-2" style="width:50px;position:absolute;cursor: pointer;">
          <i v-if="IsGodUser" @click="HandleSettingIconClick" class="bi bi-sliders"></i>
        </div>
        <div @click="() => { VersionShowUI = !VersionShowUI }">{{ AGVBrandName }}</div>
      </div>
      <div
        v-bind:class="SubStatus == '' ? 'down' : SubStatus.toLowerCase()"
        class="agvc-name flex-fill"
        @dblclick="where_r_u()"
      >
        <i class="bi bi-truck-front mx-1"></i>
        {{ AGVName == "" ? "AGV" : AGVName }}
      </div>
      <div
        class="account-name flex-fill"
        v-bind:class="IsBackendDisconnected ? 'backend-disconnected' : ''"
      >
        <i class="bi bi-people mx-1"></i>
        {{ UserName }}
      </div>
      <div
        @dblclick="VersionTextClickHandle()"
        class="version-name flex-fill"
        v-bind:class="IsBackendDisconnected ? 'bg-danger' : ''"
      >{{ VersionShowUI ? UIVersion + "(UI)" : APPVersion }}</div>
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
      <!--視窗與電腦控制-->
      <div class="system-control">
        <b-dropdown variant="danger" right>
          <template #button-content>
            <i class="bi bi-three-dots-vertical me-1"></i>
            SYSTEM
          </template>
          <b-dropdown-item @click="toggleFullScreen">
            <i class="bi bi-fullscreen me-2"></i>
            全螢幕切換
          </b-dropdown-item>
          <b-dropdown-item v-if="IsGodUser" @click="HandleAGVLocating">
            <i class="bi bi-pin-map me-2"></i> 車輛定位
          </b-dropdown-item>

          <b-dropdown-item v-if="IsGodUser" @click="() => { uploadVisible = true }">
            <i class="bi bi-file-arrow-up-fill me-2"></i> 車載更新
          </b-dropdown-item>
          <b-dropdown-item @click="shutdown">
            <i class="bi bi-power me-2"></i> 關機
          </b-dropdown-item>
          <b-dropdown-item v-if="false" @click="restart">
            <i class="bi bi-arrow-clockwise me-2"></i>重新啟動
          </b-dropdown-item>
        </b-dropdown>
      </div>
      <el-dialog
        draggable
        title="更新檔上傳"
        v-model="uploadVisible"
        @closed="() => {
        $refs.uploader.handleRemove();
      }"
      >
        <uploader ref="uploader"></uploader>
      </el-dialog>
    </div>
  </div>
</template>
<script>
import { AGVStatusStore, UserStore, UIStore } from '@/store'
import { Localization, Where_r_u, SystemAPI } from '@/api/VMSAPI'
import uploader from '@/components/Upload'
import bus from '@/event-bus.js'
import jw_switch from "@/components/UIComponents/jw-switch.vue"
import Notifier from "@/api/NotifyHelper.js"
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
      isFullScreenNow: false
    }
  },
  computed: {
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
      return process.env.PACKAGE_VERSION
    },
    UserName() {
      return UserStore.getters.CurrentUserName
    },
    IsGodUser() {
      return UserStore.getters.IsGodUser
    },
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
    HandleSettingIconClick() {
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
        }).then(res => {
          if (!res.isConfirmed)
            return;
          SystemAPI.ShutdownPC();
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
    ::v-deep .b-dropdown {
      height: 100%;

      .btn {
        height: 100%;
        border-radius: 0 !important; // 使用 !important 来确保覆盖
        padding-left: 1rem;
        padding-right: 1rem;
        // 移除所有可能的圆角和过渡效果
        &,
        &:hover,
        &:focus,
        &:active {
          border-radius: 0 !important;
          transition: none;
        }
      }

      .dropdown-menu {
        margin-top: 0;
        border-radius: 0; // 移除下拉菜单的所有圆角
      }

      .dropdown-item {
        display: flex;
        align-items: center;

        i {
          font-size: 1.1em;
          margin-right: 0.5rem;
        }
      }
    }
  }
}
</style>