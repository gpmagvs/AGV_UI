class BatteryStatus {
  BatteryID = 0
  BatteryLevel = 0
  IsCharging = false
  ChargeCurrent = 0.0
  Voltage = 0.0
  SensorInfo = new BatteryPositionInfoVM()
  constructor(level) {
    if (typeof level === 'number') this.BatteryLevel = level
  }
}

class BatteryPositionInfoVM {
  IsExistSensor1ON = false
  IsDockingSensor1ON = false
  IsLockSensorON = false
  IsUnlockSensorON = false
}

export default BatteryStatus
