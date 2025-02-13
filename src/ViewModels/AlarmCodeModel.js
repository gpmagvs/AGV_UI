class AlarmCodeModel {
    constructor(data) {
        if (data != null) {
            this.Time = new Date(data.Time);
            this.Code = data.Code;
            this.Description = data.Description;
            this.CN = data.CN;
            this.ELevel = data.ELevel;
            this.Level = data.Level;
            this.EAlarmCode = data.EAlarmCode;
            this.IsRecoverable = data.IsRecoverable;
        }
    }

    // 取得格式化的時間
    getFormattedTime() {
        return this.Time.toLocaleString();
    }

    // 取得警報資訊
    getAlarmInfo() {
        return {
            Code: this.Code,
            Description: this.Description,
            CN: this.CN,
            Level: this.Level
        };
    }

    // 判斷是否為可恢復的警報
    IsRecoverableAlarm() {
        return this.IsRecoverable;
    }
}

export default AlarmCodeModel;