import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    Box,
    Avatar,
    Typography,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Divider,
} from "@mui/material";
import {
    FavoriteRounded,
    FavoriteBorderRounded,
    ChatBubbleOutlineRounded,
    RepeatRounded,
    BookmarkRounded,
    BookmarkBorderRounded,
    VolumeOffRounded,
    VolumeUpRounded,
} from "@mui/icons-material";
import {
    getReels,
    likePost,
    repostPost,
    unrepostPost,
    savePost,
    recordReelView,
} from "../services/api";
import BlankProfileImage from "../static/profile_blank.png";

// ── Inject keyframe animations ──────────────────────────────────────────
const STYLE_ID = "reels-animations-v1";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
    const s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = `
        @keyframes reel-pop {
            0%   { transform: scale(1); }
            40%  { transform: scale(1.35); }
            70%  { transform: scale(0.88); }
            100% { transform: scale(1); }
        }
        @keyframes reel-spin {
            0%   { transform: scale(1) rotate(0deg); }
            40%  { transform: scale(1.3) rotate(180deg); }
            70%  { transform: scale(0.9) rotate(330deg); }
            100% { transform: scale(1) rotate(360deg); }
        }
    `;
    document.head.appendChild(s);
}

// ── Types ────────────────────────────────────────────────────────────────

interface ReelComment {
    id: number;
    user_id: number;
    content: string;
    commenter_username: string;
    commenter_profile_picture: string | null;
    timeAgo: string;
}

interface Reel {
    id: number;
    user_id: number;
    username: string;
    profile_picture: string | null;
    file_url: string;
    content: string;
    created_at: string;
    timeAgo: string;
    like_count: number;
    liked_by_current_user: 0 | 1;
    repost_count: number;
    is_reposted: 0 | 1;
    saved_by_current_user: 0 | 1;
    comment_count: number;
    comments?: ReelComment[];
}

interface ReelState {
    liked: boolean;
    likeCount: number;
    reposted: boolean;
    repostCount: number;
    saved: boolean;
}

// ── Action button ────────────────────────────────────────────────────────

function ActionBtn({
    icon,
    count,
    onClick,
}: {
    icon: React.ReactNode;
    count?: number | string;
    onClick: () => void;
}) {
    return (
        <Box
            onClick={onClick}
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 0.4,
                cursor: "pointer",
                WebkitTapHighlightColor: "transparent",
                userSelect: "none",
            }}
        >
            <Box sx={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {icon}
            </Box>
            {count !== undefined && count !== "" && (
                <Typography sx={{ fontSize: "0.72rem", color: "#fff", lineHeight: 1 }}>
                    {count}
                </Typography>
            )}
        </Box>
    );
}

// ── Single reel card — video + overlay only, NO action buttons ───────────

interface ReelCardProps {
    reel: Reel;
    videoRef: (el: HTMLVideoElement | null) => void;
    muted: boolean;
    onToggleMute: () => void;
}

