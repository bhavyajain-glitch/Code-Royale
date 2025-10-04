/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        'clash-primary': '#1E63FF',
        'clash-secondary': '#FFD700',
        'clash-accent': '#EC484A',
        'clash-stone': '#374151',
        'clash-wood': '#4a2c2a',
        'clash-text': '#FDF9E4',
      },
      fontFamily: {
        clash: ['"Lilita One"', 'cursive'],
      },
      boxShadow: {
        'clash-panel': '0 8px 16px rgba(0,0,0,0.5), inset 0 -4px 8px rgba(0,0,0,0.3)',
        'clash-button': '0 5px 0 #1a4ab8, 0 6px 10px rgba(0,0,0,0.4)',
        'clash-button-active': '0 2px 0 #1a4ab8, 0 3px 6px rgba(0,0,0,0.4)',
      },
      backgroundImage: {
        'stone-texture': "url('/path/to/your/stone-texture.png')",
      },
      borderColor: {
        'clash-gold': '#FFD700',
      },
    },
  },
  plugins: [],
};