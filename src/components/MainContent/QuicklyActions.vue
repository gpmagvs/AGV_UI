<template>
  <div v-if="isShow" class="quickly-actions d-flex">
    <div class="d-flex flex-row justify-content-between w-100">
      <div v-if="isShowCstReaderSwitch">
        <span># 貨物ID讀取 Cargo ID Read:</span>
        <el-switch
          v-model="cstIdRead"
          class="mx-2 pb-2"
          active-text="ON"
          inactive-color="red"
          inactive-text="OFF"
          inline-prompt
          @change="(val) => { SaveReaderSettings(val); }"></el-switch>
      </div>
      <div class="d-flex flex-row  align-items-center text-dark">
        <CheckParamSettingButton />
        <div class="d-flex flex-row  align-items-center gap-1">
          <span>Laser</span>
          <el-tag effect="dark" type="primary"> {{ LaserMode }}</el-tag>
        </div>
        <el-tag effect="light" type="info"> {{ currentSpeedCommand }}</el-tag>
        <span class="border-end px-2">CPU:{{ CPU }}%</span>
        <span>RAM:{{ Memory }} Mb</span>
        <DiskStatus />
      </div>
    </div>
  </div>
</template>
<script>
import { SystemSettingsStore, UserStore, SystemMsgStore, AGVStatusStore } from '@/store';
import { watch } from 'vue';
import { SystemAPI } from '@/api/VMSAPI';
import SystemSettings from '@/ViewModels/SystemSettings';
import { ElNotification } from 'element-plus';
import bus from '@/event-bus';
import DiskStatus from './DiskStatus.vue';
import CheckParamSettingButton from './CheckParamSettingButton.vue';
export default {
  components: {
    DiskStatus,
    CheckParamSettingButton
  },
  data() {
    return {
      cstIdRead: false,
      settingsStored: undefined,
      saveSettingsTimeout: undefined,
    }
  },
  methods: {
    async SaveReaderSettings(val) {
      // Debounce the save operation
      if (this.saveSettingsTimeout) {
        clearTimeout(this.saveSettingsTimeout);
      }

      this.saveSettingsTimeout = setTimeout(async () => {
        const showGetSettingsError = () => {
          this.$swal.fire(
            {
              title: '系統參數異常',
              text: '無法設定 Reader設定 (無法取得系統參數)',
              icon: 'warning',
              showCancelButton: false,
              confirmButtonText: 'OK',
              customClass: 'my-sweetalert'
            })
        }

        let retryCount = 0;
        const maxRetries = 3;
        let settingsLoaded = false;

        while (retryCount < maxRetries && !settingsLoaded) {
          await SystemSettingsStore.dispatch('downloadSettings');
          settingsLoaded = SystemSettingsStore.state.IsSettingsLoaded;

          if (!settingsLoaded) {
            retryCount++;
            if (retryCount < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒
            }
          }
        }

        if (!settingsLoaded) {
          this.cstIdRead = !this.cstIdRead;
          showGetSettingsError();
          return;
        }
        this.settingsStored = SystemSettingsStore.state.Settings;
        if (this.settingsStored) {

          this.settingsStored = SystemSettingsStore.state.Settings;
          this.settingsStored.CST_READER_TRIGGER = val;
          const result = await SystemAPI.SaveSettings(this.settingsStored);
          if (result.confirm) {
            ElNotification.success(`讀取貨物ID功能已${val ? '開啟' : '關閉'}!`);
          } else {
            this.$swal.fire({
              title: 'Reader 設定更新失敗:' + result.errorMsg,
              text: result.message,
              icon: 'error',
              showCancelButton: false,
              confirmButtonText: 'OK',
              customClass: 'my-sweetalert',
              allowOutsideClick: false,
              allowEscapeKey: false
            });
            this.cstIdRead = !this.cstIdRead;
          }
        }
        else {
          showGetSettingsError();
          this.cstIdRead = !this.cstIdRead;
        }

      }, 500); // Wait 500ms before executing
    }
  },
  computed: {
    diskStatus() {
      return SystemMsgStore.state.DiskStatus
    },
    isShow() {
      if (SystemSettingsStore.state.Settings.UI == undefined || SystemSettingsStore.state.Settings.UI.IsQuicklyActionFooterDisplay == undefined)
        return true;
      return SystemSettingsStore.state.Settings.UI.IsQuicklyActionFooterDisplay
    },
    isShowCstReaderSwitch() {
      if (UserStore.state.UserState.Role > 0)
        return true;
      return SystemSettingsStore.state.Settings.UI.CstReaderSwitchDisplayWhenNotLogin;
    },
    currentSpeedCommand() {
      return AGVStatusStore.state.CurrentRobotSpeedCommand;
    },
    Memory() {
      return AGVStatusStore.state.AGVStatus.SysLoading.Memory;
    },
    CPU() {
      return AGVStatusStore.state.AGVStatus.SysLoading.CPU;
    },
    LaserMode() {
      return AGVStatusStore.state.AGVStatus.Current_LASER_MODE;
    }

  },
  mounted() {
    setTimeout(() => {
      if (!SystemSettingsStore.state.IsSettingsLoaded) {
        this.$swal.fire(
          {
            title: '系統參數異常',
            text: 'Reader 設定同步失敗 (無法取得系統參數)',
            icon: 'warning',
            showCancelButton: false,
            confirmButtonText: 'OK',
            customClass: 'my-sweetalert'
          })
        return;
      }
      if (SystemSettingsStore.state.Settings) {
        this.cstIdRead = SystemSettingsStore.state.Settings.CST_READER_TRIGGER
        this.settingsStored = SystemSettingsStore.state.Settings
      }
    }, 5000);
    bus.on('ParameterChanged', (param) => {
      if (this.cstIdRead != param.CST_READER_TRIGGER) {
        this.cstIdRead = param.CST_READER_TRIGGER;
        ElNotification.success({
          title: '系統參數更新提示',
          message: `Reader讀取設定已更新為${param.CST_READER_TRIGGER ? '開啟' : '關閉'}`,
          type: 'success'
        });
      }
    })
  },
}
</script>
<style lang="scss" scoped>
.quickly-actions {
  z-index: 1099999;
}
</style>