<template>
  <div class="z-axis-control-with-visualization p-1">
    <div class="viz-pane border rounded p-2">
      <el-tag effect="dark" class="mb-2 w-100 text-start">{{ $t('fork_side_view') }}</el-tag>
      <ForkSideViewVisualization />
    </div>
  </div>
</template>

<script>
import ForkSideViewVisualization from './ForkSideViewVisualization.vue'

export default {
  name: 'ZAxisControlWithVisualization',
  components: {
    ForkSideViewVisualization
  }
}
</script>

<style scoped lang="scss">
.z-axis-control-with-visualization {
  width: 100%;
}

.viz-pane {
  flex: 0 0 420px;
  min-width: 320px;
  background: rgba(255, 255, 255, 0.35);
}

@media (max-width: 1199.98px) {
  .viz-pane {
    flex: 1 1 auto;
    min-width: 0;
  }
}

@media (prefers-color-scheme: dark) {
  .viz-pane {
    background: rgba(0, 0, 0, 0.14);
  }
}
</style>
