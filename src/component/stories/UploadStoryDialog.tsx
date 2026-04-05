import { useState, useEffect } from "react";
import {
    Box,
    Button,
    Modal,
    TextField,
    Typography,
    Backdrop,
    Fade,
    IconButton,
    CircularProgress,
    alpha,
    useTheme,
    useMediaQuery,
    LinearProgress,
} from "@mui/material";
import { useDropzone } from "react-dropzone";
import { uploadStory } from "../../services/api";
import EmojiPicker, { Theme } from "emoji-picker-react";
import {
    SentimentSatisfiedAlt as EmojiIcon,
    Close,
    PlayCircleOutline as VideoIcon,
    ImageOutlined as ImageIcon,
    FileUploadOutlined as UploadIcon,
    EditOutlined as EditIcon,
    DeleteOutline as DeleteIcon,
    Send as SendIcon,
} from "@mui/icons-material";
import Popover from "@mui/material/Popover";

interface UploadStoryDialogProps {
    open: boolean;
    onClose: () => void;
    fetchStories: () => Promise<void>;
}

const CAPTION_LIMIT = 500;

const UploadStoryDialog: React.FC<UploadStoryDialogProps> = ({ open, onClose, fetchStories }) => {
    const currentUser = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") || "") : {};
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

    const metaText = !media ? "Add a photo or video to share" : !caption.trim() ? "Optionally add a caption" : "Ready to share!";

    // Design tokens — matches CreatePostModal exactly
    const surface = isDark ? alpha("#fff", 0.04) : "#faf9f7";
    const borderColor = isDark ? alpha("#fff", 0.09) : alpha("#000", 0.08);
    const borderHover = isDark ? alpha("#fff", 0.18) : alpha("#000", 0.16);
    const accent = "#c94f2c";
    const accentSoft = alpha(accent, 0.08);
    const successColor = "#1a8f5a";

    useEffect(() => {
        if (!open) {
            setTimeout(() => {
                setMedia(null);
                setCaption("");
                setIsDragging(false);
                setPosted(false);
            }, 300);
        }
    }, [open]);

    const onDrop = (acceptedFiles: File[]) => {
        setIsDragging(false);
        if (acceptedFiles.length > 0) setMedia(acceptedFiles[0]);
    };

    const {
        getRootProps,
        getInputProps,
        open: openFileDialog,
    } = useDropzone({
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

    const handleEmojiClick = (emojiData: any) => {
        setCaption((prev) => prev + emojiData.emoji);
    };

    const handleClose = () => {
        setMedia(null);
        setCaption("");
        onClose();
    };

    const handleUpload = async () => {
        if (!media || !currentUser) return;
        setLoading(true);
        try {
            const response = await uploadStory({
                user_id: currentUser.id,
                caption,
                media,
            });
            if (response?.success) {
                setPosted(true);
                setTimeout(() => {
                    handleClose();
                    fetchStories();
                }, 800);
            }
        } catch (error) {
            console.error("Failed to upload story:", error);
            alert("Error uploading story. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const inputSx = {
        "& .MuiOutlinedInput-root": {
            borderRadius: "12px",
            background: surface,
            fontSize: "14px",
            transition: "all 0.18s ease",
            "& fieldset": { borderColor },
            "&:hover fieldset": { borderColor: borderHover },
            "&.Mui-focused fieldset": { borderColor: borderHover, borderWidth: "1px" },
        },
        "& .MuiInputLabel-root": { fontSize: "14px" },
    };

    const fieldLabelSx = {
        fontSize: "11px",
        fontWeight: 600,
        letterSpacing: "0.6px",
        textTransform: "uppercase" as const,
        color: "text.disabled",
        mb: 1,
        display: "block",
    };

    return (
        <Modal
            open={open}
            onClose={handleClose}
            closeAfterTransition
            BackdropComponent={Backdrop}
            BackdropProps={{
                timeout: 400,
                sx: {
                    backgroundColor: alpha("#0f0c08", 0.65),
                    backdropFilter: "blur(6px)",
                },
            }}
            sx={{
                display: "flex",
                alignItems: isMobile ? "flex-end" : "center",
                justifyContent: "center",
                p: isMobile ? 0 : 2,
            }}
        >
            <Fade in={open} timeout={350}>
                <Box
                    sx={{
                        bgcolor: "background.paper",
                        width: "100%",
                        maxWidth: "460px",
                        maxHeight: isMobile ? "96vh" : "90vh",
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                        borderRadius: isMobile ? "20px 20px 0 0" : "20px",
                        border: `0.5px solid ${borderColor}`,
                        boxShadow: isDark ? "0 32px 80px rgba(0,0,0,0.6)" : "0 24px 64px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)",
                        isolation: "isolate",
                    }}
                >
                    {/* ── Header ── */}
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            px: 2.5,
                            py: 1.75,
                            borderBottom: `0.5px solid ${borderColor}`,
                            flexShrink: 0,
                        }}
                    >
                        <Typography
                            sx={{
                                fontFamily: "'Georgia', serif",
                                fontSize: "21px",
                                fontWeight: 400,
                                color: "text.primary",
                                letterSpacing: "-0.3px",
                                "& em": { fontStyle: "italic", color: accent },
                            }}
                            dangerouslySetInnerHTML={{ __html: "New <em>story</em>" }}
                        />

                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            {/* User chip */}
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    background: surface,
                                    border: `0.5px solid ${borderColor}`,
                                    borderRadius: "999px",
                                    py: "4px",
                                    pr: 1.5,
                                    pl: "4px",
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 26,
                                        height: 26,
                                        borderRadius: "50%",
                                        background: `linear-gradient(135deg, ${accent} 0%, #2c4ac9 100%)`,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "10px",
                                        fontWeight: 600,
                                        color: "#fff",
                                        letterSpacing: "0.3px",
                                        flexShrink: 0,
                                    }}
                                >
                                    {(currentUser?.username || currentUser?.name || "U").slice(0, 2).toUpperCase()}
                                </Box>
                                <Typography sx={{ fontSize: "13px", color: "text.secondary", fontWeight: 400 }}>
                                    {currentUser?.username || currentUser?.name || "You"}
                                </Typography>
                            </Box>

                            <IconButton
                                onClick={handleClose}
                                size="small"
                                sx={{
                                    width: 32,
                                    height: 32,
                                    border: `0.5px solid ${borderColor}`,
                                    borderRadius: "50%",
                                    color: "text.disabled",
                                    transition: "all 0.15s ease",
                                    "&:hover": {
                                        color: "text.primary",
                                        borderColor: borderHover,
                                        background: surface,
                                    },
                                }}
                            >
                                <Close sx={{ fontSize: 14 }} />
                            </IconButton>
                        </Box>
                    </Box>

                    {/* ── Progress bar ── */}
                    <LinearProgress
                        variant="determinate"
                        value={posted ? 100 : progress}
                        sx={{
                            height: 2,
                            flexShrink: 0,
                            backgroundColor: borderColor,
                            "& .MuiLinearProgress-bar": {
                                backgroundColor: posted ? successColor : accent,
                                transition: "width 0.35s ease, background-color 0.3s ease",
                            },
                        }}
                    />

                    {/* ── Scrollable body ── */}
                    <Box sx={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
                        {/* Drop zone / Preview */}
                        <Box
                            {...getRootProps()}
                            sx={{
                                mx: 2.5,
                                mt: 2.5,
                                borderRadius: "16px",
                                overflow: "hidden",
                                cursor: media ? "default" : "pointer",
                                position: "relative",
                                background: isDragging ? accentSoft : surface,
                                border: `0.5px solid ${isDragging ? accent : borderColor}`,
                                minHeight: media ? (isMobile ? 200 : 260) : 180,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.2s ease",
                                flexShrink: 0,
                                ...(!media && { "&:hover": { background: alpha(accent, 0.04), borderColor: borderHover } }),
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
                                                maxHeight: isMobile ? 200 : 260,
                                                objectFit: "cover",
                                                display: "block",
                                                borderRadius: "16px",
                                            }}
                                        />
                                    ) : isImage ? (
                                        <Box
                                            component="img"
                                            src={URL.createObjectURL(media)}
                                            alt="Story preview"
                                            sx={{
                                                width: "100%",
                                                height: isMobile ? 200 : 260,
                                                objectFit: "cover",
                                                display: "block",
                                                filter: isPreviewHovered ? "brightness(0.65)" : "brightness(1)",
                                                transition: "filter 0.2s ease",
                                            }}
                                        />
                                    ) : (
                                        <Typography sx={{ color: "error.main", fontSize: 14 }}>Unsupported format</Typography>
                                    )}

                                    {/* Hover actions — only for images */}
                                    {isImage && (
                                        <Box
                                            sx={{
                                                position: "absolute",
                                                inset: 0,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: 1.5,
                                                opacity: isPreviewHovered ? 1 : 0,
                                                transition: "opacity 0.2s ease",
                                                borderRadius: "16px",
                                            }}
                                        >
                                            <Button
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openFileDialog();
                                                }}
                                                startIcon={<EditIcon sx={{ fontSize: "13px !important" }} />}
                                                sx={{
                                                    background: alpha("#fff", 0.92),
                                                    color: "#1a1916",
                                                    borderRadius: "999px",
                                                    px: 2,
                                                    py: 0.75,
                                                    fontSize: "13px",
                                                    fontWeight: 500,
                                                    textTransform: "none",
                                                    boxShadow: "none",
                                                    "&:hover": { background: "#fff" },
                                                }}
                                            >
                                                Change
                                            </Button>
                                            <Button
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setMedia(null);
                                                }}
                                                startIcon={<DeleteIcon sx={{ fontSize: "13px !important" }} />}
                                                sx={{
                                                    background: alpha("#fff", 0.92),
                                                    color: accent,
                                                    borderRadius: "999px",
                                                    px: 2,
                                                    py: 0.75,
                                                    fontSize: "13px",
                                                    fontWeight: 500,
                                                    textTransform: "none",
                                                    boxShadow: "none",
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
                                    <Box
                                        sx={{
                                            width: 52,
                                            height: 52,
                                            border: `1.5px solid ${borderHover}`,
                                            borderRadius: "12px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            mx: "auto",
                                            mb: 1.5,
                                        }}
                                    >
                                        <UploadIcon sx={{ fontSize: 22, color: isDragging ? accent : "text.disabled" }} />
                                    </Box>
                                    <Typography sx={{ fontSize: "15px", fontWeight: 500, color: "text.primary", mb: 0.5 }}>
                                        Drop your media here
                                    </Typography>
                                    <Typography sx={{ fontSize: "13px", color: "text.disabled", mb: 1.5 }}>or click to browse</Typography>
                                    <Box sx={{ display: "flex", gap: 0.75, justifyContent: "center", flexWrap: "wrap" }}>
                                        {["JPG", "PNG", "GIF", "MP4", "MOV"].map((ext) => (
                                            <Box
                                                key={ext}
                                                sx={{
                                                    fontSize: "11px",
                                                    fontWeight: 500,
                                                    background: "background.paper",
                                                    border: `0.5px solid ${borderColor}`,
                                                    borderRadius: "999px",
                                                    px: 1.25,
                                                    py: "3px",
                                                    color: "text.disabled",
                                                    letterSpacing: "0.3px",
                                                }}
                                            >
                                                {ext}
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                            )}
                        </Box>

                        {/* File name strip */}
                        {media && (
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    px: 2.5,
                                    pt: 1,
                                    pb: 0.5,
                                }}
                            >
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                                    {isVideo ? (
                                        <VideoIcon sx={{ fontSize: 14, color: "text.disabled" }} />
                                    ) : (
                                        <ImageIcon sx={{ fontSize: 14, color: "text.disabled" }} />
                                    )}
                                    <Typography
                                        sx={{
                                            fontSize: "12px",
                                            color: "text.disabled",
                                            fontStyle: "italic",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                            maxWidth: 220,
                                        }}
                                    >
                                        {media.name}
                                    </Typography>
                                </Box>
                                <Typography
                                    component="button"
                                    onClick={() => setMedia(null)}
                                    sx={{
                                        fontSize: "12px",
                                        color: accent,
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        p: 0,
                                        fontFamily: "inherit",
                                        "&:hover": { textDecoration: "underline" },
                                    }}
                                >
                                    Remove
                                </Typography>
                            </Box>
                        )}

                        {/* Caption field */}
                        <Box
                            sx={{
                                px: 2.5,
                                pt: 2,
                                pb: 2.5,
                            }}
                        >
                            <Typography component="label" sx={fieldLabelSx}>
                                Caption
                            </Typography>
                            <Box sx={{ position: "relative" }}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    variant="outlined"
                                    placeholder="Write a caption…"
                                    value={caption}
                                    onChange={(e) => setCaption(e.target.value)}
                                    inputProps={{ maxLength: CAPTION_LIMIT }}
                                    sx={{
                                        ...inputSx,
                                        "& .MuiOutlinedInput-root": {
                                            ...inputSx["& .MuiOutlinedInput-root"],
                                            pr: "40px",
                                        },
                                    }}
                                />
                                <IconButton
                                    onClick={(e) => setEmojiAnchorEl(e.currentTarget)}
                                    size="small"
                                    sx={{
                                        position: "absolute",
                                        bottom: 8,
                                        right: 8,
                                        color: "text.disabled",
                                        width: 28,
                                        height: 28,
                                        borderRadius: "6px",
                                        transition: "all 0.15s ease",
                                        "&:hover": { color: "text.primary", background: borderColor },
                                    }}
                                >
                                    <EmojiIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                            </Box>
                            <Typography sx={{ fontSize: "11px", color: "text.disabled", textAlign: "right", mt: 0.75 }}>
                                {caption.length} / {CAPTION_LIMIT}
                            </Typography>
                        </Box>
                    </Box>

                    {/* ── Footer ── */}
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 1.5,
                            px: 2.5,
                            py: 1.5,
                            borderTop: `0.5px solid ${borderColor}`,
                            flexShrink: 0,
                            background: "background.paper",
                        }}
                    >
                        <Typography
                            sx={{
                                fontSize: "12px",
                                color: isReady ? (caption.trim() ? successColor : "text.secondary") : "text.disabled",
                                transition: "color 0.3s ease",
                            }}
                        >
                            {posted ? "Story shared!" : metaText}
                        </Typography>

                        <Box sx={{ display: "flex", gap: 1 }}>
                            <Button
                                variant="outlined"
                                onClick={handleClose}
                                sx={{
                                    borderRadius: "12px",
                                    border: `0.5px solid ${borderColor}`,
                                    color: "text.secondary",
                                    fontSize: "13.5px",
                                    fontWeight: 400,
                                    textTransform: "none",
                                    px: 2.5,
                                    py: 1,
                                    background: "none",
                                    "&:hover": {
                                        border: `0.5px solid ${borderHover}`,
                                        background: surface,
                                        color: "text.primary",
                                    },
                                }}
                            >
                                Cancel
                            </Button>

                            <Button
                                variant="contained"
                                onClick={handleUpload}
                                disabled={!isReady || loading || posted}
                                endIcon={
                                    loading ? (
                                        <CircularProgress size={14} thickness={4} sx={{ color: "#fff" }} />
                                    ) : posted ? null : (
                                        <SendIcon sx={{ fontSize: "14px !important" }} />
                                    )
                                }
                                sx={{
                                    borderRadius: "12px",
                                    background: posted ? successColor : accent,
                                    color: "#fff",
                                    fontSize: "13.5px",
                                    fontWeight: 500,
                                    textTransform: "none",
                                    px: 2.5,
                                    py: 1,
                                    boxShadow: "none",
                                    transition: "all 0.2s ease",
                                    "&:hover": {
                                        background: posted ? successColor : "#b03f1f",
                                        boxShadow: "none",
                                        transform: "translateY(-1px)",
                                    },
                                    "&:active": { transform: "translateY(0)" },
                                    "&.Mui-disabled": {
                                        background: alpha(accent, 0.35),
                                        color: alpha("#fff", 0.7),
                                    },
                                }}
                            >
                                {posted ? "Shared!" : loading ? "Sharing…" : "Share story"}
                            </Button>
                        </Box>
                    </Box>

                    {/* ── Emoji Picker ── */}
                    <Popover
                        open={Boolean(emojiAnchorEl)}
                        anchorEl={emojiAnchorEl}
                        onClose={() => setEmojiAnchorEl(null)}
                        anchorOrigin={{ vertical: "top", horizontal: "left" }}
                        transformOrigin={{ vertical: "bottom", horizontal: "left" }}
                        PaperProps={{
                            sx: {
                                borderRadius: "16px",
                                overflow: "hidden",
                                border: `0.5px solid ${borderColor}`,
                                boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                            },
                        }}
                    >
                        <EmojiPicker theme={Theme.AUTO} onEmojiClick={handleEmojiClick} height={350} width={isMobile ? 300 : 350} />
                    </Popover>
                </Box>
            </Fade>
        </Modal>
    );
};

export default UploadStoryDialog;
