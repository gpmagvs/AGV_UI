<template>
  <transition name="el-zoom-in-top">
    <div class="side h-100">
      <div class="side-scroll">
        <div class="side-section side-section-controls opt-buttons">
          <b-button :disabled="backEndServerErr || VMSData.IsSystemIniting" class="side-btn" block
            :class="initButtonClass" @click="AGVInitialize">
            <b v-if="VMSData.SubState != 'Initializing'">{{ $t('initialize') }}</b>
            <b v-else>{{ $t('initializing') }}</b>
          </b-button>
          <b-button :disabled="backEndServerErr" class="side-btn side-btn-secondary" block
            :variant="alarmResetBtnVariant" @click="AGVResetAlarm">
            <b>{{ $t('reset_alarm') }}</b>
          </b-button>
          <b-button :disabled="backEndServerErr" variant="light" class="side-btn side-btn-secondary" block
            @click="AGVBuzzerOff">
            <b>
              <i v-if="IsBuzzerMute" class="bi bi-volume-mute-fill"></i>
              {{ $t('buzzer_off') }}
              <i v-if="!IsBuzzerMute && BuzzerState.isPlaying" class="bi bi-volume-up-fill"></i>
            </b>
          </b-button>
          <div v-if="IsCstIDReadable" class="cst-action">
            <b-button :disabled="backEndServerErr" variant="light" class="side-btn side-btn-secondary w-100"
              :class="rm_cst_btn_class_bind" block @click="ShowRemoveCstDialog">
              <b>{{ $t('cst-remove') }}</b>
            </b-button>
            <el-badge class="cst-badge" :value="cargo_status_text" @click="ShowRemoveCstDialog">
              <span class="cst-badge-anchor" @click="ShowRemoveCstDialog"></span>
            </el-badge>
          </div>
          <b-button :disabled="backEndServerErr" :variant="IsLogin ? 'danger' : 'light'" class="side-btn"
            :class="IsLogin ? 'side-btn-danger' : 'side-btn-secondary'" block @click="ShowLogin">
            <i v-if="!IsLogin" class="bi bi-box-arrow-in-right mx-1"></i>
            <i v-else class="bi bi-box-arrow-left mx-1"></i>
            <b>{{ LoginBtnText }}</b>
          </b-button>
          <login ref="login"></login>
        </div>

        <div class="side-section side-section-modes modes">
          <div class="mode-row">
            <div class="mode-item-label">Online Mode</div>
            <el-switch v-model="IsOnlineMode" :disabled="backEndServerErr || VMSData.IsSystemIniting" width="75"
              size="large" inline-prompt inactive-text="Offline" active-text="Online" active-color="rgb(13, 110, 253)"
              inactive-color="rgb(220, 53, 69)" @click.prevent="OnlineModeSwitchHandle" />
          </div>
          <div class="mode-row">
            <div class="mode-item-label">Auto Mode</div>
            <el-switch v-model="IsAutoMode" :disabled="backEndServerErr || VMSData.IsSystemIniting" width="75"
              size="large" inline-prompt inactive-text="Manual" active-text="Auto" active-color="rgb(13, 110, 253)"
              inactive-color="rgb(220, 53, 69)" @click.stop.prevent="AutoModeSwitchHandle" />
          </div>
        </div>

        <div v-if="!IOConnected || (Is_TSMC_MiniAGV || !isBrakeSwitchRelease)"
          class="side-section side-section-meter connection-status">
          <div class="section-label">
            <i class="bi bi-ethernet"></i>
            <span>{{ $t('connection-states') }}</span>
          </div>
          <div class="connection-body">
            <connection_state></connection_state>
          </div>
        </div>

        <div class="side-section side-section-meter coordination">
          <div v-if="IOConnected && isBrakeSwitchRelease && !Is_TSMC_MiniAGV" class="coord-rich">
            <div class="tag-block">
              <div class="section-label is-center">Tag</div>
              <el-tag class="tag-display" :type="VMSData.BCR_State_MoveBase.tagID == 0 ? 'danger' : 'success'">
                {{ VMSData.BCR_State_MoveBase.tagID }}
              </el-tag>
            </div>
            <div class="offset-block">
              <div class="section-label is-center">偏移量</div>
              <el-form-item class="coord-field" label="X">
                <b-form-input class="text-center" size="sm" disabled
                  v-model.number="VMSData.BCR_State_MoveBase.xValue"></b-form-input>
              </el-form-item>
              <el-form-item class="coord-field" label="Y">
                <b-form-input class="text-center" size="sm" disabled
                  v-model.number="VMSData.BCR_State_MoveBase.yValue"></b-form-input>
              </el-form-item>
            </div>
          </div>
          <div v-else class="coord-compact">
            <div class="coord-field-wrap" v-if="!Is_TSMC_MiniAGV">
              <div class="section-label">Tag</div>
              <b-form-input class="coord-input-sm text-center" size="sm" disabled
                v-model="VMSData.BCR_State_MoveBase.tagID" :state="VMSData.BCR_State_MoveBase.tagID > 0"></b-form-input>
            </div>
            <div class="coord-field-wrap" v-else>
              <div class="section-label">Location</div>
              <b-form-input class="coord-input-sm text-center" size="sm" disabled
                v-model="VMSData.Last_Visited_Tag"></b-form-input>
            </div>
            <div class="coord-field-wrap">
              <div class="section-label">{{ $t('coordination') }}</div>
              <b-form-input class="coord-input-md text-center" size="sm" disabled :state="VMSData.LocStatus == 10"
                v-model="Coordination"></b-form-input>
            </div>
          </div>
          <el-button v-if="Is_TSMC_MiniAGV" class="loc-btn" effect="dark" size="small" @click="HandleLocalizationClick">
            定位
          </el-button>
        </div>

        <div class="side-section side-section-meter side-metrics">
          <div class="side-metrics__row">
            <ForkHeightSection v-if="Is_Fork_AGV" />
            <MileageSection />
          </div>
        </div>
      </div>

      <div class="side-emo-dock">
        <emo :disabled="backEndServerErr" :size="136"></emo>
      </div>

      <b-modal v-model="wait_online_request_dialog_show" title="AGV Online Requesting" :centered="true"
        :hideFooter="true" :noCloseOnBackdrop="true" :noCloseOnEsc="true" :hideHeaderClose="true"
        header-bg-variant="primary" header-text-variant="light">
        <p class="py-3">{{ $t('wait_online_text') }}</p>
      </b-modal>

      <AGVLocalization ref="localization_dialog"></AGVLocalization>
    </div>
  </transition>
