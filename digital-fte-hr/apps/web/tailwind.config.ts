import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        // Primary: Jobright Mint Green
        'primary': {
          '50': '#f0fdf9',
          '100': '#dcfdf3',
          '200': '#b3fbe8',
          '300': '#7efadd',
          '400': '#00f0a0',    // Main primary color
          '500': '#00d989',
          '600': '#00b876',
          '700': '#009961',
          '800': '#007a50',
          '900': '#065f43',
        },

        // ATS Score Colors
        'ats-red': '#ef4444',      // RED: <60
        'ats-yellow': '#eab308',   // YELLOW: 60-74
        'ats-green': '#22c55e',    // GREEN: 75+

        // Application Status Colors
        'status-pending': '#f97316',
        'status-approved': '#00f0a0',
        'status-submitted': '#06b6d4',
        'status-viewed': '#8b5cf6',
        'status-shortlisted': '#00f0a0',
        'status-rejected': '#ef4444',

        // Brand Colors (updated to mint theme)
        'brand-primary': '#00f0a0',
        'brand-secondary': '#065f43',
        'brand-accent': '#00d989',

        // Semantic Colors
        'success': '#00f0a0',
        'warning': '#eab308',
        'error': '#ef4444',
        'info': '#0ea5e9',
      },
      spacing: {
        'sidebar': '280px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};

export default config;
