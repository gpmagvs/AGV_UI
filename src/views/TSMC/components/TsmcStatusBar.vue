<template>
  <header class="tsmc-status-bar tsmc-panel">
    <div class="id-block">
      <span class="agv-name">{{ agvName || 'AGV' }}</span>
      <span class="mode-pill" :class="isAuto ? 'auto' : 'manual'">{{ isAuto ? 'AUTO' : 'MANUAL' }}</span>
      <span class="mode-pill" :class="isOnline ? 'online' : 'offline'">{{ isOnline ? 'ONLINE' : 'OFFLINE' }}</span>
    </div>

    <div class="main-state" :class="mainStateClass">
      <span class="main-state__label">MAIN STATE</span>
      <strong>{{ mainState }}</strong>
      <span v-if="subState !== mainState" class="main-state__sub">{{ subState }}</span>
    </div>

    <div class="chips">
      <span class="tsmc-chip tsmc-chip--idle chip-placeholder" title="No Wi-Fi telemetry in this VMS">
        Wi-Fi: N/A
      </span>
      <span class="tsmc-chip" :class="chipClass(conn.VMS)">
        <span class="tsmc-dot"></span>MCS:
        <span class="conn-full">{{ connLabel(conn.VMS) }}</span>
        <span class="conn-short">{{ connShort(conn.VMS) }}</span>
      </span>
      <span class="tsmc-chip tsmc-chip--idle chip-placeholder" title="SECS/GEM is not wired in AGV_UI">
        SECS/GEM: —
      </span>
      <span class="tsmc-chip" :class="chipClass(conn.WAGO)">
        <span class="tsmc-dot"></span>WAGO:
        <span class="conn-full">{{ connLabel(conn.WAGO) }}</span>
        <span class="conn-short">{{ connShort(conn.WAGO) }}</span>
      </span>
      <span class="tsmc-chip" :class="chipClass(conn.RosbridgeServer)">
        <span class="tsmc-dot"></span>ROS:
        <span class="conn-full">{{ connLabel(conn.RosbridgeServer) }}</span>
        <span class="conn-short">{{ connShort(conn.RosbridgeServer) }}</span>
      </span>
    </div>

    <div class="right">
      <span class="tsmc-chip battery-chip" :class="batteryChipClass">
        Battery {{ batteryText }}
        <span v-if="isCharging">CHG</span>
      </span>
      <button type="button" class="io-btn" @click="$emit('open-io')">
        I/O VIEW
      </button>
      <button
        type="button"
        class="alarm-btn"
        :class="{ active: hasAlarm }"
        @click="$emit('open-diag')">
        {{ hasAlarm ? `ALARM ×${alarmCount}` : 'NO ALARM' }}
      </button>
    </div>
  </header>
</template>

<script>
import { AGVStatusStore, UIStore } from '@/store'

export default {
  name: 'TsmcStatusBar',
  emits: ['open-diag', 'open-io'],
  computed: {
    agvName() {
      return AGVStatusStore.getters.AGVName
    },
    isAuto() {
      return AGVStatusStore.getters.IsAuto
    },
    isOnline() {
      return AGVStatusStore.getters.IsOnline
    },
    status() {
      return AGVStatusStore.getters.AGVStatus || {}
    },
    mainState() {
      return (this.status.MainState || 'UNKNOWN').toString().toUpperCase()
    },
    subState() {
      return (this.status.SubState || 'UNKNOWN').toString().toUpperCase()
    },
    mainStateClass() {
      const state = `${this.mainState} ${this.subState}`
      if (/ALARM|DOWN|ERROR|EMERGENCY|STOP/.test(state)) return 'main-state--alarm'
      if (/INIT|CHARG|MOV|RUN|WORK/.test(state)) return 'main-state--active'
      if (/IDLE|WARNING|WAIT/.test(state)) return 'main-state--warn'
      return 'main-state--idle'
    },
    conn() {
      return UIStore.getters.ConnectionState || {}
    },
    batteries() {
      const raw = AGVStatusStore.getters.BatteryStatus
      if (Array.isArray(raw)) return raw
      return raw && typeof raw === 'object' ? Object.values(raw) : []
    },
    batteryLevel() {
      const list = this.batteries.filter(b => b && typeof b.BatteryLevel === 'number')
      if (!list.length) return null
      const sum = list.reduce((acc, b) => acc + (b.BatteryLevel || 0), 0)
      return Math.round(sum / list.length)
    },
    isCharging() {
      return this.batteries.some(b => b?.IsCharging)
    },
    batteryText() {
      return this.batteryLevel == null ? '—' : `${this.batteryLevel}%`
    },
    batteryChipClass() {
      if (this.batteryLevel == null) return 'tsmc-chip--idle'
      if (this.batteryLevel <= 20) return 'tsmc-chip--alarm'
      if (this.batteryLevel <= 40) return 'tsmc-chip--warn'
      return 'tsmc-chip--ok'
    },
    alarms() {
      return AGVStatusStore.getters.AlarmCodes || []
    },
    alarmCount() {
      return this.alarms.length
    },
    hasAlarm() {
      return this.alarmCount > 0
    }
  },
  methods: {
    connLabel(code) {
      return code === 0 ? 'CONNECTED' : 'DISCONNECTED'
    },
    connShort(code) {
      return code === 0 ? 'OK' : 'NG'
    },
    chipClass(code) {
      return code === 0 ? 'tsmc-chip--ok' : 'tsmc-chip--alarm'
    }
  }
}
</script>

