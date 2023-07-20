class BatteryStatus {
  BatteryLevel = 3
  IsCharging = false
  ChargeCurrent = 0.0
  IsError = true
  CircuitOpened = false
  BatteryID = 0
  SensorInfo = new BatteryPositionInfoVM()
  constructor(level) {
    this.BatteryLevel = level
  }
}

class BatteryPositionInfoVM {
  IsExistSensor1ON = false
  IsExistSensor2ON = false
  IsDockingSensor1ON = false
  IsDockingSensor2ON = false
  IsLockSensorON = false
  IsUnlockSensorON = false
}

export default BatteryStatus
