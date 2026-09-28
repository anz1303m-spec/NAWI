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
          DEFAULT: '#F4F0E8',
          base: '#F4F0E8',
          recessed: '#EAE4D6',
          divider: '#DED7C8',
          shadow: '#DBD3C3',
          highlight: '#FFFFFF',
        },
        charcoal: {
          DEFAULT: '#1C1A17',
          dark: '#141210',
          muted: '#5C5852',
          light: '#7A7469',
        },
        regulatory: {
          pass: '#2D5A27',
          passBg: '#E2EBDC',
          passBorder: '#C5DAC0',
          fail: '#8B2522',
          failBg: '#F5DDDC',
          failBorder: '#EBC3C2',
          pending: '#8C5815',
          pendingBg: '#F5ECCF',
          pendingBorder: '#EBDCAC',
        }
      },
      borderRadius: {
        'tactile': '13px',
      },
      boxShadow: {
        'tactile-raised': '4px 4px 10px #DBD3C3, -4px -4px 10px #FFFFFF',
        'tactile-raised-sm': '2px 2px 6px #DBD3C3, -2px -2px 6px #FFFFFF',
        'tactile-raised-lg': '6px 6px 16px #DBD3C3, -6px -6px 16px #FFFFFF',
        'tactile-inset': 'inset 2px 2px 5px #DBD3C3, inset -2px -2px 5px #FFFFFF',
        'tactile-inset-deep': 'inset 3px 3px 7px #DBD3C3, inset -3px -3px 7px #FFFFFF',
        'tactile-btn': '3px 3px 8px #DBD3C3, -3px -3px 8px #FFFFFF',
        'tactile-btn-pressed': 'inset 2px 2px 4px #000000, inset -1px -1px 3px #333333',
      }
    },
  },
  plugins: [],
}
