import { createStore } from 'vuex'
import { Login } from '@/api/UserAPI';
import UserInfo from '@/ViewModels/UserInfo.js'
import VMSData from '@/ViewModels/VMSData';
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
    AGVStatus: new VMSData()
  },
  getters: {
    AGVStatus: state => {
      return state.AGVStatus;
    },
    AGVName: state => {
      return state.AGVStatus.CarName;
    },
    AlarmCodes: state => {
      return state.AGVStatus.AlarmCodes;
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
    }

  },
  mutations: {
    updateStatus(state, data) {
      state.DIOStates = data
    }
  }
})