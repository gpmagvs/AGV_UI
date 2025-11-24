<template>
    <div class="alarm-edit-container" v-loading="loading">
        <div class="header-section">
            <div class="title-section">
                <el-button type="default" @click="handleBack" :icon="ArrowLeft" circle class="back-button" />
                <h1 class="page-title">Alarm Table Edit</h1>
            </div>
            <div class="action-buttons">
                <el-button type="success" @click="handleAdd" :icon="Plus">
                    新增
                </el-button>
                <el-button type="info" @click="handleReload" :loading="loading" :icon="Refresh">
                    重新載入
                </el-button>
                <el-button type="primary" @click="handleSave" :loading="saving" :icon="Check">
                    儲存
                </el-button>
            </div>
        </div>

        <!-- 修改提示 -->
        <el-alert v-if="hasUnsavedChanges" type="warning" :closable="false" class="unsaved-alert">
            <template #title>
                <span class="alert-content">
                    <el-icon class="alert-icon">
                        <Warning />
                    </el-icon>
                    <span>您有未保存的修改，請記得儲存</span>
                </span>
            </template>
        </el-alert>

        <div class="table-section">
            <div class="search-section">
                <el-input v-model="searchQuery" placeholder="搜尋 Code、Description 或 CN" clearable class="search-input">
                    <template #prefix>
                        <el-icon>
                            <Search />
                        </el-icon>
                    </template>
                </el-input>
                <span class="search-result-count" v-if="searchQuery">
                    找到 {{ filteredAlarmList.length }} 筆結果
                </span>
            </div>
            <el-table :data="filteredAlarmList" border stripe size="default" row-key="Code" style="width: 100%"
                :highlight-current-row="true" empty-text="暫無數據" height="calc(100vh - 300px)" class="dark-table">
                <el-table-column prop="Code" label="Code" width="120" align="center">
                    <template #default="scope">
                        <span class="code-cell">{{ scope.row.Code }}</span>
                    </template>
                </el-table-column>

                <el-table-column prop="Description" label="Description" min-width="200">
                    <template #default="scope">
                        <el-input v-model="scope.row.Description" placeholder="請輸入 Description" clearable
                            @blur="handleInputBlur" />
                    </template>
                </el-table-column>

                <el-table-column prop="CN" label="CN" min-width="200">
                    <template #default="scope">
                        <el-input v-model="scope.row.CN" placeholder="請輸入 CN" clearable @blur="handleInputBlur" />
                    </template>
                </el-table-column>
            </el-table>
        </div>

        <!-- 新增對話框 -->
        <el-dialog v-model="addDialogVisible" title="新增 Alarm" width="500px" class="dark-dialog">
            <el-form :model="newAlarm" label-width="100px" label-position="left">
                <el-form-item label="Code" required>
                    <el-input v-model.number="newAlarm.Code" type="number" placeholder="請輸入 Code" />
                    <div v-if="codeExists" class="error-message">
                        Code {{ newAlarm.Code }} 已存在於當前數據中
                    </div>
                </el-form-item>
                <el-form-item label="Description" required>
                    <el-input v-model="newAlarm.Description" placeholder="請輸入 Description" />
                </el-form-item>
                <el-form-item label="CN" required>
                    <el-input v-model="newAlarm.CN" placeholder="請輸入 CN" />
                </el-form-item>
            </el-form>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="handleCancelAdd">取消</el-button>
                    <el-button type="primary" @click="handleConfirmAdd" :disabled="codeExists || !isFormValid">
                        確認
                    </el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { AlarmTableAPI } from '@/api/VMSAPI.js'
import { ElMessage } from 'element-plus'
import { Refresh, Check, ArrowLeft, Search, Plus, Warning } from '@element-plus/icons-vue'

const router = useRouter()

// 數據管理
const alarmList = ref([])
const originalAlarmList = ref([]) // 原始數據快照，用於檢測修改
const loading = ref(false)
const saving = ref(false)
const searchQuery = ref('')

// 新增對話框相關
const addDialogVisible = ref(false)
const codeExists = ref(false)
const newAlarm = ref({
    Code: null,
    Description: '',
    CN: ''
})

// 過濾後的 alarm 列表
const filteredAlarmList = computed(() => {
    if (!searchQuery.value || searchQuery.value.trim() === '') {
        return alarmList.value
    }

    const query = searchQuery.value.toLowerCase().trim()
    return alarmList.value.filter(item => {
        const code = String(item.Code || '').toLowerCase()
        const description = String(item.Description || '').toLowerCase()
        const cn = String(item.CN || '').toLowerCase()

        return code.includes(query) ||
            description.includes(query) ||
            cn.includes(query)
    })
})

