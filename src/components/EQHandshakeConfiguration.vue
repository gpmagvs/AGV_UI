<template>
  <div class="eq-station-hs-configuration">
    <!-- <h6>eq-station-hs-configuration</h6> -->
    <el-divider>General</el-divider>
    <el-form-item label="從派車同步下載">
      <div class="d-flex w-100">
        <el-checkbox
          v-model="SyncFromAGVSBind"
          class="flex-fill"
          @change="(val)=>{
          $emit('onSyncAGVSCheckBoxChanged',val)
        }"
        ></el-checkbox>
        <el-button type="primary">Sync From AGVS</el-button>
      </div>
    </el-form-item>
    <el-divider class="my-5">Configuration</el-divider>
    <div class="w-100 my-2 text-start">
      <el-button type="primary" @click="SaveConfiguration">儲存</el-button>
      <el-button type="info" @click="DownloadConfiguration">重新載入</el-button>
      <el-button type="warning" @click="CreateNew">新增</el-button>
    </div>
    <el-table
      :data="configList"
      border
      size="small"
      height="500"
      v-loading="loading"
      :row-class-name="GetRowClassName"
      style="width: 100%;"
      row-key="Index"
    >
      <el-table-column v-if="false" label="Index" prop="Index" width="80"></el-table-column>
      <el-table-column label="Tag" prop="Tag" width="80">
        <template #default="scope">
          <el-input type="number" :step="1" v-model="scope.row.Tag"></el-input>
        </template>
      </el-table-column>
      <el-table-column label="名稱" prop="Name">
        <template #default="scope">
          <el-input v-model="scope.row.Name"></el-input>
        </template>
      </el-table-column>
      <el-table-column label="是否交握" prop="HandShakeModeHandShakeMode">
        <template #default="scope">
          <el-select-v2
            v-model="scope.row.HandShakeModeHandShakeMode"
            :options="[
              { value: 0, label: '不需交握' },
              { value: 1, label: '需交握' }
            ]"
          ></el-select-v2>
        </template>
      </el-table-column>
      <el-table-column label="轉移模式" prop="CargoTransferMode">
        <template #default="scope">
          <el-select-v2
            v-model="scope.row.CargoTransferMode"
            :options="[
              { value: 0, label: '設備動作' },
              { value: 1, label: 'AGV動作' },
              { value: 2, label: '僅第一層設備動作' },
            ]"
          ></el-select-v2>
        </template>
      </el-table-column>
      <el-table-column label="交握通訊方式" prop="HandShakeConnectionMode">
        <template #default="scope">
          <el-select-v2
            v-model="scope.row.HandShakeConnectionMode"
            :options="[
              { value: 0, label: '光IO' },
              { value: 1, label: 'Modbus' },
              { value: 2, label: '模擬' }
            ]"
          ></el-select-v2>
        </template>
      </el-table-column>

      <el-table-column label="Modbus Port" prop="ModbusTcpPort">
        <template #default="scope">
          <el-input
            :disabled="scope.row.HandShakeConnectionMode != 1"
            type="number"
            :step="1"
            v-model="scope.row.ModbusTcpPort"
          ></el-input>
        </template>
      </el-table-column>
      <el-table-column label="牙叉伸出" prop="ForkArmExtend" v-if="IsForkAGV">
        <template #default="scope">
          <el-select-v2
            v-model="scope.row.ForkArmExtend"
            :options="[
              { value: false, label: '不需' },
              { value: true, label: '需要' }
            ]"
          ></el-select-v2>
        </template>
      </el-table-column>
      <el-table-column>
        <template #default="scope">
          <el-button @click="HandleDelete(scope.row)" type="danger">Delete</el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- {{configList}} -->
  </div>
</template>

<script>
import { DownloadEQHsSettings, SaveEQHsSettings } from '@/api/VMSAPI'
import { AGVStatusStore } from '@/store';
export default {
  props: {
    SyncFromAGVS: {
      type: Boolean,
      default: false
    },
  },
  data() {
    return {
      loading: false,
      configList: [],
      SyncFromAGVSBind: false
    }
  },
  computed: {
    IsForkAGV() {
      return AGVStatusStore.getters.IsForkAGV;
    }
  },
  methods: {
    async DownloadConfiguration() {
      this.loading = true;
      var response = await DownloadEQHsSettings();
      //key:tag, value:{}
      var _list = [];
      var index = 0;
      Object.keys(response).forEach(tagStr => {
        var opt = response[tagStr];
        const tagInt = Number.parseInt(tagStr)
        opt.Tag = tagInt;
        opt.Index = index;
        index += 1;
        _list.push(opt)
      });
      console.log(_list)
      this.configList = _list;
      setTimeout(() => {
        this.loading = false;
      }, 400);
      //   this.configList = [..._list, ..._list, ..._list];// 測試多筆資料用
      //   console.log(response)
    },
    CreateNew() {
      var newSetting = {};
      newSetting.Tag = 0;
      newSetting.Name = '';
      newSetting.HandShakeModeHandShakeMode = 1;
      newSetting.CargoTransferMode = 0;
      newSetting.HandShakeConnectionMode = 0;
      newSetting.ForkArmExtend = false;
      newSetting.NewAdd = true;
      this.configList = [newSetting, ...this.configList]
    },
    GetRowClassName(data) {
      function anyTagRepeat(currentTag, existConfligList) {
        var tagSearchOut = existConfligList.filter(opt => opt.Tag == currentTag);
        return tagSearchOut.length > 1;
      }

      //data: { row: any, rowIndex: number }
      var rowData = data.row;

      if (rowData.NewAdd) {
        return 'bg-info'
      }

      if (anyTagRepeat(rowData.Tag, this.configList)) {
        return 'bg-danger'
      }
      if (rowData.Tag == 0) {
        return 'bg-warning text-light'
      }
      return ''
    },
    async SaveConfiguration() {
      var _errMsg = '';
      if (this.IsAnyTagZero()) {
        _errMsg = 'Tag不得為0'
      }
      if (this.IsTagRepeat()) {
        _errMsg = 'Tag不得重覆設置'
      }

      if (_errMsg != '') {
        this.$swal.fire(
          {
            title: _errMsg,
            text: '',
            icon: 'warning',
            showCancelButton: false,
            confirmButtonText: 'OK',
            customClass: 'my-sweetalert'
          })
        return;
      }

      const res = await SaveEQHsSettings(this.configList);
      if (res.confirm) {
        this.DownloadConfiguration();
        this.$swal.fire(
          {
            title: '儲存成功',
            text: '',
            icon: 'success',
            showCancelButton: false,
            confirmButtonText: 'OK',
            customClass: 'my-sweetalert'
          })
      } else {
        this.$swal.fire(
          {
            title: '儲存失敗',
            text: res.message,
            icon: 'error',
            showCancelButton: false,
            confirmButtonText: 'OK',
            customClass: 'my-sweetalert'
          })
      }
    },
    IsTagRepeat() {
      //檢查Tag重覆設置
      const tagCollections = this.configList.map(item => item.Tag);
      const tagDistineCollections = [...new Set(tagCollections)]
      return tagCollections.length != tagDistineCollections.length;
    },
    IsAnyTagZero() {
      return !this.configList.every(opt => opt.Tag != 0)
    },
    HandleDelete(rowOpt) {
      var index = this.configList.indexOf(rowOpt)
      this.configList.splice(index, 1)
    }
  },
  mounted() {
    console.log('mounted')
    this.DownloadConfiguration();
  },
  created() {
    this.SyncFromAGVSBind = this.SyncFromAGVS;
  }
}
</script>

<style lang="scss" scoped>
</style>