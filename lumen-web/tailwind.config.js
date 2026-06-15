export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bebas Neue"', 'cursive'],
        body: ['"DM Sans"', 'sans-serif'],
        label: ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        lumen: {
          bg: '#0a0f1e',
          panel: 'rgba(20, 10, 5, 0.85)',
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
