<template>
  <div class="h-full">
     <div class="flex flex-col md:flex-row justify-between items-center mb-6 p-4 bg-base-200/50 rounded-xl shadow-lg border border-base-300/50 backdrop-blur-md gap-4">
      <div class="flex items-center gap-3">
          <h2 class="text-xl font-bold tracking-tight">Library</h2>
          <span v-if="files.length" class="badge badge-neutral bg-black/20">{{ files.length }}</span>
      </div>
      
      <!-- Controls -->
      <div class="flex flex-wrap gap-3 items-center justify-end w-full md:w-auto">
          <!-- Search -->
          <div class="relative flex-grow md:flex-grow-0">
            <input 
              v-model="searchQuery"
              type="text" 
              placeholder="Search library..."
              class="input input-bordered input-sm w-full md:w-64 pl-10 bg-base-100 focus:outline-none"
            />
            <Icon icon="clarity:search-line" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
          </div>
          
          <div class="h-6 w-px bg-base-content/10 hidden sm:block"></div>

          <!-- Refresh -->
          <button
             class="btn btn-ghost btn-circle btn-sm"
             @click="refresh"
             :disabled="loading"
             title="Refresh"
           >
             <span v-if="loading" class="loading loading-spinner loading-xs"></span>
             <Icon v-else icon="clarity:refresh-line" class="w-5 h-5" />
          </button>
          
          <div class="h-6 w-px bg-base-content/10 hidden sm:block"></div>

         <!-- Sort -->
         <select v-model="sortOption" class="select select-bordered select-sm bg-base-100 focus:outline-none w-36">
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="name-asc">Name (A-Z)</option>
         </select>
         
         <div class="h-6 w-px bg-base-content/10 hidden sm:block"></div>

         <!-- View Toggle -->
         <div class="join">
            <button 
                class="btn btn-sm join-item" 
                :class="viewMode === 'list' ? 'btn-active btn-primary' : 'btn-ghost'"
                @click="viewMode = 'list'"
                title="List View"
            >
                <Icon icon="clarity:list-line" class="w-4 h-4" />
            </button>
            <button 
                class="btn btn-sm join-item" 
                :class="viewMode === 'grid' ? 'btn-active btn-primary' : 'btn-ghost'"
                @click="viewMode = 'grid'"
                title="Grid View"
            >
                <Icon icon="clarity:grid-view-line" class="w-4 h-4" />
            </button>
         </div>
      </div>
    </div>

    <div v-if="error" class="alert alert-error mb-4 shadow-lg">
        <Icon icon="clarity:error-line" />
        <span>{{ error }}</span>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && displayFiles.length === 0" class="flex flex-col items-center justify-center p-20 text-center space-y-6 opacity-60">
      <div class="w-24 h-24 bg-base-200/50 rounded-full flex items-center justify-center mb-2">
          <Icon icon="clarity:folder-open-line" class="w-10 h-10 text-base-content/30" />
      </div>
      <div>
          <h2 class="text-xl font-bold opacity-80">No files found</h2>
          <p class="text-base-content/50 mt-2 max-w-xs mx-auto">
            Files you download will appear here.
          </p>
      </div>
    </div>

    <!-- Grid View -->
    <div v-else-if="viewMode === 'grid'" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      <div 
         v-for="file in displayFiles" 
         :key="file.name"
         class="group relative aspect-square rounded-xl overflow-hidden bg-base-200 shadow-md transition-all hover:shadow-xl hover:scale-[1.02] border border-base-content/5"
      >
          <!-- Expiry Badge -->
          <div class="absolute top-2 right-2 z-20 badge badge-xs font-mono shadow-md border-none opacity-90" :class="getExpiryColor(file.timestamp)">
            {{ getExpiresIn(file.timestamp) }}
          </div>

          <div class="absolute inset-0 flex flex-col items-center justify-center p-0">
              <img 
                v-if="file.image" 
                :src="`/downloads/${file.image}`" 
                class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
                alt="Cover"
              />
              <div v-else class="flex items-center justify-center w-full h-full bg-base-300">
                  <Icon icon="clarity:music-note-line" class="w-16 h-16 text-primary opacity-20 group-hover:opacity-10 transition-opacity" />
              </div>
              
              <div class="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                 <h3 class="font-bold text-sm line-clamp-2 leading-tight break-words text-white shadow-sm">{{ file.name }}</h3>
                 <p class="text-[10px] text-white/60 mt-1">{{ formatSub(file.size, file.timestamp) }}</p>
              </div>
          </div>
         
         <!-- Hover Overlay -->
         <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 gap-3">
            <a
              class="btn btn-circle btn-success text-white border-none shadow-lg shadow-success/20 scale-90 hover:scale-100 transition-transform"
              :href="`/downloads/${encodeURIComponent(file.name)}`"
              download
              title="Download"
            >
               <Icon icon="clarity:download-line" class="w-6 h-6" />
            </a>
            <button
              class="btn btn-circle btn-error text-white border-none shadow-lg shadow-error/20 scale-90 hover:scale-100 transition-transform"
              @click="onDelete(file.name)"
              :disabled="deleting[file.name] === true"
              title="Delete"
            >
               <span v-if="deleting[file.name] === true" class="loading loading-spinner loading-xs"></span>
               <Icon v-else icon="clarity:trash-line" class="w-6 h-6" />
            </button>
         </div>
      </div>
    </div>

    <!-- List View -->
    <div v-else class="card bg-base-100/50 shadow-xl border border-base-200 backdrop-blur-sm">
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr class="bg-base-200/50 text-base-content/60">
              <th>Name</th>
              <th>Size</th>
              <th>Date</th>
              <th>Expires</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="file in displayFiles" :key="file.name" class="hover:bg-base-200/50 transition-colors">
              <td class="font-medium max-w-xs md:max-w-md truncate" :title="file.name">
                  <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                          <Icon icon="clarity:music-note-line" />
                      </div>
                      {{ file.name }}
                  </div>
              </td>
              <td class="text-sm opacity-60 whitespace-nowrap">{{ formatBytes(file.size) }}</td>
              <td class="text-sm opacity-60 whitespace-nowrap">{{ formatDate(file.timestamp) }}</td>
              <td class="text-sm whitespace-nowrap">
                  <div class="badge badge-sm border-none gap-1" :class="getExpiryColor(file.timestamp)">
                     {{ getExpiresIn(file.timestamp) }}
                  </div>
              </td>
              <td class="text-right">
                  <div class="flex items-center justify-end gap-2">
                      <a
                        class="btn btn-square btn-sm btn-ghost hover:bg-success/10 hover:text-success"
                        :href="`/downloads/${encodeURIComponent(file.name)}`"
                        download
                        title="Download"
                        >
                          <Icon icon="clarity:download-line" class="w-5 h-5" />
                      </a
                      >
                      <button
                        class="btn btn-square btn-sm btn-ghost hover:bg-error/10 hover:text-error"
                        @click="onDelete(file.name)"
                        :disabled="deleting[file.name] === true"
                        title="Delete"
                      >
                        <span
                          v-if="deleting[file.name] === true"
                          class="loading loading-spinner loading-xs"
                        ></span>
                        <Icon v-else icon="clarity:trash-line" class="w-5 h-5" />
                      </button>
                  </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="!loading && totalPages > 1" class="flex justify-center items-center gap-2 mt-6">
      <button 
        class="btn btn-sm"
        :disabled="currentPage === 1"
        @click="currentPage = 1"
        title="First page"
      >
        <Icon icon="clarity:rewind-line" class="w-4 h-4" />
      </button>
      <button 
        class="btn btn-sm"
        :disabled="currentPage === 1"
        @click="currentPage--"
        title="Previous page"
      >
        <Icon icon="clarity:angle-line" class="w-4 h-4 rotate-180" />
      </button>
      
      <div class="flex items-center gap-2">
        <span class="text-sm opacity-60">Page</span>
        <span class="badge badge-neutral">{{ currentPage }}</span>
        <span class="text-sm opacity-60">of {{ totalPages }}</span>
      </div>
      
      <button 
        class="btn btn-sm"
        :disabled="currentPage === totalPages"
        @click="currentPage++"
        title="Next page"
      >
        <Icon icon="clarity:angle-line" class="w-4 h-4" />
      </button>
      <button 
        class="btn btn-sm"
        :disabled="currentPage === totalPages"
        @click="currentPage = totalPages"
        title="Last page"
      >
        <Icon icon="clarity:fast-forward-line" class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import API from '/src/model/api'
