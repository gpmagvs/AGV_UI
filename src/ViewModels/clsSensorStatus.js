class clsSensorStatus {
    constructor(Name = 'unknown') {
        this.name = Name
        this.status = 0 //0:normal,1:warning, 2:alarm
        this.active = true //是否啟用 如果是bypass=>false
        this.error_code = 0
    }
}
export default clsSensorStatus;