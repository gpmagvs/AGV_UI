<template>
    <Transition name="host-banner">
        <div v-if="visible" class="host-message-display px-3" role="status" aria-live="polite">

            <div class="left">
                <div class="d-flex flex-column align-items-start">
                    <div class="d-flex align-items-center">
                        <span class="icon bi bi-clock-fill me-2" aria-hidden="true"></span>
                        <div class="time-container">{{ moment(hostMessageReceivedTime).format('YYYY/MM/DD HH:mm:ss')
                        }}
                        </div>
                    </div>
                    <div class="d-flex align-items-center">
                        <span class="icon bi bi-chat-left-text-fill me-2" aria-hidden="true"></span>
                        <div class="message-container" :title="hostMessage">{{ hostMessage }}</div>
                    </div>
                </div>
            </div>

            <!-- close button -->
            <button class="close-btn" type="button" @click="close" aria-label="關閉提示">
                <span class="bi bi-x-lg" aria-hidden="true"></span>
            </button>
        </div>
    </Transition>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import bus from '@/event-bus.js';
import moment from 'moment';

const hostMessage = ref('');
const hostMessageReceivedTime = ref(0);
const visible = computed(() => Boolean(hostMessage.value && String(hostMessage.value).trim()));

const onHostMessage = (message) => {
    hostMessage.value = typeof message === 'string' ? message : String(message ?? '');
    hostMessageReceivedTime.value = Date.now();
};

onMounted(() => {
    bus.on('HostMessage', onHostMessage);
});
onUnmounted(() => {
    bus.off?.('HostMessage', onHostMessage);
});

const close = () => {
    hostMessage.value = '';
};
</script>

<style lang="scss" scoped>
.host-message-display {
    min-height: 68px;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;

    border-bottom-left-radius: 12px;
    border-bottom-right-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.18);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.24);

    color: #ffffff;
    background: linear-gradient(135deg, rgba(26, 139, 173, 0.699), rgba(13, 72, 161, 0.87));
    position: relative;
    overflow: hidden;

    /* 專業醒目但不刺眼：輕微呼吸＋發光 */
    animation: host-pulse 1.8s ease-in-out infinite;

    &::before {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(600px 160px at 10% 50%, rgba(255, 255, 255, 0.18), transparent 55%);
        pointer-events: none;
    }

    &::after {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 6px;
        background: linear-gradient(180deg, rgba(255, 214, 0, 0.95), rgba(255, 109, 0, 0.95));
        box-shadow: 0 0 18px rgba(255, 193, 7, 0.55);
        pointer-events: none;
    }

    .left {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 0;
        padding: 16px 0 16px 10px;
    }

    .icon {
        font-size: 16px;
        color: rgba(255, 255, 255, 0.98);
        filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.22));
        // animation: host-wiggle 1.8s ease-in-out infinite;
        flex: 0 0 auto;
    }

    .time-container {
        font-weight: bold;
        // color: black;
    }

    .message-container {
        font-size: 24px;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        // font-size: clamp(16px, 2.1vw, 34px);
        font-weight: 800;
        letter-spacing: 0.2px;
        line-height: 1.15;
        text-shadow: 0 2px 14px rgba(0, 0, 0, 0.28);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        min-width: 0;
        letter-spacing: 2px;
    }

    .close-btn {
        flex: 0 0 auto;
        margin: 10px 10px 10px 0;
        height: 40px;
        width: 40px;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.22);
        background: rgba(255, 255, 255, 0.08);
        color: #ffffff;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: transform 120ms ease, background 120ms ease, border-color 120ms ease;
    }

    .close-btn:hover {
        background: rgba(255, 255, 255, 0.14);
        border-color: rgba(255, 255, 255, 0.32);
        transform: translateY(-1px);
    }

    .close-btn:active {
        transform: translateY(0);
    }
}

/* 進場/離場：滑入＋淡入，讓使用者瞬間注意到 */
.host-banner-enter-active {
    animation: host-enter 260ms cubic-bezier(0.2, 0.9, 0.2, 1);
}

.host-banner-leave-active {
    animation: host-leave 160ms ease-in;
}

@keyframes host-enter {
    from {
        opacity: 0;
        transform: translateY(-10px) scale(0.985);
        filter: blur(2px);
    }

    to {
        opacity: 1;
        transform: translateY(0) scale(1);
        filter: blur(0);
    }
}

@keyframes host-leave {
    from {
        opacity: 1;
        transform: translateY(0) scale(1);
    }

    to {
        opacity: 0;
        transform: translateY(-8px) scale(0.99);
    }
}

@keyframes host-pulse {

    0%,
    100% {
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.24);
        filter: saturate(1);
    }

    50% {
        box-shadow: 0 14px 36px rgba(0, 0, 0, 0.28);
        filter: saturate(1.05);
    }
}

@keyframes host-wiggle {

    0%,
    100% {
        transform: rotate(0deg) translateY(0);
    }

    50% {
        transform: rotate(-6deg) translateY(-1px);
    }
}
</style>