<template>
    <Transition name="host-banner" mode="out-in">
        <div v-if="current" :key="current.MsgID" class="host-message-display px-3" :class="urgencyClass">
            <div v-if="isApocalypse" class="apocalypse-layer" aria-hidden="true">
                <div class="apocalypse-veil"></div>
                <div class="apocalypse-status">
                    <span class="apocalypse-status__zh">嚴重逾時 · 請立即處理</span>
                    <span class="apocalypse-status__en">CRITICAL OVERDUE · ACT IMMEDIATELY</span>
                </div>
            </div>

            <div class="content">
                <div class="meta">
                    <time class="meta-chip" :datetime="current.ReceivedTime" :aria-label="receivedAriaLabel">
                        <span class="bilingual-label">
                            <span class="bilingual-label__zh">訊息接收時間</span>
                            <span class="bilingual-label__en">Received</span>
                        </span>
                        <span class="meta-chip__value-stack">
                            <span class="meta-chip__value">{{ receivedClock }}</span>
                            <span class="meta-chip__value-en">{{ receivedDate }}</span>
                        </span>
                    </time>
                    <span class="meta-sep" aria-hidden="true"></span>
                    <div class="meta-chip meta-chip--emphasis" :aria-label="elapsedText">
                        <span class="bilingual-label">
                            <span class="bilingual-label__zh">已過</span>
                            <span class="bilingual-label__en">Elapsed</span>
                        </span>
                        <span class="meta-chip__value-stack">
                            <span class="meta-chip__value">{{ elapsedDurationZh }}</span>
                            <span class="meta-chip__value-en">{{ elapsedDurationEn }}</span>
                        </span>
                    </div>
                </div>
                <div class="body">
                    <div v-if="current.Title" class="title-block">
                        <div class="title-container">{{ current.Title }}</div>
                    </div>
                    <div class="message-container" role="status" :title="current.Message">{{ current.Message }}</div>
                </div>
            </div>

            <div class="right">
                <!-- 其他未讀數量 -->
                <button v-if="unreadCount > 1" class="more-btn" type="button" @click="openHistory"
                    :aria-label="`還有 ${unreadCount - 1} 則未讀 / ${unreadCount - 1} more unread`">
                    <span class="more-btn__zh">+{{ unreadCount - 1 }} 則未讀</span>
                    <span class="more-btn__en">+{{ unreadCount - 1 }} unread</span>
                </button>
                <!-- 訊息紀錄 -->
                <button class="action-btn" type="button" @click="openHistory"
                    aria-label="訊息紀錄 / History" title="訊息紀錄 / History">
                    <span class="bi bi-clock-history" aria-hidden="true"></span>
                </button>
                <!-- close button：標為已讀 -->
                <button class="close-btn" type="button" @click="close"
                    aria-label="關閉（標為已讀） / Close (mark as read)"
                    title="關閉（標為已讀） / Close (mark as read)">
                    <span class="bi bi-x-lg" aria-hidden="true"></span>
                </button>
            </div>
        </div>
    </Transition>
</template>

<script setup>
import { computed, onActivated, onDeactivated, onMounted, onUnmounted, ref } from 'vue';
import moment from 'moment';
import { NotificationStore } from '@/store';

/** 直接讀 state.Items，確保 Vuex 變更能被追蹤（不單靠 getter） */
const current = computed(() => NotificationStore.state.Items.find(m => !m.IsRead) ?? null);
const unreadCount = computed(() => NotificationStore.state.Items.filter(m => !m.IsRead).length);

/** 已過時間改為 interval 內直接寫入 ref，避免 computed 早期 return 沒追蹤到時鐘 */
const elapsedSeconds = ref(0);
const elapsedDurationZh = ref('');
const elapsedDurationEn = ref('');
let elapsedTimer = null;

const receivedMoment = computed(() => {
    const receivedTime = current.value?.ReceivedTime;
    if (!receivedTime)
        return null;
    const m = moment(receivedTime);
    return m.isValid() ? m : null;
});

const receivedDate = computed(() => receivedMoment.value?.format('YYYY/MM/DD') ?? '');
const receivedClock = computed(() => receivedMoment.value?.format('HH:mm:ss') ?? '');
const receivedAriaLabel = computed(() => {
    if (!receivedMoment.value)
        return '';
    return `訊息接收時間 / Received ${receivedDate.value} ${receivedClock.value}`;
});

const formatElapsedDurationZh = (totalSeconds) => {
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
    return parts.join(' ');
};

const formatElapsedDurationEn = (totalSeconds) => {
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const parts = [];
    if (days > 0)
        parts.push(`${days}d`);
    if (hours > 0 || days > 0)
        parts.push(`${hours}h`);
    if (minutes > 0 || hours > 0 || days > 0)
        parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);
    return parts.join(' ');
};

