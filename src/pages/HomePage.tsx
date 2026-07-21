import { Container, Box, Typography, useMediaQuery, useTheme, Skeleton, CircularProgress } from "@mui/material";
import { SentimentDissatisfied, Add } from "@mui/icons-material";
import Post from "../component/post/Post";
import EndOfFeed from "../component/EndOfFeed";
import StoryDialog from "../component/stories/StoryDialog";
import UploadStoryDialog from "../component/stories/UploadStoryDialog";
import { useEffect, useRef, useState, useCallback } from "react";
import { getPosts, getStories } from "../services/api";
import BlankProfileImage from "../static/profile_blank.png";
import { ACCENT_COLOR } from "../theme";

const POSTS_PER_PAGE = 3;

const ACCENT = ACCENT_COLOR;

/* ── Style injection ────────────────────────────────────────────── */
const injectStyles = () => {
    if (document.getElementById("hp-styles-v2")) return;
    const s = document.createElement("style");
    s.id = "hp-styles-v2";
    s.textContent = `
    @keyframes fadeUp   { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
    @keyframes popIn    { 0% { opacity:0; transform:scale(.9); } 70% { transform:scale(1.03); } 100% { opacity:1; transform:scale(1); } }
    @keyframes shimmer  { 0% { background-position:-400px 0; } 100% { background-position:400px 0; } }

    .hp-root { font-family: 'Inter', -apple-system, sans-serif; }
    .post-card { animation: fadeUp .3s ease both; }

    .story-ring {
      position: relative; border-radius: 50%; padding: 2px;
      background: conic-gradient(from 0deg, ${ACCENT}, #ff6b35, ${ACCENT});
      flex-shrink: 0; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
    }
    .story-ring-inner {
      border-radius: 50%;
      background: var(--hp-surface);
      width: 100%; height: 100%; overflow: hidden;
    }

    .sk-shimmer {
      background: linear-gradient(90deg, var(--hp-shimmer-a) 25%, var(--hp-shimmer-b) 50%, var(--hp-shimmer-a) 75%);
      background-size: 400px 100%;
      animation: shimmer 1.4s infinite;
    }

    .add-story-btn {
      position: absolute; bottom: 2px; right: -2px;
      background: ${ACCENT};
      border-radius: 50%; width: 20px; height: 20px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; border: 2px solid var(--hp-surface);
      transition: transform .15s ease;
    }
    .add-story-btn:hover { transform: scale(1.1) rotate(90deg); }
  `;
    document.head.appendChild(s);
};

/* ── CSS vars from MUI theme ────────────────────────────────────── */
function useHomeCssVars() {
    const theme = useTheme();
    useEffect(() => {
        const vars: Record<string, string> = {
            "--hp-bg": theme.palette.background.default,
            "--hp-surface": theme.palette.background.paper,
            "--hp-border": theme.palette.divider,
            "--hp-text": theme.palette.text.primary,
            "--hp-muted": theme.palette.text.disabled,
            "--hp-hover": theme.palette.action.hover,
            "--hp-shimmer-a": theme.palette.action.hover,
            "--hp-shimmer-b": theme.palette.action.selected,
        };
        Object.entries(vars).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
    }, [theme]);
}

/* ── StoryBubble ────────────────────────────────────────────────── */
function StoryBubble({
    src,
    username,
    size = 58,
    onClick,
    delay = 0,
    hasRing = true,
}: {
    src?: string;
    username?: string;
    size?: number;
    onClick?: () => void;
    delay?: number;
    hasRing?: boolean;
}) {
    return (
        <Box
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.(); }}
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "5px",
                flexShrink: 0,
                cursor: "pointer",
                animation: `popIn .3s ease ${delay}ms both`,
            }}
        >
            {hasRing ? (
                <div className="story-ring" style={{ width: size + 4, height: size + 4 }}>
                    <div className="story-ring-inner" style={{ width: size, height: size }}>
                        <img
                            src={src || BlankProfileImage}
                            alt={username}
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = BlankProfileImage;
                            }}
                        />
                    </div>
                </div>
            ) : (
                <Box
                    sx={{
                        width: size,
                        height: size,
                        borderRadius: "50%",
                        overflow: "hidden",
                        border: "1px solid",
                        borderColor: (t) => t.palette.divider,
                    }}
                >
                    <img
                        src={src || BlankProfileImage}
                        alt={username}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = BlankProfileImage;
                        }}
                    />
                </Box>
            )}
            {username && (
                <Typography
                    sx={{
                        fontSize: "0.75rem",
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 400,
                        color: (t) => t.palette.text.secondary,
                        maxWidth: size + 8,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        textAlign: "center",
                    }}
                >
                    {username}
                </Typography>
            )}
        </Box>
    );
}

function StorySkeleton({ size = 58 }: { size?: number }) {
    return (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px", flexShrink: 0 }}>
            <Box className="sk-shimmer" sx={{ width: size + 4, height: size + 4, borderRadius: "50%" }} />
            <Box className="sk-shimmer" sx={{ width: 40, height: 8, borderRadius: "4px" }} />
        </Box>
    );
}

