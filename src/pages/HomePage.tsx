import { Container, Grid, useMediaQuery, useTheme, CircularProgress, Box, Typography, Avatar } from "@mui/material";
import { SentimentDissatisfied } from "@mui/icons-material";
import Post from "../component/post/Post";
import StoryDialog from "../component/stories/StoryDialog";
import UploadStoryDialog from "../component/stories/UploadStoryDialog";
import { useEffect, useState } from "react";
import { getPosts } from "../services/api";
import { getStories } from "../services/api"; // Import getStories function

const HomePage = () => {
    const [posts, setPosts] = useState<any[]>([]);
    const [stories, setStories] = useState<any[]>([]);
    const [loadingPosts, setLoadingPosts] = useState<boolean>(true);
    const [loadingStories, setLoadingStories] = useState<boolean>(true);
    const currentUser = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") || "") : {};
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    const [openStoryDialog, setOpenStoryDialog] = useState(false);
    const [openUploadDialog, setOpenUploadDialog] = useState(false);
    const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);

    const fetchPosts = async () => {
        try {
            if (currentUser?.id) {
                const res = await getPosts(currentUser.id);
                setPosts(res.data);
            }
        } catch (error) {
            console.log(error);
        } finally {
            setLoadingPosts(false);
        }
    };

    const fetchStories = async () => {
        try {
            const res = await getStories(currentUser?.id);
            setStories(res);
        } catch (error) {
            console.error("Error fetching stories:", error);
        } finally {
            setLoadingStories(false);
        }
    };

    useEffect(() => {
        fetchPosts();
        fetchStories();
    }, []);

    return (
        <Container maxWidth="sm" sx={{ padding: isMobile ? 0 : "10px", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <Box display="flex" gap={1} sx={{ padding: "10px 0" }}>
                {/* Current User Story Upload */}
                <Box
                    sx={{
                        width: 75,
                        height: 75,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                        borderRadius: "50%",
                        "&::before": {
                            content: '""',
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            borderRadius: "50%",
                            padding: "2px",
                            background: "linear-gradient(to right,#7a60ff,#ff8800)",
                            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                            WebkitMaskComposite: "destination-out",
                            maskComposite: "exclude",
                        },
                    }}
                >
                    <Avatar
                        src={currentUser?.profile_picture_url || "https://via.placeholder.com/50"}
                        onClick={() => setOpenUploadDialog(true)}
                        sx={{ width: 70, height: 70, cursor: "pointer" }}
                    />
                </Box>

                {/* User Stories */}
                {loadingStories ? (
                    <CircularProgress size={24} />
                ) : (
                    stories.map((story, index) => (
                        <Avatar
                            key={story.story_id}
                            src={story.media_url}
                            onClick={() => {
                                setSelectedStoryIndex(index);
                                setOpenStoryDialog(true);
                            }}
                            sx={{ width: 70, height: 70, cursor: "pointer", border: "2px solid red" }}
                        />
                    ))
                )}
            </Box>

            {loadingPosts ? (
                <Box display="flex" justifyContent="center" alignItems="center" width="100%" flexGrow={1}>
                    <CircularProgress />
                </Box>
            ) : posts.length > 0 ? (
                <Grid container spacing={3} sx={{ marginTop: "10px" }}>
                    {posts.map((post, index) => (
                        <Grid
                            item
                            xs={12}
                            sm={12}
                            md={12}
                            key={post.id}
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                flexDirection: "column",
                                paddingTop: "0 !important",
                                width: "100%",
                                marginBottom: index !== posts.length - 1 ? "20px" : "none",
                            }}
                        >
                            <Post post={post} fetchPosts={fetchPosts} borderRadius="20px" />
                        </Grid>
                    ))}
                </Grid>
            ) : (
                <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" flexGrow={1}>
                    <SentimentDissatisfied sx={{ fontSize: 60, color: "gray" }} />
                    <Typography variant="h6" color="textSecondary" mt={2}>
                        No posts available
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Be the first to share something!
                    </Typography>
                </Box>
            )}

            <StoryDialog open={openStoryDialog} onClose={() => setOpenStoryDialog(false)} stories={stories} initialIndex={selectedStoryIndex} />
            <UploadStoryDialog open={openUploadDialog} onClose={() => setOpenUploadDialog(false)} />
        </Container>
    );
};

export default HomePage;
