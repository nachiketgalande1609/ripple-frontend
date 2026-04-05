import {
    Dialog,
    DialogContent,
    Container,
    Box,
    IconButton,
    Avatar,
    Typography,
    Drawer,
    Stack,
    useTheme,
    useMediaQuery,
    Chip,
    alpha,
    Paper,
} from "@mui/material";
import { ArrowBackIos, ArrowForwardIos, Close, Pause, PlayArrow, Visibility, VolumeUp, VolumeOff } from "@mui/icons-material";
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { timeAgo } from "../../utils/utils";
import socket from "../../services/socket";
import BlankProfileImage from "../../static/profile_blank.png";

interface Story {
    story_id: number;
    media_url: string;
    media_type: "image" | "video";
    created_at: string;
    viewers: Viewer[];
    caption?: string;
}

interface Viewer {
    viewer_username: string;
    viewer_profile_picture: string;
    viewer_id: number;
}

interface UserStories {
    user_id: number;
    username: string;
    profile_picture: string;
    stories: Story[];
}

interface StoryDialogProps {
    open: boolean;
    onClose: () => void;
    stories: UserStories[];
    selectedStoryIndex: number;
}

const STORY_DURATION = 8000; // 5 seconds per story

const StoryDialog: React.FC<StoryDialogProps> = ({ open, onClose, stories, selectedStoryIndex }) => {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
    const isLarge = useMediaQuery(theme.breakpoints.up("lg"));

    const [currentIndex, setCurrentIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const animationFrameRef = useRef<number | null>(null);
    const [selectedUserStories, setSelectedUserStories] = useState<Story[]>([]);
    const [isMediaLoaded, setIsMediaLoaded] = useState(false);
    const [paused, setPaused] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [isMuted, setIsMuted] = useState(true);
    const [showCaption] = useState(true);
    const controlsTimeoutRef = useRef<NodeJS.Timeout>();
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const currentUser = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") || "") : {};

    // Define all callbacks before any conditional returns
    const handleClose = useCallback(() => {
        setProgress(0);
        setDrawerOpen(false);
        setPaused(false);
        onClose();
    }, [onClose]);

    const handleNext = useCallback(() => {
        if (currentIndex < selectedUserStories.length - 1) {
            setProgress(0);
            setIsMediaLoaded(false);
            setPaused(false);
            setCurrentIndex((prev) => prev + 1);
            setShowControls(true);
        } else {
            handleClose();
        }
    }, [currentIndex, selectedUserStories.length, handleClose]);

    const handlePrev = useCallback(() => {
        if (currentIndex > 0) {
            setProgress(0);
            setIsMediaLoaded(false);
            setPaused(false);
            setCurrentIndex((prev) => prev - 1);
            setShowControls(true);
        }
    }, [currentIndex]);

    const handlePauseStory = useCallback(() => {
        setPaused((prev) => !prev);
        setShowControls(true);
    }, []);

    const handleDrawerToggle = useCallback(() => {
        setDrawerOpen((prev) => {
            const newState = !prev;
            setPaused(newState);
            return newState;
        });
    }, []);

    const handleScreenTap = useCallback(() => {
        setShowControls((prev) => !prev);
        if (!paused) {
            setPaused(true);
        }
    }, [paused]);

    const handleVideoMute = useCallback(() => {
        setIsMuted((prev) => !prev);
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
        }
    }, [isMuted]);

    const getContainerWidth = useCallback(() => {
        if (isLarge) return "444px";
        if (isTablet) return "500px";
        return "100%";
    }, [isLarge, isTablet]);

    // Handle user story change
    useEffect(() => {
        if (open && stories.length && selectedStoryIndex < stories.length) {
            const currentStoryGroup = stories[selectedStoryIndex];
            setSelectedUserStories(currentStoryGroup.stories);
            setCurrentIndex(0);
            setIsMediaLoaded(false);
            setPaused(false);
            setShowControls(true);

            // Reset mute state for videos
            setIsMuted(true);

            if (currentStoryGroup.user_id !== currentUser?.id) {
                socket.emit("viewStory", {
                    user_id: currentUser?.id,
                    story_id: currentStoryGroup.stories[0]?.story_id,
                });
            }
        }
    }, [open, selectedStoryIndex, stories, currentUser?.id]);

    // Preload media
    useEffect(() => {
        if (!open || !selectedUserStories.length) return;

        setProgress(0);
        setIsMediaLoaded(false);

        const currentStory = selectedUserStories[currentIndex];

        if (currentStory?.media_type === "image") {
            const img = new Image();
            img.src = currentStory.media_url;
            img.onload = () => setIsMediaLoaded(true);
            img.onerror = () => setIsMediaLoaded(true);
        } else {
            setIsMediaLoaded(true);
        }
    }, [currentIndex, open, selectedUserStories]);

    // Start story timer after media is loaded
    useEffect(() => {
        if (!open || !isMediaLoaded || paused) return;

        const startTime = performance.now();

        const updateProgress = () => {
            const elapsed = performance.now() - startTime;
            const newProgress = Math.min((elapsed / STORY_DURATION) * 100, 100);
            setProgress(newProgress);

            if (newProgress < 100) {
                animationFrameRef.current = requestAnimationFrame(updateProgress);
            } else {
                if (currentIndex < selectedUserStories.length - 1) {
                    setCurrentIndex((prev) => prev + 1);
                } else {
                    handleClose();
                }
            }
        };

        animationFrameRef.current = requestAnimationFrame(updateProgress);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [currentIndex, open, isMediaLoaded, paused, selectedUserStories.length, handleClose]);

    // Auto-hide controls
    useEffect(() => {
        if (!paused && showControls) {
            controlsTimeoutRef.current = setTimeout(() => {
                setShowControls(false);
            }, 3000);
        }

        return () => {
            if (controlsTimeoutRef.current) {
                clearTimeout(controlsTimeoutRef.current);
            }
        };
    }, [paused, showControls]);

    // Early return after all hooks are defined
    if (!open) return null;

    if (!selectedUserStories.length || !selectedUserStories[currentIndex]) {
        return null;
    }

    return (
        <Dialog
            fullScreen
            open={open}
            onClose={handleClose}
            transitionDuration={300}
            PaperProps={{
                sx: {
                    backgroundColor: "transparent",
                    boxShadow: "none",
                },
            }}
        >
            <DialogContent
                sx={{
                    backgroundColor: "#000000",
                    padding: 0,
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                <Container
                    ref={containerRef}
                    maxWidth={false}
                    sx={{
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100vh",
                        width: getContainerWidth(),
                        padding: "0 !important",
                        margin: "0 auto",
                        boxShadow: "0 0 40px rgba(0,0,0,0.3)",
                    }}
                >
                    {/* Gradient Overlay for better text visibility */}
                    <Box
                        sx={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.3) 100%)",
                            pointerEvents: "none",
                            zIndex: 0,
                        }}
                    />

                    {/* Profile Info with Glassmorphism */}
                    <Box
                        sx={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 1.5,
                            cursor: "pointer",
                            zIndex: 10,
                            background: "linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.1) 100%)",
                            backdropFilter: "blur(10px)",
                            padding: "20px 20px",
                            borderBottom: "1px solid rgba(255,255,255,0.1)",
                            opacity: showControls ? 1 : 0,
                            transition: "opacity 0.3s ease",
                        }}
                    >
                        <Box
                            sx={{ display: "flex", alignItems: "center", gap: 1.5, flex: 1 }}
                            onClick={() => navigate(`/profile/${stories[selectedStoryIndex].user_id}`)}
                        >
                            <Avatar
                                src={stories[selectedStoryIndex].profile_picture || BlankProfileImage}
                                sx={{
                                    width: isMobile ? 50 : 45,
                                    height: isMobile ? 50 : 45,
                                    border: "2px solid rgba(255,255,255,0.3)",
                                    transition: "transform 0.2s",
                                    "&:hover": { transform: "scale(1.05)" },
                                }}
                            />
                            <Box>
                                <Typography
                                    sx={{
                                        color: "white",
                                        fontSize: isMobile ? "1rem" : "0.9rem",
                                        fontWeight: 600,
                                        textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                                    }}
                                >
                                    {stories[selectedStoryIndex].username}
                                </Typography>
                                <Typography
                                    sx={{
                                        color: alpha("#ffffff", 0.7),
                                        fontSize: "0.7rem",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 0.5,
                                    }}
                                >
                                    <Visibility sx={{ fontSize: "0.8rem" }} />
                                    {selectedUserStories[currentIndex]?.viewers?.length || 0} views
                                    {" • "}
                                    {timeAgo(selectedUserStories[currentIndex]?.created_at)}
                                </Typography>
                            </Box>
                        </Box>

                        <IconButton
                            onClick={handleClose}
                            sx={{
                                color: "white",
                                backgroundColor: "rgba(255,255,255,0.1)",
                                backdropFilter: "blur(5px)",
                                "&:hover": {
                                    backgroundColor: "rgba(255,255,255,0.2)",
                                    transform: "scale(1.05)",
                                },
                                transition: "all 0.2s",
                                zIndex: 10,
                            }}
                        >
                            <Close sx={{ fontSize: "20px" }} />
                        </IconButton>
                    </Box>

                    {/* Progress Bars */}
                    <Box
                        sx={{
                            position: "absolute",
                            top: isMobile ? 4 : 4,
                            left: 10,
                            right: 10,
                            display: "flex",
                            gap: 0.8,
                            zIndex: 10,
                        }}
                    >
                        {selectedUserStories.map((_, idx) => (
                            <Box
                                key={idx}
                                sx={{
                                    flex: 1,
                                    height: 3,
                                    borderRadius: 2,
                                    backgroundColor: "rgba(255, 255, 255, 0.3)",
                                    overflow: "hidden",
                                }}
                            >
                                <Box
                                    sx={{
                                        width: `${idx < currentIndex ? 100 : idx === currentIndex ? progress : 0}%`,
                                        height: "100%",
                                        backgroundColor: "white",
                                        transition: idx === currentIndex ? "none" : "width 0.3s ease",
                                        borderRadius: 2,
                                        boxShadow: idx === currentIndex ? "0 0 5px rgba(255,255,255,0.5)" : "none",
                                    }}
                                />
                            </Box>
                        ))}
                    </Box>

                    {/* Story Media with Gestures */}
                    <Box
                        sx={{
                            position: "relative",
                            width: "100%",
                            height: "100vh",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            cursor: "pointer",
                        }}
                        onClick={handleScreenTap}
                    >
                        {selectedUserStories[currentIndex].media_type === "image" ? (
                            <Box
                                component="img"
                                key={selectedUserStories[currentIndex].story_id}
                                src={selectedUserStories[currentIndex].media_url}
                                alt="Story"
                                onLoad={() => setIsMediaLoaded(true)}
                                sx={{
                                    maxHeight: "100vh",
                                    maxWidth: "100%",
                                    objectFit: "contain",
                                    display: isMediaLoaded ? "block" : "none",
                                    filter: "brightness(0.95)",
                                    opacity: isMediaLoaded ? 1 : 0,
                                    transition: "opacity 0.3s ease",
                                }}
                            />
                        ) : (
                            <Box
                                component="video"
                                ref={videoRef}
                                key={selectedUserStories[currentIndex].story_id}
                                src={selectedUserStories[currentIndex].media_url}
                                autoPlay
                                muted={isMuted}
                                onCanPlay={() => setIsMediaLoaded(true)}
                                sx={{
                                    maxHeight: "100vh",
                                    maxWidth: "100%",
                                    objectFit: "contain",
                                    display: isMediaLoaded ? "block" : "none",
                                    opacity: isMediaLoaded ? 1 : 0,
                                    transition: "opacity 0.3s ease",
                                }}
                            />
                        )}

                        {/* Loading Skeleton */}
                        {!isMediaLoaded && (
                            <Box
                                sx={{
                                    position: "absolute",
                                    top: "50%",
                                    left: "50%",
                                    transform: "translate(-50%, -50%)",
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        border: "3px solid rgba(255,255,255,0.3)",
                                        borderTop: "3px solid white",
                                        borderRadius: "50%",
                                        animation: "spin 1s linear infinite",
                                        "@keyframes spin": {
                                            "0%": { transform: "rotate(0deg)" },
                                            "100%": { transform: "rotate(360deg)" },
                                        },
                                    }}
                                />
                            </Box>
                        )}

                        {/* Pause Overlay */}
                        {paused && (
                            <Box
                                sx={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    backgroundColor: "rgba(0,0,0,0.3)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    zIndex: 5,
                                }}
                            >
                                <IconButton
                                    sx={{
                                        color: "white",
                                        backgroundColor: "rgba(255,255,255,0.2)",
                                        backdropFilter: "blur(10px)",
                                        borderRadius: "50%",
                                        width: 80,
                                        height: 80,
                                        "&:hover": {
                                            backgroundColor: "rgba(255,255,255,0.3)",
                                            transform: "scale(1.05)",
                                        },
                                        transition: "all 0.2s",
                                    }}
                                    onClick={handlePauseStory}
                                >
                                    <PlayArrow sx={{ fontSize: "3rem" }} />
                                </IconButton>
                            </Box>
                        )}

                        {/* Caption */}
                        {selectedUserStories[currentIndex].caption && showCaption && (
                            <Paper
                                elevation={0}
                                sx={{
                                    position: "absolute",
                                    bottom: 80,
                                    left: 20,
                                    right: 20,
                                    backgroundColor: "rgba(0,0,0,0.6)",
                                    backdropFilter: "blur(10px)",
                                    borderRadius: 2,
                                    padding: "12px 20px",
                                    maxWidth: "100%",
                                    wordBreak: "break-word",
                                    opacity: showControls ? 1 : 0,
                                    transition: "opacity 0.3s ease",
                                }}
                            >
                                <Typography
                                    sx={{
                                        color: "white",
                                        fontSize: isMobile ? "0.9rem" : "1rem",
                                        lineHeight: 1.5,
                                        textAlign: "center",
                                    }}
                                >
                                    {selectedUserStories[currentIndex].caption}
                                </Typography>
                            </Paper>
                        )}
                    </Box>

                    {/* Control Buttons */}
                    {showControls && (
                        <>
                            {/* Previous Button */}
                            {currentIndex > 0 && (
                                <IconButton
                                    sx={{
                                        position: "absolute",
                                        left: 10,
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        color: "white",
                                        backgroundColor: "rgba(0,0,0,0.4)",
                                        backdropFilter: "blur(5px)",
                                        "&:hover": {
                                            backgroundColor: "rgba(0,0,0,0.6)",
                                            transform: "translateY(-50%) scale(1.1)",
                                        },
                                        width: 40,
                                        height: 40,
                                        transition: "all 0.2s",
                                        zIndex: 10,
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handlePrev();
                                    }}
                                >
                                    <ArrowBackIos sx={{ fontSize: "1.2rem" }} />
                                </IconButton>
                            )}

                            {/* Next Button */}
                            {currentIndex < selectedUserStories.length - 1 && (
                                <IconButton
                                    sx={{
                                        position: "absolute",
                                        right: 10,
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        color: "white",
                                        backgroundColor: "rgba(0,0,0,0.4)",
                                        backdropFilter: "blur(5px)",
                                        "&:hover": {
                                            backgroundColor: "rgba(0,0,0,0.6)",
                                            transform: "translateY(-50%) scale(1.1)",
                                        },
                                        width: 40,
                                        height: 40,
                                        transition: "all 0.2s",
                                        zIndex: 10,
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleNext();
                                    }}
                                >
                                    <ArrowForwardIos sx={{ fontSize: "1.2rem" }} />
                                </IconButton>
                            )}

                            {/* Mute Button for Videos */}
                            {selectedUserStories[currentIndex].media_type === "video" && (
                                <IconButton
                                    sx={{
                                        position: "absolute",
                                        bottom: 20,
                                        right: 20,
                                        color: "white",
                                        backgroundColor: "rgba(0,0,0,0.4)",
                                        backdropFilter: "blur(5px)",
                                        "&:hover": { backgroundColor: "rgba(0,0,0,0.6)" },
                                        zIndex: 10,
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleVideoMute();
                                    }}
                                >
                                    {isMuted ? <VolumeOff sx={{ fontSize: "1.2rem" }} /> : <VolumeUp sx={{ fontSize: "1.2rem" }} />}
                                </IconButton>
                            )}

                            {/* Viewers Button */}
                            <IconButton
                                sx={{
                                    position: "absolute",
                                    bottom: 20,
                                    left: "50%",
                                    transform: "translateX(-50%)",
                                    color: "white",
                                    backgroundColor: "rgba(0,0,0,0.4)",
                                    backdropFilter: "blur(5px)",
                                    "&:hover": {
                                        backgroundColor: "rgba(0,0,0,0.6)",
                                        transform: "translateX(-50%) scale(1.05)",
                                    },
                                    transition: "all 0.2s",
                                    zIndex: 10,
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDrawerToggle();
                                }}
                            >
                                <Visibility sx={{ fontSize: "1.2rem" }} />
                                <Typography sx={{ ml: 0.5, fontSize: "0.8rem" }}>
                                    {selectedUserStories[currentIndex]?.viewers?.length || 0}
                                </Typography>
                            </IconButton>
                        </>
                    )}

                    {/* Modern Drawer for Viewers */}
                    <Drawer
                        anchor="bottom"
                        open={drawerOpen}
                        onClose={handleDrawerToggle}
                        sx={{
                            zIndex: 1400,
                            "& .MuiDrawer-paper": {
                                backgroundColor: "rgba(0,0,0,0.95)",
                                backdropFilter: "blur(20px)",
                                color: "white",
                                zIndex: 1400,
                                width: "100%",
                                maxWidth: "500px",
                                margin: "0 auto",
                                borderTopLeftRadius: "24px",
                                borderTopRightRadius: "24px",
                                height: "70vh",
                                display: "flex",
                                flexDirection: "column",
                                boxShadow: "0 -4px 20px rgba(0,0,0,0.5)",
                            },
                        }}
                    >
                        {/* Puller */}
                        <Box
                            sx={{
                                width: 50,
                                height: 5,
                                backgroundColor: "rgba(255,255,255,0.3)",
                                borderRadius: 3,
                                alignSelf: "center",
                                marginTop: 2,
                                marginBottom: 1,
                                cursor: "grab",
                                "&:hover": { backgroundColor: "rgba(255,255,255,0.5)" },
                            }}
                            onMouseDown={handleDrawerToggle}
                            onTouchStart={handleDrawerToggle}
                        />

                        {/* Header */}
                        <Typography
                            sx={{
                                textAlign: "center",
                                padding: "16px",
                                fontSize: "1.2rem",
                                fontWeight: 600,
                                borderBottom: "1px solid rgba(255,255,255,0.1)",
                            }}
                        >
                            Views ({selectedUserStories[currentIndex]?.viewers?.length || 0})
                        </Typography>

                        {/* Viewers List */}
                        <Box sx={{ padding: "16px", overflow: "auto", flex: 1 }}>
                            {selectedUserStories[currentIndex]?.viewers?.length > 0 ? (
                                <Stack spacing={2}>
                                    {selectedUserStories[currentIndex].viewers.map((viewer, index) => (
                                        <Stack
                                            key={index}
                                            direction="row"
                                            spacing={2}
                                            alignItems="center"
                                            sx={{
                                                padding: "8px",
                                                borderRadius: "12px",
                                                cursor: "pointer",
                                                transition: "all 0.2s",
                                                "&:hover": {
                                                    backgroundColor: "rgba(255,255,255,0.1)",
                                                    transform: "translateX(5px)",
                                                },
                                            }}
                                            onClick={() => navigate(`/profile/${viewer.viewer_id}`)}
                                        >
                                            <Avatar
                                                src={viewer.viewer_profile_picture || BlankProfileImage}
                                                sx={{
                                                    width: 50,
                                                    height: 50,
                                                    border: "2px solid rgba(255,255,255,0.2)",
                                                }}
                                            />
                                            <Box sx={{ flex: 1 }}>
                                                <Typography sx={{ fontWeight: 600 }}>{viewer.viewer_username}</Typography>
                                                <Typography sx={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.6)" }}>
                                                    Viewed {timeAgo(selectedUserStories[currentIndex]?.created_at)}
                                                </Typography>
                                            </Box>
                                            <Chip
                                                label="Viewer"
                                                size="small"
                                                sx={{
                                                    backgroundColor: "rgba(255,255,255,0.1)",
                                                    color: "white",
                                                    fontSize: "0.7rem",
                                                }}
                                            />
                                        </Stack>
                                    ))}
                                </Stack>
                            ) : (
                                <Box sx={{ textAlign: "center", padding: "40px" }}>
                                    <Visibility sx={{ fontSize: "3rem", color: "rgba(255,255,255,0.3)", mb: 2 }} />
                                    <Typography sx={{ color: "rgba(255,255,255,0.5)" }}>No views yet</Typography>
                                </Box>
                            )}
                        </Box>
                    </Drawer>
                </Container>
            </DialogContent>
        </Dialog>
    );
};

export default StoryDialog;
