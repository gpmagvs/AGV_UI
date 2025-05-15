<template>
  <div class="sys-setting">
    <el-drawer v-model="drawer_show" size="95%" direction="rtl">
      <template #header>
        <div class="w-100 border-bottom d-flex justify-content-between">
          <h2 class="text-start">系統設定</h2>
          <span class="edit_key" v-if="settings.EditKey">{{ settings.EditKey }}</span>
        </div>
      </template>
      <div v-loading="loading" v-bind:style="loading ? { opacity: 0.5, } : {}" style="position: absolute; width:98%;height: 100%;top:66px" element-loading-text="Loading...">
        <div class="settings-container" v-show="!loading">
          <div class="settings-sidebar bg-light">
            <el-scrollbar>
              <div class="menu-items">
                <div v-for="(item, index) in menuItems" :key="index" class="menu-item" :class="{ active: selected_tab === item.index }" @click="handleSelect(item.index)" v-show="item.show != undefined ? item.show() : true">
                  <el-icon>
                    <Setting />
                  </el-icon>
                  <span>{{ item.title }}</span>
                </div>
              </div>
            </el-scrollbar>
          </div>
          <div class="settings-content">
            <div v-if="selected_tab === '0'" class="tabpage border p-2">
              <el-form :model="settings" label-width="250" label-position="left">
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
            <div v-if="selected_tab === '1'" class="tabpage border p-2">
              <el-form label-position="left" label-width="210">
                <el-form-item v-if="settings.UI != undefined && settings.UI.IsQuicklyActionFooterDisplay != undefined" label="快速動作功能列">
                  <el-switch v-model="settings.UI.IsQuicklyActionFooterDisplay" @change="HandleParamChanged" size="small"></el-switch>
                </el-form-item>
                <el-form-item v-if="settings.UI != undefined && settings.UI.CstReaderSwitchDisplayWhenNotLogin != undefined" label="主頁顯示ID Reader開關(OP)">
                  <el-switch v-model="settings.UI.CstReaderSwitchDisplayWhenNotLogin" @change="HandleParamChanged" size="small"></el-switch>
                </el-form-item>
              </el-form>
            </div>
            <div v-if="selected_tab === '2'" class="tabpage border p-2">
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
            <div v-if="selected_tab === '3'" class="tabpage border p-2">
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
            <div v-if="selected_tab === '4'" class="tabpage border p-2">
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
            <div v-if="selected_tab === '5'" class="tabpage border p-2">
              <el-form :model="settings" label-width="280" label-position="left">
                <div class="text-start w-100 border-bottom">
                  <b>一般設定</b>
                </div>
                <el-form-item label="等待EQ READY播放音樂">
                  <el-switch @change="HandleParamChanged" v-model="settings.PlayHandshakingMusic"></el-switch>
                </el-form-item>
                <el-form-item label="設備內停車允許誤差(mm)">
                  <el-input-number @change="HandleParamChanged" size="small" v-model="settings.TagParkingTolerance"></el-input-number>
                </el-form-item>
                <el-form-item v-if="false" label="退出設備須需要詢問派車">
                  <el-switch @change="HandleParamChanged" v-model="settings.LDULDParams.LeaveWorkStationNeedSendRequestToAGVS"></el-switch>
                </el-form-item>
                <el-form-item label="空取空放">
                  <el-switch @change="HandleParamChanged" v-model="settings.LDULD_Task_No_Entry"></el-switch>
                </el-form-item>
                <el-form-item label="使用貨物ID模擬在席">
                  <el-switch @change="HandleParamChanged" v-model="settings.CargoExistSensorParams.ExistSensorSimulation"></el-switch>
                  <span class="mx-3">(有貨物ID時視作有貨物)</span>
                </el-form-item>
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
                <div class="text-start w-100 border-bottom">
                  <b>貨物在席狀態檢查</b>
                </div>
                <el-form-item label="進入設備取放貨前檢查">
                  <el-switch @change="HandleParamChanged" v-model="settings.CST_EXIST_DETECTION.Before_In"></el-switch>
                </el-form-item>
                <el-form-item label="設備/AGV動作取放動作完成後檢查">
                  <el-switch @change="HandleParamChanged" v-model="settings.CST_EXIST_DETECTION.After_EQ_Busy_Off"></el-switch>
                </el-form-item>
                <el-form-item label="走行過程持續檢查貨物狀態">
                  <el-switch @change="HandleParamChanged" v-model="settings.CargoBiasDetectionWhenNormalMoving"></el-switch>
                </el-form-item>
                <el-form-item label="取貨時發生貨物傾斜時可暫停進行排除">
                  <el-switch @change="HandleParamChanged" v-model="settings.LDULDParams.MaunalCheckAndResumableWhenUnloadButCargoBias"></el-switch>
                </el-form-item>
                <div class="text-start w-100 border-bottom">
                  <b>車頭設備內產品預檢知(斜上打)</b>
                </div>
                <el-form-item label="車頭設備內產品預檢知-放貨">
                  <el-switch @change="HandleParamChanged" v-model="settings.LOAD_OBS_DETECTION.Enable_Load"></el-switch>
                </el-form-item>
                <el-form-item label="車頭設備內產品預檢知-取貨">
                  <el-switch @change="HandleParamChanged" v-model="settings.LOAD_OBS_DETECTION.Enable_UnLoad"></el-switch>
                </el-form-item>
                <el-form-item label="偵測時機/方式">
                  <el-select v-model="settings.LOAD_OBS_DETECTION.Detection_Method" @change="HandleParamChanged">
                    <el-option label="開始移動前偵測" :value="0"></el-option>
                    <el-option label="移動期間持續偵測" :value="1"></el-option>
                  </el-select>
                </el-form-item>
                <el-form-item label="偵測異常發報等級">
                  <el-select v-model="settings.LOAD_OBS_DETECTION.AlarmLevelWhenTrigger" @change="HandleParamChanged">
                    <el-option label="Warning" :value="0"></el-option>
                    <el-option label="Alarm" :value="1"></el-option>
                  </el-select>
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
              </el-form>
            </div>
            <div v-if="selected_tab === '6'" class="tabpage border p-2">
              <el-form label-position="left" label-width="210">
                <el-form-item label="浮動牙叉禁用">
                  <el-switch active-text="禁用" inactive-text="啟用" inactive-color="rgb(64, 158, 255)" active-color="red" @change="HandleParamChanged" v-model="settings.ForkAGV.IsPinDisabledTemptary"></el-switch>
                </el-form-item>
                <el-form-item label="伸縮牙叉禁用">
                  <el-switch active-text="禁用" inactive-text="啟用" inactive-color="rgb(64, 158, 255)" active-color="red" @change="HandleParamChanged" v-model="settings.ForkAGV.IsHorizonExtendDisabledTemptary"></el-switch>
                </el-form-item>
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
                <el-form-item label="進入設備時伸縮牙叉同步伸出">
                  <el-switch @change="HandleParamChanged" v-model="settings.ForkAGV.HorizonArmConfigs.ExtendWhenStartMoveToPort"></el-switch>
                </el-form-item>
                <el-form-item label="退出設備時伸縮牙叉同步縮回">
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
                <div class="text-start w-100 border-bottom mb-2">
                  <b>前端障礙物檢知</b>
                </div>
                <el-form-item label="偵測到障礙物時異常等級">
                  <el-select v-model="settings.SensorBypass.ForkFrontendObsSensorBypass" @change="HandleParamChanged">
                    <el-option label="Warning(僅記錄警告)" :value="true"></el-option>
                    <el-option label="Alarm(緊急停止)" :value="false"></el-option>
                  </el-select>
                </el-form-item>
                <el-form-item label="Sensor 接點模式">
                  <el-select v-model="settings.ForkAGV.ObsSensorPointType" @change="HandleParamChanged">
                    <el-option label="A 接點" :value="0"></el-option>
                    <el-option label="B 接點" :value="1"></el-option>
                  </el-select>
                </el-form-item>
                <div v-if="settings.ForkAGV.HorizonArmConfigs" class="text-start w-100 border-bottom mb-2">
                  <b>伸縮牙叉(Driver base)</b>
                </div>
                <el-form-item v-if="settings.ForkAGV.HorizonArmConfigs" label="縮回位置">
                  <el-input-number size="small" :step="1" :precision="1" @change="HandleParamChanged" v-model="settings.ForkAGV.HorizonArmConfigs.ShortenPose"></el-input-number>
                </el-form-item>
                <el-form-item v-if="settings.ForkAGV.HorizonArmConfigs" label="伸出位置">
                  <el-input-number size="small" :step="1" :precision="1" @change="HandleParamChanged" v-model="settings.ForkAGV.HorizonArmConfigs.ExtendPose"></el-input-number>
                </el-form-item>
              </el-form>
            </div>
            <div v-if="selected_tab === '7'" class="tabpage border p-2">
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
            <div v-if="selected_tab === '8'" class="tabpage border p-2 souns-page">
              <SoundsSetting></SoundsSetting>
            </div>
            <div v-if="selected_tab === '9'" class="tabpage border p-2 cst-reader">
              <el-form label-width="100px" label-position="left">
                <el-form-item label="Tray Reader">
                  <el-checkbox v-model="settings.HasTrayCstReader" @change="HandleParamChanged"></el-checkbox>
                </el-form-item>
                <el-form-item label="Rack Reader">
                  <el-checkbox v-model="settings.HasRackCstReader" @change="HandleParamChanged"></el-checkbox>
                </el-form-item>
              </el-form>
            </div>
            <div v-if="selected_tab === '10'" class="tabpage border p-2 io-setting x-2">
              <IOSetting></IOSetting>
            </div>
            <div v-if="selected_tab === '11'" class="tabpage border p-2">
              <EQHandshakeConfiguration :SyncFromAGVS="settings.SyncEQInfoFromAGVS" @onSyncAGVSCheckBoxChanged="(val) => {
                settings.SyncEQInfoFromAGVS = val;
                HandleParamChanged();
              }"></EQHandshakeConfiguration>
            </div>
            <div v-if="selected_tab === '12'" class="tabpage border p-2">
              <ManualCheckCargoStatus :checkPointData="settings.ManualCheckCargoStatus"></ManualCheckCargoStatus>
            </div>
            <div v-if="selected_tab === '13'" class="tabpage border p-2">
              <el-form label-position="left" label-width="250">
                <div class="text-start w-100 border-bottom mb-2 text-danger">
                  <b>維護模式</b>
                </div>
                <el-form-item label="啟用">
                  <el-switch v-model="maintainModeData.IsMaintainMode" @change="HandleMaintainModeSwitchCHanged" inactive-text="不啟用" active-text="啟用" size="small"></el-switch>
                </el-form-item>
                <el-form-item label="Tag設置">
                  <el-input-number v-model="maintainModeData.TagSet" :disabled="!maintainModeData.IsMaintainMode"></el-input-number>
                  <el-button type="primary" @click="HandleSetMaintainTagBtnClicked">設置</el-button>
                </el-form-item>
                <div class="text-start w-100 border-bottom mb-2">
                  <b>April Tag</b>
                </div>
                <!-- Advance.IsAprilTagLocateSupport -->
                <el-form-item label="April Tag Support">
                  <el-switch v-model="settings.Advance.IsAprilTagLocateSupport" @change="HandleAprilTagSupportParamChanged" size="small"></el-switch>
                </el-form-item>
                <div class="text-start w-100 border-bottom mb-2">
                  <b>自動初始化設置</b>
                </div>
                <el-form-item label="無貨行駛異常時自動重置並上線">
                  <el-switch v-model="settings.Advance.AutoInitAndOnlineWhenMoveWithoutCargo" @change="HandleParamChanged" size="small"></el-switch>
                </el-form-item>
                <el-form-item label="有貨行駛異常時自動重置並上線">
                  <el-switch v-model="settings.Advance.AutoInitAndOnlineWhenMoveWithCargo" @change="HandleParamChanged" size="small"></el-switch>
                </el-form-item>
                <el-form-item label="禁止自動重置的異常">
                  <el-select v-model="forbidden_auto_reset_alarm_codes" @change="HandleForbiddenAutoResetAlarmCodesChanged" size="small" multiple filterable>
                    <el-option v-for="alarm in alarm_table" :key="alarm.Code" :label="`${alarm.Code} - ${alarm.CN}`" :value="alarm.Code"></el-option>
                  </el-select>
                </el-form-item>
              </el-form>
              <div class="action-buttons">
                <b-button variant="warning" @click="HandleSystemRestartBtnClick">車載系統重啟</b-button>
                <b-button variant="warning" @click="HandleAGVCRestartBtnClick">車控系統重啟</b-button>
                <b-button variant="danger" @click="HandleSystemCloseBtnClick">車載系統關閉</b-button>
                <b-button v-if="false" variant="info" @click="HandleOTAUpdateBtnClick">系統更新</b-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>
