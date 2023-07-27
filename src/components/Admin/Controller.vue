<template>
  <div style="height:580px;">
    <div class="switch d-flex justify-content-between p-1">
      <div v-if="currentRoute=='/v2/controller/fork'">
        <img
          @click="controllSwitch('move')"
          class="border bg-dark"
          src="/images/move.png"
          width="90"
          alt
        />
      </div>
      <div v-if="currentRoute=='/v2/controller/move'">
        <img
          @click="controllSwitch('fork')"
          class="border bg-dark"
          src="/images/lift.png"
          width="90"
          alt
        />
      </div>
    </div>
    <router-view
      class="d-flex flex-fill bg-light flex-column justify-content-center w-100"
      v-slot="{ Component }"
    >
      <keep-alive>
        <component :is="Component" />
      </keep-alive>
    </router-view>
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
  methods: {
    controllSwitch(action) {
      this.action = action;
      this.$router.push(action);
    }
  },
  computed: {
    currentRoute() {
      debugger
      var route = this.$route.path;
      return route
    }
  }
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
  // height: 500px;
  // background: url("../../assets/images/agv_controller_bg.png");
  // background-size: 500px;
  // background-repeat: no-repeat;
  // background-position: center;

  // .up,
  // .down,
  // .rotate-png-row {
  //   position: relative;

  //   img:hover {
  //     background-color: rgba(9, 76, 176, 0.37);
  //     border-radius: 100px;
  //   }
  //   img:active {
  //     padding: 5px;
  //   }
  // }

  // .up {
  //   bottom: 55px;
  // }
  // .down {
  //   bottom: -20px;
  // }
  // .rotate-png-row {
  //   top: 0px;
  //   div {
  //     margin-inline: 140px;
  //   }
  // }
}
</style>