</template>

<script>
import ForkHeightSection from '@/components/ForkHeightSection.vue'
import MileageSection from '@/components/MileageSection.vue'
import emo from '@/components/EMOButton.vue'
import login from '@/components/Login.vue'
import connection_state from '@/components/ConnectionStates.vue'
import AGVLocalization from '@/components/AGVLocalization.vue'
import {
  Initialize,
  CancelInitProcess,
  ResetAlarm,
  BuzzerOff,
  RemoveCassette,
  MODESwitcher,
} from '@/api/VMSAPI'
import { ElMessage } from 'element-plus'
import { UserStore, UIStore, SystemSettingsStore, AGVStatusStore, DIOStore } from '@/store'

export default {
  name: 'HomeSidePanel',
  components: {
    emo,
    login,
    connection_state,
    AGVLocalization,
    ForkHeightSection,
    MileageSection,
  },
  props: {
    backEndServerErr: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['request-build-cargo'],
  data() {
    return {
      isInitializing: false,
      cancelInitComfirmDialogShow: false,
      wait_online_request_dialog_show: false,
      mode_switch_data: {
        type: 'online',
        state: false,
      },
    }
  },
  computed: {
    VMSData() {
      return AGVStatusStore.getters.AGVStatus
    },
    initButtonClass() {
      const sub = this.VMSData.SubState
      if (sub == '' || (!this.VMSData.IsInitialized && sub != 'Initializing')) {
        return 'down'
      }
      return sub.toLowerCase()
    },
    IsCstIDReadable() {
      if (this.VMSData.Agv_Type == 2) return false
      return SystemSettingsStore.getters.IsCstIDReadable
    },
    Is_TSMC_MiniAGV() {
      return AGVStatusStore.getters.IsInspectionAGV
    },
    Is_Fork_AGV() {
      return AGVStatusStore.getters.IsForkAGV
    },
    IsLogin() {
      return UserStore.getters.CurrentUserRole != 0
    },
    LoginBtnText() {
      return this.IsLogin ? this.$t('logout') : this.$t('login')
    },
    alarmResetBtnVariant() {
      return this.VMSData.AlarmCodes.length > 0 ? 'danger' : 'light'
    },
    IsAutoMode() {
      return this.VMSData.AutoMode == 1
    },
    IsOnlineMode() {
      return this.VMSData.OnlineMode == 1
    },
    UserName() {
      return UserStore.getters.CurrentUserName
    },
    Coordination() {
      return `(${this.VMSData.Pose.position.x.toFixed(2)},${this.VMSData.Pose.position.y.toFixed(2)})`
    },
    IsBuzzerMute() {
      return !SystemSettingsStore.getters.Settings?.BuzzerOn
    },
    BuzzerState() {
      const state = AGVStatusStore.state.AGVStatus.BuzzerState
      if (state) return state
      return {
        isPlaying: false,
        player: 'ros-sound-play',
        playingAudio: '',
      }
    },
    cargo_status_text() {
      const hasCargo = this.VMSData.CargoExist
      const hasCargoId = this.VMSData.CST_Data != ''
      if (hasCargo && hasCargoId) return ''
      if (!hasCargo && !hasCargoId) return ''
      if (hasCargo && !hasCargoId) return '有料無帳'
      if (!hasCargo && hasCargoId) return '有帳無料'
      return ''
    },
    rm_cst_btn_class_bind() {
      const hasCargo = this.VMSData.CargoExist
      const hasCargoId = this.VMSData.CST_Data != ''
      if (!hasCargo && hasCargoId) return 'has-id-but-cargo-not-exist'
      return ''
    },
    IOConnected() {
      return UIStore.state.ConnectionStateData.WAGO == 0
    },
    isBrakeSwitchRelease() {
      try {
        const released = DIOStore.getters.IsBrakeSwitchRelease
        const agvType = AGVStatusStore.getters.AGVStatus.Agv_Type
        return released && agvType != 2330
      } catch {
        return false
      }
    },
  },
  methods: {
    ShowLogin() {
      if (this.IsLogin) {
        this.$swal.fire({
          title: 'Logout Confirm',
          text: this.$t('logout-confirm'),
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'OK',
          customClass: 'my-sweetalert',
        }).then((result) => {
          if (result.isConfirmed) {
            UserStore.dispatch('Logout')
          }
        })
      } else {
        this.$refs.login.Show()
      }
    },
    async AGVInitialize() {
      if (this.VMSData.isInitializing) {
        this.cancelInitComfirmDialogShow = true
        return
      }

      const isGodUseForkAGV =
        this.Is_Fork_AGV &&
        this.UserName == 'GOD' &&
        DIOStore.getters.IsResetButtonPressing

      this.$swal.fire({
        title: 'AGV Initialize',
        text: `${this.$t(
          this.Is_Fork_AGV
            ? this.VMSData.ForkHasLoading
              ? 'start_init_action_notify_fork_has_loading'
              : 'start_init_action_notify'
            : 'start_init_action_notify_submarin_agv'
        )}`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'OK',
        showDenyButton: isGodUseForkAGV,
        denyButtonText: 'GOD 牙叉不初始化',
        customClass: 'my-sweetalert' + (isGodUseForkAGV ? ' fork-agv-initialize-dialog' : ''),
      }).then(async (result) => {
        if (result.isConfirmed || (isGodUseForkAGV && result.isDenied)) {
          this.isInitializing = true
          const initResult = await Initialize(result.isDenied)
          if (!initResult.confirm) {
            let message = initResult.message
            const hasCargoButNoData = initResult.has_cargo_but_no_data
            if (message.includes('\n')) {
              message = message.split('\n').join('<br>')
            }
            message = message.replaceAll('\n', '<br>')

            this.$swal.fire({
              title: 'AGV Initialize Fail',
              html: message,
              icon: 'error',
              showCancelButton: hasCargoButNoData,
              cancelButtonText: hasCargoButNoData ? 'OK' : '',
              confirmButtonText: hasCargoButNoData ? '建立帳籍' : 'OK',
              customClass: 'my-sweetalert',
            }).then((res) => {
              if (res.isConfirmed && hasCargoButNoData) {
                this.$emit('request-build-cargo')
              }
            })
          }
        }
      })
    },
    ShowRemoveCstDialog() {
      this.$swal.fire({
        title: `${this.$t('cst-remove')}`,
        text: `${this.$t('cst-remove-confirm-text')}`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'OK',
        customClass: 'my-sweetalert',
      }).then((result) => {
        if (result.isConfirmed) {
          this.AGVRemoveCassette()
        }
      })
    },
    async CancelInitProcessWorker() {
      await CancelInitProcess()
      this.isInitializing = false
    },
    async AGVResetAlarm() {
      await ResetAlarm()
    },
    async AGVBuzzerOff() {
      await BuzzerOff()
    },
    async AGVRemoveCassette() {
      const returnCode = await RemoveCassette()
      let swalTitle = ''
      let swalText = ''
      let swalIcon = ''

      if (returnCode == 0) {
        swalTitle = swalText = '移除卡匣成功'
        swalIcon = 'success'
      } else {
        const returnCodeMap = {
          419: {
            messageZh: 'AGV車上仍有貨物,請先移除貨物再移除卡匣',
            messageEng: 'AGV has cargo, please remove cargo first',
          },
        }
        const returnCodeData = returnCodeMap[returnCode]
        if (returnCodeData) {
          swalTitle = '移除卡匣失敗:' + `${returnCodeData.messageZh}`
          swalText = 'Remove Cassette Failed:' + `${returnCodeData.messageEng}`
          swalIcon = 'error'
        } else {
          swalTitle = '移除卡匣失敗'
          swalText = 'Remove Cassette Failed'
          swalIcon = 'error'
        }
      }

      this.$swal.fire({
        title: swalTitle,
        text: swalText,
        icon: swalIcon,
        showCancelButton: false,
        confirmButtonText: 'OK',
        customClass: 'my-sweetalert',
      })
    },
    AutoModeSwitchHandle() {
      if (!this.IsAutoMode && this.VMSData.MainState != 'IDLE') {
        this.$swal.fire({
          title: '當前狀態無法切換為自動模式',
          text: 'Cannot switch to Auto mode in current state.',
          icon: 'error',
          showCancelButton: false,
          confirmButtonText: 'OK',
          customClass: 'my-sweetalert',
        })
        return
      }

      this.mode_switch_data.type = 'auto'
      this.mode_switch_data.state = !this.IsAutoMode

      this.$swal.fire({
        title: `${this.$t('agv-auto-mode')}`,
        text: `${this.mode_switch_data.state ? this.$t('agv-auto-mode-alert') : this.$t('agv-manual-mode-alert')}`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'OK',
        customClass: 'my-sweetalert',
      }).then((result) => {
        if (result.isConfirmed) {
          this.ModeSwitchHandler()
        }
      })
    },
    OnlineModeSwitchHandle() {
      if (
        !this.IsOnlineMode &&
        this.VMSData.MainState.toUpperCase() != 'IDLE' &&
        this.VMSData.MainState.toUpperCase() != 'CHARGING'
      ) {
        this.$swal.fire({
          title: `當前狀態無法上線(${this.VMSData.MainState})`,
          text: `Cannot switch to Online mode in current state.(${this.VMSData.MainState})`,
          icon: 'error',
          showCancelButton: false,
          confirmButtonText: 'OK',
          customClass: 'my-sweetalert',
        })
        return
      }

      this.mode_switch_data.type = 'online'
      this.mode_switch_data.state = !this.IsOnlineMode

      this.$swal.fire({
        title: `${this.$t('agv-online')}`,
        text: `${this.mode_switch_data.state ? this.$t('agv-online-alert') : this.$t('agv-offline-alert')}`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'OK',
        customClass: 'my-sweetalert',
      }).then((result) => {
        if (result.isConfirmed) {
          this.ModeSwitchHandler()
        }
      })
    },
    async ModeSwitchHandler() {
      if (this.mode_switch_data.type == 'auto') {
        const ret = await MODESwitcher.AutoModeSwitch(this.IsAutoMode ? 0 : 1)
        if (!ret.Success) {
          let message = ret.Message
          if (message.includes('\n')) {
            message = message.split('\n').join('<br>')
          }
          message = message.replaceAll('\n', '<br>')
          this.$swal.fire({
            title: '自動模式切換失敗 Auto Mode Switch Fail',
            html: message,
            icon: 'error',
            showCancelButton: false,
            confirmButtonText: 'OK',
            customClass: 'my-sweetalert',
          })
        }
      } else {
        this.wait_online_request_dialog_show = true
        const ret = await MODESwitcher.OnlineModeSwitch(this.IsOnlineMode ? 0 : 1)
        if (!ret.Success) {
          let message = ret.Message
          if (message.includes('\n')) {
            message = message.split('\n').join('<br>')
          }
          message = message.replaceAll('\n', '<br>')
          this.$swal.fire({
            title: '上線請求失敗',
            html: message,
            icon: 'error',
            showCancelButton: false,
            confirmButtonText: 'OK',
            customClass: 'my-sweetalert',
          })
        }

        setTimeout(() => {
          this.wait_online_request_dialog_show = false
          if (ret.Success) {
            ElMessage.success({
              message: this.IsOnlineMode ? 'AGV已上線 | AGV is online' : 'AGV已下線 | AGV is offline',
              duration: 1500,
              grouping: true,
              plain: true,
            })
          }
        }, 700)
      }
    },
    HandleLocalizationClick() {
      this.$refs.localization_dialog.Show()
    },
  },
}
</script>

<style lang="scss" scoped>
.side {
  --side-bg: #f8fafc;
  --side-well: #f1f5f9;
  --side-line: #e2e8f0;
  --side-text: #0f172a;
  --side-muted: #64748b;
  --side-danger: #dc2626;
  --side-shadow-btn: 0 1px 2px rgba(15, 23, 42, 0.05);

  display: flex;
  flex-direction: column;
  width: var(--side-menu-width);
  flex: 0 0 var(--side-menu-width);
  flex-shrink: 0;
  align-self: stretch;
  height: 100%;
  min-height: 0;
  margin-top: 3px;
  padding: 0;
  box-sizing: border-box;
  background: var(--side-bg);
  border-right: 1px solid var(--side-line);
  color: var(--side-text);
  font-family: 'Segoe UI', 'Noto Sans TC', system-ui, sans-serif;
  overflow: hidden;
}

.side-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 6px 10px 4px;
  scrollbar-width: thin; /* Firefox */
  scrollbar-color: rgba(100, 116, 139, 0.08) transparent; /* Firefox */

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: rgba(100, 116, 139, 0.06);
    border-radius: 999px;
    border: 2px solid transparent;
    background-clip: padding-box;
  }

  &::-webkit-scrollbar-thumb:hover {
    background-color: rgba(100, 116, 139, 0.12);
  }
}

