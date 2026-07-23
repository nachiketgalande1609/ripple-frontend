import { useState } from "react";
import { Box, Typography, TextField, Button, InputAdornment, IconButton, CircularProgress } from "@mui/material";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { changePassword } from "../../services/api";
import { useAppNotifications } from "../../hooks/useNotification";

const labelSx = {
    fontFamily: "'Inter', -apple-system, sans-serif",
    fontSize: "0.7rem",
    fontWeight: 500,
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    color: (t: any) => t.palette.text.disabled,
    mb: 0.875,
    display: "block",
};

const inputSx = {
    "& .MuiOutlinedInput-root": {
        borderRadius: "14px",
        backgroundColor: "var(--nav-bg)",
        fontSize: "0.875rem",
        color: (t: any) => t.palette.text.primary,
        boxShadow: "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)",
        transition: "box-shadow 0.35s cubic-bezier(0.4,0,0.2,1)",
        "& fieldset": { border: "none" },
        "&:hover fieldset": { border: "none" },
        "&.Mui-focused": {
            boxShadow: "inset 3px 3px 10px var(--nav-neo-shadow1), inset -3px -3px 10px var(--nav-neo-shadow2)",
        },
        "&.Mui-focused fieldset": { border: "none" },
    },
    "& .MuiFormLabel-root": {
        fontSize: "0.875rem",
        color: (t: any) => t.palette.text.disabled,
    },
};

const ChangePassword = () => {
    const [current, setCurrent] = useState("");
    const [next, setNext] = useState("");
    const [confirm, setConfirm] = useState("");
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNext, setShowNext] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const notifications = useAppNotifications();

    const handleSubmit = async () => {
        if (!current || !next || !confirm) {
            notifications.show("All fields are required.", { severity: "error", autoHideDuration: 3000 });
            return;
        }
        if (next.length < 6) {
            notifications.show("New password must be at least 6 characters.", { severity: "error", autoHideDuration: 3000 });
            return;
        }
        if (next !== confirm) {
            notifications.show("New passwords do not match.", { severity: "error", autoHideDuration: 3000 });
            return;
        }
        setLoading(true);
        try {
            await changePassword(current, next);
            notifications.show("Password updated successfully.", { severity: "success", autoHideDuration: 3000 });
            setCurrent(""); setNext(""); setConfirm("");
        } catch (err: any) {
            const msg = err?.response?.data?.error || "Failed to update password.";
            notifications.show(msg, { severity: "error", autoHideDuration: 3500 });
        } finally {
            setLoading(false);
        }
    };

    const eyeAdornment = (show: boolean, toggle: () => void) => (
        <InputAdornment position="end">
            <IconButton size="small" onClick={toggle} edge="end" sx={{ color: "text.disabled", mr: 0.25 }}>
                {show
                    ? <VisibilityOffRoundedIcon sx={{ fontSize: 17 }} />
                    : <VisibilityRoundedIcon sx={{ fontSize: 17 }} />}
            </IconButton>
        </InputAdornment>
    );

    const mismatch = next && confirm && next !== confirm;

    return (
        <Box sx={{ width: "100%", maxWidth: 620 }}>
            {/* Page header */}
            <Box sx={{ mb: 2.5 }}>
                <Typography sx={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "1rem", color: "text.primary", letterSpacing: "-0.3px" }}>
                    Change Password
                </Typography>
                <Typography sx={{ fontFamily: "'Inter', sans-serif", fontSize: "0.78rem", color: "text.disabled", mt: 0.3 }}>
                    Use a strong password you don't use elsewhere
                </Typography>
            </Box>

            {/* Form card */}
            <Box sx={{ borderRadius: "14px", border: "1px solid", borderColor: "divider", backgroundColor: "background.paper", overflow: "hidden" }}>
                <Box sx={{ px: 2.5, pt: 2.5, pb: 2.5, display: "flex", flexDirection: "column", gap: 2.5 }}>

                    {/* Current password */}
                    <Box>
                        <Typography component="label" sx={labelSx}>Current password</Typography>
                        <TextField
                            variant="outlined"
                            fullWidth
                            type={showCurrent ? "text" : "password"}
                            value={current}
                            onChange={(e) => setCurrent(e.target.value)}
                            sx={inputSx}
                            InputProps={{ endAdornment: eyeAdornment(showCurrent, () => setShowCurrent((p) => !p)) }}
                        />
                    </Box>

                    {/* New password */}
                    <Box>
                        <Typography component="label" sx={labelSx}>New password</Typography>
                        <TextField
                            variant="outlined"
                            fullWidth
                            type={showNext ? "text" : "password"}
                            value={next}
                            onChange={(e) => setNext(e.target.value)}
                            sx={inputSx}
                            InputProps={{ endAdornment: eyeAdornment(showNext, () => setShowNext((p) => !p)) }}
                        />
                    </Box>

                    {/* Confirm password */}
                    <Box>
                        <Typography component="label" sx={labelSx}>Confirm new password</Typography>
                        <TextField
                            variant="outlined"
                            fullWidth
                            type={showConfirm ? "text" : "password"}
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            sx={inputSx}
                            onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
                            InputProps={{ endAdornment: eyeAdornment(showConfirm, () => setShowConfirm((p) => !p)) }}
                        />
                        {mismatch && (
                            <Typography sx={{ fontSize: "0.73rem", color: "error.main", mt: 0.75 }}>
                                Passwords do not match
                            </Typography>
                        )}
                    </Box>
                </Box>

                {/* Footer */}
                <Box sx={{ px: 2.5, py: 1.75, borderTop: "1px solid", borderColor: "divider", display: "flex", justifyContent: "flex-end" }}>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        size="small"
                        sx={{
                            borderRadius: "14px",
                            textTransform: "none",
                            fontWeight: 600,
                            fontSize: "0.82rem",
                            px: 2.5,
                            py: 0.875,
                            border: "none",
                            backgroundColor: "var(--nav-bg)",
                            boxShadow: "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)",
                            color: "text.primary",
                            transition: "box-shadow 0.35s cubic-bezier(0.4,0,0.2,1)",
                            "&:hover": {
                                backgroundColor: "var(--nav-bg)",
                                boxShadow: "inset 3px 3px 10px var(--nav-neo-shadow1), inset -3px -3px 10px var(--nav-neo-shadow2)",
                            },
                        }}
                        startIcon={loading
                            ? <CircularProgress size={13} color="inherit" />
                            : <LockOutlinedIcon sx={{ fontSize: 15 }} />}
                    >
                        {loading ? "Updating…" : "Update Password"}
                    </Button>
                </Box>
            </Box>
        </Box>
    );
};

export default ChangePassword;
