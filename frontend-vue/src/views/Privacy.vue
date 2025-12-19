<template>
  <div class="min-h-screen bg-base-100 py-20 px-6">
    <div class="max-w-3xl mx-auto">
      
      <div class="mb-20">
        <h1 class="text-6xl font-bold mb-6 tracking-tight">Privacy Policy</h1>
        <p class="text-sm text-base-content/40">Last updated: December 17, 2025</p>
      </div>

      <div class="prose prose-lg max-w-none">
        
        <h2 class="text-3xl font-bold mt-16 mb-6">Overview</h2>
        <p class="text-base-content/80 leading-relaxed">
          Soundry is a self-hosted application. When you run Soundry on your own server, you have complete control over your data. We (the developers) do not collect, store, or have access to any of your personal information or usage data.
        </p>

        <h2 class="text-3xl font-bold mt-16 mb-6">Data Collection</h2>
        <p class="text-base-content/80 leading-relaxed mb-4">
          Soundry does not collect any personal data. All downloads, searches, and user preferences are stored locally on your server.
        </p>
        <ul class="space-y-2 text-base-content/80">
          <li>No tracking or analytics</li>
          <li>No user accounts or authentication required</li>
          <li>No data is sent to external servers (except to download music from third-party platforms)</li>
        </ul>

        <h2 class="text-3xl font-bold mt-16 mb-6">Third-Party Services</h2>
        <p class="text-base-content/80 leading-relaxed">
          Soundry connects to third-party services (Spotify, SoundCloud, YouTube) to download music. These services may have their own privacy policies and terms of service. Please review their policies for information on how they handle data.
        </p>

        <h2 class="text-3xl font-bold mt-16 mb-6">Your Responsibility</h2>
        <p class="text-base-content/80 leading-relaxed">
          As a self-hosted application, you are responsible for managing your own server security, backups, and data retention policies.
        </p>

        <div class="mt-12">
          <router-link to="/" class="btn btn-ghost">Back to Home</router-link>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
</script>
