import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        warmWhite: "#fbf8f2",
        mistBlue: "#dceaf0",
        mistBlueDeep: "#7f9aa7",
        softGray: "#8f9698",
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
