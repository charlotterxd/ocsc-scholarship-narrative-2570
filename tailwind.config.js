/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: 'rgb(var(--rgb-ink) / <alpha-value>)',
        muted: 'rgb(var(--rgb-muted) / <alpha-value>)',
        hairline: 'rgb(var(--rgb-hairline) / <alpha-value>)',
        canvas: 'rgb(var(--rgb-canvas) / <alpha-value>)',
        surface: 'rgb(var(--rgb-surface) / <alpha-value>)',
        primary: 'rgb(var(--rgb-primary) / <alpha-value>)',
        secondary: 'rgb(var(--rgb-secondary) / <alpha-value>)',
        amber: 'rgb(var(--rgb-amber) / <alpha-value>)',
      },
      fontFamily: {
        thai: ['"Noto Sans Thai"', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        content: '1200px',
      },
    },
  },
  plugins: [],
}