// 深度比較兩個對象是否相等
const deepEqual = (obj1, obj2) => {
    if (obj1 === obj2) return true
    if (obj1 == null || obj2 == null) return false
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false

    const keys1 = Object.keys(obj1)
    const keys2 = Object.keys(obj2)

    if (keys1.length !== keys2.length) return false

    for (const key of keys1) {
        if (!keys2.includes(key)) return false
        if (!deepEqual(obj1[key], obj2[key])) return false
    }

    return true
}

// 檢測是否有未保存的修改
const hasUnsavedChanges = computed(() => {
    // 如果原始數據為空，表示還在初始化，不應該顯示提示
    if (originalAlarmList.value.length === 0) {
        return false
    }

    if (alarmList.value.length !== originalAlarmList.value.length) {
        return true
    }

    // 創建以 Code 為 key 的映射，方便比較
    const currentMap = new Map()
    const originalMap = new Map()

    alarmList.value.forEach(item => {
        currentMap.set(item.Code, item)
    })

    originalAlarmList.value.forEach(item => {
        originalMap.set(item.Code, item)
    })

    // 檢查是否有新增或刪除
    for (const code of currentMap.keys()) {
        if (!originalMap.has(code)) {
            return true // 有新增
        }
    }

    for (const code of originalMap.keys()) {
        if (!currentMap.has(code)) {
            return true // 有刪除
        }
    }

    // 檢查是否有修改（比較時需要確保字符串值一致）
    for (const [code, currentItem] of currentMap.entries()) {
        const originalItem = originalMap.get(code)
        if (!originalItem) {
            return true
        }
        // 比較關鍵字段
        if (currentItem.Code !== originalItem.Code ||
            String(currentItem.Description || '').trim() !== String(originalItem.Description || '').trim() ||
            String(currentItem.CN || '').trim() !== String(originalItem.CN || '').trim()) {
            return true // 有修改
        }
    }

    return false
})

// 獲取 alarm 列表
const fetchAlarmList = async () => {
    try {
        loading.value = true
        const data = await AlarmTableAPI.GetAlarmTable()
        // 統一使用深拷貝，確保兩個列表的結構一致
        const deepCopy = (item) => JSON.parse(JSON.stringify(item))
        alarmList.value = data.map(deepCopy)
        // 更新原始數據快照
        originalAlarmList.value = data.map(deepCopy)
    } catch (error) {
        console.error('獲取 alarm 列表失敗:', error)
        ElMessage.error('獲取數據失敗，請稍後再試')
    } finally {
        loading.value = false
    }
}

// 重新載入
const handleReload = async () => {
    await fetchAlarmList()
    ElMessage.success('數據已重新載入')
}

// 保存數據
const handleSave = async () => {
    try {
        saving.value = true

        // // 驗證數據（使用原始數據，不是過濾後的）
        // const hasEmptyDescription = alarmList.value.some(item => !item.Description || item.Description.trim() === '')
        // const hasEmptyCN = alarmList.value.some(item => !item.CN || item.CN.trim() === '')

        // if (hasEmptyDescription || hasEmptyCN) {
        //     ElMessage.warning('請確保所有欄位都已填寫')
        //     return
        // }

        const result = await AlarmTableAPI.SaveAlarmList(alarmList.value)

        if (result.success) {
            // 更新原始數據快照
            originalAlarmList.value = alarmList.value.map(item => JSON.parse(JSON.stringify(item)))
            ElMessage.success('保存成功')
        } else {
            ElMessage.error(result.message || '保存失敗')
        }
    } catch (error) {
        console.error('保存失敗:', error)
        ElMessage.error('保存失敗，請稍後再試')
    } finally {
        saving.value = false
    }
}

// 返回主頁
const handleBack = () => {
    router.push({ name: 'home' })
}

// Debounce 函數
const debounce = (func, delay) => {
    let timeoutId
    return (...args) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => func.apply(null, args), delay)
    }
}

// 檢查 Code 是否已存在
const checkCodeExists = () => {
    if (newAlarm.value.Code === null || newAlarm.value.Code === '') {
        codeExists.value = false
        return
    }

    const code = Number(newAlarm.value.Code)
    codeExists.value = alarmList.value.some(item => item.Code === code)
}

