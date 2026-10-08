export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a'
        },
        smartroute: {
          dark: '#0a0f1e',
          darker: '#060b16',
          card: '#111827',
          accent: '#3b82f6',
          green: '#10b981',
          orange: '#f59e0b'
        },
        radipo: {
          dark: '#0a0f1e',
          darker: '#060b16',
          card: '#111827',
          accent: '#3b82f6',
          green: '#10b981',
          orange: '#f59e0b'
        }
      },
      animation: {
        'bike-ride': 'bikeRide 3s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.3s ease-in',
        'bounce-in': 'bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'road-scroll': 'roadScroll 2s linear infinite',
        'car-move': 'carMove 4s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite'
      },
      keyframes: {
        bikeRide: {
          '0%, 100%': { transform: 'translateX(0) rotate(-2deg)' },
          '50%': { transform: 'translateX(10px) rotate(2deg)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(59,130,246,0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(59,130,246,0.8), 0 0 40px rgba(59,130,246,0.3)' }
        },
        slideUp: {
          from: { opacity: 0, transform: 'translateY(30px)' },
          to: { opacity: 1, transform: 'translateY(0)' }
        },
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 }
        },
        bounceIn: {
          from: { opacity: 0, transform: 'scale(0.5)' },
          '70%': { transform: 'scale(1.05)' },
          to: { opacity: 1, transform: 'scale(1)' }
        },
        roadScroll: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' }
        },
        carMove: {
          '0%': { transform: 'translateX(-20px)' },
          '50%': { transform: 'translateX(20px)' },
          '100%': { transform: 'translateX(-20px)' }
        }
      }
    }
  },
  plugins: []
}
