<template>
  <div class="agv-operator">
    <b-tabs pills small>
      <b-tab :title="$t('agv_control')" active>
        <div class="mt-1 p-1">
          <AgvControl :enabled="operation_enabled_return"></AgvControl>
        </div>
      </b-tab>
      <b-tab :disabled="agv_type==1" :title="$t('zaxis_up_down')">
        <div class="mt-1 p-1">
          <ZAxisControl :enabled="operation_enabled_return"></ZAxisControl>
        </div>
      </b-tab>
      <b-tab title="Input">
        <div class="table-container-div mt-1 p-1">
          <IOTable digital_type="input" :table_data="DIOTableData.Inputs"></IOTable>
        </div>
      </b-tab>
      <b-tab title="Output">
        <div class="table-container-div mt-1 p-1">
          <IOTable
            :readonly="false"
            digital_type="output"
            :enabled="operation_enabled_return"
            :super_user="isGodMode"
            :table_data="DIOTableData.Outputs"
          ></IOTable>
        </div>
      </b-tab>
      <b-tab title="Manual">
        <div class="mt-1 p-1">
          <ManualSettings :enabled="operation_enabled_return"></ManualSettings>
        </div>
      </b-tab>
    </b-tabs>
    <div @click="VersionTextClickHandle()" class="ui-version text-end px-3">
      UI Version:
      <p>{{UIVersion}}</p>
    </div>
  </div>
</template>

<script>
import AgvControl from './AgvcControl.vue'
import ZAxisControl from './ZAxisControl.vue'
import IOTable from './IOTable.vue';
import { param, version } from '@/gpm_param';
import clsDIOTable from '@/ViewModels/clsDIOTable';
import ManualSettings from './ManualSettings.vue';
import WebSocketHelp from '@/api/WebSocketHepler'
import bus from '@/event-bus.js'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UserStore, DIOStore } from '@/store'

export default {

  components: {
    AgvControl, ZAxisControl, IOTable, ManualSettings
  },
  data() {
    return {
      type: '',
      DIOTableData: new clsDIOTable(),
      trigger_admin_dialog_count: 5,
      version_text_click_count: 0,
      modal_key: ''
    }
  },
  mounted() {
    console.log('agv operator mounted');
    this.DIOTableWSInit();
  },
  methods: {
    DIOTableWSInit() {
      var ws = new WebSocketHelp('ws/DIOTableData')
      ws.Connect();
      ws.onmessage = (evt) => {
        this.DIOTableData = JSON.parse(evt.data)
        DIOStore.commit('updateStatus', this.DIOTableData)
      }
    },
    VersionTextClickHandle() {
      this.version_text_click_count += 1;
      if (this.version_text_click_count > this.trigger_admin_dialog_count) {
        this.ConfirmGODTriggering();
      }
    },
    ConfirmGODTriggering() {
      this.$swal.fire({
        title: 'Warning',
        text: `Do you known what are you doing now?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'OK',
        allowOutsideClick: false
      }).then((result) => {
        this.AdminSwitchDialogResultHandle(result.isConfirmed);
      })

    },
    AdminSwitchDialogResultHandle(checked = false) {
      this.version_text_click_count = 0;
      if (checked) {
        UserStore.commit('setUser', {
          UserName: 'GOD',
          Role: 3
        });
      }
    }
  },
  props: {
    ModuleInformation: {
      type: Object,
      default() {
        return {

        }
      }
    },
    operation_enabled: {
      type: Boolean,
      default: false
    },
    agv_type: {
      type: Number,
      default() {
        return 0
      }
    }
  },
  computed: {
    isGodMode() {
      return UserStore.getters.IsGodUser;
    },
    UIVersion() {
      if (version)
        return version;
      else
        return "0.0.0.0";
    },
    operation_enabled_return() {
      if (this.isGodMode)
        return true;
      else
        return this.operation_enabled
    }
  }
}
</script>

<style scoped lang="scss">
.admin-dialog-modal {
  p {
    //
    font-weight: bold;
    user-select: none;
  }
  .admin-dialog-buttons {
    button {
      width: 220px;
      font-size: 50px;
      color: white;
      border-radius: 9px;
      margin: 4px;
    }

    button:hover {
      background-color: gray;
      color: white;
    }

    .yes-btn {
      background-color: rgb(0, 123, 255);
    }
    .no-btn {
      background-color: rgb(220, 53, 69);
    }
  }
}
</style>