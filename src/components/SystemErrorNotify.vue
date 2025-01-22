<template>
  <div v-if="isShow" class="system-error-notify">
    <div class="close-btn-container">
      <span class="bi bi-x-lg" @click="close"></span>
    </div>
    <div>
      <span class="bi bi-exclamation-triangle mx-2"></span>
      <span v-if="isDiskUsageError">磁碟空間不足</span>
      <span v-else>系統異常</span>
    </div>
    <div class="message">{{ sysMessage }}</div>
    <b-button class="w-100 clear-disk-btn" variant="danger" v-if="isDiskUsageError">清理磁碟空間</b-button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import bus from '@/event-bus.js'
const isShow = ref(false);
const sysMessage = ref('');
const isDiskUsageError = ref(false);
const close = () => {
  isShow.value = false
}
onMounted(() => {
  bus.on('VehicleError', (message) => {
    isShow.value = true
    sysMessage.value = message
  })
  bus.on('DiskUsageError', (message) => {
    isShow.value = true
    sysMessage.value = message
    isDiskUsageError.value = true
  })
})
</script>

<style lang="scss" scoped>
.system-error-notify {
  --clear-disk-btn-color: rgb(220, 53, 69);
  width: 100vw;
  position: fixed;
  top: 50%;
  left: 50%;
  padding: 20px;
  font-size: 50px;
  transform: translate(-50%, -50%);
  background-color: var(--clear-disk-btn-color);
  color: white;
  animation: blink 2s infinite;

  @keyframes blink {
    0% {
      background-color: var(--clear-disk-btn-color);
      color: white;
    }
    50% {
      background-color: white;
      color: var(--clear-disk-btn-color);
      border: 1px solid var(--clear-disk-btn-color);
    }
  }
  .close-btn-container {
    position: absolute;
    top: 0;
    right: 10px;
    cursor: pointer;
  }
  .message,
  .clear-disk-btn {
    font-size: 30px;
    padding: 10px;
  }
}
</style>

