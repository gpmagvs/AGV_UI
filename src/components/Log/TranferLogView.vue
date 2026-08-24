<template>
    <div class="transfer-log-view">
        <div class="d-flex flex-row w-100 m-2">
            <span style="font-size:15px">開始時間</span>
            <el-date-picker class="mx-2" v-model="QueryOptions.StartTimeStr" type="datetime"
                placeholder="Select date and time" value-format="YYYY/MM/DD HH:mm:ss" />
            <span style="font-size:15px">結束時間</span>
            <el-date-picker class="mx-2" v-model="QueryOptions.EndTimeStr" type="datetime"
                placeholder="Select date and time" value-format="YYYY/MM/DD HH:mm:ss" />
            <b-button @click="HandleRefreshClick" size="sm" variant="primary">查詢</b-button>
            <b-button class="mx-2" @click="HandleDownloadCSVClick" size="sm" variant="success">下載</b-button>
        </div>
        <el-table v-loading="loading" :data="transfer_data" border style="height: 600px;">
            <el-table-column label="開始時間" prop="StartTime" :formatter="TimeFormater"></el-table-column>
            <el-table-column label="結束時間" prop="EndTime" :formatter="TimeFormater"></el-table-column>
            <el-table-column label="花費時間(秒)" prop="TimeSpend"></el-table-column>
            <el-table-column label="來源機台" prop="FromName"></el-table-column>
            <el-table-column label="終點機台" prop="ToName"></el-table-column>
            <el-table-column label="起始位置" prop="StartLocName"></el-table-column>
            <el-table-column label="開始電量(%)" prop="BatLvStart"></el-table-column>
            <el-table-column label="結束電量(%)" prop="BatLvEnd"></el-table-column>
            <el-table-column label="電量損耗(%)" prop="BatLoss"></el-table-column>
            <el-table-column label="總里程(m)" prop="Odometry">
                <template #default="scope"> {{ (scope.row.Odometry * 1000).toFixed(1) }} </template>
            </el-table-column>
        </el-table>
    </div>
</template>

<script>
import { LogAPI } from '@/api/VMSAPI.js'
import moment from 'moment';
export default {
    data() {
        return {
            transfer_data: [],
            loading: false,
            QueryOptions: {
                StartTimeStr: '',
                EndTimeStr: ''

            }
        }
    },
    methods: {
        HandleDownloadCSVClick() {

            if (this.transfer_data.length == 0) {
                this.$swal.fire(
                    {
                        title: '下載失敗',
                        text: '沒有資料可供下載，請先查詢資料',
                        icon: 'warning',
                        showCancelButton: false,
                        confirmButtonText: 'OK',
                        customClass: 'my-sweetalert'
                    })
                return
            }
            // 1. CSV 欄位名稱
            const headers = ["開始時間,結束時間,花費時間(秒),來源機台,終點機台,起始位置,開始電量(%),結束電量(%),電量損耗(%),總里程(m)"]
            // 2. 組 CSV 字串
            let csvContent = headers.join(',') + '\n'
            this.transfer_data.forEach(row => {
                const values = [row.StartTime, row.EndTime, row.TimeSpend, row.FromName, row.ToName, row.StartLocName, row.BatLvStart, row.BatLvEnd, row.BatLoss, row.Odometry]
                csvContent += values.join(',') + '\n'
            })
            // 🔥 加 BOM 修正 Excel 中文亂碼
            const csvWithBom = '\ufeff' + csvContent;
            const blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8;' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')

            link.href = url
            const currentTime = moment().format('YYYYMMDDHHmmss')
            link.setAttribute('download', `Transport records data_${currentTime}.csv`)
            link.click()

            URL.revokeObjectURL(url)
        },
        SetDefaultTimeInterval() {
            var _year = moment(Date.now()).year();
            var _month = moment(Date.now()).month();
            var _day = moment(Date.now()).date();

            this.QueryOptions.StartTimeStr = moment(new Date(_year, _month, _day, 0, 0, 0)).format('yyyy/MM/DD HH:mm:ss')
            this.QueryOptions.EndTimeStr = moment(new Date(_year, _month, _day, 23, 59, 59)).format('yyyy/MM/DD HH:mm:ss')
        },
        async FetchTodayTransferData() {
            this.loading = true;
            this.transfer_data = [];
            this.transfer_data = await LogAPI.GetTransferLog(this.QueryOptions.StartTimeStr, this.QueryOptions.EndTimeStr);
            this.loading = false
        },
        HandleRefreshClick() {
            this.FetchTodayTransferData()
        },
        TimeFormater(row, column, cellValue, index) {
            return moment(cellValue).format('yyyy/MM/DD HH:mm:ss')
        }
    },
    mounted() {
        this.SetDefaultTimeInterval();
        this.FetchTodayTransferData();
    }
}
</script>

<style></style>