import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./i18n";
import App from "./App.tsx";
import { NotificationProvider } from "./hooks/useNotification.tsx";

document.addEventListener("contextmenu", (e) => {
    const target = e.target as HTMLElement;
    if (target.closest("button, a, img, video, [role='button']")) {
        e.preventDefault();
    }
});

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <NotificationProvider>
            <App />
        </NotificationProvider>
    </StrictMode>,
);
