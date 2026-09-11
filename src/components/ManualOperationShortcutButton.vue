<template>
  <button
    v-if="visible"
    type="button"
    class="manual-operation-shortcut-btn"
    :title="buttonTitle"
    :aria-label="buttonTitle"
    @click="openManualOperation">
    <i class="bi bi-sliders"></i>
  </button>
</template>

<script>
import bus from '@/event-bus.js'

export default {
  name: 'ManualOperationShortcutButton',
  computed: {
    visible() {
      // 暫時隱藏手動操作快捷按鈕
      return false
    },
    buttonTitle() {
      return this.$t('manual-operation')
    }
  },
  methods: {
    async openManualOperation() {
      const isHomeRoute = this.$route?.name === 'home'
        || this.$route?.name === 'overview'
        || this.$route?.path === '/'

      if (!isHomeRoute) {
        await this.$router.push('/')
        await this.$nextTick()
      }

      bus.emit('show-manual-operation')
      setTimeout(() => {
        bus.emit('show-manual-operation')
      }, 150)
    }
  }
}
</script>

<style scoped lang="scss">
.manual-operation-shortcut-btn {
  position: fixed;
  right: 20px;
  bottom: 124px;
  z-index: 2100;
  width: 56px;
  height: 56px;
  border: 1px solid rgba(25, 135, 84, 0.35);
  border-radius: 50%;
  background: rgba(25, 135, 84, 0.28);
  color: #fff;
  box-shadow: 0 2px 8px rgba(25, 135, 84, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;

  i {
    font-size: 24px;
    line-height: 1;
  }

  &:hover {
    background: rgba(25, 135, 84, 0.95);
    border-color: rgba(25, 135, 84, 0.95);
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(25, 135, 84, 0.55);
  }

  &:active {
    transform: translateY(0);
  }
}
</style>
