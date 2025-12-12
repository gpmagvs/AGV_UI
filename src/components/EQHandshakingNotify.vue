<template>
    <transition name="el-zoom-in-center">
        <div v-show="IsExchangeBatteryTask || EQHSStatus.IsHandshaking || CurrentAlarms.length != 0"
            :class="IsAGVDown ? 'agv-down' : ' handshaking-notify bg-primary text-light'"
            v-bind:style="minimize ? miniSizeStyle : {}">
            <div class="w-100">
                <span v-bind:class="IsHandshakeFail ? 'text-danger' : ''" class="">{{ MessageTitle }}</span>
                <span v-if="!IsAGVDown" class="mx-1">{{ dot_animation_str }}</span>
                <div class="sub-title mx-1" v-if="IsAGVDown">
                    <span class="text-danger" v-bind:style="{ fontSize: minimize ? '14px' : '2.2rem' }"> {{
                        showingAlarmMsg }}</span>
                </div>
                <div class="sub-title mx-1" v-if="!IsAGVDown">
                    <span v-bind:style="{ fontSize: minimize ? '14px' : '2.2rem' }"> {{ EQHSStatus.HandshakingInfoText
                        == '' ? 'Nothing...' : EQHSStatus.HandshakingInfoText }} </span>
                </div>
            </div>
            <b-button size="sm" @click="() => { minimize = !minimize }" variant="light" id="close-btn" class="my-2">{{
                minimize ? '▲' : '-' }}</b-button>
        </div>
    </transition>
</template>
<script>
import { AGVStatusStore, DIOStore } from '@/store'

export default {
    data() {
        return {
            dot_animation_str: '.',
            sub_title_text: 'sub',
            minimize: false,
            miniSizeStyle: {
                width: '450px',
                height: '120px',
                fontSize: '28px',
                position: 'absolute',
                left: 'auto',
                top: 'auto',
                right: '3px',
                bottom: '3px',

            },
            alarmsShowInterval: null,
            showingAlarmMsg: ''
        }
    },
    computed: {
        MessageTitle() {
            if (this.IsHandshakeFail || this.IsAGVDown) {
                const alarmCnt = this.CurrentAlarms.length;
                return this.IsExchangeBatteryTask ? `電池交換作業失敗(${alarmCnt})` : `取放貨作業失敗(${alarmCnt})`;
            } else {
                return this.IsExchangeBatteryTask ? '電池交換作業中' : '取放貨作業中';
            }

        },
        EQHSStatus() {
            return AGVStatusStore.getters.AGVStatus.HandshakeStatus
        },
        IsHandshakeFail() {
            return this.EQHSStatus.HandshakingInfoText && this.EQHSStatus.HandshakingInfoText.includes('Handshake_Fail');
        },
        IsExchangeBatteryTask() {
            return DIOStore.getters.IsBatExchangeHandshaking;
        },
        IsAGVDown() {
            return AGVStatusStore.state.AGVStatus.SubState == 'DOWN';
        },
        CurrentAlarms() {
            return AGVStatusStore.state.AGVStatus.AlarmCodes;
        }

    },
    methods: {
        animation() {
            var dotNum = 0;
            setInterval(() => {
                this.dot_animation_str += '.'
                dotNum += 1;
                if (dotNum > 2) {
                    dotNum = 0;
                    this.dot_animation_str = '.'
                }
            }, 1000)
        },
        alarmShowAnimation() {
            let _index = 0;

            var getAlarmMsg = (index) => {
                const alarmObj = this.CurrentAlarms[index];
                return alarmObj ? `${alarmObj.CN}(${alarmObj.Description})` : '';
            }

            this.showingAlarmMsg = getAlarmMsg(0);

            this.alarmsShowInterval = setInterval(() => {
                this.showingAlarmMsg = getAlarmMsg(_index);
                _index += 1;
                if (_index >= this.CurrentAlarms.length) {
                    _index = 0;
                }
            }, 2000);

        }
    },
    mounted() {
        this.animation();
    },
    watch: {
        IsAGVDown: {
            handler(newVal) {
                console.log('IsAGVDown', newVal);
                if (this.alarmsShowInterval) {
                    clearInterval(this.alarmsShowInterval);
                }
                if (newVal) {
                    setTimeout(() => {
                        this.alarmShowAnimation();
                    }, 100);
                }
            },
            immediate: true,
        },
        EQHSStatus: {
            handler(newVal) {
                if (!newVal.IsHandshaking) {
                    clearInterval(this.alarmsShowInterval);
                }
            },
            immediate: true
        }
    }
}
</script>
<style lang="scss" scoped>
.minimize-mode {
    visibility: visible;
    width: 200px;
    bottom: 0;
    right: 3px;
}

.handshaking-notify,
.agv-down {
    width: 98%;
    height: 160px;
    border-radius: 8px;
    // color: white;
    position: absolute;
    top: 40%;
    left: 10px;
    border: 2px solid #3a3a3a;
    opacity: .8;
    font-size: 50px;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    font-weight: bold;
    letter-spacing: 4px;
    z-index: 4000;

    .sub-title {
        color: #ffffff;
        letter-spacing: normal;
        background: #000000;
    }

    #close-btn {
        position: absolute;
        top: 6px;
        right: 6px;
    }
}

.agv-down {
    border-radius: 0;
    border: 2px solid #ff0000e1;
    opacity: 0.9;
    animation: agv-down-animation 2s infinite !important;

    .sub-title {
        background-color: white;
    }
}


@keyframes agv-down-animation {

    0%,
    100% {
        background-color: #ff0000e1;
        color: #ffffff;

    }

    50% {
        background-color: #ffffff;
        color: #ff0000e1;
    }
}
</style>