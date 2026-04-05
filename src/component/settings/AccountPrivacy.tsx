import { useState } from "react";
import { Box, Switch, Typography, CircularProgress } from "@mui/material";
import { updatePrivacy } from "../../services/api";
import { useNotifications } from "@toolpad/core/useNotifications";

const AccountPrivacy = () => {
    const notifications = useNotifications();
    const [loading, setLoading] = useState(false);
    const currentUser = localStorage.getItem("user")
        ? JSON.parse(localStorage.getItem("user") || "")
        : {};
    const [isPrivate, setIsPrivate] = useState(currentUser.is_private);

    const handleToggle = async () => {
        const newPrivacyStatus = !isPrivate;
        setIsPrivate(newPrivacyStatus);
        setLoading(true);

        try {
            const res = await updatePrivacy(newPrivacyStatus);
            if (res.success) {
                currentUser.is_private = newPrivacyStatus;
                localStorage.setItem("user", JSON.stringify(currentUser));
                notifications.show(
                    `Account changed to ${newPrivacyStatus ? "Private" : "Public"}`,
                    { severity: "success", autoHideDuration: 3000 }
                );
            }
        } catch (error) {
            console.error("Error updating privacy setting:", error);
            setIsPrivate(!newPrivacyStatus);
        } finally {
            setLoading(false);
        }
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
            {/* Section header */}
            <Box>
                <Typography
                    sx={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: "20px",
                        fontWeight: 700,
                        color: "#ffffff",
                        letterSpacing: "-0.4px",
                        mb: 0.5,
                    }}
                >
                    Account Privacy
                </Typography>
                <Typography
                    sx={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: "13px",
                        color: "rgba(255,255,255,0.35)",
                    }}
                >
                    Control who can see your profile and content.
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
                        {/* Icon */}
                        <Box
                            sx={{
                                width: 38,
                                height: 38,
                                borderRadius: "10px",
                                backgroundColor: isPrivate
                                    ? "rgba(255,255,255,0.07)"
                                    : "rgba(255,255,255,0.04)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "17px",
                                flexShrink: 0,
                                transition: "background 0.2s",
                            }}
                        >
                            {isPrivate ? "🔒" : "🌐"}
                        </Box>

                        <Box>
                            <Typography
                                sx={{
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontSize: "14px",
                                    fontWeight: 600,
                                    color: "#ffffff",
                                    letterSpacing: "-0.1px",
                                }}
                            >
                                {isPrivate ? "Private Account" : "Public Account"}
                            </Typography>
                            <Typography
                                sx={{
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontSize: "12px",
                                    color: "rgba(255,255,255,0.35)",
                                    mt: 0.25,
                                }}
                            >
                                {isPrivate
                                    ? "Only approved followers can see your posts"
                                    : "Anyone can view your profile and posts"}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Toggle or spinner */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexShrink: 0 }}>
                        {loading && (
                            <CircularProgress
                                size={14}
                                thickness={5}
                                sx={{ color: "rgba(255,255,255,0.3)" }}
                            />
                        )}
                        <Switch
                            checked={isPrivate}
                            onChange={handleToggle}
                            disabled={loading}
                            sx={{
                                "& .MuiSwitch-switchBase.Mui-checked": {
                                    color: "#fff",
                                },
                                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                                    backgroundColor: "rgba(255,255,255,0.4)",
                                    opacity: 1,
                                },
                                "& .MuiSwitch-track": {
                                    backgroundColor: "rgba(255,255,255,0.12)",
                                    opacity: 1,
                                },
                                "& .MuiSwitch-thumb": {
                                    boxShadow: "0 1px 4px rgba(0,0,0,0.5)",
                                },
                            }}
                        />
                    </Box>
                </Box>

                {/* Divider + info banner */}
                <Box
                    sx={{
                        borderTop: "1px solid rgba(255,255,255,0.05)",
                        px: 3,
                        py: 2,
                        backgroundColor: "rgba(255,255,255,0.015)",
                    }}
                >
                    <Typography
                        sx={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: "12px",
                            color: "rgba(255,255,255,0.25)",
                            lineHeight: 1.6,
                        }}
                    >
                        {isPrivate
                            ? "When your account is private, only people you approve can follow you and see your content."
                            : "When your account is public, anyone on the platform can view your profile, posts, and activity."}
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};

export default AccountPrivacy;