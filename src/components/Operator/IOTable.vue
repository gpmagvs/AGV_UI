<template>
  <div class="px-1 d-flex flex-row justify-content-center">
    <div class="mt-2">
      <jw-pagination
        @page_changed="(ev) => { pagecurrent = ev - 1 }"
        :pageSize="16"
        :totalCount="table_data.length"></jw-pagination>
    </div>
    <div class="border mt-1 flex-fill">
      <el-table
        size="small"
        :data="page_table_data"
        :row-class-name="tb_row_class"
        header
        border
        height="565"
        row-key="Address"
        :highlight-current-row="false"
        @row-dblclick="cellDoubleClickHandle"
        @cell-mouse-enter="cellMouseEnterHandler"
        @cell-mouse-leave="cellMouseLeaveHandler"
        style="width:99%">
        <el-table-column label="Address" prop="Address" width="70"></el-table-column>
        <el-table-column v-if="isOutput" width="80">
          <template #default="scope">
            <el-button
              :disabled="IsGodUse ? false : !IsUserLogin || !scope.row.manualToggleEnable"
              @click="ToggleDO(scope.row)"
              size="small">Toggle</el-button>
          </template>
        </el-table-column>
        <el-table-column label="Name" prop="Name"></el-table-column>
        <el-table-column label="Value" prop="State" width="60" :formatter="StateFormatter"></el-table-column>
      </el-table>
    </div>
    <b-modal v-model="DIOChangeComfirmDialogShow" :centered="true" title="DIO Change Confirm" @ok="WriteDIOHandle">
      <p>
        <b>[{{ toChangeAddress }}]</b> will changed from <b>{{ toChangeState ? 0 : 1 }}</b> to <b>{{ toChangeState ? 1 : 0 }}</b>.
      </p>
      <p>Are you sure?</p>
    </b-modal>
  </div>
</template>
<script>
import { clsRegister } from '@/ViewModels/clsDIOTable';
import { DIO } from '@/api/VMSAPI.js'
import { UserStore } from '@/store'
import jwPagination from '../UIComponents/jw-pagination.vue';
export default {
  components: {
    jwPagination,
  },
  props: {
    enabled: {
      type: Boolean,
      default: false
    },
    digital_type: {
      type: String,
      default: 'input'
    },
    readonly: {
      type: Boolean,
      default: true
    },
    table_data: {
      type: Array,
      default() {
        return [
          new clsRegister("X0000", "1"),
          new clsRegister("X0001", ""),
          new clsRegister("X0002", ""),
          new clsRegister("X0003", ""),
          new clsRegister("X0004", ""),
          new clsRegister("X0005", ""),
          new clsRegister("X0006", ""),
          new clsRegister("X0007", ""),
          new clsRegister("X0008", ""),
          new clsRegister("X0009", ""),
          new clsRegister("X000A", ""),
          new clsRegister("X000B", ""),
          new clsRegister("X000C", ""),
          new clsRegister("X000D", ""),
          new clsRegister("X000E", ""),
          new clsRegister("X000F", ""),

        ]
      }
    },
    isOutput: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      Registers: [
      ],
      pagecurrent: 0,
      DIOChangeComfirmDialogShow: false,
      toChangeAddress: '',
      toChangeState: false,
      hover_row: {}
    }
  },
  computed: {

    page_table_data() {
      return this.table_data.slice(this.pagecurrent * 16, 16 * (this.pagecurrent + 1))
    },
    IsUserLogin() {
      return UserStore.getters.CurrentUserRole != 0;
    },
    IsGodUse() {
      return UserStore.getters.IsGodUser;
    }

  },
  methods: {
    tb_row_class(row, rowIndex) {
      if (row.rowIndex < 0) {
        return '';
      }
      var value = this.page_table_data[row.rowIndex].State;
      try {
        if (value)
          return 'on-row';
        return 'off-row';

      } catch (error) {
        return 'off-row';
      }
    },
    StateFormatter(row, column, cellValue, index) {
      return cellValue == true ? 1 : 0;
    },
    PageChangeHandler(number) {
      this.pagecurrent = number - 1;
    },
    cellMouseEnterHandler(row, column, cell, event) {
      this.hover_row = row
    },
    cellMouseLeaveHandler(row, column, cell, event) {
      this.hover_row = undefined
    },
    async cellDoubleClickHandle(row, column, event) {
      this.ToggleDO(row);
    },
    async ToggleDO(row) {
      if (!this.IsUserLogin)
        return;

      if (!this.isOutput) {
        await DIO.DI_State_Change(row.Address, !row.State)
      } else {
        if (!row.manualToggleEnable && !this.IsGodUse) {
          this.$message.error('This output is not allowed to be changed manually!')
          return;
        }

        this.toChangeAddress = row.Address;
        this.toChangeState = !row.State;
        // if (this.IsGodUse) {
        //   this.WriteDIOHandle();
        //   return;
        // }
        if (row.manualToggleNeedConfirmed) {
          this.$swal.fire(
            {
              title: 'Warning',
              text: '確定要將 ' + row.Address + '的狀態改為' + (row.State ? 0 : 1) + '嗎?',
              icon: 'warning',
              showCancelButton: true,
              confirmButtonText: 'OK',
              customClass: 'my-sweetalert'
            }).then((result) => {
              if (result.isConfirmed) {
                this.WriteDIOHandle()
              } else if (result.isDenied) {
                this.$swal.fire('Changes are not saved', '', 'info')
              }
            })
        } else {
          this.WriteDIOHandle();
        }
      }

    },
    async WriteDIOHandle() {
      await DIO.DO_State_Change(this.toChangeAddress, this.toChangeState, this.IsGodUse);
    }

  }
}
</script>
<style lang="scss">
.el-table {
  .on-row {
    background-color: rgb(13, 110, 253);
    color: white;
    /* --el-table-tr-bg-color: var(--el-color-success-light-9); */
  }

  .off-row {
    background-color: rgb(245, 245, 245);
    color: rgb(43, 43, 43);
  }

  .on-row,
  .off-row {
    font-weight: bold;
    letter-spacing: 1px;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
      Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue",
      sans-serif;
  }

  // 移除 hover 效果
  tr:hover>td {
    background-color: inherit !important;
  }
}
</style>