<template>
  <div class="fork-controller">
    <div class="d-flex flex-row">
      <div>
        <div @mousedown="ForkClick" v-bind:style="ForkStyle" class="fork">
          <span>{{ ForkHeight }} mm</span>
        </div>
        <img src="/images/agv_lift.png" width="300" alt />
      </div>
      <div class="flex-fill"></div>
      <div
        class="control-buttons px-2 border m-1 bg-light d-flex flex-column justify-content-start"
      >
        <span class="border-bottom">升降控制</span>
        <b-button @click="Up" variant="primary my-1">上點位</b-button>
        <b-button @click="Up" variant="primary my-1">Up</b-button>
        <b-button @click="Orig" variant="success my-1">Home</b-button>
        <b-button @click="Stop" variant="danger my-1">Stop</b-button>
        <b-button @click="Down" variant="primary my-1">下</b-button>
        <b-button @click="Down" variant="primary my-1">下點位</b-button>
      </div>
      <div
        class="control-buttons px-2 border m-1 bg-light d-flex flex-column justify-content-start"
      >
        <span class="border-bottom">伸縮控制</span>
        <b-button @click="Up" variant="primary my-1">牙叉伸出</b-button>
        <b-button @click="Up" variant="primary my-1">牙叉縮回</b-button>
        <b-button @click="Orig" variant="danger my-1">牙叉停止動作</b-button>
      </div>
    </div>
  </div>
</template>

<script>
import { ForkAPI } from '@/api/VMSAPI';
import { AGVStatusStore, ForkTeachStore } from '@/store'

export default {
  data() {
    return {
      isZAxisMoving: false,
      show_teach_page: false,
      hardware_limit_enable: true
    }
  },
  computed: {
    ForkHeight() {
      return AGVStatusStore.getters.ForkHeight
    },
    ForkStyle() {
      return {
        bottom: `${-380 + this.ForkHeight * 10}px`
      }
    }
  },
  methods: {
    async Up() {
      this.isZAxisMoving = true;
      var ret = await ForkAPI.Up();
      this.isZAxisMoving = false;
    },
    async Down() {
      this.isZAxisMoving = true;
      var ret = await ForkAPI.Down();
      this.isZAxisMoving = false;
    },
    async Orig() {
      this.isZAxisMoving = true;
      var ret = await ForkAPI.Home();
      this.isZAxisMoving = false;
    },
    async Stop() {
      var ret = await ForkAPI.Stop();
    },
    async Pose() {

      this.isZAxisMoving = true;
      var ret = await ForkAPI.Pose(1.2);
      this.isZAxisMoving = false;
    },
    ShowTeachView() {
      if (this.$refs['fork_teach'])
        this.$refs['fork_teach'].reload();
      this.show_teach_page = true;
    },
    TeachDrawerClosingHandle() {
      if (ForkTeachStore.getters.IsAnyChanged) {
        this.$swal.fire({
          icon: 'warning',
          text: '教點資料已修改但尚未儲存，確定要離開?',
          showConfirmButton: true,
          showCancelButton: true
        }).then(user_response => {
          if (!user_response.isConfirmed) {
            this.show_teach_page = true
          }
          else {
          }
        })
      }
    }
  },
}
</script>

<style lang="scss" scoped>
.fork-controller {
  .control-buttons {
    width: 160px;
    button {
      height: 50px;
    }
    span {
      color: grey;
    }
  }
  padding-left: 30px;
  .fork {
    position: relative;
    height: 30px;
    width: 240px;
    left: 60px;
    bottom: -380px;
    background-color: orange;
    border-top-right-radius: 5px;
    border-bottom-right-radius: 5px;

    cursor: pointer;
    span {
      font-size: 30px;
      position: relative;
      bottom: 50px;
      color: grey;
    }
  }
}
</style>