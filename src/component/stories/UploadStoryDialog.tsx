import { useState, useEffect } from "react";
import {
    Box, Button, Modal, TextField, Typography, Backdrop, Fade,
    IconButton, CircularProgress, useTheme, useMediaQuery, LinearProgress,
} from "@mui/material";
import { useDropzone } from "react-dropzone";
import { uploadStory } from "../../services/api";
import EmojiPicker, { Theme } from "emoji-picker-react";
import {
    SentimentSatisfiedAlt as EmojiIcon, Close,
    PlayCircleOutline as VideoIcon, ImageOutlined as ImageIcon,
    FileUploadOutlined as UploadIcon, EditOutlined as EditIcon,
    DeleteOutline as DeleteIcon, Send as SendIcon,
} from "@mui/icons-material";
import Popover from "@mui/material/Popover";

interface UploadStoryDialogProps {
    open: boolean;
    onClose: () => void;
    fetchStories: () => Promise<void>;
}

const ACCENT = "#7c5cfc";
const CAPTION_LIMIT = 500;

const UploadStoryDialog: React.FC<UploadStoryDialogProps> = ({ open, onClose, fetchStories }) => {
    const currentUser = localStorage.getItem("user")
        ? JSON.parse(localStorage.getItem("user") || "") : {};

    const [media, setMedia] = useState<File | null>(null);
    const [caption, setCaption] = useState("");
    const [loading, setLoading] = useState(false);
    const [posted, setPosted] = useState(false);
    const [emojiAnchorEl, setEmojiAnchorEl] = useState<null | HTMLElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isPreviewHovered, setIsPreviewHovered] = useState(false);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const isDark = theme.palette.mode === "dark";

    const isVideo = media ? media.type.startsWith("video") : false;
    const isImage = media ? media.type.startsWith("image") : false;
    const isReady = !!media;
    const progress = media ? (caption.trim() ? 100 : 60) : 0;
    const successGreen = "#16a34a";

    const metaText = !media ? "Add a photo or video to share"
        : !caption.trim() ? "Optionally add a caption"
        : "Ready to share!";

    useEffect(() => {
        if (!open) {
            setTimeout(() => {
                setMedia(null); setCaption("");
                setIsDragging(false); setPosted(false);
            }, 300);
        }
    }, [open]);

    const onDrop = (acceptedFiles: File[]) => {
        setIsDragging(false);
        if (acceptedFiles.length > 0) setMedia(acceptedFiles[0]);
    };

    const { getRootProps, getInputProps, open: openFileDialog } = useDropzone({
        onDrop,
        onDragEnter: () => setIsDragging(true),
        onDragLeave: () => setIsDragging(false),
        accept: {
            "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
            "video/*": [".mp4", ".mov", ".avi", ".webm"],
        },
        multiple: false,
        noClick: !!media,
    });

    const handleEmojiClick = (emojiData: any) => setCaption((p) => p + emojiData.emoji);

    const handleClose = () => { setMedia(null); setCaption(""); onClose(); };

    const handleUpload = async () => {
        if (!media || !currentUser) return;
        setLoading(true);
        try {
            const response = await uploadStory({ user_id: currentUser.id, caption, media });
            if (response?.success) {
                setPosted(true);
                setTimeout(() => { handleClose(); fetchStories(); }, 800);
            }
        } catch (error) {
            console.error("Failed to upload story:", error);
            alert("Error uploading story. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const borderColor = (t: any) => t.palette.divider;

    const inputSx = {
        "& .MuiOutlinedInput-root": {
            borderRadius: "10px",
            fontSize: "0.875rem",
            backgroundColor: (t: any) => t.palette.action.hover,
            transition: "border-color 0.15s",
            "& fieldset": { borderColor: (t: any) => t.palette.divider },
            "&:hover fieldset": { borderColor: (t: any) => t.palette.text.disabled },
            "&.Mui-focused fieldset": { borderColor: `${ACCENT}80`, borderWidth: "1px" },
        },
    };

    const labelSx = {
        fontSize: "0.7rem", fontWeight: 500, letterSpacing: "0.06em",
        textTransform: "uppercase" as const,
        color: (t: any) => t.palette.text.disabled, mb: 0.875, display: "block",
    };

    return (
        <Modal
            open={open} onClose={handleClose} closeAfterTransition
            BackdropComponent={Backdrop}
            BackdropProps={{ timeout: 300, sx: { backgroundColor: "rgba(0,0,0,0.4)" } }}
            sx={{ display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", p: isMobile ? 0 : 2 }}
        >
            <Fade in={open} timeout={250}>
                <Box sx={{
                    bgcolor: "background.paper",
                    width: "100%", maxWidth: "440px",
                    maxHeight: isMobile ? "96vh" : "88vh",
                    display: "flex", flexDirection: "column", overflow: "hidden",
                    borderRadius: isMobile ? "16px 16px 0 0" : "16px",
                    border: "1px solid", borderColor,
                    boxShadow: isDark ? "0 24px 60px rgba(0,0,0,0.5)" : "0 16px 40px rgba(0,0,0,0.12)",
                    transform: "translateZ(0)",
                    willChange: "transform",
                }}>

                    {/* ── Header ── */}
                    <Box sx={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        px: 2, py: 1.375,
                        borderBottom: "1px solid", borderColor,
                        flexShrink: 0,
                    }}>
                        <Typography sx={{
                            fontFamily: "'Inter', -apple-system, sans-serif",
                            fontSize: "0.95rem", fontWeight: 500,
                            color: (t) => t.palette.text.primary,
                        }}>
                            New story
                        </Typography>

                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            {/* User chip */}
                            <Box sx={{
                                display: "flex", alignItems: "center", gap: 0.875,
                                backgroundColor: (t) => t.palette.action.hover,
                                border: "1px solid", borderColor,
                                borderRadius: "20px", py: "4px", pr: 1.25, pl: "4px",
                            }}>
                                <Box sx={{
                                    width: 22, height: 22, borderRadius: "50%",
                                    backgroundColor: ACCENT,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: "9px", fontWeight: 600, color: "#fff", flexShrink: 0,
                                }}>
                                    {(currentUser?.username || "U").slice(0, 2).toUpperCase()}
                                </Box>
                                <Typography sx={{
                                    fontSize: "0.8rem", color: (t) => t.palette.text.secondary,
                                    fontFamily: "'Inter', sans-serif",
                                }}>
                                    {currentUser?.username || "You"}
                                </Typography>
                            </Box>

                            <IconButton onClick={handleClose} size="small" sx={{
                                width: 30, height: 30, borderRadius: "9px",
                                border: "1px solid", borderColor,
                                color: (t) => t.palette.text.disabled,
                                "&:hover": { color: (t) => t.palette.text.primary, backgroundColor: (t) => t.palette.action.hover },
                            }}>
                                <Close sx={{ fontSize: 14 }} />
                            </IconButton>
                        </Box>
                    </Box>

                    {/* ── Progress bar ── */}
                    <LinearProgress
                        variant="determinate"
                        value={posted ? 100 : progress}
                        sx={{
                            height: 2, flexShrink: 0,
                            backgroundColor: (t) => t.palette.divider,
                            "& .MuiLinearProgress-bar": {
                                backgroundColor: posted ? successGreen : ACCENT,
                                transition: "width 0.3s ease, background-color 0.25s ease",
                            },
                        }}
                    />

                    {/* ── Scrollable body ── */}
                    <Box sx={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>

                        {/* Drop zone / Preview */}
                        <Box
                            {...getRootProps()}
                            sx={{
                                mx: 2, mt: 2,
                                borderRadius: "12px",
                                overflow: "hidden",
                                cursor: media ? "default" : "pointer",
                                position: "relative",
                                backgroundColor: isDragging
                                    ? `${ACCENT}0e`
                                    : (t) => t.palette.action.hover,
                                border: "1px solid",
                                borderColor: isDragging ? ACCENT : borderColor,
                                minHeight: media ? (isMobile ? 200 : 240) : 160,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                transition: "background-color 0.15s, border-color 0.15s",
                                flexShrink: 0,
                                ...(!media && { "&:hover": { backgroundColor: `${ACCENT}08` } }),
                            }}
                            onMouseEnter={() => setIsPreviewHovered(true)}
                            onMouseLeave={() => setIsPreviewHovered(false)}
                        >
                            <input {...getInputProps()} />

                            {media ? (
                                <>
                                    {isVideo ? (
                                        <Box
                                            component="video"
                                            src={URL.createObjectURL(media)}
                                            controls
                                            sx={{
                                                width: "100%",
                                                maxHeight: isMobile ? 200 : 240,
                                                objectFit: "cover",
                                                display: "block",
                                            }}
                                        />
                                    ) : isImage ? (
                                        <Box
                                            component="img"
                                            src={URL.createObjectURL(media)}
                                            alt="Story preview"
                                            sx={{
                                                width: "100%",
                                                height: isMobile ? 200 : 240,
                                                objectFit: "cover",
                                                display: "block",
                                                filter: isPreviewHovered ? "brightness(0.6)" : "brightness(1)",
                                                transition: "filter 0.2s",
                                            }}
                                        />
                                    ) : (
                                        <Typography sx={{ color: (t) => t.palette.error.main, fontSize: "0.84rem" }}>
                                            Unsupported format
                                        </Typography>
                                    )}

                                    {/* Hover actions — images only */}
                                    {isImage && (
                                        <Box sx={{
                                            position: "absolute", inset: 0,
                                            display: "flex", alignItems: "center", justifyContent: "center", gap: 1,
                                            opacity: isPreviewHovered ? 1 : 0, transition: "opacity 0.2s",
                                        }}>
                                            <Button size="small"
                                                onClick={(e) => { e.stopPropagation(); openFileDialog(); }}
                                                startIcon={<EditIcon sx={{ fontSize: "12px !important" }} />}
                                                sx={{
                                                    background: "rgba(255,255,255,0.9)", color: "#111",
                                                    borderRadius: "9px", px: 1.75, py: 0.625,
                                                    fontSize: "0.8rem", fontWeight: 500, textTransform: "none",
                                                    boxShadow: "none", fontFamily: "'Inter', sans-serif",
                                                    "&:hover": { background: "#fff" },
                                                }}
                                            >
                                                Change
                                            </Button>
                                            <Button size="small"
                                                onClick={(e) => { e.stopPropagation(); setMedia(null); }}
                                                startIcon={<DeleteIcon sx={{ fontSize: "12px !important" }} />}
                                                sx={{
                                                    background: "rgba(255,255,255,0.9)", color: "#dc2626",
                                                    borderRadius: "9px", px: 1.75, py: 0.625,
                                                    fontSize: "0.8rem", fontWeight: 500, textTransform: "none",
                                                    boxShadow: "none", fontFamily: "'Inter', sans-serif",
                                                    "&:hover": { background: "#fff" },
                                                }}
                                            >
                                                Remove
                                            </Button>
                                        </Box>
                                    )}
                                </>
                            ) : (
                                <Box sx={{ textAlign: "center", p: 3, userSelect: "none" }}>
                                    <Box sx={{
                                        width: 48, height: 48,
                                        border: "1px solid", borderColor,
                                        borderRadius: "12px",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        mx: "auto", mb: 1.25,
                                        backgroundColor: (t) => t.palette.background.paper,
                                    }}>
                                        <UploadIcon sx={{ fontSize: 20, color: isDragging ? ACCENT : (t) => t.palette.text.disabled }} />
                                    </Box>
                                    <Typography sx={{
                                        fontFamily: "'Inter', sans-serif", fontSize: "0.875rem",
                                        fontWeight: 500, color: (t) => t.palette.text.primary, mb: 0.375,
                                    }}>
                                        Drop your media here
                                    </Typography>
                                    <Typography sx={{
                                        fontFamily: "'Inter', sans-serif", fontSize: "0.8rem",
                                        color: (t) => t.palette.text.disabled, mb: 1.25,
                                    }}>
                                        or click to browse
                                    </Typography>
                                    <Box sx={{ display: "flex", gap: 0.625, justifyContent: "center", flexWrap: "wrap" }}>
                                        {["JPG", "PNG", "GIF", "MP4", "MOV"].map((ext) => (
                                            <Box key={ext} sx={{
                                                fontSize: "0.68rem", fontWeight: 500,
                                                backgroundColor: (t) => t.palette.background.paper,
                                                border: "1px solid", borderColor,
                                                borderRadius: "20px", px: 1, py: "2px",
                                                color: (t) => t.palette.text.disabled,
                                            }}>
                                                {ext}
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                            )}
                        </Box>

                        {/* File name strip */}
                        {media && (
                            <Box sx={{
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                px: 2, pt: 0.875, pb: 0.25,
                            }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.625 }}>
                                    {isVideo
                                        ? <VideoIcon sx={{ fontSize: 13, color: (t) => t.palette.text.disabled }} />
                                        : <ImageIcon sx={{ fontSize: 13, color: (t) => t.palette.text.disabled }} />}
                                    <Typography sx={{
                                        fontFamily: "'Inter', sans-serif", fontSize: "0.75rem",
                                        color: (t) => t.palette.text.disabled, fontStyle: "italic",
                                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200,
                                    }}>
                                        {media.name}
                                    </Typography>
                                </Box>
                                <Typography
                                    component="button" onClick={() => setMedia(null)}
                                    sx={{
                                        fontFamily: "'Inter', sans-serif", fontSize: "0.75rem",
                                        color: (t) => t.palette.error.main,
                                        background: "none", border: "none", cursor: "pointer", p: 0,
                                        "&:hover": { textDecoration: "underline" },
                                    }}
                                >
                                    Remove
                                </Typography>
                            </Box>
                        )}

                        {/* Caption */}
                        <Box sx={{ px: 2, pt: 1.75, pb: 2 }}>
                            <Typography component="label" sx={labelSx}>Caption</Typography>
                            <Box sx={{ position: "relative" }}>
                                <TextField
                                    fullWidth multiline rows={3} variant="outlined"
                                    placeholder="Write a caption…"
                                    value={caption}
                                    onChange={(e) => setCaption(e.target.value)}
                                    inputProps={{ maxLength: CAPTION_LIMIT }}
                                    sx={{
                                        ...inputSx,
                                        "& .MuiOutlinedInput-root": {
                                            ...inputSx["& .MuiOutlinedInput-root"],
                                            pr: "38px",
                                        },
                                    }}
                                />
                                <IconButton
                                    onClick={(e) => setEmojiAnchorEl(e.currentTarget)}
                                    size="small"
                                    sx={{
                                        position: "absolute", bottom: 8, right: 8,
                                        width: 26, height: 26, borderRadius: "7px",
                                        color: (t) => t.palette.text.disabled,
                                        "&:hover": { color: ACCENT, backgroundColor: (t) => t.palette.action.hover },
                                    }}
                                >
                                    <EmojiIcon sx={{ fontSize: 15 }} />
                                </IconButton>
                            </Box>
                            <Typography sx={{
                                fontFamily: "'Inter', sans-serif", fontSize: "0.68rem",
                                color: (t) => t.palette.text.disabled, textAlign: "right", mt: 0.625,
                            }}>
                                {caption.length} / {CAPTION_LIMIT}
                            </Typography>
                        </Box>
                    </Box>

                    {/* ── Footer ── */}
                    <Box sx={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        gap: 1.5, px: 2, py: 1.25,
                        borderTop: "1px solid", borderColor,
                        flexShrink: 0,
                    }}>
                        <Typography sx={{
                            fontFamily: "'Inter', sans-serif", fontSize: "0.78rem",
                            color: isReady
                                ? (caption.trim() ? successGreen : (t: any) => t.palette.text.secondary)
                                : (t: any) => t.palette.text.disabled,
                            transition: "color 0.25s",
                        }}>
                            {posted ? "Story shared!" : metaText}
                        </Typography>

                        <Box sx={{ display: "flex", gap: 0.75 }}>
                            <Button
                                variant="outlined" onClick={handleClose}
                                sx={{
                                    borderRadius: "10px",
                                    border: "1px solid", borderColor: (t) => t.palette.divider,
                                    color: (t) => t.palette.text.secondary,
                                    fontFamily: "'Inter', sans-serif",
                                    fontSize: "0.84rem", fontWeight: 500,
                                    textTransform: "none", px: 2, py: 0.875,
                                    boxShadow: "none",
                                    "&:hover": {
                                        borderColor: (t) => t.palette.text.disabled,
                                        backgroundColor: (t) => t.palette.action.hover,
                                        color: (t) => t.palette.text.primary,
                                    },
                                }}
                            >
                                Cancel
                            </Button>

                            <Button
                                variant="contained" onClick={handleUpload}
                                disabled={!isReady || loading || posted}
                                endIcon={
                                    loading
                                        ? <CircularProgress size={13} thickness={4} sx={{ color: "#fff" }} />
                                        : posted ? null
                                        : <SendIcon sx={{ fontSize: "13px !important" }} />
                                }
                                sx={{
                                    borderRadius: "10px",
                                    backgroundColor: posted ? successGreen : ACCENT,
                                    color: "#fff",
                                    fontFamily: "'Inter', sans-serif",
                                    fontSize: "0.84rem", fontWeight: 500,
                                    textTransform: "none", px: 2.25, py: 0.875,
                                    boxShadow: "none",
                                    transition: "background-color 0.15s, transform 0.1s",
                                    "&:hover": { backgroundColor: posted ? successGreen : "#6b4de0", boxShadow: "none" },
                                    "&:active": { transform: "scale(0.97)" },
                                    "&.Mui-disabled": { backgroundColor: `${ACCENT}40`, color: "rgba(255,255,255,0.6)" },
                                }}
                            >
                                {posted ? "Shared!" : loading ? "Sharing…" : "Share story"}
                            </Button>
                        </Box>
                    </Box>

                    {/* ── Emoji picker ── */}
                    <Popover
                        open={Boolean(emojiAnchorEl)} anchorEl={emojiAnchorEl}
                        onClose={() => setEmojiAnchorEl(null)}
                        anchorOrigin={{ vertical: "top", horizontal: "left" }}
                        transformOrigin={{ vertical: "bottom", horizontal: "left" }}
                        PaperProps={{ sx: { borderRadius: "16px", overflow: "hidden", border: "1px solid", borderColor } }}
                    >
                        <EmojiPicker
                            theme={isDark ? Theme.DARK : Theme.LIGHT}
                            onEmojiClick={handleEmojiClick}
                            height={350} width={isMobile ? 300 : 340}
                        />
                    </Popover>
                </Box>
            </Fade>
        </Modal>
    );
};

export default UploadStoryDialog;