/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        geist: ['Geist', 'sans-serif'],
      },
      fontSize: {
        // Small text - for labels, captions, metadata
        'xs': ['0.75rem', { lineHeight: '1rem', letterSpacing: '-0.01em', fontWeight: '400' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '-0.01em', fontWeight: '400' }],
        // Body text - for general content
        'base': ['1rem', { lineHeight: '1.5rem', letterSpacing: '-0.011em', fontWeight: '400' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.014em', fontWeight: '400' }],
        // Headlines - for titles and headers
        'xl': ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.017em', fontWeight: '600' }],
        '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.019em', fontWeight: '600' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.021em', fontWeight: '600' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.022em', fontWeight: '700' }],
        '5xl': ['3rem', { lineHeight: '1', letterSpacing: '-0.024em', fontWeight: '700' }],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Design Guide Brand Colors
        brand: {
          cyan: "var(--brand-cyan)",
          "cyan-hover": "var(--brand-cyan-hover)",
          "gray-bg": "var(--brand-gray-bg)",
          "gray-muted": "var(--brand-gray-muted)",
          "gray-border": "var(--brand-gray-border)",
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-brand': 'linear-gradient(199deg, rgb(6, 182, 212) 0%, rgb(20, 20, 20) 100%)',
        'gradient-brand-dark': 'linear-gradient(199deg, rgb(50, 50, 50) 0%, rgb(20, 20, 20) 100%)',
      },
      boxShadow: {
        'brand': '0px 10px 20px 0px rgba(0, 0, 0, 0.1)',
        'brand-strong': '0px 10px 20px 1px rgba(0, 0, 0, 0.5)',
        'brand-soft': '0px 3px 15px 0px rgba(0, 0, 0, 0.5)',
        'brand-hover': '0px 15px 30px 0px rgba(0, 0, 0, 0.15)',
      },
      borderRadius: {
        'brand-sm': '18px',
        'brand': '24px',
        'brand-lg': '30px',
        'brand-xl': '50px',
      },
    },
  },
  plugins: [],
}