.side-emo-dock {
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: auto;
  padding: 6px 10px calc(40px + var(--app-bottom-footer-height, 38px));
  border-top: 1px solid var(--side-line);
  background: var(--side-bg);
}

/* 區段只靠間距＋細分隔線，不再層層套框 */
.side-section {
  margin: 0;
  padding: 6px 0;
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;

  +.side-section {
    border-top: 1px solid var(--side-line);
  }
}

.side-section-controls {
  padding-top: 2px;
  padding-bottom: 6px;
}

.opt-buttons {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-weight: 600;

  :deep(.side-btn) {
    margin: 0 !important;
    min-height: 38px;
    padding: 6px 10px !important;
    border-radius: 4px !important;
    letter-spacing: 0.02em;
    font-size: 15px;
    font-weight: 700;
    text-transform: none;
    box-shadow: none !important;

    b {
      font-weight: inherit;
    }

    border-width: 1px !important;
    border-style: solid !important;
    border-color: var(--side-line) !important;
    transition: transform 0.05s ease,
    background-color 0.12s ease,
    border-color 0.12s ease;

    &:hover:not(:disabled) {
      border-color: #94a3b8 !important;
    }

    &:active:not(:disabled) {
      transform: translateY(1px);
    }

    &:disabled {
      opacity: 0.55;
    }
  }

  :deep(.side-btn-secondary) {
    background: var(--side-well) !important;
    border-color: var(--side-line) !important;
    color: var(--side-text) !important;

    &:hover:not(:disabled) {
      background: #f1f5f9 !important;
      border-color: #94a3b8 !important;
    }
  }

  :deep(.btn-danger.side-btn),
  :deep(.side-btn-danger) {
    background: var(--side-danger) !important;
    border-color: #b91c1c !important;
    color: #fff !important;
  }
}

