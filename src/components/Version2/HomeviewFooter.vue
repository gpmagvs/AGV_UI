<template>
  <div class="home-view-footer fixed-bottom d-flex justify-content-center">
    <div class="system-controls flex-fill d-flex">
      <b-button>初始化</b-button>
      <b-button>異常復歸</b-button>
      <b-button>關閉蜂鳴器</b-button>
      <b-button>移除卡匣</b-button>
    </div>
    <div class="icons d-flex justify-content-end">
      <div class="py-1" @click="HomeIconClick">
        <img src="/images/home.png" width="90" alt />
      </div>
      <div @click="ControllerIconClick">
        <img src="/images/controller.png" width="100" alt />
      </div>
      <div @click="ControllerIconClick">
        <img src="@/assets/emo.png" width="100" alt />
      </div>
    </div>
  </div>
</template>

<script>
export default {

  methods: {
    ControllerIconClick() {
      this.$router.push('/v2/controller/move')
    },
    HomeIconClick() {
      this.$router.push('/v2')
    }
  },
}
</script>

<style lang="scss" scoped>
.home-view-footer {
  height: 105px;
  background-color: grey;
  .system-controls {
    button {
      font-size: 25px;
      width: 151px;
      margin-inline: 2px;
    }
  }
  .icons {
    padding-right: 25px;
    div {
      width: 110px;
      height: 100px;
      margin-inline: 2px;
    }
    div:hover {
      cursor: pointer;
      background-color: rgb(13, 110, 253);
      border: 1px solid black;
    }
  }
}
</style>