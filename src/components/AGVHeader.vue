<template>
  <div class="fixed-top">
    <div class="status d-flex flex-row bg-light">
      <div class="sys-name flex-fill">
        <div class="px-2" style="width:50px;position:absolute;">
          <i v-if="IsGodUser" @click="HandleSettingIconClick" class="bi bi-sliders"></i>
        </div>
        <div @click="() => { VersionShowUI = !VersionShowUI }">GPM AGV</div>
      </div>
      <div
        v-bind:class="SubStatus == '' ? 'down' : SubStatus.toLowerCase()"
        class="agvc-name flex-fill"
        @dblclick="where_r_u()">{{ AGVName == "" ? "AGV" : AGVName }}</div>
      <div class="account-name flex-fill">{{ UserName }}</div>
      <div @dblclick="VersionTextClickHandle()" class="version-name flex-fill"> {{ VersionShowUI ? UIVersion + "(UI)" : APPVersion }} <i
          v-if="IsGodUser"
          @click="() => { uploadVisible = true }"
          class="bi bi-cloud-upload"></i>
      </div>
      <!--語系切換按鈕-->
      <div class="lang-switch  ">
        <jw_switch
          @switch="LangChangeHandle"
          :default="IsUseChinese"
          active_text="CH"
          active_color="rgb(0, 204, 0)"
          inactive_text="EN"
          inactive_color="rgb(9, 76, 176)"></jw_switch>
      </div>
      <el-dialog draggable title="File Upload" v-model="uploadVisible">
        <uploader></uploader>
      </el-dialog>
    </div>
  </div>
</template>

<script>
import { AGVStatusStore, UserStore, UIStore } from '@/store'
import { Where_r_u } from '@/api/VMSAPI'
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
      VersionShowUI: false
    }
  },
  computed: {
    SubStatus() {
      return AGVStatusStore.getters.AGVStatus.SubState;
    },
    AGVName() {
      return AGVStatusStore.getters.AGVStatus.CarName;
    },
    APPVersion() {
      return AGVStatusStore.getters.AGVStatus.APPVersion;
    },
    UIVersion() {
      return UIStore.getters.CurrentUIVersion
    },
    UserName() {
      return UserStore.getters.CurrentUserName
    },
    IsGodUser() {
      return UserStore.getters.IsGodUser
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
  },
  mounted() {
  }
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
  }

  .lang-switch {
    // position: absolute;
    // right: 9px;
    // top: 67px;
  }

  .account-name {
    background-color: rgb(23, 162, 184);
  }

  .version-name,
  .sys-name {
    background-color: rgb(0, 123, 255);
  }
}
</style>