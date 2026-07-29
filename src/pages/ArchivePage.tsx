import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Box, Typography, IconButton, Fade, useTheme, Skeleton } from "@mui/material";
import { ArrowBackRounded, Inventory2Outlined, AutoStoriesOutlined } from "@mui/icons-material";
import { getArchivedPosts, getMyStoryArchive, deleteStory } from "../services/api";
import { usePageTitle } from "../hooks/usePageTitle";
import StoryDialog from "../component/stories/StoryDialog";

function PostGrid({ posts, onPostClick }: { posts: any[]; onPostClick: (id: number) => void }) {
    return (
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: { xs: "3px", sm: "8px" }, px: { xs: "3px", sm: "8px" } }}>
            {posts.map((post) => (
                <Box
                    key={post.id}
                    onClick={() => onPostClick(post.id)}
                    sx={{
                        aspectRatio: "1 / 1", overflow: "hidden", cursor: "pointer",
                        position: "relative", backgroundColor: "action.hover",
                        borderRadius: "10px",
                        "&:hover .overlay": { opacity: 1 },
                    }}
                >
                    {post.file_url ? (
                        <Box component="img" src={post.file_url} alt=""
                            sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        />
                    ) : (
                        <Box sx={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", p: 1, backgroundColor: "background.paper" }}>
                            <Typography sx={{ fontSize: "0.7rem", color: "text.secondary", textAlign: "center", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical" }}>
                                {post.content}
                            </Typography>
                        </Box>
                    )}
                    <Box className="overlay" sx={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.3)", opacity: 0, transition: "opacity 0.2s", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Inventory2Outlined sx={{ color: "rgba(255,255,255,0.8)", fontSize: 20 }} />
                    </Box>
                </Box>
            ))}
        </Box>
    );
}

function StoryGrid({ stories, onStoryClick }: { stories: any[]; onStoryClick: (index: number) => void }) {
    return (
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: { xs: "3px", sm: "8px" }, px: { xs: "3px", sm: "8px" } }}>
            {stories.map((story, index) => (
                <Box
                    key={story.id}
                    onClick={() => onStoryClick(index)}
                    sx={{
                        aspectRatio: "9 / 16", overflow: "hidden", position: "relative",
                        backgroundColor: "action.hover", cursor: "pointer",
                        borderRadius: "10px",
                        "&:hover .story-overlay": { opacity: 1 },
                    }}
                >
                    {story.media_type === "video" ? (
                        <Box component="video" src={story.media_url} muted
                            sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        />
                    ) : (
                        <Box component="img" src={story.media_url} alt=""
                            sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        />
                    )}
                    <Box className="story-overlay" sx={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.25)", opacity: 0, transition: "opacity 0.2s" }} />
                </Box>
            ))}
        </Box>
    );
}

function GridSkeleton({ count = 9, aspect = "1/1" }: { count?: number; aspect?: string }) {
    return (
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: { xs: "3px", sm: "8px" }, px: { xs: "3px", sm: "8px" } }}>
            {Array.from({ length: count }).map((_, i) => (
                <Skeleton key={i} variant="rectangular" sx={{ aspectRatio: aspect, width: "100%", bgcolor: "action.hover", borderRadius: "10px" }} />
            ))}
        </Box>
    );
}

