import { ref, computed } from 'vue'

import API from '/src/model/api'

const settings = ref({
  audio_providers: ['youtube-music', 'youtube'],
  lyrics_providers: ['genius'],
  format: 'mp3',
  output: '/downloads/{artists} - {title}.{output-ext}',
})

const settingsOptions = {
  audio_providers: ['youtube', 'youtube-music'],
  lyrics_providers: ['genius', 'musixmatch', 'azlyrics'],
  format: ['mp3', 'flac', 'ogg', 'opus', 'm4a'],
  output: '/downloads/{artists} - {title}.{output-ext}',
}

API.getSettings().then((res) => {
  if (res.status === 200) {
    console.log('Received settings:', res.data)
    // Merge settings, keeping defaults if backend sends empty strings
    // Ensure output always has /downloads/ prefix
    let output = res.data.output || '/downloads/{artists} - {title}.{output-ext}'
    if (!output.startsWith('/downloads')) {
      output = '/downloads/' + output
    }
    settings.value = {
      ...settings.value,
      ...res.data,
      format: res.data.format || 'mp3',
      output: output,
      audio_providers: res.data.audio_providers?.length ? res.data.audio_providers : ['youtube-music', 'youtube'],
      lyrics_providers: res.data.lyrics_providers?.length ? res.data.lyrics_providers : ['genius']
    }
  } else {
    console.log('Error loading settings')
  }
})

export function useSettingsManager() {
  const isSaved = ref()
  function saveSettings() {
    console.log('Saving settings:', settings.value)
    API.setSettings(settings.value).then((res) => {
      if (res.status === 200) {
        console.log('Saved!')
        isSaved.value = true
        setTimeout(() => {
          isSaved.value = null
        }, 2000)
      } else {
        console.error('Error saving settings.', res)
        isSaved.value = false
        setTimeout(() => {
          isSaved.value = null
        }, 2000)
      }
    })
  }
  return { saveSettings, settings, settingsOptions, isSaved }
}
