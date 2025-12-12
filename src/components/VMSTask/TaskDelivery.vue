<template>
  <div class="task-delivery">
    <MapShowVue :task_allocatable="true" @OnFeatureClicked="MapFeatureClickedHandle" class="flex-fill h-100" ref="map">
    </MapShowVue>
    <el-drawer v-model="ShowTaskAllocateDrawer" direction="btt" :size="IsInspectAGV ? '45%' : '38%'"
      class="task-allocate-drawer">
      <template #header>
        <div class="drawer-header">
          <div class="station-info">
            <h2 class="station-title">{{ GetTitleText(SelectedFeature) }}</h2>
            <div v-if="SelectedFeatureIsVirtualPt" class="virtual-warning">
              <i class="bi bi-exclamation-triangle-fill"></i>
              <span>虛擬點不可為終點站</span>
            </div>
            <div class="coordination-info">
              <i class="bi bi-geo-alt"></i>
              <span>{{ SelectedFeatureCoordination }}</span>
            </div>
          </div>
        </div>
      </template>

      <div class="drawer-content">
        <!-- 層數選擇 (僅當 SelectedFeatureLDULDable 為真時顯示) -->
        <div v-if="SelectedFeatureLDULDable" class="floor-selector-section">
          <div class="floor-selector-compact">
            <span class="floor-label">層數:</span>
            <div class="floor-buttons-compact">
              <el-button v-for="floor in [0, 1, 2]" :key="floor" class="floor-btn-compact"
                :type="selectedFloor === floor ? 'primary' : 'default'"
                :class="{ 'floor-selected': selectedFloor === floor }" size="medium" @click="selectedFloor = floor">
                {{ getFloorText(floor) }}
              </el-button>
            </div>
          </div>
        </div>

        <!-- 操作按鈕區域 -->
        <div class="action-buttons-section">
          <div class="action-buttons-grid">
            <el-button class="action-btn" type="primary"
              :disabled="!SelectedFeatureMovable || SelectedFeatureIsVirtualPt"
              @click="handleTaskAllocatModeMenuClick('None')" size="large">
              <div class="btn-content">
                <i class="bi bi-arrows-move btn-icon"></i>
                <span class="btn-text">移動</span>
              </div>
            </el-button>

            <el-button class="action-btn" type="success" :disabled="!SelectedFeatureLDULDable"
              @click="handleTaskAllocatModeMenuClick('Load')" size="large">
              <div class="btn-content">
                <i class="bi bi-box-arrow-up-right btn-icon"></i>
                <span class="btn-text">放貨</span>
              </div>
            </el-button>

            <el-button class="action-btn" type="warning" :disabled="!SelectedFeatureLDULDable"
              @click="handleTaskAllocatModeMenuClick('Unload')" size="large">
              <div class="btn-content">
                <i class="bi bi-box-arrow-in-down-left btn-icon"></i>
                <span class="btn-text">取貨</span>
              </div>
            </el-button>

            <el-button v-if="!SelectedFeatureBatExchangable" class="action-btn" type="info"
              :disabled="!SelectedFeatureChargable" @click="handleTaskAllocatModeMenuClick('Charge')" size="large">
              <div class="btn-content">
                <i class="bi bi-battery-charging btn-icon"></i>
                <span class="btn-text">充電</span>
              </div>
            </el-button>

            <el-button v-if="SelectedFeatureBatExchangable" class="action-btn" type="info"
              :disabled="!SelectedFeatureBatExchangable" @click="handleTaskAllocatModeMenuClick('ExchangeBattery')"
              size="large">
              <div class="btn-content">
                <i class="bi bi-battery-charging btn-icon"></i>
                <span class="btn-text">交換電池</span>
              </div>
            </el-button>
          </div>
        </div>

        <!-- 定位按鈕 (僅檢查型AGV) -->
        <div v-if="IsInspectAGV" class="locating-section">
          <el-button class="locating-btn" type="primary" size="medium" @click="HandleLocatingBtnClick">
            <i class="bi bi-crosshair"></i>
            <span>定位</span>
          </el-button>
        </div>
      </div>
    </el-drawer>
    <MoveTestDrawer ref="move_test"></MoveTestDrawer>
    <b-modal @ok="TaskDeliveryHandle" v-model="confirm_dialog_show" :centered="true" title="Task Delivery"
      header-bg-variant="primary" header-text-variant="light">
      <p>
        <span>Action:{{ selectedAction }}</span>
      </p>
      <p>{{ $t('VMSTask.TaskDelivery.DDD') }}?</p>
    </b-modal>
    <b-modal v-model="notify_dialog_show" :centered="true" title="Warning" :ok-only="true" header-bg-variant="warning"
      header-text-variant="light">
      <p>
        <span>{{ notify_text }}</span>
      </p>
    </b-modal>
  </div>
