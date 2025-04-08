<template>
    <div class="disk-status">
        <el-tooltip
            :content="tooltipContent"
            placement="top"
            :show-after="500">
            <div class="disk-status-content">
                <el-icon :class="statusClass">
                    <Monitor />
                </el-icon>
                <span class="disk-info"> {{ diskInfo }} </span>
            </div>
        </el-tooltip>
    </div>
</template>
<script>
import { Monitor } from '@element-plus/icons-vue'
import { SystemMsgStore } from '@/store'

export default {
    name: 'DiskStatus',
    components: {
        Monitor
    },
    computed: {
        diskStatus() {
            return SystemMsgStore.state.DiskStatus
        },
        diskInfo() {
            if (!this.diskStatus.Name) return '磁碟狀態: 未知'
            const used = this.formatBytes(this.diskStatus.Used)
            const total = this.formatBytes(this.diskStatus.TotalSizeOfDriver)
            const available = this.formatBytes(this.diskStatus.TotalAvailableSpace)
            return `已使用: ${used} / ${total}`
        },
        tooltipContent() {
            if (!this.diskStatus.Name) return '磁碟狀態未知'
            const used = this.formatBytes(this.diskStatus.Used)
            const total = this.formatBytes(this.diskStatus.TotalSizeOfDriver)
            const available = this.formatBytes(this.diskStatus.TotalAvailableSpace)
            return `磁碟: ${this.diskStatus.Name}\n總容量: ${total}\n已使用: ${used}\n可用空間: ${available}`
        },
        statusClass() {
            const usage = (this.diskStatus.Used / this.diskStatus.TotalSizeOfDriver) * 100
            if (usage > 90) return 'status-critical'
            if (usage > 70) return 'status-warning'
            return 'status-normal'
        }
    },
    methods: {
        formatBytes(bytes) {
            if (bytes === 0) return '0 MB'
            const k = 1024
            const sizes = ['MB', 'GB', 'TB']
            const i = Math.floor(Math.log(bytes) / Math.log(k))
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
        }
    }
}
</script>
<style lang="scss" scoped>
.disk-status {
    display: inline-flex;
    align-items: center;
    padding: 4px 8px;
    border-radius: 4px;
    background-color: var(--el-bg-color);

    .disk-status-content {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .disk-info {
        font-size: 14px;
        color: var(--el-text-color-regular);
    }

    .el-icon {
        font-size: 16px;

        &.status-normal {
            color: var(--el-color-success);
        }

        &.status-warning {
            color: var(--el-color-warning);
        }

        &.status-critical {
            color: var(--el-color-danger);
        }
    }
}
</style>