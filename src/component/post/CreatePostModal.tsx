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
    InputAdornment,
    LinearProgress,
} from "@mui/material";
import { useDropzone } from "react-dropzone";
import { createPost } from "../../services/api";
import { useGlobalStore } from "../../store/store";
import { useNavigate } from "react-router-dom";
import EmojiPicker, { Theme } from "emoji-picker-react";
import {
    SentimentSatisfiedAlt as EmojiIcon,
    LocationOn,
    Close,
    AddPhotoAlternate,
    Send as SendIcon,
    EditOutlined as EditIcon,
    DeleteOutline as DeleteIcon,
} from "@mui/icons-material";
import Popover from "@mui/material/Popover";
import { useNotifications } from "@toolpad/core/useNotifications";

interface CreatePostModalProps {
    open: boolean;
    handleClose: () => void;
}

const CAPTION_LIMIT = 2200;

const CreatePostModal: React.FC<CreatePostModalProps> = ({ open, handleClose }) => {
    const navigate = useNavigate();
    const currentUser = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") || "") : {};
    const [postContent, setPostContent] = useState<string>("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [location, setLocation] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [emojiAnchorEl, setEmojiAnchorEl] = useState<null | HTMLElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isPreviewHovered, setIsPreviewHovered] = useState(false);
    const [posted, setPosted] = useState(false);

    const notifications = useNotifications();
    const { user, setPostUploading } = useGlobalStore();

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const isDark = theme.palette.mode === "dark";

    // Derived state
    const hasCaption = postContent.trim().length > 0;
    const hasFile = imageFile !== null;
    const isReady = hasCaption && hasFile;
    const progress = (hasFile ? 50 : 0) + (hasCaption ? 50 : 0);

    const metaText =
        !hasFile && !hasCaption
            ? "Add a photo and caption to share"
            : !hasFile
              ? "Add a photo to continue"
              : !hasCaption
                ? "Write a caption to continue"
                : "Ready to share!";

    // Reset state when modal closes
    useEffect(() => {
        if (!open) {
            setTimeout(() => {
                setImageFile(null);
                setPostContent("");
                setLocation("");
                setIsDragging(false);
                setPosted(false);
            }, 300);
        }
    }, [open]);

    const onDrop = (acceptedFiles: File[]) => {
        setIsDragging(false);
        if (acceptedFiles.length > 0) setImageFile(acceptedFiles[0]);
    };

    const handleModalClose = () => {
        setImageFile(null);
        setPostContent("");
        setLocation("");
        handleClose();
    };

    const {
        getRootProps,
        getInputProps,
        open: openFileDialog,
    } = useDropzone({
        onDrop,
        onDragEnter: () => setIsDragging(true),
        onDragLeave: () => setIsDragging(false),
        accept: { "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"] },
        multiple: false,
        noClick: !!imageFile,
    });

    const handleEmojiClick = (emojiData: any) => {
        setPostContent((prev) => prev + emojiData.emoji);
    };

    const handleSubmit = async () => {
        if (!isReady) return;
        try {
            setLoading(true);
            setPostUploading(true);
            navigate(`/profile/${currentUser?.id}`);

            if (postContent.trim() && user) {
                const res = await createPost({
                    user_id: user.id,
                    content: postContent,
                    image: imageFile || undefined,
                    location,
                });

                if (res?.success) {
                    setPosted(true);
                    setTimeout(() => {
                        handleModalClose();
                        notifications.show("Post shared successfully!", {
                            severity: "success",
                            autoHideDuration: 3000,
                        });
                    }, 800);
                }
            }
        } catch (error) {
            console.error("Error uploading the post:", error);
            notifications.show("Error uploading the post. Please try again later.", {
                severity: "error",
                autoHideDuration: 3000,
            });
        } finally {
            setLoading(false);
            setPostUploading(false);
        }
    };

    // Design tokens
    const surface = isDark ? alpha("#fff", 0.04) : "#faf9f7";
    const borderColor = isDark ? alpha("#fff", 0.09) : alpha("#000", 0.08);
    const borderHover = isDark ? alpha("#fff", 0.18) : alpha("#000", 0.16);
    const accent = "#c94f2c";
    const accentSoft = alpha(accent, 0.08);
    const successColor = "#1a8f5a";

    const fieldLabelSx = {
        fontSize: "11px",
        fontWeight: 600,
        letterSpacing: "0.6px",
        textTransform: "uppercase" as const,
        color: "text.disabled",
        mb: 1,
        display: "block",
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
    };

    return (
        <Modal
            open={open}
            onClose={handleModalClose}
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
                        maxWidth: "800px",
                        maxHeight: isMobile ? "96vh" : "90vh",
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                        borderRadius: isMobile ? "20px 20px 0 0" : "20px",
                        border: `0.5px solid ${borderColor}`,
                        isolation: "isolate",
                        boxShadow: isDark ? "0 32px 80px rgba(0,0,0,0.6)" : "0 24px 64px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)",
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
                                "& em": {
                                    fontStyle: "italic",
                                    color: accent,
                                },
                            }}
                            dangerouslySetInnerHTML={{ __html: "New <em>post</em>" }}
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

                            {/* Close button */}
                            <IconButton
                                onClick={handleModalClose}
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

                    {/* ── Body ── */}
                    <Box
                        sx={{
                            display: "flex",
                            flex: 1,
                            overflow: "hidden",
                            flexDirection: { xs: "column", md: "row" },
                        }}
                    >
                        {/* Left: Image upload */}
                        <Box
                            sx={{
                                flex: "1.1 1 0",
                                display: "flex",
                                flexDirection: "column",
                                borderRight: { md: `0.5px solid ${borderColor}` },
                                borderBottom: { xs: `0.5px solid ${borderColor}`, md: "none" },
                                minWidth: 0,
                            }}
                        >
                            {/* Drop zone or preview */}
                            <Box
                                {...getRootProps()}
                                sx={{
                                    flex: 1,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: imageFile ? "default" : "pointer",
                                    position: "relative",
                                    overflow: "hidden",
                                    background: isDragging ? accentSoft : surface,
                                    minHeight: { xs: 200, md: 320 },
                                    transition: "background 0.2s ease",
                                    ...(!imageFile && {
                                        "&:hover": { background: alpha(accent, 0.04) },
                                    }),
                                }}
                                onMouseEnter={() => setIsPreviewHovered(true)}
                                onMouseLeave={() => setIsPreviewHovered(false)}
                            >
                                <input {...getInputProps()} />

                                {imageFile ? (
                                    <>
                                        <Box
                                            component="img"
                                            src={URL.createObjectURL(imageFile)}
                                            alt="Preview"
                                            sx={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                                position: "absolute",
                                                inset: 0,
                                                transition: "filter 0.2s ease",
                                                filter: isPreviewHovered ? "brightness(0.65)" : "brightness(1)",
                                            }}
                                        />
                                        {/* Hover actions */}
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
                                                    setImageFile(null);
                                                }}
                                                startIcon={<DeleteIcon sx={{ fontSize: "13px !important" }} />}
                                                sx={{
                                                    background: alpha("#fff", 0.92),
                                                    color: "#c94f2c",
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
                                    </>
                                ) : (
                                    <Box sx={{ textAlign: "center", p: 3, userSelect: "none" }}>
                                        <Box
                                            sx={{
                                                width: 56,
                                                height: 56,
                                                border: `1.5px solid ${borderHover}`,
                                                borderRadius: "12px",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                mx: "auto",
                                                mb: 1.5,
                                                background: "background.paper",
                                                transition: "border-color 0.2s ease",
                                            }}
                                        >
                                            <AddPhotoAlternate sx={{ fontSize: 22, color: isDragging ? accent : "text.disabled" }} />
                                        </Box>
                                        <Typography sx={{ fontSize: "15px", fontWeight: 500, color: "text.primary", mb: 0.5 }}>
                                            Drop your photo here
                                        </Typography>
                                        <Typography sx={{ fontSize: "13px", color: "text.disabled", mb: 1.5 }}>or click to browse</Typography>
                                        <Box sx={{ display: "flex", gap: 0.75, justifyContent: "center", flexWrap: "wrap" }}>
                                            {["JPG", "PNG", "GIF", "WEBP"].map((ext) => (
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

                            {/* File name footer */}
                            <Box
                                sx={{
                                    px: 2,
                                    py: 1.25,
                                    borderTop: `0.5px solid ${borderColor}`,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    flexShrink: 0,
                                    minHeight: 44,
                                }}
                            >
                                <Typography
                                    sx={{
                                        fontSize: "12px",
                                        color: "text.disabled",
                                        fontStyle: "italic",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                        maxWidth: 200,
                                    }}
                                >
                                    {imageFile ? imageFile.name : "No file selected"}
                                </Typography>
                                {imageFile && (
                                    <Typography
                                        component="button"
                                        onClick={() => setImageFile(null)}
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
                                )}
                            </Box>
                        </Box>

                        {/* Right: Content fields */}
                        <Box
                            sx={{
                                flex: 1,
                                display: "flex",
                                flexDirection: "column",
                                overflowY: "auto",
                                minWidth: 0,
                            }}
                        >
                            {/* Caption */}
                            <Box sx={{ px: 2.5, pt: 2, pb: 2, borderBottom: `0.5px solid ${borderColor}` }}>
                                <Typography component="label" sx={fieldLabelSx}>
                                    Caption
                                </Typography>
                                <Box sx={{ position: "relative" }}>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={isMobile ? 3 : 5}
                                        variant="outlined"
                                        placeholder="Write a caption…"
                                        value={postContent}
                                        onChange={(e) => setPostContent(e.target.value)}
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
                                    {postContent.length} / {CAPTION_LIMIT}
                                </Typography>
                            </Box>

                            {/* Location */}
                            <Box sx={{ px: 2.5, py: 2 }}>
                                <Typography component="label" sx={fieldLabelSx}>
                                    Location
                                </Typography>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    placeholder="Add a location…"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    sx={inputSx}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <LocationOn sx={{ fontSize: 16, color: "text.disabled" }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Box>
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
                                color: isReady ? successColor : "text.disabled",
                                transition: "color 0.3s ease",
                            }}
                        >
                            {posted ? "Post shared successfully!" : metaText}
                        </Typography>

                        <Box sx={{ display: "flex", gap: 1 }}>
                            <Button
                                variant="contained"
                                onClick={handleSubmit}
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
                                {posted ? "Shared!" : loading ? "Sharing…" : "Share"}
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

export default CreatePostModal;
