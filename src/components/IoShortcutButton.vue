<template>
  <div v-if="visible" class="io-shortcut-wrap">
    <button
      type="button"
      class="io-shortcut-btn"
      :class="{ 'is-open': menuOpen }"
      title="INPUT / OUTPUT"
      aria-label="INPUT / OUTPUT"
      :aria-expanded="menuOpen"
      @click="toggleMenu">
      <span class="io-shortcut-label">I/O</span>
    </button>
    <transition name="io-menu-fade">
      <div v-if="menuOpen" class="io-shortcut-menu" role="menu">
        <button type="button" class="io-shortcut-option" role="menuitem" @click="selectIo('input')">
          <i class="bi bi-box-arrow-in-down-left"></i>
          <span>INPUT</span>
        </button>
        <button type="button" class="io-shortcut-option" role="menuitem" @click="selectIo('output')">
          <i class="bi bi-box-arrow-up-right"></i>
          <span>OUTPUT</span>
        </button>
      </div>
    </transition>
  </div>
</template>

<script>
import bus from '@/event-bus.js'

export default {
  name: 'IoShortcutButton',
  data() {
    return {
      menuOpen: false
    }
  },
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
    }
  },
  mounted() {
    document.addEventListener('click', this.handleDocumentClick)
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleDocumentClick)
  },
  methods: {
    handleDocumentClick(event) {
      if (!this.menuOpen) {
        return
      }
      if (!this.$el?.contains?.(event.target)) {
        this.menuOpen = false
      }
    },
    toggleMenu() {
      this.menuOpen = !this.menuOpen
    },
    async selectIo(ioType) {
      this.menuOpen = false

      const isHomeRoute = this.$route?.name === 'home'
        || this.$route?.name === 'overview'
        || this.$route?.path === '/'

      if (!isHomeRoute) {
        await this.$router.push('/')
        await this.$nextTick()
      }

      bus.emit('show-io-table', ioType)
      setTimeout(() => {
        bus.emit('show-io-table', ioType)
      }, 150)
    }
  }
}
</script>

<style scoped lang="scss">
.io-shortcut-wrap {
  position: fixed;
  right: 20px;
  bottom: 124px;
  z-index: 2100;
  width: 56px;
  height: 56px;
}

.io-shortcut-btn {
  width: 56px;
  height: 56px;
  border: 1px solid rgba(253, 126, 20, 0.35);
  border-radius: 50%;
  background: rgba(253, 126, 20, 0.28);
  color: #fff;
  box-shadow: 0 2px 8px rgba(253, 126, 20, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;

  .io-shortcut-label {
    font-size: 16px;
    font-weight: 800;
    letter-spacing: 0.5px;
    line-height: 1;
  }

  &:hover,
  &.is-open {
    background: rgba(253, 126, 20, 0.95);
    border-color: rgba(253, 126, 20, 0.95);
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(253, 126, 20, 0.55);
  }

  &:active {
    transform: translateY(0);
  }
}

.io-shortcut-menu {
  position: absolute;
  right: calc(100% + 8px);
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 128px;
  padding: 8px;
  border-radius: 12px;
  background: rgba(33, 37, 41, 0.92);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
  z-index: 1;
}

.io-shortcut-option {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  border: none;
  border-radius: 8px;
  padding: 10px 12px;
  background: transparent;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s ease;

  i {
    font-size: 16px;
  }

  &:hover {
    background: rgba(253, 126, 20, 0.85);
  }
}

.io-menu-fade-enter-active,
.io-menu-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.io-menu-fade-enter-from,
.io-menu-fade-leave-to {
  opacity: 0;
  transform: translateY(-50%) translateX(8px);
}

.io-menu-fade-enter-to,
.io-menu-fade-leave-from {
  opacity: 1;
  transform: translateY(-50%) translateX(0);
}
</style>