const refreshElapsed = () => {
    const receivedTime = current.value?.ReceivedTime;
    if (!receivedTime) {
        elapsedSeconds.value = 0;
        elapsedDurationZh.value = '';
        elapsedDurationEn.value = '';
        return;
    }
    const startMs = new Date(receivedTime).getTime();
    if (Number.isNaN(startMs)) {
        elapsedSeconds.value = 0;
        elapsedDurationZh.value = '';
        elapsedDurationEn.value = '';
        return;
    }
    const totalSeconds = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
    elapsedSeconds.value = totalSeconds;
    elapsedDurationZh.value = formatElapsedDurationZh(totalSeconds);
    elapsedDurationEn.value = formatElapsedDurationEn(totalSeconds);
};

const elapsedText = computed(() => {
    if (!elapsedDurationZh.value)
        return '';
    return `已過 / Elapsed ${elapsedDurationZh.value} (${elapsedDurationEn.value})`;
});

const isApocalypse = computed(() => elapsedSeconds.value >= 1200);

/** 已過 3 分鐘橘、5 分鐘紅；10 分鐘閃爍；20 分鐘全螢幕末日特效 */
const urgencyClass = computed(() => {
    const classes = [];
    if (elapsedSeconds.value >= 300)
        classes.push('is-critical');
    else if (elapsedSeconds.value >= 180)
        classes.push('is-warning');
    if (elapsedSeconds.value >= 600)
        classes.push('is-stale');
    if (isApocalypse.value)
        classes.push('is-apocalypse');
    return classes;
});

const stopElapsedTimer = () => {
    if (elapsedTimer == null)
        return;
    clearInterval(elapsedTimer);
    elapsedTimer = null;
};

const startElapsedTimer = () => {
    stopElapsedTimer();
    refreshElapsed();
    elapsedTimer = setInterval(refreshElapsed, 1000);
};

const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible')
        refreshElapsed();
};

onMounted(() => {
    startElapsedTimer();
    document.addEventListener('visibilitychange', handleVisibilityChange);
});

/** App.vue 以 keep-alive 包住路由，需用 activated 重啟計時 */
onActivated(() => {
    startElapsedTimer();
});

onDeactivated(() => {
    stopElapsedTimer();
});

onUnmounted(() => {
    stopElapsedTimer();
    document.removeEventListener('visibilitychange', handleVisibilityChange);
});

