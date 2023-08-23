import { createStore } from 'vuex'
import { Login } from '@/api/UserAPI';
import UserInfo from '@/ViewModels/UserInfo.js'
import VMSData from '@/ViewModels/VMSData';
import clsSensorStatus from '@/ViewModels/clsSensorStatus';
import bus from '@/event-bus';
export default createStore({
  state: {
  },
  getters: {
  },
  mutations: {
  },
  actions: {
  },
  modules: {
  }
})

export var UIStore = createStore({
  state: {
    UI_Version: 2,
    PreviousControllRoute: 'move'
  },
  getters: {
    CurrentUIVersion: state => {
      return state.UI_Version;
    },
    PreviousControllRoute: state => {
      return state.PreviousControllRoute;
    }
  },
  mutations: {
    SetPreviousControllerRoute(state, route) {
      state.PreviousControllRoute = route;
    }
  },
  actions: {


  }
})

export var RDTestDataStore = createStore({
  state: {
    TestData: {
      move_test: {
        duration: 0,
        state: 0
      }
    }
  },
  getters: {
    testData: state => {
      return state.TestData;
    }
  },
  mutations: {
    SetData(state, data) {
      state.TestData = data;
    }
  },
  actions: {

  }
})

/**系統訊息STORE */
export var SystemMsgStore = createStore({
  state: {
    SysMessages: {
      ReportIndex: -1,
      Messages: []
    }
  },
  getters: {
    SysMessages: state => {
      return state.SysMessages.Messages;
    },
    ReportIndex: state => {
      return state.SysMessages.ReportIndex
    },
    LastReportIndex: state => {
      var index = localStorage.getItem('sys_msg_report_index');
      if (index)
        return parseInt(index)
      else
        return -1;
    }
  },
  mutations: {
    updateStatus(state, data) {
      if (state.SysMessages.ReportIndex != data.ReportIndex) {
        localStorage.setItem('sys_msg_report_index', data.ReportIndex + '')
      }
      state.SysMessages = data
    }
  },
  actions: {
    Update({ commit }, data) {
      commit('updateStatus', data)
    }
  }
})

