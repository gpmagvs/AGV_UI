<template>
    <div class="video-container"> {{ h264Realtime }} <video
            id="videoPlayer"
            ref="video"
            style="width:100%; background: #000;"
            autoplay
            muted
            playsinline></video>
        <div class="debug-info">
            <div>狀態: {{ status }}</div>
            <div>幀數: {{ frameCount }}</div>
            <div>最後更新: {{ lastUpdate }}</div>
            <button @click="reconnect">重新連接</button>
        </div>
    </div>
</template>
<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import JMuxer from 'jmuxer';
import { CamStore } from '@/store';
import { Connect } from '@/Camera/CamStreamWorker'

const videoRef = ref(null);
const status = ref('初始化中');
const frameCount = ref(0);
const lastUpdate = ref('');
let jmuxer = null;
let frameBuffer = new Uint8Array(0);
let isProcessing = false;
let lastFrameType = null;
let lastFrameTime = 0;
let sequenceErrorCount = 0;
const MAX_SEQUENCE_ERRORS = 5;
const FRAME_TIMEOUT = 1000; // 1秒超時
const FRAME_BUFFER_SIZE = 1024 * 1024; // 1MB buffer

const h264Realtime = computed(() => { return CamStore.state.h264Data })

// 檢查幀序列是否正確
const checkFrameSequence = (nalType) => {
    const currentTime = Date.now();

    // 檢查是否超時
    if (currentTime - lastFrameTime > FRAME_TIMEOUT) {
        console.log('Frame timeout detected, resetting sequence');
        lastFrameType = null;
        sequenceErrorCount = 0;
        return true;
    }

    // 如果是 I 幀，總是接受
    if (nalType === 5) {
        lastFrameType = nalType;
        sequenceErrorCount = 0;
        return true;
    }

    // 如果是 P 幀，檢查是否在 I 幀之後
    if (nalType === 1) {
        if (lastFrameType === null) {
            console.log('P frame received without I frame');
            sequenceErrorCount++;
            return false;
        }
        lastFrameType = nalType;
        return true;
    }

    return true;
};

