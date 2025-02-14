import React from "react";
import "./App.css";
import Header from "./components/Header";
import { createTheme } from "@mui/material/styles";
import { ThemeProvider } from "@mui/material/styles";

const theme = createTheme({
  typography: {
    fontFamily: '"Open Sans", "Dosis", "Roboto", sans-serif',
    h1: {
      fontFamily: '"Open Sans", sans-serif',
      fontWeight: 400,
    },
    h2: {
      fontFamily: '"Open Sans", sans-serif',
      fontWeight: 400,
    },
    h3: {
      fontFamily: '"Open Sans", sans-serif',
      fontWeight: 300,
    },
    h4: {
      fontFamily: '"Open Sans", sans-serif',
      fontWeight: 300,
    },
    body1: {
      fontFamily: '"Open Sans", sans-serif',
      fontWeight: 300,
    },
    body2: {
      fontFamily: '"Open Sans", sans-serif',
      fontWeight: 300,
    },
    button: {
      fontFamily: '"Open Sans", sans-serif',
      fontWeight: 400,
      textTransform: "none",
    },
    allVariants: {
      color: "#333333",
      fontFamily: '"Open Sans", sans-serif',
      fontWeight: 400,
    },
  },
  palette: {
    mode: "light",
    text: {
      primary: "#333333",
      secondary: "#666666",
      disabled: "#999999",
    },
    primary: {
      main: "#00896f",
      light: "#94221b",
      dark: "#00a595",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#3fa9f5",
      light: "#0644f4",
      contrastText: "#ffffff",
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <div className="App" style={{ width: "100%", height: "100vh" }}>
        <Header />
      </div>
    </ThemeProvider>
  );
}

export default App;
