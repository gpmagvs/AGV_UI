<template>
  <div class="robot-control" v-loading="busy">
    <div v-if="!hasRobot" class="robot-empty">
      <i class="bi bi-robot"></i>
      <div class="empty-title">{{ $t('robot.no_robot') }}</div>
      <div v-if="controlType" class="empty-sub">{{ $t('robot.control_type') }}: {{ controlType }}</div>
      <el-button size="small" @click="RefreshStatus">{{ $t('robot.refresh') }}</el-button>
    </div>

    <template v-else>
      <header class="robot-bar">
        <div class="bar-identity">
          <span class="live-dot" :class="{ on: hasRobot }"></span>
          <span class="bar-title">{{ status.robotModel || controlType || 'Robot' }}</span>
          <span v-if="status.serialNumber" class="bar-sn">{{ status.serialNumber }}</span>
        </div>
        <div class="bar-actions">
          <el-switch
            v-model="autoRefresh"
            size="small"
            inline-prompt
            :active-text="$t('robot.auto_refresh_short')"
            :inactive-text="$t('robot.auto_refresh_short')"
          />
          <button type="button" class="icon-btn" :disabled="busy" :title="$t('robot.refresh')" @click="RefreshStatus">
            <i class="bi bi-arrow-clockwise"></i>
          </button>
          <button type="button" class="icon-btn" :title="$t('robot.section_ur')" @click="OpenAdvanced">
            <i class="bi bi-sliders"></i>
          </button>
        </div>
      </header>

      <div class="robot-body">
        <aside class="status-rail">
          <div class="metric" :class="modeTone">
            <span class="metric-k">{{ $t('robot.robot_mode') }}</span>
            <span class="metric-v">{{ formatMode(status.robotMode) }}</span>
          </div>
          <div class="metric">
            <span class="metric-k">{{ $t('robot.safety_mode') }}</span>
            <span class="metric-v">{{ displayOrDash(status.safetyMode) }}</span>
          </div>
          <div class="metric" :class="{ 'is-run': status.isProgramRunning }">
            <span class="metric-k">{{ $t('robot.program_state') }}</span>
            <span class="metric-v">{{ programStateShort }}</span>
          </div>
          <div class="metric-row">
            <div class="metric compact">
              <span class="metric-k">{{ $t('robot.running') }}</span>
              <span class="metric-v" :class="{ 'is-run': status.isProgramRunning }">{{ onOff(status.isProgramRunning) }}</span>
            </div>
            <div class="metric compact">
              <span class="metric-k">{{ $t('robot.remote') }}</span>
              <span class="metric-v">{{ onOff(status.isInRemoteControl) }}</span>
            </div>
          </div>
          <div class="metric program-metric">
            <span class="metric-k">{{ $t('robot.loaded_program') }}</span>
            <span class="metric-v program-name" :title="displayOrDash(status.loadedProgram)">
              {{ displayOrDash(status.loadedProgram) }}
            </span>
          </div>
        </aside>

        <main class="control-board">
          <section class="zone zone-program">
            <div class="zone-head">
              <span>{{ $t('robot.section_program') }}</span>
            </div>
            <div class="program-load">
              <el-input
                v-model="programFilename"
                size="default"
                clearable
                :placeholder="$t('robot.program_filename_ph')"
                :disabled="!canOperate"
                @keyup.enter="LoadProgram"
              />
              <el-button type="primary" :disabled="!canOperate || !programFilename" @click="LoadProgram">
                {{ $t('robot.load_program') }}
              </el-button>
            </div>
            <div class="transport">
              <button type="button" class="t-btn play" :disabled="!canOperate" @click="RunCommand('Play')">
                <i class="bi bi-play-fill"></i><span>{{ $t('robot.play') }}</span>
              </button>
              <button type="button" class="t-btn pause" :disabled="!canOperate" @click="RunCommand('Pause')">
                <i class="bi bi-pause-fill"></i><span>{{ $t('robot.pause') }}</span>
              </button>
              <button type="button" class="t-btn resume" :disabled="!canOperate" @click="RunCommand('Resume')">
                <i class="bi bi-play-circle"></i><span>{{ $t('robot.resume') }}</span>
              </button>
              <button type="button" class="t-btn stop" :disabled="!canOperate" @click="RunCommand('Stop')">
                <i class="bi bi-stop-fill"></i><span>{{ $t('robot.stop') }}</span>
              </button>
            </div>
          </section>

          <section class="zone zone-power">
            <div class="zone-head">
              <span>{{ $t('robot.section_power') }}</span>
            </div>
            <div class="power-grid">
              <button type="button" class="p-btn ok" :disabled="!canOperate" @click="RunCommand('PowerOn')">
                {{ $t('robot.power_on') }}
              </button>
              <button type="button" class="p-btn warn" :disabled="!canOperate" @click="RunCommand('PowerOff')">
                {{ $t('robot.power_off') }}
              </button>
              <button type="button" class="p-btn info" :disabled="!canOperate" @click="RunCommand('BrakeRelease')">
                {{ $t('robot.brake_release') }}
              </button>
              <button type="button" class="p-btn danger" :disabled="!canOperate" @click="ConfirmThen('Shutdown', $t('robot.shutdown_confirm'))">
                {{ $t('robot.shutdown') }}
              </button>
            </div>
            <div class="mode-seg">
              <button
                type="button"
                class="mode-btn"
                :class="{ active: isMode(ROBOT_MODE.POWER_OFF) }"
                :disabled="!canOperate"
                @click="SetMode(ROBOT_MODE.POWER_OFF)"
              >OFF</button>
              <button
                type="button"
                class="mode-btn"
                :class="{ active: isMode(ROBOT_MODE.IDLE) }"
                :disabled="!canOperate"
                @click="SetMode(ROBOT_MODE.IDLE)"
              >IDLE</button>
              <button
                type="button"
                class="mode-btn"
                :class="{ active: isMode(ROBOT_MODE.RUNNING) }"
                :disabled="!canOperate"
                @click="SetMode(ROBOT_MODE.RUNNING, true, false)"
              >RUN</button>
              <button
                type="button"
                class="mode-btn accent"
                :disabled="!canOperate"
                @click="SetMode(ROBOT_MODE.RUNNING, true, true)"
              >RUN+Play</button>
            </div>
          </section>

          <section class="zone zone-safety">
            <div class="zone-head">
              <span>{{ $t('robot.section_safety') }}</span>
            </div>
            <div class="safety-grid">
              <button type="button" class="p-btn warn" :disabled="!canOperate" @click="RunCommand('UnlockProtectiveStop')">
                {{ $t('robot.unlock_protective_stop') }}
              </button>
              <button type="button" class="p-btn danger" :disabled="!canOperate" @click="ConfirmThen('RestartSafety', $t('robot.restart_safety_confirm'))">
                {{ $t('robot.restart_safety') }}
              </button>
              <button type="button" class="p-btn ghost" :disabled="!canOperate" @click="RunCommand('CloseSafetyPopup')">
                {{ $t('robot.close_safety_popup') }}
              </button>
              <button type="button" class="p-btn ghost" :disabled="!canOperate" @click="RunCommand('ClosePopup')">
                {{ $t('robot.close_popup') }}
              </button>
            </div>
          </section>

          <section class="zone zone-quick">
            <div class="zone-head">
              <span>{{ $t('robot.section_popup') }}</span>
            </div>
            <div class="quick-form">
              <el-input
                v-model="popupMessage"
                size="default"
                clearable
                :placeholder="$t('robot.popup_message_ph')"
                :disabled="!canOperate"
                @keyup.enter="ShowPopup"
              />
              <el-button type="primary" plain :disabled="!canOperate || !popupMessage" @click="ShowPopup">
                {{ $t('robot.show_popup') }}
              </el-button>
            </div>
            <div class="quick-form">
              <el-input
                v-model="logMessage"
                size="default"
                clearable
                :placeholder="$t('robot.log_message_ph')"
                :disabled="!canOperate"
                @keyup.enter="AddToLog"
              />
              <el-button plain :disabled="!canOperate || !logMessage" @click="AddToLog">
                {{ $t('robot.add_to_log') }}
              </el-button>
            </div>
          </section>
        </main>
      </div>

      <footer class="robot-foot" :class="lastMessage ? (lastSuccess ? 'ok' : 'fail') : ''">
        <span class="foot-msg">{{ lastMessage || $t('robot.ready') }}</span>
      </footer>
    </template>

    <el-drawer
      v-model="advancedOpen"
      :title="$t('robot.section_ur')"
      direction="rtl"
      size="420px"
      append-to-body
      destroy-on-close
      class="robot-advanced-drawer"
      @opened="OnAdvancedOpened"
    >
      <div class="adv-body">
        <div class="adv-block">
          <div class="adv-label">Dashboard</div>
          <div class="adv-btns">
            <el-button :disabled="!canOperate" @click="RunCommand('ConnectDashboard')">{{ $t('robot.connect_dashboard') }}</el-button>
            <el-button :disabled="!canOperate" @click="RunCommand('QuitDashboard')">{{ $t('robot.quit_dashboard') }}</el-button>
            <el-button :disabled="!canOperate" @click="RefreshUrExtra">{{ $t('robot.refresh_ur') }}</el-button>
          </div>
        </div>

        <div class="adv-metrics">
          <div><em>{{ $t('robot.operational_mode') }}</em>{{ displayOrDash(urStatus.operationalMode) }}</div>
          <div><em>{{ $t('robot.user_role') }}</em>{{ displayOrDash(urStatus.userRole) }}</div>
          <div><em>{{ $t('robot.safety_status') }}</em>{{ displayOrDash(urStatus.safetyStatus) }}</div>
          <div><em>{{ $t('robot.polyscope') }}</em>{{ displayOrDash(urStatus.polyScopeVersion) }}</div>
          <div><em>{{ $t('robot.program_saved') }}</em>{{ onOff(urStatus.isProgramSaved) }}</div>
        </div>

        <div class="adv-block">
          <div class="adv-label">{{ $t('robot.load_installation') }}</div>
          <div class="adv-row">
            <el-input v-model="installationFilename" clearable :placeholder="$t('robot.installation_ph')" :disabled="!canOperate" />
            <el-button :disabled="!canOperate || !installationFilename" @click="LoadInstallation">OK</el-button>
          </div>
        </div>

        <div class="adv-block">
          <div class="adv-label">{{ $t('robot.operational_mode') }}</div>
          <div class="adv-row">
            <el-select v-model="operationalModeInput" clearable :disabled="!canOperate" style="flex:1">
              <el-option label="MANUAL" value="MANUAL" />
              <el-option label="AUTOMATIC" value="AUTOMATIC" />
            </el-select>
            <el-button :disabled="!canOperate || !operationalModeInput" @click="SetOperationalMode">Set</el-button>
            <el-button :disabled="!canOperate" @click="RunCommand('ClearOperationalMode')">Clear</el-button>
          </div>
        </div>

        <div class="adv-block">
          <div class="adv-label">{{ $t('robot.user_role') }}</div>
          <div class="adv-row">
            <el-input v-model="userRoleInput" clearable :placeholder="$t('robot.user_role_ph')" :disabled="!canOperate" />
            <el-button :disabled="!canOperate || !userRoleInput" @click="SetUserRole">Set</el-button>
          </div>
        </div>

        <div class="adv-block">
          <div class="adv-label-row">
            <span class="adv-label">{{ $t('robot.programs') }}</span>
            <el-button size="small" link type="primary" :disabled="!canOperate" @click="FetchPrograms">
              {{ $t('robot.fetch_programs') }}
            </el-button>
          </div>
          <div class="program-chips">
            <button
              v-for="name in programList"
              :key="name"
              type="button"
              class="chip"
              @click="PickProgram(name)"
            >{{ name }}</button>
            <span v-if="!programList.length" class="chip-empty">—</span>
          </div>
        </div>

        <div class="adv-block">
          <div class="adv-label">{{ $t('robot.raw_request') }}</div>
          <div class="adv-row">
            <el-input v-model="rawQuery" clearable :placeholder="$t('robot.raw_query_ph')" :disabled="!canOperate" />
            <el-button :disabled="!canOperate || !rawQuery" @click="SendRawRequest">Send</el-button>
          </div>
          <pre v-if="rawResponse" class="raw-box">{{ rawResponse }}</pre>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import { ElMessage, ElMessageBox } from 'element-plus'
