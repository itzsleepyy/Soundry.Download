<template>
  <!-- Put this part before </body> tag -->
  <input type="checkbox" id="my-modal" class="modal-toggle" />
  <div class="modal backdrop-blur-sm bg-black/40">
    <div class="modal-box relative bg-base-100 shadow-2xl border border-base-200 rounded-2xl max-w-md p-6">
      <label for="my-modal" class="btn btn-sm btn-circle btn-ghost absolute right-4 top-4 text-base-content/50 hover:text-base-content"
        >✕</label
      >
      <div class="text-center mb-6">
         <h3 class="font-bold text-2xl tracking-tight">Settings</h3>
         <p class="text-base-content/60 text-sm mt-1">Configure your download preferences</p>
      </div>

      <div class="flex flex-col space-y-5">
        <!-- audio_provider -->
        <div class="form-control w-full">
          <label class="label px-0">
            <span class="label-text font-medium text-base-content/80">Audio Provider</span>
          </label>
          <select
            class="select select-bordered w-full bg-base-200 focus:bg-base-100 focus:border-primary transition-all"
            v-model="sm.settings.value.audio_providers[0]"
          >
            <option
              v-for="(provider, index) in sm.settingsOptions.audio_providers"
              :key="index"
              :selected="provider === sm.settings.value.audio_providers?.[0]"
            >
              {{ provider }}
            </option>
          </select>
        </div>
        <!-- lyrics_provider -->
        <div class="form-control w-full">
          <label class="label px-0">
            <span class="label-text font-medium text-base-content/80">Lyrics Provider</span>
          </label>
          <select
            class="select select-bordered w-full bg-base-200 focus:bg-base-100 focus:border-primary transition-all"
            v-model="sm.settings.value.lyrics_providers[0]"
          >
            <option
              v-for="(provider, index) in sm.settingsOptions.lyrics_providers"
              :key="index"
              :selected="provider === sm.settings.value.lyrics_providers?.[0]"
            >
              {{ provider }}
            </option>
          </select>
        </div>
        <!-- format -->
        <div class="form-control w-full">
          <label class="label px-0">
             <span class="label-text font-medium text-base-content/80">Default Output Format</span>
          </label>
          <select class="select select-bordered w-full bg-base-200 focus:bg-base-100 focus:border-primary transition-all" v-model="sm.settings.value.format">
            <option
              v-for="(format, index) in sm.settingsOptions.format"
              :key="index"
              :selected="format === sm.settings.value.format"
            >
              {{ format }}
            </option>
          </select>
        </div>
      </div>
      
      <!-- Actions -->
      <div class="mt-8 flex items-center justify-end gap-3">
         <!-- Status Indicators -->
         <span v-if="sm.isSaved.value === true" class="text-xs font-bold text-success flex items-center gap-1 animate-pulse">
            <Icon icon="clarity:check-circle-line" /> Saved
         </span>
         <span v-if="sm.isSaved.value === false" class="text-xs font-bold text-error flex items-center gap-1">
            <Icon icon="clarity:error-line" /> Error
         </span>
         
         <label for="my-modal" class="btn btn-ghost">Cancel</label>
         <button class="btn btn-primary px-8" @click="sm.saveSettings()">Save Changes</button>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useSettingsManager } from '../model/settings'

const sm = useSettingsManager()
</script>

<style scoped></style>
