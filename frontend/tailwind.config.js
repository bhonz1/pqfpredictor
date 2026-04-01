/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        pqf: {
          1: '#10b981',
          2: '#34d399',
          3: '#6ee7b7',
          4: '#3b82f6',
          5: '#6366f1',
          6: '#8b5cf6',
          7: '#a855f7',
        }
      },
    },
  },
  plugins: [],
}
