/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cornflower-blue': '#6495ED',
        'charcoal-grey': '#36454F',
        'coral-red': '#FF4040',
      }
    },
  },
  plugins: [],
}
