//{ "Descrption": { "AgvType(車款)": "0:叉車AGV,1:YUNTECH_FORK_AGV, 2:巡檢AGV, 3:潛盾AGV", "OrderInfoFetchSource(任務訂單訊息來源)": "0:從派車任務內容, 1:接收CIM呼叫API", "LDULD_Task_No_Entry(空取空放)": "true:啟用 , false:禁用", "EQHandshakeMethod(設備交握預設方式)": "0:光IO , 1:Modbus , 2:模擬器", "CstReadFailAction(CST ID讀取失敗後車載狀態)": "0:正常,1:當機", "Cst_ID_Not_Match_Action(CST ID讀取結果與任務不符)": "0:上報拍到的ID ,1:向派車查詢虛擬ID", "LsrObsDetectedAlarmLevel(雷射偵測到設備內有障礙物警報等級)": "0:Warning,1:Alarm", "IO_VAL_TYPE(Modbus交握時使用的IO種類)": "0:使用INPUT讀寫,1:使用 InputRegist 讀/SingleRegister寫(歐迪爾模組)", "HandshakeIOFlickDelayTime (交握 EQIO 瞬閃判斷秒數)": "單位:毫秒" }, "LogFolder": "GPM_AGV_LOG", "AgvType": 3, "Version": 1, "SID": "002:001:001", "VehicleName": "AGV_002", "Connections": { "RosBridge": { "IP": "172.20.10.2", "Port": 9090, "Protocol_Interval_ms": 5 }, "Wago": { "IP": "172.20.10.2", "Port": 502, "Protocol_Interval_ms": 50 }, "AGVS": { "IP": "10.22.153.36", "Port": 5500, "Protocol_Interval_ms": 5 } }, "VMSParam": { "Notes": "", "LocalIP": "10.22.141.215", "Protocol": 0, "MapUrl": "http://10.22.153.36:5216/api/Map" }, "ActiveTrafficControl": false, "EQHandshakeBypass": false, "CST_READER_TRIGGER": false, "HasTrayCstReader": true, "HasRackCstReader": false, "Auto_Cleaer_CST_ID_Data_When_Has_Data_But_NO_Cargo": false, "Auto_Read_CST_ID_When_No_Data_But_Has_Cargo": false, "FrontLighterFlashWhenNormalMove": false, "CheckObstacleWhenForkInit": true, "LocalTaskCheckCargoExist": false, "SyncEQInfoFromAGVS": false, "CargoBiasDetectionWhenNormalMoving": true, "LDULD_Task_No_Entry": false, "WebKeyboardMoveControl": false, "CSTIDReadNotMatchSimulation": false, "CIMConn": false, "MeasureServiceSimulator": false, "ForkNoInitializeWhenPoseIsHome": true, "BuzzerOn": true, "EQHandshakeSimulationAutoRun": true, "LastVisitedTag": 77, "OrderInfoFetchSource": 1, "TagParkingTolerance": 5, "ActionTimeout": 5, "VehielLength": 145, "ModuleInfoTopicRevHandlePeriod": 0, "ModuleInfoTopicRevQueueSize": 1, "AGVsMessageEncoding": "UTF-8", "ForbidToOnlineTags": [], "CheckEQDOStatusWorkStationTags": [], "LDULD_Laser_Mode": 0, "Spin_Laser_Mode": 5, "StationNeedQueryVirtualID": [], "MapParam": { "LocalMapFileName": "temp/Map_AOI2F.json" }, "EQHandshakeMethod": 0, "HandshakeIOFlickDelayTime": 300, "LOAD_OBS_DETECTION": { "Enable_Load": false, "Enable_UnLoad": false, "Duration": 4, "AlarmLevelWhenTrigger": 0, "Detection_Method": 0 }, "CST_EXIST_DETECTION": { "Before_In": false, "After_EQ_Busy_Off": false }, "SensorBypass": { "BeltSensorBypass": true, "LeftSideLaserBypass": false, "RightSideLaserBypass": false, "AGVBodyLimitSensorBypass": true, "ForkFrontendObsSensorBypass": false }, "EQHSTimeouts": { "TA1_Wait_L_U_REQ_ON": 5, "TA2_Wait_EQ_READY_ON": 5, "TA3_Wait_EQ_BUSY_ON": 5, "TA4_Wait_EQ_BUSY_OFF": 90, "TA5_Wait_L_U_REQ_OFF": 5, "TP_3_Wait_AGV_BUSY_OFF": 90, "TP_5_Wait_AGV_BUSY_OFF": 90 }, "CstReadFailAction": 1, "Cst_ID_Not_Match_Action": 0, "HandshakeFailWhenLoadFinish": 1, "InspectionAGV": { "CheckBatteryLockStateWhenInit": false, "ExchangeBatLevelThresholdVal": 100, "MeasureSimulation": true, "BatteryExhcnageSimulation": true, "BatteryChangeNum": 1, "BatExchangeTimeout": { "TP1": 60, "TP2": 10, "TP3": 30, "TP4": 30, "TP5": 2 } }, "ForkAGV": { "ForkLifer_Enable": true, "VehielLengthWitchForkArmExtend": 160, "UplimitPose": 35, "DownlimitPose": 0, "UplimitPoseSettingMax": 35, "StandbyPose": 10, "HomePoseUseStandyPose": true, "IsPinMounted": true, "IsForkIsExtendable": true, "NoWaitForkArmFinishAndMoveOutInWorkStation": true, "NoWaitParkingFinishAndForkGoHomeWhenBackToSecondary": true, "NoWaitParkingFinishAndForkGoHomeWhenBackToSecondaryAtChargeStation": true, "ForkSaftyStratrgy": 1, "SaftyPositionHeight": 20, "ManualModeOperationSpeed": { "MoveToPoseSpeed": 0.5 }, "AutoModeOperationSpeed": { "MoveToPoseSpeed": 0.5 }, "ObsSensorPointType": 0 }, "Emulator": { "Descrption": { "Move_Time_Mode(Tag間移動時間模擬)": "0:由距離決定, 1:固定時間", "Move_Fixed_Time(Move_Time_Mode設定為1時,Tag間移動時間)": "單位:秒" }, "Move_Time_Mode": 1, "Move_Fixed_Time": 0.5 }, "ModbusIO": { "IO_VAL_TYPE": 0, "Input_Read_Start": 0, "Input_Read_Num": 8, "Input_Write_Start": 1, "InputRegister_Read_Start": 0, "InputRegister_Read_Num": 1, "InputRegister_Write_Start": 0 }, "ImpactDetection": { "Notes": { "PitchErrorDetection": "是否啟用AGV姿態異常檢測", "PitchErrorAlarmLevel": "當AGV姿態異常檢出時的異常處理等級(0:Warning,1:Alarm)", "ImpactingAlarmLevel": "當碰撞檢出時的異常處理等級(0:Warning,1:Alarm)" }, "Enabled": false, "PitchErrorDetection": false, "ThresHold": 2, "PitchErrorThresHold": 0.707, "PitchErrorAlarmLevel": 0 }, "BatteryModule": { "BatteryLogFolder": "C:\\Users\\jinwei\\Documents\\GPM LOG", "Recharge_Circuit_Auto_Control_In_ManualMode": true, "ChargeWhenLevelLowerThanThreshold": true, "ChargeLevelThreshold": 30, "CutOffChargeRelayVoltageThreshodlval": 28800, "WaitChargeStartDelayTimeWhenReachChargeTaskFinish": 10 }, "LDULDParams": { "LsrObstacleDetectionEnable": false, "LsrObsLaserModeNumber": 8, "LsrObsDetectedAlarmLevel": 0, "LeaveWorkStationNeedSendRequestToAGVS": false, "LeaveWorkStationRequestTimeout": 3, "BypassFrontLaserWhenEntryEQ": true }, "CargoExistSensorParams": { "TraySensorMounted": true, "RackSensorMounted": false, "RackSensorNumber": 2, "TraySensorNumber": 4, "SensorPointType": 1 }, "Advance": { "ShutDownPCWhenLowBatteryLevel": false }, "ManualCheckCargoStatus": { "Enabled": true, "CheckPoints": [ { "Enabled": true, "CheckPointTag": 29, "Timeout": 30, "TriggerMoment": 1 }, { "Enabled": true, "CheckPointTag": 77, "Timeout": 10, "TriggerMoment": 0 }, { "Enabled": true, "CheckPointTag": 91, "Timeout": 30, "TriggerMoment": 0 } ] }, "SoundsParams": { "slowDownAndRotatinSoundPlay": { "Enable": true, "SoundPlayType": 1 } } }
class SystemSettings {
    constructor() {
        this.LogFolder = "GPM_AGV_LOG";
        /** 車款  FORK = 0, YUNTECH_FORK_AGV = 1, INSPECTION_AGV = 2, SUBMERGED_SHIELD = 3, SUBMERGED_SHIELD_Parts = 4, */
        this.AgvType = 3;
        this.Version = 1;
        this.SID = "001:001:001";
        this.VehicleName = "AGV_001";
        this.Connections = {
            RosBridge: { IP: "127.0.0.1", Port: 9090, Protocol_Interval_ms: 5 },
            Wago: { IP: "192.168.1.20", Port: 502, Protocol_Interval_ms: 50 },
            AGVS: { IP: "1.1.1.222", Port: 5500, Protocol_Interval_ms: 5 }
        };
        this.VMSParam = {
            Notes: "",
            LocalIP: "127.0.0.1",
            Protocol: 0,
            MapUrl: "http://1.1.1.1:5216/api/Map"
        };
        this.ActiveTrafficControl = false;
        this.EQHandshakeBypass = false;
        this.CST_READER_TRIGGER = false;
        this.HasTrayCstReader = true;
        this.HasRackCstReader = false;
        this.Auto_Cleaer_CST_ID_Data_When_Has_Data_But_NO_Cargo = false;
        this.Auto_Read_CST_ID_When_No_Data_But_Has_Cargo = false;
        this.FrontLighterFlashWhenNormalMove = false;
        this.CheckObstacleWhenForkInit = true;
        this.LocalTaskCheckCargoExist = false;
        this.SyncEQInfoFromAGVS = false;
        this.CargoBiasDetectionWhenNormalMoving = true;
        this.LDULD_Task_No_Entry = false;
        this.WebKeyboardMoveControl = false;
        this.CSTIDReadNotMatchSimulation = false;
        this.CIMConn = false;
        this.MeasureServiceSimulator = false;
        this.ForkNoInitializeWhenPoseIsHome = true;
        this.BuzzerOn = true;
        this.EQHandshakeSimulationAutoRun = true;
        this.LastVisitedTag = 77;
        this.OrderInfoFetchSource = 1;
        this.TagParkingTolerance = 5;
        this.ActionTimeout = 5;
        this.VehielLength = 145;
        this.ModuleInfoTopicRevHandlePeriod = 0;
        this.ModuleInfoTopicRevQueueSize = 1;
        this.AGVsMessageEncoding = "UTF-8";
        this.ForbidToOnlineTags = [];
        this.CheckEQDOStatusWorkStationTags = [];
        this.LDULD_Laser_Mode = 0;
        this.Spin_Laser_Mode = 5;
        this.StationNeedQueryVirtualID = [];
        this.MapParam = { LocalMapFileName: "temp/Map_AOI2F.json" };
        this.EQHandshakeMethod = 0;
        this.HandshakeIOFlickDelayTime = 800;
        this.LOAD_OBS_DETECTION = {
            Enable_Load: false,
            Enable_UnLoad: false,
            Duration: 4,
            AlarmLevelWhenTrigger: 0,
            Detection_Method: 0
        };
        this.CST_EXIST_DETECTION = {
            Before_In: false,
            After_EQ_Busy_Off: false
        };
        this.SensorBypass = {
            BeltSensorBypass: true,
            LeftSideLaserBypass: false,
            RightSideLaserBypass: false,
            AGVBodyLimitSensorBypass: true,
            ForkFrontendObsSensorBypass: false
        };
        this.EQHSTimeouts = {
            TA1_Wait_L_U_REQ_ON: 10,
            TA2_Wait_EQ_READY_ON: 15,
            TA3_Wait_EQ_BUSY_ON: 10,
            TA4_Wait_EQ_BUSY_OFF: 90,
            TA5_Wait_L_U_REQ_OFF: 10,
            TP_3_Wait_AGV_BUSY_OFF: 90,
            TP_5_Wait_AGV_BUSY_OFF: 90
        };
        this.CstReadFailAction = 1;
        this.Cst_ID_Not_Match_Action = 0;
        this.HandshakeFailWhenLoadFinish = 1;
        this.InspectionAGV = {
            CheckBatteryLockStateWhenInit: false,
            ExchangeBatLevelThresholdVal: 100,
            MeasureSimulation: true,
            BatteryExhcnageSimulation: true,
            BatteryChangeNum: 1,
            BatExchangeTimeout: { TP1: 60, TP2: 10, TP3: 30, TP4: 30, TP5: 2 }
        };
        this.ForkAGV = {
            ForkLifer_Enable: true,
            VehielLengthWitchForkArmExtend: 160,
            UplimitPose: 35,
            DownlimitPose: 0,
            UplimitPoseSettingMax: 35,
            StandbyPose: 10,
            HomePoseUseStandyPose: true,
            IsPinMounted: true,
            IsForkIsExtendable: true,
            NoWaitForkArmFinishAndMoveOutInWorkStation: true,
            NoWaitParkingFinishAndForkGoHomeWhenBackToSecondary: true,
            NoWaitParkingFinishAndForkGoHomeWhenBackToSecondaryAtChargeStation: true,
            ForkSaftyStratrgy: 1,
            SaftyPositionHeight: 20,
            ManualModeOperationSpeed: { MoveToPoseSpeed: 0.5 },
            AutoModeOperationSpeed: { MoveToPoseSpeed: 0.5 },
            ObsSensorPointType: 0
        };
        this.Emulator = {
            Move_Time_Mode: 1,
            Move_Fixed_Time: 0.5
        };
        this.ModbusIO = {
            IO_VAL_TYPE: 0,
            Input_Read_Start: 0,
            Input_Read_Num: 8,
            Input_Write_Start: 1,
            InputRegister_Read_Start: 0,
            InputRegister_Read_Num: 1,
            InputRegister_Write_Start: 0
        };
        this.ImpactDetection = {
            Enabled: false,
            PitchErrorDetection: false,
            ThresHold: 2,
            PitchErrorThresHold: 0.707,
            PitchErrorAlarmLevel: 0
        };
        this.BatteryModule = {
            BatteryLogFolder: "C:\\Users\\jinwei\\Documents\\GPM LOG",
            Recharge_Circuit_Auto_Control_In_ManualMode: true,
            ChargeWhenLevelLowerThanThreshold: false,
            ChargeLevelThreshold: 100,
            CutOffChargeRelayVoltageThreshodlval: 28800,
            WaitChargeStartDelayTimeWhenReachChargeTaskFinish: 20
        };
        this.LDULDParams = {
            LsrObstacleDetectionEnable: false,
            LsrObsLaserModeNumber: 8,
            LsrObsDetectedAlarmLevel: 0,
            LeaveWorkStationNeedSendRequestToAGVS: false,
            LeaveWorkStationRequestTimeout: 3,
            BypassFrontLaserWhenEntryEQ: true
        };
        this.CargoExistSensorParams = {
            TraySensorMounted: true,
            RackSensorMounted: false,
            RackSensorNumber: 2,
            TraySensorNumber: 4,
            SensorPointType: 1
        };
        this.Advance = {
            ShutDownPCWhenLowBatteryLevel: false
        };
        this.ManualCheckCargoStatus = {
            Enabled: false,
            CheckPoints: [
                { Enabled: true, CheckPointTag: 29, Timeout: 30, TriggerMoment: 1 },
                { Enabled: true, CheckPointTag: 77, Timeout: 10, TriggerMoment: 0 },
                { Enabled: true, CheckPointTag: 91, Timeout: 30, TriggerMoment: 0 }
            ]
        };
        this.SoundsParams = {
            audioPathes: {
                move: "/home/gpm/param/sounds/move.wav",
                alarm: "/home/gpm/param/sounds/alarm.wav",
                action: "/home/gpm/param/sounds/action.wav",
                batteryExchange: "/home/gpm/param/sounds/batteryExchange.wav",
                goToCharge: "/home/gpm/param/sounds/goto_charge.wav",
                measure: "/home/gpm/param/sounds/measure.wav",
                rotating: "/home/gpm/param/sounds/spining.wav",
                slowDown: "/home/gpm/param/sounds/slowDown.wav",
                rotating_voice: "/home/gpm/param/sounds/vehicle_rotating.wav",
                slowDown_voice: "/home/gpm/param/sounds/slow_down.wav",
                waitingCargoStatusCheck: "/home/gpm/param/sounds/waiting_cargo_status_check.wav",
                backward: "/home/gpm/param/sounds/waiting_cargo_status_check.wav"
            },
            slowDownAndRotatinSoundPlay: {
                Enable: false,
                SoundPlayType: 1
            },

        };

        this.IsUIDefault = true;
        this.EditKey = 'default';
    }

}

export default SystemSettings;

