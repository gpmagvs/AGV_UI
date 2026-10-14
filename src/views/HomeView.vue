<template>
  <div class="home h-100">
    <div v-if="buildCstDataDialog.show">
      <el-dialog v-loading="buildCstDataDialog.loading" v-model="buildCstDataDialog.show" :modal="false" draggable
        title="貨物帳籍建立">
        <div class="d-flex my-2">
          <el-input :disabled="buildCstDataDialog.loading" ref="cargo_id_input" placeholder="在此輸入貨物ID"
            v-model="buildCstDataDialog.cargo_id" clearable size="large" @input="HandleCargoIDInputChanged"></el-input>
          <el-button :disabled="buildCstDataDialog.loading" class="mx-1" size="large" type="primary"
            @click="HandleCstIDBuildConfirm">確認</el-button>
          <el-button :disabled="buildCstDataDialog.loading" size="large" type="danger" @click="() => {
            buildCstDataDialog.show = false;
            buildCstDataDialog.cargo_id = ''
            HandleCargoIDInputChanged('')
          }">取消</el-button>
        </div>
        <div class="d-flex">
          <el-button class="mx-1" size="large" type @click="HandleUseReaderButClick(200)">使用 Tray READER</el-button>
          <el-button class="mx-1" size="large" type @click="HandleUseReaderButClick(201)">使用 Rack READER</el-button>
        </div>
        <SimpleKeyboard ref="cargoIdEditKeyboard" @onChange="HandleCargoIDKeyboardInput"></SimpleKeyboard>
      </el-dialog>
    </div>
    <!-- Top Header  -->
    <AGVHeader :IsBackendDisconnected="back_end_server_err"></AGVHeader>
    <div class="main-content">
      <div v-if="back_end_server_err" class="server-error py-1 border fixed-bottom">
        <div class="agv-name-in-alarm px-2">{{ VMSData.CarName }}</div>
        <i class="bi bi-exclamation-diamond"></i> {{ $t('backend_server_error') }}
      </div>
      <!-- 電量至頂顯示 -->
      <BatteryGroup :IsBackendDisconnected="back_end_server_err" :battery_states="VMSData.BatteryStatus"></BatteryGroup>
      <div class="d-flex flex-row h-100">
        <HomeSidePanel
          :back-end-server-err="back_end_server_err"
          @request-build-cargo="buildCstDataDialog.show = true"
        />
        <!--主要內容 TabControl-->
        <div class="d-flex flex-column main-column" style="flex: 1 1 0; min-width: 0">
          <MainContent class="flex-fill" :VMSData="VMSData"></MainContent>
          <div class="app-bottom-footer border rounded bg-light py-1 px-2 fixed-bottom">
            <QuickActions></QuickActions>
          </div>
        </div>
        <div v-if="showOrderInfo && IsShowOrderStatus && !IsHandshaking" style="z-index:9999"
          v-bind:style="orderInfoContinerStyle">
          <el-alert id="order-go-alert" :class="order_info_title_class" show-icon
            :type="VMSData.MainState == 'DOWN' ? 'error' : 'success'" :title="`派車系統任務-[${GetActionName}]`"
            :description="GetOrderDescription" :closable="false"></el-alert>
        </div>

        <HostMessageDisplay class="host-message-display-home-view">
        </HostMessageDisplay>
      </div>
    </div>
    <div v-if="IsLDULD_NO_Entry_Actived" class="w-100 bg-warning fixed-bottom p-2">
      <span class="text-danger" style="font-weight:bold">空取空放模式運行中</span>
      <b-button variant="danger" size="sm" @click="HandleCloseLDULD_No_Entry_BtnClick">關閉</b-button>
    </div>
  </div>
