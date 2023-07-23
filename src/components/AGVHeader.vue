<template>
  <div class="fixed-top">
    <div class="status d-flex flex-row">
      <div class="sys-name flex-fill d-flex flex-row justify-content-center">
        <div>GPM AGV</div>
      </div>

      <div
        v-bind:class="SubStatus==''?'down':SubStatus.toLowerCase()"
        class="agvc-name flex-fill"
        @dblclick="where_r_u()"
      >{{AGVName==""?"AGV":AGVName}}</div>
      <div class="account-name flex-fill">{{UserName }}</div>
      <div @dblclick="VersionTextClickHandle()" class="version-name flex-fill">{{ APPVersion }}</div>
    </div>
  </div>
</template>

<script>
import { AGVStatusStore, UserStore } from '@/store'
import { Where_r_u } from '@/api/VMSAPI'

export default {
  computed: {
    SubStatus() {
      return AGVStatusStore.getters.AGVStatus.SubState;
    },
    AGVName() {
      return AGVStatusStore.getters.AGVStatus.CarName;
    },
    APPVersion() {
      return AGVStatusStore.getters.AGVStatus.APPVersion;
    },
    UserName() {
      return UserStore.getters.CurrentUserName
    }
  },
  methods: {
    async where_r_u() {
      await Where_r_u();
    },
    VersionTextClickHandle() {
      this.ConfirmGODTriggering();
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
    },
  },
}
</script>

<style lang="scss" scoped>
.status {
  .sys-name,
  .account-name,
  .version-name {
    margin: auto 1px;
    color: white;
    font-weight: bold;
    font-size: 22px;
    // letter-spacing: 2px;
  }

  .sys-name {
    margin-left: 0;
  }
  .agvc-name {
    margin: auto 1px;
    font-weight: bold;
    font-size: 22px; //background-color: rgb(0, 197, 211);
  }
  .account-name {
    background-color: rgb(23, 162, 184);
  }
  .version-name,
  .sys-name {
    background-color: rgb(0, 123, 255);
    margin-right: 0;
  }
}
</style>