.cst-action {
  position: relative;
}

.cst-badge {
  position: absolute;
  top: -6px;
  right: 4px;
  cursor: pointer;
  z-index: 2;
}

.cst-badge-anchor {
  display: inline-block;
  width: 1px;
  height: 1px;
}

/* 模式切換：單列，不再每列一框 */
.side-section-modes {
  padding-top: 4px;
  padding-bottom: 4px;
}

.modes {
  display: flex;
  flex-direction: column;
  gap: 0;
  text-align: left;
}

.mode-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 34px;
  padding: 0 2px;
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}

.mode-item-label {
  flex: 1 1 auto;
  min-width: 0;
  font-weight: 600;
  font-size: 15px;
  color: var(--side-muted);
  letter-spacing: 0.01em;
}

.side-section-meter {
  background: transparent;
}

.section-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
  font-size: 13px !important;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--side-muted);
  line-height: 1.2;

  &.is-center {
    justify-content: center;
    width: 100%;
  }

  >i {
    font-size: 0.95em;
    opacity: 0.85;
  }

  >span {
    font-size: inherit;
  }

  &.is-clickable {
    cursor: pointer;
    border-radius: 4px;
    padding: 2px 4px;
    margin-left: -4px;

    &:hover {
      color: #0f766e;
      background: var(--side-well);
    }
  }
}

