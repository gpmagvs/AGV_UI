<template>
  <div class="crontab-setting">
    <div class="header-card">
      <div class="header-title-group">
        <h3>Crontab 排程管理</h3>
        <!-- <p>支援表格與原始文字雙模式，儲存前會先進行驗證。</p> -->
      </div>
      <div class="header-stats">
        <el-tag type="info">排程筆數 {{ tableRows.length }}</el-tag>
        <!-- <el-tag type="warning">保留行數 {{ preservedLines.length }}</el-tag> -->
      </div>
    </div>

    <div class="actions-bar">
      <el-radio-group v-model="editMode" size="small" class="mode-switch">
        <el-radio-button label="table">表格模式</el-radio-button>
        <el-radio-button label="raw">原始文字</el-radio-button>
      </el-radio-group>
      <div class="action-buttons">
        <el-button size="small" @click="loadCrontab" :loading="isLoading" class="action-btn action-btn-neutral">重新整理</el-button>
        <el-button size="small" @click="syncTableFromRaw" :disabled="editMode !== 'raw' || isReadOnly"
          class="action-btn action-btn-neutral">解析到表格</el-button>
        <el-button type="warning" size="small" @click="validateCrontab" :disabled="isReadOnly" :loading="isSaving"
          class="action-btn action-btn-warning">驗證</el-button>
        <el-button type="primary" size="small" @click="saveCrontab" :disabled="isReadOnly" :loading="isSaving"
          class="action-btn action-btn-primary">儲存</el-button>
      </div>
    </div>

    <el-alert class="mt-2" type="info" :closable="false" show-icon
      title="時間欄位可使用 *, */5, 1-10, 1,2,3 等語法（* 代表每個時間單位都執行）；命令欄請填完整 shell command（含可執行檔/腳本完整路徑與參數）。" />
    <el-alert v-if="isReadOnly" type="warning" :closable="false" show-icon title="目前帳號權限不足，僅可檢視 crontab。" />
    <el-alert v-if="syncWarningMessage" class="mt-2" type="warning" :closable="false" show-icon
      :title="syncWarningMessage" />

    <div v-if="editMode === 'table'" class="table-mode mt-3">
      <div class="table-actions mb-2">
        <el-button type="success" size="small" @click="addRow" :disabled="isReadOnly">新增排程</el-button>
      </div>
      <div v-if="!isCompactLayout" class="table-wrapper">
        <el-table :data="tableRows" border stripe max-height="520">
          <el-table-column prop="minute" label="分" width="90">
            <template #default="{ row }">
              <el-input v-model="row.minute" size="small" :disabled="isReadOnly" />
            </template>
          </el-table-column>
          <el-table-column prop="hour" label="時" width="90">
            <template #default="{ row }">
              <el-input v-model="row.hour" size="small" :disabled="isReadOnly" />
            </template>
          </el-table-column>
          <el-table-column prop="dayOfMonth" label="日" width="90">
            <template #default="{ row }">
              <el-input v-model="row.dayOfMonth" size="small" :disabled="isReadOnly" />
            </template>
          </el-table-column>
          <el-table-column prop="month" label="月" width="90">
            <template #default="{ row }">
              <el-input v-model="row.month" size="small" :disabled="isReadOnly" />
            </template>
          </el-table-column>
          <el-table-column prop="dayOfWeek" label="週" width="90">
            <template #default="{ row }">
              <el-input v-model="row.dayOfWeek" size="small" :disabled="isReadOnly" />
            </template>
          </el-table-column>
          <el-table-column prop="command" label="命令" min-width="260">
            <template #default="{ row }">
              <el-input v-model="row.command" size="small" :disabled="isReadOnly" class="command-input" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80">
            <template #default="{ $index }">
              <el-button type="danger" link :disabled="isReadOnly" @click="removeRow($index)">刪除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div v-else class="mobile-card-list">
        <el-card v-for="(row, index) in tableRows" :key="index" class="schedule-card">
          <div class="schedule-card-header">
            <span>排程 {{ index + 1 }}</span>
            <el-button type="danger" link :disabled="isReadOnly" @click="removeRow(index)">刪除</el-button>
          </div>
          <div class="cron-expression-preview">
            {{ row.minute || '*' }} {{ row.hour || '*' }} {{ row.dayOfMonth || '*' }} {{ row.month || '*' }} {{
              row.dayOfWeek
              || '*' }}
          </div>
          <div class="schedule-grid">
            <div class="field-block">
              <label>分 (Minute)</label>
              <el-input v-model="row.minute" size="small" :disabled="isReadOnly" placeholder="*" />
            </div>
            <div class="field-block">
              <label>時 (Hour)</label>
              <el-input v-model="row.hour" size="small" :disabled="isReadOnly" placeholder="*" />
            </div>
            <div class="field-block">
              <label>日 (Day)</label>
              <el-input v-model="row.dayOfMonth" size="small" :disabled="isReadOnly" placeholder="*" />
            </div>
            <div class="field-block">
              <label>月 (Month)</label>
              <el-input v-model="row.month" size="small" :disabled="isReadOnly" placeholder="*" />
            </div>
            <div class="field-block full-row">
              <label>週 (Day of Week)</label>
              <el-input v-model="row.dayOfWeek" size="small" :disabled="isReadOnly" placeholder="*" />
            </div>
          </div>
          <div class="field-block command-block">
            <label>命令 (Command)</label>
            <el-input v-model="row.command" size="small" :disabled="isReadOnly" placeholder="/path/to/script.sh"
              class="command-input" />
          </div>
        </el-card>
      </div>
      <el-alert v-if="preservedLines.length > 0" class="mt-2" type="info" :closable="false" show-icon
        :title="`有 ${preservedLines.length} 行註解/環境變數/特殊格式，儲存時會附加在排程後方。`" />
      <el-collapse v-if="preservedLines.length > 0" class="mt-2">
        <el-collapse-item title="查看保留行內容（註解 / env / macro）" name="preserved">
          <pre class="preserved-preview">{{ preservedLines.join('\n') }}</pre>
        </el-collapse-item>
      </el-collapse>
    </div>

    <div v-else class="raw-mode mt-3">
      <el-input v-model="rawText" type="textarea" :rows="isCompactLayout ? 14 : 20" :disabled="isReadOnly"
        placeholder="請輸入完整 crontab 內容" />
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import Swal from 'sweetalert2';
import { SystemAPI } from '@/api/VMSAPI';
import { UserStore } from '@/store';

