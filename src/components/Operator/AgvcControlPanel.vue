<template>
  <div>
    <div
      v-loading="!enabled"
      :element-loading-spinner="false"
      element-loading-background="rgba(0,0,0,0)"
      ref="agvc_ctrl_pnl"
      class="agvc-control-panel keys pt-4 p-3"
      style="width:400px"
    >
      <div v-if="speed_modifyable" class="w-100 bg-light text-start px-2 py-3">
        <div class="speed-item-container d-flex flex-row">
          <div>Linear Speed</div>
          <!-- <KeyboardInput v-model="linear_speed"></KeyboardInput> -->
          <el-input-number size="large" v-model="linear_speed" :step="0.1" :max="1" :min="0.01"></el-input-number>
        </div>
        <div class="speed-item-container d-flex flex-row">
          <div>Rotation Speed</div>
          <el-input-number
            size="large"
            v-model="rotation_speed"
            :step="0.01"
            :max="0.3"
            :min="0.01"
          ></el-input-number>
        </div>
      </div>
      <table class="w-100">
        <tbody>
          <tr align="center">
            <td>
              <div :class="active_state"></div>
            </td>
            <td>
              <div :class="active_state" @click="MOVE_UP()">
                <i class="bi bi-arrow-up"></i>
              </div>
            </td>
            <td>
              <div :class="active_state"></div>
            </td>
          </tr>
          <tr align="justify">
            <td>
              <div :class="active_state" @click="MOVE_LEFT()">
                <i class="bi bi-arrow-left"></i>
              </div>
            </td>
            <td>
              <div :class="active_state" @click="MOVE_STOP()">
                <i class="bi bi-sign-stop"></i>
              </div>
            </td>
            <td>
              <div :class="active_state" @click="MOVE_RIGHT()">
                <i class="bi bi-arrow-right"></i>
              </div>
            </td>
          </tr>
          <tr align="justify">
            <td>
              <div :class="active_state"></div>
            </td>
            <td>
              <div :class="active_state" @click="MOVE_DOWN()">
                <i class="bi bi-arrow-down"></i>
              </div>
            </td>
            <td>
              <div @click="speed_modifyable=!speed_modifyable" :class="active_state"></div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { MOVEControl } from '@/api/VMSAPI';
import KeyboardInput from '@/components/UIComponents/keyboard-number-input.vue'
export default {
  components: {
    KeyboardInput,
  },
  props: {
    enabled: {
      type: Boolean,
      default: false,
    },

  },
  data() {
    return {
      linear_speed: 0.2,
      rotation_speed: 0.2,
      speed_modifyable: false
    }
  },
  methods: {
    async MOVE_UP() {
      await MOVEControl.AGVMove_UP(this.linear_speed);
    },
    async MOVE_DOWN() {
      await MOVEControl.AGVMove_DOWN(this.linear_speed);
    },
    async MOVE_LEFT() {
      await MOVEControl.AGVMove_LEFT(this.rotation_speed);
    },
    async MOVE_RIGHT() {
      await MOVEControl.AGVMove_RIGHT(this.rotation_speed);
    },
    async MOVE_STOP() {
      await MOVEControl.AGVMove_STOP();
    }
  },
  computed: {
    active_state() {
      return this.enabled ? 'active' : 'inactive';
    }
  },
}
</script>

<style scoped lang="scss">
.speed-item-container {
  div {
    width: 120px;
  }
}
.agvc-control-panel {
  table {
    td {
      div {
        background-color: rgb(202, 202, 202);
        margin: 5px;
        width: 90%;
        text-align: center;
        height: 80px;
        border-radius: 3px;
        border: 1px solid grey;
        i {
          font-size: 50px;
          position: relative;
          top: 5px;
        }
        &:active {
          background-color: red;
          color: white;
        }
      }
      .active {
        background-color: white;
      }
      .inactive {
        background-color: rgb(202, 202, 202);
      }
    }
  }
}
</style>