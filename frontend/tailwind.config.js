/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        background: "#06060a",
        surface: "#0d0d14",
        card: "#13131f",
        "surface-elevated": "#1a1a2e",
        primary: "#7c3aed",
        secondary: "#06b6d4",
        accent: "#a78bfa",
        success: "#10b981",
        warning: "#f59e0b",
        danger: "#ef4444",
        "text-primary": "#f1f5f9",
        "text-muted": "#64748b",
        "border-subtle": "rgba(255,255,255,0.06)",
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(135deg, rgba(26, 26, 46, 0.6) 0%, rgba(18, 18, 26, 0.6) 100%)',
        'glow-conic': 'conic-gradient(from 180deg at 50% 50%, #7c3aed33, #06b6d433, #7c3aed33)',
      },
      animation: {
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
      },
      keyframes: {
        glowPulse: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
