<template>
  <div class="fork-controller">
    <div class="d-flex flex-row bg-warning">
      <div>
        <div @mousedown="ForkClick" v-bind:style="ForkStyle" class="fork">
          <span>{{ ForkHeight }} mm</span>
        </div>
        <img src="/images/agv_lift.png" width="300" alt />
      </div>
      <div class="flex-fill"></div>
      <div class="control-buttons px-2 bg-dark d-flex flex-column justify-content-center">
        <b-button variant="primary my-1">上點位</b-button>
        <b-button variant="primary my-1">Up</b-button>
        <b-button variant="light my-1">Home</b-button>
        <b-button variant="danger my-1">Stop</b-button>
        <b-button variant="primary my-1">下</b-button>
        <b-button variant="primary my-1">下點位</b-button>
      </div>
    </div>
  </div>
</template>

<script>
export default {

}
</script>

<style lang="scss" scoped>
.fork-controller {
  .control-buttons {
    width: 160px;
    button {
      height: 50px;
    }
  }
  padding-left: 30px;
  .fork {
    position: absolute;
    height: 30px;
    width: 240px;
    left: 95px;
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