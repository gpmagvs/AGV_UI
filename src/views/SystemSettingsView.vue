<template>
  <div class="sys-setting">
    <el-drawer v-model="drawer_show" size="80%" direction="rtl">
      <template #header>
        <div class="w-100 border-bottom d-flex justify-content-between">
          <h2 class="text-start">系統設定</h2>
          <span class="edit_key" v-if="settings.EditKey">{{ settings.EditKey }}</span>
        </div>
      </template>
      <div v-loading="loading" v-bind:style="loading ? { opacity: 0.5, } : {}" style="position: absolute; width:95%;height: 100%;top:80px" element-loading-text="Loading...">
        <b-tabs v-model="selected_tab" v-if="!loading">
          <b-tab title="一般">
            <div class="tabpage border p-2">
              <el-form :model="settings" label-width="250" label-position="left">
                <!-- <el-form-item label="網頁鍵盤移動控制">
                  <el-switch @change="HandleParamChanged" v-model="settings.WebKeyboardMoveControl"></el-switch>
                </el-form-item>-->
                <el-form-item label="蜂鳴器">
                  <el-switch @change="HandleParamChanged" v-model="settings.BuzzerOn"></el-switch>
                </el-form-item>
                <el-form-item label="一般走行開啟車頭燈">
                  <el-switch @change="HandleParamChanged" v-model="settings.FrontLighterFlashWhenNormalMove"></el-switch>
                </el-form-item>
                <el-form-item label="離線地圖圖資檔案路徑">
                  <el-input @change="HandleParamChanged" size="small" v-model="settings.MapParam.LocalMapFileName"></el-input>
                </el-form-item>
                <el-form-item v-if="!IsInspectionAGV" label="初始化時有帳無料自動清帳">
                  <el-switch @change="HandleParamChanged" v-model="settings.Auto_Cleaer_CST_ID_Data_When_Has_Data_But_NO_Cargo"></el-switch>
                </el-form-item>
                <el-form-item v-if="!IsInspectionAGV" label="初始化時有料無帳自動建帳">
                  <el-switch @change="HandleParamChanged" v-model="settings.Auto_Read_CST_ID_When_No_Data_But_Has_Cargo"></el-switch>
                </el-form-item>
                <el-form-item label="Action任務Timeout(Sec)">
                  <el-input-number @change="HandleParamChanged" size="small" v-model="settings.ActionTimeout"></el-input-number>
                </el-form-item>
              </el-form>
            </div>
          </b-tab>
          <b-tab title="UI">
            <div class="tabpage border p-2">
              <el-form label-position="left" label-width="210">
                <el-form-item v-if="settings.UI != undefined && settings.UI.IsQuicklyActionFooterDisplay != undefined" label="快速動作功能列">
                  <el-switch v-model="settings.UI.IsQuicklyActionFooterDisplay" @change="HandleParamChanged" size="small"></el-switch>
                </el-form-item>
                <el-form-item v-if="settings.UI != undefined && settings.UI.CstReaderSwitchDisplayWhenNotLogin != undefined" label="主頁顯示ID Reader開關(OP)">
                  <el-switch v-model="settings.UI.CstReaderSwitchDisplayWhenNotLogin" @change="HandleParamChanged" size="small"></el-switch>
                </el-form-item>
              </el-form>
            </div>
          </b-tab>
          <b-tab title="安全防護">
            <div class="tabpage border p-2">
              <div class="text-start w-100">
                <el-form :model="settings" label-width="210" label-position="left">
                  <div class="w-100 border-bottom">
                    <b>安全Sensor防護</b>
                  </div>
                  <el-form-item label="左方雷射 Bypass">
                    <el-switch v-model="settings.SensorBypass.LeftSideLaserBypass" @change="HandleParamChanged"></el-switch>
                  </el-form-item>
                  <el-form-item label="右方雷射 Bypass">
                    <el-switch v-model="settings.SensorBypass.RightSideLaserBypass" @change="HandleParamChanged"></el-switch>
                  </el-form-item>
                  <el-form-item label="車體限動Sensor Bypass">
                    <el-switch v-model="settings.SensorBypass.AGVBodyLimitSensorBypass" @change="HandleParamChanged"></el-switch>
                  </el-form-item>
                  <el-form-item v-if="IsForkAGV" label="牙叉前方障礙物Sensor Bypass">
                    <el-switch v-model="settings.SensorBypass.ForkFrontendObsSensorBypass" @change="HandleParamChanged"></el-switch>
                  </el-form-item>
                  <div class="w-100 border-bottom">
                    <b>IMU 數據</b>
                  </div>
                  <el-form-item label="加速度(G)">
                    <el-tag effect="dark" style="width:70px" for>數值</el-tag>
                    <code>{{ IMU_ACC_Data }}</code>
                  </el-form-item>
                  <el-form-item v-if="IMUMaxMinRecord" label="最大值紀錄(G)">
                    <div>
                      <div>
                        <el-tag effect="dark" style="width:70px" for>數值</el-tag>
                        <code>{{ IMUMaxMinRecord.MaxMag }}</code>
                      </div>
                      <div>
                        <el-tag effect="dark" style="width:70px" for>數值</el-tag>
                        <code>{{ { x: IMUMaxMinRecord.AccVal.x.toFixed(2), y: IMUMaxMinRecord.AccVal.y.toFixed(2), z: IMUMaxMinRecord.AccVal.z.toFixed(2) } }}</code>
                      </div>
                      <div>
                        <el-tag effect="dark" style="width:70px" for>發生時間</el-tag>
                        <code>{{ TimeFormat(IMUMaxMinRecord.Time) }}</code>
                      </div>
                      <div>
                        <el-tag effect="dark" style="width:70px" for>發生座標</el-tag>
                        <code>{{ { X: IMUMaxMinRecord.Coordination.x, Y: IMUMaxMinRecord.Coordination.y } }}</code>
                      </div>
                      <div>
                        <el-button @click="HandleIMUDataResetButtonClick" type="danger">RESET</el-button>
                      </div>
                    </div>
                  </el-form-item>
                  <div class="w-100 border-bottom">
                    <b>碰撞偵測功能</b>
                  </div>
                  <el-form-item label="啟用">
                    <el-switch @change="HandleParamChanged" v-model="settings.ImpactDetection.Enabled"></el-switch>
                  </el-form-item>
                  <el-form-item label="異常檢出警報等級">
                    <el-select :disabled="!settings.ImpactDetection.Enabled" v-model="settings.ImpactDetection.ImpactingAlarmLevel" @change="HandleParamChanged">
                      <el-option label="Warning" :value="0"></el-option>
                      <el-option label="Alarm" :value="1"></el-option>
                    </el-select>
                  </el-form-item>
                  <el-form-item label="閥值">
                    <el-input-number size="small" :step="0.01" :precision="2" :min="0.01" :max="4" @change="HandleParamChanged" v-model="settings.ImpactDetection.ThresHold"></el-input-number>
                    <span class="mx-2">G</span>
                  </el-form-item>
                  <div class="w-100 border-bottom">
                    <b>姿態異常偵測(傾倒偵測)</b>
                  </div>
                  <el-form-item label="啟用">
                    <el-switch @change="HandleParamChanged" v-model="settings.ImpactDetection.PitchErrorDetection"></el-switch>
                  </el-form-item>
                  <el-form-item label="異常檢出警報等級">
                    <el-select :disabled="!settings.ImpactDetection.PitchErrorDetection" v-model="settings.ImpactDetection.PitchErrorAlarmLevel" @change="HandleParamChanged">
                      <el-option label="Warning" :value="0"></el-option>
                      <el-option label="Alarm" :value="1"></el-option>
                    </el-select>
                  </el-form-item>
                  <el-form-item label="閥值">
                    <el-input-number size="small" :step="0.01" :precision="2" :min="0.01" :max="9.8" @change="HandleParamChanged" v-model="settings.ImpactDetection.PitchErrorThresHold"></el-input-number>
                    <span class="mx-2">G</span>
                  </el-form-item>
                  <div v-if="settings.ForbidToOnlineTags" class="w-100 border-bottom">
                    <b>禁止上線點位</b>
                  </div>
                  <el-select class="my-2" v-model="settings.ForbidToOnlineTags" multiple placeholder="Select" @change="HandleParamChanged" style="width: 300px">
                    <el-option v-for="station in normal_stations" :key="station.tag" :label="station.name" :value="station.tag" />
                  </el-select>
                </el-form>
              </div>
            </div>
          </b-tab>
          <b-tab v-if="!IsInspectionAGV" title="電池">
            <div class="tabpage border p-2">
              <el-form :model="settings" label-width="250" label-position="left">
                <el-form-item label="等待充電開始時間(秒)">
                  <el-input-number @change="HandleParamChanged" size="small" v-model="settings.BatteryModule.WaitChargeStartDelayTimeWhenReachChargeTaskFinish"></el-input-number>
                </el-form-item>
                <el-form-item label="斷開充電回路電壓閥值(mV)">
                  <el-input-number @change="HandleParamChanged" size="small" v-model="settings.BatteryModule.CutOffChargeRelayVoltageThreshodlval"></el-input-number>
                </el-form-item>
                <el-form-item label="僅電量低於閥值才開啟充電迴路">
                  <el-switch @change="HandleParamChanged" v-model="settings.BatteryModule.ChargeWhenLevelLowerThanThreshold"></el-switch>
                </el-form-item>
                <el-form-item label="充電迴路開啟閥值">
                  <el-input-number size="small" :step="1" :precision="0" :min="1" :max="100" :disabled="!settings.BatteryModule.ChargeWhenLevelLowerThanThreshold" @change="HandleParamChanged" v-model="settings.BatteryModule.ChargeLevelThreshold"></el-input-number>
                </el-form-item>
              </el-form>
            </div>
          </b-tab>
          <b-tab v-if="IsInspectionAGV" title="巡檢AGV">
            <div class="tabpage border p-2">
              <el-form label-width="250" label-position="left">
                <div class="text-start w-100 border-bottom">
                  <b>初始化</b>
                </div>
                <el-form-item label="初始化檢查電池鎖定">
                  <el-switch @change="HandleParamChanged" v-model="settings.InspectionAGV.CheckBatteryLockStateWhenInit"></el-switch>
                </el-form-item>
                <div class="text-start w-100 border-bottom">
                  <b>電池交換</b>
                </div>
                <el-form-item label="需交換電池最小電量">
                  <el-input @change="HandleParamChanged" type="number" :min="0" :max="100" v-model="settings.InspectionAGV.ExchangeBatLevelThresholdVal"></el-input>
                </el-form-item>
                <el-form-item label="交換電池數量">
                  <el-input @change="HandleParamChanged" type="number" :min="1" :max="2" v-model="settings.InspectionAGV.BatteryChangeNum"></el-input>
                </el-form-item>
                <el-form-item label="交握-TP1">
                  <el-input @change="HandleParamChanged" type="number" :min="1" :max="999" v-model="settings.InspectionAGV.BatExchangeTimeout.TP1"></el-input>
                </el-form-item>
                <el-form-item label="交握-TP2">
                  <el-input @change="HandleParamChanged" type="number" :min="1" :max="999" v-model="settings.InspectionAGV.BatExchangeTimeout.TP2"></el-input>
                </el-form-item>
                <el-form-item label="交握-TP3">
                  <el-input @change="HandleParamChanged" type="number" :min="1" :max="999" v-model="settings.InspectionAGV.BatExchangeTimeout.TP3"></el-input>
                </el-form-item>
                <el-form-item label="交握-TP4">
                  <el-input @change="HandleParamChanged" type="number" :min="1" :max="999" v-model="settings.InspectionAGV.BatExchangeTimeout.TP4"></el-input>
                </el-form-item>
                <el-form-item label="交握-TP5">
                  <el-input @change="HandleParamChanged" type="number" :min="1" :max="999" v-model="settings.InspectionAGV.BatExchangeTimeout.TP5"></el-input>
                </el-form-item>
              </el-form>
            </div>
          </b-tab>
          <b-tab v-if="!IsInspectionAGV" title="設備取/放貨">
            <div class="tabpage border p-2">
              <el-form :model="settings" label-width="250" label-position="left">
                <div class="text-start w-100 border-bottom">
                  <b>交握TIMEOUT</b>
                </div>
                <el-form-item label="TA1_Wait_L_U_REQ_ON">
                  <el-input-number @change="HandleParamChanged" size="small" v-model="settings.EQHSTimeouts.TA1_Wait_L_U_REQ_ON"></el-input-number>
                </el-form-item>
                <el-form-item label="TA2_Wait_EQ_READY_ON">
                  <el-input-number @change="HandleParamChanged" size="small" v-model="settings.EQHSTimeouts.TA2_Wait_EQ_READY_ON"></el-input-number>
                </el-form-item>
                <el-form-item label="TA3_Wait_EQ_BUSY_ON">
                  <el-input-number @change="HandleParamChanged" size="small" v-model="settings.EQHSTimeouts.TA3_Wait_EQ_BUSY_ON"></el-input-number>
                </el-form-item>
                <el-form-item label="TA4_Wait_EQ_BUSY_OFF">
                  <el-input-number @change="HandleParamChanged" size="small" v-model="settings.EQHSTimeouts.TA4_Wait_EQ_BUSY_OFF"></el-input-number>
                </el-form-item>
                <el-form-item label="TA5_Wait_L_U_REQ_OFF">
                  <el-input-number @change="HandleParamChanged" size="small" v-model="settings.EQHSTimeouts.TA5_Wait_L_U_REQ_OFF"></el-input-number>
                </el-form-item>
                <!--  -->
                <!--  -->
                <div class="text-start w-100 border-bottom">
                  <b>一般設定</b>
                </div>
                <el-form-item label="等待EQ READY播放音樂">
                  <el-switch @change="HandleParamChanged" v-model="settings.PlayHandshakingMusic"></el-switch>
                </el-form-item>
                <el-form-item label="設備內停車允許誤差(mm)">
                  <el-input-number @change="HandleParamChanged" size="small" v-model="settings.TagParkingTolerance"></el-input-number>
                </el-form-item>
                <el-form-item label="退出設備須需要詢問派車">
                  <el-switch @change="HandleParamChanged" v-model="settings.LDULDParams.LeaveWorkStationNeedSendRequestToAGVS"></el-switch>
                </el-form-item>
                <el-form-item label="空取空放">
                  <el-switch @change="HandleParamChanged" v-model="settings.LDULD_Task_No_Entry"></el-switch>
                </el-form-item>
                <!-- <el-form-item label="CST ID讀取功能">
                  <el-switch @change="HandleParamChanged" v-model="settings.CST_READER_TRIGGER"></el-switch>
                </el-form-item>-->
                <div class="text-start w-100 border-bottom">
                  <b>貨物ID讀取</b>
                </div>
                <el-form-item label="取貨時需讀取貨物卡匣ID">
                  <el-switch @change="HandleParamChanged" v-model="settings.CST_READER_TRIGGER"></el-switch>
                </el-form-item>
                <el-form-item label="CST ID讀取失敗後車載狀態設為">
                  <el-select @change="HandleParamChanged" v-model="settings.CstReadFailAction">
                    <el-option label="Normal Status" :value="0"></el-option>
                    <el-option label="Down Status" :value="1"></el-option>
                  </el-select>
                </el-form-item>
                <el-form-item label="CST ID讀取值與任務不符時">
                  <el-select @change="HandleParamChanged" v-model="settings.Cst_ID_Not_Match_Action">
                    <el-option label="上報讀取之ID" :value="0"></el-option>
                    <el-option label="向派車查詢虛擬ID" :value="1"></el-option>
                  </el-select>
                </el-form-item>
                <el-form-item label="CST 在席檢-進入設備前">
                  <el-switch @change="HandleParamChanged" v-model="settings.CST_EXIST_DETECTION.Before_In"></el-switch>
                </el-form-item>
                <el-form-item label="CST 在席檢-設備動作後">
                  <el-switch @change="HandleParamChanged" v-model="settings.CST_EXIST_DETECTION.After_EQ_Busy_Off"></el-switch>
                </el-form-item>
                <!--  -->
                <div class="text-start w-100 border-bottom">
                  <b>車頭設備內產品預檢知</b>
                </div>
                <el-form-item label="車頭設備內產品預檢知-放貨">
                  <el-switch @change="HandleParamChanged" v-model="settings.LOAD_OBS_DETECTION.Enable_Load"></el-switch>
                </el-form-item>
                <el-form-item label="車頭設備內產品預檢知-取貨">
                  <el-switch @change="HandleParamChanged" v-model="settings.LOAD_OBS_DETECTION.Enable_UnLoad"></el-switch>
                </el-form-item>
                <el-form-item label="車頭設備內產品預檢知-偵測時間(sec)">
                  <el-input-number @change="HandleParamChanged" size="small" v-model="settings.LOAD_OBS_DETECTION.Duration"></el-input-number>
                </el-form-item>
                <div class="text-start w-100 border-bottom">
                  <b>雷射偵測設備Port內障礙物</b>
                </div>
                <el-form-item label="啟用">
                  <el-switch @change="HandleParamChanged" v-model="settings.LDULDParams.LsrObstacleDetectionEnable"></el-switch>
                </el-form-item>
                <el-form-item label="雷射組數">
                  <el-input-number :disabled="!settings.LDULDParams.LsrObstacleDetectionEnable" @change="HandleParamChanged" size="small" :min="0" :max="16" v-model="settings.LDULDParams.LsrObsLaserModeNumber"></el-input-number>
                </el-form-item>
                <el-form-item label="偵測異常發報等級">
                  <el-select :disabled="!settings.LDULDParams.LsrObstacleDetectionEnable" v-model="settings.LDULDParams.LsrObsDetectedAlarmLevel" @change="HandleParamChanged">
                    <el-option label="Warning" :value="0"></el-option>
                    <el-option label="Alarm" :value="1"></el-option>
                  </el-select>
                </el-form-item>
              </el-form>
            </div>
          </b-tab>
          <b-tab title="叉車AGV" v-if="IsForkAGV && settings.ForkAGV">
            <div class="tabpage border p-2">
              <el-form label-position="left" label-width="210">
                <el-form-item label="行程上極限(cm)">
                  <el-input-number size="small" :step="0.1" :precision="1" :min="0" :max="settings.ForkAGV.UplimitPoseSettingMax" @change="HandleParamChanged" v-model="settings.ForkAGV.UplimitPose"></el-input-number>
                </el-form-item>
                <el-form-item label="行程下極限(cm)">
                  <el-input-number size="small" :step="0.1" :precision="1" :min="-50" :max="100" @change="HandleParamChanged" v-model="settings.ForkAGV.DownlimitPose"></el-input-number>
                </el-form-item>
                <el-form-item label="安全高度(cm)">
                  <el-input-number size="small" :step="0.1" :precision="1" :min="1" :max="100" @change="HandleParamChanged" v-model="settings.ForkAGV.SaftyPositionHeight"></el-input-number>
                </el-form-item>
                <el-form-item label="待命點高度(cm)">
                  <el-input-number size="small" :step="0.1" :precision="1" :min="-100" :max="100" @change="HandleParamChanged" v-model="settings.ForkAGV.StandbyPose"></el-input-number>
                </el-form-item>
                <el-form-item label="允許走行之牙叉位置限制">
                  <el-select @change="HandleParamChanged" v-model="settings.ForkAGV.ForkSaftyStratrgy">
                    <el-option label="牙叉位於原點" :value="0"></el-option>
                    <el-option label="牙叉低於安全高度" :value="1"></el-option>
                  </el-select>
                </el-form-item>
                <el-form-item label="使用待命點為動作原點">
                  <el-switch @change="HandleParamChanged" v-model="settings.ForkAGV.HomePoseUseStandyPose"></el-switch>
                </el-form-item>
                <el-form-item label="Z軸皮帶檢知Bypass">
                  <el-switch @change="HandleParamChanged" v-model="settings.SensorBypass.BeltSensorBypass"></el-switch>
                </el-form-item>
                <el-form-item label="牙叉已在Home位置不必初始化">
                  <el-switch @change="HandleParamChanged" v-model="settings.ForkNoInitializeWhenPoseIsHome"></el-switch>
                </el-form-item>
                <el-form-item label="退出設備時不等待牙叉縮回完成">
                  <el-switch @change="HandleParamChanged" v-model="settings.ForkAGV.NoWaitForkArmFinishAndMoveOutInWorkStation"></el-switch>
                </el-form-item>
                <el-form-item label="退出設備後Z軸同步回Home">
                  <el-switch @change="HandleParamChanged" v-model="settings.ForkAGV.NoWaitParkingFinishAndForkGoHomeWhenBackToSecondary"></el-switch>
                </el-form-item>
                <el-form-item label="取貨動作牙叉下降時同步拍照">
                  <el-switch @change="HandleParamChanged" v-model="settings.ForkAGV.TriggerCstReaderWhenUnloadBackToEntryPointAndReachTag"></el-switch>
                </el-form-item>
                <el-form-item v-if="false" label="退出充電站後Z軸同步回Home">
                  <el-switch @change="HandleParamChanged" v-model="settings.ForkAGV.NoWaitParkingFinishAndForkGoHomeWhenBackToSecondaryAtChargeStation"></el-switch>
                </el-form-item>
                <el-form-item label="手動操作移動速度(%)">
                  <el-input-number size="small" :step="0.01" :precision="2" :min="0.01" :max="1" @change="HandleParamChanged" v-model="settings.ForkAGV.ManualModeOperationSpeed.MoveToPoseSpeed"></el-input-number>
                </el-form-item>
              </el-form>
            </div>
          </b-tab>
          <b-tab title="派車系統">
            <div class="tabpage border p-2">
              <el-form label-position="left" label-width="210">
                <el-form-item label="Host">
                  <el-row>
                    <el-col :span="3">IP</el-col>
                    <el-col :span="10">
                      <el-input @change="HandleParamChanged" size="small" v-model="settings.Connections.AGVS.IP"></el-input>
                    </el-col>
                    <el-col :span="3">Port</el-col>
                    <el-col :span="5">
                      <el-input-number @change="HandleParamChanged" size="small" v-model="settings.Connections.AGVS.Port"></el-input-number>
                    </el-col>
                  </el-row>
                </el-form-item>
                <el-form-item label="連線類型">
                  <el-select v-model="settings.VMSParam.Protocol" @change="HandleParamChanged">
                    <el-option label="TCP/IP" :value="0"></el-option>
                    <el-option label="Web API" :value="1"></el-option>
                  </el-select>
                </el-form-item>
              </el-form>
            </div>
          </b-tab>
          <b-tab title="音效">
            <div class="tabpage border p-2 souns-page">
              <SoundsSetting></SoundsSetting>
              <!-- <div class="w-100 border-bottom text-start">
                <b>音效模組資訊</b>
              </div>
              <el-form class="my-2" label-width="100px" label-position="left">
                <el-form-item label="模組">
                  <el-tag effect="dark" size="large">{{BuzzerState.player}}</el-tag>
                </el-form-item>
              </el-form>
              <div class="w-100 border-bottom text-start my-3">
                <b>音效測試與設定</b>
              </div>

              <el-form class="my-2" label-width="100px" label-position="left">
                <el-form-item label="Alarm">
                  <div class="d-flex flex-row">
                    <i class="bi bi-play-circle" @click="PlayAlarm"></i>
                    <uploader music_type="Alarm"></uploader>
                  </div>
                </el-form-item>
                <el-form-item label="Move">
                  <div class="d-flex flex-row">
                    <i class="bi bi-play-circle" @click="PlayMove"></i>
                    <uploader music_type="Move"></uploader>
                  </div>
                </el-form-item>
                <el-form-item label="Action">
                  <div class="d-flex flex-row">
                    <i class="bi bi-play-circle" @click="PlayAction"></i>
                    <uploader music_type="Action"></uploader>
                  </div>
                </el-form-item>
              </el-form>
              <div class="border-button">
                <b-button variant="danger">停止播放</b-button>
              </div>-->
            </div>
          </b-tab>
          <b-tab v-if="!IsInspectionAGV" title="Cst Reader">
            <div class="tabpage border p-2 cst-reader">
              <el-form label-width="100px" label-position="left">
                <el-form-item label="Tray Reader">
                  <el-checkbox v-model="settings.HasTrayCstReader" @change="HandleParamChanged"></el-checkbox>
                </el-form-item>
                <el-form-item label="Rack Reader">
                  <el-checkbox v-model="settings.HasRackCstReader" @change="HandleParamChanged"></el-checkbox>
                </el-form-item>
              </el-form>
            </div>
          </b-tab>
          <b-tab title="I/O定義">
            <div class="tabpage border p-2 io-setting x-2">
              <IOSetting></IOSetting>
            </div>
          </b-tab>
          <b-tab v-if="!IsInspectionAGV" title="設備交握設定">
            <div class="tabpage border p-2">
              <EQHandshakeConfiguration :SyncFromAGVS="settings.LDULDParams.LeaveWorkStationNeedSendRequestToAGVS" @onSyncAGVSCheckBoxChanged="(val) => {
                settings.LDULDParams.LeaveWorkStationNeedSendRequestToAGVS = val;
                HandleParamChanged();
              }"></EQHandshakeConfiguration>
            </div>
          </b-tab>
          <b-tab title="手動檢查貨況">
            <div class="tabpage border p-2">
              <ManualCheckCargoStatus :checkPointData="settings.ManualCheckCargoStatus"></ManualCheckCargoStatus>
            </div>
          </b-tab>
          <b-tab title="進階">
            <div class="tabpage border p-2">
              <el-form label-position="left" label-width="250">
                <el-form-item label="無貨行駛異常時自動重置並上線">
                  <el-switch v-model="settings.Advance.AutoInitAndOnlineWhenMoveWithoutCargo" @change="HandleParamChanged" size="small"></el-switch>
                </el-form-item>
                <el-form-item label="有貨行駛異常時自動重置並上線">
                  <el-switch v-model="settings.Advance.AutoInitAndOnlineWhenMoveWithCargo" @change="HandleParamChanged" size="small"></el-switch>
                </el-form-item>
                <el-form-item label="禁止自動重置的異常">
                  <el-select v-model="forbidden_auto_reset_alarm_codes" @change="HandleForbiddenAutoResetAlarmCodesChanged" size="small" multiple>
                    <el-option v-for="alarm in alarm_table" :key="alarm.Code" :label="`${alarm.Code} - ${alarm.CN}`" :value="alarm.Code"></el-option>
                  </el-select>
                </el-form-item>
              </el-form>
              <div class="w-100">
                <b-button class="w-50 my-1 mx-3" variant="primary" @click="HandleSystemRestartBtnClick">系統重啟</b-button>
                <b-button class="w-50 my-1 mx-3" variant="danger" @click="HandleSystemCloseBtnClick">系統關閉</b-button>
                <b-button v-if="false" class="w-50 my-1 mx-3" variant="info" @click="HandleOTAUpdateBtnClick">系統更新</b-button>
              </div>
            </div>
          </b-tab>
        </b-tabs>
      </div>
    </el-drawer>
  </div>
