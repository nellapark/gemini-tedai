/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        accent: '#F97316',
        neutral: {
          50: '#F3F4F6',
          100: '#E5E7EB',
          200: '#D1D5DB',
          600: '#6B7280',
          800: '#1F2937',
          900: '#111827',
        }
      }
    },
  },
  plugins: [],
}

