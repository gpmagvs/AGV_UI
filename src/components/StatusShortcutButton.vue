<template>
  <button
    v-if="visible"
    type="button"
    class="status-shortcut-btn"
    :title="buttonTitle"
    :aria-label="buttonTitle"
    @click="openStatusPage">
    <i class="bi bi-speedometer2"></i>
  </button>
</template>

<script>
import bus from '@/event-bus.js'

export default {
  name: 'StatusShortcutButton',
  computed: {
    visible() {
      const routeName = this.$route?.name
      const routePath = this.$route?.path || ''
      if (routeName === 'tsmc-hmi' || routePath === '/tsmc') {
        return false
      }
      if (routeName === 'idle' || routePath === '/idle') {
        return false
      }
      return true
    },
    buttonTitle() {
      return this.$t('status')
    }
  },
  methods: {
    async openStatusPage() {
      const isHomeRoute = this.$route?.name === 'home'
        || this.$route?.name === 'overview'
        || this.$route?.path === '/'

      if (!isHomeRoute) {
        await this.$router.push('/')
        await this.$nextTick()
      }

      bus.emit('show-status-page')
      setTimeout(() => {
        bus.emit('show-status-page')
      }, 150)
    }
  }
}
</script>

<style scoped lang="scss">
.status-shortcut-btn {
  position: fixed;
  right: 20px;
  bottom: 192px;
  z-index: 2100;
  width: 56px;
  height: 56px;
  border: 1px solid rgba(108, 117, 125, 0.4);
  border-radius: 50%;
  background: rgba(108, 117, 125, 0.28);
  color: #fff;
  box-shadow: 0 2px 8px rgba(108, 117, 125, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;

  i {
    font-size: 26px;
    line-height: 1;
  }

  &:hover {
    background: rgba(73, 80, 87, 0.95);
    border-color: rgba(73, 80, 87, 0.95);
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(73, 80, 87, 0.45);
  }

  &:active {
    transform: translateY(0);
  }
}
</style>