import { Icon } from '@iconify/vue'

const files = ref([])
const loading = ref(false)
const error = ref('')
const deleting = ref({})

const viewMode = ref('list') // 'list' | 'grid'
const sortOption = ref('date-desc') // 'date-desc' | 'date-asc' | 'name-asc'
const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = 50

// Formatters
const formatBytes = (bytes, decimals = 2) => {
    if (!+bytes) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}
const formatDate = (ms) => new Date(ms).toLocaleDateString()
const formatSub = (size, ms) => `${formatBytes(size)} • ${formatDate(ms)}`

const getExpiresIn = (timestamp) => {
    const expiresAt = timestamp + (24 * 60 * 60 * 1000)
    const diff = expiresAt - Date.now()
    
    if (diff <= 0) return 'Expired'
    
    const hours = Math.ceil(diff / (1000 * 60 * 60))
    if (hours > 1) return `${hours}h left`
    
    const minutes = Math.ceil(diff / (1000 * 60))
    return `${minutes}m left`
}

const getExpiryColor = (timestamp) => {
    const expiresAt = timestamp + (24 * 60 * 60 * 1000)
    const diff = expiresAt - Date.now()
    const hours = diff / (1000 * 60 * 60)
    
    if (diff <= 0) return 'badge-error'
    if (hours < 1) return 'badge-error'
    if (hours < 6) return 'badge-warning'
    return 'badge-success'
}