export default function ArchivePage() {
    const { t } = useTranslation();
    usePageTitle(t("profile.archiveTitle"));
    const navigate = useNavigate();
    const theme = useTheme();

    const currentUser = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") || "null") : {};

    const [tab, setTab] = useState<"posts" | "stories">("posts");
    const [posts, setPosts] = useState<any[]>([]);
    const [stories, setStories] = useState<any[]>([]);
    const [loadingPosts, setLoadingPosts] = useState(true);
    const [loadingStories, setLoadingStories] = useState(false);
    const [storiesFetched, setStoriesFetched] = useState(false);
    const [viewingStoryIndex, setViewingStoryIndex] = useState<number | null>(null);
    const [activeStoryIndex, setActiveStoryIndex] = useState(0);

    const openStory = (index: number) => {
        setActiveStoryIndex(index);
        setViewingStoryIndex(index);
    };

    useEffect(() => {
        (async () => {
            try {
                const res = await getArchivedPosts();
                setPosts(res.data ?? []);
            } catch {
                // silent
            } finally {
                setLoadingPosts(false);
            }
        })();
    }, []);

    useEffect(() => {
        if (tab !== "stories" || storiesFetched) return;
        setLoadingStories(true);
        (async () => {
            try {
                const res = await getMyStoryArchive();
                setStories(res.data ?? []);
                setStoriesFetched(true);
            } catch {
                // silent
            } finally {
                setLoadingStories(false);
            }
        })();
    }, [tab, storiesFetched]);

    // All archive stories as one group so next/prev plays them sequentially
    // useMemo so the reference only changes when stories array changes, not on every render
    const storyDialogData = useMemo(() => stories.length > 0
        ? [{
            user_id: currentUser?.id ?? 0,
            username: currentUser?.username ?? "",
            profile_picture: currentUser?.profile_picture_url ?? "",
            stories: stories.map((s) => ({
                story_id: s.id,
                media_url: s.media_url,
                media_type: s.media_type,
                created_at: s.created_at,
                caption: s.caption,
                viewers: [],
            })),
        }]
        : [], [stories, currentUser?.id, currentUser?.username, currentUser?.profile_picture_url]);

    const handleDeleteStory = async () => {
        const story = stories[activeStoryIndex];
        if (!story) return;
        try {
            await deleteStory(story.id);
            setStories(prev => prev.filter((_, i) => i !== activeStoryIndex));
            if (stories.length <= 1) setViewingStoryIndex(null);
        } catch {
            // silent
        }
    };

    const tabs = [
        { key: "posts" as const, label: t("profile.archivedPosts"), icon: <Inventory2Outlined sx={{ fontSize: 15 }} /> },
        { key: "stories" as const, label: t("profile.archivedStories"), icon: <AutoStoriesOutlined sx={{ fontSize: 15 }} /> },
    ];

    return (
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh", pb: 8 }}>
            {/* Header */}
            <Box
                sx={{
                    position: "sticky",
                    top: { xs: "52px", sm: 0 },
                    zIndex: 100,
                    height: 50,
                    display: "flex",
                    alignItems: "center",
                    px: 1.5,
                    gap: 1,
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    backgroundColor: theme.palette.mode === "dark" ? "rgba(13,13,21,0.85)" : "rgba(255,255,255,0.85)",
                    borderBottom: `1px solid ${theme.palette.divider}`,
                }}
            >
                <IconButton size="small" onClick={() => navigate(-1)} sx={{ color: "text.primary" }}>
                    <ArrowBackRounded />
                </IconButton>
                <Typography sx={{ fontWeight: 600, fontSize: "1rem" }}>{t("profile.archiveTitle")}</Typography>
            </Box>

            <Box sx={{ maxWidth: 900, mx: "auto" }}>
                {/* Subtitle */}
                <Typography sx={{ fontSize: "0.78rem", color: "text.disabled", textAlign: "center", py: 1.5, px: 2 }}>
                    {t("profile.archiveSubtitle")}
                </Typography>

                {/* Tabs */}
                <Box sx={{ display: "flex", gap: 1, px: "8px", pb: 1.25 }}>
                    {tabs.map((t_) => (
                        <Box
                            key={t_.key}
                            onClick={() => setTab(t_.key)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setTab(t_.key); }}
                            sx={{
                                flex: 1,
                                display: "flex", alignItems: "center", justifyContent: "center", gap: 0.75,
                                py: 1.5, borderRadius: "14px", cursor: "pointer",
                                transition: "background 0.35s cubic-bezier(0.4,0,0.2,1), box-shadow 0.35s cubic-bezier(0.4,0,0.2,1), color 0.2s ease",
                                backgroundColor: tab === t_.key ? "var(--nav-bg)" : "transparent",
                                boxShadow: tab === t_.key
                                    ? "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)"
                                    : "none",
                                color: tab === t_.key ? "text.primary" : "text.disabled",
                                "&:hover": { color: "text.secondary" },
                            }}
                        >
                            {t_.icon}
                            <Typography sx={{ fontSize: "0.82rem", fontWeight: tab === t_.key ? 600 : 500, color: "inherit" }}>
                                {t_.label}
                            </Typography>
                        </Box>
                    ))}
                </Box>

                {/* Posts tab */}
                {tab === "posts" && (
                    <Fade in timeout={250}>
                        <div>
                            {loadingPosts ? (
                                <GridSkeleton count={9} aspect="1/1" />
                            ) : posts.length === 0 ? (
                                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mt: 10, gap: 1.5 }}>
                                    <Inventory2Outlined sx={{ fontSize: 44, color: "text.disabled" }} />
                                    <Typography sx={{ fontWeight: 600, color: "text.primary" }}>{t("profile.noArchivedPosts")}</Typography>
                                </Box>
                            ) : (
                                <PostGrid posts={posts} onPostClick={(id) => navigate(`/posts/${id}`)} />
                            )}
                        </div>
                    </Fade>
                )}

                {/* Stories tab */}
                {tab === "stories" && (
                    <Fade in timeout={250}>
                        <div>
                            {loadingStories ? (
                                <GridSkeleton count={9} aspect="9/16" />
                            ) : stories.length === 0 ? (
                                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mt: 10, gap: 1.5 }}>
                                    <AutoStoriesOutlined sx={{ fontSize: 44, color: "text.disabled" }} />
                                    <Typography sx={{ fontWeight: 600, color: "text.primary" }}>{t("profile.noArchivedStories")}</Typography>
                                </Box>
                            ) : (
                                <StoryGrid stories={stories} onStoryClick={openStory} />
                            )}
                        </div>
                    </Fade>
                )}
            </Box>

            {/* Story viewer */}
            <StoryDialog
                open={viewingStoryIndex !== null}
                onClose={() => setViewingStoryIndex(null)}
                selectedStoryIndex={0}
                initialStoryIndex={viewingStoryIndex ?? 0}
                onCurrentIndexChange={setActiveStoryIndex}
                stories={storyDialogData}
                onDelete={handleDeleteStory}
                deleteLabel={t("profile.deleteStory")}
            />
        </Box>
    );
}