const isLoading = ref(false);
const isSaving = ref(false);
const editMode = ref('table');
const rawText = ref('');
const tableRows = ref([]);
const preservedLines = ref([]);
const syncWarningMessage = ref('');
const isCompactLayout = ref(false);

const userRole = computed(() => UserStore.getters.CurrentUserRole ?? 0);
const userName = computed(() => UserStore.getters.CurrentUserName ?? 'OPERATOR');
const isReadOnly = computed(() => userRole.value < 2);

const updateResponsiveState = () => {
  isCompactLayout.value = window.innerWidth < 1200;
};

const addRow = () => {
  tableRows.value.push({
    minute: '*',
    hour: '*',
    dayOfMonth: '*',
    month: '*',
    dayOfWeek: '*',
    command: ''
  });
};

const removeRow = (index) => {
  tableRows.value.splice(index, 1);
};

const parseRawContent = (content) => {
  const rows = [];
  const preserved = [];
  const unsupported = [];
  const lines = (content || '').replace(/\r\n/g, '\n').split('\n');
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return;
    }
    if (trimmed.startsWith('#') || /^[A-Za-z_][A-Za-z0-9_]*\s*=/.test(trimmed) || trimmed.startsWith('@')) {
      preserved.push(line);
      return;
    }

    const scheduleMatch = trimmed.match(/^(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(.+)$/);
    if (!scheduleMatch) {
      unsupported.push(line);
      return;
    }

    rows.push({
      minute: scheduleMatch[1],
      hour: scheduleMatch[2],
      dayOfMonth: scheduleMatch[3],
      month: scheduleMatch[4],
      dayOfWeek: scheduleMatch[5],
      command: scheduleMatch[6]
    });
  });

  return { rows, preserved, unsupported };
};

