<template>
  <div class="agv-operator py-2">
    <b-tabs class="agv-operator-tabs" :lazy="false" :model-value="current_tab" pills small
      @activate-tab="HandleTabpageChanged">
      <b-tab :title="$t('agv_control')">
        <div class="mt-1 p-1 agv-control-tab-pane">
          <AgvControl></AgvControl>
        </div>
      </b-tab>
      <b-tab v-show="agv_type == 0" :title="agv_type == 0 ? $t('zaxis_up_down') : ''">
        <div class="mt-1 p-1">
          <ZAxisControl :enabled="operation_enabled_return"></ZAxisControl>
        </div>
      </b-tab>
      <b-tab title="Input">
        <div class="table-container-div mt-1 p-1">
          <IOTable digital_type="input" :table_data="DIOTableData.Inputs"></IOTable>
        </div>
      </b-tab>
      <b-tab title="Output">
        <div class="table-container-div mt-1 p-1">
          <IOTable :readonly="false" digital_type="output" :enabled="operation_enabled_return" :super_user="isGodMode"
            :table_data="DIOTableData.Outputs" :isOutput="true"></IOTable>
        </div>
      </b-tab>
      <b-tab v-show="operation_enabled_return" :title="operation_enabled_return ? $t('manual-operation') : ''">
        <div class="mt-1 p-1">
          <ManualSettings :enabled="operation_enabled_return"></ManualSettings>
        </div>
      </b-tab>
      <b-tab v-if="operation_enabled_return && isAMCAGV" :title="operation_enabled_return ? 'Sensor/儀器控制' : ''">
        <div class="mt-1 p-1">
          <SensorAndEquipmentControl></SensorAndEquipmentControl>
        </div>
      </b-tab>
      <b-tab v-if="isShowSaftyPLCIO" :title="$t('SaftyPLC.tab_title')">
        <div class="mt-1 p-1">
          <SaftyPLCIOView></SaftyPLCIOView>
        </div>
      </b-tab>
    </b-tabs>
  </div>
</template>
<script>
import AgvControl from './AgvcControl.vue'
import ZAxisControl from './ZAxisControl.vue'
import IOTable from './IOTable.vue';
import param from '@/gpm_param';
import clsDIOTable from '@/ViewModels/clsDIOTable';
import ManualSettings from './ManualSettings.vue';
import SensorAndEquipmentControl from './SensorAndEquipmentControl.vue';
import bus from '@/event-bus.js'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UserStore, DIOStore, AGVStatusStore, SystemSettingsStore } from '@/store'
import { ROS_STORE } from "@/store/ros_store"
import { ElNotification } from 'element-plus'
import SaftyPLCIOView from '@/components/SaftyPLC/SaftyPLCIOView.vue'

const TAB_STORAGE_KEY = 'agv_operator_tab'

function loadStoredTab(defaultVal = 0) {
  const raw = localStorage.getItem(TAB_STORAGE_KEY)
  if (raw == null) return defaultVal
  const n = parseInt(raw, 10)
  return Number.isNaN(n) || n < 0 ? defaultVal : n
}

