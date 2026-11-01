/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter Variable', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        outfit: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          50:  'hsl(262 100% 97%)',
          100: 'hsl(262 100% 93%)',
          200: 'hsl(262 96% 85%)',
          300: 'hsl(262 90% 74%)',
          400: 'hsl(262 85% 64%)',
          500: 'hsl(262 80% 54%)',   // primary
          600: 'hsl(262 76% 45%)',
          700: 'hsl(262 72% 36%)',
          800: 'hsl(262 68% 28%)',
          900: 'hsl(262 64% 20%)',
          950: 'hsl(262 62% 12%)',
        },
        accent: {
          DEFAULT: 'hsl(38 100% 56%)',  // amber-gold
          light:   'hsl(38 100% 72%)',
          dark:    'hsl(38 100% 40%)',
        },
        surface: {
          DEFAULT: 'hsl(222 47% 8%)',   // dark bg
          card:    'hsl(222 40% 11%)',
          border:  'hsl(222 30% 18%)',
          muted:   'hsl(222 25% 22%)',
        },
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, hsl(262 80% 54%), hsl(220 80% 60%))',
        'gradient-hero':  'radial-gradient(ellipse at 60% 0%, hsl(262 80% 30% / 0.4), transparent 60%), radial-gradient(ellipse at 10% 80%, hsl(220 80% 30% / 0.3), transparent 50%)',
        'glow-brand':     'radial-gradient(circle at center, hsl(262 80% 54% / 0.25), transparent 70%)',
      },
      animation: {
        'fade-in':    'fadeIn 0.4s ease forwards',
        'slide-up':   'slideUp 0.5s cubic-bezier(0.16,1,0.3,1) forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'glow':       'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        glow:    { from: { boxShadow: '0 0 10px hsl(262 80% 54% / 0.3)' }, to: { boxShadow: '0 0 30px hsl(262 80% 54% / 0.7)' } },
      },
      boxShadow: {
        'brand':    '0 4px 24px hsl(262 80% 54% / 0.3)',
        'brand-lg': '0 8px 48px hsl(262 80% 54% / 0.4)',
        'card':     '0 2px 16px hsl(222 47% 4% / 0.6)',
      },
      borderRadius: {
        'xl2': '1rem',
        'xl3': '1.5rem',
      },
    },
  },
  plugins: [],
};
