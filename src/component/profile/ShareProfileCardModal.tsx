import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Box, Dialog, Typography, Avatar, IconButton, Button, Stack, CircularProgress } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import ShareRoundedIcon from "@mui/icons-material/ShareRounded";
import VerifiedIcon from "@mui/icons-material/Verified";
import { useTranslation } from "react-i18next";
import BlankProfileImage from "../../static/profile_blank.png";

interface Profile {
    id?: number;
    username: string;
    bio?: string;
    profile_picture?: string;
    followers_count: number;
    following_count: number;
    posts_count: number;
    is_verified?: boolean;
    pronouns?: string;
}

interface Props {
    open: boolean;
    onClose: () => void;
    profile: Profile | null;
}

const fmt = (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

export default function ShareProfileCardModal({ open, onClose, profile }: Props) {
    const { t } = useTranslation();
    const cardRef = useRef<HTMLDivElement>(null);
    const [downloading, setDownloading] = useState(false);

    const handleDownload = async () => {
        if (!cardRef.current || !profile) return;
        setDownloading(true);
        try {
            const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
            const link = document.createElement("a");
            link.download = `${profile.username}-profile-card.png`;
            link.href = dataUrl;
            link.click();
        } catch (e) {
            console.error("Failed to generate card image", e);
        } finally {
            setDownloading(false);
        }
    };

    const handleShare = async () => {
        if (!cardRef.current || !profile) return;
        setDownloading(true);
        try {
            const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
            const res = await fetch(dataUrl);
            const blob = await res.blob();
            const file = new File([blob], `${profile.username}-profile.png`, { type: "image/png" });
            if (navigator.canShare?.({ files: [file] })) {
                await navigator.share({ files: [file], title: `${profile.username} on Ripple` });
            } else {
                handleDownload();
            }
        } catch (e) {
            console.error("Share failed", e);
        } finally {
            setDownloading(false);
        }
    };

    if (!profile) return null;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="xs"
            BackdropProps={{ sx: { backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)" } }}
            sx={{ "& .MuiDialog-paper": { borderRadius: "28px", background: "transparent", boxShadow: "none", overflow: "visible" } }}
        >
            <Box sx={{ position: "relative" }}>
                {/* Close button */}
                <IconButton
                    onClick={onClose}
                    size="small"
                    sx={{
                        position: "absolute", top: -14, right: -14, zIndex: 10,
                        width: 32, height: 32, borderRadius: "50%",
                        backgroundColor: "background.paper",
                        border: "1px solid", borderColor: "divider",
                        color: "text.secondary",
                        "&:hover": { color: "text.primary" },
                    }}
                >
                    <CloseRoundedIcon sx={{ fontSize: 16 }} />
                </IconButton>

                {/* Profile Card */}
                <Box
                    ref={cardRef}
                    sx={{
                        borderRadius: "24px",
                        overflow: "hidden",
                        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)",
                        p: 3,
                        minHeight: 240,
                        position: "relative",
                    }}
                >
                    {/* Background decoration */}
                    <Box sx={{
                        position: "absolute", top: -40, right: -40,
                        width: 180, height: 180, borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)",
                        pointerEvents: "none",
                    }} />
                    <Box sx={{
                        position: "absolute", bottom: -30, left: -30,
                        width: 140, height: 140, borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(236,72,153,0.18) 0%, transparent 70%)",
                        pointerEvents: "none",
                    }} />

                    {/* Ripple watermark */}
                    <Typography sx={{
                        position: "absolute", top: 14, right: 18,
                        fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em",
                        textTransform: "uppercase", color: "rgba(255,255,255,0.3)",
                    }}>
                        ripple
                    </Typography>

                    {/* Avatar + name */}
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                        <Avatar
                            src={profile.profile_picture || BlankProfileImage}
                            sx={{ width: 64, height: 64, border: "3px solid rgba(255,255,255,0.2)" }}
                        />
                        <Box>
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                                <Typography sx={{ fontWeight: 700, fontSize: "1.1rem", color: "#fff" }}>
                                    {profile.username}
                                </Typography>
                                {profile.is_verified && <VerifiedIcon sx={{ fontSize: 16, color: "#60a5fa" }} />}
                            </Stack>
                            {profile.pronouns && (
                                <Typography sx={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", mt: 0.25 }}>
                                    {profile.pronouns}
                                </Typography>
                            )}
                            {profile.bio && (
                                <Typography sx={{
                                    fontSize: "0.78rem", color: "rgba(255,255,255,0.65)", mt: 0.5,
                                    lineHeight: 1.4, maxWidth: 200,
                                    overflow: "hidden", display: "-webkit-box",
                                    WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                                }}>
                                    {profile.bio}
                                </Typography>
                            )}
                        </Box>
                    </Stack>

                    {/* Stats row */}
                    <Box sx={{
                        display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
                        borderRadius: "14px",
                        background: "rgba(255,255,255,0.07)",
                        backdropFilter: "blur(8px)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        overflow: "hidden",
                    }}>
                        {[
                            { label: "Posts", value: profile.posts_count },
                            { label: "Followers", value: profile.followers_count },
                            { label: "Following", value: profile.following_count },
                        ].map((s, i) => (
                            <Box key={s.label} sx={{
                                py: 1.5, textAlign: "center",
                                borderRight: i < 2 ? "1px solid rgba(255,255,255,0.1)" : "none",
                            }}>
                                <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: "#fff", lineHeight: 1.2 }}>
                                    {fmt(s.value)}
                                </Typography>
                                <Typography sx={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.45)", mt: 0.25 }}>
                                    {s.label}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>

                {/* Action buttons */}
                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                    <Button
                        fullWidth
                        onClick={handleDownload}
                        disabled={downloading}
                        startIcon={downloading ? <CircularProgress size={14} /> : <DownloadRoundedIcon />}
                        sx={{
                            textTransform: "none", fontWeight: 600, borderRadius: "14px",
                            py: 1.2, fontSize: "0.85rem",
                            backgroundColor: "var(--nav-bg)",
                            color: "text.primary",
                            border: "none",
                            boxShadow: "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)",
                            "&:hover": { backgroundColor: "var(--nav-bg)", boxShadow: "inset 3px 3px 10px var(--nav-neo-shadow1), inset -3px -3px 10px var(--nav-neo-shadow2)" },
                        }}
                    >
                        {t("profile.downloadCard")}
                    </Button>
                    {"share" in navigator && (
                        <Button
                            onClick={handleShare}
                            disabled={downloading}
                            sx={{
                                minWidth: 48, borderRadius: "14px", py: 1.2,
                                backgroundColor: "var(--nav-bg)",
                                color: "text.secondary", border: "none",
                                boxShadow: "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)",
                                "&:hover": { backgroundColor: "var(--nav-bg)", color: "text.primary", boxShadow: "inset 3px 3px 10px var(--nav-neo-shadow1), inset -3px -3px 10px var(--nav-neo-shadow2)" },
                            }}
                        >
                            <ShareRoundedIcon sx={{ fontSize: 18 }} />
                        </Button>
                    )}
                </Stack>
            </Box>
        </Dialog>
    );
}