/**AGV狀態STORE */
export var AGVStatusStore = createStore({
  state: {
    AGVStatus: new VMSData(),
    SensorStatus: {
      LaserFront: new clsSensorStatus('前方雷射', 0, 155),
      LaserBack: new clsSensorStatus('後方雷射', 0, -155, 'left-bottom'),
      LaserRight: new clsSensorStatus('右方雷射', 80, -125, 'right-top'),
      LaserLeft: new clsSensorStatus('左方雷射', -80, -125),
      Bumper: new clsSensorStatus('Bumper', 70, 155, 'right-top'),
      Bumper_back: new clsSensorStatus('Bumper', 70, -155, 'right-bottom'),
      RightWheel: new clsSensorStatus('右輪馬達', 35, 0, 'right'),
      LeftWheel: new clsSensorStatus('左輪馬達', -35, 0, 'left'),
      VerticalWheel: new clsSensorStatus('垂直軸馬達', 0, -85),
      VerticalBelt: new clsSensorStatus('垂直軸馬達皮帶', 30, -85, 'right-top'),
      ForkFrontendObstacle: new clsSensorStatus('牙叉障礙物', -40, 120, 'left-bottom'),
      ForkArmPosition: new clsSensorStatus('牙叉伸縮位置', 40, 120, 'right-bottom'),
      // SickLidar: new clsSensorStatus('Sick'),
    }
  },
  getters: {
    AGVStatus: state => {
      return state.AGVStatus;
    },
    AGVName: state => {
      return state.AGVStatus.CarName;
    },
    AlarmCodes: state => {
      return state.AGVStatus.AlarmCodes.filter(alarm => alarm.Code != 0);
    },
    AlarmGroup: state => {
      return state.AGVStatus.AlarmsGroup;
    },
    /**是否為巡檢AGV */
    IsInspectionAGV: state => {
      return state.AGVStatus.Agv_Type == 2;
    },
    /**是否為Fork AGV */
    IsForkAGV: state => {
      return state.AGVStatus.Agv_Type == 0;
    },
    CurrentPose: state => {
      return state.AGVStatus.Pose;
    },
    CurrentAngle: state => {
      return state.AGVStatus.Angle;
    },
    BatteryStatus: state => {
      return state.AGVStatus.BatteryStatus
    },
    ForkHeight: state => {
      return state.AGVStatus.ZAxisDriverState.position
    },
    AGV_Sensors_States: state => {
      if (DIOStore.getters.DIOStates.Inputs == undefined) {
        return {}
      }
      var agv_status = state.AGVStatus
      //aim : 整合DIO狀態給出AGV周邊設備狀態
      state.SensorStatus.LaserFront.active = !DIOStore.getters.IsLaserFrontByass;
      state.SensorStatus.LaserFront.status = DIOStore.getters.IsLaserFrontAlarm ? 2 : (DIOStore.getters.IsLaserFrontWarning ? 1 : 0);
      state.SensorStatus.LaserBack.active = !DIOStore.getters.IsLaserBackByass;
      state.SensorStatus.LaserBack.status = DIOStore.getters.IsLaserBackAlarm ? 2 : (DIOStore.getters.IsLaserBackWarning ? 1 : 0);


      state.SensorStatus.LaserRight.active = !DIOStore.getters.IsLaserRightByass;
      state.SensorStatus.LaserRight.status = DIOStore.getters.IsLaserRightAlarm ? 2 : 0;

      state.SensorStatus.LaserLeft.active = !DIOStore.getters.IsLaserLeftByass;
      state.SensorStatus.LaserLeft.status = DIOStore.getters.IsLaserLeftAlarm ? 2 : 0;


      state.SensorStatus.Bumper.status = DIOStore.getters.IsBumperTrigger ? 2 : 0;
      state.SensorStatus.Bumper_back.status = DIOStore.getters.IsBumperTrigger ? 2 : 0;
      //Drivers
      state.SensorStatus.RightWheel.status = DIOStore.getters.IsRightMotorAlarm ? 2 : 0;

      state.SensorStatus.LeftWheel.status = DIOStore.getters.IsLeftMotorAlarm ? 2 : 0;

      state.SensorStatus.VerticalWheel.status = DIOStore.getters.IsVerticalMotorAlarm ? 2 : 0;
      state.SensorStatus.VerticalBelt.status = DIOStore.getters.IsVerticalBeltAlarm ? 2 : 0;
      state.SensorStatus.ForkFrontendObstacle.status = DIOStore.getters.IsForkFronendObstacle ? 2 : 0;
      state.SensorStatus.ForkArmPosition.status = !DIOStore.getters.Fork_ARM_States.IsArmAtHomePose ? 1 : 0;


      var isForkAGV = state.AGVStatus.Agv_Type == 0;
      state.SensorStatus.VerticalWheel.visible = isForkAGV
      state.SensorStatus.VerticalBelt.visible = isForkAGV
      state.SensorStatus.ForkFrontendObstacle.visible = isForkAGV
      state.SensorStatus.ForkArmPosition.visible = isForkAGV


      return state.SensorStatus;
    },
    CurrentTag: state => {
      return state.AGVStatus.BCR_State_MoveBase.tagID
    }

  },
  mutations: {
    updateStatus(state, data) {
      state.AGVStatus = data
    }
  }
})

/**用戶狀態STORE */
export var UserStore = createStore({
  state: {
    UserState: {
      UserName: 'OPERATOR',
      Role: 0
    }
  },
  getters: {
    CurrentUserName: state => {
      if (state.UserState.UserName)
        return state.UserState.UserName;
      else
        return 'OPERATOR'
    },
    IsGodUser: state => {
      return state.UserState.Role == 3;
    },
    IsDevUser: state => {
      return state.UserState.Role == 2;
    },
    CurrentUserRole: state => {
      return state.UserState.Role;
    }

  },
  mutations: {
    setUser(state, user_info) {
      state.UserState = user_info
      localStorage.setItem('user', JSON.stringify(user_info))
    }
  },
  actions: {
    async Login({ commit }, login_info) {
      var response_data = await Login(login_info)
      if (response_data != undefined) {
        var _UserInfo = new UserInfo(response_data.UserName, response_data.Role);
        commit('setUser', _UserInfo)
      }
      else {
        commit('setUser', {})
      }

      return response_data;
    },
    Logout({ commit }) {
      commit('setUser', {
        UserName: 'OPERATOR',
        Role: 0
      }
      )
    }
  }
})