const filteredFiles = computed(() => {
    let list = [...files.value]
    
    // Apply search filter
    if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase()
        list = list.filter(f => f.name.toLowerCase().includes(query))
    }
    
    // Apply sorting
    if (sortOption.value === 'date-desc') {
        list.sort((a, b) => b.timestamp - a.timestamp)
    } else if (sortOption.value === 'date-asc') {
        list.sort((a, b) => a.timestamp - b.timestamp)
    } else if (sortOption.value === 'name-asc') {
        list.sort((a, b) => a.name.localeCompare(b.name))
    }
    
    return list
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredFiles.value.length / itemsPerPage)))

const displayFiles = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage
    const end = start + itemsPerPage
    return filteredFiles.value.slice(start, end)
})

// Reset to page 1 when search or sort changes
watch(searchQuery, () => { currentPage.value = 1 })
watch(sortOption, () => { currentPage.value = 1 })

async function refresh() {
  loading.value = true
  error.value = ''
  try {
    const res = await API.listDownloads()
    // Handle both old (string array) and new (object array) API just in case
    files.value = (res.data || []).map(f => {
        if (typeof f === 'string') return { name: f, timestamp: 0, size: 0 }
        return f
    })
  } catch (e) {
    error.value = 'Failed to load downloads'
  } finally {
    loading.value = false
  }
}

async function onDelete(file) {
  if (!confirm(`Are you sure you want to delete "${file}"?`)) return
  
  deleting.value = { ...deleting.value, [file]: true }
  try {
    await API.deleteDownload(file)
    files.value = files.value.filter((f) => f.name !== file)
  } catch (e) {
    alert('Failed to delete ' + file)
  } finally {
    deleting.value = { ...deleting.value, [file]: false }
  }
}

onMounted(() => {
  refresh()
})
</script>

<style scoped></style>
