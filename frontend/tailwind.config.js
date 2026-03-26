/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: '#F6F3EE',
        surface: '#FFFFFF',
        border: '#E7E2DC',
        primary: '#1F2937',
        secondary: '#6B7280',
        accent: '#111111'
      },
      borderRadius: {
        xl: '16px',
        '2xl': '20px'
      },
      fontFamily: {
        sans: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        soft: '0 20px 45px -28px rgba(17, 24, 39, 0.25)'
      }
    }
  },
  plugins: []
};
