import { createTheme } from "@mui/material/styles";

// Create a theme instance.
const theme = createTheme({
  direction: 'rtl',
  fontFamily: '"Yekan Bakh", "Arial", sans-serif',

  palette: {
    text: {
      primary: '#5B5B98',
      secondary: '#5B5B98',
      disabled: '#5B5B98',
      hint: '#5B5B98',
    },
    primary: {
      main: "#757FEF",
    },
    secondary: {
      main: "#818093",
    },
    success: {
      main: "#00B69B",
    },
    info: {
      main: "#2DB6F5",
    },
    warning: {
      main: "#FFBC2B",
    },
    danger: {
      main: "#EE368C",
    },
    dark: {
      main: "#260944",
    },
  },

  typography: {
    fontSize: 12,
    fontFamily: '"Yekan Bakh", "Arial", sans-serif',
  },
});

export default theme;
