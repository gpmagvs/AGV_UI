import clsDriverState from './clsDriverState'
import BatteryStatus from './BatteryStatus'
class VMSData {
  APPVersion = "1.0.0"
  Agv_Type = 0
  AutoMode = 0
  AGVC_ID = -1
  AngularSpeed = 0
  Angle = 0
  AlarmCodes = []
  AGV_Direct = 'STOP'
  InitializingStatusText = ""
  BCR_State_MoveBase = {
    state: 0,
    tagID: 0,
    xValue: 0.0,
    yValue: 0.0,
    theta: 0.0,
  }
  BatteryStatus = new Array() < BatteryStatus > 0
  CarName = 'AGV'
  CST_Data = ''
  Current_LASER_MODE = 'Bypass'
  DriversStates = new Array() < clsDriverState > 0
  IsAGVPoseError = false
  IsInitialized = false
  IsSystemIniting = false
  IsLDULD_No_Entry = false
  IsForkHeightAboveSafty = false
  IsForkExtenable = false
  IsForkExtenrDriverBase = false
  Laser_Mode = 0
  Last_Visited_Tag = 1
  Last_Visit_MapPoint = { Name: 'UNKNOWN' }
  LocStatus = 10
  MapComparsionRate = -1
  Mileage = 0
  MainState = 'DOWN'

  NavInfo = {
    /**任務終點 */
    Destination: '',
    /**任務軌跡 */
    PathPlan: [],
    DestinationMapPoint: {
      Name: 'UNKNOWN'
    },
    /**是否為分段任務 */
    IsSegmentTaskExecuting: false
  }
  NewestAlarm = undefined
  OnlineMode = 0
  Pose = {
    position: {
      x: 0,
      y: 0,
      z: 0,
    },
    orientation: {
      x: 0,
      y: 0,
      z: 0,
      w: 0,
    },
  }
  Simulation = false
  SubState = 'DOWN'
  Tag = -1
  ZAxisDriverState = new clsDriverState()
  ForkHorizonDriverState = new clsDriverState()
  ZAxisActionName = ''
  ForkHasLoading = false
  CargoExist = false
  HandShakeTimers = {
    TA1_Wait_L_U_REQ_ON: 0,
    TA2_Wait_EQ_READY_ON: 0,
    TA3_Wait_EQ_BUSY_ON: 0,
    TA4_Wait_EQ_BUSY_OFF: 0,
    TA5_Wait_L_U_REQ_OFF: 0,
  }
  SysLoading = new clsSysLoading()
  HandshakeStatus = new clsEQHandshake()
  OrderInfo = new clsOrderInfo()
  IMUMaxMinValRecord = new clsMaxMinGvalDataSaveModel()
  BuzzerState = {
    isPlaying: false,
    player: 'ros-sound-play',
    playingAudio: 'alarm',
  }
}
export class clsOrderInfo {
  DestineName = ""
  SourceName = ""
  ActionName = 999
  DisplayText = ""

}

export class clsSysLoading {
  Memory = 0
  CPU = 0
}
export class clsEQHandshake {
  ConnectionType = 0
  Connected = false
}

export class AlarmCode {
  Code = 0
  Description = ''
  CN = ''
  EAlarmCode = 0
}

export class clsMaxMinGvalDataSaveModel {
  Time = ""
  Coordination = { x: 0, y: 0, z: 0 }
  AccVal = { x: 0, y: 0, z: 0 }
  MaxMag = 0
}

export default VMSData
