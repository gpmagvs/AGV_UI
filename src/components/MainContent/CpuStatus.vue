<template>
    <div class="cpu-status">
        <el-tooltip placement="top" :show-after="300" :offset="10">
            <template #content>
                <div class="metric-tip">
                    <div class="metric-tip-title">{{ $t('sys_cpu_label') }}</div>
                    <div class="metric-tip-row">
                        <span>{{ $t('sys_cpu_hint') }}</span>
                        <b>{{ cpuText }}</b>
                    </div>
                    <div class="metric-tip-row">
                        <span>{{ $t(`sys_metric_${level}`) }}</span>
                    </div>
                </div>
            </template>
            <div class="metric-chip" :class="`is-${level}`">
                <el-icon class="chip-icon" :size="14">
                    <Cpu />
                </el-icon>
                <span class="chip-label">{{ $t('sys_cpu_label') }}</span>
                <span class="chip-value">
                    <i class="chip-dot"></i>
                    {{ cpuText }}
                </span>
            </div>
        </el-tooltip>
    </div>
</template>

<script>
import { Cpu } from '@element-plus/icons-vue'
import { AGVStatusStore } from '@/store'

const WARN = 70
const CRITICAL = 90

export default {
    name: 'CpuStatus',
    components: { Cpu },
    computed: {
        cpu() {
            return Number(AGVStatusStore.state.AGVStatus?.SysLoading?.CPU) || 0
        },
        cpuText() {
            return `${this.cpu}%`
        },
        level() {
            if (this.cpu >= CRITICAL) return 'critical'
            if (this.cpu >= WARN) return 'warn'
            return 'normal'
        }
    }
}
</script>

<style lang="scss" scoped>
$c-ok: #2e7d32;
$c-warn: #ef6c00;
$c-ng: #c62828;
$c-idle: #90a4ae;
$mono: Consolas, 'Courier New', monospace;

.cpu-status {
    display: inline-flex;
    align-items: center;
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
    }

    .chip-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: currentColor;
    }

    &.is-normal {
        border-color: #a5d6a7;
        background: #f1f8e9;

        .chip-icon {
            color: $c-ok;
        }

        .chip-value {
            background: $c-ok;
            color: #fff;
        }
    }

    &.is-warn {
        border-color: #ffcc80;
        background: #fff8e1;

        .chip-icon {
            color: $c-warn;
        }

        .chip-value {
            background: $c-warn;
            color: #fff;
        }
    }

    &.is-critical {
        border-color: #ef9a9a;
        background: #fdecea;

        .chip-icon {
            color: $c-ng;
        }

        .chip-value {
            background: $c-ng;
            color: #fff;
            animation: metric-pulse 1.4s ease-in-out infinite;
        }
    }
}

@keyframes metric-pulse {
    0%,
    100% {
        box-shadow: 0 0 0 0 rgba(198, 40, 40, 0.55);
    }

    50% {
        box-shadow: 0 0 0 4px rgba(198, 40, 40, 0);
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