</template>
<script>
import AGVHeader from '@/components/AGVHeader.vue'
import battery from '@/components/Battery/Battery.vue'
import BatteryGroup from '@/components/Battery/BatteryGroup.vue'
import HomeSidePanel from '@/components/HomeSidePanel.vue'
import { CloseLDULD_No_Entry, TriggerCSTReaderWithCargoType, BuildCargoID } from '@/api/VMSAPI'
import bus from '@/event-bus.js'
import Notifier from "@/api/NotifyHelper.js"
import { ElNotification } from 'element-plus'
import { AGVStatusStore, UIStore } from '@/store'
import { MAIN_TAB } from '@/constants/tabPages'
import moment from 'moment'
import MainContent from '@/components/MainContent/TabContainer.vue'
import { watch } from 'vue'
import SimpleKeyboard from '@/components/Tools/SimpleKeyboard.vue';
import QuickActions from '@/components/MainContent/QuicklyActions.vue'
// @ is an alias to /src
export default {
  name: 'HomeView',
  components: {
    AGVHeader, BatteryGroup, battery, MainContent, SimpleKeyboard, QuickActions, HomeSidePanel
  },
  data() {
    return {
      IsUseChinese: true,
      time: '2022/12/12 19:00:09',
      version_text_click_count: 0,
      trigger_admin_dialog_count: 7,
      back_end_server_err: false,
      back_end_server_connecting: false,
      loading: false,
      dialogTableVisible: false,
      remove_CstData_ComfirmDialog_Show: false,
      ShowOnlineFailDialog: false,
      moduleInformation: {},
      server_err_state_text: '連線中...',
      currentTabs: 0,
      previous_tagID: -99,
      ws: null,
      previousAGVPoseIsError: false,
      ShowAGVPoseErrorModel: false,
      header_show: false,
      showOrderInfo: false,
      buildCstDataDialog: {
        show: false,
        cargo_id: '',
        loading: false
      }
    }
  },
  methods: {
    HandleCargoIDInputChanged(_input) {
      this.$refs['cargoIdEditKeyboard'].setInput(_input);
    },
    HandleCargoIDKeyboardInput(_input) {
      this.buildCstDataDialog.cargo_id = _input;
      setTimeout(() => {
        this.$refs['cargo_id_input'].focus();
      }, 100);
    },
    async HandleCstIDBuildConfirm() {
      var response = await BuildCargoID(this.buildCstDataDialog.cargo_id);
      if (response.confirm) {
        this.$swal.fire(
          {
            title: '貨物帳籍修改成功',
            text: '',
            icon: 'success',
            showCancelButton: false,
            confirmButtonText: 'OK',
            customClass: 'my-sweetalert'
          })
      } else {
        this.$swal.fire(
          {
            title: '貨物帳籍修改失敗',
            text: response.message,
            icon: 'error',
            showCancelButton: false,
            confirmButtonText: 'OK',
            customClass: 'my-sweetalert'
          })
      }
    },
    async HandleUseReaderButClick(cst_type) {
      this.buildCstDataDialog.loading = true;
      setTimeout(async () => {
        var barcode = await TriggerCSTReaderWithCargoType(cst_type);
        if (barcode != 'Network Error' && barcode.toUpperCase() != 'ERROR') {
          this.buildCstDataDialog.cargo_id = barcode;
          this.HandleCargoIDInputChanged(barcode);
        } else {
          this.$swal.fire(
            {
              title: 'CST ID　讀取失敗',
              text: '',
              icon: 'error',
              showCancelButton: false,
              confirmButtonText: 'OK',
              customClass: 'my-sweetalert'
            })
        }
        this.buildCstDataDialog.loading = false;
      }, 100);
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
    MapDataPublishOut() {
      bus.emit('/agv_name_list', [{
        AGV_Name: this.VMSData.CarName,
        Current_Tag: this.VMSData.Tag,
        State: this.VMSData.MainState,
        IsOnline: this.VMSData.OnlineMode == 1,
      }])
    },
    async HandleCloseLDULD_No_Entry_BtnClick() {
      await CloseLDULD_No_Entry()
      Notifier.Success(`空取空放功能已關閉`, 'bottom', 1500);

    },
  },
  computed: {
    VMSData() {
      return AGVStatusStore.getters.AGVStatus;
    },
    IsShowOrderStatus() {
      return this.OrderInfo.ActionName != 999;
    },
    IsLDULD_NO_Entry_Actived() {
      return this.VMSData.IsLDULD_No_Entry
    },
    /**
     *  DestineName ,
  SourceName,
  ActionName */
    OrderInfo() {
      return this.VMSData.OrderInfo;
    },
    GetOrderDescription() {
      return this.OrderInfo.DisplayText;
    },
    GetActionName() {
      switch (this.OrderInfo.ActionName) {
        case 0:
          return '移動'
        case 1:
          return '取貨'
        case 2:
          return '放貨/停車'
        case 3:
          return '放貨/停車'
        case 6:
          return '量測'
        case 7:
          return '放貨'
        case 8:
          return '充電'
        case 9:
          return '搬運'
        case 10:
          return '退出充電站'
        case 12:
          return '停車'
        case 13:
          return '退出停車點'
        case 14:
          return '交換電池'
        default:
          return `Unknown(${this.ActionName})`
      }
    },
    order_info_title_class() {
      if (this.VMSData.MainState == 'DOWN') {
        return "order-info-title-error"
      } else
        return "order-info-title-normal"
    },
    orderInfoContinerStyle() {
      //position:absolute;right: 9px;bottom: 0;
      var isAlarmShow = AGVStatusStore.getters.AlarmCodes.length > 0;
      var isHomeViewShow = UIStore.getters.mainTabId === MAIN_TAB.STATUS;
      if (isAlarmShow) {
        return {
          position: 'absolute',
          right: '9px',
          top: '73px'
        }
      } else
        return {
          position: 'absolute',
          right: '9px',
          bottom: '0'
        }
    },
    IsHandshaking() {
      return AGVStatusStore.getters.AGVStatus.HandshakeStatus.IsHandshaking
    },

  },
  mounted() {

    setInterval(() => {
      this.time = moment(Date.now()).format('yyyy/MM/DD HH:mm:ss');

    }, 1000);
    setInterval(() => {
      bus.emit('/agv_position', {
        AGV_Name: this.VMSData.CarName,
        Current_Tag: this.VMSData.Tag,
        Rotation: 0,
        Current_Tag: this.VMSData.Tag,
        State: this.VMSData.MainState,
        IsOnline: this.VMSData.OnlineMode == 1,
        Coordination: [this.VMSData.Pose.position.x, this.VMSData.Pose.position.y]
      })

    }, 200);

    setTimeout(() => {
      this.header_show = true;
      var handlerDataChanged = () => {
        this.back_end_server_err = false;
        this.back_end_server_connecting = false;
        if (this.VMSData.Tag > 0) {
          //this.MapDataPublishOut();
          if (this.VMSData.Tag != this.previous_tagID) {
            Notifier.Primary(`Tag Detected:${this.VMSData.Tag}`, 'top', 800);
          }
        }
        this.previous_tagID = this.VMSData.Tag;
        this.AGVPoseErrorHandler();
        this.BusPublishDataOut();
      }
      watch(() => this.VMSData, (new_data, old_data) => {
        if (!new_data)
          return;
        handlerDataChanged();
      }, {
        immediate: true,
        deep: true,
      })
      bus.on('ws_disconnect', () => {
        this.back_end_server_err = true;
        this.back_end_server_connecting = true;
      })
      bus.on('local-task-view-shown', () => {
        handlerDataChanged();
      })
    }, 100);


  },
  destroyed() {
    alert('destroy')
    if (this.ws) {
      this.ws.Close();
    }
  }
}
</script>
<style lang="scss">
:root {
  --side-menu-width: 250px;
  /* 主頁底部 QuickActions fixed footer；內容區與表格高度計算需預留 */
  --app-bottom-footer-height: 38px;
}

.app-bottom-footer {
  height: var(--app-bottom-footer-height);
  z-index: 1030;
}

.main-content {
  padding-top: 38px;
  height: 100%;
  width: 100%;
}

.main-content>.d-flex.flex-row {
  width: 100%;
}

.host-message-display-home-view {
  position: fixed !important;
  top: 32vh !important;
  left: 0 !important;
  width: 100% !important;
  height: 36vh !important;
  z-index: 10000;
  box-sizing: border-box;
}

.host-message-display-home-view.is-apocalypse {
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  z-index: 100000 !important;
}

#waiting-go-alert {
  .el-alert__title {
    font-size: 25px;
    position: relative;
    left: -2rem;
  }

  .el-alert__description {
    font-size: 32px;
    position: relative;
    color: rgb(13, 110, 253);
    font-weight: bold;
  }

  .el-alert__icon {
    font-size: 60px;
    width: 60px;
  }
}

