/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0f",
        surface: "#12121a",
        card: "#1a1a2e",
        primary: "#7c3aed",
        secondary: "#06b6d4",
        success: "#10b981",
        warning: "#f59e0b",
        danger: "#ef4444",
        "text-primary": "#f8fafc",
        "text-muted": "#94a3b8",
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(135deg, rgba(26, 26, 46, 0.6) 0%, rgba(18, 18, 26, 0.6) 100%)',
      }
    },
  },
  plugins: [],
}
