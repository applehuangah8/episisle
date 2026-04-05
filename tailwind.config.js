/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        epis: {
          mist: "var(--epis-mist)",
          sky: "var(--epis-sky)",
          sea: "var(--epis-sea)",
          foam: "var(--epis-foam)",
          ink: "var(--color-text)",
          accent: "var(--color-accent)",
        },
        miniature: {
          canvas: "var(--color-canvas-bg)",
          town: "var(--color-town-bg)",
          stroke: "var(--color-stroke)",
          wild: "var(--color-wild-block)",
        },
      },
      borderRadius: {
        brick: "var(--border-radius)",
      },
      boxShadow: {
        brick: "var(--shadow-block)",
      },
      fontFamily: {
        sans: ["var(--epis-font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
