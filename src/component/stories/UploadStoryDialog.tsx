import { useState, useEffect } from "react";
import {
    Box, Button, Modal, TextField, Typography, Backdrop, Fade,
    IconButton, CircularProgress, useTheme, useMediaQuery,
} from "@mui/material";
import { useDropzone } from "react-dropzone";
import { uploadStory } from "../../services/api";
import EmojiPicker, { Theme } from "emoji-picker-react";
import {
    SentimentSatisfiedAlt as EmojiIcon, Close,
    PlayCircleOutline as VideoIcon, ImageOutlined as ImageIcon,
    FileUploadOutlined as UploadIcon, EditOutlined as EditIcon,
    DeleteOutline as DeleteIcon, ArrowForward as ArrowIcon,
} from "@mui/icons-material";
import Popover from "@mui/material/Popover";

interface UploadStoryDialogProps {
    open: boolean;
    onClose: () => void;
    fetchStories: () => Promise<void>;
}

const ACCENT = "#64748B";
const CAPTION_LIMIT = 500;

const UploadStoryDialog: React.FC<UploadStoryDialogProps> = ({ open, onClose, fetchStories }) => {
    const currentUser = localStorage.getItem("user")
        ? JSON.parse(localStorage.getItem("user") || "null") : {};

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

    const bc = (t: any) => t.palette.divider;

    return (
        <Modal
            open={open} onClose={handleClose} closeAfterTransition
            BackdropComponent={Backdrop}
            BackdropProps={{ timeout: 300, sx: { backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(6px)" } }}
            sx={{ display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", p: isMobile ? 0 : 2 }}
        >
            <Fade in={open} timeout={220}>
                <Box sx={{
                    bgcolor: "background.paper",
                    width: "100%", maxWidth: 440,
                    maxHeight: isMobile ? "96vh" : "86vh",
                    display: "flex", flexDirection: "column", overflow: "hidden",
                    borderRadius: isMobile ? "20px 20px 0 0" : "20px",
                    border: "1px solid", borderColor: bc,
                    boxShadow: isDark ? "0 32px 80px rgba(0,0,0,0.6)" : "0 20px 60px rgba(0,0,0,0.14)",
                    isolation: "isolate",
                    willChange: "transform",
                }}>

                    {/* ── Header ── */}
                    <Box sx={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        px: 2.5, py: 1.5,
                        borderBottom: "1px solid", borderColor: bc, flexShrink: 0,
                    }}>
                        <Typography sx={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: "1rem", fontWeight: 600,
                            color: (t) => t.palette.text.primary,
                            letterSpacing: "-0.2px",
                        }}>
                            Create story
                        </Typography>
                        <IconButton onClick={handleClose} size="small" sx={{
                            width: 32, height: 32, borderRadius: "10px",
                            color: (t) => t.palette.text.secondary,
                            "&:hover": { backgroundColor: (t) => t.palette.action.hover, color: (t) => t.palette.text.primary },
                        }}>
                            <Close sx={{ fontSize: 16 }} />
                        </IconButton>
                    </Box>

                    {/* ── Body ── */}
                    <Box sx={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>

                        {/* User row */}
                        <Box sx={{
                            display: "flex", alignItems: "center", gap: 1.25,
                            px: 2.25, pt: 2, pb: 1.5,
                            borderBottom: "1px solid", borderColor: bc,
                        }}>
                            <Box sx={{
                                width: 34, height: 34, borderRadius: "50%",
                                backgroundColor: ACCENT, flexShrink: 0,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "11px", fontWeight: 700, color: "#fff",
                            }}>
                                {(currentUser?.username || "U").slice(0, 2).toUpperCase()}
                            </Box>
                            <Box>
                                <Typography sx={{ fontFamily: "'Inter', sans-serif", fontSize: "0.85rem", fontWeight: 600, color: (t) => t.palette.text.primary, lineHeight: 1.2 }}>
                                    {currentUser?.username || "You"}
                                </Typography>
                                <Typography sx={{ fontFamily: "'Inter', sans-serif", fontSize: "0.72rem", color: (t) => t.palette.text.disabled }}>
                                    Posting now
                                </Typography>
                            </Box>
                        </Box>

                        {/* Drop zone / Preview */}
                        <Box
                            {...getRootProps()}
                            sx={{
                                mx: 2, mt: 2,
                                borderRadius: "12px",
                                overflow: "hidden",
                                cursor: media ? "default" : "pointer",
                                position: "relative",
                                backgroundColor: isDragging ? `${ACCENT}0d` : (t) => t.palette.action.hover,
                                outline: isDragging ? `2px dashed ${ACCENT}60` : "none",
                                outlineOffset: "-8px",
                                minHeight: media ? (isMobile ? 200 : 240) : 160,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                transition: "background-color 0.15s",
                                flexShrink: 0,
                                ...(!media && { "&:hover": { backgroundColor: `${ACCENT}07` } }),
                            }}
                            onMouseEnter={() => setIsPreviewHovered(true)}
                            onMouseLeave={() => setIsPreviewHovered(false)}
                        >
                            <input {...getInputProps()} />

                            {media ? (
                                <>
                                    {isVideo ? (
                                        <Box component="video" src={URL.createObjectURL(media)} controls
                                            sx={{ width: "100%", maxHeight: isMobile ? 200 : 240, objectFit: "cover", display: "block" }}
                                        />
                                    ) : isImage ? (
                                        <Box component="img" src={URL.createObjectURL(media)} alt="Story preview"
                                            sx={{
                                                width: "100%", height: isMobile ? 200 : 240,
                                                objectFit: "cover", display: "block",
                                                filter: isPreviewHovered ? "brightness(0.55)" : "brightness(1)",
                                                transition: "filter 0.2s",
                                            }}
                                        />
                                    ) : (
                                        <Typography sx={{ color: (t) => t.palette.error.main, fontSize: "0.84rem" }}>
                                            Unsupported format
                                        </Typography>
                                    )}

                                    {isImage && (
                                        <Box sx={{
                                            position: "absolute", inset: 0,
                                            display: "flex", alignItems: "center", justifyContent: "center", gap: 1,
                                            opacity: isPreviewHovered ? 1 : 0, transition: "opacity 0.2s",
                                        }}>
                                            <IconButton
                                                onClick={(e) => { e.stopPropagation(); openFileDialog(); }}
                                                sx={{ backgroundColor: "rgba(255,255,255,0.92)", color: "#111", width: 38, height: 38, "&:hover": { backgroundColor: "#fff" } }}
                                            >
                                                <EditIcon sx={{ fontSize: 16 }} />
                                            </IconButton>
                                            <IconButton
                                                onClick={(e) => { e.stopPropagation(); setMedia(null); }}
                                                sx={{ backgroundColor: "rgba(255,255,255,0.92)", color: "#dc2626", width: 38, height: 38, "&:hover": { backgroundColor: "#fff" } }}
                                            >
                                                <DeleteIcon sx={{ fontSize: 16 }} />
                                            </IconButton>
                                        </Box>
                                    )}
                                </>
                            ) : (
                                <Box sx={{ textAlign: "center", p: 3, userSelect: "none" }}>
                                    <Box sx={{
                                        width: 52, height: 52, borderRadius: "14px",
                                        backgroundColor: `${ACCENT}12`,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        mx: "auto", mb: 1.5,
                                    }}>
                                        <UploadIcon sx={{ fontSize: 22, color: isDragging ? ACCENT : `${ACCENT}99` }} />
                                    </Box>
                                    <Typography sx={{
                                        fontFamily: "'Inter', sans-serif", fontSize: "0.9rem",
                                        fontWeight: 600, color: (t) => t.palette.text.primary, mb: 0.4,
                                        letterSpacing: "-0.1px",
                                    }}>
                                        {isDragging ? "Drop to upload" : "Drop photo or video"}
                                    </Typography>
                                    <Typography sx={{ fontFamily: "'Inter', sans-serif", fontSize: "0.78rem", color: (t) => t.palette.text.disabled, mb: 1.5 }}>
                                        or click to browse
                                    </Typography>
                                    <Box sx={{ display: "flex", gap: 0.5, justifyContent: "center", flexWrap: "wrap" }}>
                                        {["JPG", "PNG", "GIF", "MP4", "MOV"].map((ext) => (
                                            <Typography key={ext} sx={{
                                                fontFamily: "'Inter', sans-serif", fontSize: "0.65rem", fontWeight: 600,
                                                color: (t) => t.palette.text.disabled,
                                                backgroundColor: (t) => t.palette.background.paper,
                                                border: "1px solid", borderColor: bc,
                                                borderRadius: "6px", px: 0.875, py: "2px",
                                                letterSpacing: "0.04em",
                                            }}>
                                                {ext}
                                            </Typography>
                                        ))}
                                    </Box>
                                </Box>
                            )}
                        </Box>

                        {/* File strip */}
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
                                        fontFamily: "'Inter', sans-serif", fontSize: "0.73rem",
                                        color: (t) => t.palette.text.disabled, fontStyle: "italic",
                                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200,
                                    }}>
                                        {media.name}
                                    </Typography>
                                </Box>
                                <Typography component="button" onClick={() => setMedia(null)} sx={{
                                    fontFamily: "'Inter', sans-serif", fontSize: "0.73rem",
                                    color: (t) => t.palette.error.main,
                                    background: "none", border: "none", cursor: "pointer", p: 0,
                                    "&:hover": { textDecoration: "underline" },
                                }}>
                                    Remove
                                </Typography>
                            </Box>
                        )}

                        {/* Caption */}
                        <Box sx={{ px: 2.25, pt: 1.75, pb: 2 }}>
                            <Box sx={{ position: "relative" }}>
                                <TextField
                                    fullWidth multiline rows={3} variant="standard"
                                    placeholder="Write a caption…"
                                    value={caption}
                                    onChange={(e) => setCaption(e.target.value)}
                                    inputProps={{ maxLength: CAPTION_LIMIT }}
                                    sx={{
                                        "& .MuiInput-root": {
                                            fontSize: "0.875rem",
                                            fontFamily: "'Inter', sans-serif",
                                            color: (t) => t.palette.text.primary,
                                            "&:before, &:after": { display: "none" },
                                            pr: "32px",
                                        },
                                        "& textarea::placeholder": { color: (t: any) => t.palette.text.disabled, opacity: 1 },
                                    }}
                                />
                                <IconButton
                                    onClick={(e) => setEmojiAnchorEl(e.currentTarget)}
                                    size="small"
                                    sx={{
                                        position: "absolute", top: 0, right: 0,
                                        width: 26, height: 26, borderRadius: "7px",
                                        color: (t) => t.palette.text.disabled,
                                        "&:hover": { color: ACCENT, backgroundColor: (t) => t.palette.action.hover },
                                    }}
                                >
                                    <EmojiIcon sx={{ fontSize: 15 }} />
                                </IconButton>
                            </Box>
                            <Typography sx={{
                                fontFamily: "'Inter', sans-serif", fontSize: "0.67rem",
                                color: (t) => t.palette.text.disabled, textAlign: "right", mt: 0.75,
                            }}>
                                {caption.length} / {CAPTION_LIMIT}
                            </Typography>
                        </Box>
                    </Box>

                    {/* ── Footer ── */}
                    <Box sx={{
                        display: "flex", alignItems: "center", justifyContent: "flex-end",
                        gap: 1.5, px: 2.5, py: 1.375,
                        borderTop: "1px solid", borderColor: bc, flexShrink: 0,
                    }}>
                        {!isReady && (
                            <Typography sx={{
                                fontFamily: "'Inter', sans-serif", fontSize: "0.78rem",
                                color: (t) => t.palette.text.disabled, mr: "auto",
                            }}>
                                Add a photo or video to share
                            </Typography>
                        )}

                        <Button variant="text" onClick={handleClose} sx={{
                            borderRadius: "10px",
                            color: (t) => t.palette.text.secondary,
                            fontFamily: "'Inter', sans-serif",
                            fontSize: "0.84rem", fontWeight: 500,
                            textTransform: "none", px: 2, py: 0.75,
                            "&:hover": { backgroundColor: (t) => t.palette.action.hover, color: (t) => t.palette.text.primary },
                        }}>
                            Cancel
                        </Button>

                        <Button
                            variant="contained" onClick={handleUpload}
                            disabled={!isReady || loading || posted}
                            endIcon={
                                loading
                                    ? <CircularProgress size={13} thickness={4} sx={{ color: "#fff" }} />
                                    : posted ? null
                                    : <ArrowIcon sx={{ fontSize: "14px !important" }} />
                            }
                            sx={{
                                borderRadius: "10px",
                                backgroundColor: posted ? "#16a34a" : ACCENT,
                                color: "#fff",
                                fontFamily: "'Inter', sans-serif",
                                fontSize: "0.84rem", fontWeight: 600,
                                textTransform: "none", px: 2.25, py: 0.75,
                                boxShadow: "none", letterSpacing: "-0.1px",
                                transition: "background-color 0.15s, transform 0.1s",
                                "&:hover": { backgroundColor: posted ? "#16a34a" : "#6b4de0", boxShadow: "none" },
                                "&:active": { transform: "scale(0.97)" },
                                "&.Mui-disabled": { backgroundColor: `${ACCENT}35`, color: "rgba(255,255,255,0.5)" },
                            }}
                        >
                            {posted ? "Shared!" : loading ? "Sharing…" : "Share story"}
                        </Button>
                    </Box>

                    {/* ── Emoji picker ── */}
                    <Popover
                        open={Boolean(emojiAnchorEl)} anchorEl={emojiAnchorEl}
                        onClose={() => setEmojiAnchorEl(null)}
                        anchorOrigin={{ vertical: "top", horizontal: "left" }}
                        transformOrigin={{ vertical: "bottom", horizontal: "left" }}
                        PaperProps={{ sx: { borderRadius: "16px", overflow: "hidden", border: "1px solid", borderColor: bc } }}
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
