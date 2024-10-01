<template>
  <div class="quickly-actions d-flex">
    <div class="d-flex flex-row">
      <span># 貨物ID讀取 Cargo ID Read:</span>
      <el-switch
        v-model="cstIdRead"
        class="mx-2 pb-2"
        active-text="ON"
        inactive-color="red"
        inactive-text="OFF"
        inline-prompt
        @change="(val)=>{settingsStored.CST_READER_TRIGGER=val;SaveSettings();}"
      ></el-switch>
    </div>
  </div>
</template>

<script>
import { SystemSettingsStore } from '@/store';
import { watch } from 'vue';
import { SystemAPI } from '@/api/VMSAPI';
import SystemSettings from '@/ViewModels/SystemSettings';
import { ElNotification } from 'element-plus';
export default {
  data() {
    return {
      cstIdRead: true,
      settingsStored: new SystemSettings(),
    }
  },
  methods: {
    async SaveSettings() {
      SystemAPI.SaveSettings(this.settingsStored);
      ElNotification.success('Settings has changed!');
    }
  },
  mounted() {
    setTimeout(() => {
      const _syssetting = SystemSettingsStore.state.Settings;
      this.cstIdRead = _syssetting.CST_READER_TRIGGER
      _.merge(this.settingsStored, _syssetting)
    }, 1000);

  },
}
</script>

<style>
</style>