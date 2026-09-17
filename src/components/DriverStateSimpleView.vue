<template>
  <div class="driver-state-simple" :class="rootClass" :title="tooltipText">
    <div class="driver-state-simple__header">
      <span class="driver-state-simple__name">{{ displayName }}</span>
      <span class="driver-state-simple__status">{{ statusLabel }}</span>
    </div>
    <div class="driver-state-simple__metrics">
      <div class="metric">
        <span class="metric__label">State</span>
        <span class="metric__value">{{ normalizedState }}</span>
      </div>
      <div class="metric" :class="{ 'metric--fault': hasError }">
        <span class="metric__label">Error</span>
        <span class="metric__value">{{ normalizedErrorCode }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  /** @type {import('vue').PropType<{ name?: string, state?: number|string, errorCode?: number|string }>} */
  driver: {
    type: Object,
    default: () => ({
      name: '',
      state: 0,
      errorCode: 0
    })
  }
})

const displayName = computed(() => {
  const raw = props.driver?.name
  if (raw == null || String(raw).trim() === '') return 'Unknown Driver'
  return String(raw)
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (ch) => ch.toUpperCase())
})

const normalizedState = computed(() => {
  const value = props.driver?.state
  return value === undefined || value === null || value === '' ? '—' : value
})

const normalizedErrorCode = computed(() => {
  const value = props.driver?.errorCode
  return value === undefined || value === null || value === '' ? '—' : value
})

const hasError = computed(() => Number(props.driver?.errorCode) !== 0)

const statusLabel = computed(() => (hasError.value ? 'FAULT' : 'OK'))

const rootClass = computed(() => ({
  'is-ok': !hasError.value,
  'is-fault': hasError.value
}))

const tooltipText = computed(() => {
  const name = props.driver?.name || 'unknown'
  return `${name} | state=${normalizedState.value} | errorCode=${normalizedErrorCode.value}`
})
</script>

<style lang="scss" scoped>
.driver-state-simple {
  --ds-bg: transparent;
  --ds-line: rgba(0, 0, 0, 0.12);
  --ds-text: #111111;
  --ds-muted: rgba(0, 0, 0, 0.48);
  --ds-fault: #d41919;

  width: 100%;
  min-width: 0;
  padding: 14px 16px;
  border-bottom: 1px solid var(--ds-line);
  background: var(--ds-bg);

  &:last-child {
    border-bottom: none;
  }

  &.is-fault {
    .driver-state-simple__status {
      color: var(--ds-fault);
    }
  }
}

.driver-state-simple__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.driver-state-simple__name {
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ds-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.driver-state-simple__status {
  flex-shrink: 0;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--ds-muted);
}

.driver-state-simple__metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.metric {
  min-width: 0;
}

.metric__label {
  display: block;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--ds-muted);
}

.metric__value {
  display: block;
  margin-top: 6px;
  font-size: 22px;
  font-weight: 500;
  line-height: 1;
  letter-spacing: 0.04em;
  color: var(--ds-text);
  font-variant-numeric: tabular-nums;
}

.metric--fault {
  .metric__value {
    color: var(--ds-fault);
  }
}
</style>
