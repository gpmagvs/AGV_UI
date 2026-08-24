<template>
  <div class="tsmc-hmi">
    <TsmcStatusBar
      @open-diag="diagVisible = true"
      @open-io="ioVisible = true" />
    <div class="tsmc-hmi__main">
      <TsmcMapViewport />
      <div class="tsmc-hmi__side">
        <TsmcTaskPanel />
        <TsmcHealthPanel />
      </div>
    </div>
    <div class="tsmc-hmi__bottom">
      <TsmcLogPanel />
      <TsmcActionPanel />
    </div>
    <TsmcSignalDiagDialog v-model="diagVisible" />
    <TsmcIOViewerDialog v-model="ioVisible" />
  </div>
</template>

<script>
import TsmcStatusBar from './components/TsmcStatusBar.vue'
import TsmcMapViewport from './components/TsmcMapViewport.vue'
import TsmcTaskPanel from './components/TsmcTaskPanel.vue'
import TsmcHealthPanel from './components/TsmcHealthPanel.vue'
import TsmcLogPanel from './components/TsmcLogPanel.vue'
import TsmcActionPanel from './components/TsmcActionPanel.vue'
import TsmcSignalDiagDialog from './components/TsmcSignalDiagDialog.vue'
import TsmcIOViewerDialog from './components/TsmcIOViewerDialog.vue'

export default {
  name: 'TsmcHmiView',
  components: {
    TsmcStatusBar,
    TsmcMapViewport,
    TsmcTaskPanel,
    TsmcHealthPanel,
    TsmcLogPanel,
    TsmcActionPanel,
    TsmcSignalDiagDialog,
    TsmcIOViewerDialog
  },
  data() {
    return {
      diagVisible: false,
      ioVisible: false
    }
  }
}
</script>

<style>
@import './styles/tsmc-hmi.css';
</style>
