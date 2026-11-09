export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)", card: "var(--card)", ink: "var(--ink)", muted: "var(--muted)", line: "var(--line)",
        brand: "var(--brand)", brandsoft: "var(--brandsoft)", gold: "var(--gold)", ok: "var(--ok)", bad: "var(--bad)",
      },
      fontFamily: { display: ['"Bricolage Grotesque"', "system-ui", "sans-serif"], sans: ['"Instrument Sans"', "system-ui", "sans-serif"] },
    },
  },
};
