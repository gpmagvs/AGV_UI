<template>
  <div>
    <el-input type="number" v-model="agv_angle"></el-input>
    <svg class="bg-dark" :width="diameter" :height="diameter">
      <!-- 绘制圆 -->
      <circle
        :cx="center"
        :cy="center"
        :r="radius"
        fill="transparent"
        stroke="grey"
        stroke-width="1"
      />
      <text
        v-for="deg in degrees"
        :key="deg"
        :x="diameter/2"
        :y="diameter"
        text-anchor="middle"
        :fill="primary_color"
        font-size="9"
        :transform="`rotate(${deg-agv_angle} ${center} ${center})`"
      >{{deg-180}}</text>

      <polygon
        :points="`${center},15 ${center-15},35 ${center+15},35`"
        :fill="primary_color"
        stroke="black"
        stroke-width="0"
      />

      <!-- AGV旋轉圓周顯示 -->
      <line
        v-for="deg in degrees"
        :key="deg"
        class="line2"
        :x1="diameter/2"
        :y1="center-agv_radius-10"
        :x2="diameter/2"
        :y2="center-agv_radius"
        :stroke="primary_color"
        stroke-width="1"
        :transform="`rotate(${deg-agv_angle} ${center} ${center})`"
      />
      <circle
        v-if="false"
        :cx="center"
        :cy="center"
        :r="agv_radius"
        fill="transparent"
        stroke="grey"
      />
      <rect
        :x="center-(agv_car_size.width/2)"
        :y="center-(agv_car_size.length/2)"
        :width="agv_car_size.width"
        :height="agv_car_size.length"
        fill="pink"
        stroke="pink"
      />
    </svg>
  </div>
</template>
  
  <script>
export default {
  name: 'AngleMarks',
  props: {
    diameter: {
      type: Number,
      default: 600,
    },
    agv_car_size: {
      type: Object,
      default() {
        return {
          length: 300,
          width: 150
        }
      }
    },
    agv_laser_options: {
      type: Object,
      default() {
        return {

        }
      }
    },
    status: {
      type: String,
      default: 'safe'
    }
  },
  data() {
    return {
      center: this.diameter / 2,
      radius: this.diameter / 2 - 10,
      agv_radius: Math.sqrt(Math.pow(this.agv_car_size.length / 2, 2) + Math.pow(this.agv_car_size.width / 2, 2)),
      degrees: [],
      //
      agv_angle: 90,
    };
  },
  computed: {
    primary_color() {
      return this.status == 'safe' ? 'limegreen' : (this.status == 'warning' ? 'yellow' : 'red');
    }
  },
  mounted() {
    // 生成0到360度，每隔10度的角度数组
    this.degrees = Array.from({ length: 37 }, (_, index) => index * 10);
  },
};
  </script>
<style scoped>
.line2 {
  color: green;
}
</style>