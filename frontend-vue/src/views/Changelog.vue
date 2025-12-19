<template>
  <div class="min-h-screen bg-base-100 py-20 px-6">
    <div class="max-w-3xl mx-auto">
      
      <!-- Header -->
      <div class="mb-20">
        <h1 class="text-6xl font-bold mb-6 tracking-tight">Changelog</h1>
        <p class="text-xl text-base-content/60 leading-relaxed">
          Track the evolution of Soundry
        </p>
      </div>

      <!-- Versions -->
      <div class="space-y-16">
        
        <!-- v2.1.0 -->
        <div>
          <div class="flex items-baseline gap-4 mb-6">
            <h2 class="text-3xl font-bold">v2.1.0</h2>
            <span class="text-sm text-primary">Latest</span>
            <span class="text-sm text-base-content/40">Dec 17, 2025</span>
          </div>
          
          <div class="space-y-6">
            <div>
              <h3 class="text-sm font-bold uppercase tracking-wide text-base-content/40 mb-3">Added</h3>
              <ul class="space-y-2 text-base-content/80">
                <li>Library search with real-time filtering</li>
                <li>Pagination (50 items per page)</li>
                <li>About page</li>
                <li>Changelog page</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Divider -->
        <div class="border-t border-base-content/10"></div>

        <!-- v2.0.0 -->
        <div>
          <div class="flex items-baseline gap-4 mb-6">
            <h2 class="text-3xl font-bold">v2.0.0</h2>
            <span class="text-sm text-base-content/40">Dec 16, 2025</span>
          </div>
          
          <div class="space-y-6">
            <div>
              <h3 class="text-sm font-bold uppercase tracking-wide text-base-content/40 mb-3">Added</h3>
              <ul class="space-y-2 text-base-content/80">
                <li>Session management with batch ZIP download</li>
                <li>Session-wide progress tracking</li>
                <li>24-hour auto-cleanup for downloads</li>
                <li>SoundCloud support</li>
                <li>Modern UI redesign (glassmorphism, grid/list views)</li>
                <li>Complete rebrand from Downtify to Soundry</li>
              </ul>
            </div>
            
            <div>
              <h3 class="text-sm font-bold uppercase tracking-wide text-base-content/40 mb-3">Fixed</h3>
              <ul class="space-y-2 text-base-content/80">
                <li>ZIP streaming corruption and performance</li>
                <li>SPA routing (404 on refresh)</li>
                <li>Coolify deployment compatibility</li>
              </ul>
            </div>

            <div>
              <h3 class="text-sm font-bold uppercase tracking-wide text-base-content/40 mb-3">Changed</h3>
              <ul class="space-y-2 text-base-content/80">
                <li>Multi-stage Dockerfile for self-contained builds</li>
                <li>Removed pytube dependency (yt-dlp only)</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Divider -->
        <div class="border-t border-base-content/10"></div>

        <!-- Footer -->
        <div class="text-center pt-8">
          <router-link to="/" class="btn btn-ghost">Back to Home</router-link>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
</style>
