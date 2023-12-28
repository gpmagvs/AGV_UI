<template>
  <div class="status-card">
    <h4 class="text-start">{{ $t('Status_info') }}</h4>
    <div class="w-100 border p-3">
      <table class="status-tb w-100">
        <tbody>
          <tr align="justify">
            <td><i class="bi bi-three-dots-vertical"></i>{{ $t('status') }}</td>
            <td class="val-column">
              <b-button
                class="w-100 border"
                v-bind:class="vms_data.SubState == '' ? 'down' : vms_data.SubState.toLowerCase()">
                <b>{{ vms_data.SubState == '' ? 'ERROR' : vms_data.SubState }}</b>
              </b-button>
            </td>
            <td><i class="bi bi-three-dots-vertical"></i>Laser Mode</td>
            <td>
              <b-form-input size="sm" disabled v-model="vms_data.Current_LASER_MODE"></b-form-input>
            </td>
          </tr>
          <tr align="justify">
            <td><i class="bi bi-three-dots-vertical"></i>{{ $t('current_position') }}</td>
            <td class="val-column">
              <b-form-input v-if="vms_data.Last_Visit_MapPoint.Graph" size="sm" disabled v-model="vms_data.Last_Visit_MapPoint.Graph.Display"></b-form-input>
              <!-- <el-input disabled v-model="vms_data.Tag"></el-input> -->
            </td>
            <td><i class="bi bi-three-dots-vertical"></i>{{ $t('target_position') }}</td>
            <td class="val-column">
              <b-form-input v-if="vms_data.NavInfo.DestinationMapPoint.Graph" size="sm" disabled v-model="vms_data.NavInfo.DestinationMapPoint.Graph.Display"></b-form-input>
              <!-- <el-input disabled v-model="currentPosition"></el-input> -->
            </td>
          </tr>
          <tr align="justify">
            <!-- 動作名稱 -->
            <td><i class="bi bi-three-dots-vertical"></i>{{ $t('tag_read_status') }}</td>
            <td class="val-column">
              <b-form-input
                v-if="!IsInspectionAGV"
                size="sm"
                disabled
                v-model="vms_data.BCR_State_MoveBase.tagID"
                :state="vms_data.BCR_State_MoveBase.tagID > 0">
              </b-form-input>
            </td>
            <!-- 載物ID -->
            <td v-if="vms_data.Agv_Type != 2"><i class="bi bi-three-dots-vertical"></i>{{ $t('carrier_id') }}</td>
            <td v-if="vms_data.Agv_Type != 2" class="val-column">
              <b-form-input
                size="sm"
                disabled
                v-model="vms_data.CST_Data"
                :state="vms_data.CST_Data != ''"></b-form-input>
            </td>
          </tr>
          <tr v-if="true" align="justify">
            <td><i class="bi bi-three-dots-vertical"></i>{{ $t('localization-state') }}</td>
            <td>
              <b-form-input
                size="sm"
                disabled
                v-model="LocStatusDisplay"
                :state="LocStatusDisplay == 'OK'"></b-form-input>
            </td>
            <td><i class="bi bi-three-dots-vertical"></i>{{ $t('map-matching-rate') }}</td>
            <td>
              <b-form-input
                size="sm"
                disabled
                v-model="vms_data.MapComparsionRate"
                :state="vms_data.MapComparsionRate != 0"></b-form-input>
            </td>
          </tr>
          <tr align="justify">
            <td><i class="bi bi-three-dots-vertical"></i>{{ $t('abormal') }}</td>
            <td colspan="4">
              <b-form-textarea disabled v-model="NewestAlarm" :state="NewestAlarm == ''"></b-form-textarea>
              <!-- <el-input type="textarea" disabled v-model="NewestAlarm"></el-input> -->
            </td>
          </tr>
          <tr align="justify">
            <td></td>
            <td colspan="4" class="text-end">
              <p style="font-size:12px;color:grey">RAM :{{ Memory }} Mb</p>
            </td>
          </tr>
          <tr v-if="false" align="justify">
            <td><i class="bi bi-three-dots-vertical"></i>AGV Direct</td>
            <td>
              <b-form-input size="sm" disabled v-model="vms_data.AGV_Direct"></b-form-input>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import bus from '@/event-bus.js'
import VMSData from '@/ViewModels/VMSData.js'

export default {
  props: {

  },
  data() {
    return {
      currentPosition: '123',
      vms_data: new VMSData()
    }
  },
  computed: {
    state_btn_variant() {
      var _state = this.vms_data.SubState.toUpperCase();
      if (_state == "DOWN" | _state == "ALARM" | _state == "STOP" | _state == "SYSTEM_INIT") {
        return 'danger'
      }
      else if (_state == "INITIALIZE" | _state == "CHARGING") {
        return 'primary'
      }
      else if (_state == "RUN" | _state == "WORKING") {
        return "success";
      }
      else if (_state == "IDLE" | _state == "WARNING") {
        return 'warning'
      }
      return ""
    },
    CurrentPosition() {
      if (this.ModuleInformation.nav_state == undefined) {
        return '-1';
      } else {
        return this.ModuleInformation.nav_state.lastVisitedNode;
      }
    },
    CarrierID() {
      if (this.ModuleInformation.CSTReader == undefined) {
        return '-1';
      } else {
        return this.ModuleInformation.CSTReader.data;
      }
    },
    NewestAlarm() {
      if (this.vms_data.NewestAlarm == undefined)
        return '';

      return this.$i18n.locale == 'zh-TW' ? this.vms_data.NewestAlarm.CN : this.vms_data.NewestAlarm.Description;
    },
    LocStatusDisplay() {
      //  1 byte LocalizationStatus [10: OK, 20: Warning, 30: Not localized, 40: System error] -->
      var locStatus = this.vms_data.LocStatus;
      if (locStatus == 10) {
        return "OK"
      }
      else if (locStatus == 20) {
        return "Warning"
      }
      else if (locStatus == 30) {
        return "Not Localized"
      }
      else if (locStatus == 40) {
        return "System Error"
      }
      else {
        return "Unknown"
      }
    },
    IsInspectionAGV() {
      return this.vms_data.Agv_Type == 2;
    },
    Memory() {
      return this.vms_data.SysLoading ? this.vms_data.SysLoading.Memory : -1;
    }
  },

  mounted() {
    bus.on('/vms_data', (data) => {
      this.vms_data = data
    });
  },
}
</script>

<style lang="scss">
.status-card {
  h4 {
    font-weight: bold;
  }

  tr {
    height: 50px;
  }

  td {
    //width: 120px;
    font-weight: bold;
    font-size: small;
    padding: 0px 10px;
  }

  .status-tb {
    .val-column {
      width: 30%;
    }
  }
}
</style>