/** Vite HMR 會重跑 setup 但不一定觸發 unmount，需手動清掉舊 interval */
if (import.meta.hot) {
    import.meta.hot.dispose(() => {
        stopElapsedTimer();
        document.removeEventListener('visibilitychange', handleVisibilityChange);
    });
}

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
    transition: background 280ms ease;

    /* 專業醒目但不刺眼：輕微呼吸＋發光 */
    animation: host-pulse 1.8s ease-in-out infinite;

    &.is-warning {
        background: rgba(217, 119, 6, 0.94);
    }

    &.is-critical {
        background: rgba(185, 28, 28, 0.94);
    }

    &.is-stale:not(.is-apocalypse) {
        animation: host-stale-flash 1s ease-in-out infinite;
    }

    /* 全螢幕簡化告警：半透明紅底 + 單一 opacity 脈動，低開銷 */
    &.is-apocalypse {
        position: fixed !important;
        inset: 0 !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        z-index: 100000 !important;
        border: none;
        border-radius: 0;
        background: transparent;
        box-shadow: none;
        animation: none;
        overflow: hidden;
    }

    .apocalypse-layer {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 0;
    }

    .apocalypse-veil {
        position: absolute;
        inset: 0;
        background: rgba(185, 28, 28, 0.45);
        animation: apocalypse-veil 1.2s ease-in-out infinite;
    }

    .apocalypse-status {
        position: absolute;
        top: 4vh;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        padding: 10px 20px;
        background: rgba(0, 0, 0, 0.72);
        white-space: nowrap;
    }

    .apocalypse-status__zh {
        font-size: clamp(20px, 3vh, 34px);
        font-weight: 800;
        letter-spacing: 0.1em;
        color: #ffffff;
    }

    .apocalypse-status__en {
        font-size: clamp(11px, 1.5vh, 14px);
        font-weight: 700;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: #fbbf24;
    }

    &.is-apocalypse .content {
        z-index: 1;
        width: min(92vw, 1280px);
        padding: 24px;
        background: rgba(185, 28, 28, 0.88);
        border: 2px solid #fbbf24;
    }

    &.is-apocalypse .message-container {
        font-size: clamp(34px, 6vh, 76px);
        color: #ffffff;
        font-weight: 800;
        max-height: 40vh;
    }

    &.is-apocalypse .title-container {
        color: #fef3c7;
    }

    &.is-apocalypse .meta-chip {
        background: rgba(0, 0, 0, 0.25);
        border-color: rgba(251, 191, 36, 0.55);
    }

    &.is-apocalypse .right {
        z-index: 2;
    }

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
        align-items: stretch;
        justify-content: center;
        flex-wrap: wrap;
        gap: 12px;
        max-width: 100%;
        color: rgba(255, 255, 255, 0.82);
        font-size: clamp(14px, 1.6vh, 18px);
        font-weight: 600;
        letter-spacing: 0.04em;
        line-height: 1.2;
    }

    .meta-sep {
        width: 1px;
        align-self: stretch;
        min-height: 44px;
        background: rgba(255, 255, 255, 0.24);
        flex: 0 0 auto;
    }

    /* Title 作為訊息區前言，弱於主文、強於 meta */
    .body {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        margin-top: 18px;
        padding-top: 16px;
        border-top: 1px solid rgba(255, 255, 255, 0.22);
    }

    .title-block {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        max-width: 56em;
        margin-bottom: 12px;
        padding: 0 12px;
    }

    .title-container {
        width: 100%;
        color: rgba(255, 255, 255, 0.92);
        font-size: clamp(16px, 2vh, 24px);
        font-weight: 600;
        letter-spacing: 0.01em;
        line-height: 1.4;
        text-align: center;
        text-wrap: balance;
        overflow-wrap: anywhere;
        white-space: normal;
        word-break: break-word;
    }

    /* 雙語標籤：中文主標 + 英文副標（機場／工業 HMI 常見） */
    .bilingual-label {
        display: inline-flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 2px;
        line-height: 1.1;
    }

    .bilingual-label__zh {
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.06em;
        color: rgba(255, 255, 255, 0.9);
    }

    .bilingual-label__en {
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: rgba(255, 255, 255, 0.58);
    }

    /* 監控／告警橫幅常見：對稱 Label＋Value 度量晶片；兩側等高 */
    .meta-chip {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        box-sizing: border-box;
        min-height: 52px;
        padding: 8px 12px;
        border-radius: 6px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        background: rgba(255, 255, 255, 0.1);
        color: #ffffff;
        white-space: nowrap;
        transition: background 200ms ease, border-color 200ms ease;
    }

    .meta-chip__value {
        font-size: clamp(16px, 2vh, 22px);
        font-weight: 700;
        letter-spacing: 0.03em;
        font-variant-numeric: tabular-nums;
        color: #ffffff;
        line-height: 1.15;
    }

    .meta-chip__value-stack {
        display: inline-flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: center;
        gap: 3px;
        min-height: 34px;
    }

    .meta-chip__value-en {
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.06em;
        font-variant-numeric: tabular-nums;
        color: rgba(255, 255, 255, 0.62);
        line-height: 1.15;
    }

    .meta-chip--emphasis {
        background: rgba(255, 255, 255, 0.14);
        border-color: rgba(255, 255, 255, 0.28);
    }

    &.is-warning .meta-chip,
    &.is-critical .meta-chip {
        background: rgba(255, 255, 255, 0.14);
        border-color: rgba(255, 255, 255, 0.3);
    }

    &.is-warning .meta-chip--emphasis,
    &.is-critical .meta-chip--emphasis {
        background: rgba(255, 255, 255, 0.18);
        border-color: rgba(255, 255, 255, 0.38);
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

    .more-btn {
        min-height: 36px;
        padding: 4px 12px;
        border-radius: 10px;
        border: 1px solid rgba(255, 214, 0, 0.75);
        background: rgba(255, 193, 7, 0.22);
        color: #fff;
        font-weight: bold;
        white-space: nowrap;
        display: inline-flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: center;
        gap: 1px;
        line-height: 1.15;
    }

    .more-btn__zh {
        font-size: 13px;
    }

    .more-btn__en {
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        opacity: 0.8;
    }

    .more-btn:hover {
        background: rgba(255, 193, 7, 0.35);
    }

    .action-btn {
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
        margin: 8px 8px 8px 0;
        height: 48px;
        width: 48px;
        border-radius: 8px;
        border: 2px solid #ffffff;
        background: #ffffff;
        color: #111827;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.28);
        transition: transform 120ms ease, background 120ms ease, border-color 120ms ease;
    }

    .close-btn .bi {
        font-size: 20px;
        line-height: 1;
    }

    .close-btn:hover {
        background: #f3f4f6;
        border-color: #f3f4f6;
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

/* 工業告警常見：深紅 ↔ 鮮明紅脈動，不額外加邊框 */
@keyframes host-stale-flash {

    0%,
    100% {
        background: rgba(127, 29, 29, 0.97);
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.32);
    }

    50% {
        background: rgba(220, 38, 38, 0.98);
        box-shadow: 0 14px 36px rgba(185, 28, 28, 0.45);
    }
}

@keyframes apocalypse-veil {

    0%,
    100% {
        opacity: 0.7;
    }

    50% {
        opacity: 1;
    }
}
</style>