<template>
  <div class="z-axis-control  p-1">
    <div v-show="!enabled" class="disable-notify text-start my-2">{{ $t('zaxis_control_notify_text') }}</div>
    <!-- <div class="d-flex" v-loading="!enabled" :element-loading-spinner="false"> -->
    <div class="d-flex flex-column" v-loading="!enabled" :element-loading-spinner="false"
      :element-loading-background="enabled ? 'rgba(0,0,0,0)' : 'rgba(202,202,202,0.4)'">
      <!-- <el-divider direction="vertical"></el-divider> -->
      <div class="control-buttons mx-2" v-for="ctlData in controlableMap" :key="ctlData.name">
        <el-tag effect="dark" class="my-2 w-100 text-start"> {{ ctlData.label }}</el-tag>
        <div class="d-flex flex-row my-2 justify-content-between align-items-center border rounded p-2">
          <!-- Position -->
          <div class="d-flex align-items-center mx-2">
            <div class="mx-2">Position</div>
            <el-input-number v-if="ctlData.name == 'Vertical'" class="px-1 position-input" center :precision="2"
              v-model="ForkHeight" :controls="false" size="small" :step="0.01" disabled></el-input-number>
            <el-input-number v-else class="px-1 position-input" center :precision="2" v-model="HorizonForkPosition"
              :controls="false" size="small" :step="0.01" disabled></el-input-number>
            <div class="d-flex  gap-2 align-items-center bg-light p-1">
              <span>State:</span> <el-tag effect="dark"> {{ GetDriverState(ctlData.name).state }} </el-tag>
              <span>ECode:</span> <el-tag effect="dark"> {{ GetDriverState(ctlData.name).errorCode }}</el-tag>
            </div>
          </div>
          <!-- 極限Sensor Bypass/教點按鈕 -->
          <div v-if="ctlData.name == 'Vertical'" class="d-flex flex-fill justify-content-end">
            <div class="d-flex flex-row align-items-center mx-1">
              <div class="mx-2">安全防護</div>
              <el-switch :inline-prompt="true" v-model="verticalActionSafetyProtection" active-text="開"
                inactive-text="關" inactive-color="#ff4949" />
            </div>
            <!-- 教點按鈕 -->
            <el-button type="primary" @click="ShowTeachView">牙叉位置校點</el-button>
          </div>
          <el-button :loading="isFindHomeProcessing(ctlData.name)"
            :disabled="IsAGVRunning || isFindHomeProcessing(ctlData.name)" class="mx-2" type="info"
            @click="FindHomeAction(ctlData.name)">尋原點動作</el-button>

        </div>
        <div class="d-flex w-100">
          <!-- 控制按鈕 -->
          <div class="action-buttions-container w-100"
            v-bind:class="ctlData.name == 'Horizon' ? 'd-flex flex-row flex-row-reverse' : ''">
            <b-button :disabled="(!enabled || IsActing(ctlData.name))" class="w-100 border mb-1" variant="light"
              @click="ForkAction(ctlData.name, 'up_limit')" block>
              <i class="bi bi-chevron-bar-up"></i>{{ ctlData.uplimit }} </b-button>
            <b-button :disabled="ctlData.name == 'Horizon' || (!enabled || isZAxisMoving)"
              @click="ForkAction(ctlData.name, 'up')" class="w-100 border mb-1" variant="light" block>
              <i class="bi bi-chevron-up"></i>{{ ctlData.up }} </b-button>
            <b-button :disabled="(!enabled || IsActing(ctlData.name))" @click="ForkAction(ctlData.name, 'home')"
              class="w-100 border mb-1" variant="light" block>
              <i style="color:rgb(0, 123, 255)" class="bi bi-house-fill"></i>{{ ctlData.home }} </b-button>
            <b-button @click="ForkAction(ctlData.name, 'stop')" class="w-100 border mb-1" variant="light" block>
              <i style="color:rgb(255, 61, 80)" class="bi bi-stop-circle-fill"></i>{{ ctlData.stop }} </b-button>
            <b-button :disabled="ctlData.name == 'Horizon' || (!enabled || IsActing(ctlData.name))"
              @click="ForkAction(ctlData.name, 'down')" class="w-100 border mb-1" variant="light" block>
              <i class="bi bi-chevron-down"></i>{{ ctlData.down }} </b-button>
            <b-button :disabled="(!enabled || IsActing(ctlData.name))" class="w-100 border mb-1" variant="light"
              @click="ForkAction(ctlData.name, 'down_limit')" block>
              <i class="bi bi-chevron-bar-down"></i>{{ ctlData.downlimit }} </b-button>
          </div>
          <!-- 控制按鈕 Group2 -->
          <div v-if="ctlData.name == 'Vertical'" class="w-100 mx-2">
            <b-button :disabled="(!enabled || IsActing(ctlData.name))" class="w-100 border mb-1" variant="light"
              @click="ForkAction(ctlData.name, 'up_search')" block>
              <i class="bi bi-chevron-bar-up"></i>上升搜尋 </b-button>
            <b-button :disabled="(!enabled || IsActing(ctlData.name))" class="w-100 border mb-1" variant="light"
              @click="ForkAction(ctlData.name, 'down_search')" block>
              <i class="bi bi-chevron-bar-down"></i>下降搜尋 </b-button>
            <el-divider></el-divider>
            <!-- 極限Sensor Bypass -->
            <div class="d-flex flex-row justify-content-end align-items-center mx-1">
              <div class="mx-2 text-danger">極限 Bypass</div>
              <el-tag v-if="Vertical_Hardware_limit_bypass" effect="dark" type="danger" size="large"
                @click="ControlHardwareLimitSensor(true)">Bypass</el-tag>
              <el-tag v-else effect="dark" type="success" size="large"
                @click="ControlHardwareLimitSensor(false)">No-Bypass</el-tag>
            </div>
            <div class="my-2 d-flex flex-row justify-content-end align-items-center mx-1">
              <div class="mx-2 text-danger">下壓 SensorBypass</div>
              <el-tag v-if="Vertical_Under_Pressing_Sensor_Bypass" effect="dark" type="danger" size="large"
                @click="ControlUnderPressingSensorBypass(true)">Bypass</el-tag>
              <el-tag v-else effect="dark" type="success" size="large"
                @click="ControlUnderPressingSensorBypass(false)">No-Bypass</el-tag>
            </div>
          </div>
          <!-- Sensor狀態 -->
          <div class="sensors-states-container d-flex flex-column justify-content-end mx-2">
            <div class="d-flex flex-row my-1">
              <div class="sensor-label-item">{{ ctlData.name == 'Vertical' ? '上極限' : '伸出極限' }}</div>
              <el-tag :type="ctlData.sensors_states.upLimit ? 'success' : ''" size="large" effect="dark">{{
                ctlData.sensors_states.upLimit ? 'ON' : 'OFF' }}</el-tag>
            </div>
            <div class="d-flex flex-row my-1">
              <div class="sensor-label-item">Home</div>
              <el-tag :type="ctlData.sensors_states.home ? 'success' : 'danger'" size="large" effect="dark">{{
                ctlData.sensors_states.home ? 'ON' : 'OFF' }}</el-tag>
            </div>
            <div class="d-flex flex-row my-1">
              <div class="sensor-label-item">{{ ctlData.name == 'Vertical' ? '下極限' : '縮回極限' }}</div>
              <el-tag :type="ctlData.sensors_states.downLimit ? 'success' : ''" size="large" effect="dark">{{
                ctlData.sensors_states.downLimit ? 'ON' : 'OFF' }}</el-tag>
            </div>
          </div>
        </div>
      </div>
    </div>
    <el-drawer v-model="show_teach_page" direction="btt" size="90%" @close="TeachDrawerClosingHandle"
      title="FORK TEACH">
      <forkTeachEditor ref="fork_teach"></forkTeachEditor>
    </el-drawer>
  </div>
