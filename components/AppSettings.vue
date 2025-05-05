<script setup lang="ts">
const isDesktop = useMediaQuery('(min-width: 768px)')

// Always keep the settings closed
const isOpen = ref(false)

const { sidebar } = useAppSettings()

const direction = useTextDirection()
// Set direction to LTR by default
direction.value = 'ltr'
sidebar.value.side = 'left'

function handleChangeDirection(dir: 'ltr' | 'rtl') {
  // This function is kept for API compatibility but does nothing
  // as we want to fix the direction to LTR
  return
}
</script>

<template>
  <!-- Settings button and sheet are removed to disable customizer -->
</template>

<style scoped>

</style>
