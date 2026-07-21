import { BrowserRouter as Router } from "react-router-dom";
import { CssVarsProvider, extendTheme, useColorScheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Box } from "@mui/material";
import { LightMode, DarkMode } from "@mui/icons-material";
import AppContent from "./AppContent";

function ThemeTogglePill() {
    const { mode, setMode } = useColorScheme();
    return (
        <Box
            onClick={() => setMode(mode === "dark" ? "light" : "dark")}
            sx={{
                position: "fixed",
                bottom: -2,
                right: 0,
                zIndex: 1301,
                display: "flex",
                alignItems: "center",
                px: 1.75,
                py: 0.85,
                borderRadius: "14px 14px 0 0",
                bgcolor: (t) => t.palette.background.paper,
                border: "1px solid",
                borderBottom: "none",
                borderColor: (t) => t.palette.divider,
                backdropFilter: "blur(12px)",
                color: (t) => t.palette.text.secondary,
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
                userSelect: "none",
                transition: "transform 0.18s ease, box-shadow 0.18s ease",
                "&:hover": {
                    transform: "translateY(-2px)",
                    color: (t) => t.palette.text.primary,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.14)",
                },
                "&:active": { opacity: 0.85 },
            }}
        >
            {mode === "dark"
                ? <LightMode sx={{ fontSize: "1.18rem" }} />
                : <DarkMode sx={{ fontSize: "1.18rem" }} />
            }
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
            </Router>
            <ThemeTogglePill />
        </CssVarsProvider>
    );
};

export default App;