</template>
<script>
import { ForkAPI } from '@/api/VMSAPI';
import { AGVStatusStore, ForkTeachStore, UserStore, DIOStore } from '@/store'
import AdminFork from '@/components/Admin/AdminFork.vue'
import forkTeachEditor from './WorkStation/ForkTeachEditor.vue'
import bus from '@/event-bus';
import { ElMessage } from 'element-plus';
export default {
  components: {
    AdminFork, forkTeachEditor
  },
  props: {

  },
  data() {
    return {
      isZAxisMoving: false,
      isHorizonMoving: false,
      show_teach_page: false,
      hardware_limit_enable: true,
      verticalActionSafetyProtection: true,
      horizonActionSafetyProtection: true,
      isVerticalFindHomeProcessing: false,
      isHorizonFindHomeProcessing: false
    }
  },
  watch: {
    Vertical_Hardware_limit_bypass(newValue) {
      this.$notify({
        message: `牙叉極限Sensor ${newValue ? '已經Bypass' : '作用中'}`,
        type: newValue ? 'error' : 'success',
        duration: 1000 // 持續時間，單位為毫秒
      })
    }
  },
  computed: {
    ForkHeight() {
      return AGVStatusStore.getters.ForkHeight
    },
    HorizonForkPosition() {
      return AGVStatusStore.state.AGVStatus.ForkHorizonDriverState.position;
    },
    VerticalDriverState() {
      return AGVStatusStore.state.AGVStatus.ZAxisDriverState;
    },
    HorizonDriverState() {
      return AGVStatusStore.state.AGVStatus.ForkHorizonDriverState;
    },
    IsUserLogin() {
      return UserStore.getters.CurrentUserRole != 0;
    },
    IsGodUser() {
      return UserStore.getters.IsGodUser;
    },
    IsAGVRunning() {
      return AGVStatusStore.state.AGVStatus.SubState == 'RUN';
    },
    IsAuto() {
      return AGVStatusStore.getters.IsAuto;
    },
    IsOnline() {
      return AGVStatusStore.getters.IsOnline;
    },
    enabled() {
      if (this.IsGodUser)
        return true;
      return (this.IsUserLogin && !this.IsAuto && !this.IsOnline)
    },
    Vertical_Hardware_limit_bypass() {
      return DIOStore.getters.Vertical_Hardware_limit_bypass;
    },
    Vertical_Under_Pressing_Sensor_Bypass() {
      return DIOStore.getters.Vertical_Under_Pressing_Sensor_Bypass;
    },
    Vertical_Up_Limit_Sensor_On() {
      return DIOStore.getters.ZAxisUplimitSensorState;
    },
    Vertical_Down_Limit_Sensor_On() {
      return DIOStore.getters.ZAxisDownlimitSensorState;
    },
    Vertical_Home_Pose_Sensor_On() {
      return DIOStore.getters.ZAxisHomePoseSensorState;
    },
    Horizon_Up_Limit_Sensor_On() {
      return DIOStore.getters.ForkHorizonExtendSensorState;
    },
    Horizon_Down_Limit_Sensor_On() {
      return DIOStore.getters.ForkHorizonShortedSensorState;
    },
    Horizon_Home_Pose_Sensor_On() {
      return DIOStore.getters.ForkHorizonHomePoseSensorState;
    },
    IsHorizonDriverBase() {
      return AGVStatusStore.state.AGVStatus.IsForkExtenrDriverBase;
    },
    controlableMap() {
      var verticalControlButtonsSet = {
        name: 'Vertical',
        label: '升降',
        uplimit: '上點位',
        up: '上升',
        home: '原點',
        stop: '停止',
        down: '下降',
        downlimit: '下點位',
        sensors_states: {
          upLimit: this.Vertical_Up_Limit_Sensor_On,
          home: this.Vertical_Home_Pose_Sensor_On,
          downLimit: this.Vertical_Down_Limit_Sensor_On
        },
      }
      var horizonControlButtonsSet = {
        name: 'Horizon',
        label: '伸縮',
        uplimit: '伸出',
        up: '伸出吋動',
        home: '原點',
        stop: '停止',
        down: '縮回吋動',
        downlimit: '縮回',
        sensors_states: {
          upLimit: false,
          home: false,
          downLimit: false
        },
        sensors_states: {
          upLimit: this.Horizon_Up_Limit_Sensor_On,
          home: this.Horizon_Home_Pose_Sensor_On,
          downLimit: this.Horizon_Down_Limit_Sensor_On
        },
      }
      if (this.IsHorizonDriverBase) {
        return [verticalControlButtonsSet, horizonControlButtonsSet]
      } else {
        return [verticalControlButtonsSet];
      }
    }
  },
  methods: {
    isFindHomeProcessing(name) {
      if (name == 'Vertical') {
        return this.isVerticalFindHomeProcessing;
      } else {
        return this.isHorizonFindHomeProcessing;
      }
    },
    async ForkAction(dir, action, pose = 0, speed = 0) {

      const isVertical = dir == 'Vertical';
      var canceled = false;
      if (isVertical && (action != 'home' && action != 'stop' && this.Vertical_Hardware_limit_bypass)) {
        await this.$swal.fire(
          {
            title: `極限Sensor目前為Bypass狀態，確定要進行[${action}]動作?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'OK',
            customClass: 'my-sweetalert'
          }).then(res => {
            canceled = !res.isConfirmed
          })
      }
      if (canceled)
        return;
      this.SetActing(dir, true)
      var ret = await ForkAPI.Action(dir, action, pose, speed, dir == 'Vertical' ? this.verticalActionSafetyProtection : this.horizonActionSafetyProtection);
      this.SetActing(dir, false)
      if (!ret.confirm) {
        this.$swal.fire({
          text: ret.message,
          icon: 'error',
          title: '禁止操作'
        })
      }
    },
    ControlHardwareLimitSensor(active) {
      if (!active) {
        this.$swal.fire(
          {
            title: '確定要將Z軸極限Sensor Bypass?',
            text: '',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'OK',
            cancelButtonText: '取消',
            customClass: 'my-sweetalert'
          }).then(res => {
            if (!res.isConfirmed)
              return;
            DIOStore.dispatch('ControlHardwareLimiSensor', true)

          })
      } else
        DIOStore.dispatch('ControlHardwareLimiSensor', !active)
    },
    ControlUnderPressingSensorBypass(active) {
      if (!active) {
        this.$swal.fire(
          {
            title: '確定要將下壓Sensor Bypass?',
            text: '',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'OK',
            cancelButtonText: '取消',
            customClass: 'my-sweetalert'
          }).then(res => {
            if (!res.isConfirmed)
              return;
            DIOStore.dispatch('ControlUnderPressingSensorBypass', true)

          })
      } else
        DIOStore.dispatch('ControlUnderPressingSensorBypass', !active)
    },
    ShowTeachView() {
      if (this.$refs['fork_teach'])
        this.$refs['fork_teach'].reload();
      this.show_teach_page = true;
    },
    TeachDrawerClosingHandle() {
      if (ForkTeachStore.getters.IsAnyChanged) {
        this.$swal.fire({
          icon: 'warning',
          text: '教點資料已修改但尚未儲存，確定要離開?',
          showConfirmButton: true,
          showCancelButton: true
        }).then(user_response => {
          if (!user_response.isConfirmed) {
            this.show_teach_page = true
          }
          else {
          }
        })
      }
    },
    IsActing(name) {
      if (name == 'Vertical')
        return this.isZAxisMoving;
      else
        return this.isHorizonMoving;
    },
    SetActing(name, isActing) {
      if (name == 'Vertical')
        return this.isZAxisMoving = isActing;
      else
        return this.isHorizonMoving = isActing;
    },
    GetDriverState(name) {
      if (name == 'Vertical')
        return this.VerticalDriverState;
      else
        return this.HorizonDriverState;
    },
    async FindHomeAction(name) {
      const action_name = name == 'Vertical' ? 'Z軸' : '伸縮牙叉';
      this.$swal.fire({
        title: `確定要進行[${action_name}]尋原點動作?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'OK',
        cancelButtonText: '取消',
        customClass: 'my-sweetalert'
      }).then(async res => {
        if (!res.isConfirmed) {
          ElMessage.warning('取消尋原點動作');
          return;
        }

        if (this.IsAuto) {
          this.$swal.fire({
            title: '自動模式下無法手動進行尋原點動作，請先將模式變更為手動模式',
            icon: 'warning',
            showCancelButton: false,
            confirmButtonText: 'OK',
            customClass: 'my-sweetalert'
          })
          return;
        }
        if (this.IsOnline) {
          this.$swal.fire({
            title: 'ONLINE 狀態下無法手動進行尋原點動作，請先將模式變更為 OFFLINE',
            icon: 'warning',
            showCancelButton: false,
            confirmButtonText: 'OK',
            customClass: 'my-sweetalert'
          })
          return;
        }
        if (name == 'Vertical') {
          this.isVerticalFindHomeProcessing = true;
        } else {
          this.isHorizonFindHomeProcessing = true;
        }
        var ret = await ForkAPI.FindHome(name);
        if (name == 'Vertical') {
          this.isVerticalFindHomeProcessing = false;
        } else {
          this.isHorizonFindHomeProcessing = false;
        }
        if (!ret.success) {
          this.$swal.fire({
            title: `[${action_name}] 尋原點動作失敗: ${ret.alarm}`,
            icon: 'error',
            showCancelButton: false,
            confirmButtonText: 'OK',
            customClass: 'my-sweetalert'
          })
          return;
        }
        this.$swal.fire({
          title: `[${action_name}] 尋原點動作完成`,
          icon: 'success',
          showCancelButton: false,
          confirmButtonText: 'OK',
          customClass: 'my-sweetalert'
        })
      })
    }
  },
  created() {
    bus.on('open-fork-teach-table', () => {
      this.ShowTeachView();
    });
  }
}
</script>
<style scoped lang="scss">
.z-axis-control {
  width: 100%;

  .label-item {
    width: 145px;
    text-align: left;
    padding: 4px;
  }

  .sensor-label-item {
    width: 75px;
    text-align: left;
    padding: 4px;
  }

  .control-buttons {
    button {
      text-align: left;

      i {
        padding: 5px;
        margin: 2px;
      }
    }
  }
}

.disable-notify {
  color: red;
  font-weight: bold;
}

.position-input {
  width: 80px !important;
}
</style>