.connection-status {
  .connection-body {
    padding: 4px 6px;
    background: var(--side-well);
    border-radius: 4px;

    :deep(.connection-states) {
      font-size: 13px;
      font-weight: 500;
      color: var(--side-muted);
      line-height: 1.3;

      td div {
        font-weight: 500;
        color: var(--side-muted);
      }
    }

    :deep(td) {
      padding: 2px 2px;
      vertical-align: middle;
    }

    :deep(.bi-circle-fill) {
      margin-right: 4px;
      font-size: 0.75em;
    }
  }
}

.coord-rich {
  display: flex;
  width: 100%;
  gap: 10px;
  align-items: flex-start;
}

.tag-block {
  flex: 0 0 auto;
}

.tag-display {
  width: 100px !important;
  height: 85px !important;
  font-size: 58px !important;
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  border-radius: 6px !important;
  font-weight: 700 !important;
  font-variant-numeric: tabular-nums !important;
  line-height: 1 !important;
}

.offset-block {
  flex: 1 1 auto;
  min-width: 0;
}

.coord-field {
  margin-bottom: 4px !important;

  &:last-child {
    margin-bottom: 0 !important;
  }

  :deep(.el-form-item__label) {
    font-size: 14px;
    font-weight: 700;
    color: var(--side-muted);
  }

  :deep(.form-control),
  :deep(input) {
    background: #fff;
    border-color: var(--side-line);
    text-align: center !important;
    font-size: 14px;
    font-variant-numeric: tabular-nums;
  }
}

.coord-compact {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
  padding: 0;
}

.coord-field-wrap {
  min-width: 0;

  :deep(.form-control),
  :deep(input) {
    background: #fff;
    border-color: var(--side-line);
    text-align: center !important;
    font-size: 14px;
    font-variant-numeric: tabular-nums;
  }
}

.coordination {

  :deep(.form-control),
  :deep(input.form-control),
  :deep(input) {
    text-align: center !important;
  }
}

.coord-input-sm {
  width: 70px;
  text-align: center !important;
}

.coord-input-md {
  width: 120px;
  text-align: center !important;
}

.loc-btn {
  margin-top: 4px;
}

.side-metrics__row {
  display: flex;
  width: 100%;
  gap: 6px;
}
</style>
