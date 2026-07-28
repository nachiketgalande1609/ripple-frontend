import { useState, useEffect } from "react";
import {
    Box, Typography, TextField, Button, CircularProgress,
    Dialog, InputAdornment, IconButton, Avatar,
} from "@mui/material";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import PauseCircleOutlineRoundedIcon from "@mui/icons-material/PauseCircleOutlineRounded";
import DeleteForeverRoundedIcon from "@mui/icons-material/DeleteForeverRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { deactivateAccount, deleteAccount } from "../../services/api";
import { useAppNotifications } from "../../hooks/useNotification";
import { useTranslation } from "react-i18next";
import { useGlobalStore } from "../../store/store";
import { getAccounts, switchAccount, StoredAccount } from "../../utils/accounts";
import AddAccountDialog from "../AddAccountDialog";
import BlankProfileImage from "../../static/profile_blank.png";

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
    const { t } = useTranslation();
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
                            {isDelete ? t("settings.deleteConfirmTitle") : t("settings.deactivateConfirmTitle")}
                        </Typography>
                        <Typography sx={{ fontSize: "0.75rem", color: "text.disabled", mt: 0.2 }}>
                            {isDelete
                                ? t("settings.deleteConfirmDesc")
                                : t("settings.deactivateConfirmDesc")}
                        </Typography>
                    </Box>
                </Box>

                <TextField
                    label={t("settings.enterPasswordConfirm")}
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
                        {t("common.cancel")}
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
                        {loading ? t("settings.pleaseWait") : isDelete ? t("common.delete") : t("common.confirm")}
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

const AccountsSection = () => {
    const { t } = useTranslation();
    const currentUser = useGlobalStore((s) => s.user);
    const [accounts, setAccounts] = useState<StoredAccount[]>([]);
    const [switching, setSwitching] = useState<string | null>(null);
    const [addOpen, setAddOpen] = useState(false);

    useEffect(() => { setAccounts(getAccounts()); }, []);

    const handleSwitch = (id: string) => {
        if (String(id) === String(currentUser?.id)) return;
        setSwitching(id);
        switchAccount(id);
        window.location.href = "/";
    };

    const otherAccounts = accounts.filter((a) => String(a.id) !== String(currentUser?.id));

    return (
        <Box sx={{ mb: 4 }}>
            <Box sx={{ mb: 2 }}>
                <Typography sx={{ fontSize: "0.95rem", fontWeight: 600, color: "text.primary" }}>
                    {t("settings.linkedAccountsTitle")}
                </Typography>
                <Typography sx={{ fontSize: "0.78rem", color: "text.disabled", mt: 0.25 }}>
                    {t("settings.linkedAccountsSubtitle")}
                </Typography>
            </Box>

            {/* Current account */}
            {currentUser && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, p: 2, mb: 1.5, borderRadius: "16px", border: "1px solid", borderColor: "divider", backgroundColor: "var(--nav-bg)", boxShadow: "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)" }}>
                    <Avatar src={currentUser.profile_picture_url || BlankProfileImage} sx={{ width: 42, height: 42, flexShrink: 0 }} onError={(e) => { (e.target as HTMLImageElement).src = BlankProfileImage; }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography noWrap sx={{ fontWeight: 600, fontSize: "0.9rem", color: "text.primary" }}>{currentUser.username}</Typography>
                        <Typography noWrap sx={{ fontSize: "0.75rem", color: "text.disabled" }}>{currentUser.email}</Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexShrink: 0 }}>
                        <CheckRoundedIcon sx={{ fontSize: 15, color: "#10b981" }} />
                        <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: "#10b981" }}>{t("settings.active")}</Typography>
                    </Box>
                </Box>
            )}

            {/* Other accounts */}
            {otherAccounts.map((acc) => (
                <Box
                    key={acc.id}
                    sx={{ display: "flex", alignItems: "center", gap: 2, p: 2, mb: 1.5, borderRadius: "16px", border: "1px solid", borderColor: "divider", backgroundColor: "background.paper", opacity: switching === acc.id ? 0.6 : 1, transition: "opacity 0.2s" }}
                >
                    <Avatar src={acc.profile_picture_url || BlankProfileImage} sx={{ width: 42, height: 42, flexShrink: 0 }} onError={(e) => { (e.target as HTMLImageElement).src = BlankProfileImage; }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography noWrap sx={{ fontWeight: 600, fontSize: "0.9rem", color: "text.primary" }}>{acc.username}</Typography>
                        <Typography noWrap sx={{ fontSize: "0.75rem", color: "text.disabled" }}>{acc.email}</Typography>
                    </Box>
                    <Button
                        size="small"
                        onClick={() => handleSwitch(acc.id)}
                        sx={{
                            borderRadius: "10px", textTransform: "none", fontWeight: 600, fontSize: "0.78rem",
                            border: "none", backgroundColor: "var(--nav-bg)",
                            boxShadow: "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)",
                            color: "text.secondary", px: 2, flexShrink: 0,
                            "&:hover": { backgroundColor: "var(--nav-bg)", boxShadow: "inset 3px 3px 10px var(--nav-neo-shadow1), inset -3px -3px 10px var(--nav-neo-shadow2)" },
                        }}
                    >
                        {t("quickPanel.switchAccount")}
                    </Button>
                </Box>
            ))}

            {/* Add account */}
            <Box
                onClick={() => setAddOpen(true)}
                sx={{ display: "flex", alignItems: "center", gap: 2, p: 2, borderRadius: "16px", border: "1.5px dashed", borderColor: "divider", cursor: "pointer", transition: "border-color 0.2s, background 0.2s", "&:hover": { borderColor: "text.disabled", backgroundColor: "action.hover" } }}
            >
                <Box sx={{ width: 42, height: 42, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px dashed", borderColor: "divider", flexShrink: 0 }}>
                    <AddRoundedIcon sx={{ fontSize: 20, color: "text.disabled" }} />
                </Box>
                <Typography sx={{ fontSize: "0.9rem", fontWeight: 500, color: "text.secondary" }}>{t("quickPanel.addAccount")}</Typography>
            </Box>

            <AddAccountDialog open={addOpen} onClose={() => setAddOpen(false)} />
        </Box>
    );
};

const AccountManagement = () => {
    const { t } = useTranslation();
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
                notifications.show(t("settings.deactivated"), { severity: "success", autoHideDuration: 4000 });
                setTimeout(logout, 1500);
            } else {
                await deleteAccount(password);
                notifications.show(t("settings.deleted"), { severity: "success", autoHideDuration: 3000 });
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
            <AccountsSection />

            <Box sx={{ borderTop: "1px solid", borderColor: "divider", mb: 3 }} />

            <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontSize: "0.95rem", fontWeight: 600, color: "text.primary" }}>
                    {t("settings.accountTitle")}
                </Typography>
                <Typography sx={{ fontSize: "0.78rem", color: "text.disabled", mt: 0.25 }}>
                    {t("settings.accountSubtitle")}
                </Typography>
            </Box>

            <ActionCard
                icon={<PauseCircleOutlineRoundedIcon sx={{ fontSize: 22, color: "warning.main" }} />}
                title={t("settings.deactivateTitle")}
                description={t("settings.deactivateDesc")}
                buttonLabel={t("settings.deactivateBtn")}
                buttonColor="warning"
                onClick={() => setDialogMode("deactivate")}
            />

            <ActionCard
                icon={<DeleteForeverRoundedIcon sx={{ fontSize: 22, color: "error.main" }} />}
                title={t("settings.deleteTitle")}
                description={t("settings.deleteDesc")}
                buttonLabel={t("settings.deleteBtn")}
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
