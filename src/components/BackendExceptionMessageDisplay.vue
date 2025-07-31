<template>
    <el-dialog v-model="isShow" title="系統例外異常" width="70%" draggable>
        <div class="w-100  text-start p-3 d-flex flex-column">
            <span>時間： <span class="text-decoration-underline">{{ currentTime }}</span></span>
            <span class="my-2 ">例外訊息：</span>
            <div class="message-container bg-danger text-light ">{{ exceptionMessage.message }}</div>
            <span class="mb-2 my-2">堆疊追蹤：</span>
            <div class="message-container bg-dark text-light ">{{
                exceptionMessage.stacktrace }}</div>
        </div>
        <template #footer>
            <el-button type="danger" size="large" @click="isShow = false">關閉</el-button>
            <el-button size="large" @click="copyStacktrace">複製堆疊追蹤</el-button>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import bus from '@/event-bus.js'
import { ElMessage } from 'element-plus'
const isShow = ref(false);
const exceptionMessage = ref({ message: '', stacktrace: '' });
const currentTime = ref(new Date().toLocaleString())
onMounted(() => {
    bus.on('BackendExceptionMessage', (obj = { message: '', stacktrace: '' }) => {
        isShow.value = true
        exceptionMessage.value = obj
    })
})
const copyStacktrace = () => {
    navigator.clipboard.writeText(exceptionMessage.value.stacktrace)
    ElMessage.success('複製成功，可以提供給開發者進行除錯分析')
}
</script>

<style lang="scss" scoped>
.message-container {
    max-height: 200px;
    padding: 10px;
    border-radius: 4px;
    overflow-y: auto;
    border: 1px solid red;
    scrollbar-width: thin;
    scrollbar-color: #ec0000 #252525;
}
</style>