// 監視 h264Data 變化
watch(() => CamStore.state.h264Data, async (newData) => {
    if (!newData || isProcessing) {
        return;
    }

    if (!jmuxer) {
        console.log('JMuxer not initialized');
        return;
    }

    isProcessing = true;
    try {
        console.log('Processing new data...');

        // 處理數據
        const videoData = processVideoData(newData);
        if (!videoData || videoData.length === 0) {
            console.log('Failed to process video data or empty data');
            return;
        }

        console.log('Video data processed, size:', videoData.length);

        // 檢查是否為完整的幀
        const isCompleteFrame = (data) => {
            // 檢查是否包含起始碼
            const hasStartCode = data[0] === 0 && data[1] === 0 &&
                (data[2] === 1 || (data[2] === 0 && data[3] === 1));

            if (!hasStartCode) {
                console.log('No start code found, treating as frame slice');
                return false;
            }

            // 檢查是否為 I 幀或 P 幀
            const startCodeLength = data[2] === 1 ? 3 : 4;
            const nalType = data[startCodeLength] & 0x1F;

            // 檢查幀序列
            if (!checkFrameSequence(nalType)) {
                console.log('Frame sequence error detected');
                if (sequenceErrorCount >= MAX_SEQUENCE_ERRORS) {
                    console.log('Too many sequence errors, requesting key frame');
                    // 這裡可以發送請求給後端要求 I 幀
                    status.value = '等待關鍵幀...';
                    return false;
                }
                return false;
            }

            // 更新最後一幀時間
            lastFrameTime = Date.now();

            // I 幀 (5) 或 P 幀 (1)
            return nalType === 5 || nalType === 1;
        };

        // 如果是完整的幀，直接發送
        if (isCompleteFrame(videoData)) {
            console.log('Complete frame detected');
            frameBuffer = new Uint8Array(0); // 清空緩衝

            // 更新狀態
            frameCount.value++;
            lastUpdate.value = new Date().toLocaleTimeString();

            console.log('Feeding complete frame to JMuxer...');

            // 餵送數據到 JMuxer
            await new Promise((resolve) => {
                jmuxer.feed({
                    video: videoData,
                    callback: () => {
                        console.log('JMuxer feed callback called');
                        resolve();
                    }
                });
            });
        } else {
            // 如果是幀切片，添加到緩衝
            console.log('Frame slice detected, adding to buffer');
            const newBuffer = new Uint8Array(frameBuffer.length + videoData.length);
            newBuffer.set(frameBuffer);
            newBuffer.set(videoData, frameBuffer.length);
            frameBuffer = newBuffer;

            // 檢查緩衝是否包含完整的幀
            if (frameBuffer.length > 4) {
                const startCodePos = findStartCode(frameBuffer);
                if (startCodePos !== -1 && startCodePos > 0) {
                    // 找到完整的幀，發送它
                    const completeFrame = frameBuffer.slice(0, startCodePos);
                    console.log('Found complete frame in buffer, size:', completeFrame.length);

                    // 檢查幀序列
                    const startCodeLength = completeFrame[2] === 1 ? 3 : 4;
                    const nalType = completeFrame[startCodeLength] & 0x1F;

                    if (checkFrameSequence(nalType)) {
                        // 更新狀態
                        frameCount.value++;
                        lastUpdate.value = new Date().toLocaleTimeString();

                        console.log('Feeding buffered frame to JMuxer...');

                        // 餵送數據到 JMuxer
                        await new Promise((resolve) => {
                            jmuxer.feed({
                                video: completeFrame,
                                callback: () => {
                                    console.log('JMuxer feed callback called');
                                    resolve();
                                }
                            });
                        });
                    }

                    // 保留剩餘的數據
                    frameBuffer = frameBuffer.slice(startCodePos);
                }
            }
        }

        console.log('Data fed to JMuxer successfully');
        status.value = '正在播放';
    } catch (error) {
        console.error('Stream processing error:', error);
        status.value = '處理錯誤';
    } finally {
        isProcessing = false;
        console.log('Processing complete');
    }
}, { immediate: true });

// 查找起始碼位置
const findStartCode = (data) => {
    for (let i = 0; i < data.length - 4; i++) {
        if (data[i] === 0 && data[i + 1] === 0 &&
            (data[i + 2] === 1 || (data[i + 2] === 0 && data[i + 3] === 1))) {
            return i;
        }
    }
    return -1;
};

// 初始化 JMuxer
const initializeJMuxer = () => {
    try {
        // 確保 video 元素存在
        const videoElement = document.getElementById('videoPlayer');
        if (!videoElement) {
            console.error('Video element not found');
            return false;
        }

        jmuxer = new JMuxer({
            node: 'videoPlayer',
            mode: 'video',
            flushingTime: 0,
            fps: 30,
            clearBuffer: false,
            debug: true,
            onReady: () => {
                console.log('JMuxer ready');
                status.value = 'JMuxer 就緒';
            },
            onError: (error) => {
                console.error('JMuxer error:', error);
                status.value = 'JMuxer 錯誤';
            }
        });

        // 設置 video 元素的屬性
        videoElement.autoplay = true;
        videoElement.muted = true;
        videoElement.playsInline = true;

        return true;
    } catch (error) {
        status.value = 'JMuxer 初始化失敗';
        console.error('JMuxer initialization error:', error);
        return false;
    }
};

// 重新連接函數
const reconnect = async () => {
    status.value = '重新連接中...';
    frameCount.value = 0;
    frameBuffer = new Uint8Array(0);
    lastFrameType = null;
    lastFrameTime = 0;
    sequenceErrorCount = 0;

    if (jmuxer) {
        jmuxer.destroy();
        jmuxer = null;
    }

    try {
        await Connect();
        if (initializeJMuxer()) {
            status.value = '已重新連接';
        }
    } catch (error) {
        status.value = '重新連接失敗';
        console.error('Reconnection error:', error);
    }
};