import { RobotAPI, ROBOT_MODE } from '@/api/RobotAPI'

const ROBOT_MODE_LABELS = {
  3: 'POWER_OFF',
  5: 'IDLE',
  7: 'RUNNING',
}

export default {
  name: 'RobotControl',
  props: {
    enabled: {
      type: Boolean,
      default: true,
    },
    /** 僅在 Robot 分頁可見時為 true；離開頁面時即使自動刷新開啟也不輪詢 */
    active: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      ROBOT_MODE,
      busy: false,
      autoRefresh: false,
      refreshTimer: null,
      advancedOpen: false,
      hasRobot: false,
      controlType: '',
      programFilename: '',
      popupMessage: '',
      logMessage: '',
      installationFilename: '',
      operationalModeInput: '',
      userRoleInput: '',
      rawQuery: '',
      rawResponse: '',
      programList: [],
      lastMessage: '',
      lastSuccess: true,
      status: {
        robotMode: null,
        safetyMode: null,
        programState: null,
        loadedProgram: null,
        isProgramRunning: null,
        isInRemoteControl: null,
        robotModel: null,
        serialNumber: null,
      },
      urStatus: {
        operationalMode: null,
        userRole: null,
        safetyStatus: null,
        polyScopeVersion: null,
        isProgramSaved: null,
      },
    }
  },
  computed: {
    canOperate() {
      return this.enabled && this.hasRobot && !this.busy
    },
    programStateShort() {
      const state = this.status.programState
      if (!state) return '—'
      if (typeof state === 'object') {
        return state.state || state.State || '—'
      }
      return String(state)
    },
    modeTone() {
      const mode = Number(this.status.robotMode)
      if (mode === ROBOT_MODE.RUNNING) return 'tone-run'
      if (mode === ROBOT_MODE.IDLE) return 'tone-idle'
      if (mode === ROBOT_MODE.POWER_OFF) return 'tone-off'
      return ''
    },
  },
  watch: {
    autoRefresh() {
      this.SyncAutoRefreshTimer()
    },
    active(isActive) {
      this.SyncAutoRefreshTimer()
      if (isActive) {
        this.RefreshStatus({ silent: true })
      }
    },
  },
  mounted() {
    if (this.active) {
      this.RefreshStatus()
    }
    this.SyncAutoRefreshTimer()
  },
  beforeUnmount() {
    this.StopAutoRefresh()
  },
  methods: {
    SyncAutoRefreshTimer() {
      if (this.autoRefresh && this.active) {
        this.StartAutoRefresh()
      } else {
        this.StopAutoRefresh()
      }
    },
    onOff(value) {
      if (value === null || value === undefined) return '—'
      return value ? 'ON' : 'OFF'
    },
    displayOrDash(value) {
      if (value === null || value === undefined || value === '') return '—'
      return String(value)
    },
    formatMode(mode) {
      if (mode === null || mode === undefined || mode === '') return '—'
      return ROBOT_MODE_LABELS[mode] || String(mode)
    },
    isMode(mode) {
      return Number(this.status.robotMode) === mode
    },
    StartAutoRefresh() {
      this.StopAutoRefresh()
      this.refreshTimer = setInterval(() => {
        if (!this.active || !this.autoRefresh || this.busy) return
        this.RefreshStatus({ silent: true })
      }, 2000)
    },
    StopAutoRefresh() {
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer)
        this.refreshTimer = null
      }
    },
    OpenAdvanced() {
      this.advancedOpen = true
    },
    OnAdvancedOpened() {
      this.RefreshUrExtra({ silent: true })
    },
    PickProgram(name) {
      this.programFilename = name
      this.advancedOpen = false
      ElMessage.info(`${this.$t('robot.load_program')}: ${name}`)
    },
    async RefreshStatus({ silent = false } = {}) {
      try {
        if (!silent) this.busy = true
        const hasInfo = await RobotAPI.HasRobot()
        this.hasRobot = !!(hasInfo?.hasRobot ?? hasInfo?.HasRobot)
        this.controlType = hasInfo?.controlType || hasInfo?.ControlType || ''
        if (!this.hasRobot) return

        const [
          robotMode,
          safetyMode,
          programState,
          loadedProgram,
          isProgramRunning,
          isInRemoteControl,
          robotModel,
          serialNumber,
        ] = await Promise.all([
          RobotAPI.GetRobotMode(),
          RobotAPI.GetSafetyMode(),
          RobotAPI.GetProgramState(),
          RobotAPI.GetLoadedProgram(),
          RobotAPI.IsProgramRunning(),
          RobotAPI.IsInRemoteControl(),
          RobotAPI.GetRobotModel(),
          RobotAPI.GetSerialNumber(),
        ])

        this.status.robotMode = this.pickValue(robotMode)
        this.status.safetyMode = this.pickValue(safetyMode)
        this.status.programState = this.pickValue(programState)
        this.status.loadedProgram = this.pickValue(loadedProgram)
        this.status.isProgramRunning = this.pickValue(isProgramRunning)
        this.status.isInRemoteControl = this.pickValue(isInRemoteControl)
        this.status.robotModel = this.pickValue(robotModel)
        this.status.serialNumber = this.pickValue(serialNumber)
      } catch (ex) {
        if (!silent) {
          this.NotifyResult(false, ex?.message || this.$t('robot.request_failed'))
        }
      } finally {
        if (!silent) this.busy = false
      }
    },
    pickValue(result) {
      if (!result) return null
      if (result.success === false || result.Success === false) return null
      return result.value !== undefined ? result.value : result.Value
    },
    isSuccess(result) {
      return !!(result && (result.success === true || result.Success === true))
    },
    resultMessage(result) {
      return result?.message || result?.Message || ''
    },
    NotifyResult(ok, message) {
      this.lastSuccess = ok
      this.lastMessage = message || (ok ? this.$t('robot.success') : this.$t('robot.failed'))
      if (ok) ElMessage.success({ message: this.lastMessage, duration: 1800 })
      else ElMessage.error({ message: this.lastMessage, duration: 2500 })
    },
    async RunCommand(apiName) {
      if (!RobotAPI[apiName]) return
      this.busy = true
      try {
        const result = await RobotAPI[apiName]()
        const ok = this.isSuccess(result)
        this.NotifyResult(ok, this.resultMessage(result) || (ok ? this.$t('robot.success') : this.$t('robot.failed')))
        await this.RefreshStatus({ silent: true })
      } catch (ex) {
        this.NotifyResult(false, ex?.message || this.$t('robot.request_failed'))
      } finally {
        this.busy = false
      }
    },
    async ConfirmThen(apiName, confirmText) {
      try {
        await ElMessageBox.confirm(confirmText, this.$t('robot.confirm_title'), {
          type: 'warning',
          confirmButtonText: 'OK',
          cancelButtonText: this.$t('fork_ctl_cancel'),
        })
        await this.RunCommand(apiName)
      } catch {
        // cancelled
      }
    },
    async SetMode(targetRobotMode, stopProgram = true, playProgram = false) {
      this.busy = true
      try {
        const result = await RobotAPI.SetRobotMode(targetRobotMode, stopProgram, playProgram)
        const ok = this.isSuccess(result)
        this.NotifyResult(ok, this.resultMessage(result))
        await this.RefreshStatus({ silent: true })
      } catch (ex) {
        this.NotifyResult(false, ex?.message || this.$t('robot.request_failed'))
      } finally {
        this.busy = false
      }
    },
    async LoadProgram() {
      if (!this.programFilename) return
      this.busy = true
      try {
        const result = await RobotAPI.LoadProgram(this.programFilename)
        const ok = this.isSuccess(result)
        this.NotifyResult(ok, this.resultMessage(result))
        await this.RefreshStatus({ silent: true })
      } catch (ex) {
        this.NotifyResult(false, ex?.message || this.$t('robot.request_failed'))
      } finally {
        this.busy = false
      }
    },
    async ShowPopup() {
      if (!this.popupMessage) return
      this.busy = true
      try {
        const result = await RobotAPI.ShowPopup(this.popupMessage)
        this.NotifyResult(this.isSuccess(result), this.resultMessage(result))
      } catch (ex) {
        this.NotifyResult(false, ex?.message || this.$t('robot.request_failed'))
      } finally {
        this.busy = false
      }
    },
    async AddToLog() {
      if (!this.logMessage) return
      this.busy = true
      try {
        const result = await RobotAPI.AddToLog(this.logMessage)
        this.NotifyResult(this.isSuccess(result), this.resultMessage(result))
      } catch (ex) {
        this.NotifyResult(false, ex?.message || this.$t('robot.request_failed'))
      } finally {
        this.busy = false
      }
    },
    async RefreshUrExtra({ silent = false } = {}) {
      if (!silent) this.busy = true
      try {
        const [operationalMode, userRole, safetyStatus, polyScopeVersion, isProgramSaved] = await Promise.all([
          RobotAPI.GetOperationalMode(),
          RobotAPI.GetUserRole(),
          RobotAPI.GetSafetyStatus(),
          RobotAPI.GetPolyScopeVersion(),
          RobotAPI.IsProgramSaved(),
        ])
        this.urStatus.operationalMode = this.pickValue(operationalMode)
        this.urStatus.userRole = this.pickValue(userRole)
        this.urStatus.safetyStatus = this.pickValue(safetyStatus)
        this.urStatus.polyScopeVersion = this.pickValue(polyScopeVersion)
        this.urStatus.isProgramSaved = this.pickValue(isProgramSaved)
      } catch (ex) {
        if (!silent) this.NotifyResult(false, ex?.message || this.$t('robot.request_failed'))
      } finally {
        if (!silent) this.busy = false
      }
    },
    async LoadInstallation() {
      this.busy = true
      try {
        const result = await RobotAPI.LoadInstallation(this.installationFilename)
        this.NotifyResult(this.isSuccess(result), this.resultMessage(result))
      } catch (ex) {
        this.NotifyResult(false, ex?.message || this.$t('robot.request_failed'))
      } finally {
        this.busy = false
      }
    },
    async SetOperationalMode() {
      this.busy = true
      try {
        const result = await RobotAPI.SetOperationalMode(this.operationalModeInput)
        this.NotifyResult(this.isSuccess(result), this.resultMessage(result))
        await this.RefreshUrExtra({ silent: true })
      } catch (ex) {
        this.NotifyResult(false, ex?.message || this.$t('robot.request_failed'))
      } finally {
        this.busy = false
      }
    },
    async SetUserRole() {
      this.busy = true
      try {
        const result = await RobotAPI.SetUserRole(this.userRoleInput)
        this.NotifyResult(this.isSuccess(result), this.resultMessage(result))
        await this.RefreshUrExtra({ silent: true })
      } catch (ex) {
        this.NotifyResult(false, ex?.message || this.$t('robot.request_failed'))
      } finally {
        this.busy = false
      }
    },
    async FetchPrograms() {
      this.busy = true
      try {
        const result = await RobotAPI.GetPrograms()
        const value = this.pickValue(result)
        this.programList = Array.isArray(value) ? value : []
        this.NotifyResult(this.isSuccess(result), this.resultMessage(result) || this.$t('robot.success'))
      } catch (ex) {
        this.NotifyResult(false, ex?.message || this.$t('robot.request_failed'))
      } finally {
        this.busy = false
      }
    },
    async SendRawRequest() {
      this.busy = true
      try {
        const result = await RobotAPI.RawRequest(this.rawQuery)
        this.rawResponse = JSON.stringify(result, null, 2)
        this.NotifyResult(this.isSuccess(result), this.resultMessage(result))
      } catch (ex) {
        this.NotifyResult(false, ex?.message || this.$t('robot.request_failed'))
      } finally {
        this.busy = false
      }
    },
  },
}
</script>

