<template>
    <div>
        <el-table :data="versionList" style="width: 100%">
            <el-table-column prop="Version" label="版本">
                <template #default="scope">
                    <el-tag effect="dark" type="success">{{ scope.row.Version }}</el-tag>
                </template>
            </el-table-column>
            <el-table-column prop="Description" label="描述" />
            <el-table-column prop="CreateTime" label="建立時間" />
            <el-table-column label="操作">
                <template #default="scope">
                    <el-button type="primary" @click="HandleChangeVersion(scope.row.Version)">變更版本</el-button>
                </template>
            </el-table-column>
        </el-table>
        <el-dialog v-model="confirmDialogVisible" draggable :title="`請輸入 '${confirmKeyword}' 進行確認`" width="50%" :close-on-click-modal="false" :close-on-press-escape="false" :show-close="false" append-to-body>
            <el-input v-model="confirmInput" placeholder="請輸入確認文字" @keyup.enter="handleConfirmInput" ref="confirmInputRef" />
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
import { ref, onMounted, nextTick } from 'vue';
import { SystemAPI } from '@/api/VMSAPI';
import moment from 'moment';
import Swal from 'sweetalert2'
import { ElMessage } from 'element-plus';

class VersionInfo {
    constructor(version, description, createTime) {
        this.Version = version;
        this.Description = description;
        this.CreateTime = moment(createTime).format('YYYY-MM-DD HH:mm:ss');
    }
}

const versionList = ref([new VersionInfo("1.0.0", "測試版本", "2021-01-01")]);

const confirmDialogVisible = ref(false);
const confirmInput = ref('');
const confirmKeyword = ref('');
const confirmInputRef = ref(null);
const confirmResolve = ref(null);

onMounted(async () => {
    var _versionList = await SystemAPI.GetVersionList();
    versionList.value = _versionList.reverse().map(v => new VersionInfo(v.Version, v.Description, v.CreateTime));
});

const HandleChangeVersion = async (version) => {
    //Swal 確認是否要真的要變更版本
    var _confirm = await Swal.fire({
        title: `確定要變更為 ${version} 嗎？`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: 'rgb(64, 158, 255)'
    });
    if (!_confirm.isConfirmed) {
        return;
    }


    var _confirmInput = await useUserInputToConfirm(version);
    if (!_confirmInput) {
        return;
    }
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
</script>
<style lang="scss" scoped>
.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}
</style>