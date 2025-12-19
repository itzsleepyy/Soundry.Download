<template>
  <footer class="footer p-10 bg-neutral/80 backdrop-blur-md text-neutral-content border-t border-white/5 z-10">
    <aside>
      <div class="flex items-center gap-2 mb-2">
        <SoundryLogo class="w-10 h-10 text-primary" />
        <span class="text-2xl font-bold tracking-tighter text-white">Soundry</span>
      </div>
      <p class="opacity-70 max-w-xs">
        Premium open-source music downloader.<br />
        Built for audiophiles and collectors.
      </p>
      <div class="flex gap-4 mt-4">
         <a href="https://github.com/LOL/soundry" target="_blank" class="btn btn-ghost btn-circle btn-sm">
             <Icon icon="mdi:github" class="w-5 h-5" />
         </a>
      </div>
    </aside> 
    <nav>
      <header class="footer-title opacity-60">Application</header> 
      <router-link to="/" class="link link-hover">Home</router-link>
      <router-link to="/downloads" class="link link-hover">Downloads</router-link>
    </nav> 
    <nav>
      <header class="footer-title opacity-60">Project</header> 
      <a href="https://github.com/LOL/soundry" target="_blank" class="link link-hover">GitHub</a> 
      <router-link to="/about" class="link link-hover">About</router-link> 
      <router-link to="/changelog" class="link link-hover">Changelog</router-link>
    </nav> 
    <nav>
      <header class="footer-title opacity-60">Legal</header> 
      <router-link to="/privacy" class="link link-hover">Privacy Policy</router-link> 
      <router-link to="/terms" class="link link-hover">Terms of Service</router-link>
      <router-link to="/disclaimer" class="link link-hover">Disclaimer</router-link>
    </nav>
  </footer>
  <footer class="footer px-10 py-4 border-t border-white/5 bg-neutral/90 text-neutral-content border-base-300">
    <aside class="items-center grid-flow-col">
       <p class="opacity-50 text-sm">© {{ new Date().getFullYear() }} Soundry. MIT License.</p>
    </aside>
    <nav class="md:place-self-center justify-self-end">
       <div class="flex items-center gap-2 text-xs opacity-40 hover:opacity-100 transition-opacity">
          <span>Powered by</span>
          <span class="font-bold">yt-dlp</span>
          <span>&</span>
          <span class="font-bold">SpotDL</span>
       </div>
    </nav>
  </footer>
</template>

<script setup>
import SoundryLogo from './SoundryLogo.vue'
import { Icon } from '@iconify/vue'
</script>

<style scoped>
/* Ensure footer stays at bottom if content is short, but layout usually handles this */
</style>
