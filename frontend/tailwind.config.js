/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-body)', 'Georgia', 'serif'],
        mono: ['var(--font-body)', 'Georgia', 'serif'],
      },
      colors: {
        // Dynamic accent color — controlled via CSS variables per theme
        accent: {
          50:  'rgb(var(--accent-50)  / <alpha-value>)',
          100: 'rgb(var(--accent-100) / <alpha-value>)',
          300: 'rgb(var(--accent-300) / <alpha-value>)',
          400: 'rgb(var(--accent-400) / <alpha-value>)',
          500: 'rgb(var(--accent-500) / <alpha-value>)',
          600: 'rgb(var(--accent-600) / <alpha-value>)',
          700: 'rgb(var(--accent-700) / <alpha-value>)',
        },
        // Override neutral dark values to blue-tinted darks
        neutral: {
          800: '#1a2236',   // hover states, secondary surfaces
          900: '#161b27',   // cards, modals, theads
          950: '#0f1117',   // main content bg
        },
      },
      transitionProperty: {
        'width': 'width',
      },
    },
  },
  plugins: [],
}
