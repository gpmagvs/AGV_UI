<template>
  <div @click="HandleClicked" class="fork-height">
    <div v-bind:class="IsForkHeightAboveSafty ? 'bg-warning text-light border' : ''"> {{ height }} <span>cm</span>
    </div>
    <!-- <div>{{ time }}</div> -->
  </div>
</template>

<script>
import { AGVStatusStore, UIStore } from '@/store'
import { MAIN_TAB, OPERATOR_TAB } from '@/constants/tabPages'
export default {
  data() {
    return {
    }
  },
  computed: {
    height() {
      return AGVStatusStore.getters.AGVStatus.ZAxisDriverState.position.toFixed(3);
    },
    IsForkHeightAboveSafty() {
      return AGVStatusStore.getters.AGVStatus.IsForkHeightAboveSafty;
    },

  },
  methods: {
    HandleClicked() {
      UIStore.dispatch('navigateTabPage', {
        main: MAIN_TAB.OPERATION,
        operator: OPERATOR_TAB.FORK
      })
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