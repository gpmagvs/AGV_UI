<template>
  <!--主要內容 TabControl-->
  <div class="flex-fill border mt-1 p-1">
    <b-tabs pills @activate-tab="TabChangedHandler">
      <!-- 狀態 -->
      <b-tab :title="$t('status')" active>
        <div class="mt-3 border p-1">
          <status_card></status_card>
        </div>
      </b-tab>
      <!--Alarm Table-->
      <b-tab :title="$t('abnormal-record')">
        <div class="mt-3 border p-1">
          <alarm_warn_table></alarm_warn_table>
        </div>
      </b-tab>
      <!-- 操作 -->
      <b-tab :title="$t('operation')">
        <div class="mt-3 border p-1">
          <agv_operator :agv_type="VMSData.Agv_Type"></agv_operator>
        </div>
      </b-tab>
      <!-- 3D Model Display -->
      <b-tab v-if="IsGodMod" :title="$t('3d_model')">
        <div class="mt-3 border p-1">
          <ForkAGV3D></ForkAGV3D>
        </div>
      </b-tab>
      <!-- CST READER -->
      <b-tab v-if="VMSData.Agv_Type!=2" title="CST Reader">
        <div class="mt-3 border p-1">
          <CSTReader></CSTReader>
        </div>
      </b-tab>
      <b-tab v-if="true" title="設備交握(E84)">
        <div class="mt-3 border p-1">
          <EQHandshakeView></EQHandshakeView>
        </div>
      </b-tab>
      <!-- 本地任務派送 -->
      <b-tab v-if="IsGodMod|IsDevUser" title="Task">
        <div class="mt-3 border p-1">
          <TaskDeliveryVue></TaskDeliveryVue>
        </div>
      </b-tab>

      <b-tab v-if="false" title="AGVS MSG">
        <div class="mt-3 border p-1">
          <AGVSMsgDisplay ref="agvs_msg_table"></AGVSMsgDisplay>
        </div>
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
import Notifier from "@/api/NotifyHelper.js"
import VMSData from '@/ViewModels/VMSData.js';
import bus from '@/event-bus.js'
import { UserStore } from '@/store'
import EQHandshakeViewVue from '../E84/EQHandshakeView.vue'
export default {
  components: { status_card, alarm_warn_table, agv_operator, ForkAGV3D, AGVSMsgDisplay, TaskDeliveryVue, CSTReader, EQHandshakeView },
  props: {
    VMSData: {
      type: Object,
      default() {
        return new VMSData();
      }
    },
  },
  data() {
    return {
    }
  },
  methods: {
    TabChangedHandler(currentTabs, previousTabs) {
      this.currentTabs = currentTabs;
      if (currentTabs == previousTabs)
        return;
      if (currentTabs == 1) {
        bus.emit('/alarmtable_tab_click')
      }
      this.$emit('OnTabChanged', this.currentTabs);
    },
  },
  computed: {
    IsGodMod() {
      return UserStore.getters.IsGodUser
    },
    IsDevUser() {
      return UserStore.getters.IsDevUser
    }
  }
}
</script>

<style lang="scss">
</style>