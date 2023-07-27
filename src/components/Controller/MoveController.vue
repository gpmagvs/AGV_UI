<template>
  <div class="move-controller">
    <div class="d-flex flex-row">
      <div class="bg-img">
        <div class="directions">
          <div class="up">
            <img @click="MOVE_UP" src="/images/up-arrow.png" :width="icon_size" alt />
          </div>
          <!-- <img class="bg-img" src="/images/agv_controller_bg.png" width="600" alt /> -->
          <div class="w-100 justify-content-center rotate-png-row d-flex">
            <div>
              <img @click="MOVE_LEFT" src="/images/rotate-left.png" :width="icon_size" alt />
            </div>
            <div>
              <!-- <img src="/images/rotate-right.png" :width="icon_size" alt /> -->
              <b-button @click="MOVE_STOP" variant="danger">STOP</b-button>
            </div>
            <div>
              <img @click="MOVE_RIGHT" src="/images/rotate-right.png" :width="icon_size" alt />
            </div>
          </div>
          <div class="down">
            <img @click="MOVE_DOWN" src="/images/down-arrow.png" :width="icon_size" alt />
          </div>
        </div>
      </div>
      <div class="options d-flex flex-column justify-content-center p-3 bg-warning">
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
    </div>
  </div>
</template>

<script>
import { MOVEControl } from '@/api/VMSAPI';
export default {
  data() {
    return {
      icon_size: 130,
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
}
</script>

<style lang="scss" scoped>
.move-controller {
  width: 100%;
  height: 100%;
  .bg-img {
    width: 100%;
    height: 100%;
    background: url("../../assets/images/agv_controller_bg.png");
    background-size: 450px;
    background-repeat: no-repeat;
    background-position: center;
  }
  .directions {
    margin-top: 20px;
    .rotate-png-row {
      height: 180px;
      padding-top: 20px;
      button {
        font-size: 50px;
        margin-top: 15px;
      }
      div {
        margin-inline: 14px;
      }
      div:hover {
        cursor: pointer;
      }
    }
    // padding-top: 100px;
  }
  .options {
    .speed-item-container {
      div {
        width: 122px;
        text-align: left;
      }
    }
  }
}
</style>