<style scoped lang="scss">
.robot-control {
  --rc-bg: #f5f7fa;
  --rc-panel: #ffffff;
  --rc-line: #d8dee8;
  --rc-text: #212529;
  --rc-muted: #6c757d;
  --rc-ok: #198754;
  --rc-warn: #fd7e14;
  --rc-danger: #dc3545;
  --rc-info: #0d6efd;

  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: var(--rc-text);
  background: var(--rc-bg);
  border: 1px solid var(--rc-line);
  border-radius: 10px;
  padding: 8px;
  box-sizing: border-box;
}

.robot-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--rc-muted);

  i {
    font-size: 42px;
    opacity: 0.7;
  }

  .empty-title {
    color: var(--rc-text);
    font-weight: 600;
  }

  .empty-sub {
    font-size: 12px;
  }
}

.robot-bar {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 36px;
  margin-bottom: 8px;
}

.bar-identity {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #64748b;

  &.on {
    background: var(--rc-ok);
    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.22);
  }
}

.bar-title {
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bar-sn {
  color: var(--rc-muted);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.bar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.icon-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1px solid var(--rc-line);
  background: #fff;
  color: var(--rc-text);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    border-color: var(--rc-info);
    color: var(--rc-info);
    background: #f0f6ff;
  }
}

.robot-body {
  flex: 1 1 auto;
  min-height: 0;
  display: grid;
  grid-template-columns: 200px minmax(0, 1fr);
  gap: 8px;
  overflow: hidden;
}

