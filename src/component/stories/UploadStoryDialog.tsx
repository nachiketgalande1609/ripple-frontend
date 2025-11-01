import { useState, useRef, useEffect } from "react";
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
} from "@mui/material";
import { useDropzone } from "react-dropzone";
import { uploadStory } from "../../services/api";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { SentimentSatisfiedAlt as EmojiIcon, Close, CloudUpload, VideoFile, Image } from "@mui/icons-material";
import Popover from "@mui/material/Popover";

interface UploadStoryDialogProps {
    open: boolean;
    onClose: () => void;
    fetchStories: () => Promise<void>;
}

const UploadStoryDialog: React.FC<UploadStoryDialogProps> = ({ open, onClose, fetchStories }) => {
    const currentUser = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") || "") : {};
    const [media, setMedia] = useState<File | null>(null);
    const [caption, setCaption] = useState("");
    const [loading, setLoading] = useState(false);
    const [emojiAnchorEl, setEmojiAnchorEl] = useState<null | HTMLElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const isTablet = useMediaQuery(theme.breakpoints.down("md"));

    // Reset state when modal closes
    useEffect(() => {
        if (!open) {
            setTimeout(() => {
                setMedia(null);
                setCaption("");
                setIsDragging(false);
            }, 300);
        }
    }, [open]);

    const onDrop = (acceptedFiles: File[]) => {
        setIsDragging(false);
        if (acceptedFiles.length > 0) {
            setMedia(acceptedFiles[0]);
        }
    };

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        onDragEnter: () => setIsDragging(true),
        onDragLeave: () => setIsDragging(false),
        accept: {
            "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
            "video/*": [".mp4", ".mov", ".avi", ".webm"],
        },
        multiple: false,
    });

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
                setMedia(null);
                setCaption("");
                onClose();
                fetchStories();
            }
        } catch (error) {
            console.error("Failed to upload story:", error);
            alert("Error uploading story. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Function to check file type
    const isVideo = media ? media.type.startsWith("video") : false;
    const isImage = media ? media.type.startsWith("image") : false;

    const handleEmojiClick = (emojiData: any) => {
        setCaption((prev) => prev + emojiData.emoji);
    };

    const getFileTypeIcon = () => {
        if (isVideo) return <VideoFile sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />;
        if (isImage) return <Image sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />;
        return <CloudUpload sx={{ fontSize: 48, mb: 2 }} />;
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            closeAfterTransition
            BackdropComponent={Backdrop}
            BackdropProps={{
                timeout: 500,
                sx: {
                    backgroundColor: alpha("#000", 0.8),
                    backdropFilter: "blur(8px)",
                },
            }}
            sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                p: isMobile ? 2 : 3,
            }}
        >
            <Fade in={open} timeout={500}>
                <Box
                    ref={modalRef}
                    sx={{
                        bgcolor: "background.paper",
                        boxShadow: 24,
                        p: "20px",
                        borderRadius: "24px",
                        width: "100%",
                        maxWidth: "500px",
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        maxHeight: "90vh",
                        overflow: "hidden",
                        transform: "scale(1)",
                        animation: "modalAppear 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
                        "@keyframes modalAppear": {
                            "0%": {
                                opacity: 0,
                                transform: "scale(0.8) translateY(20px)",
                            },
                            "100%": {
                                opacity: 1,
                                transform: "scale(1) translateY(0)",
                            },
                        },
                    }}
                >
                    {/* Header */}
                    <Box
                        sx={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            mb: 3,
                            pb: 2,
                            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        }}
                    >
                        <Typography
                            variant="h6"
                            sx={{
                                fontWeight: 700,
                                background: `linear-gradient(to right, #7a60ff, #ff8800)`,
                                backgroundClip: "text",
                                WebkitBackgroundClip: "text",
                                color: "transparent",
                            }}
                        >
                            Create Story
                        </Typography>
                        <IconButton
                            onClick={() => {
                                onClose();
                                setMedia(null);
                                setCaption("");
                            }}
                            sx={{
                                color: "text.secondary",
                                transition: "all 0.2s ease",
                                "&:hover": {
                                    color: "text.primary",
                                    transform: "rotate(90deg)",
                                    backgroundColor: alpha(theme.palette.error.main, 0.1),
                                },
                            }}
                        >
                            <Close />
                        </IconButton>
                    </Box>

                    {/* Drag and Drop Area */}
                    <Box
                        {...getRootProps()}
                        sx={{
                            // border: `2px dashed ${isDragging ? theme.palette.primary.main : alpha(theme.palette.text.primary, 0.2)}`,
                            borderRadius: "20px",
                            padding: 4,
                            textAlign: "center",
                            cursor: "pointer",
                            marginBottom: 3,
                            height: media ? (isMobile ? "200px" : "250px") : "auto",
                            minHeight: media ? "200px" : "150px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "100%",
                            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            backgroundColor: isDragging
                                ? alpha(theme.palette.primary.main, 0.05)
                                : media
                                  ? "transparent"
                                  : alpha(theme.palette.background.default, 0.5),
                            position: "relative",
                            overflow: "hidden",
                        }}
                    >
                        <input {...getInputProps()} />
                        {media ? (
                            <Box
                                sx={{
                                    width: "100%",
                                    height: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    borderRadius: "16px",
                                    overflow: "hidden",
                                }}
                            >
                                {isVideo ? (
                                    <video
                                        src={URL.createObjectURL(media)}
                                        controls
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            borderRadius: "16px",
                                            maxHeight: "100%",
                                        }}
                                    />
                                ) : isImage ? (
                                    <img
                                        src={URL.createObjectURL(media)}
                                        alt="Story Preview"
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            borderRadius: "16px",
                                            maxHeight: "100%",
                                        }}
                                    />
                                ) : (
                                    <Typography color="error">Unsupported file format</Typography>
                                )}
                            </Box>
                        ) : (
                            <>
                                {getFileTypeIcon()}
                                <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                                    Drag & drop your media
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    or click to browse files
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Supports images and videos
                                </Typography>
                            </>
                        )}
                    </Box>

                    {/* Caption Input */}
                    {media && (
                        <Box
                            sx={{
                                position: "relative",
                                marginBottom: 3,
                                width: "100%",
                                animation: "slideUp 0.4s ease-out",
                                "@keyframes slideUp": {
                                    "0%": {
                                        opacity: 0,
                                        transform: "translateY(20px)",
                                    },
                                    "100%": {
                                        opacity: 1,
                                        transform: "translateY(0)",
                                    },
                                },
                            }}
                        >
                            <TextField
                                fullWidth
                                multiline
                                rows={2}
                                variant="outlined"
                                label="Add a caption..."
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                sx={{
                                    marginBottom: 2,
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: "16px",
                                        paddingRight: "45px",
                                        transition: "all 0.2s ease",
                                        "&:hover": {
                                            boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`,
                                        },
                                        "&.Mui-focused": {
                                            boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                                        },
                                    },
                                    "& .MuiInputLabel-root": {
                                        fontSize: "0.95rem",
                                    },
                                }}
                            />
                            <IconButton
                                onClick={(e) => setEmojiAnchorEl(e.currentTarget)}
                                sx={{
                                    position: "absolute",
                                    top: 8,
                                    right: 8,
                                    zIndex: 1,
                                    color: "text.secondary",
                                    transition: "all 0.2s ease",
                                    "&:hover": {
                                        color: "primary.main",
                                        transform: "scale(1.1)",
                                    },
                                }}
                            >
                                <EmojiIcon />
                            </IconButton>
                        </Box>
                    )}

                    {/* Upload Button */}
                    <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        onClick={handleUpload}
                        disabled={!media || loading}
                        sx={{
                            borderRadius: "16px",
                            backgroundColor:
                                !media || loading
                                    ? alpha(theme.palette.primary.main, 0.5)
                                    : `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                            background: !media || loading ? alpha(theme.palette.primary.main, 0.5) : `linear-gradient(to right, #7a60ff, #ff8800)`,
                            color: "white",
                            position: "relative",
                            overflow: "hidden",
                            height: "48px",
                            fontWeight: 600,
                            fontSize: "1rem",
                            textTransform: "none",
                            transition: "all 0.4s cubic-bezier(0.65, 0, 0.35, 1)",
                            boxShadow: media && !loading ? `0 4px 20px ${alpha(theme.palette.primary.main, 0.3)}` : "none",
                            "&:hover": {
                                transform: media && !loading ? "translateY(-2px)" : "none",
                                boxShadow: media && !loading ? `0 8px 25px ${alpha(theme.palette.primary.main, 0.4)}` : "none",
                                background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                            },
                            "&:active": {
                                transform: "translateY(0)",
                            },
                            "&::before": {
                                content: '""',
                                position: "absolute",
                                top: 0,
                                left: "-100%",
                                width: "100%",
                                height: "100%",
                                background: `linear-gradient(90deg, transparent, ${alpha("#fff", 0.2)}, transparent)`,
                                transition: "left 0.5s ease",
                            },
                            "&:hover::before": {
                                left: "100%",
                            },
                            ...(loading && {
                                minWidth: "48px",
                                width: "48px",
                                borderRadius: "50%",
                            }),
                        }}
                    >
                        {loading ? (
                            <CircularProgress
                                size={24}
                                thickness={4}
                                sx={{
                                    color: "white",
                                }}
                            />
                        ) : (
                            "Share Story"
                        )}
                    </Button>

                    {/* Emoji Picker Popover */}
                    <Popover
                        open={Boolean(emojiAnchorEl)}
                        anchorEl={emojiAnchorEl}
                        onClose={() => setEmojiAnchorEl(null)}
                        anchorOrigin={{
                            vertical: "top",
                            horizontal: "left",
                        }}
                        transformOrigin={{
                            vertical: "bottom",
                            horizontal: "left",
                        }}
                        PaperProps={{
                            sx: {
                                borderRadius: "20px",
                                overflow: "hidden",
                                boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
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
