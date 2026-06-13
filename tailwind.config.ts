import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        mistBlue: "#dceaf0",
        ink: "#253035"
      },
      boxShadow: {
        mist: "0 24px 80px rgba(127, 154, 167, 0.18)"
      }
    }
  },
  plugins: []
};

export default config;
