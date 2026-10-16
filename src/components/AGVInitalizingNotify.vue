<template>
    <transition name="el-zoom-in-center">
        <div v-show="IsAGVInitializing" ref="notifyPanel" class="init-notify"
            :class="{ 'is-dragging': isDragging, 'is-minimized': minimize }" :style="panelStyle"
            @mousedown="onDragStart">
            <div class="init-notify__icon" aria-hidden="true">
                <i class="bi bi-arrow-repeat init-notify__spinner"></i>
            </div>
            <div class="init-notify__body">
                <div class="init-notify__heading">
                    <span>AGV 初始化中</span>
                    <span class="init-notify__dots" aria-hidden="true">{{ dot_animation_str }}</span>
                </div>
                <div v-show="!minimize" class="init-notify__status">
                    {{ InitializingStatusText || '請稍候，系統正在進行初始化…' }}
                </div>
            </div>
            <button type="button" class="init-notify__toggle" :title="minimize ? '展開' : '縮小'"
                @click.stop="minimize = !minimize" @mousedown.stop>
                <i :class="minimize ? 'bi bi-chevron-up' : 'bi bi-dash-lg'"></i>
            </button>
        </div>
    </transition>
</template>

<script>
import { AGVStatusStore } from '@/store'

export default {
    data() {
        return {
            dot_animation_str: '.',
            minimize: false,
            isDragging: false,
            hasCustomPosition: false,
            position: {
                left: 10,
                top: null,
            },
            dragOffset: {
                x: 0,
                y: 0,
            },
            animationTimerId: null,
        }
    },
    computed: {
        IsAGVInitializing() {
            return AGVStatusStore.getters.IsAGVInitializing;
        },
        InitializingStatusText() {
            return AGVStatusStore.getters.InitializingStatusText
        },
        panelStyle() {
            const style = {}
            if (this.hasCustomPosition) {
                style.left = `${this.position.left}px`
                style.top = `${this.position.top}px`
                style.right = 'auto'
                style.bottom = 'auto'
                style.transform = 'none'
            }
            return style
        }
    },
    methods: {
        animation() {
            var dotNum = 0;
            this.animationTimerId = setInterval(() => {
                this.dot_animation_str += '.'
                dotNum += 1;
                if (dotNum > 2) {
                    dotNum = 0;
                    this.dot_animation_str = '.'
                }
            }, 1000)
        },
        onDragStart(event) {
            if (event.button !== 0) {
                return
            }
            const panel = this.$refs.notifyPanel
            if (!panel) {
                return
            }
            const rect = panel.getBoundingClientRect()
            this.hasCustomPosition = true
            this.position.left = rect.left
            this.position.top = rect.top
            this.dragOffset.x = event.clientX - rect.left
            this.dragOffset.y = event.clientY - rect.top
            this.isDragging = true
            window.addEventListener('mousemove', this.onDragMove)
            window.addEventListener('mouseup', this.onDragEnd)
        },
        onDragMove(event) {
            if (!this.isDragging) {
                return
            }
            const panel = this.$refs.notifyPanel
            if (!panel) {
                return
            }
            const maxLeft = Math.max(0, window.innerWidth - panel.offsetWidth)
            const maxTop = Math.max(0, window.innerHeight - panel.offsetHeight)
            this.position.left = Math.min(maxLeft, Math.max(0, event.clientX - this.dragOffset.x))
            this.position.top = Math.min(maxTop, Math.max(0, event.clientY - this.dragOffset.y))
        },
        onDragEnd() {
            this.isDragging = false
            window.removeEventListener('mousemove', this.onDragMove)
            window.removeEventListener('mouseup', this.onDragEnd)
        },
    },
    mounted() {
        this.animation();
    },
    beforeUnmount() {
        this.onDragEnd()
        if (this.animationTimerId) {
            clearInterval(this.animationTimerId)
            this.animationTimerId = null
        }
    }
}
</script>

<style lang="scss" scoped>
.init-notify {
    position: fixed;
    top: 22%;
    left: 50%;
    transform: translateX(-50%);
    z-index: 4000;
    display: flex;
    align-items: flex-start;
    gap: 20px;
    width: min(980px, calc(100vw - 20px));
    padding: 24px 26px;
    border-radius: 4px;
    border: 2px solid #0d6efd;
    border-left: 10px solid #0d6efd;
    background: #e8ecf1;
    box-shadow: 0 4px 16px rgba(33, 37, 41, 0.18);
    color: #212529;
    text-align: left;
    cursor: move;
    user-select: none;
    touch-action: none;

    &.is-dragging {
        border-color: #0a58ca;
        cursor: grabbing;
    }

    &.is-minimized {
        top: auto;
        bottom: 18px;
        left: auto;
        right: 18px;
        transform: none;
        width: auto;
        min-width: 320px;
        align-items: center;
        padding: 14px 16px;
        gap: 14px;
    }
}

.init-notify__icon {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 64px;
    height: 64px;
    border: 2px solid #0d6efd;
    border-radius: 4px;
    background: #fff;
    color: #0d6efd;
}

.is-minimized .init-notify__icon {
    width: 46px;
    height: 46px;
}

.init-notify__spinner {
    font-size: 32px;
    animation: init-spin 1.1s linear infinite;
}

.is-minimized .init-notify__spinner {
    font-size: 22px;
}

.init-notify__body {
    flex: 1 1 auto;
    min-width: 0;
    padding-top: 2px;
}

.init-notify__heading {
    display: flex;
    align-items: baseline;
    gap: 4px;
    margin: 0 0 12px;
    font-size: 36px;
    font-weight: 700;
    line-height: 1.25;
    letter-spacing: 0.03em;
    color: #0a58ca;
}

.is-minimized .init-notify__heading {
    margin: 0;
    font-size: 20px;
}

.init-notify__dots {
    display: inline-block;
    min-width: 1.5em;
    font-weight: 700;
    letter-spacing: 0.08em;
}

.init-notify__status {
    margin: 0;
    padding: 14px 16px;
    border-radius: 4px;
    border: 1px solid #ced4da;
    background: #fff;
    font-size: 22px;
    font-weight: 600;
    line-height: 1.45;
    color: #495057;
    word-break: break-word;
}

.init-notify__toggle {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    margin-top: 2px;
    padding: 0;
    border: 1px solid #adb5bd;
    border-radius: 4px;
    background: #fff;
    color: #495057;
    cursor: pointer;

    &:hover {
        border-color: #0d6efd;
        color: #0d6efd;
    }

    i {
        font-size: 18px;
        line-height: 1;
    }
}

.is-minimized .init-notify__toggle {
    width: 34px;
    height: 34px;
    margin-top: 0;

    i {
        font-size: 15px;
    }
}

@keyframes init-spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}
</style>
