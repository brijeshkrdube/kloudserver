/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
        "./public/index.html"
    ],
    theme: {
        extend: {
            fontFamily: {
                'heading': ['Unbounded', 'sans-serif'],
                'body': ['Manrope', 'sans-serif'],
                'mono': ['JetBrains Mono', 'monospace'],
            },
            colors: {
                background: {
                    DEFAULT: '#020408',
                    paper: '#0B0E14',
                    subtle: '#151921',
                },
                primary: {
                    DEFAULT: '#2563EB',
                    hover: '#3B82F6',
                    foreground: '#FFFFFF',
                },
                accent: {
                    cyan: '#06B6D4',
                    purple: '#7C3AED',
                    success: '#10B981',
                    warning: '#F59E0B',
                    error: '#EF4444',
                },
                text: {
                    primary: '#F9FAFB',
                    secondary: '#9CA3AF',
                    muted: '#4B5563',
                },
                border: {
                    DEFAULT: 'rgba(255, 255, 255, 0.08)',
                    active: 'rgba(37, 99, 235, 0.5)',
                },
                card: {
                    DEFAULT: '#0B0E14',
                    foreground: '#F9FAFB'
                },
                popover: {
                    DEFAULT: '#0B0E14',
                    foreground: '#F9FAFB'
                },
                secondary: {
                    DEFAULT: '#151921',
                    foreground: '#F9FAFB'
                },
                muted: {
                    DEFAULT: '#151921',
                    foreground: '#9CA3AF'
                },
                destructive: {
                    DEFAULT: '#EF4444',
                    foreground: '#FFFFFF'
                },
                input: '#151921',
                ring: '#2563EB',
                foreground: '#F9FAFB',
            },
            borderRadius: {
                lg: '0.5rem',
                md: '0.375rem',
                sm: '0.25rem'
            },
            keyframes: {
                'accordion-down': {
                    from: { height: '0' },
                    to: { height: 'var(--radix-accordion-content-height)' }
                },
                'accordion-up': {
                    from: { height: 'var(--radix-accordion-content-height)' },
                    to: { height: '0' }
                },
                'glow-pulse': {
                    '0%, 100%': { boxShadow: '0 0 15px rgba(37, 99, 235, 0.3)' },
                    '50%': { boxShadow: '0 0 25px rgba(37, 99, 235, 0.5)' }
                },
                'float': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' }
                }
            },
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out',
                'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
                'float': 'float 3s ease-in-out infinite'
            },
            backgroundImage: {
                'hero-glow': 'radial-gradient(circle at 50% 50%, rgba(37, 99, 235, 0.15) 0%, rgba(2, 4, 8, 0) 70%)',
                'card-gradient': 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
                'grid-pattern': 'linear-gradient(to right, rgba(31, 41, 55, 0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(31, 41, 55, 0.3) 1px, transparent 1px)',
            }
        }
    },
    plugins: [require("tailwindcss-animate")],
};
