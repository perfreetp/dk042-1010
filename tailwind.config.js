/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        arena: {
          dark: '#0a0a1a',
          darker: '#05050f',
          purple: '#6b21a8',
          purpleLight: '#a855f7',
          cyan: '#06b6d4',
          cyanLight: '#22d3ee',
          orange: '#f97316',
          orangeLight: '#fb923c',
          red: '#ef4444',
          green: '#22c55e',
          yellow: '#eab308',
          gold: '#fbbf24',
        }
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        zcool: ['"ZCOOL KuaiLe"', 'sans-serif'],
      },
      animation: {
        'pulse-neon': 'pulseNeon 2s ease-in-out infinite',
        'glow-cyan': 'glowCyan 1.5s ease-in-out infinite alternate',
        'glow-orange': 'glowOrange 1.5s ease-in-out infinite alternate',
        'glow-purple': 'glowPurple 1.5s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite',
        'shake': 'shake 0.5s ease-in-out',
        'scan-line': 'scanLine 4s linear infinite',
      },
      keyframes: {
        pulseNeon: {
          '0%, 100%': { opacity: '1', filter: 'brightness(1)' },
          '50%': { opacity: '0.8', filter: 'brightness(1.3)' },
        },
        glowCyan: {
          '0%': { boxShadow: '0 0 5px #06b6d4, 0 0 10px #06b6d4' },
          '100%': { boxShadow: '0 0 20px #06b6d4, 0 0 40px #22d3ee' },
        },
        glowOrange: {
          '0%': { boxShadow: '0 0 5px #f97316, 0 0 10px #f97316' },
          '100%': { boxShadow: '0 0 20px #f97316, 0 0 40px #fb923c' },
        },
        glowPurple: {
          '0%': { boxShadow: '0 0 5px #6b21a8, 0 0 10px #a855f7' },
          '100%': { boxShadow: '0 0 20px #6b21a8, 0 0 40px #a855f7' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
        scanLine: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
      },
    },
  },
  plugins: [],
};
