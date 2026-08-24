<template>
  <section class="tsmc-panel map-panel">
    <div class="map-head">
      <h2 class="tsmc-panel__title">Map & Sensor Real-Time View</h2>
      <span class="pc-badge">Point Cloud: placeholder</span>
    </div>
    <div class="canvas-wrap">
      <svg class="map-svg" viewBox="0 0 640 360" preserveAspectRatio="xMidYMid meet">
        <defs>
          <pattern id="tsmcGrid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#243247" stroke-width="1" />
          </pattern>
        </defs>
        <rect width="640" height="360" fill="#0e1522" />
        <rect width="640" height="360" fill="url(#tsmcGrid)" />

        <ellipse
          :cx="cx"
          :cy="cy"
          rx="92"
          ry="70"
          :class="safetyClass"
          fill-opacity="0.16"
          stroke-width="2" />

        <line
          v-if="isMoving"
          :x1="cx"
          :y1="cy"
          :x2="pathTip.x"
          :y2="pathTip.y"
          class="path-line" />

        <g :transform="`translate(${cx} ${cy}) rotate(${-heading})`">
          <rect x="-22" y="-14" width="44" height="28" rx="4" class="agv-body" />
          <polygon points="22,-8 36,0 22,8" class="agv-nose" />
        </g>

        <circle v-if="hasObstacle" :cx="cx + 70" :cy="cy - 36" r="10" class="obstacle" />
        <text v-if="hasObstacle" :x="cx + 86" :y="cy - 32" class="label">Obstacle</text>

        <text x="16" y="28" class="hud">X {{ poseX }}</text>
        <text x="16" y="48" class="hud">Y {{ poseY }}</text>
        <text x="16" y="68" class="hud">θ {{ heading }}°</text>
        <text x="16" y="88" class="hud">Tag {{ tag }}</text>
      </svg>
    </div>
    <div class="sensor-strip">
      <span :class="lidarClass">LiDAR: {{ lidarText }}</span>
      <span :class="plcConnected ? 'ok' : 'warn'">Safety PLC: {{ plcConnected ? 'OK' : 'NG' }}</span>
      <span :class="motorAlarm ? 'bad' : 'ok'">Motor: {{ motorAlarm ? 'ALARM' : 'NORMAL' }}</span>
    </div>
  </section>
</template>

<script>
import { AGVStatusStore, DIOStore, SaftyPLCStore } from '@/store'

export default {
  name: 'TsmcMapViewport',
  computed: {
    status() {
      return AGVStatusStore.getters.AGVStatus || {}
    },
    pose() {
      return AGVStatusStore.getters.CurrentPose || { position: { x: 0, y: 0 } }
    },
    poseX() {
      return Number(this.pose.position?.x || 0).toFixed(3)
    },
    poseY() {
      return Number(this.pose.position?.y || 0).toFixed(3)
    },
    heading() {
      return Math.round(Number(AGVStatusStore.getters.CurrentAngle || 0))
    },
    tag() {
      const t = this.status.Tag
      return t == null || t < 0 ? '—' : t
    },
    cx: () => 320,
    cy: () => 180,
    isMoving() {
      const sub = (this.status.SubState || '').toUpperCase()
      const main = (this.status.MainState || '').toUpperCase()
      return sub.includes('RUN') || main.includes('RUN') || sub.includes('MOV')
    },
    pathTip() {
      const rad = (-this.heading * Math.PI) / 180
      return {
        x: this.cx + Math.cos(rad) * 140,
        y: this.cy + Math.sin(rad) * 140
      }
    },
    hasObstacle() {
      return DIOStore.getters.IsLaserFrontAlarm
        || DIOStore.getters.IsLaserBackAlarm
        || DIOStore.getters.IsLaserLeftAlarm
        || DIOStore.getters.IsLaserRightAlarm
        || DIOStore.getters.IsLaserFrontWarning
        || DIOStore.getters.IsLaserBackWarning
    },
    lidarAlarm() {
      return DIOStore.getters.IsLaserFrontAlarm || DIOStore.getters.IsLaserBackAlarm
        || DIOStore.getters.IsLaserLeftAlarm || DIOStore.getters.IsLaserRightAlarm
    },
    lidarText() {
      if (this.lidarAlarm) return 'STOP'
      if (DIOStore.getters.IsLaserFrontWarning || DIOStore.getters.IsLaserBackWarning) return 'SLOW'
      return 'OK'
    },
    lidarClass() {
      if (this.lidarAlarm) return 'bad'
      if (DIOStore.getters.IsLaserFrontWarning || DIOStore.getters.IsLaserBackWarning) return 'warn'
      return 'ok'
    },
    safetyClass() {
      return this.hasObstacle ? 'zone-alarm' : 'zone-ok'
    },
    plcConnected() {
      return SaftyPLCStore.getters.Connected
    },
    motorAlarm() {
      return DIOStore.getters.IsLeftMotorAlarm
        || DIOStore.getters.IsRightMotorAlarm
        || DIOStore.getters.IsVerticalMotorAlarm
    }
  }
}
</script>

<style scoped>
.map-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.map-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pc-badge {
  margin-right: 12px;
  font-size: 11px;
  color: var(--tsmc-muted);
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.canvas-wrap {
  flex: 1 1 auto;
  min-height: 0;
  padding: 4px 10px 0;
}

.map-svg {
  width: 100%;
  height: 100%;
  display: block;
  border: 1px solid #243247;
  border-radius: 4px;
}

.agv-body {
  fill: #4cc9f0;
  stroke: #e8eef7;
  stroke-width: 1.5;
}

.agv-nose {
  fill: #2ee59d;
}

.path-line {
  stroke: #4cc9f0;
  stroke-width: 3;
  stroke-dasharray: 8 6;
}

.zone-ok {
  fill: #2ee59d;
  stroke: #2ee59d;
}

.zone-alarm {
  fill: #ff4d6d;
  stroke: #ff4d6d;
}

.obstacle {
  fill: #ff4d6d;
}

.label,
.hud {
  fill: #8ea0b8;
  font-size: 13px;
  font-family: 'IBM Plex Mono', Consolas, monospace;
}

.sensor-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  padding: 6px 12px 8px;
  font-size: 12px;
  font-weight: 600;
}

.ok { color: var(--tsmc-ok); }
.warn { color: var(--tsmc-warn); }
.bad { color: var(--tsmc-alarm); }

@media (max-width: 1199px), (max-height: 699px) {
  .canvas-wrap {
    padding: 2px 6px 0;
  }

  .sensor-strip {
    padding: 4px 8px 6px;
    font-size: 11px;
    gap: 4px 10px;
  }
}

@media (max-width: 899px), (max-height: 540px) {
  .pc-badge {
    display: none;
  }

  .sensor-strip {
    padding: 2px 6px 4px;
    font-size: 10px;
  }

  .hud {
    font-size: 11px;
  }
}
</style>
