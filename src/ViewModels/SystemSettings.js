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
            TriggerCstReaderWhenUnloadBackToEntryPointAndReachTag: false,
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
            LeaveWorkStationNeedSendRequestToAGVS: true,
            LeaveWorkStationRequestTimeout: 3,
            BypassFrontLaserWhenEntryEQ: true
        };
        this.CargoExistSensorParams = {
            TraySensorMounted: true,
            RackSensorMounted: false,
            RackSensorNumber: 2,
            TraySensorNumber: 4,
            SensorPointType: 1,
            ExistSensorSimulation: false
        };
        this.Advance = {
            ShutDownPCWhenLowBatteryLevel: false,
            AutoInitAndOnlineWhenMoveWithoutCargo: false,
            AutoInitAndOnlineWhenMoveWithCargo: false,
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

        this.UI = {
            IsQuicklyActionFooterDisplay: false,
            CstReaderSwitchDisplayWhenNotLogin: false
        };
        this.IsUIDefault = true;
        this.EditKey = 'default';
    }

}

export default SystemSettings;

