import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        // WritgoAI Custom Colors - Updated to match new logo
        'writgo-gray': {
          DEFAULT: 'hsl(var(--writgo-gray))',
          light: 'hsl(var(--writgo-gray-light))',
        },
        'writgo-orange': {
          DEFAULT: 'hsl(var(--writgo-orange))',
          light: 'hsl(var(--writgo-orange-light))',
        },
        // 🎨 WritgoAI 2024 Dark + Orange Theme
        'writgo-primary': '#FF6B35',      // Primary Orange (bright)
        'writgo-secondary': '#FF8C42',    // Secondary Orange (lighter)
        'writgo-tertiary': '#FFA500',     // Tertiary Orange (gold)
        'deep-space': '#000000',          // Background (pure black)
        'surface': '#121212',             // Cards, sections (very dark gray)
        'surface-light': '#1A1A1A',       // Lighter cards
        'border-dark': '#333333',         // Borders, dividers
        'pearl-white': '#FFFFFF',         // Main text (pure white)
        'text-light': '#F5F5F5',          // Light text (off-white)
        'text-muted': '#A1A1AA',          // Muted text, labels
        'accent-light': '#FFF5E6',        // Soft orange for subtle highlights
        'orange': {
          50: '#FFF5E6',
          100: '#FFE6CC',
          200: '#FFCC99',
          300: '#FFB366',
          400: '#FF9933',
          500: '#FF6B35',  // Primary
          600: '#E65A2E',
          700: '#CC4A26',
          800: '#B33B1F',
          900: '#992B17',
        },
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('tailwind-scrollbar-hide')
  ],
};
export default config;
