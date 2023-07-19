<template>
  <div class="admin">
    <div class="switch d-flex justify-content-between px-5 my-3">
      <div v-if="action=='move'" @click="action='lift'">
        <img class="border bg-dark" src="/images/lift.png" width="90" alt />
      </div>
      <div v-if="action=='lift'" @click="action='move'">
        <img class="border bg-dark" src="/images/move.png" width="90" alt />
      </div>
    </div>
    <AdminForkVue v-if="action=='lift'"></AdminForkVue>
    <div v-else class="controller w-100">
      <div class="up">
        <img src="/images/up-arrow.png" width="160" alt />
      </div>
      <!-- <img class="bg-img" src="/images/agv_controller_bg.png" width="600" alt /> -->
      <div class="w-100 justify-content-center rotate-png-row d-flex">
        <div>
          <img src="/images/rotate-left.png" width="160" alt />
        </div>
        <div>
          <img src="/images/rotate-right.png" width="160" alt />
        </div>
      </div>
      <div class="down">
        <img src="/images/down-arrow.png" width="160" alt />
      </div>
    </div>
  </div>
</template>

<script>
import AdminForkVue from './AdminFork.vue'
export default {
  components: {
    AdminForkVue,
  },
  data() {
    return {
      action: 'move'
    }
  },
}
</script>

<style lang="scss" scoped>
img {
  cursor: pointer;
}
.switch {
  img {
    border-radius: 100px;
  }
}
.controller {
  padding-top: 80px;
  height: 600px;
  background: url("../../assets/images/agv_controller_bg.png");
  background-size: 600px;
  background-repeat: no-repeat;
  background-position: center;

  .up,
  .down,
  .rotate-png-row {
    position: relative;

    img:hover {
      background-color: rgba(9, 76, 176, 0.37);
      border-radius: 100px;
    }
    img:active {
      padding: 5px;
    }
  }

  .up {
    bottom: 55px;
  }
  .down {
    bottom: -20px;
  }
  .rotate-png-row {
    top: 0px;
    div {
      margin-inline: 140px;
    }
  }
}
</style>