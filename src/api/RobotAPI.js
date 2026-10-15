import axios_entity from '@/axios'

/**
 * 機器手臂控制 API（對應後端 api/Robot）
 * 指令結果：{ success, message }
 * 查詢結果：{ success, message, value }
 */
export const RobotAPI = {
  async HasRobot() {
    const ret = await axios_entity.get('api/Robot/HasRobot')
    return ret.data
  },

  async PowerOn() {
    const ret = await axios_entity.post('api/Robot/PowerOn')
    return ret.data
  },
  async PowerOff() {
    const ret = await axios_entity.post('api/Robot/PowerOff')
    return ret.data
  },
  async BrakeRelease() {
    const ret = await axios_entity.post('api/Robot/BrakeRelease')
    return ret.data
  },
  async Shutdown() {
    const ret = await axios_entity.post('api/Robot/Shutdown')
    return ret.data
  },

  async LoadProgram(filename) {
    const ret = await axios_entity.post('api/Robot/LoadProgram', null, { params: { filename } })
    return ret.data
  },
  async Play() {
    const ret = await axios_entity.post('api/Robot/Play')
    return ret.data
  },
  async Pause() {
    const ret = await axios_entity.post('api/Robot/Pause')
    return ret.data
  },
  async Stop() {
    const ret = await axios_entity.post('api/Robot/Stop')
    return ret.data
  },
  async Resume() {
    const ret = await axios_entity.post('api/Robot/Resume')
    return ret.data
  },

  async IsProgramRunning() {
    const ret = await axios_entity.get('api/Robot/IsProgramRunning')
    return ret.data
  },
  async GetLoadedProgram() {
    const ret = await axios_entity.get('api/Robot/LoadedProgram')
    return ret.data
  },
  async GetProgramState() {
    const ret = await axios_entity.get('api/Robot/ProgramState')
    return ret.data
  },

  async GetRobotMode() {
    const ret = await axios_entity.get('api/Robot/RobotMode')
    return ret.data
  },
  /**
   * @param {number} targetRobotMode UR RobotMode：3=POWER_OFF、5=IDLE、7=RUNNING
   */
  async SetRobotMode(targetRobotMode, stopProgram = true, playProgram = false) {
    const ret = await axios_entity.post('api/Robot/SetRobotMode', null, {
      params: { targetRobotMode, stopProgram, playProgram }
    })
    return ret.data
  },

  async GetSafetyMode() {
    const ret = await axios_entity.get('api/Robot/SafetyMode')
    return ret.data
  },
  async UnlockProtectiveStop() {
    const ret = await axios_entity.post('api/Robot/UnlockProtectiveStop')
    return ret.data
  },
  async RestartSafety() {
    const ret = await axios_entity.post('api/Robot/RestartSafety')
    return ret.data
  },

  async IsInRemoteControl() {
    const ret = await axios_entity.get('api/Robot/IsInRemoteControl')
    return ret.data
  },

  async ShowPopup(message) {
    const ret = await axios_entity.post('api/Robot/Popup', null, { params: { message } })
    return ret.data
  },
  async ClosePopup() {
    const ret = await axios_entity.post('api/Robot/ClosePopup')
    return ret.data
  },
  async CloseSafetyPopup() {
    const ret = await axios_entity.post('api/Robot/CloseSafetyPopup')
    return ret.data
  },
  async AddToLog(message) {
    const ret = await axios_entity.post('api/Robot/AddToLog', null, { params: { message } })
    return ret.data
  },

  async GetRobotModel() {
    const ret = await axios_entity.get('api/Robot/RobotModel')
    return ret.data
  },
  async GetSerialNumber() {
    const ret = await axios_entity.get('api/Robot/SerialNumber')
    return ret.data
  },

  // --- UR 專用 ---
  async ConnectDashboard() {
    const ret = await axios_entity.post('api/Robot/ConnectDashboard')
    return ret.data
  },
  async QuitDashboard() {
    const ret = await axios_entity.post('api/Robot/QuitDashboard')
    return ret.data
  },
  async LoadInstallation(filename) {
    const ret = await axios_entity.post('api/Robot/LoadInstallation', null, { params: { filename } })
    return ret.data
  },
  async IsProgramSaved() {
    const ret = await axios_entity.get('api/Robot/IsProgramSaved')
    return ret.data
  },
  async GetSafetyStatus() {
    const ret = await axios_entity.get('api/Robot/SafetyStatus')
    return ret.data
  },
  async GetOperationalMode() {
    const ret = await axios_entity.get('api/Robot/OperationalMode')
    return ret.data
  },
  async SetOperationalMode(mode) {
    const ret = await axios_entity.post('api/Robot/SetOperationalMode', null, { params: { mode } })
    return ret.data
  },
  async ClearOperationalMode() {
    const ret = await axios_entity.post('api/Robot/ClearOperationalMode')
    return ret.data
  },
  async GetUserRole() {
    const ret = await axios_entity.get('api/Robot/UserRole')
    return ret.data
  },
  async SetUserRole(role) {
    const ret = await axios_entity.post('api/Robot/SetUserRole', null, { params: { role } })
    return ret.data
  },
  async GetPolyScopeVersion() {
    const ret = await axios_entity.get('api/Robot/PolyScopeVersion')
    return ret.data
  },
  async GetPrograms() {
    const ret = await axios_entity.get('api/Robot/Programs')
    return ret.data
  },
  async UploadProgram(filePath) {
    const ret = await axios_entity.post('api/Robot/UploadProgram', null, { params: { filePath } })
    return ret.data
  },
  async UpdateProgram(filePath) {
    const ret = await axios_entity.post('api/Robot/UpdateProgram', null, { params: { filePath } })
    return ret.data
  },
  async DownloadProgram(programName, targetPath) {
    const ret = await axios_entity.post('api/Robot/DownloadProgram', null, { params: { programName, targetPath } })
    return ret.data
  },
  async RawRequest(query) {
    const ret = await axios_entity.post('api/Robot/RawRequest', null, { params: { query } })
    return ret.data
  },
  async GenerateFlightReport(reportType = null) {
    const ret = await axios_entity.post('api/Robot/GenerateFlightReport', null, { params: { reportType } })
    return ret.data
  },
  async GenerateSupportFile(dirPath = null) {
    const ret = await axios_entity.post('api/Robot/GenerateSupportFile', null, { params: { dirPath } })
    return ret.data
  },
}

/** UR RobotMode 常用常數 */
export const ROBOT_MODE = Object.freeze({
  POWER_OFF: 3,
  IDLE: 5,
  RUNNING: 7,
})

export default RobotAPI
