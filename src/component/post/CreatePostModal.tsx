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
    InputAdornment,
} from "@mui/material";
import { useDropzone } from "react-dropzone";
import { createPost } from "../../services/api";
import { useGlobalStore } from "../../store/store";
import { useNavigate } from "react-router-dom";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { SentimentSatisfiedAlt as EmojiIcon, LocationOn, Close, AddPhotoAlternate } from "@mui/icons-material";
import Popover from "@mui/material/Popover";
import { useNotifications } from "@toolpad/core/useNotifications";

interface CreatePostModalProps {
    open: boolean;
    handleClose: () => void;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ open, handleClose }) => {
    const navigate = useNavigate();
    const currentUser = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") || "") : {};
    const [postContent, setPostContent] = useState<string>("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [location, setLocation] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [emojiAnchorEl, setEmojiAnchorEl] = useState<null | HTMLElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);

    const notifications = useNotifications();
    const { user, setPostUploading } = useGlobalStore();

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    // Reset state when modal closes
    useEffect(() => {
        if (!open) {
            setTimeout(() => {
                setImageFile(null);
                setPostContent("");
                setLocation("");
                setIsDragging(false);
            }, 300);
        }
    }, [open]);

    const onDrop = (acceptedFiles: File[]) => {
        setIsDragging(false);
        if (acceptedFiles.length > 0) {
            setImageFile(acceptedFiles[0]);
        }
    };

    const handleModalClose = () => {
        setImageFile(null);
        setPostContent("");
        setLocation("");
        handleClose();
    };

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        onDragEnter: () => setIsDragging(true),
        onDragLeave: () => setIsDragging(false),
        accept: {
            "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
        },
        multiple: false,
    });

    const handleEmojiClick = (emojiData: any) => {
        setPostContent((prev) => prev + emojiData.emoji);
    };

    const handleSubmit = async () => {
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
                    handleModalClose();
                    notifications.show("Post created successfully!", {
                        severity: "success",
                        autoHideDuration: 3000,
                    });
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

    return (
        <Modal
            open={open}
            onClose={handleModalClose}
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
                p: isMobile ? 1 : 2,
            }}
        >
            <Fade in={open} timeout={500}>
                <Box
                    ref={modalRef}
                    sx={{
                        bgcolor: "background.paper",
                        boxShadow: 24,
                        p: 3,
                        borderRadius: "24px",
                        width: "100%",
                        maxWidth: "800px",
                        position: "relative",
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        maxHeight: "95vh",
                        overflow: "auto",
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
                            variant="h5"
                            sx={{
                                fontWeight: 700,
                                background: `linear-gradient(to right, #7a60ff, #ff8800)`,
                                backgroundClip: "text",
                                WebkitBackgroundClip: "text",
                                color: "transparent",
                            }}
                        >
                            Create Post
                        </Typography>
                        <IconButton
                            onClick={handleModalClose}
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

                    <Box
                        sx={{
                            display: "flex",
                            gap: 3,
                            flexDirection: { xs: "column", md: "row" },
                            alignItems: "stretch",
                        }}
                    >
                        {/* Left: Image Upload Section */}
                        <Box
                            {...getRootProps()}
                            sx={{
                                border: `2.5px dashed ${isDragging ? theme.palette.primary.main : alpha(theme.palette.text.primary, 0.2)}`,
                                borderRadius: "20px",
                                flex: 1,
                                minHeight: isMobile ? "250px" : "400px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                overflow: "hidden",
                                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                backgroundColor: isDragging
                                    ? alpha(theme.palette.primary.main, 0.05)
                                    : imageFile
                                      ? "transparent"
                                      : alpha(theme.palette.background.default, 0.5),
                                position: "relative",
                                "&:hover": {
                                    borderColor: theme.palette.primary.main,
                                    backgroundColor: alpha(theme.palette.primary.main, 0.03),
                                    transform: "translateY(-2px)",
                                },
                            }}
                        >
                            <input {...getInputProps()} />
                            {imageFile ? (
                                <Box
                                    sx={{
                                        width: "100%",
                                        height: "100%",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        borderRadius: "16px",
                                        overflow: "hidden",
                                        animation: "imageAppear 0.5s ease-out",
                                        "@keyframes imageAppear": {
                                            "0%": {
                                                opacity: 0,
                                                transform: "scale(0.95)",
                                            },
                                            "100%": {
                                                opacity: 1,
                                                transform: "scale(1)",
                                            },
                                        },
                                    }}
                                >
                                    <img
                                        src={URL.createObjectURL(imageFile)}
                                        alt="Preview"
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            borderRadius: "16px",
                                        }}
                                    />
                                </Box>
                            ) : (
                                <Box
                                    sx={{
                                        textAlign: "center",
                                        p: 3,
                                        animation: "fadeIn 0.6s ease-out",
                                        "@keyframes fadeIn": {
                                            "0%": { opacity: 0, transform: "translateY(10px)" },
                                            "100%": { opacity: 1, transform: "translateY(0)" },
                                        },
                                    }}
                                >
                                    <AddPhotoAlternate
                                        sx={{
                                            fontSize: 64,
                                            color: "primary.main",
                                            mb: 2,
                                            opacity: 0.8,
                                        }}
                                    />
                                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                                        Add Photo
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        Drag & drop or click to browse
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Supports JPG, PNG, GIF, WEBP
                                    </Typography>
                                </Box>
                            )}
                        </Box>

                        {/* Right: Content Section */}
                        <Box
                            sx={{
                                flex: 1,
                                display: "flex",
                                flexDirection: "column",
                                gap: 3,
                                minWidth: 0, // Prevents flexbox overflow
                            }}
                        >
                            {/* Caption Input */}
                            <Box
                                sx={{
                                    position: "relative",
                                    animation: "slideUp 0.4s ease-out 0.1s both",
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
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: "text.primary" }}>
                                    Caption
                                </Typography>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={4}
                                    variant="outlined"
                                    placeholder="What's on your mind?"
                                    value={postContent}
                                    onChange={(e) => setPostContent(e.target.value)}
                                    sx={{
                                        "& .MuiOutlinedInput-root": {
                                            borderRadius: "16px",
                                            paddingRight: "45px",
                                            transition: "all 0.2s ease",
                                            "&:hover fieldset": {
                                                borderColor: theme.palette.primary.main,
                                                boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`,
                                            },
                                            "&.Mui-focused fieldset": {
                                                borderColor: theme.palette.primary.main,
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
                                        bottom: 8,
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

                            {/* Location Input */}
                            <Box
                                sx={{
                                    animation: "slideUp 0.4s ease-out 0.2s both",
                                }}
                            >
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: "text.primary" }}>
                                    Location
                                </Typography>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    placeholder="Add location"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    sx={{
                                        "& .MuiOutlinedInput-root": {
                                            borderRadius: "16px",
                                            transition: "all 0.2s ease",
                                            "&:hover fieldset": {
                                                borderColor: theme.palette.primary.main,
                                                boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`,
                                            },
                                            "&.Mui-focused fieldset": {
                                                borderColor: theme.palette.primary.main,
                                                boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                                            },
                                        },
                                    }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <LocationOn
                                                    sx={{
                                                        color: "primary.main",
                                                        transition: "color 0.2s ease",
                                                    }}
                                                />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Box>

                            {/* Post Button */}
                            <Box
                                sx={{
                                    mt: "auto",
                                    animation: "slideUp 0.4s ease-out 0.3s both",
                                }}
                            >
                                <Button
                                    variant="contained"
                                    color="primary"
                                    fullWidth
                                    onClick={handleSubmit}
                                    disabled={!postContent.trim() || !imageFile || loading}
                                    sx={{
                                        borderRadius: "16px",
                                        backgroundColor:
                                            !postContent.trim() || !imageFile || loading
                                                ? alpha(theme.palette.primary.main, 0.5)
                                                : `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                        background:
                                            !postContent.trim() || !imageFile || loading
                                                ? alpha(theme.palette.primary.main, 0.5)
                                                : `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                        color: "white",
                                        position: "relative",
                                        overflow: "hidden",
                                        height: "48px",
                                        fontWeight: 600,
                                        fontSize: "1rem",
                                        textTransform: "none",
                                        transition: "all 0.4s cubic-bezier(0.65, 0, 0.35, 1)",
                                        boxShadow:
                                            postContent.trim() && imageFile && !loading
                                                ? `0 4px 20px ${alpha(theme.palette.primary.main, 0.3)}`
                                                : "none",
                                        "&:hover": {
                                            transform: postContent.trim() && imageFile && !loading ? "translateY(-2px)" : "none",
                                            boxShadow:
                                                postContent.trim() && imageFile && !loading
                                                    ? `0 8px 25px ${alpha(theme.palette.primary.main, 0.4)}`
                                                    : "none",
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
                                        "Create Post"
                                    )}
                                </Button>
                            </Box>
                        </Box>
                    </Box>

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

export default CreatePostModal;
