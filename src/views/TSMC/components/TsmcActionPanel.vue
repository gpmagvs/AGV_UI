<template>
  <section class="tsmc-panel action-panel">
    <h2 class="tsmc-panel__title">Actions {{ isLogin ? '' : '(Login Required)' }}</h2>
    <div class="btns">
      <button
        type="button"
        class="tsmc-touch-btn init-btn"
        :disabled="!isLogin || initializing"
        @click="onInitializeClick">
        {{ initializing ? 'INITIALIZING' : 'INITIALIZE' }}
      </button>
      <button
        type="button"
        class="tsmc-touch-btn tsmc-touch-btn--mode"
        :disabled="!isLogin || autoSwitching"
        @click="onModeClick">
        {{ isAuto ? 'TO MANUAL' : 'TO AUTO' }}
      </button>
      <button
        type="button"
        class="tsmc-touch-btn tsmc-touch-btn--alarm"
        :disabled="!isLogin || resetting"
        @click="onResetAlarmClick">
        {{ resetting ? 'RESETTING' : 'ALARM RESET' }}
      </button>
      <button type="button" class="tsmc-touch-btn" @click="onLoginClick">
        {{ isLogin ? `LOGOUT (${userName})` : 'LOGIN' }}
      </button>
    </div>
    <p v-if="!isLogin" class="hint">Gloves-friendly keys. Login to change mode or reset alarms.</p>
    <login ref="loginShow"></login>
  </section>
</template>

<script>
import { Initialize, ResetAlarm, MODESwitcher } from '@/api/VMSAPI'
import { AGVStatusStore, UserStore } from '@/store'
import login from '@/components/Login.vue'

export default {
  name: 'TsmcActionPanel',
  components: { login },
  data() {
    return {
      autoSwitching: false,
      initializingRequest: false,
      resetting: false
    }
  },
  computed: {
    isLogin() {
      return UserStore.getters.CurrentUserRole != 0
    },
    userName() {
      return UserStore.getters.CurrentUserName
    },
    isAuto() {
      return AGVStatusStore.getters.IsAuto
    },
    initializing() {
      const status = AGVStatusStore.getters.AGVStatus || {}
      return this.initializingRequest
        || AGVStatusStore.getters.IsAGVInitializing
        || status.IsSystemIniting === true
    }
  },
  methods: {
    async onInitializeClick() {
      if (!this.isLogin || this.initializing) return
      const result = await this.$swal.fire({
        title: 'AGV INITIALIZE',
        text: '確定要開始 AGV 初始化？初始化期間請勿操作車輛或進入車體作業範圍。',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'START INITIALIZE',
        cancelButtonText: 'CANCEL',
        customClass: 'my-sweetalert'
      })
      if (!result.isConfirmed) return

      this.initializingRequest = true
      try {
        const response = await Initialize()
        if (response?.confirm === false) {
          await this.$swal.fire({
            title: 'AGV Initialize Fail',
            text: response.message || 'Initialization request failed',
            icon: 'error',
            confirmButtonText: 'OK',
            customClass: 'my-sweetalert'
          })
        }
      } catch (error) {
        await this.$swal.fire({
          title: 'AGV Initialize Fail',
          text: error?.response?.data?.message || error?.message || 'Initialization request failed',
          icon: 'error',
          confirmButtonText: 'OK',
          customClass: 'my-sweetalert'
        })
      } finally {
        this.initializingRequest = false
      }
    },
    onLoginClick() {
      if (this.isLogin) {
        this.$swal.fire({
          title: 'Logout Confirm',
          text: this.$t('logout-confirm'),
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'OK',
          customClass: 'my-sweetalert'
        }).then((result) => {
          if (result.isConfirmed)
            UserStore.dispatch('Logout')
        })
        return
      }
      this.$refs.loginShow.Show()
    },
    async onModeClick() {
      if (!this.isLogin) return
      const nextAuto = !this.isAuto
      const result = await this.$swal.fire({
        title: 'AGV AUTO-MODE CHANGE',
        text: `確定要將 AGV 更改為${nextAuto ? '自動' : '手動'}模式?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'OK',
        customClass: 'my-sweetalert'
      })
      if (!result.isConfirmed) return

      this.autoSwitching = true
      try {
        const ret = await MODESwitcher.AutoModeSwitch(nextAuto ? 1 : 0)
        if (!ret?.Success) {
          this.$swal.fire({
            text: ret?.Message || 'Mode switch failed',
            icon: 'error',
            confirmButtonText: 'OK',
            customClass: 'my-sweetalert'
          })
        }
      } finally {
        this.autoSwitching = false
      }
    },
    async onResetAlarmClick() {
      if (!this.isLogin || this.resetting) return
      this.resetting = true
      try {
        await ResetAlarm()
      } finally {
        this.resetting = false
      }
    }
  }
}
</script>

<style scoped>
.action-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.btns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--tsmc-gap);
  padding: 6px 8px 4px;
  flex: 1 1 auto;
  min-height: 0;
  align-content: stretch;
}

.btns .tsmc-touch-btn {
  width: 100%;
  min-height: var(--tsmc-touch-min);
}

.init-btn {
  color: #dff9ff;
  background: #21435a;
  border-color: rgba(76, 201, 240, 0.55);
}

.hint {
  margin: 0 8px 6px;
  font-size: 12px;
  color: var(--tsmc-muted);
}

@media (max-height: 699px) {
  .hint {
    display: none;
  }
}

@media (max-width: 899px), (max-height: 540px) {
  .btns {
    padding: 4px 6px;
  }
}
</style>