const composeRawFromTable = () => {
  const scheduleLines = tableRows.value
    .filter((row) => row.command && row.command.trim() !== '')
    .map((row) => `${row.minute} ${row.hour} ${row.dayOfMonth} ${row.month} ${row.dayOfWeek} ${row.command}`);
  const lines = scheduleLines.concat(preservedLines.value);
  return lines.join('\n');
};

const syncTableFromRaw = () => {
  const result = parseRawContent(rawText.value);
  tableRows.value = result.rows;
  preservedLines.value = result.preserved;
  if (result.unsupported.length > 0) {
    syncWarningMessage.value = `有 ${result.unsupported.length} 行無法轉換為表格欄位，請在原始模式確認。`;
  } else {
    syncWarningMessage.value = '';
  }
  ElMessage.success('已從原文解析至表格');
};

const loadCrontab = async () => {
  isLoading.value = true;
  try {
    const response = await SystemAPI.GetCrontab(userRole.value);
    if (!response.confirm) {
      ElMessage.error(response.message || '讀取 crontab 失敗');
      return;
    }
    rawText.value = response.content || '';
    const result = parseRawContent(rawText.value);
    tableRows.value = result.rows;
    preservedLines.value = result.preserved;
    syncWarningMessage.value = result.unsupported.length > 0 ? `有 ${result.unsupported.length} 行無法轉換為表格欄位。` : '';
  } catch (error) {
    ElMessage.error(error.message || '讀取 crontab 失敗');
  } finally {
    isLoading.value = false;
  }
};

const validateCrontab = async () => {
  isSaving.value = true;
  try {
    const content = editMode.value === 'table' ? composeRawFromTable() : rawText.value;
    const payload = {
      content,
      userName: userName.value,
      userRole: userRole.value
    };
    const result = await SystemAPI.ValidateCrontab(payload);
    if (!result.confirm) {
      const issueText = (result.issues || []).map((item) => `第${item.lineNumber}行: ${item.message}`).join('\n');
      ElMessage.error(result.message || '驗證失敗');
      if (issueText) {
        Swal.fire({ title: 'crontab 格式錯誤', text: issueText, icon: 'error' });
      }
      return;
    }
    ElMessage.success('crontab 驗證成功');
  } catch (error) {
    ElMessage.error(error.message || '驗證失敗');
  } finally {
    isSaving.value = false;
  }
};

const saveCrontab = async () => {
  let content = editMode.value === 'table' ? composeRawFromTable() : rawText.value;
  let confirmClear = false;

  if (!content.trim()) {
    const clearConfirm = await Swal.fire({
      title: '確定要清空 crontab？',
      text: '此操作會移除所有 user crontab 排程。',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '確認清空',
      cancelButtonText: '取消',
      customClass: 'my-sweetalert'
    });
    if (!clearConfirm.isConfirmed) {
      return;
    }
    confirmClear = true;
  }

  const confirmSave = await Swal.fire({
    title: '確定要儲存 crontab 變更？',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: '儲存',
    cancelButtonText: '取消',
    customClass: 'my-sweetalert'
  });
  if (!confirmSave.isConfirmed) {
    return;
  }

  isSaving.value = true;
  try {
    const payload = {
      content,
      userName: userName.value,
      userRole: userRole.value,
      confirmClear
    };
    const validateResult = await SystemAPI.ValidateCrontab(payload);
    if (!validateResult.confirm) {
      ElMessage.error(validateResult.message || '驗證失敗，已取消儲存');
      return;
    }

    const saveResult = await SystemAPI.SaveCrontab(payload);
    if (!saveResult.confirm) {
      ElMessage.error(saveResult.message || '儲存失敗');
      return;
    }
    ElMessage.success('crontab 儲存成功');
    rawText.value = content;
    syncTableFromRaw();
  } catch (error) {
    ElMessage.error(error.message || '儲存失敗');
  } finally {
    isSaving.value = false;
  }
};

