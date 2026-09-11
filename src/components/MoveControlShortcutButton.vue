<template>
  <button
    v-if="visible"
    type="button"
    class="move-control-shortcut-btn"
    :title="buttonTitle"
    :aria-label="buttonTitle"
    @click="openMoveControl">
    <i class="bi bi-joystick"></i>
  </button>
</template>

<script>
import bus from '@/event-bus.js'

export default {
  name: 'MoveControlShortcutButton',
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
      return this.$t('agv_control')
    }
  },
  methods: {
    async openMoveControl() {
      const isHomeRoute = this.$route?.name === 'home'
        || this.$route?.name === 'overview'
        || this.$route?.path === '/'

      if (!isHomeRoute) {
        await this.$router.push('/')
        await this.$nextTick()
      }

      // 與既有 on-fork-height-click 相同模式：主分頁 + 操作子分頁同步切換
      bus.emit('show-move-control')
      // 若剛進入首頁，操作分頁元件可能尚未掛載，稍後再送一次
      setTimeout(() => {
        bus.emit('show-move-control')
      }, 150)
    }
  }
}
</script>

<style scoped lang="scss">
.move-control-shortcut-btn {
  position: fixed;
  right: 20px;
  bottom: 56px;
  z-index: 2100;
  width: 56px;
  height: 56px;
  border: 1px solid rgba(13, 110, 253, 0.35);
  border-radius: 50%;
  background: rgba(13, 110, 253, 0.28);
  color: #fff;
  box-shadow: 0 2px 8px rgba(13, 110, 253, 0.18);
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
    background: rgba(13, 110, 253, 0.95);
    border-color: rgba(13, 110, 253, 0.95);
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(13, 110, 253, 0.55);
  }

  &:active {
    transform: translateY(0);
  }
}
</style>
