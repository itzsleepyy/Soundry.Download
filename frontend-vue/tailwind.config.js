module.exports = {
  mode: 'jit',
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  daisyui: {
    themes: [
      'light',
      'dark',
      'forest',
      {
        'soundry-dark': {
          primary: '#ff5500', // Soundry Orange
          'primary-content': '#ffffff',
          secondary: '#111111', // Deep Black
          accent: '#ffffff',
          neutral: '#1f1f1f', // Surface
          'base-100': '#000000', // Background
          'base-200': '#111111', // Cards
          'base-300': '#1f1f1f', // Borders/Elevated
          info: '#3ABFF8',
          success: '#1AD05C',
          warning: '#FBBD23',
          error: '#F87272',
          '--rounded-btn': '0.5rem',
        },
      },
      {
        'soundry-light': {
          primary: '#ff5500', // Soundry Orange
          'primary-content': '#ffffff',
          secondary: '#f5f5f5',
          accent: '#111111',
          neutral: '#e5e5e5',
          'base-100': '#ffffff',
          'base-200': '#f5f5f5',
          'base-300': '#e5e5e5',
          info: '#3ABFF8',
          success: '#1AD05C',
          warning: '#FBBD23',
          error: '#F87272',
          '--rounded-btn': '0.5rem',
        },
      },
    ],
  },
  plugins: [require('daisyui')],
}
