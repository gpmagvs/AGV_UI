<template>
  <div class="home-view-footer border-top fixed-bottom d-flex justify-content-center">
    <div class="system-controls status d-flex">
      <b-button v-bind:class="initBtnClass" @click="InitializeClick">初始化</b-button>
      <b-button :variant="resetAlarmBtnVariant" @click="ResetAlarmlick">異常復歸</b-button>
      <b-button variant="light" @click="BuzzerOffClick">關閉蜂鳴器</b-button>
      <b-button variant="light" @click="RemoveCstClick">移除卡匣</b-button>
    </div>
    <div class="icons d-flex justify-content-end flex-fill">
      <div class="w-100">
        <div class="icon-containers d-flex">
          <div class="py-1" @click="HomeIconClick">
            <img src="/images/home.png" width="50" alt />
          </div>
          <div @click="IOTableIconClick">
            <img src="/images/controller.png" width="60" alt />
          </div>
          <div @click="ControllerIconClick">
            <img src="/images/controller.png" width="60" alt />
          </div>
        </div>
        <div class="icon-containers d-flex">
          <div class="py-1" @click="HomeIconClick">
            <img src="/images/home.png" width="50" alt />
          </div>
          <div @click="ControllerIconClick">
            <img src="/images/controller.png" width="60" alt />
          </div>
          <div @click="ControllerIconClick">
            <img src="/images/controller.png" width="60" alt />
          </div>
        </div>
      </div>
      <div @click="EmoClick">
        <img src="@/assets/emo.png" width="100" alt />
      </div>
    </div>
  </div>
</template>

<script>
import { Initialize, CancelInitProcess, ResetAlarm, BuzzerOff, RemoveCassette, MODESwitcher, EMO } from '@/api/VMSAPI'
import { AGVStatusStore } from '@/store'
export default {

  methods: {
    ControllerIconClick() {
      this.$router.push('/v2/controller/move')
    },
    HomeIconClick() {
      this.$router.push('/v2')
    },
    IOTableIconClick() {
      this.$router.push('/v2/IOTable')
    },
    async InitializeClick() {
      this.$swal.fire({
        title: 'AGV Initialize',
        // text: `${this.$t(this.Is_Fork_AGV ? 'start_init_action_notify' : 'start_init_action_notify_submarin_agv')}`,
        text: `${this.$t('start_init_action_notify_submarin_agv')}`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'OK',
        customClass: 'my-sweetalert'
      }).then(async (result) => {
        if (result.isConfirmed) {
          this.isInitializing = true;
          var result = await Initialize();
          if (!result.confirm) {
            this.$swal.fire({
              title: 'AGV Initialize Fail',
              text: result.message,
              icon: 'error',
              showCancelButton: false,
              customClass: 'my-sweetalert'
            })
          }
        }
      })

    },
    async ResetAlarmlick() {
      await ResetAlarm();
    },
    async BuzzerOffClick() {
      await BuzzerOff();
    },
    async RemoveCstClick() {

    },
    async EmoClick() {
      EMO();
    }
  },
  computed: {
    initBtnClass() {
      return AGVStatusStore.getters.AGVStatus.SubState.toLowerCase();
    },
    resetAlarmBtnVariant() {
      return (AGVStatusStore.getters.AGVStatus.AlarmCodes.length > 0) ? 'danger' : 'light'
    }
  },
}
</script>

<style lang="scss" scoped>
.home-view-footer {
  height: 120px;
  background-color: #dee0e1;
  .system-controls {
    button {
      font-size: 25px;
      width: 151px;
      margin-inline: 2px;
      font-weight: bold;
      border: 1px solid rgb(75, 75, 75);
    }
  }
  .icons {
    padding-right: 25px;
    .icon-containers {
      div {
        width: 70px;
        height: 60px;
      }
    }
    div {
      margin-inline: 2px;
    }
    img:hover {
      cursor: pointer;
      background-color: rgb(13, 110, 253);
      border: 1px solid black;
    }
  }
}
</style>