<script>
import { ElNotification } from 'element-plus'
import { ElIcon } from 'element-plus'
import { Setting } from '@element-plus/icons-vue'
import bus from '@/event-bus.js'
import { SystemAPI, IMUAPI, SoundsAPI, AlarmTableAPI, GetMaintainModeStatus, SwitchMaintainMode, SetMaintainingTag } from '@/api/VMSAPI.js'
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
    uploader, IOSetting, EQHandshakeConfiguration, ManualCheckCargoStatus, SoundsSetting,
    Setting
  },
  data() {
    return {
      loading: true,
      drawer_show: false,
      selected_tab: '0',
      settings: new SystemSettings(),
      normal_stations: [],
      saveSettingsTimeout: null,
      alarm_table: [new AlarmCodeModel()],
      forbidden_auto_reset_alarm_codes: [],
      menuItems: [
        { index: '0', title: '一般' },
        { index: '1', title: 'UI' },
        { index: '2', title: '安全防護' },
        { index: '3', title: '電池', show: () => !this.IsInspectionAGV },
        { index: '4', title: '巡檢AGV', show: () => this.IsInspectionAGV },
        { index: '5', title: '設備取/放貨', show: () => !this.IsInspectionAGV },
        { index: '6', title: '叉車AGV', show: () => this.IsForkAGV && this.settings.ForkAGV },
        { index: '7', title: '派車系統' },
        { index: '8', title: '音效' },
        { index: '9', title: 'Cst Reader', show: () => !this.IsInspectionAGV },
        { index: '10', title: 'I/O定義' },
        { index: '11', title: '設備交握設定', show: () => !this.IsInspectionAGV },
        { index: '12', title: '手動檢查貨況' },
        { index: '13', title: '進階' }
      ],
      maintainModeData: {
        IsMaintainMode: false,
        TagSet: -1,
        Coordination: {
          X: 0,
          Y: 0,
          Theta: 0
        }
      }
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
    filteredMenuItems() {
      return this.menuItems.filter(item => !item.show || item.show());
    }
  },
  mounted() {
    bus.on('show-settings', async (tabIndex) => {


      this.loading = true;
      this.drawer_show = true
      setTimeout(async () => {
        let attempts = 0;
        const maxAttempts = 3;
        var success = false;
        while (attempts < maxAttempts) {
          try {
            await SystemSettingsStore.dispatch('downloadSettings');
            if (SystemSettingsStore.state.IsSettingsLoaded) {
              this.settings = SystemSettingsStore.state.Settings;
              if (tabIndex)
                this.selected_tab = tabIndex;
              this.loading = false;
              success = true;
              break;
            }
          } catch (error) {
            console.warn('Failed to download settings', error);
          }
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 1000));//等待1秒
        }
        this.maintainModeData = await GetMaintainModeStatus();
        this.loading = false;
        if (success) {

          setTimeout(async () => {

            await this.GetAlarmTable();
            this.forbidden_auto_reset_alarm_codes = this.settings.Advance.ForbidAutoInitialzeAlarmCodes;
            this.forbidden_auto_reset_alarm_codes.sort()
          }, 10)

          this.$notify({
            title: '系統設定',
            message: '參數下載完成',
            type: 'success',
            position: 'bottom-right',
            duration: 2000
          });

        } else {

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
        }
      }, 1000);

    })
  },
  methods: {
    handleSelect(index) {
      this.selected_tab = index;
    },
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
    async HandleAGVCRestartBtnClick() {

      this.SystemOptConfirmAndDoAction('確定要重新啟動車控系統?', async () => {
        var _response = await SystemAPI.RestartAGVC();
        if (_response.confirm) {
          this.drawer_show = false;
          this.$swal.fire(
            {
              text: '',
              title: '車控系統即將重新啟動...',
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
    HandleAprilTagSupportParamChanged() {
      this.HandleParamChanged();
      this.$swal.fire(
        {
          title: '系統重啟',
          text: '修改 April Tag Support 參數須重啟車載系統',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: '立即重啟',
          cancelButtonText: '稍後重啟',
          customClass: 'my-sweetalert'
        }).then(res => {
          if (res.isConfirmed) {
            SystemAPI.RestartSystem();
            this.showRestartingSwalAlert();
            setTimeout(() => {
              location.reload();
            }, 3000)
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
    showRestartingSwalAlert() {
      this.$swal.fire(
        {
          title: '',
          text: '車載系統重啟中...',
          icon: 'warning',
          showCancelButton: false,
          confirmButtonText: 'OK',
          customClass: 'my-sweetalert'
        })
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
    },
    async HandleMaintainModeSwitchCHanged() {
      await SwitchMaintainMode(this.maintainModeData.IsMaintainMode);
    },
    async HandleSetMaintainTagBtnClicked() {
      await SetMaintainingTag(this.maintainModeData.TagSet)
    }
  },
}
</script>
<style lang="scss" scoped>
.sys-setting {
  z-index: 1099999;

  .settings-container {
    display: flex;
    height: 100%;
  }

  .settings-sidebar {
    width: 175px;
    height: 90vh;
    border-right: 1px solid #dcdfe6;

    .menu-items {
      padding: 10px 0;

      .menu-item {
        display: flex;
        align-items: center;
        height: 50px;
        padding: 0 20px;
        cursor: pointer;
        color: #606266;

        .el-icon {
          margin-right: 8px;
          color: #606266;
        }

        &:hover {
          background-color: #ecf5ff;
          color: #409eff;

          .el-icon {
            color: #409eff;
          }
        }

        &.active {
          background-color: #ecf5ff;
          color: #409eff;

          .el-icon {
            color: #409eff;
          }
        }
      }
    }
  }

  .settings-content {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
  }

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
  height: 88vh;
  overflow-y: auto;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;

  /* Custom scrollbar styles */
  &::-webkit-scrollbar {
    width: 16px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: rgb(164, 164, 164);
    border-radius: 16px;
  }

  &::-webkit-scrollbar-track {
    background: #5c5c5c;
  }

  .action-buttons {
    bottom: 30px;
    display: flex;
    flex-direction: column;

    button {
      margin-block: 3px;
      font-weight: bold;
      letter-spacing: 3px;
    }
  }
}
</style>