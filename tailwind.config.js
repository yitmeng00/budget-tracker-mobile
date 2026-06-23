/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        accent: '#2563eb',
        'accent-soft': '#eff6ff',
        bg: '#f0f4ff',
        surface: '#ffffff',
        border: '#e0e7f7',
        'text-primary': '#0f1c3f',
        'text-muted': '#6b7a9e',
        'text-subtle': '#8a96b8',
        'text-faint': '#aab4d0',
        income: '#16a34a',
        expense: '#ef4444',
      },
      borderRadius: {
        '2xl': '18px',
        '3xl': '22px',
      },
    },
  },
  plugins: [],
};
