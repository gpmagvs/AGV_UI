<template>
  <div class="teach-tool">
    <el-dialog width="45%" :modal="false" draggable v-model="show" :title="title_">
      <div class="d-flex border-bottom my-2 text-start">
        <div>
          <div class="height-text">{{ input_label_text }}</div>
          <input id="teach-val-input" v-model="input_sum" @change="HandleInputChanged" />
        </div>
        <!-- <div v-if="!is_modify_tagNumber">
          <div class="height-text">Tag</div>
          <div class="goal-val">{{ goal.tag }}</div>
        </div>
        <div v-if="!is_modify_tagNumber">
          <div class="height-text">Layer</div>
          <div class="goal-val">{{ goal.layer }}</div>
        </div>-->
        <div class="mx-3" v-if="!is_modify_tagNumber">
          <div class="height-text">Pose</div>
          <div class="goal-val">{{ goal.pose }}</div>
        </div>
      </div>
      <SimpleKeyboardVue KeyboardVue keyboard_type="number" @onKeyPress="KeyboardInputChanged"></SimpleKeyboardVue>
    </el-dialog>
  </div>
</template>

<script>
import SimpleKeyboardVue from '@/components/Tools/SimpleKeyboard.vue';

export default {
  components: {
    SimpleKeyboardVue,
  },
  data() {
    return {
      show: false,
      number: 0.0,
      input_sum: '',
      title_: '',
      goal: {
        tag: 0,
        layer: 0,
        pose: 0,
        value: 0
      }
    }
  },
  watch: {
    input_sum: {
      immediate: true,
      deep: true,
      handler(newValue, oldValue) {
        var num = parseFloat(newValue + '')
        if (!isNaN(num)) {
          this.number = num
          this.goal.value = num
          this.$emit('onValueChanged', this.goal)

          if (this.is_modify_tagNumber)
            this.goal.tag = num
        }
      }
    }
  },
  computed: {
    input_label_text() {
      return this.is_modify_tagNumber ? 'Tag Number' : 'HEIGHT'
    },
    is_modify_tagNumber() {
      return this.goal.pose == undefined
    },
    title_() {

      return 'Tag ' + (this.is_modify_tagNumber ? this.goal.tag : this.goal.tag + '-Layer ' + this.goal.layer);
    }
  },
  methods: {
    Show(info) {
      this.goal = info
      this.input_sum = this.goal.value + ''
      this.number = this.goal.value
      this.show = true
    },
    HandleInputChanged() {

    },
    KeyboardInputChanged(e) {
      if (e == 'back') {

        var remain_char_num = this.input_sum.length - 1;
        this.input_sum = this.input_sum.substring(0, remain_char_num)
        if (this.input_sum == '')
          this.input_sum = '0'
      } else {
        if (this.is_modify_tagNumber && e == '.')
          return;
        if (this.input_sum == '0')
          this.input_sum = ''
        this.input_sum += e;
      }

    }
  },
}
</script>

<style lang="scss" scoped>
.teach-tool {
  .height-text {
    font-weight: 500;
    font-size: 20px;
  }
  .height-text,
  #teach-val-input {
    margin: 5px;
  }
  .goal-val {
    color: grey;
  }

  .goal-val,
  #teach-val-input {
    font-size: 40px;
  }
  #teach-val-input {
    text-align: left;
    height: 56px;
    width: 200px;
    text-align: left;
    border-radius: 4px;
    background-color: aliceblue;
    border: 2px solid grey;
  }
}
</style>