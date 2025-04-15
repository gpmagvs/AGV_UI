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
          :rules="rules"
          :ref="formSettings"
        >
          <el-divider class="mb-3">
            <span class="text-primary">
              無特殊需求
              <b>[需開啟]</b> 項目
            </span>
          </el-divider>
          <el-form-item
            v-for="item in needOpenItems"
            :key="item.key"
            :label="item.label"
            :prop="item.key"
            v-bind:class="{'highlighted-form-label': item.value==false }"
          >
            <el-switch
              :disabled="!IsGodLogin"
              @change="handleSwitchChanged(item.value,item.key)"
              size="small"
              v-model="item.value"
            />
          </el-form-item>

          <el-divider class="mb-3">
            <span class="text-danger">
              無特殊需求
              <b>[需關閉]</b> 項目
            </span>
          </el-divider>
          <el-form-item
            v-for="item in needCloseItems"
            :key="item.key"
            :label="item.label"
            :prop="item.key"
            v-bind:class="{'highlighted-form-label': item.value==true }"
          >
            <el-switch
              :disabled="!IsGodLogin"
              @change="handleSwitchChanged(item.value,item.key)"
              size="small"
              v-model="item.value"
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
import _ from 'lodash';

const loading = ref(true)
const dialogVisible = ref(false)
const form = ref({})
const formSettings = ref({})
const IsGodLogin = computed(() => UserStore.state.UserState.Role >= 2)


const checkItems = ref([
  {
    key: 'CST_READER_TRIGGER',
    label: '取貨須拍照',
    value: true,
    needOpen: true,

  },
  {
    key: 'CargoBiasDetectionWhenNormalMoving',
    label: '貨物狀態偵測(有貨移動中、取放貨過程偵測貨物是否偏移或不該存在)',
    value: true,
    needOpen: true
  },
  {
    key: 'LDULDParams.LeaveWorkStationNeedSendRequestToAGVS',
    label: '自設備/WIP退出時須詢問派車系統',
    value: true,
    needOpen: true
  },
  {
    key: 'CST_EXIST_DETECTION.After_EQ_Busy_Off',
    label: '當[取貨]時，檢查貨物是否已放置完全/當[放貨]時，檢查貨物是否已移除完成',
    value: true,
    needOpen: true
  },
  {
    key: 'CST_EXIST_DETECTION.Before_In',
    label: '準備[取貨]前，檢查車上無貨物; 準備[放貨]前，檢查車上貨物放置完全',
    value: true,
    needOpen: true
  },
  {
    key: 'LDULDParams.LsrObstacleDetectionEnable',
    label: '[放貨]前使用雷射偵測Port內是否有障礙物/貨物',
    value: true,
    needOpen: true
  },
  {
    key: 'LOAD_OBS_DETECTION.Enable_Load',
    label: '[放貨]時使用二重檢知感測器偵測Port內是否有障礙物/貨物',
    value: true,
    needOpen: true
  },
  {
    key: 'LOAD_OBS_DETECTION.Enable_UnLoad',
    label: '[取貨]時使用二重檢知感測器偵測Port內是否有障礙物/貨物',
    value: true,
    needOpen: true
  },
  {
    key: 'LDULD_Task_No_Entry',
    label: '空取空放',
    value: false,
    needOpen: false
  },
])

const needOpenItems = computed(() => {
  return checkItems.value.filter(item => item.needOpen === true)
})
const needCloseItems = computed(() => {
  return checkItems.value.filter(item => item.needOpen === false)
})

const checkParamSetting = async () => {
  loading.value = true
  dialogVisible.value = true
  SystemSettingsStore.commit('setIsSettingsLoaded', false);
  while (!SystemSettingsStore.state.IsSettingsLoaded) {
    await new Promise(resolve => setTimeout(resolve, 1000))
    await SystemSettingsStore.dispatch('downloadSettings');
  }
  formSettings.value = JSON.parse(JSON.stringify(SystemSettingsStore.state.Settings));

  checkItems.value.forEach(item => {
    let val = _.get(formSettings.value, item.key);
    item.value = val
  })

  loading.value = false
}

const handleSwitchChanged = async (value, key) => {
  _.set(formSettings.value, key, value)
  const result = await SystemAPI.SaveSettings(formSettings.value)
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

  .highlighted-form-label {
    :deep(label) {
      font-weight: bold;
      color: red;
    }
  }
}
</style>