<template>
  <div class="hero min-h-screen bg-gradient-to-b from-primary/10 via-transparent to-transparent">
    <div class="block text-center justify-center hero-content">
      <div class="mb-5 flex justify-center">
         <SoundryLogo class="w-32 h-32 text-primary" />
      </div>
      <div>
        <h1 class="mb-1 text-6xl font-black text-base-content tracking-tight">Soundry</h1>
        <p class="mb-8 text-xl text-base-content/80 font-light">
          Universal Cloud Audio Downloader
        </p>
        
        <!-- Supported Platforms -->
        <div class="flex flex-wrap justify-center gap-4 mb-10 text-base-content/60">
           <div class="flex items-center gap-2 px-3 py-1 rounded-full bg-base-200/50 border border-base-content/10">
              <Icon icon="mdi:spotify" class="w-5 h-5" />
              <span class="text-sm font-medium">Spotify</span>
           </div>
           <div class="flex items-center gap-2 px-3 py-1 rounded-full bg-base-200/50 border border-base-content/10">
              <Icon icon="mdi:soundcloud" class="w-5 h-5" />
              <span class="text-sm font-medium">SoundCloud</span>
           </div>
           <div class="flex items-center gap-2 px-3 py-1 rounded-full bg-base-200/50 border border-base-content/10">
              <Icon icon="simple-icons:youtubemusic" class="w-5 h-5" />
              <span class="text-sm font-medium">YouTube Music</span>
           </div>
           <div class="flex items-center gap-2 px-3 py-1 rounded-full bg-base-200/50 border border-base-content/10">
              <span class="text-sm font-medium">+ Many More</span>
           </div>
        </div>
      </div>

      <SearchInput />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import SearchInput from '../components/SearchInput.vue'
import SoundryLogo from '../components/SoundryLogo.vue'

import { useBinaryThemeManager } from '../model/theme'
import { ref } from 'vue'

const themeMgr = useBinaryThemeManager({
  newLightAlias: 'soundry-light',
  newDarkAlias: 'soundry-dark',
})

const version = localStorage.getItem('version') || '0.0.0'
</script>

<style scoped>
.center {
  text-align: center;
  margin-left: auto;
  margin-right: auto;
}
</style>
