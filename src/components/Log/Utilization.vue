<template>
    <div class="border px-2  text-start">
        <el-radio-group v-model="ParkingAcqQueryOptions.QueryBy" class="d-flex flex-column text-start">
            <el-radio style="margin-right: auto;" label="taskName" size="large">Task Name </el-radio>
            <el-input class="px-4" :disabled="ParkingAcqQueryOptions.QueryBy == 'time'" v-model="ParkingAcqQueryOptions.TaskNameInput">
            </el-input>
            <el-radio style="margin-right: auto;" label="time" size="large"> <span>時間區間</span>
            </el-radio>
            <div class="d-flex flex-row w-100 px-4 bg-light">
                <span style="font-size:15px">開始時間</span>
                <el-date-picker
                    class="mx-2"
                    v-model="ParkingAcqQueryOptions.StartTimeStr"
                    type="datetime"
                    placeholder="Select date and time"
                    value-format="YYYY/MM/DD HH:mm:ss"
                    :disabled="ParkingAcqQueryOptions.QueryBy == 'taskName'" />
                <span style="font-size:15px">結束時間</span>
                <el-date-picker
                    class="mx-2"
                    v-model="ParkingAcqQueryOptions.EndTimeStr"
                    type="datetime"
                    placeholder="Select date and time"
                    value-format="YYYY/MM/DD HH:mm:ss"
                    :disabled="ParkingAcqQueryOptions.QueryBy == 'taskName'" />
            </div>
        </el-radio-group>
        <div class="border-top my-1 py-2">
            <el-button class="mx-1" @click="HandleQueryBtnClick" type="primary">查詢</el-button>
            <el-button v-if="this.ParkingAqcQuResults.length > 0" type="primary" @click="HandleDownloadCSVBtnClick">Download CSV</el-button>
        </div>
        <div class="border my-2">
            <apexchart ref="park_acq_chart" type="heatmap" height="400" :options="chart_datas.chartOptions" :series="chart_datas.series"></apexchart>
        </div>
    </div>
</template>

<script>
import { LogAPI } from '@/api/VMSAPI.js'
import moment from 'moment'
export default {
    data() {
        return {
            ParkingAcqQueryOptions: {
                StartTimeStr: "2023/09/08 10:00:00",
                EndTimeStr: "2023/09/08 11:00:00",
                Tag: 7,
                TagSelect: 7,
                TaskName: '',
                TaskNameInput: '',
                Page: 1,
                NumberPerPage: 10,
                QueryBy: 'taskName'
            },
            ParkingAqcQuResults: [],
            chart_datas: {
                series: [{
                    name: "X",
                    data: [[1, 0], [44, 1], [1, 3]]
                }],
                chartOptions: {
                    chart: {
                        height: 360,
                        type: 'heatmap',
                        zoom: {
                            enabled: true
                        },
                        animations: {
                            enabled: false,
                        }
                    },
                    plotOptions: {
                        heatmap: {
                            shadeIntensity: 1,
                            radius: 0,
                            useFillColorAsStroke: true,
                            colorScale: {
                                ranges: [{
                                    from: 0,
                                    to: 0,
                                    name: 'down',
                                    color: '#FF0000'
                                },
                                {
                                    from: 1,
                                    to: 1,
                                    name: 'idle',
                                    color: '#ffc825'
                                },
                                {
                                    from: 2,
                                    to: 2,
                                    name: 'run',
                                    color: '#29db56'
                                },
                                {
                                    from: 4,
                                    to: 4,
                                    name: 'charge',
                                    color: '#2192ff'
                                }
                                ]
                            }
                        }
                    },
                    dataLabels: {
                        enabled: false,
                        formatter: function (val, opts) {
                            return val
                        },
                    },
                    tooltip: {
                        enabled: false
                    },

                },
            }

        }
    },
    methods: {
        async HandleQueryBtnClick() {
            var history = []
            if (this.ParkingAcqQueryOptions.QueryBy == 'taskName') {
                history = await LogAPI.QueryVibrationRecordsByTaskName(this.ParkingAcqQueryOptions.TaskNameInput);
            } else
                history = await LogAPI.QueryVibrationRecordsByTime(this.ParkingAcqQueryOptions.StartTimeStr, this.ParkingAcqQueryOptions.EndTimeStr);

            var _filter = history.filter(v => v.Time_str != '0001/01/01 00:00:00.0000');
            if (_filter.length == 0) {
                this.chart_datas.series[0].data = [];
                return;
            }
            var series_data_x = _filter.map(dat => [moment(dat.Time_str).add(8, 'hour').valueOf(), dat.AccelermetorValue.x]);
            var series_data_y = _filter.map(dat => [moment(dat.Time_str).add(8, 'hour').valueOf(), dat.AccelermetorValue.y]);
            var series_data_z = _filter.map(dat => [moment(dat.Time_str).add(8, 'hour').valueOf(), dat.AccelermetorValue.z]);
            this.chart_datas.series[0].data = series_data_x;
            this.chart_datas.series[1].data = series_data_y;
            this.chart_datas.series[2].data = series_data_z;

            var startTime = new Date(series_data_x[0][0]);
            console.log(startTime)
            this.chart_datas.chartOptions.xaxis.min = startTime.getTime();
            this.$refs['park_acq_chart'].updateOptions(this.chart_datas.chartOptions);


        }
    },
    mounted() {
        this.ParkingAcqQueryOptions.EndTimeStr = moment(Date.now()).format('YYYY/MM/DD HH:mm:ss');
    },
}
</script>

<style></style>