/**
 * Checkmate Theme Constants
 * 
 * This file provides JavaScript constants for theme colors that can be used
 * programmatically (e.g., in charts, canvas, or dynamic styling).
 * 
 * For Tailwind classes, prefer using the utility classes directly.
 * Use these constants only when you need hex values in JavaScript.
 */

export const colors = {
  // Primary Colors
  primary: {
    DEFAULT: '#000000',
    hover: '#1a1a1a',
  },

  // Accent Colors (Teal/Cyan)
  accent: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf', // Main accent
    500: '#14b8a6',
    DEFAULT: '#2dd4bf',
  },

  // Neutral/Gray Scale
  neutral: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    DEFAULT: '#6b7280',
  },

  // Background Colors
  background: {
    DEFAULT: '#ffffff',
    secondary: '#f9fafb',
    dark: '#000000',
  },

  // Text Colors
  text: {
    primary: '#111827',
    secondary: '#6b7280',
    muted: '#9ca3af',
    inverse: '#ffffff',
  },

  // Semantic Colors
  success: {
    DEFAULT: '#10b981',
    light: '#d1fae5',
  },

  error: {
    DEFAULT: '#ef4444',
    light: '#fee2e2',
  },
};

// Gradient definitions
export const gradients = {
  accent: 'linear-gradient(to right, #2dd4bf, #99f6e4)',
  success: 'linear-gradient(to right, #2dd4bf, #10b981)',
};

// Shadow definitions (CSS shadow values)
export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
};

// Border radius values
export const borderRadius = {
  xl: '0.75rem',
  '2xl': '1rem',
  '3xl': '1.5rem',
};

// Export default object with all theme values
export default {
  colors,
  gradients,
  shadows,
  borderRadius,
};
