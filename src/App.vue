<template>
  <div v-if="CurrentAlarms!=undefined && CurrentAlarms.length>0" id="vcs-alarms">
    <div v-for="(alarmObj,code) in AlarmCodesGroup" :key="code">
      <!-- <div style="position:absolute;z-index: 5000; left:-12px">
        <el-badge
          v-if="alarmObj.Count>1"
          :value="alarmObj.Count"
          :type="alarmObj.Alarm.ELevel ==0? 'warning': 'danger'"
        ></el-badge>
        <span></span>
      </div>-->
      <el-alert
        show-icon
        :type="alarmObj.Alarm.ELevel ==0? 'warning': 'error'"
        :title="`${Timeformat(alarmObj.Alarm.Time)}-[${code}]`"
        :description="`${alarmObj.Alarm.Description}(${alarmObj.Alarm.CN==''?alarmObj.Alarm.Description:alarmObj.Alarm.CN})`"
      ></el-alert>
    </div>
  </div>
  <i @click="ToggleMenu" v-show="false" class="bi text-primary bi-list menu-toggle-icon"></i>
  <SideMenuDrawer ref="side_menu"></SideMenuDrawer>
  <router-view v-slot="{ Component }">
    <keep-alive>
      <component :is="Component" />
    </keep-alive>
  </router-view>
</template>

<script>
import bus from '@/event-bus.js'
import SideMenuDrawer from '@/views/SideMenuDrawer.vue'
import { SystemMsgStore, AGVStatusStore } from '@/store'
import { ElNotification } from 'element-plus'
import moment from 'moment'

export default {
  components: {
    SideMenuDrawer,
  },
  data() {
    return {
      showMenuToggleIcon: false,

    }
  },
  methods: {
    ToggleMenu() {
      this.$refs.side_menu.Show();
    },
    Timeformat(time, format = 'yyyy-MM-DD HH:mm:ss') {
      return moment(time).format(format)
    }
  },
  computed: {
    CurrentSystemMsg() {
      return SystemMsgStore.getters.SysMessages
    },
    CurrentAlarms() {

      return AGVStatusStore.getters.AlarmCodes
    },
    AlarmCodesGroup() {
      return AGVStatusStore.getters.AlarmGroup;
    },
    VehicleName() {
      return AGVStatusStore.getters.AGVName;
    }

  },
  watch: {
    VehicleName(newValue, oldValue) {
      document.title = 'GPM-' + newValue;
    }
  },
  mounted() {
    document.title = "GPM AGV";
    bus.on('/god_mode_changed', (is_god_mode_now) => {
      this.showMenuToggleIcon = is_god_mode_now
    });
    if (process.env.NODE_ENV != 'production') {
      this.showMenuToggleIcon = true;
    }
    bus.on('idle', (arg) => {
      this.$router.push('/idle')
      // alert('idle 5 ^_^')
    })
    bus.on('system_msg_updated', (msg) => {
      var _type = msg.Level == 0 ? 'info' : msg.Level == 1 ? 'warning' : 'error';
      ElNotification({
        title: 'System Message',
        message: msg.Message,
        type: _type,
        position: 'bottom-right',
        duration: 3000,
      });
    })
  },
};
</script>

<style lang="scss">
.menu-toggle-icon {
  position: absolute;
  left: 0;
  font-size: 26px;
  cursor: pointer;
}

#app {
  //font-family: Avenir, Helvetica, Arial, sans-serif;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
    Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  height: 100%;
}

nav {
  padding: 30px;

  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
body,
html {
  height: 100%;
  -webkit-user-select: none; /* Chrome, Safari, Opera */
  -moz-user-select: none; /* Firefox */
  -ms-user-select: none; /* IE 10+ */
  user-select: none;
}
#vcs-alarms {
  position: absolute;
  right: 5px;
  z-index: 9999;
  width: 50%;

  span {
    // color: rgb(0, 123, 255);
    color: rgb(182, 179, 179);
  }
  p {
    text-align: left;
    font-weight: bold;
    font-size: 20px;
    padding: 0 auto;
  }
  .el-alert {
    margin: 3px auto;
    text-align: left;
    --el-alert-icon-large-size: 37px;
    .el-alert__close-btn {
      font-size: 30px;
    }
  }
}
</style>
