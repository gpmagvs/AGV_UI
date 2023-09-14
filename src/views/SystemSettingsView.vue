<template>
  <div>
    <el-drawer v-model="drawer_show" size="50%" direction="rtl">
      <template #header>
        <div class="w-100 border-bottom">
          <h2 class="text-start">Settings</h2>
        </div>
      </template>
      <div>
        <el-form :model="settings" label-width="250" label-position="left">
          <el-form-item label="網頁鍵盤移動控制">
            <el-switch @change="HandleParamChanged" v-model="settings.WebKeyboardMoveControl"></el-switch>
          </el-form-item>
          <el-form-item label="空取空放">
            <el-switch @change="HandleParamChanged" v-model="settings.LDULD_Task_No_Entry"></el-switch>
          </el-form-item>
          <el-form-item label="一般走行開啟車頭燈">
            <el-switch
              @change="HandleParamChanged"
              v-model="settings.FrontLighterFlashWhenNormalMove"
            ></el-switch>
          </el-form-item>
          <el-form-item label="CST ID讀取功能">
            <el-switch @change="HandleParamChanged" v-model="settings.CST_READER_TRIGGER"></el-switch>
          </el-form-item>
          <el-form-item label="CST 在席檢-進入設備前">
            <el-switch
              @change="HandleParamChanged"
              v-model="settings.CST_EXIST_DETECTION.Before_In"
            ></el-switch>
          </el-form-item>
          <el-form-item label="CST 在席檢-設備動作後">
            <el-switch
              @change="HandleParamChanged"
              v-model="settings.CST_EXIST_DETECTION.After_EQ_Busy_Off"
            ></el-switch>
          </el-form-item>
          <el-form-item label="車頭設備內產品預檢知-放貨">
            <el-switch
              @change="HandleParamChanged"
              v-model="settings.LOAD_OBS_DETECTION.Enable_Load"
            ></el-switch>
          </el-form-item>
          <el-form-item label="車頭設備內產品預檢知-取貨">
            <el-switch
              @change="HandleParamChanged"
              v-model="settings.LOAD_OBS_DETECTION.Enable_UnLoad"
            ></el-switch>
          </el-form-item>
          <el-form-item label="車頭設備內產品預檢知-偵測時間(sec)">
            <el-input-number
              @change="HandleParamChanged"
              size="small"
              v-model="settings.LOAD_OBS_DETECTION.Duration"
            ></el-input-number>
          </el-form-item>
          <el-form-item label="斷開充電回路電流閥值(mA)">
            <el-input-number
              @change="HandleParamChanged"
              size="small"
              v-model="settings.CutOffChargeRelayCurrentThreshodlval"
            ></el-input-number>
          </el-form-item>

          <el-form-item label="離線地圖圖資檔案路徑">
            <el-input
              @change="HandleParamChanged"
              size="small"
              v-model="settings.MapParam.LocalMapFileName"
            ></el-input>
          </el-form-item>
          <el-form-item label="Z軸皮帶檢知Bypass">
            <el-switch
              @change="HandleParamChanged"
              v-model="settings.SensorBypass.BeltSensorBypass"
            ></el-switch>
          </el-form-item>
        </el-form>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import { ElNotification } from 'element-plus'
import bus from '@/event-bus.js'
import { SystemAPI } from '@/api/VMSAPI.js'
import { SystemSettingsStore } from '@/store'
export default {
  data() {
    return {
      drawer_show: false,
      settings: {
        LogFolder: "GPM_AGV_LOG",
        AgvType: 1,
        SID: "001:001:001",
        VehicleName: "AGV_001",
        SimulationMode: true,
        WagoSimulation: true,
        ActiveTrafficControl: false,
        EQHandshakeBypass: false,
        CST_READER_TRIGGER: true,
        ForkLifer_Enable: false,
        LDULD_Task_No_Entry: false,
        LastVisitedTag: 17,
        ForbidToOnlineTags: [
          49
        ],
        CutOffChargeRelayCurrentThreshodlval: 5000,
        LDULD_Laser_Mode: 0,
        Spin_Laser_Mode: 5,
        LDULD_FrontBackLaser_Bypass: true,
        FrontLighterFlashWhenNormalMove: true,
        WebKeyboardMoveControl: false,
        Connections: {
          RosBridge: {
            IP: "192.168.235.130",
            Port: 9090
          },
          Wago: {
            IP: "127.0.0.1",
            Port: 9999
          },
          AGVS: {
            IP: "127.0.0.1",
            Port: 5036
          }
        },
        VMSParam: {
          LocalIP: "127.0.0.1",
          Protocol: 1,
          MapUrl: "http://127.0.0.1:5216/api/Map"
        },
        MapParam: {
          LocalMapFileName: "/temp/Map_UMTC_AOI.json"
        },
        EQHandshakeMethod: 2,
        LOAD_OBS_DETECTION: {
          Enable_Load: false,
          Enable_UnLoad: false,
          Duration: 4
        },
        CST_EXIST_DETECTION: {
          Before_In: false,
          After_EQ_Busy_Off: false
        },
        SensorBypass: {
          BeltSensorBypass: true
        }
      }
    }
  },

  mounted() {
    bus.on('show-settings', async () => {
      await this.DownloadSettings();
      this.drawer_show = true
    })
    this.DownloadSettings();
  },
  methods: {
    async DownloadSettings() {
      var _settings = await SystemAPI.GetSettings()
      console.log(_settings)
      this.settings = _settings
      SystemSettingsStore.commit('setSettings', _settings)
      ElNotification({
        title: '系統參數設定',
        message: '系統參數讀取成功',
        type: 'success',
        position: 'bottom-right',
        duration: 1000,
      });
    },
    async HandleParamChanged() {
      var success = await SystemAPI.SaveSettings(this.settings)
      if (success) {
        SystemSettingsStore.commit('setSettings', this.settings)

        ElNotification({
          title: '系統參數設定',
          message: '系統參數設定成功',
          type: 'success',
          position: 'bottom-right',
          duration: 1000,
        });
      } else {
        ElNotification({
          title: '系統參數設定',
          message: '系統參數設定失敗',
          type: 'error',
          position: 'bottom-right',
          duration: 1000,
        });
      }
    }
  },
}
</script>

<style lang="scss" scoped>
</style>