</template>
<script>
import { ElNotification } from 'element-plus'
import bus from '@/event-bus.js'
import { SystemAPI, IMUAPI, SoundsAPI, AlarmTableAPI } from '@/api/VMSAPI.js'
import MapAPI from '@/api/MapAPI.js'
import { SystemSettingsStore, AGVStatusStore } from '@/store'
import moment from 'moment'
import { ROS_STORE } from "@/store/ros_store";
import uploader from '@/components/Upload/music_upload.vue'
import IOSetting from '@/components/IOSetting.vue'
import param from '@/gpm_param'
import axios from 'axios'
import EQHandshakeConfiguration from '@/components/EQHandshakeConfiguration.vue'
import ManualCheckCargoStatus from '@/components/SystemSettings/ManualCheckCargoStatus.vue'
import SoundsSetting from '@/components/SystemSettings/SoundsSetting.vue'
import SystemSettings from '@/ViewModels/SystemSettings'
import AlarmCodeModel from '@/ViewModels/AlarmCodeModel'
class ForkLifer {
  constructor() {
    this.ForkLifer_Enable = true;
    this.VehielLengthWitchForkArmExtend = 160.0;
    this.UplimitPose = 35;
    this.DownlimitPose = 0;
    this.StandbyPose = 20;
    this.HomePoseUseStandyPose = true;
    this.UplimitPoseSettingMax = 35;
    this.IsPinMounted = true;
    this.IsForkIsExtendable = true;
    this.NoWaitForkArmFinishAndMoveOutInWorkStation = true;
    this.NoWaitParkingFinishAndForkGoHomeWhenBackToSecondary = true;
    this.NoWaitParkingFinishAndForkGoHomeWhenBackToSecondaryAtChargeStation = true;
    this.ForkSaftyStrategy = 'UNDER_SAFTY_POSITION';
    this.SaftyPositionHeight = 20;
    this.initParams = {};
  }
}


