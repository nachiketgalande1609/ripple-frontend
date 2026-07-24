import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, IconButton, Fade, useTheme, CircularProgress } from "@mui/material";
import { ArrowBackRounded, BookmarkBorder } from "@mui/icons-material";
import { getSavedPosts } from "../services/api";
import { usePageTitle } from "../hooks/usePageTitle";

function PostGrid({ posts, onPostClick }: { posts: any[]; onPostClick: (id: number) => void }) {
    return (
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2px" }}>
            {posts.map((post) => (
                <Box
                    key={post.id}
                    onClick={() => onPostClick(post.id)}
                    sx={{
                        aspectRatio: "1 / 1",
                        overflow: "hidden",
                        cursor: "pointer",
                        position: "relative",
                        backgroundColor: "action.hover",
                        "&:hover .overlay": { opacity: 1 },
                    }}
                >
                    {post.file_url ? (
                        <Box
                            component="img"
                            src={post.file_url}
                            alt=""
                            sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        />
                    ) : (
                        <Box
                            sx={{
                                width: "100%", height: "100%",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                p: 1,
                                backgroundColor: "background.paper",
                            }}
                        >
                            <Typography sx={{ fontSize: "0.7rem", color: "text.secondary", textAlign: "center", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical" }}>
                                {post.content}
                            </Typography>
                        </Box>
                    )}
                    <Box
                        className="overlay"
                        sx={{
                            position: "absolute", inset: 0,
                            backgroundColor: "rgba(0,0,0,0.3)",
                            opacity: 0,
                            transition: "opacity 0.2s",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 2,
                        }}
                    >
                        <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.85rem" }}>
                            ♥ {post.likes_count ?? 0}
                        </Typography>
                        <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.85rem" }}>
                            💬 {post.comments_count ?? 0}
                        </Typography>
                    </Box>
                </Box>
            ))}
        </Box>
    );
}

export default function SavedPage() {
    usePageTitle("Saved");
    const navigate = useNavigate();
    const theme = useTheme();
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await getSavedPosts();
                setPosts(res.data ?? []);
            } catch {
                // silent
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return (
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
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
                <Typography sx={{ fontWeight: 600, fontSize: "1rem" }}>Saved</Typography>
            </Box>

            {/* Content */}
            <Box sx={{ maxWidth: 900, mx: "auto" }}>
                {loading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
                        <CircularProgress size={28} />
                    </Box>
                ) : posts.length === 0 ? (
                    <Fade in timeout={300}>
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mt: 10, gap: 1.5 }}>
                            <BookmarkBorder sx={{ fontSize: 44, color: "text.disabled" }} />
                            <Typography sx={{ fontWeight: 600, color: "text.primary" }}>Nothing saved yet</Typography>
                            <Typography sx={{ fontSize: "0.85rem", color: "text.secondary" }}>Posts you save will appear here</Typography>
                        </Box>
                    </Fade>
                ) : (
                    <Fade in timeout={300}>
                        <div>
                            <PostGrid posts={posts} onPostClick={(id) => navigate(`/posts/${id}`)} />
                        </div>
                    </Fade>
                )}
            </Box>
        </Box>
    );
}
