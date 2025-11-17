/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#7494EA',
          DEFAULT: '#08415C',
          dark: '#062d40',
        },
        secondary: {
          DEFAULT: '#388697',
          light: '#70AE6E',
          lighter: '#F4FAFF',
        },
        accent: {
          DEFAULT: '#7494EA',
        },
        background: {
          light: '#F4FAFF',
          dark: '#08415C',
        },
      },
    },
  },
  plugins: [],
}
