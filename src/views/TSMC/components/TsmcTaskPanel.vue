<template>
  <section class="tsmc-panel task-panel">
    <h2 class="tsmc-panel__title">Current Task</h2>
    <dl class="tsmc-kv">
      <dt>Task</dt>
      <dd :title="taskText">{{ taskText }}</dd>
      <dt>Source</dt>
      <dd :title="source">{{ source }}</dd>
      <dt>Target</dt>
      <dd :title="target">{{ target }}</dd>
      <dt>FOUP / CST</dt>
      <dd>
        <span :class="cargoExist ? 'present' : 'absent'">{{ cargoText }}</span>
      </dd>
      <dt>Status</dt>
      <dd>{{ runStatus }}</dd>
    </dl>
  </section>
</template>

<script>
import { AGVStatusStore } from '@/store'

export default {
  name: 'TsmcTaskPanel',
  computed: {
    order() {
      return AGVStatusStore.getters.OrderInfo || {}
    },
    status() {
      return AGVStatusStore.getters.AGVStatus || {}
    },
    taskText() {
      return this.order.DisplayText || this.order.ActionName || 'NO TASK'
    },
    source() {
      return this.order.SourceName || '—'
    },
    target() {
      return this.order.DestineName || this.status.NavInfo?.Destination || '—'
    },
    cargoExist() {
      return !!this.status.CargoExist
    },
    cargoText() {
      const id = this.status.CST_Data
      if (this.cargoExist)
        return `${id || 'UNKNOWN'}  PRESENT`
      return `${id || '—'}  EMPTY`
    },
    runStatus() {
      const main = this.status.MainState || '—'
      const sub = this.status.SubState || ''
      return sub && sub !== main ? `${main} / ${sub}` : main
    }
  }
}
</script>

<style scoped>
.task-panel {
  display: flex;
  flex-direction: column;
  padding-bottom: 6px;
}

.tsmc-kv {
  padding: 6px 12px 4px;
  flex: 1 1 auto;
  min-height: 0;
  align-content: start;
}

.present {
  color: var(--tsmc-ok);
}

.absent {
  color: var(--tsmc-muted);
}

@media (max-width: 1199px), (max-height: 699px) {
  .tsmc-kv {
    padding: 4px 8px 2px;
    gap: 2px 8px;
  }
}
</style>
