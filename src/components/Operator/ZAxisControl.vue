<template>
  <div class="z-axis-control border p-1">
    <div
      v-show="!enabled"
      class="disable-notify text-start my-2"
    >{{ $t('zaxis_control_notify_text') }}</div>
    <!-- <div class="d-flex" v-loading="!enabled" :element-loading-spinner="false"> -->
    <div
      class="d-flex"
      v-loading="!enabled"
      :element-loading-spinner="false"
      :element-loading-background="enabled ? 'rgba(0,0,0,0)' : 'rgba(202,202,202,0.4)'"
    >
      <div class="d-flex flex-column w-50">
        <div class="d-flex flex-row">
          <div class="label-item">極限SENSOR狀態</div>
          <el-tag
            v-if="Vertical_Hardware_limit_bypass"
            type="danger"
            size="large"
            effect="dark"
            @click="ControlHardwareLimitSensor(true)"
          >Bypass</el-tag>
          <el-tag
            v-else
            type="success"
            effect="dark"
            size="large"
            @click="ControlHardwareLimitSensor(false)"
          >已開啟</el-tag>
        </div>
        <div class="d-flex flex-row my-2">
          <div class="label-item">Current Position</div>
          <el-input
            size="small"
            style="width:72px"
            class="py-1"
            center
            v-model="ForkHeight"
            disabled
          ></el-input>
        </div>
        <div v-if="enabled" class="p-2 my-2 border rounded">
          <b-button @click="ShowTeachView">牙叉位置校點</b-button>
        </div>
      </div>
      <!-- <el-divider direction="vertical"></el-divider> -->
      <div class="control-buttons mx-2">
        <b-button
          :disabled="(!enabled || isZAxisMoving)"
          size="lg"
          class="w-100 border mb-3"
          variant="light"
          @click="ForkAction('up_limit')"
          block
        >
          <i class="bi bi-chevron-bar-up"></i>
          {{ $t('up_limit_pose') }}
        </b-button>
        <b-button
          :disabled="(!enabled || isZAxisMoving)"
          @click="ForkAction('up')"
          size="lg"
          class="w-100 border mb-3"
          variant="light"
          block
        >
          <i class="bi bi-chevron-up"></i>
          {{ $t('up') }}
        </b-button>
        <b-button
          :disabled="(!enabled || isZAxisMoving)"
          @click="ForkAction('home')"
          size="lg"
          class="w-100 border mb-3"
          variant="light"
          block
        >
          <i style="color:rgb(0, 123, 255)" class="bi bi-house-fill"></i>
          {{ $t('original') }}
        </b-button>
        <b-button
          @click="ForkAction('stop')"
          size="lg"
          class="w-100 border mb-3"
          variant="light"
          block
        >
          <i style="color:rgb(255, 61, 80)" class="bi bi-stop-circle-fill"></i>
          {{ $t('stop') }}
        </b-button>
        <b-button
          :disabled="(!enabled || isZAxisMoving)"
          @click="ForkAction('down')"
          size="lg"
          class="w-100 border mb-3"
          variant="light"
          block
        >
          <i class="bi bi-chevron-down"></i>
          {{ $t('down') }}
        </b-button>
        <b-button
          :disabled="(!enabled || isZAxisMoving)"
          size="lg"
          class="w-100 border mb-3"
          variant="light"
          @click="ForkAction('down_limit')"
          block
        >
          <i class="bi bi-chevron-bar-down"></i>
          {{ $t('down_limit_pose') }}
        </b-button>
      </div>
      <el-drawer
        v-model="show_teach_page"
        direction="btt"
        size="90%"
        @close="TeachDrawerClosingHandle"
        title="FORK TEACH"
      >
        <forkTeachEditor ref="fork_teach"></forkTeachEditor>
      </el-drawer>
    </div>
  </div>
</template>
<script>
import { ForkAPI } from '@/api/VMSAPI';
import { AGVStatusStore, ForkTeachStore, UserStore, DIOStore } from '@/store'
import AdminFork from '@/components/Admin/AdminFork.vue'
import forkTeachEditor from './WorkStation/ForkTeachEditor.vue'
import bus from '@/event-bus';
export default {
  components: {
    AdminFork, forkTeachEditor
  },
  props: {

  },
  data() {
    return {
      isZAxisMoving: false,
      show_teach_page: false,
      hardware_limit_enable: true
    }
  },
  watch: {
    Vertical_Hardware_limit_bypass(newValue) {
      this.$notify({
        message: `牙叉極限Sensor ${newValue ? '已經Bypass' : '作用中'}`,
        type: newValue ? 'error' : 'success',
        duration: 1000 // 持續時間，單位為毫秒
      })
    }
  },
  computed: {
    ForkHeight() {
      return AGVStatusStore.getters.ForkHeight
    },
    IsUserLogin() {
      return UserStore.getters.CurrentUserRole != 0;
    },
    IsGodUser() {
      return UserStore.getters.IsGodUser;
    },
    IsAuto() {
      return AGVStatusStore.getters.IsAuto;
    },
    IsOnline() {
      return AGVStatusStore.getters.IsOnline;
    },
    enabled() {
      if (this.IsGodUser)
        return true;
      return (this.IsUserLogin && !this.IsAuto && !this.IsOnline)
    },
    Vertical_Hardware_limit_bypass() {
      return DIOStore.getters.Vertical_Hardware_limit_bypass;
    }
  },
  methods: {
    async ForkAction(action, pose = 0, speed = 0) {

      var canceled = false;
      if (action != 'home' && action != 'stop' && this.Vertical_Hardware_limit_bypass) {
        await this.$swal.fire(
          {
            title: `極限Sensor目前為Bypass狀態，確定要進行[${action}]動作?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'OK',
            customClass: 'my-sweetalert'
          }).then(res => {
            canceled = !res.isConfirmed
          })
      }
      if (canceled)
        return;

      this.isZAxisMoving = true;
      var ret = await ForkAPI.Action(action, pose, speed);
      this.isZAxisMoving = false;
      if (!ret.confirm) {
        this.$swal.fire({
          text: ret.message,
          icon: 'error',
          title: '牙叉禁止操作'
        })
      }
    },
    ControlHardwareLimitSensor(active) {
      if (!active) {
        this.$swal.fire(
          {
            title: '確定要將Z軸極限Sensor Bypass?',
            text: '',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'OK',
            cancelButtonText: '取消',
            customClass: 'my-sweetalert'
          }).then(res => {
            if (!res.isConfirmed)
              return;
            DIOStore.dispatch('ControlHardwareLimiSensor', true)

          })
      } else
        DIOStore.dispatch('ControlHardwareLimiSensor', !active)
    },
    ShowTeachView() {
      if (this.$refs['fork_teach'])
        this.$refs['fork_teach'].reload();
      this.show_teach_page = true;
    },
    TeachDrawerClosingHandle() {
      if (ForkTeachStore.getters.IsAnyChanged) {
        this.$swal.fire({
          icon: 'warning',
          text: '教點資料已修改但尚未儲存，確定要離開?',
          showConfirmButton: true,
          showCancelButton: true
        }).then(user_response => {
          if (!user_response.isConfirmed) {
            this.show_teach_page = true
          }
          else {
          }
        })
      }
    }
  },
  created() {
    bus.on('open-fork-teach-table', () => {
      this.ShowTeachView();
    });
  }
}
</script>
<style scoped lang="scss">
.z-axis-control {
  width: 720px;

  .label-item {
    width: 145px;
    text-align: left;
    padding: 4px;
  }
}

.disable-notify {
  color: red;
  font-weight: bold;
}
</style>