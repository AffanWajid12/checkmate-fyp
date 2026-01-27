/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Primary Brand Colors
                primary: {
                    DEFAULT: '#000000', // Black - main brand color
                    hover: '#1a1a1a',   // Slightly lighter for hover states
                },
                
                // Accent Colors (Teal/Cyan)
                accent: {
                    50: '#f0fdfa',      // Teal-50 - lightest background
                    100: '#ccfbf1',     // Teal-100 - light borders
                    200: '#99f6e4',     // Teal-200 - light accents
                    300: '#5eead4',     // Teal-300
                    400: '#2dd4bf',     // Teal-400 - main accent color
                    500: '#14b8a6',     // Teal-500 - darker accent
                    DEFAULT: '#2dd4bf', // Default accent (teal-400)
                },
                
                // Neutral/Gray Scale
                neutral: {
                    50: '#f9fafb',      // Almost white backgrounds
                    100: '#f3f4f6',     // Light gray backgrounds
                    200: '#e5e7eb',     // Borders and dividers
                    400: '#9ca3af',     // Muted text
                    500: '#6b7280',     // Secondary text
                    600: '#4b5563',     // Primary text (dark gray)
                    700: '#374151',     // Darker text
                    800: '#1f2937',     // Very dark gray
                    900: '#111827',     // Almost black
                    DEFAULT: '#6b7280', // Default gray for text
                },
                
                // Background Colors
                background: {
                    DEFAULT: '#ffffff', // White
                    secondary: '#f9fafb', // Light gray (gray-50)
                    dark: '#000000',    // Black
                },
                
                // Text Colors
                text: {
                    primary: '#111827',   // Almost black (gray-900)
                    secondary: '#6b7280', // Medium gray (gray-600)
                    muted: '#9ca3af',     // Light gray (gray-400)
                    inverse: '#ffffff',   // White text on dark backgrounds
                },
                
                // Semantic Colors
                success: {
                    DEFAULT: '#10b981',   // Green-500
                    light: '#d1fae5',     // Green-100
                },
                error: {
                    DEFAULT: '#ef4444',   // Red-500
                    light: '#fee2e2',     // Red-100
                },
            },
            
            // Gradient Stops (for bg-gradient-to-r from-accent-400 to-accent-200)
            backgroundImage: {
                'gradient-accent': 'linear-gradient(to right, #2dd4bf, #99f6e4)',
                'gradient-success': 'linear-gradient(to right, #2dd4bf, #10b981)',
            },
            
            // Border Radius (matching your design)
            borderRadius: {
                'xl': '0.75rem',
                '2xl': '1rem',
                '3xl': '1.5rem',
            },
            
            // Box Shadows (matching your design)
            boxShadow: {
                'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                'DEFAULT': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
                'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
            },
        },
    },
    plugins: [],
}