// 使用 debounce 包裝檢查函數（延遲 500ms）
const debouncedCheckCodeExists = debounce(checkCodeExists, 500)

// 監聽 Code 輸入變化
watch(() => newAlarm.value.Code, (newValue) => {
    // 如果 Code 為空，立即清除錯誤狀態
    if (newValue === null || newValue === '') {
        codeExists.value = false
        return
    }
    // 否則使用 debounce 檢查
    debouncedCheckCodeExists()
})

// 表單驗證
const isFormValid = computed(() => {
    return newAlarm.value.Code !== null &&
        newAlarm.value.Code !== '' &&
        newAlarm.value.Description.trim() !== '' &&
        newAlarm.value.CN.trim() !== '' &&
        !codeExists.value
})

// 打開新增對話框
const handleAdd = () => {
    newAlarm.value = {
        Code: null,
        Description: '',
        CN: ''
    }
    codeExists.value = false
    addDialogVisible.value = true
}

// 取消新增
const handleCancelAdd = () => {
    addDialogVisible.value = false
    newAlarm.value = {
        Code: null,
        Description: '',
        CN: ''
    }
    codeExists.value = false
}

// 確認新增
const handleConfirmAdd = () => {
    if (!isFormValid.value) {
        ElMessage.warning('請填寫所有欄位，並確保 Code 不存在')
        return
    }

    if (codeExists.value) {
        ElMessage.warning(`Code ${newAlarm.value.Code} 已存在，無法新增`)
        return
    }

    // 添加到列表
    alarmList.value.push({
        Code: Number(newAlarm.value.Code),
        Description: newAlarm.value.Description.trim(),
        CN: newAlarm.value.CN.trim()
    })

    ElMessage.success('新增成功')
    handleCancelAdd()
    // 注意：新增後會自動觸發 hasUnsavedChanges 的計算
}

// 輸入框失焦處理（可選，用於驗證或其他邏輯）
const handleInputBlur = () => {
    // 可以在這裡添加驗證邏輯
}

// 組件掛載時自動獲取數據
onMounted(() => {
    fetchAlarmList()
})
</script>

<style lang="scss" scoped>
.alarm-edit-container {
    padding: 24px;
    min-height: 100vh;
    background-color: #0d1117;
    color: #e6edf3;
}

.header-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding: 20px;
    background: #161b22;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.3);
    border: 1px solid #30363d;

    .title-section {
        display: flex;
        align-items: center;
        gap: 16px;

        .back-button {
            flex-shrink: 0;
            background-color: #21262d;
            border-color: #30363d;
            color: #e6edf3;

            &:hover {
                background-color: #30363d;
                border-color: #484f58;
            }
        }

        .page-title {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
            color: #e6edf3;
        }
    }

    .action-buttons {
        display: flex;
        gap: 12px;
    }
}

.table-section {
    background: #161b22;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.3);
    border: 1px solid #30363d;

    .search-section {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 16px;
        padding-bottom: 16px;
        border-bottom: 1px solid #30363d;

        .search-input {
            flex: 1;
            max-width: 400px;

            :deep(.el-input__wrapper) {
                background-color: #0d1117;
                border-color: #30363d;
                box-shadow: none;

                &:hover {
                    border-color: #484f58;
                }

                &.is-focus {
                    border-color: #58a6ff;
                }

                .el-input__inner {
                    color: #e6edf3;

                    &::placeholder {
                        color: #8b949e;
                    }
                }
            }
        }

        .search-result-count {
            color: #8b949e;
            font-size: 14px;
            white-space: nowrap;
        }
    }

    :deep(.el-table) {
        background-color: #161b22;
        color: #e6edf3;
        border-color: #30363d;

        .el-table__header-wrapper {
            .el-table__header {
                background-color: #0d1117;
                color: #e6edf3;

                th {
                    background-color: #0d1117;
                    border-color: #30363d;
                    color: #e6edf3;
                }
            }
        }

        .el-table__body-wrapper {
            .el-table__body {
                tr {
                    background-color: #161b22;
                    color: #e6edf3;

                    &:hover {
                        background-color: #21262d !important;
                    }

                    td {
                        border-color: #30363d;
                        background-color: #161b22;
                        color: #e6edf3;
                    }
                }

                tr.el-table__row--striped {
                    background-color: #0d1117;

                    &:hover {
                        background-color: #21262d !important;
                    }

                    td {
                        background-color: #0d1117;
                    }
                }
            }
        }

        .code-cell {
            font-weight: 600;
            color: #58a6ff;
        }

        .el-input {
            width: 100%;
        }

        .el-table__cell {
            padding: 12px 0;
        }

        .el-input__wrapper {
            background-color: #0d1117;
            box-shadow: none;
            border: 1px solid #30363d;
            border-radius: 4px;
            transition: border-color 0.2s;

            &:hover {
                border-color: #484f58;
            }

            &.is-focus {
                border-color: #58a6ff;
            }

            .el-input__inner {
                color: #e6edf3;
                background-color: transparent;

                &::placeholder {
                    color: #8b949e;
                }
            }
        }

        .el-table__empty-block {
            background-color: #161b22;
            color: #8b949e;
        }

        .el-table__empty-text {
            color: #8b949e;
        }
    }

    // 滚动条样式（深色模式）
    :deep(.el-table__body-wrapper) {
        &::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }

        &::-webkit-scrollbar-track {
            background: #0d1117;
            border-radius: 4px;
        }

        &::-webkit-scrollbar-thumb {
            background: #30363d;
            border-radius: 4px;

            &:hover {
                background: #484f58;
            }
        }
    }
}

