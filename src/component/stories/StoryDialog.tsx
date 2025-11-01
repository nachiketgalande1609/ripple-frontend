import {
    Dialog,
    DialogContent,
    Container,
    Box,
    IconButton,
    LinearProgress,
    Avatar,
    Typography,
    Drawer,
    Stack,
    useTheme,
    useMediaQuery,
} from "@mui/material";
import { ArrowBackIos, ArrowForwardIos, Close, Pause, ExpandLess } from "@mui/icons-material";
import { useState, useEffect, useRef } from "react";
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

const STORY_DURATION = 5000; // 5 seconds per story

const StoryDialog: React.FC<StoryDialogProps> = ({ open, onClose, stories, selectedStoryIndex }) => {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    const [currentIndex, setCurrentIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const animationFrameRef = useRef<number | null>(null);
    const [selectedUserStories, setSelectedUserStories] = useState<Story[]>([]);
    const [isMediaLoaded, setIsMediaLoaded] = useState(false);
    const [paused, setPaused] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false); // Drawer state for viewers
    const currentUser = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") || "") : {};
    const isLarge = useMediaQuery("(min-width:1281px)");

    const containerRef = useRef<HTMLDivElement>(null);

    // Handle user story change
    useEffect(() => {
        if (open && stories.length && selectedStoryIndex < stories.length) {
            const currentStoryGroup = stories[selectedStoryIndex];
            setSelectedUserStories(currentStoryGroup.stories);
            setCurrentIndex(0);
            setIsMediaLoaded(false);
            setPaused(false);

            // Only emit view story if not current user's story
            if (currentStoryGroup.user_id !== currentUser?.id) {
                socket.emit("viewStory", {
                    user_id: currentUser?.id,
                    story_id: currentStoryGroup.stories[0]?.story_id,
                });
            }
        }
    }, [open, selectedStoryIndex, stories]);

    // Preload media
    useEffect(() => {
        if (!open || !selectedUserStories.length) return;

        setProgress(0);
        setIsMediaLoaded(false);

        const currentStory = selectedUserStories[currentIndex];

        if (currentStory.media_type === "image") {
            const img = new Image();
            img.src = currentStory.media_url;
            img.onload = () => setIsMediaLoaded(true);
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
    }, [currentIndex, open, isMediaLoaded, paused]);

    const handleClose = () => {
        setProgress(0);
        onClose();
    };

    if (!selectedUserStories.length || !selectedUserStories[currentIndex]) {
        return null;
    }

    const handleNext = () => {
        if (currentIndex < selectedUserStories.length - 1) {
            setProgress(0);
            setIsMediaLoaded(false);
            setPaused(false); // Reset pause when moving to the next story
            setCurrentIndex((prev) => prev + 1);
        } else {
            handleClose();
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setProgress(0);
            setIsMediaLoaded(false);
            setPaused(false); // Reset pause when moving to the previous story
            setCurrentIndex((prev) => prev - 1);
        }
    };

    const handlePauseStory = () => {
        setPaused((prev) => !prev);
    };

    const handleDrawerToggle = () => {
        setDrawerOpen((prev) => {
            const newState = !prev;
            setPaused(newState);
            return newState;
        });
    };

    return (
        <Dialog fullScreen open={open} onClose={handleClose}>
            <DialogContent sx={{ backgroundColor: "black", padding: 0 }}>
                <Container
                    ref={containerRef}
                    maxWidth={isMobile ? "lg" : "xs"}
                    sx={{
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100vh",
                        width: isLarge ? "444px" : isMobile ? "100%" : "300px",
                        padding: "0 !important",
                    }}
                >
                    {/* Profile Info */}
                    <Box
                        sx={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            cursor: "pointer",
                            zIndex: 1,
                            backgroundColor: "#000000",
                            width: "calc(100% - 32px)",
                            padding: "16px 16px",
                        }}
                        onClick={() => {
                            navigate(`/profile/${stories[selectedStoryIndex].user_id}`);
                        }}
                    >
                        <Avatar
                            src={stories[selectedStoryIndex].profile_picture || BlankProfileImage}
                            sx={isMobile ? { width: 60, height: 60 } : { width: 50, height: 50 }}
                        />
                        <Typography color="white" sx={{ fontSize: isMobile ? "1rem" : "0.85rem" }}>
                            {stories[selectedStoryIndex].username}
                        </Typography>
                        <Typography color="gray" sx={{ fontSize: "0.75rem" }}>
                            {timeAgo(selectedUserStories[currentIndex]?.created_at)}
                        </Typography>
                    </Box>

                    {/* Progress Bars */}
                    <Box
                        sx={{
                            position: "absolute",
                            top: 10,
                            left: 10,
                            right: 10,
                            display: "flex",
                            gap: 1,
                        }}
                    >
                        {selectedUserStories.map((_, idx) => (
                            <LinearProgress
                                key={idx}
                                variant="determinate"
                                value={idx < currentIndex ? 100 : idx === currentIndex ? progress : 0}
                                sx={{
                                    flex: 1,
                                    height: 2,
                                    borderRadius: 2,
                                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                                    "& .MuiLinearProgress-bar": {
                                        backgroundColor: "white",
                                    },
                                }}
                            />
                        ))}
                    </Box>

                    {/* Story Media */}
                    <Box
                        sx={{
                            position: "relative",
                            width: "100%",
                            height: "90vh",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                    >
                        {selectedUserStories[currentIndex].media_type === "image" ? (
                            <Box
                                component="img"
                                key={selectedUserStories[currentIndex].story_id} // Force re-render
                                src={selectedUserStories[currentIndex].media_url}
                                alt="Story"
                                onLoad={() => setIsMediaLoaded(true)}
                                onClick={handlePauseStory} // Add click handler
                                sx={{
                                    maxHeight: "90vh",
                                    maxWidth: "100%",
                                    objectFit: "contain",
                                    display: isMediaLoaded ? "block" : "none",
                                    cursor: "pointer",
                                }}
                            />
                        ) : (
                            <Box
                                component="video"
                                key={selectedUserStories[currentIndex].story_id} // Force re-render
                                src={selectedUserStories[currentIndex].media_url}
                                autoPlay
                                controls
                                onCanPlay={() => setIsMediaLoaded(true)}
                                onClick={handlePauseStory} // Add click handler
                                sx={{
                                    maxHeight: "90vh",
                                    maxWidth: "90vw",
                                    objectFit: "contain",
                                    display: isMediaLoaded ? "block" : "none",
                                    cursor: "pointer",
                                }}
                            />
                        )}

                        {selectedUserStories[currentIndex].caption && (
                            <Typography
                                sx={{
                                    position: "absolute",
                                    bottom: isLarge ? 50 : 20,
                                    left: 0,
                                    right: 0,
                                    color: "white",
                                    textAlign: "center",
                                    padding: "8px 16px",
                                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                                    maxWidth: "100%",
                                    margin: "0 auto",
                                    wordBreak: "break-word",
                                    fontSize: isLarge ? "1rem" : "0.85rem",
                                }}
                            >
                                {selectedUserStories[currentIndex].caption}
                            </Typography>
                        )}

                        {/* Pause Icon */}
                        {paused && (
                            <IconButton
                                sx={{
                                    position: "absolute",
                                    color: "white",
                                    backgroundColor: "rgba(0, 0, 0, 0.4)",
                                    borderRadius: "50%",
                                    zIndex: 1,
                                    "&:hover": {
                                        backgroundColor: "rgba(0, 0, 0, 0.6)",
                                    },
                                }}
                                onClick={handlePauseStory} // Toggle pause state
                            >
                                <Pause sx={{ fontSize: "5rem" }} />
                            </IconButton>
                        )}
                    </Box>

                    {/* Close Button */}
                    <IconButton
                        sx={{
                            position: "absolute",
                            top: isMobile ? 25 : 15,
                            right: isMobile ? 10 : 5,
                            color: "white",
                            backgroundColor: "transparent",
                            "&:hover": {
                                backgroundColor: "transparent",
                            },
                            zIndex: 1,
                        }}
                        onClick={handleClose}
                    >
                        <Close sx={{ fontSize: "20px" }} />
                    </IconButton>

                    {/* Previous Story Button */}
                    {currentIndex > 0 && (
                        <IconButton
                            sx={{
                                position: "absolute",
                                left: -50, // Move outside the story container
                                top: "50%",
                                transform: "translateY(-50%)",
                                color: "white",
                                backgroundColor: "rgba(0, 0, 0, 0.5)",
                                "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.7)" },
                                width: 48,
                                height: 48,
                            }}
                            onClick={handlePrev}
                        >
                            <ArrowBackIos sx={{ color: "#555555" }} />
                        </IconButton>
                    )}

                    {/* Next Story Button */}
                    {currentIndex < selectedUserStories.length - 1 && (
                        <IconButton
                            sx={{
                                position: "absolute",
                                right: -50, // Move outside the story container
                                top: "50%",
                                transform: "translateY(-50%)",
                                color: "white",
                                backgroundColor: "transparent",
                                "&:hover": { backgroundColor: "transparent" },
                                width: 48,
                                height: 48,
                            }}
                            onClick={handleNext}
                        >
                            <ArrowForwardIos sx={{ color: "#555555" }} />
                        </IconButton>
                    )}

                    {/* Story open Icon to open Drawer */}
                    <IconButton
                        sx={{
                            position: "absolute",
                            bottom: 10,
                            left: "50%",
                            transform: "translateX(-50%)",
                            color: "white",
                            backgroundColor: "rgba(0, 0, 0, 0.5)",
                            "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.7)" },
                        }}
                        onClick={handleDrawerToggle}
                    >
                        <ExpandLess sx={{ fontSize: "2rem" }} />
                    </IconButton>

                    {/* Drawer for Viewers */}
                    <Drawer
                        anchor="bottom"
                        open={drawerOpen}
                        onClose={handleDrawerToggle}
                        sx={{
                            zIndex: 1400,
                            "& .MuiDrawer-paper": {
                                backgroundColor: "black",
                                color: "white",
                                zIndex: 1400,
                                width: "100%",
                                maxWidth: "500px",
                                margin: "0 auto",
                                borderTopLeftRadius: "20px",
                                borderTopRightRadius: "20px",
                                height: "60vh",
                                display: "flex",
                                flexDirection: "column",
                            },
                        }}
                    >
                        {/* Puller */}
                        <Box
                            sx={{
                                width: 40,
                                height: 4,
                                backgroundColor: "gray",
                                borderRadius: 3,
                                alignSelf: "center",
                                marginTop: 2,
                                marginBottom: 0.5,
                                cursor: "grab",
                            }}
                            onMouseDown={handleDrawerToggle}
                            onTouchStart={handleDrawerToggle}
                        />

                        {/* Viewers List */}
                        <Box sx={{ padding: "0 16px 16px 16px", overflow: "auto", flex: 1 }}>
                            <Box sx={{ marginTop: 2 }}>
                                {selectedUserStories[currentIndex].viewers.map((viewer, index) => (
                                    <Stack key={index} direction="row" spacing={1.5} alignItems="center" sx={{ marginBottom: 1 }}>
                                        <Avatar
                                            src={viewer.viewer_profile_picture || BlankProfileImage}
                                            sx={{ width: isMobile ? "45px" : "50px", height: isMobile ? "45px" : "50px", cursor: "pointer" }}
                                            alt={viewer.viewer_username}
                                            onClick={() => navigate(`/profile/${viewer.viewer_id}`)}
                                        />
                                        <Typography
                                            sx={{ color: "#ffffff", cursor: "pointer" }}
                                            onClick={() => navigate(`/profile/${viewer.viewer_id}`)}
                                        >
                                            {viewer.viewer_username}
                                        </Typography>
                                    </Stack>
                                ))}
                            </Box>
                        </Box>
                    </Drawer>
                </Container>
            </DialogContent>
        </Dialog>
    );
};

export default StoryDialog;
