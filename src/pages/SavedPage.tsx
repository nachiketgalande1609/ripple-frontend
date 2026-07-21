import { Container, Grid, useMediaQuery, useTheme, Box, Typography, LinearProgress } from "@mui/material";
import { SentimentDissatisfied } from "@mui/icons-material";
import Post from "../component/post/Post";
import { useEffect, useState } from "react";
import { getSavedPosts } from "../services/api";

const SavedPage = () => {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const isLarge = useMediaQuery("(min-width:1281px)");

    const fetchPosts = async () => {
        try {
            if (user) {
                const res = await getSavedPosts();
                setPosts(res.data);
            }
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    return (
        <>
            {loading ? (
                <LinearProgress
                    sx={{
                        width: "100%",
                        height: "3px",
                        background: "linear-gradient(90deg, #7a60ff, #ff8800)",
                        "& .MuiLinearProgress-bar": {
                            background: "linear-gradient(90deg, #7a60ff, #ff8800)",
                        },
                    }}
                />
            ) : (
                <Container
                    sx={{
                        width: isLarge ? "600px" : "525px",
                        padding: isMobile ? 0 : "10px",
                        minHeight: "100vh",
                        display: "flex",
                        flexDirection: "column",
                        borderLeft: "1px solid #202327",
                        borderRight: "1px solid #202327",
                        margin: "0 auto",
                    }}
                >
                    {posts.length > 0 ? (
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
                                        paddingTop: isMobile ? "0 !important" : "20px",
                                        marginBottom: isMobile && index !== posts.length - 1 ? "2px" : "none", // Apply border except for last item
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
                                You haven't saved any posts yet
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Browse and save posts to see them here.
                            </Typography>
                        </Box>
                    )}
                </Container>
            )}
        </>
    );
};

export default SavedPage;
