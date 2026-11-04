import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#006d32',
        'primary-soft': '#e8f8ee',
        secondary: '#0059bb',
        background: '#f8f9ff',
        surface: '#ffffff',
        'surface-soft': '#eff4ff',
        ink: '#0b1c30',
        muted: '#667085',
        outline: '#d8e1ee',
        danger: '#ba1a1a',
        'danger-soft': '#ffdad6',
      },
      fontFamily: {
        body: ['Inter', 'sans-serif'],
        headline: ['Space Grotesk', 'sans-serif'],
      },
      boxShadow: {
        sidebar: '24px 0 40px rgba(11, 28, 48, 0.04)',
        button: '0 4px 14px rgba(0, 109, 50, 0.25)',
      },
    },
  },
  plugins: [],
} satisfies Config