/* ── HomePage ───────────────────────────────────────────────────── */
const HomePage = () => {
    useEffect(() => { injectStyles(); }, []);
    useHomeCssVars();

    const [posts, setPosts] = useState<any[]>([]);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [loadingPosts, setLoadingPosts] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const offsetRef = useRef(0);
    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const fetchingRef = useRef(false);

    const currentUser = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") || "null") : {};

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const isDark = theme.palette.mode === "dark";

    const [openStoryDialog, setOpenStoryDialog] = useState(false);
    const [openUploadDialog, setOpenUploadDialog] = useState(false);
    const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
    const [selfStories, setSelfStories] = useState<any[]>([]);
    const [followingStories, setFollowingStories] = useState<any[]>([]);
    const [fetchingStories, setFetchingStories] = useState(true);

    const avatarSize = isMobile ? 52 : 58;

    const fetchPosts = useCallback(
        async (reset = false) => {
            if (fetchingRef.current) return;
            if (!reset && !hasMore) return;
            fetchingRef.current = true;

            const offset = reset ? 0 : offsetRef.current;
            const isInitial = offset === 0;

            if (isInitial) setLoadingPosts(true);
            else setLoadingMore(true);

            try {
                if (currentUser?.id) {
                    const res = await getPosts(offset, POSTS_PER_PAGE);
                    const newPosts: any[] = res.data ?? [];
                    setPosts((prev) => (reset ? newPosts : [...prev, ...newPosts]));
                    setHasMore(res.hasMore ?? false);
                    offsetRef.current = offset + newPosts.length;
                }
            } catch (e) {
                console.error(e);
                setFetchError('Failed to load posts. Please try again.');
            } finally {
                setLoadingPosts(false);
                setLoadingMore(false);
                fetchingRef.current = false;
            }
        },
        [hasMore],
    );

    const fetchStories = async () => {
        try {
            setFetchingStories(true);
            const res = await getStories();
            const group = (arr: any[]) =>
                Object.values(
                    arr.reduce((acc: any, story: any) => {
                        const uid = story.user_id;
                        if (!acc[uid]) acc[uid] = { user_id: uid, username: story.username, profile_picture: story.profile_picture, stories: [] };
                        acc[uid].stories.push(story);
                        return acc;
                    }, {}),
                );
            setSelfStories(group(res.data.selfStory || []));
            setFollowingStories(group(res.data.stories || []));
        } catch (e) {
            console.error(e);
        } finally {
            setFetchingStories(false);
        }
    };

    useEffect(() => {
        fetchPosts(true);
        fetchStories();
    }, []);

    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !fetchingRef.current) {
                    fetchPosts();
                }
            },
            { threshold: 0.1 },
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [fetchPosts]);

    return (
        <Box
            className="hp-root"
            sx={{
                minHeight: "100vh",
                backgroundColor: (t) => (isDark ? t.palette.background.default : "#f7f7f8"),
                color: (t) => t.palette.text.primary,
                display: "flex",
                justifyContent: "center",
            }}
        >
            <Container
                disableGutters
                sx={{
                    width: "100%",
                    maxWidth: isMobile ? "100%" : "500px !important",
                    pb: isMobile ? "72px" : "40px",
                    minHeight: "100vh",
                    borderColor: (t) => t.palette.divider,
                }}
            >
                {/* ── Stories ── */}
                <Box
                    sx={{
                        px: isMobile ? "12px" : "16px",
                        pt: isMobile ? "12px" : "16px",
                        pb: "12px",
                        borderColor: (t) => t.palette.divider,
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            gap: "16px",
                            overflowX: "auto",
                            pb: "2px",
                            "&::-webkit-scrollbar": { display: "none" },
                            scrollbarWidth: "none",
                        }}
                    >
                        {/* Self bubble */}
                        <Box sx={{ position: "relative", flexShrink: 0 }}>
                            <StoryBubble
                                src={currentUser?.profile_picture_url}
                                size={avatarSize}
                                hasRing={selfStories.length > 0}
                                onClick={() =>
                                    selfStories.length > 0 ? (setSelectedStoryIndex(0), setOpenStoryDialog(true)) : setOpenUploadDialog(true)
                                }
                            />
                            <div className="add-story-btn" onClick={() => setOpenUploadDialog(true)}>
                                <Add sx={{ fontSize: 12, color: "#fff" }} />
                            </div>
                        </Box>

                        {/* Following stories */}
                        {fetchingStories
                            ? Array.from({ length: 5 }).map((_, i) => <StorySkeleton key={i} size={avatarSize} />)
                            : followingStories.map((us, idx) => (
                                  <StoryBubble
                                      key={us.user_id}
                                      src={us.profile_picture}
                                      size={avatarSize}
                                      username={us.username}
                                      delay={idx * 40}
                                      onClick={() => {
                                          setSelectedStoryIndex(selfStories.length + idx);
                                          setOpenStoryDialog(true);
                                      }}
                                  />
                              ))}
                    </Box>
                </Box>

                {/* ── Posts ── */}
                <Box>
                    {loadingPosts ? (
                        <>
                            {[0, 1, 2].map((i) => (
                                <Box
                                    key={i}
                                    sx={{
                                        borderBottom: "1px solid",
                                        borderColor: (t) => t.palette.divider,
                                        animation: `fadeUp .3s ease ${i * 100}ms both`,
                                    }}
                                >
                                    <Box sx={{ display: "flex", alignItems: "center", gap: "10px", p: "14px" }}>
                                        <Skeleton variant="circular" width={34} height={34} sx={{ bgcolor: (t) => t.palette.action.hover }} />
                                        <Box flex={1}>
                                            <Skeleton width="32%" height={12} sx={{ bgcolor: (t) => t.palette.action.hover, borderRadius: "6px" }} />
                                            <Skeleton
                                                width="18%"
                                                height={9}
                                                sx={{ bgcolor: (t) => t.palette.action.hover, borderRadius: "6px", mt: "5px" }}
                                            />
                                        </Box>
                                    </Box>
                                    <Skeleton variant="rectangular" height={260} sx={{ bgcolor: (t) => t.palette.action.hover }} />
                                    <Box sx={{ display: "flex", gap: "14px", p: "12px 14px" }}>
                                        {[52, 44, 36].map((w, j) => (
                                            <Skeleton
                                                key={j}
                                                width={w}
                                                height={10}
                                                sx={{ bgcolor: (t) => t.palette.action.hover, borderRadius: "5px" }}
                                            />
                                        ))}
                                    </Box>
                                </Box>
                            ))}
                        </>
                    ) : fetchError && posts.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography color="error" variant="body2">{fetchError}</Typography>
                        </Box>
                    ) : posts.length > 0 ? (
                        <Box>
                            {posts.map((post, index) => (
                                <Box
                                    key={post.id}
                                    className="post-card"
                                    sx={{
                                        animationDelay: `${index * 60}ms`,
                                        mb: isMobile ? 0 : index !== posts.length - 1 ? "10px" : 0,
                                    }}
                                >
                                    <Post post={post} fetchPosts={() => fetchPosts(true)} borderRadius={isMobile ? "0px" : "14px"} />
                                </Box>
                            ))}
                        </Box>
                    ) : (
                        /* ── Empty state ── */
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                minHeight: "50vh",
                                px: 4,
                                textAlign: "center",
                                animation: "fadeUp .4s ease both",
                            }}
                        >
                            <Box
                                sx={{
                                    width: 64,
                                    height: 64,
                                    borderRadius: "18px",
                                    backgroundColor: isDark ? "rgba(124,92,252,0.12)" : "rgba(124,92,252,0.08)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    mb: 2,
                                }}
                            >
                                <SentimentDissatisfied sx={{ fontSize: 32, color: ACCENT, opacity: 0.7 }} />
                            </Box>
                            <Typography
                                sx={{
                                    fontFamily: "'Inter', sans-serif",
                                    fontWeight: 500,
                                    fontSize: "0.95rem",
                                    color: (t) => t.palette.text.primary,
                                    mb: 0.75,
                                }}
                            >
                                Nothing here yet
                            </Typography>
                            <Typography
                                sx={{
                                    fontSize: "0.82rem",
                                    color: (t) => t.palette.text.disabled,
                                    lineHeight: 1.6,
                                    maxWidth: 240,
                                }}
                            >
                                Follow people or share something to get started.
                            </Typography>
                            <Box
                                onClick={() => setOpenUploadDialog(true)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setOpenUploadDialog(true); }}
                                sx={{
                                    mt: 2.5,
                                    px: 3,
                                    py: 1,
                                    borderRadius: "10px",
                                    backgroundColor: ACCENT,
                                    color: "#fff",
                                    fontFamily: "'Inter', sans-serif",
                                    fontWeight: 500,
                                    fontSize: "0.84rem",
                                    cursor: "pointer",
                                    transition: "background 0.15s, transform 0.1s",
                                    "&:hover": { backgroundColor: "#6b4de0" },
                                    "&:active": { transform: "scale(0.96)" },
                                }}
                            >
                                Share a story
                            </Box>
                        </Box>
                    )}

                    {/* Sentinel is always in the DOM so IntersectionObserver can attach on mount */}
                    <div ref={sentinelRef} style={{ height: 1 }} />

                    {loadingMore && (
                        <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                            <CircularProgress size={28} sx={{ color: ACCENT }} />
                        </Box>
                    )}

                    {!hasMore && posts.length > 0 && <EndOfFeed />}
                </Box>
            </Container>

            <StoryDialog
                open={openStoryDialog}
                onClose={() => setOpenStoryDialog(false)}
                stories={[...selfStories, ...followingStories]}
                selectedStoryIndex={selectedStoryIndex}
            />
            <UploadStoryDialog open={openUploadDialog} onClose={() => setOpenUploadDialog(false)} fetchStories={fetchStories} />
        </Box>
    );
};

export default HomePage;
