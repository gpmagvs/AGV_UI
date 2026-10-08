<template>
    <Transition name="host-banner" mode="out-in">
        <div v-if="current" :key="current.MsgID" class="host-message-display px-3">

            <div class="content">
                <div class="meta">
                    <time class="time-container" :datetime="current.ReceivedTime">{{ formatTime(current.ReceivedTime) }}</time>
                    <span class="meta-dot" aria-hidden="true"></span>
                    <span class="elapsed-container">{{ elapsedText }}</span>
                    <template v-if="current.Title">
                        <span class="meta-dot" aria-hidden="true"></span>
                        <div class="title-container" :title="current.Title">{{ current.Title }}</div>
                    </template>
                </div>
                <div class="meta-rule" aria-hidden="true"></div>
                <div class="message-container" role="status" :title="current.Message">{{ current.Message }}</div>
            </div>

            <div class="right">
                <!-- 其他未讀數量 -->
                <button v-if="unreadCount > 1" class="more-btn" type="button" @click="openHistory"
                    :aria-label="`還有 ${unreadCount - 1} 則未讀`">
                    +{{ unreadCount - 1 }} 則未讀
                </button>
                <!-- 訊息紀錄 -->
                <button class="action-btn" type="button" @click="openHistory" aria-label="訊息紀錄" title="訊息紀錄">
                    <span class="bi bi-clock-history" aria-hidden="true"></span>
                </button>
                <!-- close button：標為已讀 -->
                <button class="close-btn" type="button" @click="close" aria-label="關閉提示" title="關閉（標為已讀）">
                    <span class="bi bi-x-lg" aria-hidden="true"></span>
                </button>
            </div>
        </div>
    </Transition>
</template>

<script setup>
import { computed, onUnmounted, ref, watch } from 'vue';
import moment from 'moment';
import { NotificationStore } from '@/store';

/** 顯示最新一筆未讀訊息；關閉後由後端標為已讀並顯示下一筆未讀 */
const current = computed(() => NotificationStore.getters.LatestUnread);
const unreadCount = computed(() => NotificationStore.getters.UnreadCount);
const now = ref(Date.now());
let elapsedTimer = null;

const formatTime = (time) => {
    const m = moment(time);
    return m.isValid() ? m.format('YYYY/MM/DD HH:mm:ss') : '';
};

const formatElapsed = (totalSeconds) => {
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const parts = [];
    if (days > 0)
        parts.push(`${days} 天`);
    if (hours > 0 || days > 0)
        parts.push(`${hours} 小時`);
    if (minutes > 0 || hours > 0 || days > 0)
        parts.push(`${minutes} 分`);
    parts.push(`${seconds} 秒`);
    return `已過 ${parts.join(' ')}`;
};

const elapsedText = computed(() => {
    const receivedTime = current.value?.ReceivedTime;
    if (!receivedTime)
        return '';
    const start = moment(receivedTime);
    if (!start.isValid())
        return '';
    const elapsedSeconds = Math.max(0, Math.floor((now.value - start.valueOf()) / 1000));
    return formatElapsed(elapsedSeconds);
});

const stopElapsedTimer = () => {
    if (elapsedTimer == null)
        return;
    clearTimeout(elapsedTimer);
    elapsedTimer = null;
};

const scheduleElapsedTick = () => {
    const delay = 1000 - (Date.now() % 1000);
    elapsedTimer = setTimeout(() => {
        now.value = Date.now();
        scheduleElapsedTick();
    }, delay);
};

const startElapsedTimer = () => {
    stopElapsedTimer();
    now.value = Date.now();
    scheduleElapsedTick();
};

watch(current, (item) => {
    if (item)
        startElapsedTimer();
    else
        stopElapsedTimer();
}, { immediate: true });

onUnmounted(stopElapsedTimer);

const close = () => {
    if (current.value)
        NotificationStore.dispatch('markRead', current.value.MsgID);
};

const openHistory = () => {
    NotificationStore.commit('setHistoryVisible', true);
};
</script>

<style lang="scss" scoped>
.host-message-display {
    height: 100%;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    box-sizing: border-box;

    border-radius: 0;
    border: 1px solid rgba(255, 255, 255, 0.18);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.24);

    color: #ffffff;
    background: rgba(13, 72, 161, 0.92);
    position: relative;
    overflow: hidden;

    /* 專業醒目但不刺眼：輕微呼吸＋發光 */
    animation: host-pulse 1.8s ease-in-out infinite;

    .content {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: min(92vw, 1280px);
        max-height: 100%;
        padding: 28px 24px;
        text-align: center;
    }

    .meta {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        max-width: 100%;
        color: rgba(255, 255, 255, 0.82);
        font-size: clamp(15px, 1.8vh, 20px);
        font-weight: 600;
        letter-spacing: 0.06em;
        line-height: 1.2;
    }

    .meta-dot {
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.55);
        flex: 0 0 auto;
    }

    .meta-rule {
        width: 40px;
        height: 2px;
        margin: 14px 0 18px;
        border-radius: 1px;
        background: rgba(255, 255, 255, 0.45);
        flex: 0 0 auto;
    }

    .time-container,
    .elapsed-container {
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
    }

    .elapsed-container {
        color: #ffffff;
    }

    .message-container {
        max-width: 100%;
        max-height: 18vh;
        overflow: auto;
        padding-left: 20px;
        padding-right: 20px;
        scrollbar-width: auto;
        scrollbar-color: rgba(255, 255, 255, 0.85) rgba(8, 40, 96, 0.35);
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        font-size: clamp(32px, 5.2vh, 68px);
        font-weight: 700;
        line-height: 1.35;
        letter-spacing: 0;
        text-align: center;
        text-wrap: balance;
        overflow-wrap: break-word;
        text-shadow: 0 2px 16px rgba(0, 0, 0, 0.22);

        &::-webkit-scrollbar {
            width: 22px;
        }

        &::-webkit-scrollbar-track {
            margin: 8px 0;
            background: rgba(8, 40, 96, 0.35);
            border-radius: 999px;
        }

        &::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.82);
            border-radius: 999px;
        }

        &::-webkit-scrollbar-thumb:hover {
            background: #ffffff;
        }
    }

    .right {
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        gap: 8px;
        position: absolute;
        top: 16px;
        right: 16px;
        z-index: 1;
    }

    .title-container {
        max-width: 42vw;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .more-btn {
        height: 32px;
        padding: 0 12px;
        border-radius: 16px;
        border: 1px solid rgba(255, 214, 0, 0.75);
        background: rgba(255, 193, 7, 0.22);
        color: #fff;
        font-weight: bold;
        white-space: nowrap;
    }

    .more-btn:hover {
        background: rgba(255, 193, 7, 0.35);
    }

    .action-btn,
    .close-btn {
        flex: 0 0 auto;
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

    .action-btn:hover {
        background: rgba(255, 255, 255, 0.14);
        border-color: rgba(255, 255, 255, 0.32);
        transform: translateY(-1px);
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

</style>