export default {

  components: {
    AgvControl, ZAxisControl, IOTable, ManualSettings, SensorAndEquipmentControl, SaftyPLCIOView
  },
  data() {
    return {
      type: '',

      trigger_admin_dialog_count: 5,
      version_text_click_count: 0,
      modal_key: '',
      current_tab: loadStoredTab(0)
    }
  },
  mounted() {
    this.ensureValidTab()
    this.applyTabSideEffects(this.current_tab)
    bus.on('on-fork-height-click', () => {
      this.setCurrentTab(1);
      this.applyTabSideEffects(1);
    });
    bus.on('on-manual-lsr-setting-show-invoke', () => {
      this.setCurrentTab(4);
      this.applyTabSideEffects(4);
    });
    bus.on('show-move-control', () => {
      this.setCurrentTab(0);
      this.applyTabSideEffects(0);
    });
    bus.on('show-manual-operation', () => {
      this.setCurrentTab(4);
      this.applyTabSideEffects(4);
    });
    bus.on('show-io-table', (ioType) => {
      const tabIndex = ioType === 'output' ? 3 : 2;
      this.setCurrentTab(tabIndex);
      this.applyTabSideEffects(tabIndex);
    });
  },
  watch: {
    operation_enabled_return() {
      this.ensureValidTab()
    },
    isAMCAGV() {
      this.ensureValidTab()
    }
  },
  methods: {
    setCurrentTab(tabIndex) {
      this.current_tab = tabIndex
      localStorage.setItem(TAB_STORAGE_KEY, String(tabIndex))
    },
    ensureValidTab() {
      if (this.current_tab < 0 || this.current_tab > this.maxVisibleTabIndex) {
        this.setCurrentTab(0)
        this.applyTabSideEffects(0)
      }
    },
    applyTabSideEffects(currentTabs) {
      ROS_STORE.dispatch('keyboard_move_enable', currentTabs == 0)
      if (currentTabs != 0) {
        ROS_STORE.dispatch('force_stop')
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
    HandleTabpageChanged(currentTabs, previousTabs) {
      this.setCurrentTab(currentTabs);
      if (currentTabs == previousTabs)
        return;
      this.applyTabSideEffects(currentTabs);
      this.$emit('OnTabChanged', currentTabs);
    },
  },
  props: {
    ModuleInformation: {
      type: Object,
      default() {
        return {

        }
      }
    },
    operation_enabled: {
      type: Boolean,
      default: false
    },
    agv_type: {
      type: Number,
      default() {
        return 0
      }
    }
  },
  computed: {
    /** Sensor tab 使用 v-if，無權限時不佔 index；其餘含 v-show 仍佔 index (0~4) */
    maxVisibleTabIndex() {
      // 0 AGV / 1 Z / 2 Input / 3 Output / 4 Manual / (5 Sensor optional) / last = Safty PLC
      return (this.operation_enabled_return && this.isAMCAGV) ? 6 : 5
    },
    isGodMode() {
      return UserStore.getters.IsGodUser;
    },
    operation_enabled_return() {
      if (this.isGodMode)
        return true;
      else
        return this.operation_enabled
    },
    isAMCAGV() {
      return AGVStatusStore.getters.IsInspectionAGV
    },
    DIOTableData() {
      return DIOStore.getters.DIOStates
    },
    isShowSaftyPLCIO() {
      if (SystemSettingsStore.state.Settings.UI == undefined || SystemSettingsStore.state.Settings.UI.IsSaftyPPLCStatusDisplay == undefined)
        return false;
      return SystemSettingsStore.state.Settings.UI.IsSaftyPPLCStatusDisplay;
    }
  }
}
</script>
<style scoped lang="scss">
.agv-operator {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .agv-operator-tabs {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  :deep(.tab-content) {
    flex: 1 1 auto;
    min-height: 0;
    overflow: hidden;
  }

  :deep(.tab-pane) {
    height: 100%;
  }

  :deep(.tab-pane.active) {
    display: flex;
    flex-direction: column;
  }

  .agv-control-tab-pane {
    flex: 1 1 auto;
    min-height: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
}

:deep(.nav-pills) {
  background-color: rgb(240, 240, 240);
  flex-shrink: 0;
}

.admin-dialog-modal {
  p {
    //
    font-weight: bold;
    user-select: none;
  }

  .admin-dialog-buttons {
    button {
      width: 220px;
      font-size: 50px;
      color: white;
      border-radius: 9px;
      margin: 4px;
    }

    button:hover {
      background-color: gray;
      color: white;
    }

    .yes-btn {
      background-color: rgb(0, 123, 255);
    }

    .no-btn {
      background-color: rgb(220, 53, 69);
    }
  }
}
</style>
