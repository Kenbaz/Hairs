import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "#1a1a1a",
        secondary: "#3E4C59",
        spanColor: "#52606D",
        tinWhite: "#FFFFFFDE",
        headerColor: "#0a0a0a",
        lightGray: "#555",
        lightGray2: "#666",
        customGray1: "#262626",
        customWhite: "#fdfcfd",
        customGray: "#373737",
        customBlack: "#101515",
        sidebarCol: "#F5F5F5",
        lightGrey1: "#A3A3A3",
        lightGrey2: "#767676",
        customBrown: "#FAD643",
        customWhite2: "#e9e8e4",
        customWhite3: "rgba(254, 254, 254)",
        GreyClear: "rgba(227, 228, 229)",
        ShadowAzalea: "rgba(224, 230, 242, 0.70)",
        HeavenlyHazw: "rgba(215, 215, 227)",
        customGray3: "#CCCCCC",
        shimmerColor: "rgba(255, 255, 255, 0.01)",
        whiteShimmer: "rgba(209, 213, 219, 0.30)",
        lynxWhite: "#F7F7F7",
        coldMorning: "#E6E5E4",
        craterCrawler: "#C8CED6",
        curshedAlmond: "#736A86",
      },
      scale: {
        20: "0.3",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      textStroke: {
        black:
          "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000",
        teal: "-1px -1px 0 teal, 1px -1px 0 teal, -1px 1px 0 teal, 1px 1px 0 teal",
      },
      textShadow: {
        default: "2px 2px 4px rgba(0,0,0,0.5)",
        lg: "4px 4px 6px rgba(0,0,0,0.5)",
      },
      boxShadow: {
        custom:
          "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      },
    },
  },
  plugins: [],
} satisfies Config;