.status-rail {
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow: hidden;
}

.metric {
  background: var(--rc-panel);
  border: 1px solid var(--rc-line);
  border-radius: 10px;
  padding: 8px 10px;
  min-height: 0;
  box-shadow: 0 1px 2px rgba(33, 37, 41, 0.04);

  &.compact {
    flex: 1;
  }

  &.tone-run {
    border-color: #86efac;
    background: #f0fdf4;
  }

  &.tone-idle {
    border-color: #93c5fd;
    background: #eff6ff;
  }

  &.tone-off {
    border-color: #ced4da;
    background: #f8f9fa;
  }

  &.is-run .metric-v,
  .metric-v.is-run {
    color: var(--rc-ok);
  }
}

.metric-row {
  display: flex;
  gap: 6px;
}

.metric-k {
  display: block;
  color: var(--rc-muted);
  font-size: 11px;
  margin-bottom: 2px;
}

.metric-v {
  display: block;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.02em;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.program-metric {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;

  .program-name {
    white-space: normal;
    word-break: break-all;
    font-size: 13px;
    line-height: 1.35;
    overflow: auto;
  }
}

.control-board {
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  grid-template-rows: 1.15fr 1fr;
  gap: 8px;
  overflow: hidden;
}

.zone {
  background: var(--rc-panel);
  border: 1px solid var(--rc-line);
  border-radius: 12px;
  padding: 10px;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(33, 37, 41, 0.04);
}

.zone-head {
  flex: 0 0 auto;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--rc-muted);
}

