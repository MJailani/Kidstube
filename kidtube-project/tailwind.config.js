/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'yt-red': '#ff0000',
        'yt-bg': '#0f0f0f',
        'yt-surface': '#212121',
        'yt-border': '#3f3f3f',
        'yt-text': '#f1f1f1',
        'yt-muted': '#aaaaaa',
      },
    },
  },
  plugins: [],
}
