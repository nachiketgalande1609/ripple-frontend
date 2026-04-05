import { useState } from "react";
import { Box, Switch, Typography } from "@mui/material";
import { useNotifications } from "@toolpad/core/useNotifications";

const General = () => {
    const notifications = useNotifications();
    const currentUser = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") || "") : {};
    const [themeMode, setThemeMode] = useState(currentUser.theme || "light");

    const isDark = themeMode === "dark";

    const handleToggle = async () => {
        const newTheme = isDark ? "light" : "dark";
        setThemeMode(newTheme);
        const updatedUser = { ...currentUser, theme: newTheme };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        notifications.show(`Theme changed to ${newTheme}`, {
            severity: "success",
            autoHideDuration: 3000,
        });
    };

    return (
        <Box
            sx={{
                width: "100%",
                maxWidth: 720,
                display: "flex",
                flexDirection: "column",
                gap: 4,
                fontFamily: "'DM Sans', sans-serif",
            }}
        >
            {/* Header */}
            <Box>
                <Typography sx={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "20px", fontWeight: 700,
                    color: "#ffffff", letterSpacing: "-0.4px", mb: 0.5,
                }}>
                    General
                </Typography>
                <Typography sx={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "13px", color: "rgba(255,255,255,0.35)",
                }}>
                    Manage your app preferences.
                </Typography>
            </Box>

            {/* Card */}
            <Box
                sx={{
                    borderRadius: "14px",
                    border: "1px solid rgba(255,255,255,0.07)",
                    backgroundColor: "rgba(255,255,255,0.03)",
                    overflow: "hidden",
                }}
            >
                {/* Row */}
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        px: 3,
                        py: 2.5,
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Box
                            sx={{
                                width: 38, height: 38,
                                borderRadius: "10px",
                                backgroundColor: "rgba(255,255,255,0.05)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "17px",
                                flexShrink: 0,
                                transition: "background 0.2s",
                            }}
                        >
                            {isDark ? "🌙" : "☀️"}
                        </Box>
                        <Box>
                            <Typography sx={{
                                fontFamily: "'DM Sans', sans-serif",
                                fontSize: "14px", fontWeight: 600, color: "#ffffff",
                                letterSpacing: "-0.1px",
                            }}>
                                {isDark ? "Dark Mode" : "Light Mode"}
                            </Typography>
                            <Typography sx={{
                                fontFamily: "'DM Sans', sans-serif",
                                fontSize: "12px", color: "rgba(255,255,255,0.35)", mt: 0.25,
                            }}>
                                {isDark ? "Easy on the eyes in low light" : "Bright and clear for daytime use"}
                            </Typography>
                        </Box>
                    </Box>

                    <Switch
                        checked={isDark}
                        onChange={handleToggle}
                        sx={{
                            flexShrink: 0,
                            "& .MuiSwitch-switchBase.Mui-checked": { color: "#fff" },
                            "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                                backgroundColor: "rgba(255,255,255,0.4)", opacity: 1,
                            },
                            "& .MuiSwitch-track": {
                                backgroundColor: "rgba(255,255,255,0.12)", opacity: 1,
                            },
                            "& .MuiSwitch-thumb": { boxShadow: "0 1px 4px rgba(0,0,0,0.5)" },
                        }}
                    />
                </Box>

                {/* Footer hint */}
                <Box
                    sx={{
                        borderTop: "1px solid rgba(255,255,255,0.05)",
                        px: 3, py: 2,
                        backgroundColor: "rgba(255,255,255,0.015)",
                    }}
                >
                    <Typography sx={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: "12px", color: "rgba(255,255,255,0.25)", lineHeight: 1.6,
                    }}>
                        Your theme preference is saved locally and applied across all sessions on this device.
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};

export default General;