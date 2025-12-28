import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: "class", // This allows next-themes to toggle the 'dark' class on the html element
    content: [
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    // ... rest of config
};
export default config;