</template>
<script>
import Notifier from '@/api/NotifyHelper';
import { NavigationAPI, InspectionAGVAPI } from '@/api/VMSAPI';
import MapShowVue from './MapShow.vue';
import { UserStore, AGVStatusStore } from '@/store';
import MoveTestDrawer from './MoveTestDrawer.vue'
import bus from '@/event-bus.js'
import { Feature } from 'ol';
import clsLocalization from '@/ViewModels/InspectionAGV/clsLocalization';
import axios_entity from '@/axios';
export default {
  components: {
    MapShowVue, MoveTestDrawer
  },
  data() {
    return {
      confirm_dialog_show: false,
      notify_dialog_show: false,
      ShowTaskAllocateDrawer: false,
      SelectedFeature: new Feature(), //從map 點選的feature物件
      notify_text: '',

      selectedAction: 'None', // 選擇的Action
      selectedTag: '', // 選擇的tag_id
      selectedCst: '', // 選擇的cst_id
      selectedToTag: '', // 選擇的to_tag
      selectedFloor: 0, // 選擇的層數 (0: 第一層, 1: 第二層, 2: 第三層)
      moveable_tags: [ // tag_id選項
        { id: 1, name: '標籤1' },
        { id: 2, name: '標籤2' },
        { id: 3, name: '標籤3' },
        { id: 4, name: '標籤4' },
        { id: 5, name: '標籤5' },
      ],
      parkable_tags: [ // tag_id選項
        { id: 1, name: '標籤1' },
        { id: 2, name: '標籤2' },
        { id: 3, name: '標籤3' },
        { id: 4, name: '標籤4' },
        { id: 5, name: '標籤5' },
      ],
      chargable_tags: [ // tag_id選項
        { id: 50, name: '充電站(TAG-50)' },
        { id: 70, name: '充電站(TAG-70)' },
      ],
      batExchangable_tags: [ // tag_id選項
        { id: 50, name: '充電站(TAG-50)' },
        { id: 70, name: '充電站(TAG-70)' },
      ],
      lduldable_tags: [ // tag_id選項
        { id: 50, name: '充電站(TAG-50)' },
        { id: 70, name: '充電站(TAG-70)' },
      ],
      csts: [ // cst_id選項
        { id: 1, name: '客戶1' },
        { id: 2, name: '客戶2' },
        { id: 3, name: '客戶3' },
        { id: 4, name: '客戶4' },
        { id: 5, name: '客戶5' },
      ],
    };
  },
  computed: {
    IsGodUse() {
      return UserStore.getters.IsGodUser;
    },
    IsInspectAGV() {
      return AGVStatusStore.getters.IsInspectionAGV;
    },
    From_Lable_display() {
      if (this.selectedAction === 'None' | this.selectedAction === 'Park')
        return "目的地"
      else return 'From'
    },
    tags() {
      if (this.selectedAction == 'None')
        return this.moveable_tags;

      else if (this.selectedAction == 'Charge')
        return this.chargable_tags;
      else
        return this.parkable_tags;
    },
    SelectedFeatureMovable() {
      if (!this.SelectedFeature)
        return false;
      this.GetNormalStationTagsFromMap();
      var l = this.moveable_tags.filter(i => i.id == this.SelectedFeature.getId())
      return l.length == 1;
    },
    SelectedFeatureCoordination() {
      if (!this.SelectedFeature)
        return ""
      var geom = this.SelectedFeature.getGeometry();
      if (!geom)
        return ""

      return geom.getCoordinates();
    },
    SelectedFeatureIsVirtualPt() {
      if (!this.SelectedFeature)
        return false;
      return this.SelectedFeature.get('isVirtual');
    },
    SelectedFeatureLDULDable() {
      if (!this.SelectedFeature)
        return false;
      this.GetLDULDStationTagsFromMap();
      var l = this.lduldable_tags.filter(i => i.id == this.SelectedFeature.getId())
      return l.length == 1;
    },
    SelectedFeatureChargable() {
      if (!this.SelectedFeature)
        return false;
      this.GetChargeStationTagsFromMap();
      var l = this.chargable_tags.filter(i => i.id == this.SelectedFeature.getId())
      return l.length == 1;
    },
    SelectedFeatureBatExchangable() {
      if (!this.SelectedFeature)
        return false;
      this.GetBatExchangerStationTagsFromMap();
      var l = this.batExchangable_tags.filter(i => i.id == this.SelectedFeature.getId())
      return l.length == 1;
    },
    ActionText() {
      if (this.selectedAction == 'None')
        return '移動';
      if (this.selectedAction == 'Charge')
        return '充電';
      if (this.selectedAction == 'Load')
        return '放貨';
      if (this.selectedAction == 'Unload')
        return '取貨';
      if (this.selectedAction == 'ExchangeBattery')
        return '電池交換';
    },
    MoveTestPanel() {
      return this.$refs['move_test']
    }
  },
  methods: {
    async HandleLocatingBtnClick() {
      var tag = this.SelectedFeature.getId();
      var coordinate = this.SelectedFeatureCoordination;
      var x = coordinate[0];
      var y = coordinate[1];
      var result = await InspectionAGVAPI.Localization(new clsLocalization(tag, x, y, -1))//{ Success = result.confirm, Message = result.message }

      if (result.Success) {
        this.$swal.fire(
          {
            title: '車輛定位',
            text: '定位完成!',
            icon: 'success',
            showCancelButton: false,
            confirmButtonText: 'OK',
            customClass: 'my-sweetalert'
          })
      } else {
        this.$swal.fire(
          {
            title: '車輛定位',
            text: `定位失敗:${result.Message}`,
            icon: 'error',
            showCancelButton: false,
            confirmButtonText: 'OK',
            customClass: 'my-sweetalert'
          })
      }

    },
    GetTitleText(feature) {
      if (!feature)
        return "";

      var _station_name = feature.get('name')
      var _tag = feature.getId()
      return `${_station_name} (Tag-${_tag})`
    },
    TaskDeliveryBtnClickHandle() {

      if (this.selectedAction == 'Carry' && (this.selectedToTag == '' | this.selectedToTag == undefined)) {
        this.notify_text = '尚未選擇目的地';
        this.notify_dialog_show = true;
        return;
      }
      if ((this.selectedAction == 'Carry' | this.selectedAction == 'Load' | this.selectedAction == 'Unload') && (this.selectedCst == '' | this.selectedCst == undefined)) {
        this.notify_text = '尚未選擇CST ID';
        this.notify_dialog_show = true;
        return;
      }
      this.confirm_dialog_show = true;
    },
    async TaskDeliveryHandle() {
      // 構建API參數，如果有層數需求則添加層數參數
      let apiParams = {
        action: this.selectedAction,
        from: this.selectedTag,
        to: this.selectedToTag,
        cst_id: this.selectedCst,
      };

      // 如果是LDULD操作，添加層數參數
      if (this.SelectedFeatureLDULDable && (this.selectedAction === 'Load' || this.selectedAction === 'Unload')) {
        apiParams.floor = this.selectedFloor;
      }

      // 調用API（需要修改NavigationAPI以支持額外參數，或使用擴展的URL）
      var response = await this.callNavigationAction(apiParams);
      console.info(response);
      if (response.accpet) {
        Notifier.Success("任務已派送");
        var tags = response.path.map(v => v.Point_ID);
        console.info(tags);
        this.$refs.map.UpdateNavPathRender(response.agv_name, tags);
        // 重置層數選擇
        this.selectedFloor = 0;
      }
      else {
        this.$swal.fire({
          title: '任務派送失敗',
          text: `${response.error_message}`,
          icon: 'error',
          showCancelButton: false,
          confirmButtonText: 'OK',
          customClass: 'my-sweetalert'
        })
      }
      //Notifier.Danger(`任務派送失敗:${response.error_message}`, "bottom", 5000);

    },
    GetNormalStationTagsFromMap() {
      var normal_stations = this.$refs['map'].GetNormalStations();
      function compare(a, b) {
        if (a.TagNumber < b.TagNumber) {
          return -1;
        }
        if (a.TagNumber > b.TagNumber) {
          return 1;
        }
        return 0;
      }
      normal_stations.sort(compare);
      this.moveable_tags = [];
      normal_stations.forEach(station => {

        this.moveable_tags.push({
          id: station.TagNumber,
          name: '(Normal)' + station.TagNumber
        });
      })

    },
    GetChargeStationTagsFromMap() {
      var charge_stations = this.$refs['map'].GetChargeStations();
      console.info(charge_stations);

      function compare(a, b) {
        if (a.TagNumber < b.TagNumber) {
          return -1;
        }
        if (a.TagNumber > b.TagNumber) {
          return 1;
        }
        return 0;
      }
      charge_stations.sort(compare);
      this.chargable_tags = [];
      charge_stations.forEach(station => {

        this.chargable_tags.push({
          id: station.TagNumber,
          name: '(Charge)' + station.TagNumber
        });
      })

    },
    GetBatExchangerStationTagsFromMap() {
      var batexchanger_stations = this.$refs['map'].GetBatExchangerStations();
      console.info(batexchanger_stations);

      function compare(a, b) {
        if (a.TagNumber < b.TagNumber) {
          return -1;
        }
        if (a.TagNumber > b.TagNumber) {
          return 1;
        }
        return 0;
      }
      batexchanger_stations.sort(compare);
      this.batExchangable_tags = [];
      batexchanger_stations.forEach(station => {

        this.batExchangable_tags.push({
          id: station.TagNumber,
          name: '(Bat_Exchange)' + station.TagNumber
        });
      })

    },
    GetLDULDStationTagsFromMap() {
      var lduld_stations = this.$refs['map'].GetSTKStations();
      function compare(a, b) {
        if (a.TagNumber < b.TagNumber) {
          return -1;
        }
        if (a.TagNumber > b.TagNumber) {
          return 1;
        }
        return 0;
      }
      lduld_stations.sort(compare);
      this.lduldable_tags = [];
      lduld_stations.forEach(station => {

        this.lduldable_tags.push({
          id: station.TagNumber,
          name: '(LDULD)' + station.TagNumber
        });
      })

    },
    getFloorText(floor) {
      const floorMap = {
        0: '第一層',
        1: '第二層',
        2: '第三層'
      };
      return floorMap[floor] || `第${floor}層`;
    },
    async callNavigationAction(params) {
      // 構建查詢字符串
      let queryString = `action=${params.action}&from=${params.from}&to=${params.to || ''}&cst_id=${params.cst_id || ''}`;

      // 如果有層數參數，添加到查詢字符串
      if (params.floor !== undefined) {
        queryString += `&floor=${params.floor}`;
      }

      // 直接調用API
      try {
        const ret = await axios_entity.get(`api/LocalNav/Action?${queryString}`);
        return ret.data;
      } catch (error) {
        console.error('Navigation API call failed:', error);
        // 如果直接調用失敗，回退到原來的NavigationAPI方法
        return await NavigationAPI.Action(
          params.action,
          params.from,
          params.to,
          params.cst_id
        );
      }
    },
    handleTaskAllocatModeMenuClick(action) {
      this.selectedAction = action;
      this.selectedToTag = this.SelectedFeature.getId();
      this.ShowTaskAllocateDrawer = false;

      // 構建確認訊息
      let confirmText = `確定要執行${this.ActionText} 任務? (Tag ${this.selectedToTag})`;
      if (this.SelectedFeatureLDULDable && (action === 'Load' || action === 'Unload')) {
        confirmText += `\n層數: ${this.getFloorText(this.selectedFloor)}`;
      }

      this.$swal.fire({
        title: `${this.$t('VMSTask.TaskDelivery.TaskDispatchConfirm')}`,
        text: confirmText,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: '確認',
        cancelButtonText: '取消',
        customClass: 'my-sweetalert'
      }).then(result => {
        if (result.isConfirmed) {
          this.TaskDeliveryHandle();
        }
      })

    },
    MapFeatureClickedHandle(feature) {
      if (feature.get('station_type')) {
        // this.SelectedFeature.get('data').IsVirtual
        this.SelectedFeature = feature
        if (this.SelectedFeature) {
          // 重置層數選擇
          this.selectedFloor = 0;
          this.ShowTaskAllocateDrawer = true;
        }
      }
    }
  },
  mounted() {
    this.moveable_tags = [];
    this.parkable_tags = [];
    for (let index = 43; index <= 71; index += 2) {
      this.moveable_tags.push({
        id: index,
        name: index
      });

    }
    for (let index = 42; index <= 80; index += 2) {
      this.parkable_tags.push({
        id: index,
        name: index
      });

    }
  },
};
</script>
<style scoped lang="scss">
.task-delivery {
  height: 100vh;
  position: relative;

  // Drawer 樣式
  :deep(.task-allocate-drawer) {
    .el-drawer__body {
      padding: 0;
      overflow-y: hidden;
      overflow-x: hidden;
    }
  }

  .drawer-header {
    padding: 12px 16px;
    text-align: left;
    // background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    // color: white;

    .station-info {
      .station-title {
        font-size: 18px;
        font-weight: 700;
        margin: 0 0 6px 0;
        // color: white;
      }

      .virtual-warning {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 8px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 6px;
        margin-bottom: 6px;
        font-size: 12px;
        font-weight: 500;

        i {
          font-size: 14px;
        }
      }

      .coordination-info {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        opacity: 0.9;

        i {
          font-size: 14px;
        }
      }
    }
  }

  .drawer-content {
    padding: 12px 16px;
    background: #f5f7fa;
    overflow-y: hidden;
  }

  // 區塊標題 (已移除，使用更緊湊的設計)
  .section-title {
    display: none;
  }

  // 層數選擇區域 - 扁平設計
  .floor-selector-section {
    background: white;
    border-radius: 8px;
    padding: 10px 12px;
    margin-bottom: 12px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);

    .floor-selector-compact {
      display: flex;
      align-items: center;
      gap: 12px;

      .floor-label {
        font-size: 14px;
        font-weight: 600;
        color: #606266;
        white-space: nowrap;
      }

      .floor-buttons-compact {
        display: flex;
        gap: 8px;
        flex: 1;

        .floor-btn-compact {
          flex: 1;
          height: 44px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s ease;
          border: 2px solid #dcdfe6;
          min-width: 0;

          &.floor-selected {
            border-color: #409eff;
            background: #409eff;
            color: white;
            box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
          }

          &:active {
            transform: scale(0.98);
          }
        }
      }
    }
  }

  // 操作按鈕區域
  .action-buttons-section {
    background: white;
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 12px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);

    .action-buttons-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      gap: 10px;

      .action-btn {
        height: 70px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        transition: all 0.2s ease;
        border: none;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);

        .btn-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          height: 100%;

          .btn-icon {
            font-size: 24px;
          }

          .btn-text {
            font-size: 13px;
            font-weight: 600;
          }
        }

        &:hover:not(:disabled) {
          transform: translateY(-4px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
        }

        &:active:not(:disabled) {
          transform: translateY(-2px);
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        // 不同類型的按鈕顏色
        &.el-button--primary {
          background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
          color: white;
        }

        &.el-button--success {
          background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
          color: white;
        }

        &.el-button--warning {
          background: linear-gradient(135deg, #e6a23c 0%, #ebb563 100%);
          color: white;
        }

        &.el-button--info {
          background: linear-gradient(135deg, #909399 0%, #a6a9ad 100%);
          color: white;
        }
      }
    }
  }

  // 定位按鈕區域
  .locating-section {
    background: white;
    border-radius: 8px;
    padding: 12px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);

    .locating-btn {
      width: 100%;
      height: 50px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
      border: none;
      box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
      transition: all 0.2s ease;

      i {
        font-size: 18px;
      }

      &:active {
        transform: scale(0.98);
      }
    }
  }

  // 響應式設計 - 觸控優化
  @media (max-width: 768px) {
    .drawer-content {
      padding: 10px 12px;
    }

    .drawer-header {
      padding: 10px 12px;
    }

    .floor-selector-section,
    .action-buttons-section,
    .locating-section {
      padding: 10px;
      margin-bottom: 10px;
    }

    .action-buttons-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;

      .action-btn {
        height: 65px;

        .btn-content {
          .btn-icon {
            font-size: 22px;
          }

          .btn-text {
            font-size: 12px;
          }
        }
      }
    }

    .floor-selector-compact {
      .floor-buttons-compact {
        .floor-btn-compact {
          height: 40px;
          font-size: 13px;
        }
      }
    }
  }

  // 觸控設備優化 - 確保按鈕足夠大
  @media (hover: none) and (pointer: coarse) {
    .action-btn {
      min-height: 50px;
      min-width: 80px;
      touch-action: manipulation;
    }

    .floor-btn-compact {
      min-height: 44px;
      min-width: 60px;
      touch-action: manipulation;
    }

    .locating-btn {
      min-height: 50px;
      touch-action: manipulation;
    }
  }
}
</style>