<template>
  <div class="sounds-setting">
    <el-collapse v-model="activeNames" @change="handleChange" :accordion="false">
      <el-collapse-item title="Information" name="info">
        <div class="w-100">
          <el-form :model="sounds" label-position="left" label-width="130px">
            <el-form-item label="播放組件">
              <el-tag effect="dark" size="large">{{ player }}</el-tag>
            </el-form-item>
          </el-form>
        </div>
      </el-collapse-item>
      <el-collapse-item title="音效設置" name="audio-setting">
        <div class="w-100">
          <el-form :model="sounds" label-position="left" label-width="130px">
            <el-form-item label="旋轉/減速音效">
              <el-switch
                size="large"
                active-text="開啟"
                inactive-text="關閉"
                inline-prompt
                v-model="sounds.slowDownAndRotatinSoundPlay.Enable"
              />
            </el-form-item>
            <el-form-item label="旋轉/減速播放模式">
              <el-select v-model="sounds.slowDownAndRotatinSoundPlay.SoundPlayType">
                <el-option label="語音" :value="0" />
                <el-option label="音樂" :value="1" />
              </el-select>
            </el-form-item>
          </el-form>
        </div>
      </el-collapse-item>
      <el-collapse-item title="音效路徑" name="audio-path">
        <div class="w-100">
          <el-form :model="sounds" label-position="left" label-width="130px">
            <el-form-item
              v-for="(fileName, key) in filteredAudioFileNamesByAGVModel"
              :key="key"
              :label="translateMap[key] || key"
            >
              <div class="d-flex w-100">
                <el-input
                  class="flex-fill"
                  v-model="sounds.audioPathes[key]"
                  :disabled="!editStateStore[key]"
                />

                <el-button
                  v-if="editStateStore[key]"
                  type="success"
                  @click="SavePath(key)"
                  style="margin-left: 10px;"
                >儲存</el-button>
                <el-button
                  v-if="editStateStore[key]"
                  type="danger"
                  @click="()=>{editStateStore[key]=false}"
                  style="margin-left: 10px;"
                >取消</el-button>
                <el-button v-else @click="EditPath(key)" type="info" style="margin-left: 10px;">編輯</el-button>
                <!-- 先隱藏  -->
                <el-button
                  v-if="false"
                  type="info"
                  @click="selectSound(key)"
                  style="margin-left: 10px;"
                >選取</el-button>

                <el-button
                  v-if="playingStateStore[key]"
                  circle
                  type="danger"
                  @click="stopPlaySound(key)"
                  style="margin-left: 10px;"
                >
                  <i class="bi bi-stop-fill"></i>
                </el-button>
                <el-button
                  v-else
                  circle
                  type="primary"
                  @click="playSound(key)"
                  style="margin-left: 10px;"
                >
                  <i class="bi bi-play-fill"></i>
                </el-button>
              </div>
            </el-form-item>
            <el-drawer
              v-model="showSelectSoundDrawer"
              :title="`選取音效-${translateMap[selectSoundKey]}`"
              :before-close="handleClose"
            ></el-drawer>
          </el-form>
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script>
import { AGVStatusStore, SystemSettingsStore } from '@/store'
import _ from 'lodash';
import SystemSettings from '@/ViewModels/SystemSettings';
import { BuzzerOff, SoundsAPI } from '@/api/VMSAPI';
import param from '@/gpm_param';
export default {
  data() {
    return {
      sounds: new SystemSettings().SoundsParams,
      activeNames: ['info', 'audio-setting', 'audio-path'],
      titleStyle: { fontWeight: 'bold', fontSize: '16px' },
      translateMap: {
        'move': '一般走行',
        'alarm': 'Alarm',
        'goToCharge': '移動至充電站',
        'action': '取放貨',
        'rotating': '旋轉中',
        'slowDown': '減速中',
        'batteryExchange': '電池交換中',
      },
      playingStateStore: {
        'move': false,
        'alarm': false,
        'goToCharge': false,
        'action': false,
        'rotating': false,
        'slowDown': false,
        'batteryExchange': false,
      },
      editStateStore: {
        'move': false,
        'alarm': false,
        'goToCharge': false,
        'action': false,
        'rotating': false,
        'slowDown': false,
        'batteryExchange': false,
      },
      showSelectSoundDrawer: false,
      selectSoundKey: '',
      audioPlayer: new Audio(),
    }
  },
  computed: {
    player() {
      return AGVStatusStore.state.AGVStatus.BuzzerState.player;
    },
    agvModel() {
      return SystemSettingsStore.state.Settings.AgvType;
    },
    filteredAudioFileNamesByAGVModel() {
      if (this.agvModel === 2) {
        return Object.fromEntries(
          Object.entries(this.sounds.audioFileNames).filter(([key]) => {
            return (key !== 'batteryExchange' && key !== 'goToCharge' && key !== 'action');
          })
        );
      } else {
        return Object.fromEntries(
          Object.entries(this.sounds.audioFileNames).filter(([key]) => {
            return (key !== 'batteryExchange');
          })
        );
      }

    }
  },
  mounted() {
    this.sounds = _.cloneDeep(SystemSettingsStore.state.Settings.SoundsParams);
  },
  methods: {
    async playSound(key) {
      await BuzzerOff();
      // let all playingStateStore to false
      Object.keys(this.playingStateStore).forEach(key => {
        this.playingStateStore[key] = false;
      });
      // const audioPath = this.sounds.audioPathes[key];
      // await SoundsAPI.PlayAudio(audioPath);
      // 創建一個新的 Audio 對象

      // Stop current audio if playing
      if (!this.audioPlayer.paused) {
        this.audioPlayer.pause();
        this.audioPlayer.currentTime = 0;
      }

      const audioUrl = `${param.backend_host}/audios/${this.sounds.audioFileNames[key]}`
      // 播放音效
      // Set new audio source
      this.audioPlayer.src = audioUrl;

      // Play audio
      this.audioPlayer.play().catch(error => {
        console.error('音效播放失敗:', error);
        this.$notify({
          title: '音效播放',
          message: `[${this.translateMap[key]}] 音效播放失敗`,
          type: 'error'
        });
      });

      // Set up onended event
      this.audioPlayer.onended = () => {
        this.playingStateStore[key] = false;
      };

      // Notify user
      this.$notify({
        title: '音效播放',
        message: `正在播放 [${this.translateMap[key]}] 音效`,
        type: 'info'
      });
      this.playingStateStore[key] = true;
    },
    async stopPlaySound(key) {
      this.audioPlayer.pause();
      this.audioPlayer.currentTime = 0;
      this.playingStateStore[key] = false;
    },
    selectSound(key) {
      this.showSelectSoundDrawer = true;
      this.selectSoundKey = key;
    },
    saveSounds() {
      SystemSettingsStore.commit('UpdateSettings', { SoundsParams: this.sounds });
    },
    SavePath(key) {
      this.editStateStore[key] = false;
      SoundsAPI.SaveAudioPath(this.sounds.audioPathes);
      this.$notify({
        title: '音效設置',
        message: `[${this.translateMap[key]}] 音效路徑已儲存`,
        type: 'success'
      });
    },
    EditPath(key) {
      this.editStateStore[key] = true;

    }
  }

}
</script>

<style scoped lang="scss">
.sounds-setting {
  ::v-deep .el-collapse-item__header {
    font-weight: bold;
    font-size: 16px;
    color: rgb(0, 63, 156);
  }

  ::v-deep .el-form-item {
    border-bottom: 1px solid #e6e6e6;
    padding-bottom: 5px;
    padding-left: 10px;
  }
}
</style>
                                                                                                            