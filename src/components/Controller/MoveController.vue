<template>
  <div class="move-controller">
    <div class="bg-img">
      <div class="directions">
        <div class="up">
          <img src="/images/up-arrow.png" :width="icon_size" alt />
        </div>
        <!-- <img class="bg-img" src="/images/agv_controller_bg.png" width="600" alt /> -->
        <div class="w-100 justify-content-center rotate-png-row d-flex">
          <div>
            <img src="/images/rotate-left.png" :width="icon_size" alt />
          </div>
          <div>
            <img src="/images/rotate-right.png" :width="icon_size" alt />
          </div>
        </div>
        <div class="down">
          <img src="/images/down-arrow.png" :width="icon_size" alt />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      icon_size: 130
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
      div {
        margin-inline: 100px;
      }
      div:hover {
        cursor: pointer;
      }
    }
    // padding-top: 100px;
  }
}
</style>