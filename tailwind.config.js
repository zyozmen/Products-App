/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  prefix: 'hu-',
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        supplier: {
          ink: '#172b4d',
          muted: '#64748b',
          line: '#e2e8f0',
          canvas: '#f5f7fb',
          brand: '#2563eb',
          success: '#15803d',
          warning: '#c2410c',
        },
      },
      boxShadow: {
        panel: '0 12px 32px rgba(15, 23, 42, 0.07)',
      },
    },
  },
  plugins: [],
};
