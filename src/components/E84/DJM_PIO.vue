<template>
  <div class="djm-pio border rounded mx-1 py-3 px-5">
    <h3 class="border-bottom text-primary">{{ Owner }}</h3>

    <div class="d-flex">
      <div>
        <div v-for="(state,name) in HandshakeSignals.AGV" :key="name" class="d-flex">
          <div class="signal-name">{{name}}</div>
          <div
            @click="SignalWriteChangeHandler('AGV',name)"
            class="border signal-div rounded"
            v-bind:style="{ 
              backgroundColor: state?'rgb(0, 204, 0)': 'grey',
            }"
          >{{ state? 'ON':'OFF' }}</div>
        </div>
      </div>
      <div class="mx-5">
        <div v-for="(state,name) in HandshakeSignals.EQ" :key="name" class="d-flex">
          <div class="signal-name">{{name}}</div>
          <div
            @click="SignalWriteChangeHandler('EQ',name)"
            class="border signal-div rounded"
            v-bind:style="{ 
              backgroundColor: state?'rgb(0, 204, 0)': 'grey',
            }"
          >{{ state? 'ON':'OFF' }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { AGVStatusStore, UserStore, DIOStore } from '@/store'
import { DIO } from '@/api/VMSAPI'
export default {
  props: {
    Owner: {
      type: String,
      default: 'AGV'
    },
  },
  data() {
    return {
    }
  },
  computed: {
    Editable() {
      return UserStore.getters.CurrentUserRole != 0
    },
    IsGodUse() {
      return UserStore.getters.IsGodUser;
    },
    HandshakeSignals() {
      return AGVStatusStore.getters.Handshake_Signals
    },

  },
  methods: {

    async SignalWriteChangeHandler(owner, signal_name) {
      if (!this.IsGodUse) {
        return;
      }
      var state_to_change = !this.HandshakeSignals[owner][signal_name]
      await DIO.HsSignalChange(owner, signal_name, state_to_change)
    }
  },
}
</script>

<style lang="scss" scoped>
.djm-pio {
}
h3 {
  //   padding-left: 100px;
  padding-bottom: 10px;
}
.signal-div {
  width: 60px;
  height: 60px;
  padding: 15px;
  color: white;
  cursor: pointer;
}
.signal-name {
  width: 100px;
  padding-top: 15px;
  padding-right: 10px;
  text-align: right;
  font-weight: bold;
}
</style>