function ReelCard({ reel, videoRef, muted, onToggleMute }: ReelCardProps) {
    const navigate = useNavigate();

    return (
        <Box
            sx={{
                position: "relative",
                width: "100%",
                height: "100vh",
                flexShrink: 0,
                overflow: "hidden",
                backgroundColor: "#000",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            {/* 9:16 video container */}
            <Box
                sx={{
                    position: "relative",
                    height: "100vh",
                    width: "calc(100vh * 9 / 16)",
                    maxWidth: "100%",
                    flexShrink: 0,
                    overflow: "hidden",
                }}
            >
                {/* Video */}
                <Box
                    component="video"
                    ref={videoRef}
                    src={reel.file_url}
                    loop
                    muted={muted}
                    playsInline
                    preload="metadata"
                    sx={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                    }}
                />

                {/* Gradient overlay */}
                <Box
                    sx={{
                        position: "absolute",
                        inset: 0,
                        background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 50%)",
                        pointerEvents: "none",
                    }}
                />

                {/* Mute toggle — top right inside video */}
                <Box
                    onClick={onToggleMute}
                    sx={{
                        position: "absolute",
                        top: 16,
                        right: 16,
                        width: 38,
                        height: 38,
                        borderRadius: "50%",
                        background: "rgba(0,0,0,0.45)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        zIndex: 2,
                    }}
                >
                    {muted
                        ? <VolumeOffRounded sx={{ color: "#fff", fontSize: "1.2rem" }} />
                        : <VolumeUpRounded sx={{ color: "#fff", fontSize: "1.2rem" }} />
                    }
                </Box>

                {/* Bottom-left info */}
                <Box
                    sx={{
                        position: "absolute",
                        bottom: 24,
                        left: 14,
                        right: 14,
                        zIndex: 2,
                        display: "flex",
                        alignItems: "flex-end",
                        gap: 1.5,
                    }}
                >
                    <Avatar
                        src={reel.profile_picture || BlankProfileImage}
                        alt={reel.username}
                        onClick={() => navigate(`/profile/${reel.user_id}`)}
                        sx={{ width: 42, height: 42, border: "2px solid #fff", cursor: "pointer", flexShrink: 0, mb: 0.25 }}
                    />
                    <Box sx={{ overflow: "hidden" }}>
                        <Typography
                            onClick={() => navigate(`/profile/${reel.user_id}`)}
                            sx={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem", lineHeight: 1.3, cursor: "pointer", textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}
                        >
                            @{reel.username}
                        </Typography>
                        {reel.content && (
                            <Typography
                                sx={{
                                    color: "rgba(255,255,255,0.85)", fontSize: "0.8rem", lineHeight: 1.4,
                                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                                    overflow: "hidden", textShadow: "0 1px 4px rgba(0,0,0,0.6)",
                                }}
                            >
                                {reel.content}
                            </Typography>
                        )}
                        <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: "0.72rem", mt: 0.25 }}>
                            {reel.timeAgo}
                        </Typography>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

// ── Skeleton card ────────────────────────────────────────────────────────

function SkeletonCard() {
    return (
        <Box
            sx={{
                width: "100%",
                height: "100vh",
                backgroundColor: "#111",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                "@keyframes skeleton-pulse": {
                    "0%": { opacity: 0.4 },
                    "50%": { opacity: 0.8 },
                    "100%": { opacity: 0.4 },
                },
                animation: "skeleton-pulse 1.4s ease-in-out infinite",
            }}
        />
    );
}

// ── ReelsPage ────────────────────────────────────────────────────────────

export default function ReelsPage() {
    const location = useLocation();
    const startPostId: number | undefined = (location.state as any)?.startPostId;

    const [reels, setReels] = useState<Reel[]>([]);
    const [reelStates, setReelStates] = useState<Record<number, ReelState>>({});
    const [activeIdx, setActiveIdx] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [muted, setMuted] = useState(true);
    const [commentReel, setCommentReel] = useState<Reel | null>(null);

    // animation flags
    const [likeAnim, setLikeAnim] = useState(false);
    const [repostAnim, setRepostAnim] = useState(false);
    const [saveAnim, setSaveAnim] = useState(false);

    const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const offsetRef = useRef(0);
    const fetchingRef = useRef(false);
    const lastViewedIdRef = useRef<number | null>(null);

    const initState = (reel: Reel): ReelState => ({
        liked: reel.liked_by_current_user === 1,
        likeCount: reel.like_count,
        reposted: reel.is_reposted === 1,
        repostCount: reel.repost_count,
        saved: reel.saved_by_current_user === 1,
    });

    // Initial fetch
    useEffect(() => {
        const load = async () => {
            try {
                const res = await getReels(0, 10);
                if (res.success) {
                    setReels(res.data);
                    const states: Record<number, ReelState> = {};
                    res.data.forEach((r: Reel) => { states[r.id] = initState(r); });
                    setReelStates(states);
                    setHasMore(res.hasMore);
                    offsetRef.current = res.data.length;
                }
            } catch {
                // silently fail
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    // Scroll to the reel that was clicked from profile
    useEffect(() => {
        if (!startPostId || !reels.length || !containerRef.current) return;
        const idx = reels.findIndex((r) => r.id === startPostId);
        if (idx < 0) return;
        const child = containerRef.current.children[idx] as HTMLElement | undefined;
        if (child) child.scrollIntoView({ behavior: "instant" });
    }, [reels, startPostId]);

    // Auto play/pause + track active index
    useEffect(() => {
        if (!reels.length) return;
        const obs = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    const idx = Number((entry.target as HTMLElement).dataset.reelIndex);
                    const video = videoRefs.current[idx];
                    if (!video) return;
                    if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
                        video.play().catch(() => {});
                        setActiveIdx(idx);
                        const reelId = reels[idx]?.id;
                        if (reelId && reelId !== lastViewedIdRef.current) {
                            lastViewedIdRef.current = reelId;
                            recordReelView(reelId);
                        }
                    } else {
                        video.pause();
                    }
                });
            },
            { threshold: 0.5 },
        );
        const wrappers = containerRef.current?.querySelectorAll("[data-reel-index]");
        wrappers?.forEach((el) => obs.observe(el));
        return () => obs.disconnect();
    }, [reels]);

    // Infinite scroll sentinel
    useEffect(() => {
        if (!sentinelRef.current) return;
        const obs = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !fetchingRef.current) loadMore();
            },
            { threshold: 0.1 },
        );
        obs.observe(sentinelRef.current);
        return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasMore, reels]);

    const loadMore = useCallback(async () => {
        if (fetchingRef.current || !hasMore) return;
        fetchingRef.current = true;
        setLoadingMore(true);
        try {
            const res = await getReels(offsetRef.current, 10);
            if (res.success && res.data.length > 0) {
                setReels((prev) => [...prev, ...res.data]);
                setReelStates((prev) => {
                    const next = { ...prev };
                    res.data.forEach((r: Reel) => { next[r.id] = initState(r); });
                    return next;
                });
                setHasMore(res.hasMore);
                offsetRef.current += res.data.length;
            } else {
                setHasMore(false);
            }
        } catch {
            // silently fail
        } finally {
            fetchingRef.current = false;
            setLoadingMore(false);
        }
    }, [hasMore]);

    const setVideoRef = useCallback((idx: number) => (el: HTMLVideoElement | null) => {
        videoRefs.current[idx] = el;
    }, []);

    // Action handlers — operate on active reel
    const activeReel = reels[activeIdx];
    const activeState = activeReel ? reelStates[activeReel.id] : null;

    const triggerAnim = (setter: (v: boolean) => void, ms = 420) => {
        setter(true);
        setTimeout(() => setter(false), ms);
    };

    const handleLike = async () => {
        if (!activeReel || !activeState) return;
        const id = activeReel.id;
        const wasLiked = activeState.liked;
        setReelStates((prev) => ({ ...prev, [id]: { ...prev[id], liked: !wasLiked, likeCount: prev[id].likeCount + (wasLiked ? -1 : 1) } }));
        if (!wasLiked) triggerAnim(setLikeAnim);
        try { await likePost(String(id)); } catch {
            setReelStates((prev) => ({ ...prev, [id]: { ...prev[id], liked: wasLiked, likeCount: prev[id].likeCount + (wasLiked ? 1 : -1) } }));
        }
    };

    const handleRepost = async () => {
        if (!activeReel || !activeState) return;
        const id = activeReel.id;
        const wasReposted = activeState.reposted;
        setReelStates((prev) => ({ ...prev, [id]: { ...prev[id], reposted: !wasReposted, repostCount: prev[id].repostCount + (wasReposted ? -1 : 1) } }));
        if (!wasReposted) triggerAnim(setRepostAnim);
        try {
            if (wasReposted) await unrepostPost(String(id));
            else await repostPost(String(id));
        } catch {
            setReelStates((prev) => ({ ...prev, [id]: { ...prev[id], reposted: wasReposted, repostCount: prev[id].repostCount + (wasReposted ? 1 : -1) } }));
        }
    };

    const handleSave = async () => {
        if (!activeReel || !activeState) return;
        const id = activeReel.id;
        const wasSaved = activeState.saved;
        setReelStates((prev) => ({ ...prev, [id]: { ...prev[id], saved: !wasSaved } }));
        if (!wasSaved) triggerAnim(setSaveAnim);
        try { await savePost(String(id)); } catch {
            setReelStates((prev) => ({ ...prev, [id]: { ...prev[id], saved: wasSaved } }));
        }
    };

    if (loading) {
        return (
            <Box sx={{ width: "100%", height: "100vh", overflow: "hidden", background: "#000" }}>
                <SkeletonCard />
            </Box>
        );
    }

    if (!reels.length) {
        return (
            <Box sx={{ width: "100%", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 1.5, background: "#000" }}>
                <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "1.1rem", fontWeight: 600 }}>No reels yet</Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.85rem" }}>Post a video to see it appear here.</Typography>
            </Box>
        );
    }

    return (
        <>
            {/* Fixed action buttons — always visible, never scroll */}
            {activeState && (
                <Box
                    sx={{
                        position: "fixed",
                        right: 24,
                        bottom: "15vh",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 2.5,
                        zIndex: 100,
                    }}
                >
                    <ActionBtn
                        icon={
                            activeState.liked
                                ? <FavoriteRounded sx={{ color: "#e53935", fontSize: "1.8rem", animation: likeAnim ? "reel-pop 0.42s cubic-bezier(0.34,1.56,0.64,1) both" : "none" }} />
                                : <FavoriteBorderRounded sx={{ color: "#fff", fontSize: "1.8rem" }} />
                        }
                        count={activeState.likeCount}
                        onClick={handleLike}
                    />
                    <ActionBtn
                        icon={<ChatBubbleOutlineRounded sx={{ color: "#fff", fontSize: "1.7rem" }} />}
                        count={activeReel.comment_count}
                        onClick={() => setCommentReel(activeReel)}
                    />
                    <ActionBtn
                        icon={
                            <RepeatRounded sx={{ color: activeState.reposted ? "#43a047" : "#fff", fontSize: "1.8rem", animation: repostAnim ? "reel-spin 0.42s cubic-bezier(0.34,1.56,0.64,1) both" : "none" }} />
                        }
                        count={activeState.repostCount}
                        onClick={handleRepost}
                    />
                    <ActionBtn
                        icon={
                            activeState.saved
                                ? <BookmarkRounded sx={{ color: "#ffb300", fontSize: "1.8rem", animation: saveAnim ? "reel-pop 0.42s cubic-bezier(0.34,1.56,0.64,1) both" : "none" }} />
                                : <BookmarkBorderRounded sx={{ color: "#fff", fontSize: "1.8rem" }} />
                        }
                        onClick={handleSave}
                    />
                </Box>
            )}

            {/* Scrollable video feed */}
            <Box
                ref={containerRef}
                sx={{
                    width: "100%",
                    height: "100vh",
                    overflowY: "scroll",
                    scrollSnapType: "y mandatory",
                    background: "#000",
                    "&::-webkit-scrollbar": { display: "none" },
                    scrollbarWidth: "none",
                }}
            >
                {reels.map((reel, idx) => (
                    <Box
                        key={reel.id}
                        data-reel-index={idx}
                        sx={{ width: "100%", height: "100vh", flexShrink: 0, scrollSnapAlign: "start", scrollSnapStop: "always" }}
                    >
                        <ReelCard
                            reel={reel}
                            videoRef={setVideoRef(idx)}
                            muted={muted}
                            onToggleMute={() => setMuted((m) => !m)}
                        />
                    </Box>
                ))}

                <Box ref={sentinelRef} sx={{ height: 1 }} />

                {loadingMore && (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 2, background: "#000" }}>
                        <CircularProgress size={28} sx={{ color: "rgba(255,255,255,0.6)" }} />
                    </Box>
                )}
            </Box>

            {/* Comments Dialog */}
            <Dialog
                open={!!commentReel}
                onClose={() => setCommentReel(null)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: "20px", background: (t) => t.palette.background.paper, maxHeight: "70vh" },
                }}
            >
                <DialogTitle sx={{ fontWeight: 700, fontSize: "1rem", pb: 0 }}>Comments</DialogTitle>
                <DialogContent dividers>
                    {commentReel?.comments?.length ? (
                        <List disablePadding>
                            {commentReel.comments.map((c, i) => (
                                <Box key={c.id}>
                                    <ListItem alignItems="flex-start" disablePadding sx={{ py: 1 }}>
                                        <ListItemAvatar>
                                            <Avatar src={c.commenter_profile_picture || BlankProfileImage} sx={{ width: 34, height: 34 }} />
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={<Typography sx={{ fontWeight: 600, fontSize: "0.85rem" }}>{c.commenter_username}</Typography>}
                                            secondary={<><Typography component="span" sx={{ fontSize: "0.82rem", color: "text.secondary" }}>{c.content}</Typography><Typography component="div" sx={{ fontSize: "0.7rem", color: "text.disabled", mt: 0.25 }}>{c.timeAgo}</Typography></>}
                                        />
                                    </ListItem>
                                    {i < commentReel.comments!.length - 1 && <Divider />}
                                </Box>
                            ))}
                        </List>
                    ) : (
                        <Typography sx={{ textAlign: "center", color: "text.disabled", py: 4, fontSize: "0.9rem" }}>No comments yet.</Typography>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
