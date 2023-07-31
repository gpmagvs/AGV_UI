<template>
  <div class="py-5" style="height:680px;width:100%;padding-inline:5px">
    <div class="d-flex flex-row">
      <div class="switch-btn">
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
      <div class="flex-fill bg-light">
        <router-view
          class="d-flex flex-fill bg-light flex-column justify-content-center w-100"
          v-slot="{ Component }"
        >
          <keep-alive>
            <component :is="Component" />
          </keep-alive>
        </router-view>
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
  methods: {
    controllSwitch(action) {
      this.action = action;
      this.$router.push(action);
    }
  },
  computed: {
    currentRoute() {
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
.switch-btn {
  img {
    border-radius: 100px;
  }
}
</style>