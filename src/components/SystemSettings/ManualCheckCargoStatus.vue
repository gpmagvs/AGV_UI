<template>
  <div class="w-100 manual-check-cargo-status">
    <div class="d-flex justify-content-start border-bottom">
      <el-button type="success" @click="saveChanges" class="mb-2 mr-2">儲存變更</el-button>
      <el-button type="info" @click="reloadCheckPoints" class="mb-2 ml-2">重新載入</el-button>
    </div>

    <el-form label-width="70px" label-position="left">
      <el-form-item label="啟用">
        <el-switch v-model="dataForEdit.Enabled"></el-switch>
      </el-form-item>
      <el-form-item label="檢查點">
        <el-button type="primary" @click="addCheckPoint" class="mb-2">新增檢查點</el-button>

        <el-table
          :data="dataForEdit.CheckPoints"
          border
          style="width: 100%"
          header-cell-class-name="bg-primary text-light"
        >
          <el-table-column label="啟用" prop="Enabled" width="100">
            <template #default="scope">
              <el-switch v-model="scope.row.Enabled"></el-switch>
            </template>
          </el-table-column>
          <el-table-column label="檢查點" prop="CheckPointTag" min-width="200">
            <template #default="scope">
              <el-select v-model="scope.row.CheckPointTag" placeholder="請選擇檢查點" filterable>
                <el-option
                  v-for="option in checkPointTagsOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                ></el-option>
              </el-select>
            </template>
          </el-table-column>

          <el-table-column label="觸發時機" prop="TriggerMoment" min-width="150">
            <template #default="scope">
              <el-select v-model="scope.row.TriggerMoment">
                <el-option label="放貨前" :value="0"></el-option>
                <el-option label="取貨後" :value="1"></el-option>
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="超時時間(秒)" prop="Timeout" width="150">
            <template #default="scope">
              <el-input v-model="scope.row.Timeout"></el-input>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="scope">
              <el-button type="danger" size="small" @click="deleteCheckPoint(scope.$index)">刪除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="w-100 d-flex justify-content-end">
          <el-button
            type="info"
            @click="scrollToTop"
            class="mt-2"
            style="border-radius: 50%; width: 30px; height: 30px;"
          >Top</el-button>
        </div>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import _ from 'lodash';
import { map_store } from '@/store';
import { SystemAPI } from '@/api/VMSAPI.js'
export default {
  props: {
    checkPointData: {
      type: Object,
      default: () => {
        return {
          Enabled: false,
          CheckPoints: [
            {
              "Enabled": false,
              "CheckPointTag": -1,
              "Timeout": 30,
              "TriggerMoment": 0
            }
          ]
        }
      }
    },

  },
  data() {
    return {
      dataForEdit: {
        Enabled: false,
        CheckPoints: [
          {
            "Enabled": false,
            "CheckPointTag": -1,
            "Timeout": 30,
            "TriggerMoment": 0
          }
        ]
      }
    }
  },
  computed: {
    mapData() {
      return map_store.state.MapData;
    },
    checkPointTagsOptions() {
      let points = Object.values(this.mapData.Points).filter(
        pt => pt.StationType == 0 && pt.IsVirtualPoint == false
      );
      return points.map(point => ({
        value: point.TagNumber,
        label: `${point.TagNumber}(${point.Graph.Display})`
      })).sort((a, b) => a.value - b.value);
    }

  },
  methods: {
    deleteCheckPoint(index) {
      this.dataForEdit.CheckPoints.splice(index, 1);
    },
    addCheckPoint() {
      this.dataForEdit.CheckPoints.unshift({
        Enabled: false,
        CheckPointTag: undefined,
        Timeout: 30,
        TriggerMoment: 0
      });
    },
    reloadCheckPoints() {
      this.dataForEdit = _.cloneDeep(this.checkPointData);
      //排序
      this.dataForEdit.CheckPoints.sort((a, b) => a.CheckPointTag - b.CheckPointTag);
    },
    async saveChanges() {
      // Remove elements with undefined CheckPointTag
      this.dataForEdit.CheckPoints = this.dataForEdit.CheckPoints.filter(point => point.CheckPointTag !== undefined);

      //檢查是否有重複的CheckPointTag 且 triggerMoment相同
      const duplicates = this.dataForEdit.CheckPoints.reduce((acc, point, index, self) => {
        const foundIndex = self.findIndex(t => t.CheckPointTag === point.CheckPointTag && t.TriggerMoment === point.TriggerMoment);
        if (foundIndex !== index && !acc.includes(point.CheckPointTag)) {
          acc.push(point.CheckPointTag);
        }
        return acc;
      }, []);

      if (duplicates.length > 0) {
        this.$message.error(`已有相同Tag設置: ${duplicates.join(', ')}`);
        return;
      }

      var ret = await SystemAPI.SaveManualCheckCargoStatus(this.dataForEdit);
      if (ret.confirm) {
        // Sort CheckPoints by CheckPointTag
        this.dataForEdit.CheckPoints.sort((a, b) => a.CheckPointTag - b.CheckPointTag);
        this.$message.success(ret.message);
        this.$swal.fire(
          {
            title: '儲存成功',
            text: '',
            icon: 'success',
            showCancelButton: false,
            confirmButtonText: 'OK',
            customClass: 'my-sweetalert',
            timer: 1500
          })
      } else {
        this.$message.error(ret.message);
      }
    },
    scrollToTop() {
      const container = this.$el; // Assuming the current component is the container
      container.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  },
  mounted() {
    this.reloadCheckPoints();
  },
}
</script>

<style lang="scss" scoped>
.manual-check-cargo-status {
  height: 100%;
  overflow-y: auto;

  /* Custom scrollbar styles */
  &::-webkit-scrollbar {
    width: 16px; /* Increase scrollbar width */
  }

  &::-webkit-scrollbar-thumb {
    background-color: rgb(164, 164, 164); /* Change scrollbar color */
    border-radius: 16px; /* Rounded corners */
  }

  &::-webkit-scrollbar-track {
    background: #5c5c5c; /* Track color */
  }
}
</style>