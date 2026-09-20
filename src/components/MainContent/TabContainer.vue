<template>
  <!--主要內容 TabControl-->
  <div class="main-tab-container flex-fill mt-1">
    <b-tabs
      class="amr-main-tabs"
      :model-value="current_tab"
      @activate-tab="HandleTabpageChanged">
      <!-- 狀態 -->
      <b-tab :title="$t('status')" style="height: 100%;">
        <status_card :VMSData="VMSData"></status_card>
      </b-tab>
      <!--Alarm Table-->
      <b-tab :title="$t('abnormal-record')">
        <div class="table-container-div p-1">
          <alarm_warn_table></alarm_warn_table>
        </div>
      </b-tab>
      <!-- 操作 -->
      <b-tab :title="$t('operation')">
        <agv_operator :agv_type="VMSData.Agv_Type"></agv_operator>
      </b-tab>
      <!-- Battery -->
      <b-tab v-if="false" title="電池">
        <BatteryView></BatteryView>
      </b-tab>
      <b-tab :title="$t('eq-handshake-e84')">
        <EQHandshakeView></EQHandshakeView>
      </b-tab>
      <!-- 本地任務派送 -->
      <b-tab title="地圖顯示">
        <TaskDeliveryVue></TaskDeliveryVue>
      </b-tab>
      <!-- CST READER -->
      <b-tab v-if="!IsVisitor && IsCstIDReadable" title="CST Reader">
        <CSTReader></CSTReader>
      </b-tab>
      <b-tab v-if="!IsVisitor" title="Overview">
        <AgvOverview :AsMainPageMode="false"></AgvOverview>
      </b-tab>
      <b-tab v-if="IsGodMod" title="Log">
        <LogQuery></LogQuery>
      </b-tab>
      <!-- 3D Model Display -->
      <b-tab v-if="false" :title="$t('3d_model')">
        <ForkAGV3D></ForkAGV3D>
      </b-tab>
      <b-tab v-if="false" title="AGVS MSG">
        <AGVSMsgDisplay ref="agvs_msg_table"></AGVSMsgDisplay>
      </b-tab>
      <b-tab v-if="false" title="行車紀錄器">
        <CamDisplay ref="camDisplay"></CamDisplay>
      </b-tab>
    </b-tabs>
  </div>
</template>
<script>
import status_card from "@/components/StatusInfoCard.vue"
import alarm_warn_table from '@/components/AlarmWarningTable.vue'
import agv_operator from '@/components/Operator/AgvOperator.vue'
import ForkAGV3D from '@/components/3DModel/ForkAGV3DModel.vue'
import AGVSMsgDisplay from '@/components/AGVSMsgDisplay.vue'
import TaskDeliveryVue from '@/components/VMSTask/TaskDelivery.vue'
import CSTReader from '@/components/CSTReaderView.vue'
import EQHandshakeView from '@/components/E84/EQHandshakeView.vue'
import AgvOverview from '@/components/AGVStatusOverview.vue';
import BatteryView from "@/views/BatteryView.vue"
import VMSData from '@/ViewModels/VMSData.js';
import bus from '@/event-bus.js'
import { UserStore, UIStore, SystemSettingsStore } from '@/store'
import LogQuery from '@/components/Log/LogQuery.vue'
import { ROS_STORE } from "@/store/ros_store"
import CamDisplay from "@/Camera/CamDisplay.vue"

const TAB_STORAGE_KEY = 'main_content_tab'

function loadStoredTab(defaultVal = 0) {
  const raw = localStorage.getItem(TAB_STORAGE_KEY)
  if (raw == null) return defaultVal
  const n = parseInt(raw, 10)
  return Number.isNaN(n) || n < 0 ? defaultVal : n
}