.program-load,
.quick-form,
.adv-row {
  display: flex;
  gap: 6px;
  align-items: center;

  .el-input {
    flex: 1 1 auto;
    min-width: 0;
  }
}

.transport {
  flex: 1 1 auto;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
}

.t-btn {
  border: none;
  border-radius: 10px;
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  font-weight: 700;
  font-size: 12px;
  cursor: pointer;
  min-height: 0;

  i {
    font-size: 22px;
    line-height: 1;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &.play { background: #198754; }
  &.pause { background: #fd7e14; }
  &.resume { background: #0d6efd; }
  &.stop { background: #dc3545; }

  &:hover:not(:disabled) {
    filter: brightness(0.95);
  }
}

.power-grid,
.safety-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  flex: 1 1 auto;
  min-height: 0;
}

.p-btn {
  border: 1px solid transparent;
  border-radius: 9px;
  color: #fff;
  font-weight: 650;
  font-size: 12px;
  padding: 0 8px;
  min-height: 36px;
  cursor: pointer;

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &.ok { background: #198754; }
  &.warn { background: #fd7e14; }
  &.info { background: #0d6efd; }
  &.danger { background: #dc3545; }
  &.ghost {
    background: #fff;
    border-color: var(--rc-line);
    color: var(--rc-text);
  }

  &:hover:not(:disabled) {
    filter: brightness(0.95);
  }

  &.ghost:hover:not(:disabled) {
    filter: none;
    background: #f8f9fa;
    border-color: #adb5bd;
  }
}

.mode-seg {
  flex: 0 0 auto;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 4px;
  background: #eef1f5;
  border: 1px solid var(--rc-line);
  border-radius: 10px;
  padding: 4px;
}

.mode-btn {
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--rc-muted);
  font-size: 12px;
  font-weight: 700;
  min-height: 30px;
  cursor: pointer;

  &.active {
    background: #fff;
    color: var(--rc-info);
    box-shadow: 0 1px 2px rgba(13, 110, 253, 0.18);
  }

  &.accent {
    color: var(--rc-ok);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.85);
    color: var(--rc-text);
  }
}

.zone-quick {
  .quick-form + .quick-form {
    margin-top: 2px;
  }
}

.robot-foot {
  flex: 0 0 auto;
  margin-top: 6px;
  min-height: 28px;
  border-radius: 8px;
  padding: 4px 10px;
  background: #fff;
  border: 1px solid var(--rc-line);
  display: flex;
  align-items: center;

  .foot-msg {
    font-size: 12px;
    color: var(--rc-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &.ok {
    border-color: #a3e4bf;
    background: #eaf8f0;

    .foot-msg { color: #146c43; }
  }

  &.fail {
    border-color: #f1aeb5;
    background: #fcebec;

    .foot-msg { color: #b02a37; }
  }
}

.adv-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.adv-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.adv-label,
.adv-label-row {
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.adv-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.adv-btns {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.adv-metrics {
  display: grid;
  grid-template-columns: 1fr;
  gap: 6px;
  font-size: 13px;

  em {
    font-style: normal;
    color: #94a3b8;
    display: inline-block;
    min-width: 120px;
  }
}

.program-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-height: 120px;
  overflow: auto;
}

.chip {
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;

  &:hover {
    border-color: #3b82f6;
    color: #1d4ed8;
  }
}

.chip-empty {
  color: #94a3b8;
  font-size: 12px;
}

.raw-box {
  margin: 0;
  max-height: 160px;
  overflow: auto;
  background: #f8f9fa;
  color: #212529;
  border: 1px solid var(--rc-line);
  border-radius: 8px;
  padding: 8px;
  font-size: 12px;
}

@media (max-width: 1100px) {
  .robot-body {
    grid-template-columns: 170px minmax(0, 1fr);
  }

  .control-board {
    grid-template-columns: 1fr 1fr;
  }

  .t-btn span {
    display: none;
  }
}

@media (max-width: 860px) {
  .robot-body {
    grid-template-columns: 1fr;
    grid-template-rows: auto minmax(0, 1fr);
  }

  .status-rail {
    flex-direction: row;
    flex-wrap: wrap;
    max-height: 96px;
  }

  .metric {
    flex: 1 1 30%;
  }

  .program-metric {
    flex: 1 1 100%;
    max-height: 40px;
  }
}
</style>
