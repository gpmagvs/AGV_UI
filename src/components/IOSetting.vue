<template>
    <div class="d-flex flex-column bg-light m-2 w-100">
        <b-tabs @activate-tab="TabSelectChange">
            <b-tab title="INPUT"></b-tab>
            <b-tab title="OUTPUT"></b-tab>
        </b-tabs>
        <div class="d-flex py-2">
            <el-button @click="Save" size="large">儲存-{{ regionName }}</el-button>
        </div>
        <div class="border">
            <el-table border row-key="index" table-layout="auto" :data="tableData" max-height="450">
                <el-table-column prop="index" label="Index" min-width="20"></el-table-column>
                <el-table-column prop="address" min-width="20" label="Address"></el-table-column>
                <el-table-column prop="name" label="Name">
                    <template #default="scope">
                        <el-select-v2
                            v-model="scope.row.name"
                            filterable
                            :options="GetSelectOptions"
                            placeholder="Please select" clearable
                            style="width: 300px" />
                    </template>
                </el-table-column>
            </el-table>
        </div>
    </div>
</template>
<script>
import { DIOStore } from '@/store'
import { DIO, SystemAPI } from '@/api/VMSAPI'
export default {

    data() {
        return {
            regionName: "X",
            tableData: [],
            options: {
                Inputs: [],
                Outputs: []
            }
        }
    },
    computed: {
        GetSelectOptions() {
            if (this.regionName == "X") {
                return this.options.Inputs
            } else if (this.regionName == "Y") {
                return this.options.Outputs
            }
        },
        GetCurrentIORegistState() {
            var obj = DIOStore.getters.DIOStates
            if (this.regionName == "X") {
                return obj.Inputs
            } else if (this.regionName == "Y") {
                return obj.Outputs
            }
        },
        DataToStore() {
            var data = {}
            for (let index = 0; index < this.tableData.length; index++) {
                const element = this.tableData[index];
                data[index] = element && element.name ? element.name : ''
            }
            console.log(data)
            return data;
        }
    },
    methods: {
        InitData() {
            setTimeout(() => {
                this.tableData = []
                var regists = this.GetCurrentIORegistState;
                for (let index = 0; index < 64; index++) {
                    var regist = regists[index];
                    this.tableData.push({
                        index: `${index}`,
                        address: `${this.regionName}${index.toString(16).toUpperCase()}`,
                        name: regist ? regist.Name : ''
                    })
                }
            }, 300)
        },
        TabSelectChange(pag) {
            this.regionName = pag == 0 ? "X" : "Y";
            this.InitData();
        },
        Save() {
            this.$swal.fire(
                {
                    title: '確定要儲存此設定?',
                    text: '',
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonText: 'OK',
                    customClass: 'my-sweetalert'
                }).then(async (ret) => {
                    if (!ret.isConfirmed)
                        return;
                    var result = { confirm: false, message: '' }
                    if (this.regionName == "X") {
                        result = await DIO.UpdateInputMap(this.DataToStore);
                    } else {
                        result = await DIO.UpdateOutputMap(this.DataToStore);
                    }
                    const isSuccess = result.confirm;
                    this.$swal.fire(
                        {
                            title: isSuccess ? '修改成功,需要重新啟動系統，是否立即重新啟動?' : '修改失敗',
                            text: result.message,
                            icon: isSuccess ? 'success' : 'error',
                            showCancelButton: isSuccess,
                            confirmButtonText: isSuccess ? '重新啟動' : 'OK',
                            cancelButtonText: '稍後',
                            customClass: 'my-sweetalert'
                        }).then(async (ret) => {
                            if (!ret.isConfirmed)
                                return;
                            var _response = await SystemAPI.RestartSystem();
                            if (_response.confirm) {
                                this.$swal.fire({
                                    title: '車載系統正在重新啟動中...',
                                    icon: 'success',
                                    customClass: 'my-sweetalert'
                                })
                            }

                        })


                })
        },
        DownloadInOutPutsOptions() {
            DIO.DownloadInOutPutsOptions().then(ret => {
                this.options = ret;
            })
        }

    },
    mounted() {
        this.DownloadInOutPutsOptions();
        this.InitData();
    },
}
</script>
<style></style>