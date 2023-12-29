<template>
    <div class="handshaking-notify bg-warning " v-bind:style="minimize ? miniSizeStyle : {}" v-bind:class="EQHSStatus.IsHandshaking ? 'show-notify' : 'hidden-notify'">
        <div class="w-100">
            <span class="">設備交握中</span>
            <span class="mx-1">{{ dot_animation_str }}</span>
            <div class="sub-title mx-1">{{ EQHSStatus.HandshakingInfoText }}</div>
        </div>
        <b-button @click="() => { minimize = !minimize }" variant="danger" id="close-btn" class="my-2">{{ minimize ? '還原' : '縮小' }}</b-button>
    </div>
</template>

<script>
import { AGVStatusStore } from '@/store'

export default {
    data() {
        return {
            dot_animation_str: '.',
            sub_title_text: 'sub',
            minimize: false,
            miniSizeStyle: {
                width: '330px',
                height: '120px',
                fontSize: '30px',
                position: 'absolute',
                left: 'auto',
                top: 'auto',
                right: '3px',
                bottom: '3px',

            }
        }
    },
    computed: {
        EQHSStatus() {
            return AGVStatusStore.getters.AGVStatus.HandshakeStatus
        },
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
        }
    },
    mounted() {
        this.animation();
    }
}
</script>

<style lang="scss" scoped>
.show-notify {
    visibility: visible;
    z-index: 3;
}

.hidden-notify {
    visibility: hidden;
    z-index: -1;
}

.minimize-mode {
    visibility: visible;
    width: 200px;
    bottom: 0;
    right: 3px;
}

.handshaking-notify {
    width: 98%;
    height: 160px;
    border-radius: 8px;
    // color: white;
    position: absolute;
    top: 40%;
    left: 10px;
    border: 4px solid red;
    opacity: .8;
    font-size: 50px;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    font-weight: bold;
    letter-spacing: 4px;

    .sub-title {
        font-size: smaller;
        color: #ffffff;
        letter-spacing: normal;
        background: #db5807;
    }

    #close-btn {
        position: absolute;
        top: 6px;
        right: 6px;
    }
}
</style>