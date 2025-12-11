<template>
    <div>
        <div class="head-action-container pb-2 mb-2 border-bottom d-flex justify-content-start">
            <el-button plain type="primary" @click="GetVersionListFromServer">重新整理</el-button>
        </div>
        <el-table :data="versionList" style="width: 100%" border stripe v-loading="isLoading">
            <el-table-column prop="Version" label="版本">
                <template #default="scope">
                    <el-tag effect="dark" type="success" style="font-size: 14px;width: 100px;padding-block: 14px;">{{
                        scope.row.Version
                    }}</el-tag>
                    <el-tag v-if="scope.row.Version == currentVersion" type="success" round
                        class="mx-1">Current</el-tag>
                </template>
            </el-table-column>
            <el-table-column prop="Description" label="描述" />
            <el-table-column prop="CreateTime" label="建立時間" />
            <el-table-column label="操作">
                <template #default="scope">
                    <el-button v-if="scope.row.Version == currentVersion" type="primary"
                        @click="HandleUpdeteCurrentVersionFile">更新檔案</el-button>
                    <el-button plain v-else="scope.row.Version == currentVersion" type="primary"
                        @click="HandleChangeVersion(scope.row.Version)">變更版本</el-button>
                    <el-button plain :disabled="scope.row.Version == currentVersion" type="danger"
                        @click="HandleDeleteVersion(scope.row.Version)">刪除</el-button>
                    <el-button plain @click="HandleDownloadVersion(scope.row.Version)">下載</el-button>
                </template>
            </el-table-column>
        </el-table>
        <el-dialog v-model="confirmDialogVisible" draggable :title="`請輸入 '${confirmKeyword}' 進行確認`" width="50%"
            :close-on-click-modal="false" :close-on-press-escape="false" :show-close="false" append-to-body>
            <el-input v-model="confirmInput" placeholder="請輸入確認文字" @keyup.enter="handleConfirmInput"
                ref="confirmInputRef" />
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="handleCancelConfirm">取消</el-button>
                    <el-button type="primary" @click="handleConfirmInput">確認</el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>
<script setup>
import param from '@/gpm_param';
import { ref, computed, onMounted, nextTick } from 'vue';
import { SystemAPI } from '@/api/VMSAPI';
import moment from 'moment';
import Swal from 'sweetalert2'
import { ElMessage } from 'element-plus';
import { AGVStatusStore } from '@/store';

class VersionInfo {
    constructor(version, description, createTime) {
        this.Version = version;
        this.Description = description;
        this.CreateTime = moment(createTime).format('YYYY-MM-DD HH:mm:ss');
    }
}
const isLoading = ref(false);
const versionList = ref([new VersionInfo("1.0.0", "測試版本", "2021-01-01")]);

const confirmDialogVisible = ref(false);
const confirmInput = ref('');
const confirmKeyword = ref('');
const confirmInputRef = ref(null);
const confirmResolve = ref(null);

const currentVersion = computed(() => {
    var _version = AGVStatusStore.getters.AGVStatus.APPVersion;
    const firstChar = _version.charAt(0);
    return _version.replace(firstChar, '');
})

