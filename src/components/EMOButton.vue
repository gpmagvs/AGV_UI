<template>
  <button
    type="button"
    class="emo-button"
    :class="{ 'is-disabled': disabled }"
    :style="buttonStyle"
    :disabled="disabled"
    :aria-label="'Emergency Stop'"
    @click="handleEmoClick"
  >
    <span class="emo-button__ring" aria-hidden="true"></span>
    <span class="emo-button__face">
      <span class="emo-button__label">EMO</span>
      <span class="emo-button__sub">STOP</span>
    </span>
  </button>
</template>

<script>
import { EMO } from '@/api/VMSAPI'

export default {
  name: 'EMOButton',
  props: {
    disabled: {
      type: Boolean,
      default: false,
    },
    /** 按鈕外徑（px），預設 112 */
    size: {
      type: Number,
      default: 112,
    },
  },
  computed: {
    buttonStyle() {
      const outer = Math.max(48, this.size)
      return {
        '--emo-size': `${outer}px`,
      }
    },
  },
  methods: {
    async handleEmoClick() {
      if (this.disabled) {
        return
      }
      await EMO()
    },
  },
}
</script>

<style lang="scss" scoped>
.emo-button {
  --emo-size: 112px;
  --emo-red: #dc2626;
  --emo-red-deep: #991b1b;
  --emo-red-face: #ef4444;
  --emo-ring: #e2e8f0;

  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--emo-size);
  height: var(--emo-size);
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  outline: none;

  &:focus-visible .emo-button__face {
    box-shadow:
      0 0 0 3px rgba(255, 255, 255, 0.9),
      0 0 0 6px rgba(220, 38, 38, 0.55);
  }

  &.is-disabled {
    cursor: not-allowed;
    opacity: 0.45;

    .emo-button__face {
      filter: grayscale(0.35);
    }
  }

  &:not(.is-disabled):active .emo-button__face {
    transform: translateY(2px) scale(0.96);
    box-shadow:
      inset 0 4px 10px rgba(0, 0, 0, 0.35),
      0 1px 0 rgba(255, 255, 255, 0.15);
  }

  &:not(.is-disabled):hover .emo-button__face {
    background: radial-gradient(circle at 35% 28%, #f87171 0%, var(--emo-red-face) 42%, var(--emo-red) 78%, var(--emo-red-deep) 100%);
  }
}

.emo-button__ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: linear-gradient(160deg, #f8fafc 0%, var(--emo-ring) 45%, #94a3b8 100%);
  box-shadow:
    0 2px 4px rgba(15, 23, 42, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.75);
}

.emo-button__face {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: calc(var(--emo-size) * 0.768);
  height: calc(var(--emo-size) * 0.768);
  border-radius: 50%;
  background: radial-gradient(circle at 35% 28%, #fca5a5 0%, var(--emo-red-face) 40%, var(--emo-red) 75%, var(--emo-red-deep) 100%);
  border: 2px solid rgba(127, 29, 29, 0.55);
  box-shadow:
    inset 0 2px 3px rgba(255, 255, 255, 0.35),
    inset 0 -6px 12px rgba(0, 0, 0, 0.28),
    0 4px 8px rgba(127, 29, 29, 0.35);
  transition: transform 0.08s ease, box-shadow 0.08s ease, background 0.12s ease;
}

.emo-button__label {
  font-family: 'Segoe UI', 'Noto Sans TC', system-ui, sans-serif;
  font-size: calc(var(--emo-size) * 0.196);
  font-weight: 800;
  letter-spacing: 0.08em;
  line-height: 1;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
}

.emo-button__sub {
  margin-top: calc(var(--emo-size) * 0.027);
  font-family: 'Segoe UI', 'Noto Sans TC', system-ui, sans-serif;
  font-size: calc(var(--emo-size) * 0.098);
  font-weight: 700;
  letter-spacing: 0.18em;
  line-height: 1;
  color: rgba(255, 255, 255, 0.88);
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.3);
}
</style>
