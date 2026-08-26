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
 * ---------------------------------------------------------------------------
 * PALETTE REMAPPING - read this before changing a colour anywhere.
 *
 * The stock Tailwind ramps (gray, indigo, green, red, blue, amber) are
 * REDEFINED here to eGENTIC colours. A class like `text-gray-500` therefore
 * renders as eGENTIC Gray, and `bg-indigo-600` as eGENTIC Blue. Nothing in
 * the components had to change, and reverting is one file.
 *
 * Consequences you must know:
 *   - The class NAMES are historical, not descriptive. "indigo" means Blue.
 *   - green and red no longer signal success/danger: green resolves to the
 *     blue family and red to the accent Orange, because the guide's palette
 *     contains neither. Status is carried by ICON AND WORDING - see
 *     context/system-rules.md. Never reintroduce a colour-only status signal.
 *   - Values marked (guide) are exact corporate values. Do not alter them.
 *     The unmarked stops are interpolations that exist only to keep the ramps
 *     continuous, and may be tuned.
 * ---------------------------------------------------------------------------
 */

// Corporate values, for reference at their canonical names.
const BLUE = '#204D6E';
const LIGHT_BLUE = '#0069AA';
const DARK_BLUE = '#163650';
const GRAY = '#7C8488';
const LIGHT_GRAY = '#95A2AC';
const DARK_GRAY = '#59606C';
const CYAN = '#91C9E7';
const LIGHT_CYAN = '#E5F2FC';
const ORANGE = '#EB8A40';
const YELLOW = '#FFAF22';
const BLUE_BLACK = '#091828';

/**
 * Surfaces, borders and body text. Low = light, high = dark.
 *
 * ACCESSIBILITY DEVIATION, deliberate: the guide's Gray (#7C8488) and Light
 * Gray (#95A2AC) score 3.81:1 and 2.61:1 as small text on white, below the
 * 4.5:1 WCAG AA floor. They are print colours. The text-bearing stops (400,
 * 500) therefore use darker values, with Dark Gray - also a guide colour -
 * at 500. The two lighter guide values remain available under their canonical
 * names (neutral.DEFAULT, neutral.light) for borders, icons and fills, where
 * text contrast does not apply.
 */
const neutralRamp = {
  50: '#F7FAFC',
  100: LIGHT_CYAN, //   (guide) Light Cyan
  200: '#D4E3ED',
  300: LIGHT_GRAY, //   (guide) Light Gray - dark-mode text, light-mode borders
  400: '#6B7378', //    4.83:1 on white
  500: DARK_GRAY, //    (guide) Dark Gray - 6.34:1 on white
  600: '#47505C',
  700: '#2E4A61',
  800: DARK_BLUE, //    (guide) Dark Blue
  900: BLUE_BLACK, //   (guide) Blue Black
  950: '#050D16',
};

/** Interactive: links, primary buttons, focus rings, active nav. */
const brandRamp = {
  50: LIGHT_CYAN, //    (guide) Light Cyan
  100: '#CCE4F5',
  200: CYAN, //         (guide) Cyan
  300: '#5BA8D4',
  400: '#2E8BC4',
  500: LIGHT_BLUE, //   (guide) Light Blue
  600: BLUE, //         (guide) Blue
  700: '#1A4160',
  800: DARK_BLUE, //    (guide) Dark Blue
  900: '#0F2839',
  950: BLUE_BLACK, //   (guide) Blue Black
};

/** The guide's only warning/disruptor colour. */
const orangeRamp = {
  50: '#FDF3EA',
  100: '#FAE2CD',
  200: '#F6CCA6',
  300: '#F2B27C',
  400: '#F09B5C',
  500: ORANGE, //       (guide) Orange
  600: '#D97528',
  700: '#B85F1F',
  800: '#8F4A18',
  900: '#6B3812',
  950: '#3D200A',
};

const yellowRamp = {
  ...orangeRamp,
  400: '#FFC154',
  500: YELLOW, //       (guide) Yellow
  600: '#E09612',
};

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // --- Stock ramps, redefined to the corporate palette --------------
        gray: neutralRamp,
        slate: neutralRamp,
        indigo: brandRamp,
        blue: brandRamp,
        green: brandRamp, // no green in the palette: status is icon + wording
        red: orangeRamp, //  no red in the palette: problems use Orange
        amber: yellowRamp,
        yellow: yellowRamp,

        // --- Canonical names, for new code -------------------------------
        brand: {
          DEFAULT: BLUE,
          light: LIGHT_BLUE,
          dark: DARK_BLUE,
          black: BLUE_BLACK,
        },
        neutral: {
          DEFAULT: GRAY,
          light: LIGHT_GRAY,
          dark: DARK_GRAY,
        },
        cyan: { DEFAULT: CYAN, light: LIGHT_CYAN },
        accent: { orange: ORANGE, yellow: YELLOW },
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
       * The guide forbids drop shadows. Every shadow utility the components
       * use is redefined as a flat hairline border, so existing `shadow-sm`
       * and `shadow-lg` markup renders compliantly without being rewritten.
       */
      boxShadow: {
        none: 'none',
        sm: '0 0 0 1px rgb(124 132 136 / 0.16)',
        DEFAULT: '0 0 0 1px rgb(124 132 136 / 0.18)',
        md: '0 0 0 1px rgb(124 132 136 / 0.22)',
        lg: '0 0 0 1px rgb(124 132 136 / 0.26)',
        xl: '0 0 0 1px rgb(124 132 136 / 0.30)',
        card: '0 0 0 1px rgb(124 132 136 / 0.18)',
        raised: '0 0 0 1px rgb(124 132 136 / 0.28)',
      },
    },
  },
  plugins: [],
};
