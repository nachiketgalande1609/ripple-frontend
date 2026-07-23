import { useState } from "react";
import {
    Box, Typography, TextField, Button, CircularProgress,
    Dialog, InputAdornment, IconButton,
} from "@mui/material";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import PauseCircleOutlineRoundedIcon from "@mui/icons-material/PauseCircleOutlineRounded";
import DeleteForeverRoundedIcon from "@mui/icons-material/DeleteForeverRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { deactivateAccount, deleteAccount } from "../../services/api";
import { useAppNotifications } from "../../hooks/useNotification";
import { useGlobalStore } from "../../store/store";

const fieldSx = {
    "& .MuiOutlinedInput-root": {
        borderRadius: "14px",
        backgroundColor: "var(--nav-bg)",
        boxShadow: "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)",
        "& fieldset": { border: "none" },
        "&:hover fieldset": { border: "none" },
        "&.Mui-focused fieldset": { border: "1px solid", borderColor: "divider" },
    },
    "& .MuiInputLabel-root": { fontSize: "0.85rem" },
};

const dialogPaperSx = {
    borderRadius: "28px",
    backgroundColor: "background.paper",
    border: "1px solid",
    borderColor: "divider",
    boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
    p: 3,
    maxWidth: 380,
    width: "100%",
};

type Mode = "deactivate" | "delete";

interface ConfirmDialogProps {
    open: boolean;
    mode: Mode;
    onClose: () => void;
    onConfirm: (password: string) => Promise<void>;
    loading: boolean;
}

