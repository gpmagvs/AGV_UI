<template>
    <transition name="el-zoom-in-center">
        <div ref="notifyPanel" class="wait-next-task-move-notify bg-primary text-light"
            :class="{ 'is-dragging': isDragging, 'is-minimized': minimize }" :style="panelStyle"
            v-show="IsAGVInitializing" @mousedown="onDragStart">
            <div class="w-100">
                <i class="bi bi-stoplights"></i>
                <span class="">AGV 初始化..</span>
                <span class="mx-1">{{ dot_animation_str }}</span>
                <div class="sub-title mx-1 text-primary" :class="minimize ? 'sub-title-mini' : ''">
                    {{ InitializingStatusText }}</div>
            </div>
            <b-button @click.stop="() => { minimize = !minimize }" @mousedown.stop variant="light" id="close-btn"
                class="my-2">{{ minimize ? '▲' : '-' }}</b-button>
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
            }
            if (this.minimize) {
                style.width = '450px'
                style.height = '120px'
                style.fontSize = '28px'
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
.wait-next-task-move-notify {
    width: 98%;
    height: 193px;
    border-radius: 8px;
    position: absolute;
    top: 40%;
    left: 10px;
    border: 2px solid #464646;
    opacity: .9;
    font-size: 50px;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    font-weight: bold;
    letter-spacing: 7px;
    z-index: 4000;
    cursor: move;
    user-select: none;
    touch-action: none;

    &.is-dragging {
        opacity: 1;
        cursor: grabbing;
    }

    &.is-minimized {
        position: absolute;
    }

    .sub-title {
        font-size: smaller;
        color: #383838;
        letter-spacing: normal;
        background: #ffffff;
        height: 87px;
        padding: 15px;
        border-radius: 8px;
        cursor: move;
    }

    .sub-title-mini {
        height: 50px;
        top: 7px;
        position: relative;
    }

    #close-btn {
        position: absolute;
        top: 6px;
        right: 6px;
        cursor: pointer;
    }
}
</style>
