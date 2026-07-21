import { BrowserRouter as Router } from "react-router-dom";
import { CssVarsProvider, extendTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import AppContent from "./AppContent";

const demoTheme = extendTheme({
    colorSchemes: {
        light: {
            palette: {
                background: { default: "#f5f5f7", paper: "#ffffff" },
            },
        },
        dark: {
            palette: {
                background: { default: "#0a0a0f", paper: "#13131c" },
            },
        },
    },
    colorSchemeSelector: "class",
    typography: {
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
    },
});

const App = () => {
    const savedUser = JSON.parse(localStorage.getItem("user") || "null");
    const defaultMode = savedUser?.theme === "dark" ? "dark" : "light";

    return (
        <CssVarsProvider theme={demoTheme} defaultMode={defaultMode}>
            <CssBaseline />
            <Router>
                <AppContent />
            </Router>
        </CssVarsProvider>
    );
};

export default App;
