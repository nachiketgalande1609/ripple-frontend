import { useState } from "react";
import {
    Box, Dialog, DialogContent, Typography, TextField, Button,
    CircularProgress, IconButton, Stack,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import { useTranslation } from "react-i18next";
import { createHighlight } from "../../services/api";
import { useAppNotifications } from "../../hooks/useNotification";

interface Props {
    open: boolean;
    onClose: () => void;
    onCreated: () => void;
}

const PRESET_EMOJIS = ["✨", "🌟", "❤️", "🎉", "🌸", "🔥", "🎵", "🌊", "🏆", "💫", "🦋", "🌙"];

export default function CreateHighlightModal({ open, onClose, onCreated }: Props) {
    const { t } = useTranslation();
    const notifications = useAppNotifications();
    const [title, setTitle] = useState("");
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!title.trim()) return;
        setLoading(true);
        try {
            await createHighlight(title.trim(), []);
            notifications.show(t("profile.highlightCreated"), { severity: "success", autoHideDuration: 3000 });
            setTitle("");
            onCreated();
            onClose();
        } catch (e) {
            console.error(e);
            notifications.show(t("common.error"), { severity: "error", autoHideDuration: 3000 });
        } finally {
            setLoading(false);
        }
    };

    const inputSx = {
        "& .MuiOutlinedInput-root": {
            borderRadius: "14px",
            backgroundColor: "var(--nav-bg)",
            fontSize: "0.9rem",
            boxShadow: "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)",
            transition: "box-shadow 0.3s",
            "& fieldset": { border: "none" },
            "&.Mui-focused": { boxShadow: "inset 3px 3px 10px var(--nav-neo-shadow1), inset -3px -3px 10px var(--nav-neo-shadow2)" },
            "&.Mui-focused fieldset": { border: "none" },
        },
        "& .MuiFormLabel-root": { fontSize: "0.875rem", color: (t: any) => t.palette.text.disabled },
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="xs"
            BackdropProps={{ sx: { backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(10px)" } }}
            sx={{ "& .MuiDialog-paper": { borderRadius: "28px", backgroundColor: "background.paper", border: "1px solid", borderColor: "divider", boxShadow: "0 24px 60px rgba(0,0,0,0.4)" } }}
        >
            <DialogContent sx={{ p: 3 }}>
                {/* Header */}
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2.5 }}>
                    <Stack direction="row" alignItems="center" gap={1}>
                        <Box sx={{ width: 32, height: 32, borderRadius: "10px", backgroundColor: "action.hover", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <AutoAwesomeRoundedIcon sx={{ fontSize: 17, color: "text.secondary" }} />
                        </Box>
                        <Typography sx={{ fontWeight: 700, fontSize: "1rem" }}>{t("profile.newHighlight")}</Typography>
                    </Stack>
                    <IconButton size="small" onClick={onClose} sx={{ color: "text.disabled" }}>
                        <CloseRoundedIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                </Stack>

                {/* Title input */}
                <Typography sx={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "text.disabled", mb: 0.875 }}>
                    {t("profile.highlightTitle")}
                </Typography>
                <TextField
                    fullWidth
                    autoFocus
                    variant="outlined"
                    placeholder={t("profile.highlightTitle")}
                    value={title}
                    onChange={(e) => setTitle(e.target.value.slice(0, 30))}
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                    inputProps={{ maxLength: 30 }}
                    sx={{ ...inputSx, mb: 2 }}
                />

                {/* Emoji presets */}
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 2.5 }}>
                    {PRESET_EMOJIS.map(emoji => (
                        <Box
                            key={emoji}
                            onClick={() => setTitle(t => t + emoji)}
                            sx={{
                                width: 36, height: 36, borderRadius: "10px", cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem",
                                backgroundColor: "action.hover", transition: "transform 0.15s",
                                "&:hover": { transform: "scale(1.2)" },
                            }}
                        >
                            {emoji}
                        </Box>
                    ))}
                </Box>

                {/* Create button */}
                <Button
                    fullWidth
                    onClick={handleCreate}
                    disabled={!title.trim() || loading}
                    sx={{
                        textTransform: "none", fontWeight: 600, borderRadius: "14px", py: 1.25, fontSize: "0.9rem",
                        backgroundColor: "var(--nav-bg)", color: "text.primary", border: "none",
                        boxShadow: "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)",
                        "&:hover": { backgroundColor: "var(--nav-bg)", boxShadow: "inset 3px 3px 10px var(--nav-neo-shadow1), inset -3px -3px 10px var(--nav-neo-shadow2)" },
                        "&:disabled": { opacity: 0.4 },
                    }}
                >
                    {loading ? <CircularProgress size={18} /> : t("profile.createHighlight")}
                </Button>
            </DialogContent>
        </Dialog>
    );
}
