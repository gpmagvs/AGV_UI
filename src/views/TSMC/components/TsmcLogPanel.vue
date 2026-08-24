<template>
  <section class="tsmc-panel log-panel">
    <h2 class="tsmc-panel__title">System Logs</h2>
    <ul class="log-list">
      <li v-for="(row, idx) in rows" :key="idx" :class="levelClass(row.Level)">
        <span class="time">{{ row.Time }}</span>
        <span class="lvl">[{{ row.Level }}]</span>
        <span class="msg">{{ row.Message }}</span>
      </li>
      <li v-if="!rows.length" class="empty">No recent alarms / warnings</li>
    </ul>
  </section>
</template>

<script>
import moment from 'moment'
import { AGVStatusStore } from '@/store'

const ROW_COUNT = 5

export default {
  name: 'TsmcLogPanel',
  computed: {
    rows() {
      // 使用 SignalR 推送的 AlarmCodes，避免每幾秒打一次沉重的 /api/Log/Query（讀檔）
      return [...(AGVStatusStore.getters.AlarmCodes || [])]
        .slice(-ROW_COUNT)
        .reverse()
        .map(a => ({
          Time: a.Time ? moment(a.Time).format('HH:mm:ss') : '--:--:--',
          Level: a.ELevel === 0 ? 'WARN' : 'ALARM',
          Message: a.CN || a.Description || `Code ${a.Code}`
        }))
    }
  },
  methods: {
    levelClass(level) {
      const lv = (level || '').toUpperCase()
      if (lv.includes('ERR') || lv.includes('ALARM') || lv.includes('FAT')) return 'err'
      if (lv.includes('WARN')) return 'warn'
      return 'info'
    }
  }
}
</script>

<style scoped>
.log-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.log-list {
  list-style: none;
  margin: 0;
  padding: 4px 12px 8px;
  overflow: auto;
  flex: 1 1 auto;
}

.log-list li {
  display: grid;
  grid-template-columns: var(--log-time, 72px) var(--log-lvl, 72px) minmax(0, 1fr);
  gap: 8px;
  font-family: var(--tsmc-mono);
  font-size: 12px;
  line-height: 1.55;
}

.empty {
  color: var(--tsmc-muted);
  display: block !important;
}

.time { color: var(--tsmc-muted); }
.lvl { font-weight: 600; }
.info .lvl { color: var(--tsmc-info); }
.warn .lvl { color: var(--tsmc-warn); }
.err .lvl { color: var(--tsmc-alarm); }
.msg {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 1199px), (max-height: 699px) {
  .log-list {
    padding: 2px 8px 6px;
  }

  .log-list li {
    --log-time: 56px;
    --log-lvl: 52px;
    gap: 4px;
    font-size: 11px;
    line-height: 1.4;
  }
}

@media (max-width: 899px), (max-height: 540px) {
  .log-list li {
    --log-time: 48px;
    --log-lvl: 44px;
    font-size: 10px;
  }
}
</style>