watch(editMode, (newValue) => {
  if (newValue === 'raw') {
    rawText.value = composeRawFromTable();
  }
});

onMounted(async () => {
  updateResponsiveState();
  window.addEventListener('resize', updateResponsiveState);
  await loadCrontab();
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateResponsiveState);
});
</script>

<style scoped>
.crontab-setting {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.header-card {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border: 1px solid #ebeef5;
  border-radius: 10px;
  background: #fafcff;
  padding: 12px;
  gap: 12px;
}

.header-title-group h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.header-title-group p {
  margin: 4px 0 0;
  color: #606266;
  font-size: 13px;
}

.header-stats {
  display: flex;
  gap: 8px;
}

.actions-bar {
  position: sticky;
  top: 0;
  z-index: 2;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 10px;
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.action-buttons {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.action-btn {
  min-width: 88px;
  height: 30px;
  border-radius: 8px;
  font-weight: 600;
  letter-spacing: 0.2px;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.action-btn:hover {
  transform: translateY(-1px);
}

.action-btn-neutral {
  border-color: #d4d7de;
  background: linear-gradient(180deg, #ffffff 0%, #f5f7fa 100%);
}

.action-btn-warning {
  box-shadow: 0 2px 8px rgba(230, 162, 60, 0.22);
}

.action-btn-primary {
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.24);
}

.table-actions {
  display: flex;
  justify-content: flex-end;
}

.table-wrapper {
  overflow-x: auto;
}

.mobile-card-list {
  display: grid;
  gap: 10px;
}

.schedule-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-weight: 600;
}

.cron-expression-preview {
  font-family: Consolas, Monaco, monospace;
  font-size: 12px;
  color: #409eff;
  background: #ecf5ff;
  border: 1px solid #d9ecff;
  border-radius: 6px;
  padding: 6px 8px;
  margin-bottom: 8px;
  word-break: break-all;
}

.schedule-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 8px;
}

.field-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-block label {
  font-size: 12px;
  color: #606266;
  line-height: 1;
}

.field-block.full-row,
.command-block {
  grid-column: 1 / -1;
}

.command-input :deep(.el-input__wrapper) {
  background-color: #1f1f1f;
  box-shadow: 0 0 0 1px #3a3a3a inset;
}

.command-input :deep(.el-input__inner) {
  color: #f2f2f2;
  font-weight: 600;
}

.command-input :deep(.el-input__inner::placeholder) {
  color: #9b9b9b;
}

.command-input.is-disabled :deep(.el-input__wrapper) {
  background-color: #2a2a2a;
}

.preserved-preview {
  margin: 0;
  white-space: pre-wrap;
  background: #f5f7fa;
  border-radius: 6px;
  padding: 10px;
  font-size: 12px;
  color: #606266;
}

@media (max-width: 992px) {
  .header-card {
    flex-direction: column;
    align-items: stretch;
  }

  .header-stats {
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .actions-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .action-buttons {
    justify-content: flex-start;
  }
}

@media (max-width: 576px) {
  .schedule-grid {
    grid-template-columns: 1fr;
  }

  .mode-switch {
    width: 100%;
  }

  .mode-switch :deep(.el-radio-button) {
    width: 50%;
  }

  .mode-switch :deep(.el-radio-button__inner) {
    width: 100%;
  }

  .action-buttons :deep(.el-button) {
    flex: 1;
    min-width: 120px;
  }
}
</style>
