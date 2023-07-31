class clsSensorStatus {
    constructor(Name = 'unknown', x = 0, y = 0, texstPosition = 'left-top') {
        this.name = Name
        this.status = 0 //0:normal,1:warning, 2:alarm
        this.active = true //是否啟用 如果是bypass=>false
        this.error_code = 0
        this.position = {
            x: x,
            y: y,
        };
        this.textPosition = texstPosition
        this.info_show_style = {
            line1: {
                x_length: 120,
                rotation: 0
            },

        }

    }
}
export default clsSensorStatus;