/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        courier: ['var(--font-courier)', 'Courier New', 'monospace'],
        ibm: ['var(--font-ibm)', 'monospace'],
      },
      colors: {
        foia: {
          paper: '#F5F2E9',
          ink: '#1A1A1A',
          stamp: '#dc2626',
        },
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
        notary: {
          primary: '#8b5cf6',
          secondary: '#06b6d4',
          accent: '#f59e0b',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
        'shake': 'shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both',
        'redact-breathe': 'redactBreathe 4s ease-in-out infinite',
        'stamp-slam': 'stampSlam 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' },
        },
        redactBreathe: {
          '0%, 100%': { opacity: '0.92' },
          '50%': { opacity: '1' },
        },
        stampSlam: {
          '0%': { transform: 'scale(3) rotate(-12deg)', opacity: '0' },
          '60%': { transform: 'scale(0.9) rotate(-4deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(-3deg)', opacity: '1' },
        },
      },
      transitionDuration: {
        '0': '0ms',
      }
    },
  },
  plugins: [],
}
