<template>
    <el-dialog v-model="visible" title="提示訊息紀錄" width="90%" top="8vh" append-to-body draggable
        :z-index="10100" class="notification-history-dialog" @open="onOpen">
        <div class="toolbar d-flex align-items-center mb-2">
            <el-radio-group v-model="filter" size="large">
                <el-radio-button label="all">全部 ({{ items.length }})</el-radio-button>
                <el-radio-button label="unread">未讀 ({{ unreadCount }})</el-radio-button>
            </el-radio-group>
            <div class="flex-fill"></div>
            <el-button size="large" :disabled="unreadCount === 0" @click="markAllRead">
                <i class="bi bi-check2-all me-1"></i>全部已讀
            </el-button>
            <el-button size="large" type="danger" plain :disabled="items.length === 0" @click="clearAll">
                <i class="bi bi-trash me-1"></i>清除全部
            </el-button>
        </div>
        <el-table :data="rows" height="58vh" row-key="MsgID" :row-class-name="rowClassName" empty-text="目前沒有提示訊息"
            border>
            <el-table-column label="狀態" width="90" align="center">
                <template #default="{ row }">
                    <el-tag v-if="!row.IsRead" type="warning" effect="dark">未讀</el-tag>
                    <el-tag v-else type="info">已讀</el-tag>
                </template>
            </el-table-column>
            <el-table-column label="時間" width="190">
                <template #default="{ row }">{{ formatTime(row.ReceivedTime) }}</template>
            </el-table-column>
            <el-table-column label="來源" prop="Source" width="90" />
            <el-table-column label="內容" min-width="300">
                <template #default="{ row }">
                    <div v-if="row.Title" class="msg-title">{{ row.Title }}</div>
                    <div class="msg-text">{{ row.Message }}</div>
                </template>
            </el-table-column>
            <el-table-column label="已讀時間" width="190">
                <template #default="{ row }">{{ row.IsRead ? formatTime(row.ReadTime) : '' }}</template>
            </el-table-column>
            <el-table-column label="操作" width="120" align="center">
                <template #default="{ row }">
                    <el-button v-if="!row.IsRead" size="small" type="primary" @click="markRead(row)">標為已讀</el-button>
                </template>
            </el-table-column>
        </el-table>
    </el-dialog>
</template>

<script setup>
import { computed, ref } from 'vue';
import moment from 'moment';
import { ElMessageBox } from 'element-plus';
import { NotificationStore } from '@/store';

const filter = ref('all');

const visible = computed({
    get: () => NotificationStore.getters.HistoryVisible,
    set: (val) => NotificationStore.commit('setHistoryVisible', val)
});
const items = computed(() => NotificationStore.getters.Items);
const unreadCount = computed(() => NotificationStore.getters.UnreadCount);
const rows = computed(() => filter.value === 'unread' ? NotificationStore.getters.UnreadItems : items.value);

const formatTime = (time) => {
    if (!time)
        return '';
    const m = moment(time);
    return m.isValid() ? m.format('YYYY/MM/DD HH:mm:ss') : '';
};

const rowClassName = ({ row }) => row.IsRead ? '' : 'unread-row';

const onOpen = () => {
    // 開啟時與後端同步一次
    NotificationStore.dispatch('fetch');
};

const markRead = (row) => NotificationStore.dispatch('markRead', row.MsgID);
const markAllRead = () => NotificationStore.dispatch('markAllRead');

const clearAll = async () => {
    try {
        await ElMessageBox.confirm('確定要清除全部提示訊息紀錄？', '清除訊息', {
            confirmButtonText: '清除',
            cancelButtonText: '取消',
            type: 'warning',
            modalClass: 'notification-history-confirm'
        });
    } catch {
        return;
    }
    NotificationStore.dispatch('clearAll');
};
</script>

<style lang="scss">
/* 高於即時提示橫幅 (z-index: 10000) 與紀錄視窗 (10100) */
.notification-history-confirm {
    z-index: 10200 !important;
}
</style>

<style lang="scss" scoped>
.toolbar {
    gap: 8px;
}

.msg-title {
    font-weight: bold;
}

.msg-text {
    white-space: pre-wrap;
    word-break: break-word;
    font-size: 16px;
}

:deep(.unread-row) {
    font-weight: bold;
    --el-table-tr-bg-color: rgba(255, 193, 7, 0.12);
}
</style>
