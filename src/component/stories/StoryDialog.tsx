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
} from "@mui/material";
import {
    ArrowBackIos,
    ArrowForwardIos,
    Close,
    PlayArrow,
    Pause,
    Visibility,
    VolumeUp,
    VolumeOff,
} from "@mui/icons-material";
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

const STORY_DURATION = 8000;

// Segmented progress bar for a single story
const ProgressSegment = ({ filled, active, progress }: { filled: boolean; active: boolean; progress: number }) => (
    <Box
        sx={{
            flex: 1,
            height: "2.5px",
            borderRadius: "2px",
            backgroundColor: "rgba(255,255,255,0.25)",
            overflow: "hidden",
            position: "relative",
        }}
    >
        <Box
            sx={{
                position: "absolute",
                inset: 0,
                width: filled ? "100%" : active ? `${progress}%` : "0%",
                background: "white",
                borderRadius: "2px",
                transition: active ? "none" : "width 0.25s ease",
                boxShadow: active ? "0 0 6px rgba(255,255,255,0.6)" : "none",
            }}
        />
    </Box>
);

const ViewerRow = ({
    viewer,
    createdAt,
    onClick,
}: {
    viewer: Viewer;
    createdAt: string;
    onClick: () => void;
}) => (
    <Stack
        direction="row"
        spacing={1.5}
        alignItems="center"
        onClick={onClick}
        sx={{
            px: 2,
            py: 1.25,
            borderRadius: "14px",
            cursor: "pointer",
            transition: "background 0.15s ease",
            "&:hover": { background: "rgba(255,255,255,0.07)" },
            "&:active": { background: "rgba(255,255,255,0.12)" },
        }}
    >
        <Avatar
            src={viewer.viewer_profile_picture || BlankProfileImage}
            sx={{
                width: 44,
                height: 44,
                border: "1.5px solid rgba(255,255,255,0.15)",
                flexShrink: 0,
            }}
        />
        <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
                noWrap
                sx={{ color: "white", fontWeight: 600, fontSize: "0.9rem", lineHeight: 1.3 }}
            >
                {viewer.viewer_username}
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.72rem", mt: 0.25 }}>
                {timeAgo(createdAt)}
            </Typography>
        </Box>
    </Stack>
);

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
    const controlsTimeoutRef = useRef<NodeJS.Timeout>();
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const longPressRef = useRef<NodeJS.Timeout>();
    const isLongPressRef = useRef(false);

    const currentUser = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") || "") : {};

    const cancelAnimation = useCallback(() => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    }, []);

    const handleClose = useCallback(() => {
        cancelAnimation();
        setProgress(0);
        setDrawerOpen(false);
        setPaused(false);
        onClose();
    }, [onClose, cancelAnimation]);

    const handleNext = useCallback(() => {
        cancelAnimation();
        if (currentIndex < selectedUserStories.length - 1) {
            setProgress(0);
            setIsMediaLoaded(false);
            setPaused(false);
            setCurrentIndex((p) => p + 1);
        } else {
            handleClose();
        }
    }, [currentIndex, selectedUserStories.length, handleClose, cancelAnimation]);

    const handlePrev = useCallback(() => {
        cancelAnimation();
        if (currentIndex > 0) {
            setProgress(0);
            setIsMediaLoaded(false);
            setPaused(false);
            setCurrentIndex((p) => p - 1);
        }
    }, [currentIndex, cancelAnimation]);

    const handlePauseToggle = useCallback(() => {
        setPaused((p) => !p);
        setShowControls(true);
    }, []);

    const handleDrawerToggle = useCallback(() => {
        setDrawerOpen((prev) => {
            const next = !prev;
            setPaused(next);
            return next;
        });
    }, []);

    const handleVideoMute = useCallback(() => {
        setIsMuted((prev) => {
            if (videoRef.current) videoRef.current.muted = !prev;
            return !prev;
        });
    }, []);

    const resetControlsTimer = useCallback(() => {
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        setShowControls(true);
        if (!paused) {
            controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 2500);
        }
    }, [paused]);

    // Long-press to pause, tap to navigate
    const handlePointerDown = useCallback(() => {
        isLongPressRef.current = false;
        longPressRef.current = setTimeout(() => {
            isLongPressRef.current = true;
            setPaused(true);
            setShowControls(false);
        }, 200);
    }, []);

    const handlePointerUp = useCallback(() => {
        if (longPressRef.current) clearTimeout(longPressRef.current);
        if (isLongPressRef.current) {
            setPaused(false);
            setShowControls(true);
        }
    }, []);

    const getContainerWidth = useCallback(() => {
        if (isLarge) return "420px";
        if (isTablet) return "480px";
        return "100%";
    }, [isLarge, isTablet]);

    // Story group change
    useEffect(() => {
        if (open && stories.length && selectedStoryIndex < stories.length) {
            const group = stories[selectedStoryIndex];
            setSelectedUserStories(group.stories);
            setCurrentIndex(0);
            setIsMediaLoaded(false);
            setPaused(false);
            setShowControls(true);
            setIsMuted(true);

            if (group.user_id !== currentUser?.id) {
                socket.emit("viewStory", {
                    user_id: currentUser?.id,
                    story_id: group.stories[0]?.story_id,
                });
            }
        }
    }, [open, selectedStoryIndex, stories, currentUser?.id]);

    // Media preload
    useEffect(() => {
        if (!open || !selectedUserStories.length) return;
        setProgress(0);
        setIsMediaLoaded(false);
        const story = selectedUserStories[currentIndex];
        if (story?.media_type === "image") {
            const img = new Image();
            img.src = story.media_url;
            img.onload = () => setIsMediaLoaded(true);
            img.onerror = () => setIsMediaLoaded(true);
        } else {
            setIsMediaLoaded(true);
        }
    }, [currentIndex, open, selectedUserStories]);

    // Progress timer
    useEffect(() => {
        if (!open || !isMediaLoaded || paused) return;
        cancelAnimation();
        const startTime = performance.now();

        const tick = () => {
            const elapsed = performance.now() - startTime;
            const pct = Math.min((elapsed / STORY_DURATION) * 100, 100);
            setProgress(pct);
            if (pct < 100) {
                animationFrameRef.current = requestAnimationFrame(tick);
            } else {
                if (currentIndex < selectedUserStories.length - 1) {
                    setCurrentIndex((p) => p + 1);
                    setIsMediaLoaded(false);
                    setProgress(0);
                } else {
                    handleClose();
                }
            }
        };

        animationFrameRef.current = requestAnimationFrame(tick);
        return cancelAnimation;
    }, [currentIndex, open, isMediaLoaded, paused, selectedUserStories.length, handleClose, cancelAnimation]);

    // Controls auto-hide
    useEffect(() => {
        if (!paused) {
            controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 2500);
        }
        return () => { if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current); };
    }, [paused, showControls]);

    if (!open) return null;
    if (!selectedUserStories.length || !selectedUserStories[currentIndex]) return null;

    const currentStory = selectedUserStories[currentIndex];
    const currentGroup = stories[selectedStoryIndex];
    const viewerCount = currentStory?.viewers?.length || 0;

    return (
        <Dialog
            fullScreen
            open={open}
            onClose={handleClose}
            transitionDuration={250}
            PaperProps={{
                sx: { backgroundColor: "#0a0a0a", boxShadow: "none" },
            }}
        >
            <DialogContent sx={{ p: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>

                {/* Ambient blurred background behind media */}
                <Box
                    sx={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 0,
                        backgroundImage: currentStory.media_type === "image" ? `url(${currentStory.media_url})` : "none",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        filter: "blur(40px) brightness(0.2) saturate(1.8)",
                        transform: "scale(1.15)",
                        transition: "background-image 0.3s ease",
                    }}
                />

                <Container
                    ref={containerRef}
                    maxWidth={false}
                    sx={{
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        height: "100dvh",
                        width: getContainerWidth(),
                        p: "0 !important",
                        zIndex: 1,
                    }}
                >

                    {/* ── Progress bars ── */}
                    <Box
                        sx={{
                            position: "absolute",
                            top: 10,
                            left: 12,
                            right: 12,
                            display: "flex",
                            gap: "4px",
                            zIndex: 20,
                        }}
                    >
                        {selectedUserStories.map((_, idx) => (
                            <ProgressSegment
                                key={idx}
                                filled={idx < currentIndex}
                                active={idx === currentIndex}
                                progress={progress}
                            />
                        ))}
                    </Box>

                    {/* ── Header ── */}
                    <Box
                        sx={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            pt: "22px",
                            pb: "14px",
                            px: "12px",
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            zIndex: 15,
                            background: "linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, transparent 100%)",
                            pointerEvents: showControls ? "auto" : "none",
                        }}
                    >
                        {/* Avatar + info */}
                        <Stack
                            direction="row"
                            alignItems="center"
                            spacing={1.25}
                            flex={1}
                            sx={{ cursor: "pointer", minWidth: 0 }}
                            onClick={() => navigate(`/profile/${currentGroup.user_id}`)}
                        >
                            <Box sx={{ position: "relative", flexShrink: 0 }}>
                                <Avatar
                                    src={currentGroup.profile_picture || BlankProfileImage}
                                    sx={{
                                        width: 38,
                                        height: 38,
                                        border: "2px solid rgba(255,255,255,0.9)",
                                    }}
                                />
                                {/* Live ring pulse when playing */}
                                {!paused && (
                                    <Box
                                        sx={{
                                            position: "absolute",
                                            inset: -3,
                                            borderRadius: "50%",
                                            border: "1.5px solid rgba(255,255,255,0.4)",
                                            animation: "ringPulse 2s ease-in-out infinite",
                                            "@keyframes ringPulse": {
                                                "0%, 100%": { opacity: 0.4, transform: "scale(1)" },
                                                "50%": { opacity: 0, transform: "scale(1.3)" },
                                            },
                                        }}
                                    />
                                )}
                            </Box>
                            <Box sx={{ minWidth: 0 }}>
                                <Typography
                                    noWrap
                                    sx={{ color: "white", fontWeight: 700, fontSize: "0.88rem", lineHeight: 1.2, letterSpacing: "-0.01em" }}
                                >
                                    {currentGroup.username}
                                </Typography>
                                <Typography
                                    sx={{ color: "rgba(255,255,255,0.55)", fontSize: "0.7rem", mt: 0.25 }}
                                >
                                    {timeAgo(currentStory.created_at)}
                                </Typography>
                            </Box>
                        </Stack>

                        {/* Pause / Mute / Close */}
                        <Stack direction="row" spacing={0.5} alignItems="center">
                            <IconButton
                                size="small"
                                onClick={(e) => { e.stopPropagation(); handlePauseToggle(); }}
                                sx={{ color: "rgba(255,255,255,0.85)", p: "6px" }}
                            >
                                {paused
                                    ? <PlayArrow sx={{ fontSize: "1.15rem" }} />
                                    : <Pause sx={{ fontSize: "1.15rem" }} />
                                }
                            </IconButton>

                            {currentStory.media_type === "video" && (
                                <IconButton
                                    size="small"
                                    onClick={(e) => { e.stopPropagation(); handleVideoMute(); }}
                                    sx={{ color: "rgba(255,255,255,0.85)", p: "6px" }}
                                >
                                    {isMuted
                                        ? <VolumeOff sx={{ fontSize: "1.15rem" }} />
                                        : <VolumeUp sx={{ fontSize: "1.15rem" }} />
                                    }
                                </IconButton>
                            )}

                            <IconButton
                                size="small"
                                onClick={handleClose}
                                sx={{ color: "rgba(255,255,255,0.85)", p: "6px" }}
                            >
                                <Close sx={{ fontSize: "1.15rem" }} />
                            </IconButton>
                        </Stack>
                    </Box>

                    {/* ── Media area ── */}
                    <Box
                        sx={{
                            position: "relative",
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                            borderRadius: isLarge || isTablet ? "18px" : 0,
                        }}
                        onPointerDown={handlePointerDown}
                        onPointerUp={handlePointerUp}
                        onPointerLeave={handlePointerUp}
                        onClick={resetControlsTimer}
                    >
                        {currentStory.media_type === "image" ? (
                            <Box
                                component="img"
                                key={currentStory.story_id}
                                src={currentStory.media_url}
                                alt="Story"
                                onLoad={() => setIsMediaLoaded(true)}
                                sx={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "contain",
                                    display: isMediaLoaded ? "block" : "none",
                                    opacity: isMediaLoaded ? 1 : 0,
                                    transition: "opacity 0.3s ease",
                                    userSelect: "none",
                                    WebkitUserDrag: "none",
                                    pointerEvents: "none",
                                }}
                            />
                        ) : (
                            <Box
                                component="video"
                                ref={videoRef}
                                key={currentStory.story_id}
                                src={currentStory.media_url}
                                autoPlay
                                muted={isMuted}
                                playsInline
                                onCanPlay={() => setIsMediaLoaded(true)}
                                sx={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: isMediaLoaded ? "block" : "none",
                                    opacity: isMediaLoaded ? 1 : 0,
                                    transition: "opacity 0.3s ease",
                                    pointerEvents: "none",
                                }}
                            />
                        )}

                        {/* Loading spinner */}
                        {!isMediaLoaded && (
                            <Box
                                sx={{
                                    position: "absolute",
                                    top: "50%",
                                    left: "50%",
                                    transform: "translate(-50%, -50%)",
                                    width: 36,
                                    height: 36,
                                    border: "2.5px solid rgba(255,255,255,0.15)",
                                    borderTop: "2.5px solid rgba(255,255,255,0.9)",
                                    borderRadius: "50%",
                                    animation: "spin 0.7s linear infinite",
                                    "@keyframes spin": {
                                        from: { transform: "translate(-50%, -50%) rotate(0deg)" },
                                        to: { transform: "translate(-50%, -50%) rotate(360deg)" },
                                    },
                                }}
                            />
                        )}

                        {/* Tap zones: left = prev, right = next */}
                        <Box
                            sx={{
                                position: "absolute",
                                inset: 0,
                                display: "flex",
                                zIndex: 5,
                                pointerEvents: "none",
                            }}
                        >
                            <Box
                                sx={{ flex: 1, pointerEvents: "auto", cursor: "pointer" }}
                                onClick={(e) => { e.stopPropagation(); if (!isLongPressRef.current) handlePrev(); }}
                            />
                            <Box
                                sx={{ flex: 2, pointerEvents: "auto", cursor: "pointer" }}
                                onClick={(e) => { e.stopPropagation(); if (!isLongPressRef.current) handleNext(); }}
                            />
                        </Box>

                        {/* Paused overlay */}
                        {paused && (
                            <Box
                                sx={{
                                    position: "absolute",
                                    inset: 0,
                                    backgroundColor: "rgba(0,0,0,0.45)",
                                    zIndex: 6,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    animation: "fadeIn 0.15s ease",
                                    "@keyframes fadeIn": { from: { opacity: 0 }, to: { opacity: 1 } },
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 64,
                                        height: 64,
                                        borderRadius: "50%",
                                        background: "rgba(255,255,255,0.12)",
                                        backdropFilter: "blur(8px)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        border: "1px solid rgba(255,255,255,0.2)",
                                    }}
                                >
                                    <PlayArrow sx={{ color: "white", fontSize: "2rem" }} />
                                </Box>
                            </Box>
                        )}

                        {/* Caption */}
                        {currentStory.caption && (
                            <Box
                                sx={{
                                    position: "absolute",
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    px: 2,
                                    pb: 2.5,
                                    pt: 6,
                                    background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)",
                                    zIndex: 4,
                                    pointerEvents: "none",
                                }}
                            >
                                <Typography
                                    sx={{
                                        color: "white",
                                        fontSize: isMobile ? "0.88rem" : "0.95rem",
                                        lineHeight: 1.55,
                                        fontWeight: 400,
                                        textShadow: "0 1px 4px rgba(0,0,0,0.5)",
                                        letterSpacing: "0.01em",
                                    }}
                                >
                                    {currentStory.caption}
                                </Typography>
                            </Box>
                        )}

                        {/* Prev arrow */}
                        {currentIndex > 0 && showControls && (
                            <IconButton
                                sx={{
                                    position: "absolute",
                                    left: 10,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    color: "white",
                                    background: "rgba(0,0,0,0.3)",
                                    backdropFilter: "blur(6px)",
                                    border: "1px solid rgba(255,255,255,0.12)",
                                    width: 36,
                                    height: 36,
                                    zIndex: 10,
                                    "&:hover": { background: "rgba(0,0,0,0.55)" },
                                    transition: "all 0.15s",
                                }}
                                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                            >
                                <ArrowBackIos sx={{ fontSize: "0.95rem", ml: "4px" }} />
                            </IconButton>
                        )}

                        {/* Next arrow */}
                        {currentIndex < selectedUserStories.length - 1 && showControls && (
                            <IconButton
                                sx={{
                                    position: "absolute",
                                    right: 10,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    color: "white",
                                    background: "rgba(0,0,0,0.3)",
                                    backdropFilter: "blur(6px)",
                                    border: "1px solid rgba(255,255,255,0.12)",
                                    width: 36,
                                    height: 36,
                                    zIndex: 10,
                                    "&:hover": { background: "rgba(0,0,0,0.55)" },
                                    transition: "all 0.15s",
                                }}
                                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                            >
                                <ArrowForwardIos sx={{ fontSize: "0.95rem" }} />
                            </IconButton>
                        )}
                    </Box>

                    {/* ── Views footer pill ── */}
                    <Box
                        sx={{
                            position: "absolute",
                            bottom: 20,
                            left: "50%",
                            transform: "translateX(-50%)",
                            zIndex: 20,
                        }}
                    >
                        <Box
                            onClick={(e) => { e.stopPropagation(); handleDrawerToggle(); }}
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.75,
                                px: 2,
                                py: 0.9,
                                borderRadius: "30px",
                                background: "rgba(255,255,255,0.12)",
                                backdropFilter: "blur(12px)",
                                border: "1px solid rgba(255,255,255,0.16)",
                                cursor: "pointer",
                                transition: "all 0.15s",
                                "&:hover": { background: "rgba(255,255,255,0.2)" },
                                "&:active": { transform: "scale(0.97)" },
                            }}
                        >
                            <Visibility sx={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.75)" }} />
                            <Typography sx={{ color: "rgba(255,255,255,0.9)", fontSize: "0.82rem", fontWeight: 600 }}>
                                {viewerCount} {viewerCount === 1 ? "view" : "views"}
                            </Typography>
                        </Box>
                    </Box>

                </Container>

                {/* ── Viewers Drawer ── */}
                <Drawer
                    anchor="bottom"
                    open={drawerOpen}
                    onClose={handleDrawerToggle}
                    sx={{
                        zIndex: 1500,
                        "& .MuiBackdrop-root": { backgroundColor: "transparent" },
                        "& .MuiDrawer-paper": {
                            background: "rgba(16,16,18,0.97)",
                            backdropFilter: "blur(24px)",
                            WebkitBackdropFilter: "blur(24px)",
                            color: "white",
                            width: "100%",
                            maxWidth: getContainerWidth(),
                            margin: "0 auto",
                            borderTopLeftRadius: "22px",
                            borderTopRightRadius: "22px",
                            maxHeight: "65vh",
                            display: "flex",
                            flexDirection: "column",
                            borderTop: "1px solid rgba(255,255,255,0.08)",
                        },
                    }}
                >
                    {/* Handle */}
                    <Box sx={{ display: "flex", justifyContent: "center", pt: 1.5, pb: 0.5, flexShrink: 0 }}>
                        <Box
                            sx={{
                                width: 36,
                                height: 4,
                                borderRadius: "2px",
                                background: "rgba(255,255,255,0.2)",
                                cursor: "pointer",
                            }}
                            onClick={handleDrawerToggle}
                        />
                    </Box>

                    {/* Drawer header */}
                    <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        sx={{ px: 2.5, py: 1.5, borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}
                    >
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Visibility sx={{ fontSize: "1rem", color: "rgba(255,255,255,0.5)" }} />
                            <Typography sx={{ fontWeight: 700, fontSize: "1rem" }}>
                                {viewerCount} {viewerCount === 1 ? "View" : "Views"}
                            </Typography>
                        </Stack>
                        <IconButton size="small" onClick={handleDrawerToggle} sx={{ color: "rgba(255,255,255,0.5)", p: "4px" }}>
                            <Close sx={{ fontSize: "1rem" }} />
                        </IconButton>
                    </Stack>

                    {/* Viewers list */}
                    <Box sx={{ overflowY: "auto", flex: 1, py: 1 }}>
                        {viewerCount > 0 ? (
                            currentStory.viewers.map((viewer, i) => (
                                <ViewerRow
                                    key={i}
                                    viewer={viewer}
                                    createdAt={currentStory.created_at}
                                    onClick={() => {
                                        handleDrawerToggle();
                                        navigate(`/profile/${viewer.viewer_id}`);
                                    }}
                                />
                            ))
                        ) : (
                            <Box sx={{ textAlign: "center", py: 6 }}>
                                <Visibility sx={{ fontSize: "2.5rem", color: "rgba(255,255,255,0.15)", display: "block", mx: "auto", mb: 1.5 }} />
                                <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.88rem" }}>
                                    No views yet
                                </Typography>
                                <Typography sx={{ color: "rgba(255,255,255,0.2)", fontSize: "0.78rem", mt: 0.5 }}>
                                    Be the first to share this story
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Drawer>

            </DialogContent>
        </Dialog>
    );
};

export default StoryDialog;