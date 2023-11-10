<template>
    <div class="transfer-log-view">
        <div class="py-1 w-100 text-start"><b-button @click="HandleRefreshClick" size="sm" variant="primary">重新整理</b-button></div>
        <el-table v-loading="loading" :data="transfer_data" border style="height: 600px;">
            <el-table-column label="開始時間" prop="StartTime"></el-table-column>
            <el-table-column label="結束時間" prop="EndTime"></el-table-column>
            <el-table-column label="花費時間(秒)" prop="TimeSpend"></el-table-column>
            <el-table-column label="來源機台" prop="From"></el-table-column>
            <el-table-column label="終點機台" prop="To"></el-table-column>
            <el-table-column label="起始位置" prop="StartLoc"></el-table-column>
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
export default {
    data() {
        return {
            transfer_data: [],
            loading: false,
        }
    },
    methods: {
        async FetchTodayTransferData() {
            this.loading = true;
            this.transfer_data = [];
            this.transfer_data = await LogAPI.GetTransferLogToday();
            this.loading = false
        },
        HandleRefreshClick() {
            this.FetchTodayTransferData()
        }
    },
    mounted() {
        this.FetchTodayTransferData();
    }
}
</script>

<style></style>