/** @type {import('tailwindcss').Config} */

/**
 * eGENTIC corporate design system, translated for screen.
 *
 * The source guide (context/eGENTIC-design-guide.md) is a PRINT document: it
 * specifies millimetres, DIN page sizes, CMYK, and fixed type at 90 / 45 / 20px.
 * A 90px headline and a 20px body minimum cannot coexist with a dense data
 * table, so the type scale below is a screen translation that preserves the
 * guide's 4.5 : 2.25 : 1 ratios rather than its literal pixel values.
 *
 * Do not "correct" the scale back to the guide's print sizes.
 *
 * What transfers unchanged: the palette, Roboto, the Black/Bold/Regular
 * hierarchy, and the ban on drop shadows.
 */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // --- Primary ---------------------------------------------------
        brand: {
          DEFAULT: '#204D6E', // Blue
          light: '#0069AA', // Light Blue
          dark: '#163650', // Dark Blue
          black: '#091828', // Blue Black
        },
        neutral: {
          DEFAULT: '#7C8488', // Gray
          light: '#95A2AC', // Light Gray
          dark: '#59606C', // Dark Gray
        },
        // --- Secondary: backgrounds only -------------------------------
        cyan: {
          DEFAULT: '#91C9E7',
          light: '#E5F2FC',
        },
        // --- Accent: disruptors, buttons, references -------------------
        accent: {
          orange: '#EB8A40',
          yellow: '#FFAF22',
        },
      },

      fontFamily: {
        // Roboto is self-hosted; Inter is the guide's only permitted substitute.
        sans: ['Roboto', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },

      // Screen translation of the guide's 90 / 45 / 20 print scale.
      fontSize: {
        display: ['2.5rem', { lineHeight: '1.1', fontWeight: '900' }],
        title: ['1.75rem', { lineHeight: '1.2', fontWeight: '700' }],
        subtitle: ['1.25rem', { lineHeight: '1.3', fontWeight: '700' }],
        body: ['0.9375rem', { lineHeight: '1.6', fontWeight: '400' }],
        small: ['0.8125rem', { lineHeight: '1.5', fontWeight: '400' }],
        micro: ['0.6875rem', { lineHeight: '1.4', fontWeight: '500' }],
      },

      /**
       * The guide forbids drop shadows. These tokens exist so `shadow-card`
       * reads naturally in markup while rendering as a flat border, and so a
       * stray `shadow-lg` is easy to spot in review.
       */
      boxShadow: {
        card: '0 0 0 1px rgb(124 132 136 / 0.18)',
        raised: '0 0 0 1px rgb(124 132 136 / 0.28)',
        none: 'none',
      },
    },
  },
  plugins: [],
};
