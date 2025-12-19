<template>
  <div class="min-h-screen">
    <Navbar />
    <div class="container mx-auto p-4 max-w-7xl">
       <!-- Tab Headers -->
       <div class="flex items-center space-x-2 mb-4 ml-1">
          <a 
            class="tab tab-lg tab-bordered transition-all"
            :class="activeTab === 'queue' ? 'tab-active border-primary text-primary font-bold' : 'text-base-content/60 hover:text-base-content/80'"
            @click="activeTab = 'queue'"
          >
             Session
             <div v-if="queueCount > 0" class="badge badge-sm badge-ghost ml-2 bg-base-300">{{ queueCount }}</div>
          </a>
          <a 
            class="tab tab-lg tab-bordered transition-all"
            :class="activeTab === 'library' ? 'tab-active border-primary text-primary font-bold' : 'text-base-content/60 hover:text-base-content/80'"
            @click="activeTab = 'library'"
          >
             Library
          </a>
       </div>

       <!-- Content -->
       <div class="transition-opacity duration-300">
           <KeepAlive>
              <QueueTab v-if="activeTab === 'queue'" />
              <LibraryTab v-else />
           </KeepAlive>
       </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import Navbar from '/src/components/Navbar.vue'
import QueueTab from '/src/components/QueueTab.vue'
import LibraryTab from '/src/components/LibraryTab.vue'
import { useProgressTracker } from '/src/model/download'

const pt = useProgressTracker()
const activeTab = ref('queue')

const queueCount = computed(() => {
    return pt.downloadQueue.value.filter(item => pt.isSessionSong(item.song)).length
})
</script>

<style scoped>
.tab-bordered {
    border-bottom-width: 3px;
}
</style>
