<template>
  <div class="p-1">
    <div class="d-flex flex-row h-100">
      <div class="button-group d-flex flex-column px-2 h-100 border">
        <b-button @click="selected='input'" :variant="input_btn_class" class="border my-1">INPUT</b-button>
        <b-button @click="selected='output'" :variant="output_btn_class" class="border my-1">OUTPUT</b-button>
      </div>
      <div class="io-table-container flex-fill w-100">
        <div v-show="selected=='input'">
          <IOTableVue :table_data="IOData.Inputs"></IOTableVue>
        </div>
        <div v-show="selected=='output'">
          <IOTableVue :table_data="IOData.Outputs" :useToggle="true"></IOTableVue>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import IOTableVue from '../Operator/IOTable.vue'
import { DIOStore } from '@/store'
export default {
  components: {
    IOTableVue,
  },
  data() {
    return {
      selected: 'input'
    }
  },
  computed: {
    IOData() {
      return DIOStore.getters.DIOStates;
    },
    input_btn_class() {
      return this.selected == 'input' ? 'primary' : ''
    },

    output_btn_class() {
      return this.selected == 'input' ? '' : 'primary'
    }
  },
}
</script>

<style lang="scss" scoped>
.button-group {
  button {
    font-size: 30px;
  }
}
.io-table-container {
  div {
    overflow-y: scroll;
  }
}
</style>