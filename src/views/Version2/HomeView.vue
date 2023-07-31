<template>
  <div class="bg-dark w-100 home-view-new d-flex flex-column">
    <homview-header></homview-header>
    <div class="flex-fill bg-light w-100">
      <div class="d-flex flex-column flex-fill border">
        <router-view class="flex-fill w-100" v-slot="{ Component }">
          <keep-alive>
            <component :is="Component" />
          </keep-alive>
        </router-view>
      </div>
    </div>
    <HomeviewFooter></HomeviewFooter>
  </div>
</template>

<script>
import HomviewHeader from '../../components/Version2/HomviewHeader.vue';
import HomeviewFooter from '../../components/Version2/HomeviewFooter.vue';
export default {
  components: {
    HomviewHeader, HomeviewFooter
  },
  computed: {

  },
  methods: {
    ControllerIconClick() {
      this.$router.push('./controller')
    }
  },
}
</script>

<style lang="scss" scoped>
</style>