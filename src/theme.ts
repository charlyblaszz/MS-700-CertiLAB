import { alpha, createTheme } from "@mui/material/styles";

export function createSimulatorTheme(mode: "light" | "dark") {
  const dark = mode === "dark";
  return createTheme({
    palette: {
      mode,
      primary: { main: "#0F6CBD", dark: "#0B4F8A", light: "#4F9BE3" },
      secondary: { main: "#5C2D91" },
      success: { main: "#107C41" },
      warning: { main: "#C27A00" },
      error: { main: "#C42B1C" },
      background: {
        default: dark ? "#111827" : "#F5F7FB",
        paper: dark ? "#182235" : "#FFFFFF",
      },
      text: {
        primary: dark ? "#F4F7FC" : "#172033",
        secondary: dark ? "#B8C4D8" : "#526078",
      },
    },
    typography: {
      fontFamily:
        '"Segoe UI Variable", "Segoe UI", Inter, Arial, sans-serif',
      h1: { fontWeight: 700, letterSpacing: "-0.035em" },
      h2: { fontWeight: 700, letterSpacing: "-0.025em" },
      h3: { fontWeight: 700, letterSpacing: "-0.02em" },
      h4: { fontWeight: 700, letterSpacing: "-0.015em" },
      h5: { fontWeight: 650 },
      button: { textTransform: "none", fontWeight: 650 },
    },
    shape: { borderRadius: 12 },
    components: {
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: { root: { minHeight: 42, borderRadius: 8 } },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            border: `1px solid ${dark ? "#2A3850" : "#E2E8F2"}`,
            boxShadow: dark
              ? "0 14px 40px rgba(0,0,0,.18)"
              : "0 12px 32px rgba(24,46,86,.07)",
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: "none" },
          outlined: {
            borderColor: dark ? "#33425A" : "#DDE4EF",
          },
        },
      },
      MuiChip: {
        styleOverrides: { root: { fontWeight: 600 } },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            height: 8,
            borderRadius: 99,
            backgroundColor: alpha("#0F6CBD", 0.12),
          },
          bar: { borderRadius: 99 },
        },
      },
    },
  });
}
