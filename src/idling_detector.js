import { UserStore } from './store';
var idleTime = 0
var interval = setInterval(() => {
    // 用戶不在當前分頁時暫停閒置偵測
    if (typeof document !== 'undefined' && (document.hidden || document.visibilityState === 'hidden')) {
        return;
    }
    idleTime += 1;
    if (idleTime >= 600) {
        UserStore.dispatch('Logout')
        location.reload()
        resetTimer()
    }
}, 1000);

document.addEventListener('touchstart', resetTimer);
document.addEventListener('touchmove', resetTimer);
document.addEventListener('touchend', resetTimer);
document.addEventListener('mousemove', resetTimer);
document.addEventListener('mousedown', resetTimer)
document.addEventListener('keydown', resetTimer);
document.addEventListener('visibilitychange', handleVisibilityChange);

function resetTimer() {
    idleTime = 0;
}

function handleVisibilityChange() {
    if (typeof document === 'undefined') {
        return;
    }
    // 回到分頁時重置計時，避免離開期間累積的時間立刻觸發登出
    if (!document.hidden && document.visibilityState === 'visible') {
        resetTimer();
    }
}
