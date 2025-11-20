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
        // Nueva paleta minimalista elegante
        primary: {
          DEFAULT: '#1b263b',     // Azul oscuro principal
          dark: '#0d1b2a',        // Más oscuro
          light: '#415a77',       // Más claro
          hover: '#415a77',       // Hover state
        },
        secondary: {
          DEFAULT: '#778da9',     // Azul grisáceo
          light: '#e0e1dd',       // Gris claro
          lighter: '#e0e1dd',     // Gris muy claro
        },
        accent: {
          DEFAULT: '#415a77',     // Azul medio para acentos
        },
        // Colores específicos de la paleta
        navy: {
          darkest: '#0d1b2a',
          dark: '#1b263b',
          DEFAULT: '#415a77',
          light: '#778da9',
        },
        pearl: '#e0e1dd',
        // Grises elegantes con tinte azulado
        elegant: {
          50: '#f8f9fb',
          100: '#f0f2f5',
          200: '#e4e7ed',
          300: '#d1d6de',
          400: '#a8b1c0',
          500: '#8891a3',
          600: '#6b7485',
          700: '#4f5562',
          800: '#363a44',
          900: '#1f2228',
          950: '#0f1113',
        },
      },
    },
  },
  plugins: [],
}
