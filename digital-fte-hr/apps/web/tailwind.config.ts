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
        // ATS Score Colors
        'ats-red': '#ef4444',      // RED: <60
        'ats-yellow': '#eab308',   // YELLOW: 60-74
        'ats-green': '#22c55e',    // GREEN: 75+

        // Application Status Colors
        'status-pending': '#f97316',
        'status-approved': '#3b82f6',
        'status-submitted': '#06b6d4',
        'status-viewed': '#8b5cf6',
        'status-shortlisted': '#10b981',
        'status-rejected': '#ef4444',

        // Brand Colors
        'brand-primary': '#3b82f6',
        'brand-secondary': '#06b6d4',
        'brand-accent': '#f97316',

        // Semantic Colors
        'success': '#22c55e',
        'warning': '#eab308',
        'error': '#ef4444',
        'info': '#3b82f6',
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