// 處理視頻數據
const processVideoData = (data) => {
    if (!data) {
        console.log('No data to process');
        return null;
    }

    try {
        console.log('Processing data type:', typeof data);
        console.log('Raw data:', data);

        let bytes;
        // 如果是 Base64 字符串
        if (typeof data === 'string') {
            try {
                console.log('Decoding Base64 string...');
                const decoded = atob(data);
                bytes = new Uint8Array(decoded.length);
                for (let i = 0; i < decoded.length; i++) {
                    bytes[i] = decoded.charCodeAt(i);
                }
                console.log('Base64 decoded, size:', bytes.length);
            } catch (error) {
                console.error('Base64 decode error:', error);
                return new Uint8Array(0);
            }
        }
        // 如果已經是 Uint8Array
        else if (data instanceof Uint8Array) {
            console.log('Uint8Array data, size:', data.length);
            bytes = data;
        }
        // 如果是其他類型的數組
        else if (Array.isArray(data)) {
            console.log('Array data, length:', data.length);
            bytes = new Uint8Array(data);
        }
        // 如果是 ArrayBuffer
        else if (data instanceof ArrayBuffer) {
            console.log('ArrayBuffer data, size:', data.byteLength);
            bytes = new Uint8Array(data);
        }
        else {
            console.error('Unsupported data type:', typeof data);
            return null;
        }

        // 檢查是否為有效的 H.264 資料
        const isValidH264 = (data) => {
            // 檢查是否包含起始碼
            const hasStartCode = data[0] === 0 && data[1] === 0 &&
                (data[2] === 1 || (data[2] === 0 && data[3] === 1));

            if (!hasStartCode) {
                console.log('No H.264 start code found');
                return false;
            }

            // 檢查 NAL 單元類型
            const startCodeLength = data[2] === 1 ? 3 : 4;
            const nalType = data[startCodeLength] & 0x1F;

            // 有效的 NAL 單元類型範圍是 1-23
            if (nalType < 1 || nalType > 23) {
                console.log('Invalid NAL unit type:', nalType);
                return false;
            }

            return true;
        };

        // 如果資料不是有效的 H.264 資料，嘗試修復
        if (!isValidH264(bytes)) {
            console.log('Data is not valid H.264, attempting to fix...');

            // 創建新的 Uint8Array，添加起始碼
            const newBytes = new Uint8Array(bytes.length + 4);

            // 添加起始碼
            newBytes[0] = 0;
            newBytes[1] = 0;
            newBytes[2] = 0;
            newBytes[3] = 1;

            // 複製原始數據
            newBytes.set(bytes, 4);

            console.log('Added H.264 start code, new size:', newBytes.length);
            return newBytes;
        }

        return bytes;
    } catch (error) {
        console.error('Data processing error:', error);
        return null;
    }
};

// 組件掛載
onMounted(async () => {
    status.value = '連接中...';
    try {
        await Connect();
        if (initializeJMuxer()) {
            status.value = '已連接';
        }
    } catch (error) {
        status.value = '連接失敗';
        console.error('Connection error:', error);
    }
});

// 組件卸載
onUnmounted(() => {
    console.log('Cleaning up...');
    if (jmuxer) {
        jmuxer.destroy();
        jmuxer = null;
    }
    frameBuffer = new Uint8Array(0);
});
</script>
<style scoped>
.video-container {
    position: relative;
    width: 100%;
    background: #000;
}

.debug-info {
    position: absolute;
    top: 10px;
    left: 10px;
    color: #fff;
    background: rgba(0, 0, 0, 0.7);
    padding: 10px;
    border-radius: 4px;
    font-family: monospace;
}

button {
    margin-top: 10px;
    padding: 5px 10px;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

button:hover {
    background: #45a049;
}
</style>