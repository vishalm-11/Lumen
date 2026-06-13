export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bebas Neue"', 'cursive'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        lumen: {
          bg: '#030712',
          panel: '#0a0f1a',
          accent: '#F59E0B',
          danger: '#EF4444',
          text: '#F9FAFB',
          muted: '#6B7280',
          border: 'rgba(255,255,255,0.08)',
        }
      }
    }
  },
  plugins: []
}
