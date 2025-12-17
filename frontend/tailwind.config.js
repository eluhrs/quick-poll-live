/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#7a6e6e', // Lehigh Soft Primary
                    hover: '#8d8282',
                },
                secondary: {
                    DEFAULT: '#dcdcdc', // Lehigh Soft Secondary (Header BG)
                    hover: '#ededed',   // Lehigh Soft Secondary Hover (Row BG)
                    text: '#3b2f2f',    // Lehigh Soft Text
                },
                // Preserving Bronze for Login/Landing Page
                bronze: {
                    DEFAULT: '#6d4c41',
                    hover: '#5d4037',
                }
            }
        },
    },
    plugins: [],
}
