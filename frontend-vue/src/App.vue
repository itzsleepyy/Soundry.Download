<template>
  <!-- :data-theme="theme ? 'forest' : 'emerald'" -->
  <div class="min-h-screen bg-gradient-to-br from-base-100 via-neutral/50 to-base-300 relative w-full overflow-x-hidden">
    <router-view></router-view>
    <Footer />
    <Settings />
  </div>
</template>

<script setup>
import { onBeforeMount } from 'vue'
import Footer from './components/Footer.vue'
import Settings from './components/Settings.vue'
import { useBinaryThemeManager } from './model/theme'

const themeMgr = useBinaryThemeManager()
onBeforeMount(() => {
  themeMgr.setLightAlias('soundry-light')
  themeMgr.setDarkAlias('soundry-dark')
})
</script>

<style></style>
