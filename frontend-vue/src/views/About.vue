<template>
  <div class="min-h-screen bg-base-100 py-20 px-6">
    <div class="max-w-3xl mx-auto">
      
      <!-- Header -->
      <div class="mb-20">
        <h1 class="text-6xl font-bold mb-6 tracking-tight">About</h1>
        <p class="text-xl text-base-content/60 leading-relaxed">
          Soundry empowers the next generation of DJs with accessible, high-quality music.
        </p>
      </div>

      <!-- Content -->
      <div class="prose prose-lg max-w-none">
        
        <h2 class="text-3xl font-bold mt-16 mb-6">Our Mission</h2>
        <p class="text-base-content/80 leading-relaxed mb-6">
          Soundry provides high-quality music for free, breaking down the barriers that prevent aspiring DJs from entering the scene. With many newcomers entering the DJ world, services like Beatport can be prohibitively expensive.
        </p>
        <p class="text-base-content/80 leading-relaxed">
          We understand this affects artists, but our goal is to encourage creativity and lower the entry barrier for passionate individuals who want to share music with the world.
        </p>

        <h2 class="text-3xl font-bold mt-16 mb-6">Why We Built This</h2>
        <p class="text-base-content/80 leading-relaxed mb-6">
          I personally struggled to access music when starting my DJing journey. The costs added up quickly, making it difficult to experiment and grow.
        </p>
        <p class="text-base-content/80 leading-relaxed mb-6">
          Soundry was born from improving Downtify, transforming it into a modern, self-hosted application that anyone can run. I hope this tool helps others discover their passion and bring more creativity to the scene.
        </p>
        <p class="text-base-content/60 italic">
          — Sleepy
        </p>

        <h2 class="text-3xl font-bold mt-16 mb-6">What Makes It Special</h2>
        <ul class="space-y-3 text-base-content/80">
          <li>Free & open source (MIT)</li>
          <li>High quality audio (FLAC, MP3)</li>
          <li>Multi-platform (Spotify, SoundCloud)</li>
          <li>Self-hosted & private</li>
        </ul>

        <div class="bg-warning/5 border-l-4 border-warning px-6 py-4 mt-16 mb-8">
          <p class="text-sm text-base-content/70 leading-relaxed">
            <strong>Note:</strong> Soundry is intended for personal, educational, and archival use. Please support artists by purchasing music when possible and respect copyright laws in your jurisdiction.
          </p>
        </div>

        <div class="flex gap-4 mt-12">
          <router-link to="/" class="btn btn-primary">Start Downloading</router-link>
          <a href="https://github.com/itzsleepyy/Soundry" target="_blank" class="btn btn-ghost">GitHub</a>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
</style>