// 加载遮罩层深色模式
:deep(.el-loading-mask) {
    background-color: rgba(13, 17, 23, 0.8);
}

// 未保存修改提示
.unsaved-alert {
    margin-bottom: 16px;
    border: 1px solid #d29922;
    background-color: #1c2128;
    border-radius: 6px;

    :deep(.el-alert__content) {
        .el-alert__title {
            color: #d29922;
            font-weight: 500;
        }
    }

    .alert-content {
        display: flex;
        align-items: center;
        gap: 8px;

        .alert-icon {
            font-size: 18px;
        }
    }
}

// 新增對話框深色模式
:deep(.dark-dialog) {
    .el-dialog {
        background-color: #161b22;
        border: 1px solid #30363d;

        .el-dialog__header {
            border-bottom: 1px solid #30363d;
            padding: 20px 20px 15px;

            .el-dialog__title {
                color: #e6edf3;
                font-weight: 600;
            }

            .el-dialog__headerbtn {
                .el-dialog__close {
                    color: #8b949e;

                    &:hover {
                        color: #e6edf3;
                    }
                }
            }
        }

        .el-dialog__body {
            color: #e6edf3;
            padding: 20px;

            .el-form {
                .el-form-item {
                    .el-form-item__label {
                        color: #e6edf3;
                    }

                    .el-input {
                        .el-input__wrapper {
                            background-color: #0d1117;
                            border-color: #30363d;
                            box-shadow: none;

                            &:hover {
                                border-color: #484f58;
                            }

                            &.is-focus {
                                border-color: #58a6ff;
                            }

                            .el-input__inner {
                                color: #e6edf3;

                                &::placeholder {
                                    color: #8b949e;
                                }
                            }
                        }
                    }
                }

                .error-message {
                    color: #f85149;
                    font-size: 12px;
                    margin-top: 5px;
                }
            }
        }

        .el-dialog__footer {
            border-top: 1px solid #30363d;
            padding: 15px 20px;

            .dialog-footer {
                .el-button {
                    background-color: #21262d;
                    border-color: #30363d;
                    color: #e6edf3;

                    &:hover:not(:disabled) {
                        background-color: #30363d;
                        border-color: #484f58;
                    }

                    &.el-button--primary {
                        background-color: #238636;
                        border-color: #238636;
                        color: #fff;

                        &:hover:not(:disabled) {
                            background-color: #2ea043;
                            border-color: #2ea043;
                        }

                        &:disabled {
                            background-color: #1a472a;
                            border-color: #1a472a;
                            color: #8b949e;
                        }
                    }
                }
            }
        }
    }
}

// 響應式設計
@media (max-width: 768px) {
    .alarm-edit-container {
        padding: 16px;
    }

    .header-section {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;

        .title-section {
            width: 100%;
        }

        .action-buttons {
            width: 100%;
            justify-content: flex-end;
        }
    }

    .table-section {
        padding: 12px;
        overflow-x: auto;

        .search-section {
            flex-direction: column;
            align-items: stretch;

            .search-input {
                max-width: 100%;
            }

            .search-result-count {
                text-align: left;
            }
        }
    }
}
</style>