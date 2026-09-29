/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sand: {
          DEFAULT: '#F8FAFC',
          base: '#F8FAFC',
          recessed: '#F1F5F9',
          divider: '#E2E8F0',
          shadow: '#CBD5E1',
          highlight: '#FFFFFF',
        },
        charcoal: {
          DEFAULT: '#0F172A',
          dark: '#020617',
          muted: '#475569',
          light: '#64748B',
        },
        regulatory: {
          pass: '#166534',
          passBg: '#DCFCE7',
          passBorder: '#BBF7D0',
          fail: '#991B1B',
          failBg: '#FEE2E2',
          failBorder: '#FECACA',
          pending: '#92400E',
          pendingBg: '#FEF3C7',
          pendingBorder: '#FDE68A',
        }
      },
      borderRadius: {
        'tactile': '13px',
      },
      boxShadow: {
        'tactile-raised': '0 4px 12px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)',
        'tactile-raised-sm': '0 2px 6px rgba(0, 0, 0, 0.03)',
        'tactile-raised-lg': '0 10px 25px rgba(0, 0, 0, 0.06)',
        'tactile-inset': 'inset 0 2px 4px rgba(0, 0, 0, 0.04)',
        'tactile-inset-deep': 'inset 0 3px 6px rgba(0, 0, 0, 0.06)',
        'tactile-btn': '0 2px 5px rgba(37, 99, 235, 0.2)',
        'tactile-btn-pressed': 'inset 0 2px 4px rgba(0, 0, 0, 0.2)',
      }
    },
  },
  plugins: [],
}

