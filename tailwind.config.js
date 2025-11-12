/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        eco: {
          dark: '#0b3b25',
          forest: '#166534',
          lime: '#6ee786',
          sky: '#9ad7ff',
          sand: '#f4f1de',
          danger: '#f87171',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        panel: '0 15px 40px rgba(6, 24, 44, 0.3)',
      },
    },
  },
  plugins: [],
}
