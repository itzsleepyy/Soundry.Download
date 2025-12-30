/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                background: '#09090b', // zinc-950
                surface: '#18181b', // zinc-900
                primary: '#3b82f6', // blue-500
                'primary-hover': '#2563eb', // blue-600
                text: '#f4f4f5', // zinc-100
                'text-muted': '#a1a1aa', // zinc-400
                border: '#27272a', // zinc-800
            },
            fontFamily: {
                sans: ['var(--font-inter)', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
