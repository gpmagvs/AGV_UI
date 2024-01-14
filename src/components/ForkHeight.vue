<template>
  <div class="fork-height">
    <div> {{ height }} <span>cm</span>
    </div>
    <!-- <div>{{ time }}</div> -->
  </div>
</template>

<script>
import bus from '@/event-bus.js'
import { AGVStatusStore } from '@/store'
export default {
  data() {
    return {
    }
  },
  computed: {
    height() {
      return AGVStatusStore.getters.AGVStatus.ZAxisDriverState.position.toFixed(3)
    }
  },
  mounted() {

  },
}
</script>

<style lang="scss">
.fork-height {
  font-size: 20px;

  span {
    font-size: smaller;
  }
}
</style>