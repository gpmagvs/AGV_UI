import axios from 'axios'
import param from '@/gpm_param'
import MoveTestVM from '@/ViewModels/MoveTestDto.js'

var axios_entity = axios.create({
  baseURL: param.backend_host,
})

export async function EMO() {
  var ret = await axios_entity.post('api/VMS/EMO')
  return ret
}

export async function Where_r_u() {
  var ret = await axios_entity.get('api/VMS/Where_r_u')
  return ret.data
}

export async function Initialize() {
  var ret = await axios_entity.post('api/VMS/Initialize')
  return ret.data
}
export async function CancelInitProcess() {
  var ret = await axios_entity.get('api/VMS/CancelInitProcess')
  return ret.data
}
export async function ResetAlarm() {
  var ret = await axios_entity.post('api/VMS/ResetAlarm')
  return ret
}
export async function BuzzerOff() {
  var ret = await axios_entity.post('api/VMS/BuzzerOff')
  return ret
}
export async function RemoveCassette() {
  var ret = await axios_entity.post('api/VMS/RemoveCassette')
  return ret.data;
}

export const MOVEControl = {
  /**車體移動-UP */
  async AGVMove_UP(speed = 0.08) {
    var ret = await axios_entity.get(
      `api/ManualOperator/Forward?speed=${speed}`,
    )
    return ret
  },

  /**車體移動-DOWN */
  async AGVMove_DOWN(speed = 0.08) {
    var ret = await axios_entity.get(
      `api/ManualOperator/Backward?speed=${speed}`,
    )
    return ret
  },
  /**車體移動-LEFT */
  async AGVMove_LEFT(speed = 0.1) {
    var ret = await axios_entity.get(`api/ManualOperator/Left?speed=${speed}`)
    return ret
  },

  /**車體移動-RIGHT */
  async AGVMove_RIGHT(speed = 0.1) {
    var ret = await axios_entity.get(`api/ManualOperator/Right?speed=${speed}`)
    return ret
  },

  /**車體移動-STOP */
  async AGVMove_STOP() {
    var ret = await axios_entity.get('api/ManualOperator/Stop')
    return ret
  },
}

export const MODESwitcher = {
  async AutoModeSwitch(mode) {
    var ret = await axios_entity.get(`api/VMS/AutoMode?Mode=${mode}`)
    return ret.data
  },
  async OnlineModeSwitch(mode) {
    var ret = await axios_entity.get(`api/VMS/OnlineMode?Mode=${mode}`)
    return ret.data
  },
}

/**GetModuleInformation */
export async function GetModuleInformation() {
  var ret = await axios_entity.get('api/VMS')
  return ret.data
}

/**GetBatteryState */
export async function GetBatteryState() {
  var ret = await axios_entity.get('api/VMS/BateryState')
  return ret.data
}

/**GetMileage */
export async function GetMileage() {
  var ret = await axios_entity.get('api/VMS/Mileage')
  return ret.data
}

/**Reset_Mileage */
export async function Reset_Mileage(mode = 0) {
  var ret = await axios_entity.get(`api/VMS/Reset_Mileage`)
  return ret.data
}
/**Laser Mode */
export async function LaserMode(mode = 0) {
  var ret = await axios_entity.get(`api/VMS/LaserMode?mode=${mode}`)
  return ret.data
}

export const DIO = {
  async DO_State_Change(address, state) {
    var ret = await axios_entity.get(
      `api/VMS/DIO/DO_State?address=${address}&state=${state}`,
    )
    return ret.data
  },

  async DI_State_Change(address, state) {
    var ret = await axios_entity.get(
      `api/VMS/DIO/DI_State?address=${address}&state=${state}`,
    )
    return ret.data
  },
}

/**煞車模組 */
export const Braker = {
  async Brake() {
    var ret = await axios_entity.get(`api/VMS/Brake`)
    return ret.data
  },
  async UnBrake() {
    var ret = await axios_entity.get(`api/VMS/UnBrake`)
    return ret.data
  },
}

export const AlarmTableAPI = {
  async TotalAlarmCount() {
    var ret = await axios_entity.get(`api/AlarmTable/Total`)
    return ret.data
  },
  async QueryByPage(page = 1, page_size = 16) {
    var ret = await axios_entity.get(
      `api/AlarmTable/Query?page=${page}&page_size=${page_size}`,
    )
    return ret.data
  },
  async ClearAlarms() {
    var ret = await axios_entity.get('api/AlarmTable/Clear')
  },
}

