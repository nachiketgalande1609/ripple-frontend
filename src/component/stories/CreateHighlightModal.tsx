import { useState, useEffect } from "react";
import {
    Box, Dialog, DialogContent, Typography, TextField, Button,
    CircularProgress, IconButton, Stack, Skeleton,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import PlayCircleFilledRoundedIcon from "@mui/icons-material/PlayCircleFilledRounded";
import { useTranslation } from "react-i18next";
import { createHighlight, updateHighlight, getMyStoryArchive } from "../../services/api";
import { useAppNotifications } from "../../hooks/useNotification";
import { type Highlight } from "./HighlightViewer";

interface StoryArchiveItem {
    id: number;
    media_url: string;
    media_type: "image" | "video";
    caption?: string;
    created_at: string;
}

interface Props {
    open: boolean;
    onClose: () => void;
    onCreated: () => void;
    editHighlight?: Highlight | null;
}

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
};

export default function CreateHighlightModal({ open, onClose, onCreated, editHighlight }: Props) {
    const { t } = useTranslation();
    const notifications = useAppNotifications();
    const isEditMode = !!editHighlight;

    const [step, setStep] = useState<"select" | "name">("select");
    const [stories, setStories] = useState<StoryArchiveItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState<Set<string>>(new Set()); // keyed by media_url
    const [title, setTitle] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!open) return;
        setStep("select");
        setTitle(editHighlight?.title ?? "");
        setLoading(true);
        getMyStoryArchive()
            .then(res => {
                const archive: StoryArchiveItem[] = res.data ?? [];
                setStories(archive);
                // Pre-select stories already in the highlight
                if (editHighlight) {
                    const preSelected = new Set(editHighlight.items.map(i => i.media_url));
                    setSelected(preSelected);
                } else {
                    setSelected(new Set());
                }
            })
            .catch(() => setStories([]))
            .finally(() => setLoading(false));
    }, [open, editHighlight]);

    const toggleSelect = (media_url: string) => {
        setSelected(prev => {
            const next = new Set(prev);
            next.has(media_url) ? next.delete(media_url) : next.add(media_url);
            return next;
        });
    };

    const handleSave = async () => {
        if (!title.trim() || selected.size === 0) return;
        setSaving(true);
        try {
            const items = stories
                .filter(s => selected.has(s.media_url))
                .map(s => ({ media_url: s.media_url, media_type: s.media_type }));

            if (isEditMode && editHighlight) {
                await updateHighlight(editHighlight.id, { title: title.trim(), items });
            } else {
                await createHighlight(title.trim(), items);
            }

            notifications.show(t("profile.highlightCreated"), { severity: "success", autoHideDuration: 3000 });
            onCreated();
            onClose();
        } catch {
            notifications.show(t("common.error"), { severity: "error", autoHideDuration: 3000 });
        } finally {
            setSaving(false);
        }
    };

    const selectedStories = stories.filter(s => selected.has(s.media_url));

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="xs"
            BackdropProps={{ sx: { backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(10px)" } }}
            sx={{ "& .MuiDialog-paper": { borderRadius: "28px", backgroundColor: "background.paper", border: "1px solid", borderColor: "divider", boxShadow: "0 24px 60px rgba(0,0,0,0.4)", overflow: "hidden" } }}
        >
            <DialogContent sx={{ p: 0 }}>
                {/* ── Header ── */}
                <Stack direction="row" alignItems="center" sx={{ px: 2, py: 1.75, borderBottom: "1px solid", borderColor: "divider" }}>
                    {step === "name" ? (
                        <IconButton size="small" onClick={() => setStep("select")} sx={{ mr: 0.5, color: "text.secondary" }}>
                            <ChevronLeftRoundedIcon sx={{ fontSize: 20 }} />
                        </IconButton>
                    ) : (
                        <IconButton size="small" onClick={onClose} sx={{ mr: 0.5, color: "text.disabled" }}>
                            <CloseRoundedIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    )}
                    <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", flex: 1 }}>
                        {step === "select"
                            ? (isEditMode ? t("profile.editHighlight") : t("profile.newHighlight"))
                            : t("profile.highlightTitle")}
                    </Typography>
                    {step === "select" && selected.size > 0 && (
                        <Button
                            size="small"
                            onClick={() => setStep("name")}
                            sx={{
                                textTransform: "none", fontWeight: 600, fontSize: "0.82rem",
                                borderRadius: "20px", px: 1.75, py: 0.5, color: "primary.main",
                                "&:hover": { bgcolor: (t) => `${t.palette.primary.main}14` },
                            }}
                        >
                            {t("common.next")} ({selected.size})
                        </Button>
                    )}
                </Stack>

                {/* ── Step 1: Story grid ── */}
                {step === "select" && (
                    <Box sx={{ p: 2, maxHeight: "60vh", overflowY: "auto" }}>
                        {loading ? (
                            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1 }}>
                                {Array.from({ length: 9 }).map((_, i) => (
                                    <Skeleton key={i} variant="rounded" sx={{ aspectRatio: "9/16", borderRadius: "10px", bgcolor: "action.hover" }} />
                                ))}
                            </Box>
                        ) : stories.length === 0 ? (
                            <Box sx={{ py: 6, textAlign: "center" }}>
                                <Typography sx={{ fontSize: "0.85rem", color: "text.disabled" }}>
                                    No stories uploaded yet
                                </Typography>
                            </Box>
                        ) : (
                            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1 }}>
                                {stories.map(story => {
                                    const isSelected = selected.has(story.media_url);
                                    return (
                                        <Box
                                            key={story.id}
                                            onClick={() => toggleSelect(story.media_url)}
                                            sx={{
                                                position: "relative", aspectRatio: "9/16",
                                                borderRadius: "10px", overflow: "hidden", cursor: "pointer",
                                                outline: isSelected ? "2.5px solid" : "2.5px solid transparent",
                                                outlineColor: isSelected ? "primary.main" : "transparent",
                                                transition: "outline-color 0.15s, transform 0.15s",
                                                "&:hover": { transform: "scale(1.02)" },
                                            }}
                                        >
                                            {story.media_type === "video" ? (
                                                <video src={story.media_url} muted style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                                            ) : (
                                                <Box component="img" src={story.media_url} sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                                            )}
                                            <Box sx={{ position: "absolute", inset: 0, bgcolor: isSelected ? "rgba(0,0,0,0.3)" : "transparent", transition: "background-color 0.15s" }} />
                                            {story.media_type === "video" && (
                                                <PlayCircleFilledRoundedIcon sx={{ position: "absolute", top: 5, left: 5, fontSize: 16, color: "rgba(255,255,255,0.8)" }} />
                                            )}
                                            {isSelected && (
                                                <CheckCircleRoundedIcon sx={{ position: "absolute", top: 5, right: 5, fontSize: 20, color: "primary.main", filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.6))" }} />
                                            )}
                                        </Box>
                                    );
                                })}
                            </Box>
                        )}
                    </Box>
                )}

                {/* ── Step 2: Title + save ── */}
                {step === "name" && (
                    <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 2 }}>
                        {/* Selected previews */}
                        {selectedStories.length > 0 && (
                            <Box sx={{ display: "flex", gap: 0.75, overflowX: "auto", pb: 0.5, "&::-webkit-scrollbar": { display: "none" } }}>
                                {selectedStories.map(s => (
                                    <Box key={s.id} component="img" src={s.media_url}
                                        sx={{ width: 52, height: 52, borderRadius: "10px", objectFit: "cover", flexShrink: 0, border: "1px solid", borderColor: "divider" }}
                                    />
                                ))}
                            </Box>
                        )}

                        <Box>
                            <Typography sx={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "text.disabled", mb: 0.875 }}>
                                {t("profile.highlightTitle")}
                            </Typography>
                            <TextField
                                fullWidth autoFocus variant="outlined"
                                placeholder={t("profile.highlightTitle")}
                                value={title}
                                onChange={(e) => setTitle(e.target.value.slice(0, 30))}
                                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                                inputProps={{ maxLength: 30 }}
                                sx={inputSx}
                            />
                        </Box>

                        <Button
                            fullWidth onClick={handleSave}
                            disabled={!title.trim() || saving}
                            sx={{
                                textTransform: "none", fontWeight: 600, borderRadius: "14px", py: 1.25, fontSize: "0.9rem",
                                backgroundColor: "var(--nav-bg)", color: "text.primary", border: "none",
                                boxShadow: "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)",
                                "&:hover": { backgroundColor: "var(--nav-bg)", boxShadow: "inset 3px 3px 10px var(--nav-neo-shadow1), inset -3px -3px 10px var(--nav-neo-shadow2)" },
                                "&:disabled": { opacity: 0.4 },
                            }}
                        >
                            {saving ? <CircularProgress size={18} /> : isEditMode ? t("common.save") : t("profile.createHighlight")}
                        </Button>
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
}
