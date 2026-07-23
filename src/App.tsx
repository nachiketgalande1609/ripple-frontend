import React from "react";
import { BrowserRouter as Router, useLocation } from "react-router-dom";
import { CssVarsProvider, extendTheme, useColorScheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Box } from "@mui/material";
import { LightMode, DarkMode } from "@mui/icons-material";
import AppContent from "./AppContent";

function ThemeTogglePill() {
    const { mode, setMode } = useColorScheme();
    const location = useLocation();
    if (location.pathname.startsWith("/messages")) return null;
    const [spinning, setSpinning] = React.useState(false);

    const handleToggle = () => {
        setSpinning(true);
        setMode(mode === "dark" ? "light" : "dark");
        setTimeout(() => setSpinning(false), 500);
    };

    return (
        <Box
            onClick={handleToggle}
            sx={{
                position: "fixed",
                bottom: -2,
                right: 10,
                zIndex: 1301,
                display: "flex",
                alignItems: "center",
                px: 1.75,
                py: 0.85,
                borderRadius: "14px 14px 0 0",
                bgcolor: mode === "dark" ? "#ffffff" : "#0a0a0f",
                color: mode === "dark" ? "#0a0a0f" : "#ffffff",
                border: "none",
                cursor: "pointer",
                boxShadow: mode === "dark" ? "0 4px 16px rgba(255,255,255,0.12)" : "0 4px 16px rgba(0,0,0,0.25)",
                userSelect: "none",
                transition: "background-color 0.4s ease, color 0.4s ease, transform 0.18s ease, box-shadow 0.18s ease",
                "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: mode === "dark" ? "0 8px 24px rgba(255,255,255,0.18)" : "0 8px 24px rgba(0,0,0,0.35)",
                },
                "&:active": { transform: "scale(0.92) translateY(0px)" },
                "@keyframes spinPop": {
                    "0%":   { transform: "rotate(0deg) scale(1)" },
                    "40%":  { transform: "rotate(200deg) scale(1.3)" },
                    "70%":  { transform: "rotate(340deg) scale(0.9)" },
                    "100%": { transform: "rotate(360deg) scale(1)" },
                },
            }}
        >
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    animation: spinning ? "spinPop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards" : "none",
                }}
            >
                {mode === "dark"
                    ? <LightMode sx={{ fontSize: "1.18rem" }} />
                    : <DarkMode sx={{ fontSize: "1.18rem" }} />
                }
            </Box>
        </Box>
    );
}

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
                <ThemeTogglePill />
            </Router>
        </CssVarsProvider>
    );
};

export default App;
