<template>
  <div>
    <el-button text type="info" @click="checkParamSetting">確認參數設定</el-button>
    <el-dialog v-model="dialogVisible" title="確認參數設定" width="80%" top="10vh" draggable>
      <template #header="{  titleId, titleClass }">
        <div class="d-flex flex-column align-items-start">
          <h4 :id="titleId" :class="titleClass">確認參數設定</h4>
          <!-- <div>save</div> -->
        </div>
      </template>
      <div class="content-container d-flex flex-row" v-loading="loading">
        <el-form
          v-if="!loading"
          class="w-100"
          :model="form"
          label-position="left"
          label-width="90%"
        >
          <el-divider class="mb-3">
            <span class="text-primary">
              無特殊需求
              <b>[需開啟]</b> 項目
            </span>
          </el-divider>

          <el-form-item label="取貨須拍照">
            <el-switch
              @change="handleSwitchChanged"
              size="small"
              v-model="formSettings.CST_READER_TRIGGER"
            />
          </el-form-item>
          <el-form-item label="貨物狀態偵測(有貨移動中、取放貨過程偵測貨物是否偏移或不該存在)">
            <el-switch
              @change="handleSwitchChanged"
              size="small"
              v-model="formSettings.CargoBiasDetectionWhenNormalMoving"
            />
          </el-form-item>
          <el-form-item label="自設備/WIP退出時須詢問派車系統">
            <el-switch
              @change="handleSwitchChanged"
              size="small"
              v-model="formSettings.LDULDParams.LeaveWorkStationNeedSendRequestToAGVS"
            />
          </el-form-item>
          <el-form-item label="當[取貨]時，檢查貨物是否已放置完全/當[放貨]時，檢查貨物是否已移除完成">
            <el-switch
              @change="handleSwitchChanged"
              size="small"
              v-model="formSettings.CST_EXIST_DETECTION.After_EQ_Busy_Off"
            />
          </el-form-item>
          <el-form-item label="準備[取貨]前，檢查車上無貨物; 準備[放貨]前，檢查車上貨物放置完全">
            <el-switch
              @change="handleSwitchChanged"
              size="small"
              v-model="formSettings.CST_EXIST_DETECTION.Before_In"
            />
          </el-form-item>
          <el-form-item label="[放貨]前使用雷射偵測Port內是否有障礙物/貨物">
            <el-switch
              @change="handleSwitchChanged"
              size="small"
              v-model="formSettings.LDULDParams.LsrObstacleDetectionEnable"
            />
          </el-form-item>
          <el-form-item label="[放貨]時使用二重檢知感測器偵測Port內是否有障礙物/貨物">
            <el-switch
              @change="handleSwitchChanged"
              size="small"
              v-model="formSettings.LOAD_OBS_DETECTION.Enable_Load"
            />
          </el-form-item>
          <el-form-item label="[取貨]時使用二重檢知感測器偵測Port內是否有障礙物/貨物">
            <el-switch
              @change="handleSwitchChanged"
              size="small"
              v-model="formSettings.LOAD_OBS_DETECTION.Enable_UnLoad"
            />
          </el-form-item>
          <el-divider class="mb-3">
            <span class="text-danger">
              無特殊需求
              <b>[需關閉]</b> 項目
            </span>
          </el-divider>
          <el-form-item label="空取空放">
            <el-switch
              @change="handleSwitchChanged"
              size="small"
              v-model="formSettings.LDULD_Task_No_Entry"
            />
          </el-form-item>
        </el-form>
        <!-- <pre
          v-if="IsGodLogin"
          style="width: 50%; height: 500px; overflow-y: auto;"
          class="text-align-left"
        > {{ formSettings }} </pre>-->
      </div>
    </el-dialog>
  </div>
</template>
<script setup>
import { ref, computed } from 'vue'
import { SystemSettingsStore, UserStore } from '@/store'
import { SystemAPI } from '@/api/VMSAPI.js'
import { ElNotification } from 'element-plus'

const loading = ref(true)
const dialogVisible = ref(false)
const form = ref({})
const formSettings = ref({})
const IsGodLogin = computed(() => UserStore.state.UserState.Role >= 2)
const checkParamSetting = async () => {
  loading.value = true
  dialogVisible.value = true
  SystemSettingsStore.commit('setIsSettingsLoaded', false);
  while (!SystemSettingsStore.state.IsSettingsLoaded) {
    await new Promise(resolve => setTimeout(resolve, 1000))
    await SystemSettingsStore.dispatch('downloadSettings');
  }
  formSettings.value = JSON.parse(JSON.stringify(SystemSettingsStore.state.Settings));
  loading.value = false
}

const handleSwitchChanged = async (value, key) => {
  const result = await SystemAPI.SaveSettings(formSettings.value)
  //{"confirm":true,"errorMsg":""}

  if (result && result.confirm) {
    ElNotification({
      title: '參數確認',
      message: '參數修改成功',
      type: 'success',
      duration: 1000,
    })
  } else {
    ElNotification({
      title: '參數確認',
      message: '參數修改失敗-' + result.errorMsg,
      type: 'error',
      duration: 2000,
    })
  }

}
</script>
<style lang="scss" scoped>
:deep(.el-dialog__header) {
  background-color: #409eff;
  margin-right: 0px;
  .el-dialog__title {
    color: white;
    font-size: 30px;
    font-weight: bold;
    letter-spacing: 10px;
  }
  .el-dialog__headerbtn .el-dialog__close {
    color: white;
    font-size: 40px;
  }
}

:deep(.el-dialog__body) {
  background-color: #f5f5f5;
  padding: 0px 20px;
}

.content-container {
  height: 70vh;
  overflow-y: auto;
}
</style>