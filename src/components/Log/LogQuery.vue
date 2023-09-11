<template>
  <div class="log-query-container">
    <div class="time-selector d-flex border-bottom">
      <span class>開始時間</span>
      <el-date-picker
        v-model="QueryOptions.FromTimeStr"
        type="datetime"
        placeholder="Select date and time"
        value-format="YYYY/MM/DD HH:mm:ss"
      />
      <span class>結束時間</span>
      <el-date-picker
        v-model="QueryOptions.ToTimeStr"
        type="datetime"
        placeholder="Select date and time"
        value-format="YYYY/MM/DD HH:mm:ss"
      />
      <el-button @click="HandleQueryBtnClick" type="primary">查詢</el-button>
    </div>

    <div class="table">
      <el-table size="small" :data="Results.Messages" style="width:800px">
        <el-table-column class prop="Time" label="Time" width="190"></el-table-column>
        <el-table-column class prop="Level" label="Level" width="120">
          <template #default="scope">
            <el-tag
              effect="dark"
              :type="GetTagType(scope.row.Level)"
              style="width:90px"
            >{{ scope.row.Level }}</el-tag>
          </template>
        </el-table-column>
        <!-- <el-table-column class prop="Class" label="Class" width="190"></el-table-column> -->
        <el-table-column class prop="Message" label="訊息" min-width="520"></el-table-column>
      </el-table>
    </div>
  </div>
  <div>
    <el-pagination
      background
      layout="prev, pager, next"
      :page-size="QueryOptions.NumberPerPage"
      :total="Results.TotalCount"
      @current-change="PageChangeHandler"
    />
  </div>
</template>

<script>
import { LogAPI } from '@/api/VMSAPI.js'
import moment from 'moment'
export default {
  data() {
    return {
      QueryOptions: {
        FromTimeStr: "2023/09/08 10:00:00",
        ToTimeStr: "2023/09/08 11:00:00",
        Page: 1,
        NumberPerPage: 12,
        SpeficStrings: []
      },
      Results: {
        TotalCount: 0,
        Messages: [
        ]
      }
    }
  },
  methods: {
    async HandleQueryBtnClick() {
      this.SaveTimeToLocalStorage();
      this.QueryOptions.Page = 1;
      var response = await LogAPI.Query(this.QueryOptions);

      this.Results.TotalCount = response.TotalCount
      this.Results.Messages = response.LogMessageList

    },
    async PageChangeHandler(page) {
      this.QueryOptions.Page = page;
      var response = await LogAPI.Query(this.QueryOptions);
      this.Results.TotalCount = response.TotalCount
      this.Results.Messages = response.LogMessageList
    },
    GetTagType(level) {
      if (level == 'Information')
        return 'primary'
      if (level == 'Warning')
        return 'warning'
      if (level == 'Critical' | level == 'Error')
        return 'danger'
    },
    SaveTimeToLocalStorage() {
      localStorage.setItem('log_query', JSON.stringify({
        from: this.QueryOptions.FromTimeStr,
        to: this.QueryOptions.ToTimeStr
      }))
    },
    RestoreTimeFromLocalStorage() {
      var jsonStr = localStorage.getItem('log_query')
      if (jsonStr) {
        var obj = JSON.parse(jsonStr)
        this.QueryOptions.FromTimeStr = obj.from;
        this.QueryOptions.ToTimeStr = obj.to;
      }
    }

  },
  mounted() {
    this.RestoreTimeFromLocalStorage();
  },
}
</script>

<style lang="scss" scoped>
.log-query-container {
  width: 100%;
  .time-selector {
    span {
      margin: 5px;
    }
  }
}
</style>