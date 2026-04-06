import { BrowserRouter as Router } from "react-router-dom";
import { CssVarsProvider, extendTheme } from "@mui/material/styles";
import AppContent from "./AppContent";

const demoTheme = extendTheme({
    colorSchemes: { light: true, dark: true },
    colorSchemeSelector: "class",
});

const App = () => {
    const savedUser = JSON.parse(localStorage.getItem("user") || "null");
    const defaultMode = savedUser?.theme === "dark" ? "dark" : "light";

    return (
        <CssVarsProvider theme={demoTheme} defaultMode={defaultMode}>
            <Router>
                <AppContent />
            </Router>
        </CssVarsProvider>
    );
};

export default App;
