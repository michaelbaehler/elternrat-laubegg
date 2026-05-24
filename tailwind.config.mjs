/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        orange: {
          DEFAULT: '#FFAA44',
          dark:    '#E8952A',
          darker:  '#C87818',
          light:   '#FFF0D6',
          lighter: '#FFFAF2',
        },
        grey: {
          dark:   '#222222',
          mid:    '#555555',
          muted:  '#888888',
          border: '#DDDDDD',
          light:  '#F2F2F2',
          bg:     '#F8F8F8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