<style scoped>
.tsmc-status-bar {
  --tsmc-state-h: 44px;
  display: grid;
  grid-template-columns: auto auto minmax(0, 1fr);
  grid-template-areas:
    "id state right"
    "chips chips chips";
  align-items: center;
  gap: 6px 10px;
  padding: 4px 10px;
  min-height: 52px;
}

.id-block {
  grid-area: id;
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  height: var(--tsmc-state-h);
}

.agv-name {
  height: 100%;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--tsmc-line);
  border-radius: 4px;
  background: #101824;
  font-size: clamp(14px, 1.8vw, 20px);
  font-weight: 700;
  letter-spacing: 0.04em;
  max-width: 18vw;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.main-state {
  grid-area: state;
  min-width: 128px;
  height: var(--tsmc-state-h);
  padding: 4px 10px;
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: 12px 22px;
  column-gap: 8px;
  align-items: center;
  border: 1px solid currentColor;
  border-radius: 4px;
  background: #101824;
}

.main-state__label {
  grid-column: 1 / -1;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
  opacity: 0.72;
}

.main-state strong {
  font-family: var(--tsmc-mono);
  font-size: 18px;
  line-height: 1;
  letter-spacing: 0.04em;
}

.main-state__sub {
  max-width: 82px;
  overflow: hidden;
  color: var(--tsmc-muted);
  font-family: var(--tsmc-mono);
  font-size: 9px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.main-state--alarm { color: var(--tsmc-alarm); background: rgba(255, 77, 109, 0.12); }
.main-state--active { color: var(--tsmc-ok); background: rgba(46, 229, 157, 0.08); }
.main-state--warn { color: var(--tsmc-warn); background: rgba(245, 197, 66, 0.08); }
.main-state--idle { color: var(--tsmc-info); }

.mode-pill {
  height: 100%;
  min-width: 68px;
  padding: 0 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  border-radius: 4px;
  border: 1px solid var(--tsmc-line);
  background: #101824;
}

.mode-pill.auto,
.mode-pill.online {
  color: var(--tsmc-ok);
  border-color: rgba(46, 229, 157, 0.4);
}

.mode-pill.manual,
.mode-pill.offline {
  color: var(--tsmc-warn);
  border-color: rgba(245, 197, 66, 0.4);
}

.chips {
  grid-area: chips;
  display: flex;
  flex-wrap: nowrap;
  gap: 6px;
  min-width: 0;
  overflow: hidden;
}

.right {
  grid-area: right;
  display: flex;
  align-items: center;
  gap: 8px;
  justify-self: end;
}

.alarm-btn {
  min-width: 112px;
  min-height: var(--tsmc-alarm-h);
  padding: 0 12px;
  border-radius: 4px;
  border: 1px solid var(--tsmc-line);
  background: #101824;
  color: var(--tsmc-ok);
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.06em;
  cursor: pointer;
}

.battery-chip {
  height: var(--tsmc-alarm-h);
  min-height: var(--tsmc-alarm-h);
  padding: 0 12px;
  font-size: 13px;
}

.io-btn {
  min-width: 92px;
  min-height: var(--tsmc-alarm-h);
  padding: 0 10px;
  border: 1px solid rgba(76, 201, 240, 0.5);
  border-radius: 4px;
  background: #173449;
  color: var(--tsmc-info);
  font-family: inherit;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  cursor: pointer;
  touch-action: manipulation;
}

.alarm-btn.active {
  color: #fff;
  background: var(--tsmc-alarm);
  border-color: #ff4d6d;
  animation: pulse 1.4s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 77, 109, 0.45); }
  50% { box-shadow: 0 0 0 6px rgba(255, 77, 109, 0); }
}

@media (max-width: 1199px), (max-height: 699px) {
  .tsmc-status-bar {
    --tsmc-state-h: 40px;
  }

  .main-state {
    min-width: 116px;
    padding: 2px 8px;
    grid-template-rows: 10px 20px;
  }

  .main-state strong {
    font-size: 16px;
  }

  .mode-pill {
    min-width: 58px;
    font-size: 10px;
  }

  .agv-name {
    padding: 0 8px;
  }

  .chips {
    overflow-x: auto;
    scrollbar-width: none;
  }

  .chips::-webkit-scrollbar {
    display: none;
  }

  .alarm-btn {
    min-width: 104px;
    font-size: 12px;
  }

  .io-btn {
    min-width: 82px;
    font-size: 11px;
  }
}

@media (max-width: 899px), (max-height: 540px) {
  .tsmc-status-bar {
    --tsmc-state-h: 36px;
    gap: 4px 6px;
    padding: 3px 6px;
  }

  .id-block {
    gap: 4px;
  }

  .agv-name {
    max-width: 22vw;
    padding: 0 6px;
  }

  .main-state {
    min-width: 102px;
  }

  .main-state__label {
    font-size: 8px;
  }

  .main-state strong {
    font-size: 14px;
  }

  .main-state__sub {
    display: none;
  }

  .alarm-btn {
    min-width: 96px;
    padding: 0 8px;
    font-size: 11px;
  }

  .io-btn {
    min-width: 72px;
    padding: 0 6px;
    font-size: 10px;
  }
}
</style>