const ConfirmDialog = ({ open, mode, onClose, onConfirm, loading }: ConfirmDialogProps) => {
    const [password, setPassword] = useState("");
    const [show, setShow] = useState(false);

    const isDelete = mode === "delete";

    const handleSubmit = async () => {
        if (!password) return;
        await onConfirm(password);
        setPassword("");
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            BackdropProps={{ sx: { backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.5)" } }}
            PaperProps={{ sx: dialogPaperSx }}
        >
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box sx={{ width: 40, height: 40, borderRadius: "12px", bgcolor: isDelete ? "rgba(211,47,47,0.1)" : "rgba(237,108,2,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <WarningAmberRoundedIcon sx={{ fontSize: 20, color: isDelete ? "error.main" : "warning.main" }} />
                    </Box>
                    <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", color: "text.primary" }}>
                            {isDelete ? "Delete account?" : "Deactivate account?"}
                        </Typography>
                        <Typography sx={{ fontSize: "0.75rem", color: "text.disabled", mt: 0.2 }}>
                            {isDelete
                                ? "This is permanent and cannot be undone."
                                : "You can reactivate by logging in again."}
                        </Typography>
                    </Box>
                </Box>

                <TextField
                    label="Enter your password to confirm"
                    type={show ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    fullWidth
                    size="small"
                    sx={fieldSx}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton size="small" onClick={() => setShow((p) => !p)} edge="end" sx={{ color: "text.disabled" }}>
                                    {show ? <VisibilityOffRoundedIcon sx={{ fontSize: 18 }} /> : <VisibilityRoundedIcon sx={{ fontSize: 18 }} />}
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                />

                <Box sx={{ display: "flex", gap: 1.5 }}>
                    <Button
                        onClick={onClose}
                        fullWidth
                        sx={{
                            borderRadius: "14px", textTransform: "none", fontWeight: 500, fontSize: "0.85rem",
                            border: "none", backgroundColor: "var(--nav-bg)",
                            boxShadow: "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)",
                            color: "text.secondary",
                            "&:hover": { backgroundColor: "var(--nav-bg)", boxShadow: "inset 3px 3px 10px var(--nav-neo-shadow1), inset -3px -3px 10px var(--nav-neo-shadow2)" },
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading || !password}
                        fullWidth
                        sx={{
                            borderRadius: "14px", textTransform: "none", fontWeight: 600, fontSize: "0.85rem",
                            bgcolor: isDelete ? "error.main" : "warning.main",
                            color: "#fff",
                            "&:hover": { bgcolor: isDelete ? "error.dark" : "warning.dark" },
                            "&.Mui-disabled": { bgcolor: isDelete ? "rgba(211,47,47,0.4)" : "rgba(237,108,2,0.4)", color: "rgba(255,255,255,0.6)" },
                        }}
                        startIcon={loading ? <CircularProgress size={13} color="inherit" /> : null}
                    >
                        {loading ? "Please wait…" : isDelete ? "Delete" : "Deactivate"}
                    </Button>
                </Box>
            </Box>
        </Dialog>
    );
};

const ActionCard = ({ icon, title, description, buttonLabel, buttonColor, onClick }: {
    icon: React.ReactNode; title: string; description: string;
    buttonLabel: string; buttonColor: "warning" | "error"; onClick: () => void;
}) => (
    <Box sx={{ p: 2.5, borderRadius: "20px", border: "1px solid", borderColor: "divider", backgroundColor: "var(--nav-bg)", mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
            <Box sx={{ width: 42, height: 42, borderRadius: "12px", bgcolor: buttonColor === "error" ? "rgba(211,47,47,0.08)" : "rgba(237,108,2,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {icon}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 600, fontSize: "0.9rem", color: "text.primary", mb: 0.4 }}>{title}</Typography>
                <Typography sx={{ fontSize: "0.78rem", color: "text.disabled", lineHeight: 1.6, mb: 1.5 }}>{description}</Typography>
                <Button
                    onClick={onClick}
                    size="small"
                    sx={{
                        borderRadius: "10px", textTransform: "none", fontWeight: 600, fontSize: "0.78rem",
                        color: buttonColor === "error" ? "error.main" : "warning.main",
                        border: "1px solid",
                        borderColor: buttonColor === "error" ? "rgba(211,47,47,0.3)" : "rgba(237,108,2,0.3)",
                        px: 2, py: 0.6,
                        "&:hover": { bgcolor: buttonColor === "error" ? "rgba(211,47,47,0.08)" : "rgba(237,108,2,0.08)", borderColor: buttonColor === "error" ? "error.main" : "warning.main" },
                    }}
                >
                    {buttonLabel}
                </Button>
            </Box>
        </Box>
    </Box>
);

const AccountManagement = () => {
    const [dialogMode, setDialogMode] = useState<Mode | null>(null);
    const [loading, setLoading] = useState(false);
    const notifications = useAppNotifications();
    const setUser = useGlobalStore((s) => s.setUser);

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        window.location.href = "/login";
    };

    const handleConfirm = async (password: string) => {
        setLoading(true);
        try {
            if (dialogMode === "deactivate") {
                await deactivateAccount(password);
                notifications.show("Account deactivated. Log in anytime to reactivate.", { severity: "success", autoHideDuration: 4000 });
                setTimeout(logout, 1500);
            } else {
                await deleteAccount(password);
                notifications.show("Account permanently deleted.", { severity: "success", autoHideDuration: 3000 });
                setTimeout(logout, 1500);
            }
            setDialogMode(null);
        } catch (err: any) {
            const msg = err?.response?.data?.error || "Something went wrong.";
            notifications.show(msg, { severity: "error", autoHideDuration: 3500 });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ width: "100%", maxWidth: 620 }}>
            <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontSize: "0.95rem", fontWeight: 600, color: "text.primary" }}>
                    Account Management
                </Typography>
                <Typography sx={{ fontSize: "0.78rem", color: "text.disabled", mt: 0.25 }}>
                    Manage your account status
                </Typography>
            </Box>

            <ActionCard
                icon={<PauseCircleOutlineRoundedIcon sx={{ fontSize: 22, color: "warning.main" }} />}
                title="Deactivate Account"
                description="Temporarily hide your profile, posts, and activity. Your data is preserved and you can reactivate by logging in again."
                buttonLabel="Deactivate account"
                buttonColor="warning"
                onClick={() => setDialogMode("deactivate")}
            />

            <ActionCard
                icon={<DeleteForeverRoundedIcon sx={{ fontSize: 22, color: "error.main" }} />}
                title="Delete Account"
                description="Permanently delete your account and all associated data including posts, messages, and followers. This cannot be undone."
                buttonLabel="Delete account"
                buttonColor="error"
                onClick={() => setDialogMode("delete")}
            />

            <ConfirmDialog
                open={dialogMode !== null}
                mode={dialogMode || "deactivate"}
                onClose={() => setDialogMode(null)}
                onConfirm={handleConfirm}
                loading={loading}
            />
        </Box>
    );
};

export default AccountManagement;
