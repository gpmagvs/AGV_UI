<template>
    <div class="laser-speed-status">
        <el-tooltip placement="top" :show-after="300" :offset="10">
            <template #content>
                <div class="metric-tip">
                    <div class="metric-tip-title">{{ $t('sys_laser_label') }}</div>
                    <div class="metric-tip-row">
                        <span>{{ $t('sys_laser_hint') }}</span>
                        <b>{{ laserModeText }}</b>
                    </div>
                </div>
            </template>
            <div class="metric-chip is-info">
                <el-icon class="chip-icon" :size="14">
                    <Aim />
                </el-icon>
                <span class="chip-label">{{ $t('sys_laser_label') }}</span>
                <span class="chip-value">
                    <i class="chip-dot"></i>
                    {{ laserModeText }}
                </span>
            </div>
        </el-tooltip>

        <el-tooltip placement="top" :show-after="300" :offset="10">
            <template #content>
                <div class="metric-tip">
                    <div class="metric-tip-title">{{ $t('sys_speed_label') }}</div>
                    <div class="metric-tip-row">
                        <span>{{ $t('sys_speed_hint') }}</span>
                        <b>{{ speedText }}</b>
                    </div>
                </div>
            </template>
            <div class="metric-chip" :class="`is-${speedLevel}`">
                <el-icon class="chip-icon" :size="14">
                    <Odometer />
                </el-icon>
                <span class="chip-label">{{ $t('sys_speed_label') }}</span>
                <span class="chip-value">
                    <i class="chip-dot"></i>
                    {{ speedText }}
                </span>
            </div>
        </el-tooltip>
    </div>
</template>

<script>
import { Aim, Odometer } from '@element-plus/icons-vue'
import { AGVStatusStore } from '@/store'

export default {
    name: 'LaserSpeedStatus',
    components: { Aim, Odometer },
    computed: {
        laserMode() {
            return AGVStatusStore.state.AGVStatus?.Current_LASER_MODE
        },
        laserModeText() {
            const v = this.laserMode
            return v === undefined || v === null || v === '' ? '—' : String(v)
        },
        speedCommand() {
            return AGVStatusStore.state.CurrentRobotSpeedCommand
        },
        speedText() {
            const v = this.speedCommand
            return v === undefined || v === null || v === '' ? '—' : String(v)
        },
        speedLevel() {
            const s = String(this.speedCommand || '').trim().toLowerCase()
            if (!s || s === 'stop' || s === '—') return 'idle'
            return 'active'
        }
    }
}
</script>

<style lang="scss" scoped>
$c-ok: #2e7d32;
$c-info: #1565c0;
$c-active: #0277bd;
$c-idle: #90a4ae;
$mono: Consolas, 'Courier New', monospace;

.laser-speed-status {
    display: inline-flex;
    align-items: center;
    gap: 8px;
}

.metric-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 26px;
    padding: 0 8px;
    border: 1px solid #cfd8dc;
    border-radius: 13px;
    background: #fff;
    font-size: 12px;
    line-height: 1;
    color: #455a64;
    cursor: default;
    user-select: none;
    transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;

    &:hover {
        background: #f5f7f8;
        box-shadow: 0 1px 4px rgba(38, 50, 56, 0.18);
    }

    .chip-icon {
        color: $c-idle;
    }

    .chip-label {
        font-weight: 600;
        white-space: nowrap;
    }

    .chip-value {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 7px;
        border-radius: 9px;
        font-family: $mono;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.3px;
        background: #eceff1;
        color: #607d8b;
        white-space: nowrap;
        max-width: 120px;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .chip-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: currentColor;
        flex: 0 0 auto;
    }

    &.is-info {
        border-color: #90caf9;
        background: #e3f2fd;

        .chip-icon {
            color: $c-info;
        }

        .chip-value {
            background: $c-info;
            color: #fff;
        }
    }

    &.is-idle {
        border-color: #cfd8dc;
        background: #fff;

        .chip-icon {
            color: $c-idle;
        }

        .chip-value {
            background: #eceff1;
            color: #607d8b;
        }
    }

    &.is-active {
        border-color: #81d4fa;
        background: #e1f5fe;

        .chip-icon {
            color: $c-active;
        }

        .chip-value {
            background: $c-active;
            color: #fff;
        }
    }
}

.metric-tip {
    min-width: 180px;
    font-size: 12px;
    line-height: 1.6;
}

.metric-tip-title {
    margin-bottom: 4px;
    font-weight: 700;
}

.metric-tip-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
}
</style>
