<template>
  <div class="log-query-container">
    <b-tabs>
      <b-tab title="LOG">
        <div class="time-selector d-flex border">
          <span class>開始時間</span>
          <el-date-picker
            v-model="QueryOptions.FromTimeStr"
            type="datetime"
            placeholder="Select date and time"
            value-format="YYYY/MM/DD HH:mm:ss" />
          <span class>結束時間</span>
          <el-date-picker
            v-model="QueryOptions.ToTimeStr"
            type="datetime"
            placeholder="Select date and time"
            value-format="YYYY/MM/DD HH:mm:ss" />
          <el-button @click="HandleQueryBtnClick" type="primary">查詢</el-button>
        </div>
        <div class="table border">
          <el-table size="small" :data="Results.Messages" border style="width:800px">
            <el-table-column class prop="Time" label="Time" width="190"></el-table-column>
            <el-table-column class prop="Level" label="Level" width="120">
              <template #default="scope">
                <el-tag
                  effect="dark"
                  :type="GetTagType(scope.row.Level)"
                  style="width:90px">{{ scope.row.Level }}</el-tag>
              </template>
            </el-table-column>
            <!-- <el-table-column class prop="Class" label="Class" width="190"></el-table-column> -->
            <el-table-column class prop="Message" label="訊息" min-width="520"></el-table-column>
          </el-table>
        </div>
        <div>
          <el-pagination
            background
            layout="prev, pager, next"
            :page-size="QueryOptions.NumberPerPage"
            :total="Results.TotalCount"
            @current-change="PageChangeHandler" />
        </div>
      </b-tab>
      <b-tab title="停車精度">
        <div class="parking-acq border text-start">
          <div class="options">
            <div class="title">開始時間</div>
            <el-date-picker
              v-model="ParkingAcqQueryOptions.StartTimeStr"
              type="datetime"
              placeholder="Select date and time"
              value-format="YYYY/MM/DD HH:mm:ss" />
          </div>
          <div class="options">
            <div class="title">結束時間</div>
            <el-date-picker
              v-model="ParkingAcqQueryOptions.EndTimeStr"
              type="datetime"
              placeholder="Select date and time"
              value-format="YYYY/MM/DD HH:mm:ss" />
          </div>
          <div class="options">
            <div class="title">位置</div>
            <el-select @click="HandleParkLocSelectorClcik" v-model="ParkingAcqQueryOptions.Tag">
              <el-option v-for="loc in ParkedLocList" :key="loc.tag" :value="loc.tag" :label="loc.tag + ':' + loc.name"></el-option>
            </el-select>
            <el-button @click="HandleParkingACQQueryBtnClick" type="primary">查詢</el-button>
          </div>
          <el-divider></el-divider>
          <b-tabs>
            <b-tab title="散佈圖">
              <div class="px-5" id="park_acq_chart" style="width: 100%;">
                <apexchart ref="park_acq_chart" type="scatter" height="350" :options="chart_datas.chartOptions" :series="chart_datas.series"></apexchart>
              </div>
            </b-tab>
            <b-tab title="表格">
              <el-table size="small" :data="ParkingAqcQuResults" border style="width:800px">
                <el-table-column class prop="Time" label="Time" width="190"></el-table-column>
                <el-table-column class prop="ParkingTag" label="Tag" width="50">
                </el-table-column>
                <el-table-column class prop="ParkingLocation" label="Location" width="110">
                </el-table-column>
                <el-table-column class prop="X" label="X" width="50"></el-table-column>
                <el-table-column class prop="Y" label="Y" width="50"></el-table-column>
                <el-table-column class prop="TaskName" label="任務名稱" width="150"></el-table-column>
                <el-table-column class prop="DistanceToTagCenter" label="Distance" width="80"></el-table-column>
              </el-table></b-tab>
          </b-tabs>
        </div>
      </b-tab>
    </b-tabs>
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
      ParkingAcqQueryOptions: {
        StartTimeStr: "2023/09/08 10:00:00",
        EndTimeStr: "2023/09/08 11:00:00",
        Tag: 7,
      },
      ParkedLocList: [],
      Results: {
        TotalCount: 0,
        Messages: [
        ]
      },
      ParkingAqcQuResults: [],
      chart_datas: {
        series: [{
          name: "Location",
          data: []
        }],
        chartOptions: {
          chart: {
            height: 360,
            type: 'scatter',
            zoom: {
              enabled: false
            },
            animations: {
              enabled: false,
            }
          },
          dataLabels: {
            enabled: false,
            formatter: function (val, opts) {
              return val
            },
          },
          stroke: {
            curve: 'straight'
          },
          title: {
            text: '停車精度',
            align: 'left'
          },
          grid: {
            row: {
              colors: ['#f3f3f3', 'transparent'], // takes an array which will be repeated on columns
              opacity: 0.5
            },
          },
          xaxis: {
            tickAmount: 10,
            min: -90,
            max: 90,
            title: {
              text: "X誤差(mm)"
            }
          },
          yaxis: {
            min: -90,
            max: 90,
            title: {
              text: "Y誤差(mm)"
            }
            // range: 200
          },
          tooltip: {
            enabled: false
          }
        },
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
    async HandleParkingACQQueryBtnClick() {
      this.chart_datas.chartOptions.title.text = `停車精度- Tag ${this.ParkingAcqQueryOptions.Tag}`
      this.$refs['park_acq_chart'].updateOptions(this.chart_datas.chartOptions);
      this.ParkingAqcQuResults = await LogAPI.QueryParkingAcq(this.ParkingAcqQueryOptions);
      this.chart_datas.series[0].data = []
      this.ParkingAqcQuResults.forEach(element => {
        this.chart_datas.series[0].data.push([element.X, element.Y])
      });
    },
    async HandleParkLocSelectorClcik() {
      var ParkedLocList = await LogAPI.GetParkedLocs();
      this.ParkedLocList = []
      ParkedLocList.forEach(loc_str => {
        //tag:name
        var splited = loc_str.split(':');
        var _tag = parseInt(splited[0])
        var _name = splited[1]
        this.ParkedLocList.push({
          tag: _tag,
          name: _name
        })
      });
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
    this.ParkingAcqQueryOptions.EndTimeStr = moment(Date.now()).format('yyyy-MM-DD HH:mm:ss')
    this.RestoreTimeFromLocalStorage();
    this.HandleParkLocSelectorClcik();
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

  .parking-acq {
    .options {
      display: flex;
      margin: 2px;

      .title {
        font-weight: bold;
        width: 80px;
      }
    }

  }
}
</style>