onMounted(async () => {
    await GetVersionListFromServer();
});
const GetVersionListFromServer = async () => {
    try {
        isLoading.value = true;
        var _versionList = await SystemAPI.GetVersionList();
        _versionList.sort((a, b) => {
            const aParts = a.Version.split('.').map(Number);
            const bParts = b.Version.split('.').map(Number);

            for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
                const aVal = aParts[i] ?? 0;
                const bVal = bParts[i] ?? 0;

                if (aVal !== bVal) {
                    return aVal - bVal;
                }
            }
            return 0;
        })
        versionList.value = _versionList.reverse().map(v => new VersionInfo(v.Version, v.Description, v.CreateTime));

    } finally {
        setTimeout(() => {
            isLoading.value = false;
        }, 500);
    }
}
const HandleChangeVersion = async (version) => {
    //Swal 確認是否要真的要變更版本
    var _confirm = await Swal.fire({
        title: `確定要變更為 ${version} 嗎？`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: 'rgb(64, 158, 255)',
        backdrop: 'rgba(0, 0, 0, 0.5) url(./images/version-change.png) no-repeat right bottom'
    });
    if (!_confirm.isConfirmed) {
        return;
    }


    var _confirmInput = await useUserInputToConfirm(version);
    if (!_confirmInput) {
        return;
    }
    Swal.fire({
        title: '變更版本中...',
        text: `正在恢復版本至 ${version}，請稍候...`,
        icon: 'warning',
        showCancelButton: false,
        showConfirmButton: false,
        customClass: 'my-sweetalert'
    })
    var _response = await SystemAPI.ChangeVersion(version);
    if (_response.confirm) {
        Swal.fire({
            title: '變更版本成功',
            text: '車載系統將重新啟動...',
            icon: 'success'
        });
    } else {
        Swal.fire({
            title: '變更版本失敗',
            text: _response.message,
            icon: 'error'
        });
    }
}

const useUserInputToConfirm = async (keyWord) => {
    confirmKeyword.value = keyWord;
    confirmInput.value = '';
    confirmDialogVisible.value = true;

    // 等待下一個 tick 以確保 dialog 已經渲染
    await nextTick();
    // 聚焦到輸入框
    confirmInputRef.value?.input?.focus();

    return new Promise((resolve) => {
        confirmResolve.value = resolve;
    });
}

const handleConfirmInput = () => {
    if (!confirmInput.value) {
        ElMessage.warning('請輸入確認文字');
        return;
    }

    const isCorrect = confirmInput.value === confirmKeyword.value;
    if (!isCorrect) {
        ElMessage.error('請輸入正確的文字');
        confirmInput.value = '';
        confirmInputRef.value?.input?.focus();
        return;
    }

    confirmDialogVisible.value = false;
    confirmResolve.value?.(true);
}

const handleCancelConfirm = () => {
    confirmDialogVisible.value = false;
    confirmResolve.value?.(false);
}

const HandleDeleteVersion = async (version) => {
    var _confirm = await Swal.fire({
        title: `確定要刪除 ${version} 嗎？`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: 'rgb(64, 158, 255)',
        backdrop: 'rgba(0, 0, 0, 0.5) url(./images/delete.png) no-repeat right bottom'
    });
    if (!_confirm.isConfirmed) {
        return;
    }
    var _response = await SystemAPI.DeleteVersionBackupFile(version);
    if (_response.confirm) {
        Swal.fire({
            title: '刪除版本成功',
            icon: 'success'
        });
        await GetVersionListFromServer();
    } else {
        Swal.fire({
            title: '刪除版本失敗',
            text: _response.message,
            icon: 'error'
        });
    }
}
const HandleUpdeteCurrentVersionFile = async () => {
    var _confirm = await Swal.fire({
        title: `確定要更新目前版本的檔案嗎？`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: 'rgb(64, 158, 255)',
    });
    if (!_confirm.isConfirmed) {
        return;
    }
    try {
        Swal.fire({
            title: '更新檔案中...',
            icon: 'warning',
            showCancelButton: false,
            showConfirmButton: false,
            customClass: 'my-sweetalert'
        });

        var _response = await SystemAPI.BackupCurrentVersionFile();
        if (_response.confirm) {
            Swal.fire({
                title: '更新檔案成功',
                icon: 'success'
            });
        } else {
            Swal.fire({
                title: '更新檔案失敗',
                text: _response.message,
                icon: 'error'
            });
        }
    } catch (err) {
        Swal.fire({
            title: '更新檔案失敗',
            text: err.message,
            icon: 'error'
        });
    }
}

const HandleDownloadVersion = async (version) => {
    try {
        const fileName = `backup_${version}.zip`;
        const url = `${param.backend_host}/versions/${encodeURIComponent(fileName)}`;
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

    } catch (err) {
        console.error(err.message);
    }
}
</script>
<style lang="scss" scoped>
.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}
</style>