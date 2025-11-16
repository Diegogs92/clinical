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
        primary: {
          DEFAULT: '#0F5257',
          dark: '#0B3142',
        },
        secondary: {
          DEFAULT: '#9C92A3',
          light: '#C6B9CD',
          lighter: '#D6D3F0',
        },
      },
    },
  },
  plugins: [],
}
