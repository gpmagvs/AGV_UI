import { createStore } from 'vuex'
import '@/api/WebRos.js'
import { KeyboardControlEnable, Stop, linear_speed, angular_speed } from '@/api/WebRos.js'


export var ROS_STORE = createStore({
    state: {
        keyboard_move_enable: false,
    },
    getters: {
        linear_speed: state => {
            return linear_speed
        },
        angular_speed: state => {
            return angular_speed
        }
    },
    mutations: {
        setKeyBoardMoveEnable(state, enable) {
            state.keyboard_move_enable = enable;
            KeyboardControlEnable(enable)
        }
    },
    actions: {
        keyboard_move_enable({ commit }, enable) {
            commit('setKeyBoardMoveEnable', enable)
        },
        force_stop({ commit }) {
            Stop();
        }
    }
})