<template>
  <div>
    <b-tabs>
      <b-tab title="電池狀態">
        <div class="border p-3">
          <div class="text-start border-bottom my-2">
            <span class="mx-2">充電迴路</span>
            <el-switch
              size="large"
              inline-prompt
              active-text="開啟"
              inactive-text="關閉"
              inactive-color="red"
              v-model="charge_circuit_state"
              @change="HandleChargeCircuitSwitch"
            ></el-switch>
          </div>
          <div class="d-flex flex-row">
            <div v-for="(bat,id) in batteries" :key="id">
              <div class="border p-3" style="width: 200px;">
                <div class="border-bottom text-start">
                  <h3>電池-{{ id }}</h3>
                </div>
                <el-form label-position="left" label-width="80px">
                  <el-form-item label="ID">{{bat.batteryID}}</el-form-item>
                  <el-form-item label="狀態">{{bat.state}}</el-form-item>
                  <el-form-item label="異常碼">{{bat.errorCode}}</el-form-item>
                  <el-form-item label="電量">{{bat.batteryLevel}} %</el-form-item>
                  <el-form-item label="電壓">{{bat.Voltage/1000.0}}V</el-form-item>
                  <el-form-item label="放電電流">{{bat.dischargeCurrent/1000.0}}A</el-form-item>
                  <el-form-item label="充電電流">{{bat.chargeCurrent/1000.0}}A</el-form-item>
                  <el-form-item label="最高溫度">{{bat.maxCellTemperature}}</el-form-item>
                  <el-form-item label="最低溫度">{{bat.minCellTemperature}}</el-form-item>
                  <el-form-item label="循環次數">{{bat.cycle}}</el-form-item>
                </el-form>
              </div>
            </div>
          </div>
        </div>
      </b-tab>
      <b-tab title="歷史查詢">
        <div class="border p-3">
          <el-form label-position="left" label-width="80px">
            <el-form-item label="選擇電池">
              <el-select v-model="query_options.id">
                <el-option :key="1" label="電池-1" :value="1"></el-option>
                <el-option :key="2" label="電池-2" :value="2"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="查詢項目">
              <el-select @change="HandleQueryItemChanged" v-model="query_options.item">
                <el-option label="電量" value="Level"></el-option>
                <el-option label="電壓" value="Voltage"></el-option>
                <el-option label="充電電流" value="Charge_current"></el-option>
                <el-option label="放電電流" value="Discharge_current"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="時間區間">
              <el-date-picker
                v-model="query_options.time_range"
                type="datetimerange"
                range-separator="To"
                start-placeholder="Start date"
                end-placeholder="End date"
              ></el-date-picker>
            </el-form-item>
          </el-form>
          <div class="text-start">
            <b-button @click="HandleQueryButtonClick" style="width:120px" variant="primary">查詢</b-button>
          </div>
          <div class="m-1 border-top" id="chart">
            <apexchart
              type="line"
              height="350"
              ref="bat_chart"
              :options="chart_datas.chartOptions"
              :series="chart_datas.series"
            ></apexchart>
          </div>
        </div>
      </b-tab>
    </b-tabs>
  </div>
</template>

<script>
import { ROS_STORE } from '@/store/ros_store';
import { BatteryAPI } from '@/api/VMSAPI.js'
import moment from 'moment'
export default {
  data() {
    return {
      charge_circuit_state: false,
      batteries: {},
      query_options: {
        id: 1,
        item: 'Voltage',
        time_range: ['', '']
      },
      chart_datas: {
        series: [{
          name: "Desktops",
          data: [10, 41, 35, 51, 49, 62, 69, 91, 148]
        }],
        chartOptions: {
          chart: {
            height: 350,
            type: 'line',
            zoom: {
              enabled: true
            },
            animations: {
              enabled: false,
            }
          },
          dataLabels: {
            enabled: false
          },
          stroke: {
            curve: 'straight'
          },
          title: {
            text: 'Voltage',
            align: 'left'
          },
          grid: {
            row: {
              colors: ['#f3f3f3', 'transparent'], // takes an array which will be repeated on columns
              opacity: 0.5
            },
          },
          xaxis: {
            type: 'datetime',
            categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
          },
          tooltip: {
            enabled: false
          }
        },
      }
    }
  },
  computed: {
    battery_info() {
      return ROS_STORE.getters.BatteryInfo;
    },
    batteryIDList() {
      return Object.keys(this.batteries)
    }
  },
  methods: {
    HandleQueryItemChanged(item) {
      this.chart_datas.chartOptions.title.text = item
      this.$refs['bat_chart'].updateOptions(this.chart_datas.chartOptions)
      //   this.chart_datas.series[0].name = item
      //   this.$refs['bat_chart'].updateSeries(this.chart_datas.series, false)
    },
    async HandleChargeCircuitSwitch(enabled) {
      await BatteryAPI.ChargeCicuitSwitch(enabled)
    },
    async HandleQueryButtonClick() {
      var start_dt = moment(this.query_options.time_range[0]).format('yyyy/MM/DD')
      var end_dt = moment(this.query_options.time_range[1]).format('yyyy/MM/DD')
      this.query_options.time_range[0] = start_dt;
      this.query_options.time_range[1] = end_dt;
      var result = await BatteryAPI.Query(this.query_options)
      this.chart_datas.series[0].name = this.query_options.item;
      this.chart_datas.series[0].data = Object.values(result)
      this.$refs['bat_chart'].updateSeries(this.chart_datas.series, false)
      this.chart_datas.chartOptions.xaxis.categories = Object.keys(result)
      this.$refs['bat_chart'].updateOptions(this.chart_datas.chartOptions)
    },
    async UpdateChargeCircuitState() {
      this.charge_circuit_state = await BatteryAPI.GetChargeCicuitState()
    }
  },
  mounted() {
    setInterval(() => {
      var battery = this.battery_info
      try {
        this.batteries[battery.batteryID] = battery
      } catch (error) {

      }
    }, 1000);
  },
}
</script>

<style lang="scss" scoped>
</style>