export default {
  components: { status_card, alarm_warn_table, agv_operator, ForkAGV3D, AGVSMsgDisplay, TaskDeliveryVue, CSTReader, EQHandshakeView, AgvOverview, LogQuery, BatteryView, CamDisplay },
  props: {
    VMSData: {
      type: Object,
      required: true
    },
  },
  data() {
    return {
      current_tab: loadStoredTab(0)
    }
  },
  mounted() {
    this.ensureValidTab()
    this.applyTabSideEffects(this.current_tab)
    bus.on('on-fork-height-click', () => {
      this.setCurrentTab(2);
      this.applyTabSideEffects(2);
    });
    bus.on('on-manual-lsr-setting-show-invoke', () => {
      this.setCurrentTab(2);
      this.applyTabSideEffects(2);
    });
    bus.on('show-move-control', () => {
      this.setCurrentTab(2);
      this.applyTabSideEffects(2);
    });
    bus.on('show-manual-operation', () => {
      this.setCurrentTab(2);
      this.applyTabSideEffects(2);
    });
    bus.on('show-io-table', () => {
      this.setCurrentTab(2);
      this.applyTabSideEffects(2);
    });
    bus.on('show-status-page', () => {
      this.setCurrentTab(0);
      this.applyTabSideEffects(0);
    });
  },
  watch: {
    IsVisitor() {
      this.ensureValidTab()
    },
    IsGodMod() {
      this.ensureValidTab()
    }
  },
  methods: {
    setCurrentTab(tabIndex) {
      this.current_tab = tabIndex
      localStorage.setItem(TAB_STORAGE_KEY, String(tabIndex))
      UIStore.commit('SetCurrentTabSelected', tabIndex)
    },
    /** 權限不足導致先前 tab 不存在時，回到第一個可見 tab */
    ensureValidTab() {
      if (this.current_tab < 0 || this.current_tab > this.maxVisibleTabIndex) {
        this.setCurrentTab(0)
        this.applyTabSideEffects(0)
      }
    },
    applyTabSideEffects(currentTabs) {
      UIStore.commit('SetCurrentTabSelected', currentTabs)
      if (currentTabs == 1) {
        bus.emit('/alarmtable_tab_click')
      }
      if (currentTabs == 6) {
        bus.emit('local-task-view-shown')
      }
      ROS_STORE.dispatch('keyboard_move_enable', currentTabs == 2)
      if (currentTabs != 2) {
        ROS_STORE.dispatch('force_stop')
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
  computed: {
    /**
     * b-tabs 只計算實際渲染的 tab；v-if=false / 無權限的 tab 不佔 index。
     * 固定可見：狀態、異常、操作、E84、地圖 → 5 個 (index 0~4)
     */
    maxVisibleTabIndex() {
      let count = 5
      if (!this.IsVisitor) count += 2 // CST Reader, Overview
      if (this.IsGodMod) count += 1 // Log
      return count - 1
    },
    IsGodMod() {
      return UserStore.getters.IsGodUser
    },
    IsDevUser() {
      return UserStore.getters.IsDevUser
    },
    IsEngUser() {
      return UserStore.getters.IsEngUser;
    },
    IsVisitor() {
      return UserStore.getters.IsVisitor;
    },
    IsCstIDReadable() {
      return SystemSettingsStore.getters.IsCstIDReadable;
    }
  }
}
</script>
<style lang="scss" scoped>
.main-tab-container {
  --amr-tab-bg: #f5f5f5;
  --amr-tab-surface: #ffffff;
  --amr-tab-line: rgba(0, 0, 0, 0.12);
  --amr-tab-text: #111111;
  --amr-tab-muted: rgba(0, 0, 0, 0.48);
  --amr-tab-active: #111111;

  height: 100%;
  min-height: 0;
  min-width: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--amr-tab-surface);
  border: 1px solid var(--amr-tab-line);

  :deep(.tabs),
  :deep(.b-tabs),
  :deep(.amr-main-tabs) {
    flex: 1 1 auto;
    min-height: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  :deep(.nav) {
    flex-shrink: 0;
    flex-wrap: nowrap;
    gap: 0;
    margin: 0;
    padding: 0 8px;
    background: var(--amr-tab-bg);
    border-bottom: 1px solid var(--amr-tab-line);
    overflow-x: auto;
    overflow-y: hidden;
  }

  :deep(.nav-item) {
    margin: 0;
  }

  :deep(.nav-link) {
    position: relative;
    margin: 0;
    padding: 12px 16px;
    border: 0 !important;
    border-radius: 0 !important;
    background: transparent !important;
    color: var(--amr-tab-muted) !important;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    white-space: nowrap;
    transition: color 0.15s ease;

    &::after {
      content: "";
      position: absolute;
      left: 12px;
      right: 12px;
      bottom: 0;
      height: 2px;
      background: transparent;
      transition: background-color 0.15s ease;
    }

    &:hover {
      color: var(--amr-tab-text) !important;
    }

    &:active {
      color: var(--amr-tab-text) !important;
    }

    &.active {
      color: var(--amr-tab-text) !important;

      &::after {
        background: var(--amr-tab-active);
      }
    }
  }

  :deep(.tab-content) {
    flex: 1 1 auto;
    min-height: 0;
    height: 100%;
    overflow: hidden;
    background: var(--amr-tab-surface);
  }

  :deep(.tab-pane) {
    height: 100%;
  }
}
</style>