/**DIO狀態STORE */
export var DIOStore = createStore({
  state: {
    DIOStates: {
    }
  },
  getters: {
    DIOStates: state => {
      return state.DIOStates;
    },
    IsE84UseEmu: state => {
      if (state.DIOStates.IsE84HsUseEmulator == undefined)
        return false;
      return state.DIOStates.IsE84HsUseEmulator
    },
    E84_AGV: state => {
      if (state.DIOStates.Outputs == undefined) {
        return [0, 0, 0, 0, 0, 0, 0, 0]
      }
      let outputs = [];
      var agv_e84_address = ['Y0020', 'Y0021', 'Y0022', 'Y0023', 'Y0024', 'Y0025', 'Y0026', 'Y0027']
      for (let index = 0; index < agv_e84_address.length; index++) {
        var address = agv_e84_address[index];
        var register_state = state.DIOStates.Outputs.find(reg => reg.Address + '' == address + '')
        outputs.push(register_state.State ? 1 : 0)
      }
      return outputs
    },
    E84_EQ: state => {

      let outputs = [];
      if (state.DIOStates.IsE84HsUseEmulator) {
        if (state.DIOStates.Outputs == undefined) {
          return [0, 0, 0, 0, 0, 0, 0, 0]
        }
        var eq_e84_address = ['Y0000', 'Y0001', 'Y0002', 'Y0003', 'Y0004', 'Y0005', 'Y0006', 'Y0007']
        for (let index = 0; index < eq_e84_address.length; index++) {
          var address = eq_e84_address[index];
          var register_state = state.DIOStates.Outputs.find(reg => reg.Address + '' == address + '')
          outputs.push(register_state.State ? 1 : 0)
        }
      }
      else {
        if (state.DIOStates.Inputs == undefined) {
          return [0, 0, 0, 0, 0, 0, 0, 0]
        }
        var eq_e84_address = ['X0020', 'X0021', 'X0022', 'X0023', 'X0024', 'X0025', 'X0026', 'X0027']
        for (let index = 0; index < eq_e84_address.length; index++) {
          var address = eq_e84_address[index];
          var register_state = state.DIOStates.Inputs.find(reg => reg.Address + '' == address + '')
          outputs.push(register_state.State ? 1 : 0)
        }
      }

      return outputs
    },
    Fork_ARM_States: state => {

      if (state.DIOStates.Inputs == undefined) {
        return {
          IsArmAtHomePose: false,
          IsArmAtEndPose: true
        }
      }
      var Inputs = state.DIOStates.Inputs;
      var IsArmAtHomePose = !Inputs.find(reg => reg.Address == 'X0001').State
      var IsArmAtEndPose = !Inputs.find(reg => reg.Address == 'X0000').State

      return {
        IsArmAtHomePose: IsArmAtHomePose,
        IsArmAtEndPose: IsArmAtEndPose
      }
    },
    IsLaserFrontAlarm: state => {
      if (state.DIOStates.Inputs == undefined)
        return false
      var Inputs = state.DIOStates.Inputs;
      return !Inputs.find(reg => reg.Address == 'X0032').State
    },

    IsLaserFrontWarning: state => {
      if (state.DIOStates.Inputs == undefined)
        return false
      var Inputs = state.DIOStates.Inputs;
      var region1 = !Inputs.find(reg => reg.Address == 'X0030').State
      var region2 = !Inputs.find(reg => reg.Address == 'X0031').State
      var region3 = !Inputs.find(reg => reg.Address == 'X0032').State
      return (region1 | region2) & !region3
    },

    IsLaserBackAlarm: state => {
      if (state.DIOStates.Inputs == undefined)
        return false
      var Inputs = state.DIOStates.Inputs;
      return !Inputs.find(reg => reg.Address == 'X0036').State
    },

    IsLaserBackWarning: state => {
      if (state.DIOStates.Inputs == undefined)
        return false
      var Inputs = state.DIOStates.Inputs;
      var region1 = !Inputs.find(reg => reg.Address == 'X0034').State
      var region2 = !Inputs.find(reg => reg.Address == 'X0035').State
      var region3 = !Inputs.find(reg => reg.Address == 'X0036').State
      return (region1 | region2) & !region3
    },

    IsLaserRightAlarm: state => {
      if (state.DIOStates.Inputs == undefined)
        return false
      var Inputs = state.DIOStates.Inputs;
      return !Inputs.find(reg => reg.Address == 'X000F').State
    },

    IsLaserLeftAlarm: state => {
      if (state.DIOStates.Inputs == undefined)
        return false
      var Inputs = state.DIOStates.Inputs;
      return !Inputs.find(reg => reg.Address == 'X000E').State
    },

    IsLaserFrontByass: state => {
      if (state.DIOStates.Inputs == undefined)
        return false
      var Outputs = state.DIOStates.Outputs;
      return Outputs.find(reg => reg.Name == 'Front_LsrBypass').State
    },
    IsLaserBackByass: state => {
      if (state.DIOStates.Inputs == undefined)
        return false
      var Outputs = state.DIOStates.Outputs;
      return Outputs.find(reg => reg.Name == 'Back_LsrBypass').State
    },
    IsLaserLeftByass: state => {
      if (state.DIOStates.Inputs == undefined)
        return false
      var Outputs = state.DIOStates.Outputs;
      return Outputs.find(reg => reg.Name == 'Left_LsrBypass').State
    },
    IsLaserRightByass: state => {
      if (state.DIOStates.Inputs == undefined)
        return false
      var Outputs = state.DIOStates.Outputs;
      return Outputs.find(reg => reg.Name == 'Right_LsrBypass').State
    },
    IsBumperTrigger: state => {
      if (state.DIOStates.Inputs == undefined)
        return false
      var Inputs = state.DIOStates.Inputs;
      return !Inputs.find(reg => reg.Address == 'X000A').State
    },
    IsRightMotorAlarm: state => {
      if (state.DIOStates.Inputs == undefined)
        return false
      var Inputs = state.DIOStates.Inputs;
      return !Inputs.find(reg => reg.Address == 'X0015').State
    },

    IsLeftMotorAlarm: state => {
      if (state.DIOStates.Inputs == undefined)
        return false
      var Inputs = state.DIOStates.Inputs;
      return !Inputs.find(reg => reg.Address == 'X0017').State
    },

    IsVerticalMotorAlarm: state => {
      if (state.DIOStates.Inputs == undefined)
        return false
      var Inputs = state.DIOStates.Inputs;
      return !Inputs.find(reg => reg.Address == 'X0019').State
    },
    IsVerticalBeltAlarm: state => {
      if (state.DIOStates.Inputs == undefined)
        return false
      var Inputs = state.DIOStates.Inputs;
      return !Inputs.find(reg => reg.Address == 'X002C').State
    },
    IsForkFronendObstacle: state => {
      if (state.DIOStates.Inputs == undefined)
        return false
      var Inputs = state.DIOStates.Inputs;
      return !Inputs.find(reg => reg.Address == 'X0011').State
    },


  },
  mutations: {
    updateStatus(state, data) {
      state.DIOStates = data
    }
  }
})

export var ForkTeachStore = createStore({
  state: {
    HasAnyChanged: false
  },
  getters: {
    IsAnyChanged: state => {
      return state.HasAnyChanged;
    }
  },
  mutations: {
    setIsAnyChanged(state, HasAnyChanged) {
      state.HasAnyChanged = HasAnyChanged;
    }
  }
})