export default {
  components: {
    uploader, IOSetting, EQHandshakeConfiguration, ManualCheckCargoStatus, SoundsSetting
  },
  data() {
    return {
      loading: true,
      drawer_show: false,
      selected_tab: 0,
      settings: new SystemSettings(),
      normal_stations: [],
      saveSettingsTimeout: null,
      alarm_table: [new AlarmCodeModel()],
      forbidden_auto_reset_alarm_codes: [],
    }
  },
  computed: {
    IsForkAGV() {
      return AGVStatusStore.getters.IsForkAGV;
    },
    IsInspectionAGV() {
      return AGVStatusStore.getters.IsInspectionAGV;
    },
    IMUMaxMinRecord() {
      return AGVStatusStore.getters.IMUMaxMinRecord
    },
    IMU_ACC_Data() {
      var _data = ROS_STORE.getters.ImuData_Acc;
      return {
        x: (_data.x / 9.8).toFixed(2),
        y: (_data.y / 9.8).toFixed(2),
        z: (_data.z / 9.8).toFixed(2),
      }
    },
    BuzzerState() {
      const state = AGVStatusStore.state.AGVStatus.BuzzerState;
      if (state)
        return state;
      else {
        return {
          isPlaying: false,
          player: 'ros-sound-play',
          playingAudio: '',
        }
      }
    },
  },
  mounted() {
    bus.on('show-settings', async (tabIndex) => {


      this.loading = true;
      this.drawer_show = true

      setTimeout(async () => {
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
          await SystemSettingsStore.dispatch('downloadSettings');
          if (SystemSettingsStore.state.IsSettingsLoaded) {
            this.settings = SystemSettingsStore.state.Settings;
            if (tabIndex)
              this.selected_tab = tabIndex;
            this.loading = false;
            this.$notify({
              title: '系統設定',
              message: '參數下載完成',
              type: 'success',
              position: 'bottom-right',
              duration: 2000
            });
            await this.GetAlarmTable();

            this.forbidden_auto_reset_alarm_codes = this.settings.Advance.ForbidAutoInitialzeAlarmCodes;
            this.forbidden_auto_reset_alarm_codes.sort()
            return;
          }
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 1000));//等待1秒
        }
        this.loading = false;
        this.$swal.fire({
          title: '載入設定失敗',
          text: '無法下載系統設定，請稍後再試',
          icon: 'error',
          showCancelButton: true,
          confirmButtonText: '重新嘗試',
          cancelButtonText: 'OK',
          customClass: 'my-sweetalert'
        }).then((result) => {
          if (result.isConfirmed) {
            bus.emit('show-settings', this.selected_tab);
          } else {
            this.drawer_show = false;
          }
        });
      }, 200);

    })
  },
  methods: {
    async GetAlarmTable() {
      this.alarm_table = await AlarmTableAPI.GetAlarmTable();
    },
    async HandleForbiddenAutoResetAlarmCodesChanged() {
      this.settings.Advance.ForbidAutoInitialzeAlarmCodes = this.forbidden_auto_reset_alarm_codes;
      this.HandleParamChanged();

    },
    async HandleSystemCloseBtnClick() {
      this.SystemOptConfirmAndDoAction('確定要關閉車載系統?', async () => {
        var _response = await SystemAPI.CloseSystem();
        if (_response.confirm) {
          this.drawer_show = false;
          this.$swal.fire(
            {
              title: '系統將於一秒後關閉...',
              text: '',
              icon: 'warning',
              showCancelButton: false,
              confirmButtonText: 'OK',
              customClass: 'my-sweetalert'
            })
        } else {
          this.$swal.fire(
            {
              title: _response.message,
              text: '',
              icon: 'error',
              showCancelButton: false,
              confirmButtonText: 'OK',
              customClass: 'my-sweetalert'
            })
        }
      })


    },
    async HandleSystemRestartBtnClick() {

      this.SystemOptConfirmAndDoAction('確定要重新啟動車載系統?', async () => {
        var _response = await SystemAPI.RestartSystem();
        if (_response.confirm) {
          this.drawer_show = false;
          this.$swal.fire(
            {
              text: '',
              title: '系統將於一秒後重新啟動...',
              icon: 'warning',
              showCancelButton: false,
              confirmButtonText: 'OK',
              customClass: 'my-sweetalert'
            })
        } else {
          this.$swal.fire(
            {
              text: '',
              title: _response.message,
              icon: 'error',
              showCancelButton: false,
              confirmButtonText: 'OK',
              customClass: 'my-sweetalert'
            })
        }
      });

    },
    async HandleOTAUpdateBtnClick() {
      this.SystemOptConfirmAndDoAction('確定進行系統更新?', async () => {
        this.$swal.fire(
          {
            text: '',
            title: '系統更新中...',
            icon: 'warning',
            showCancelButton: false,
            confirmButtonText: 'OK',
            customClass: 'my-sweetalert'
          })
        var response = await axios.get(param.OTA_Update_URL)

      });

    },
    SystemOptConfirmAndDoAction(opt_text, handler_action) {
      return this.$swal.fire(
        {
          title: opt_text,
          text: '',
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'OK',
          customClass: 'my-sweetalert'
        }).then(res => {
          if (res.isConfirmed) {
            handler_action();
          }
        })
    },
    async HandleParamChanged() {
      // Debounce the API call to avoid rapid updates
      if (this.saveSettingsTimeout) {
        clearTimeout(this.saveSettingsTimeout);
      }

      this.saveSettingsTimeout = setTimeout(async () => {
        const reuslt = await SystemAPI.SaveSettings(this.settings)
        const success = reuslt.confirm;
        const errMsg = reuslt.errorMsg;
        if (success) {
          this.forbidden_auto_reset_alarm_codes.sort()
          // SystemSettingsStore.commit('setSettings', this.settings)
          ElNotification({
            title: '系統參數設定',
            message: '系統參數設定成功',
            type: 'success',
            duration: 1000,
            position: 'bottom-right'
          });
        } else {
          // 重新下載參數
          setTimeout(async () => {
            await SystemSettingsStore.dispatch('downloadSettings');
            if (SystemSettingsStore.state.IsSettingsLoaded) {
              this.settings = SystemSettingsStore.state.Settings;
            }
          }, 500);
          this.$swal.fire({
            title: '系統參數設定',
            text: '系統參數設定失敗:' + errMsg,
            icon: 'error',
            showCancelButton: false,
            confirmButtonText: 'OK',
            customClass: 'my-sweetalert'
          });
        }


      }, 500); // Wait 500ms before making API call
    },
    TimeFormat(time) {
      return moment(time).format("YYYY/MM/DD HH:mm:ss")
    },
    HandleIMUDataResetButtonClick() {
      this.$swal.fire(
        {
          text: '',
          title: '確定要重置IMU紀錄?',
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'OK',
          customClass: 'my-sweetalert'
        }).then(res => {
          if (!res.isConfirmed)
            return;
          IMUAPI.ResetMAXMINRecord();
        })
    },
    PlayAlarm() {
      SoundsAPI.Alarm();
    },
    PlayAction() {
      SoundsAPI.Action();
    },
    PlayMove() {
      SoundsAPI.Move();
    }
  },
}
</script>
<style lang="scss" scoped>
.sys-setting {
  z-index: 1099999;

  .souns-page {
    i {
      font-size: 30px;
      margin-right: 5px;
      cursor: pointer;
    }
  }

  .edit_key {
    font-size: 9px;
    color: #0000008a;
    background-color: #fff;
    padding-top: 31px;
    letter-spacing: 2px;
  }
}

.tabpage {
  // height: 85vh;
  overflow-y: auto;
  height: 76vh;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;

  /* Custom scrollbar styles */
  &::-webkit-scrollbar {
    width: 16px;
    /* Increase scrollbar width */
  }

  &::-webkit-scrollbar-thumb {
    background-color: rgb(164, 164, 164);
    /* Change scrollbar color */
    border-radius: 16px;
    /* Rounded corners */
  }

  &::-webkit-scrollbar-track {
    background: #5c5c5c;
    /* Track color */
  }
}

.io-setting {}
</style>