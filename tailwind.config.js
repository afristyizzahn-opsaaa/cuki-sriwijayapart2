/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: '#D4AF37',
        'gold-light': '#F3E5AB',
        'brown-dark': '#2B1B17',
        'brown-wood': '#4A2E1B',
        crimson: '#800020',
        navy: '#0A192F',
        amber: '#FFBF00',
        'bg-dark': '#2B1B17',
        'primary-gold': '#D4AF37',
        'primary-amber': '#FFBF00',
        'bg-dark-slate': '#0A192F',
        'bg-mahogany': '#4A2E1B',
        'surface-parchment': '#F3E5AB',
        'accent-red': '#800020',
        'text-dark': '#2B1E16',
        'text-light': '#F3E5AB',
        'text-muted': '#A09383',
        'state-success': '#2E7D32',
        'state-error': '#C62828',
        'state-info': '#0288D1',
      },
      borderRadius: {
        card: '20px',
        button: '16px',
        popup: '24px',
      },
      boxShadow: {
        'elevation-1': '0px 2px 8px rgba(0, 0, 0, 0.15)',
        'elevation-2': '0px 4px 16px rgba(0, 0, 0, 0.25)',
        'elevation-3': '0px 8px 32px rgba(0, 0, 0, 0.40)',
        'elevation-4': '0px 12px 48px rgba(0, 0, 0, 0.60)',
      },
      maxWidth: {
        content: '1280px',
      },
      fontFamily: {
        display: ['Cinzel', 'Cormorant Garamond', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
