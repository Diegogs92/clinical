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
        // Paleta minimalista simplificada
        primary: {
          DEFAULT: '#0F5257',     // Azul oscuro principal
          dark: '#0B3142',        // Hover/dark state
          light: '#388697',       // Light variant
          hover: '#0B3142',       // Hover state (alias de dark)
        },
        secondary: {
          DEFAULT: '#9C92A3',
          light: '#C6B9CD',
          lighter: '#D6D3F0',
        },
        accent: {
          DEFAULT: '#388697',     // Turquesa para acentos
        },
        // Los grays de Tailwind se usan para neutrales
      },
    },
  },
  plugins: [],
}
