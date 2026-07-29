/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{html,ts,js,jsx,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Compact type scale
        '2xs': ['0.6875rem', { lineHeight: '0.875rem' }],
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.8125rem', { lineHeight: '1.125rem' }],
        base: ['0.875rem', { lineHeight: '1.25rem' }],
      },
      colors: {
        surface: {
          DEFAULT: '#ffffff',
          muted: '#f6f7f9',
          sunken: '#eceef1',
        },
        ink: {
          DEFAULT: '#1a1d21',
          soft: '#4a5058',
          faint: '#8a9099',
        },
        line: {
          DEFAULT: '#e3e6ea',
          strong: '#cfd4da',
        },
        brand: {
          DEFAULT: '#2563eb',
          soft: '#eff4ff',
          strong: '#1d4ed8',
        },
        positive: '#16a34a',
        negative: '#dc2626',
        caution: '#d97706',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)',
        pop: '0 4px 12px rgba(16,24,40,0.10), 0 2px 4px rgba(16,24,40,0.06)',
      },
      borderRadius: {
        md: '0.375rem',
      },
    },
  },
  plugins: [],
};
