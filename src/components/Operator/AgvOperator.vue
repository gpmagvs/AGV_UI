<template>
  <div class="agv-operator py-2">
    <b-tabs class="agv-operator-tabs" :lazy="false" :model-value="currentTabIndex" pills small
      @activate-tab="HandleTabpageChanged">
      <b-tab :title="$t('agv_control')">
        <div class="mt-1 p-1 agv-control-tab-pane">
          <AgvControl></AgvControl>
        </div>
      </b-tab>
      <b-tab v-if="agv_type == 0" :title="$t('zaxis_up_down')">
        <div class="mt-1 p-1 fork-side-tab-pane">
          <ForkSideViewVisualization :enabled="operation_enabled_return"></ForkSideViewVisualization>
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
      <b-tab v-if="operation_enabled_return" :title="$t('manual-operation')">
        <div class="mt-1 p-1">
          <ManualSettings :enabled="operation_enabled_return"></ManualSettings>
        </div>
      </b-tab>
      <b-tab v-if="operation_enabled_return && hasRobotArm" :title="$t('robot.tab_title')">
        <div class="mt-1 p-1 robot-tab-pane">
          <RobotControl
            :enabled="operation_enabled_return"
            :active="isRobotTabActive"
          ></RobotControl>
        </div>
      </b-tab>
      <b-tab v-if="operation_enabled_return && isAMCAGV" title="Sensor/儀器控制">
        <div class="mt-1 p-1">
          <SensorAndEquipmentControl></SensorAndEquipmentControl>
        </div>
      </b-tab>
      <b-tab v-if="isShowSaftyPLCIO" :title="$t('SaftyPLC.tab_title')">
        <div class="mt-1 p-1">
          <SaftyPLCIOView></SaftyPLCIOView>
        </div>
      </b-tab>
      <b-tab v-if="isGodMode && isUniversalAGV" title="四輪姿態調整">
        <div class="mt-1 p-1">
          <WheelsAngleAdjust></WheelsAngleAdjust>
        </div>
      </b-tab>
    </b-tabs>
  </div>
</template>
<script>
import AgvControl from './AgvcControl.vue'
import ZAxisControl from './ZAxisControl.vue'
import ForkSideViewVisualization from './ForkSideViewVisualization.vue'
import IOTable from './IOTable.vue';
import ManualSettings from './ManualSettings.vue';
import SensorAndEquipmentControl from './SensorAndEquipmentControl.vue';
import RobotControl from './RobotControl.vue'
import { UserStore, DIOStore, AGVStatusStore, SystemSettingsStore, UIStore } from '@/store'
import { ROS_STORE } from "@/store/ros_store"
import SaftyPLCIOView from '@/components/SaftyPLC/SaftyPLCIOView.vue'
import WheelsAngleAdjust from './WheelsAngleAdjust.vue'
import { MAIN_TAB, OPERATOR_TAB, resolveTabIndex, resolveTabId } from '@/constants/tabPages'
import { RobotAPI } from '@/api/RobotAPI'

export default {

  components: {
    AgvControl,
    ZAxisControl,
    ForkSideViewVisualization,
    IOTable,
    ManualSettings,
    SensorAndEquipmentControl,
    RobotControl,
    SaftyPLCIOView,
    WheelsAngleAdjust
  },
  data() {
    return {
      type: '',
      trigger_admin_dialog_count: 5,
      version_text_click_count: 0,
      modal_key: '',
      hasRobotArm: false,
    }
  },
  mounted() {
    this.ProbeRobotArm()
    this.ensureValidTab()
    this.applyTabSideEffects(UIStore.getters.operatorTabId)
  },
  watch: {
    agv_type() {
      this.ensureValidTab()
    },
    operation_enabled_return() {
      this.ensureValidTab()
    },
    isAMCAGV() {
      this.ensureValidTab()
    },
    isShowSaftyPLCIO() {
      this.ensureValidTab()
    },
    isGodMode() {
      this.ensureValidTab()
    },
    isUniversalAGV() {
      this.ensureValidTab()
    },
    hasRobotArm() {
      this.ensureValidTab()
    },
    storeOperatorTabId(tabId, previousTabId) {
      if (tabId === previousTabId) return
      this.applyTabSideEffects(tabId)
    }
  },
  methods: {
    async ProbeRobotArm() {
      try {
        const info = await RobotAPI.HasRobot()
        this.hasRobotArm = !!(info?.hasRobot ?? info?.HasRobot)
      } catch {
        this.hasRobotArm = false
      }
      this.ensureValidTab()
    },
    setOperatorTabId(tabId) {
      UIStore.dispatch('navigateTabPage', { operator: tabId })
    },
    ensureValidTab() {
      const ids = this.visibleOperatorTabIds
      const currentId = UIStore.getters.operatorTabId
      if (!ids.includes(currentId)) {
        const fallback = ids[0] || OPERATOR_TAB.MOVE_CONTROL
        this.setOperatorTabId(fallback)
        this.applyTabSideEffects(fallback)
      }
    },
    applyTabSideEffects(tabId) {
      // 僅在主分頁為操作時才調整鍵盤；離開操作分頁由 TabContainer 負責關閉
      if (UIStore.getters.mainTabId !== MAIN_TAB.OPERATION) {
        return
      }
      const isMoveControl = tabId === OPERATOR_TAB.MOVE_CONTROL
      ROS_STORE.dispatch('keyboard_move_enable', isMoveControl)
      if (!isMoveControl) {
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
      const tabId = resolveTabId(this.visibleOperatorTabIds, currentTabs)
      if (!tabId) return
      this.setOperatorTabId(tabId)
      if (currentTabs == previousTabs) return
      this.$emit('OnTabChanged', tabId)
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
    storeOperatorTabId() {
      return UIStore.getters.operatorTabId
    },
    /**
     * 全部條件 tab 使用 v-if，未顯示時不佔 index、不留空白。
     * visibleOperatorTabIds 必須與模板渲染條件一致。
     */
    visibleOperatorTabIds() {
      const ids = [OPERATOR_TAB.MOVE_CONTROL]
      if (this.agv_type == 0) {
        ids.push(OPERATOR_TAB.FORK)
      }
      ids.push(OPERATOR_TAB.INPUT, OPERATOR_TAB.OUTPUT)
      if (this.operation_enabled_return) {
        ids.push(OPERATOR_TAB.MANUAL)
      }
      if (this.operation_enabled_return && this.hasRobotArm) {
        ids.push(OPERATOR_TAB.ROBOT)
      }
      if (this.operation_enabled_return && this.isAMCAGV) {
        ids.push(OPERATOR_TAB.SENSOR)
      }
      if (this.isShowSaftyPLCIO) {
        ids.push(OPERATOR_TAB.SAFETY_PLC)
      }
      if (this.isGodMode && this.isUniversalAGV) {
        ids.push(OPERATOR_TAB.WHEELS)
      }
      return ids
    },
    currentTabIndex() {
      return resolveTabIndex(this.visibleOperatorTabIds, this.storeOperatorTabId, 0)
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
    isUniversalAGV() {
      return AGVStatusStore.getters.IsUniversalAGV
    },
    isRobotTabActive() {
      return UIStore.getters.mainTabId === MAIN_TAB.OPERATION
        && UIStore.getters.operatorTabId === OPERATOR_TAB.ROBOT
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

  .fork-side-tab-pane {
    flex: 1 1 auto;
    min-height: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .robot-tab-pane {
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