#order-go-alert {
  .el-alert__title {
    font-size: 25px;
    position: relative;
    left: 1rem;
    letter-spacing: 2px;
    font-weight: bold;
  }

  .el-alert__description {
    font-size: 32px;
    position: relative;
    color: rgb(41, 99, 187);
  }

  .el-alert__icon {
    font-size: 40px;
    width: 40px;
  }
}

.order-info-title-normal {
  .el-alert__title {
    color: seagreen;
  }
}

.order-info-title-error {
  .el-alert__title {
    color: red;
  }
}

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
  height: 50px;
  font-size: 25px;
  animation: server-errorcolor-change 2s infinite;
  letter-spacing: 0.4rem;
  font-weight: bold;
}

@keyframes server-errorcolor-change {

  0%,
  100% {
    background-color: red;
    color: white;
  }

  50% {
    background-color: rgb(255, 255, 255);
    color: red;
  }
}

.has-id-but-cargo-not-exist {
  animation: remove-cst-btn-flicker 1s infinite;
}

@keyframes remove-cst-btn-flicker {

  0%,
  100% {
    background-color: #f8f9fa;
    color: black;
  }

  50% {
    background-color: rgb(255, 193, 22);
    color: rgb(255, 49, 49);
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

.alarm-show {
  background-color: rgb(248, 215, 218);
  font-weight: bold;
  color: white;
}

.agv-name-in-alarm {
  font-weight: bold;
  position: absolute;
}

</style>