export const NavigationAPI = {
  async Action(action, from, to = '', cst_id = '') {
    console.info(action, from, to, cst_id)
    var ret = await axios_entity.get(
      `api/LocalNav/Action?action=${action}&from=${from}&to=${to}&cst_id=${cst_id}`,
    )
    return ret.data
  },
  async MoveTo(x, y, theta, point_id) {
    await axios_entity.get(`api/LocalNav/MoveTo?x=${x}&y=${y}&theta=${theta}&point_id=${point_id}`)
  },
  /**移動測試 
   *  { confirm: Boolean, message: String }
  */
  async MoveTest(moveTestVM = MoveTestVM) {
    try {
      var ret = await axios_entity.post(`api/LocalNav/MoveTo`, moveTestVM)
      return ret.data; //{confirm,message}
    } catch (error) {
      return { confirm: false, message: error.message };
    }
  }
}

export const MapAPI = {
  GetMapFromLocal() {
    return axios_entity
      .get('api/Map')
      .then((ret) => {
        return ret.data
      })
      .catch((err) => {
        return undefined
      })
  },
}

/**觸發Tray Reader 拍照 回傳 barcode  */
export async function TriggerCSTReader() {
  try {

    var ret = await axios_entity.get(
      'api/VMS/TriggerCSTReader'
    )
    return ret.data.barcode;
  } catch (error) {

    return "Network Error";
  }
}


/**停止Tray Reader 拍照*/
export async function StopCSTReader() {
  try {

    var ret = await axios_entity.get(
      'api/VMS/StopCSTReader'
    )
    return ret.data;
  } catch (error) {

    return false;
  }
}


/**FindTagCenter*/
export async function FindTagCenter() {
  try {

    var ret = await axios_entity.get(
      'api/VMS/FindTagCenter'
    )
    return ret.data;
  }
  catch (error) {
    return {
      confirm: false,
      message: error
    };
  }
}

export async function BatteryLockCtrl(battery_no, islock) {
  var ret = await axios_entity.get(`api/VMS/BatteryLockCtrl?battery_no=${battery_no}&islock=${islock}`)
}

/**充電迴路DO開關 */
export async function RechargeCircuit() {
  var ret = await axios_entity.get(`api/VMS/RechargeCircuit`)
  return ret.data //boolean 
}


/**控制Fork */
export const ForkAPI = {

  /**取得教點資料 */
  async GetTeachData() {
    var ret = await axios_entity.get(`api/VMS/Fork/TeachDatas`)
    return ret.data;
  },
  /**儲存所有教點設定 */
  async SaveTeachData(teach_data) {
    var ret = await axios_entity.post(`api/VMS/Fork/SaveTeachDatas`, teach_data)
    return ret.data;
  },
  /**儲存單元教點設定 */
  async SaveUnitTeachData(unit_teach_data) {
    var ret = await axios_entity.post(`api/VMS/Fork/SaveUnitTeachData`, unit_teach_data)
    return ret.data;
  },
  /**移除Tag教點設定 */
  async RemoveTagTeachData(tag) {
    var ret = await axios_entity.get(`api/VMS/Fork/RemoveTagTeachData?tag=${tag}`)
    return ret.data;
  },
  /**移除單元教點設定 */
  async RemoveUnitTeachData(tag, layer) {
    var ret = await axios_entity.get(`api/VMS/Fork/RemoveUnitTeachData?tag=${tag}&layer=${layer}`)
    return ret.data;
  },

  /**枒杈伸出 */
  async ARM_Extend() {
    var ret = await axios_entity.get(`api/VMS/Fork/Arm/Extend`)
    return ret.data;
  },

  /**枒杈縮回 */
  async ARM_Shorten() {
    var ret = await axios_entity.get(`api/VMS/Fork/Arm/Shorten`)
    return ret.data;
  },
  /**枒杈停止 */
  async ARM_Stop() {
    var ret = await axios_entity.get(`api/VMS/Fork/Arm/Stop`)
    return ret.data;
  },

  async Init() {
    var ret = await axios_entity.get(`api/VMS/Fork/Init`)
    return ret.data;
  },
  async Home(speed = 1.0) {
    var ret = await axios_entity.get(`api/VMS/Fork/Home?speed=${speed}`)
    return ret.data;
  },

  async Pose(pose, speed = 1.0) {
    var ret = await axios_entity.get(`api/VMS/Fork/Pose?pose=${pose}&speed=${speed}`)
    return ret.data;
  },
  async Stop() {
    var ret = await axios_entity.get(`api/VMS/Fork/Stop`)
    return ret.data;
  },
  async Up(speed = 1.0) {
    var ret = await axios_entity.get(`api/VMS/Fork/Up?speed=${speed}`)
    return ret.data;
  },
  async Down(speed = 1.0) {
    var ret = await axios_entity.get(`api/VMS/Fork/Down?speed=${speed}`)
    return ret.data;
  },
  async SetTagHeightLimit(tag_id, pose_loc, layer, height) {
    return true
  }

}
