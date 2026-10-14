<template>
  <div v-if="visible" class="shortcut-buttons-container">
    <StatusShortcutButton></StatusShortcutButton>
    <ManualOperationShortcutButton></ManualOperationShortcutButton>
    <IoShortcutButton></IoShortcutButton>
    <MoveControlShortcutButton></MoveControlShortcutButton>
  </div>
</template>

<script>
import MoveControlShortcutButton from '@/components/MoveControlShortcutButton.vue'
import ManualOperationShortcutButton from '@/components/ManualOperationShortcutButton.vue'
import IoShortcutButton from '@/components/IoShortcutButton.vue'
import StatusShortcutButton from '@/components/StatusShortcutButton.vue'

export default {
  name: 'ShortcutButtonsContainer',
  components: {
    MoveControlShortcutButton,
    ManualOperationShortcutButton,
    IoShortcutButton,
    StatusShortcutButton
  },
  computed: {
    visible() {
      const routeName = this.$route?.name
      const routePath = this.$route?.path || ''
      // 全頁編輯／特殊頁面不顯示快捷鈕，避免蓋住內容
      if (routeName === 'alarmTableEdit' || routePath === '/alarmTableEdit') return false
      if (routeName === 'tsmc-hmi' || routePath === '/tsmc') return false
      if (routeName === 'idle' || routePath === '/idle') return false
      return true
    }
  }
}
</script>

<style scoped lang="scss">
/* z-index 須低於 el-drawer（Element Plus 預設約 2000），避免抽屜開啟時快捷鈕遮擋內容 */
.shortcut-buttons-container {
  position: fixed;
  right: 20px;
  bottom: 56px;
  z-index: 1500;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
  pointer-events: none;

  :deep(> *) {
    pointer-events: auto;
  }
}
</style>
