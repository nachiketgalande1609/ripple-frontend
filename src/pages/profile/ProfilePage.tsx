import { useState, useEffect } from "react";
import { Container, Typography, Avatar, Grid, Paper, Dialog, Button, IconButton, useMediaQuery, useTheme, Box, LinearProgress } from "@mui/material";
import ProfilePagePost from "../../component/post/ProfilePagePost";
import ModalPost from "../../component/post/ModalPost";
import { getProfile, getUserPosts, followUser, cancelFollowRequest } from "../../services/api";
import { MoreVert } from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import LockIcon from "@mui/icons-material/Lock";
import MoreOptionsDialog from "./MoreOptionsDialog";
import { useGlobalStore } from "../../store/store";
import FollowButton from "./FollowButton";
import BlankProfileImage from "../../static/profile_blank.png";

interface Profile {
    username: string;
    email: string;
    bio?: string;
    profile_picture?: string;
    followers_count: number;
    following_count: number;
    posts_count: number;
    is_request_active: boolean;
    follow_status: string;
    is_following: boolean;
    is_private: boolean;
    isMobile: boolean;
}

const ProfilePage = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const { postUploading } = useGlobalStore();

    const currentUser = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") || "") : {};

    const [profileData, setProfileData] = useState<Profile | null>(null);
    const [posts, setPosts] = useState<any[]>([]);
    const [selectedPost, setSelectedPost] = useState<any | null>(null);
    const [isFollowing, setIsFollowing] = useState<boolean>(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [mobileGridWidth, setMobileGridWidth] = useState(4);
    const [fetchingProfile, setFetchingProfile] = useState(false);
    const [fetchingPosts, setFetchingPosts] = useState(false);
    const [followButtonLoading, setFollowButtonLoading] = useState(false);

    async function fetchProfile() {
        try {
            setFetchingProfile(true);
            if (userId) {
                const res = await getProfile(userId);
                setProfileData(res.data);
                setIsFollowing(res.data.is_following);
            }
        } catch (error) {
            console.log(error);
        } finally {
            setFetchingProfile(false);
        }
    }

    async function fetchUserPosts() {
        try {
            setFetchingPosts(true);
            if (userId) {
                const res = await getUserPosts(userId);
                setPosts(res.data);
            }
        } catch (error) {
            console.log(error);
        } finally {
            setFetchingPosts(false);
        }
    }

    useEffect(() => {
        fetchProfile();
        fetchUserPosts();
    }, [userId]);

    useEffect(() => {
        const isOwnProfile = currentUser?.id == userId;
        const canView = profileData && (isOwnProfile || !profileData.is_private || profileData.is_following);

        if (!postUploading && canView) {
            fetchUserPosts();
        }
    }, [postUploading, userId, currentUser?.id]);

    const handleOpenModal = (post: any) => {
        setSelectedPost(post);
    };

    const handleCloseModal = () => {
        setSelectedPost(null);
    };

    const handleFollow = async () => {
        if (currentUser?.id && userId) {
            setFollowButtonLoading(true);

            try {
                const res = await followUser(currentUser.id.toString(), userId);
                if (res?.success) {
                    // Instead of refetching the profile, just update the relevant states
                    setIsFollowing(true);
                    setProfileData((prev) =>
                        prev
                            ? {
                                  ...prev,
                                  is_following: true,
                                  is_request_active: true, // simulate request sent
                              }
                            : prev
                    );
                }
            } catch (error) {
                console.error("Failed to follow the user:", error);
            } finally {
                setFollowButtonLoading(false);
            }
        }
    };

    const handleCancelRequest = async () => {
        if (currentUser?.id && userId) {
            setFollowButtonLoading(true);

            try {
                const res = await cancelFollowRequest(currentUser.id, userId);
                if (res?.success) {
                    setProfileData((prev) =>
                        prev
                            ? {
                                  ...prev,
                                  is_following: false,
                                  is_request_active: false,
                              }
                            : prev
                    );
                    setIsFollowing(false);
                }
            } catch (error) {
                console.error("Failed to cancel follow request:", error);
            } finally {
                setFollowButtonLoading(false);
            }
        }
    };

    const handleSendMessage = () => {
        navigate(`/messages/${userId}`, { state: profileData });
    };

    const handleMoreOptionsClick = () => {
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
    };

    const toggleMobileGridWidth = () => {
        if (mobileGridWidth == 4) {
            setMobileGridWidth(12);
        } else setMobileGridWidth(4);
    };

    return (
        <>
            {fetchingProfile ? (
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
                <Container sx={{ padding: isMobile ? 0 : "10px", marginBottom: "50px" }}>
                    {/* Profile Banner */}
                    <Paper
                        sx={{
                            padding: { xs: 2, sm: 3 },
                            borderRadius: "10px",
                            boxShadow: 3,
                            background: "linear-gradient(0deg, hsl(214, 10%, 20%),rgb(0, 0, 0))",
                            mb: 1,
                        }}
                    >
                        <Grid container spacing={3} alignItems="start" sx={{ position: "relative" }}>
                            <IconButton
                                aria-label="more options"
                                onClick={handleMoreOptionsClick}
                                sx={{ position: "absolute", right: 0, top: 15, ":hover": { backgroundColor: "transparent" } }}
                            >
                                <MoreVert />
                            </IconButton>

                            <Grid item xs={12} sm={12} md={3} lg={2} sx={{ display: "flex", justifyContent: "center" }}>
                                <Avatar
                                    src={profileData?.profile_picture || BlankProfileImage}
                                    sx={{
                                        width: { xs: 100, sm: 110, md: 120, lg: 140 },
                                        height: { xs: 100, sm: 110, md: 120, lg: 140 },
                                        border: "3px solid #fff",
                                        boxShadow: 3,
                                        transition: "transform 0.3s ease-in-out",
                                        "&:hover": { transform: "scale(1.1)" },
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12} md={9} sx={{ marginTop: isMobile ? 0 : "20px" }}>
                                <Typography
                                    sx={{
                                        fontWeight: "bold",
                                        textAlign: "center",
                                        fontSize: isMobile ? "1.3rem" : "1.8rem",
                                    }}
                                >
                                    {profileData?.username}
                                </Typography>

                                {profileData?.bio && (
                                    <Typography
                                        sx={{
                                            mt: 1,
                                            fontStyle: "italic",
                                            textAlign: "center",
                                            whiteSpace: "pre-line",
                                        }}
                                    >
                                        {profileData?.bio}
                                    </Typography>
                                )}

                                {currentUser?.id && userId != currentUser?.id && (
                                    <Box sx={{ display: "flex", justifyContent: isMobile ? "center" : "flex-end" }}>
                                        <FollowButton
                                            isFollowing={isFollowing}
                                            profileData={profileData}
                                            followButtonLoading={followButtonLoading}
                                            handleFollow={handleFollow}
                                            handleCancelRequest={handleCancelRequest}
                                        />
                                        <Button
                                            onClick={handleSendMessage}
                                            variant="contained"
                                            sx={{
                                                mt: 2,
                                                ml: 2,
                                                color: "#000000",
                                                borderRadius: "15px",
                                                backgroundColor: "#ffffff",
                                                ":disabled": {
                                                    backgroundColor: "#202327",
                                                    color: "#505050",
                                                },
                                            }}
                                        >
                                            Message
                                        </Button>
                                    </Box>
                                )}
                            </Grid>
                        </Grid>
                        <Grid
                            container
                            spacing={2}
                            sx={{
                                mt: 1,
                                display: "flex",
                                justifyContent: "space-between",
                                textAlign: "center",
                            }}
                        >
                            <Grid item xs={4}>
                                <Typography variant="body2" sx={{ fontSize: isMobile ? "16px" : "20px", mb: 0.5 }}>
                                    {profileData?.posts_count}
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: "bold", color: "#888888" }}>
                                    POSTS
                                </Typography>
                            </Grid>
                            <Grid item xs={4}>
                                <Typography variant="body2" sx={{ fontSize: isMobile ? "16px" : "20px", mb: 0.5 }}>
                                    {profileData?.followers_count}
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: "bold", color: "#888888" }}>
                                    FOLLOWERS
                                </Typography>
                            </Grid>
                            <Grid item xs={4}>
                                <Typography variant="body2" sx={{ fontSize: isMobile ? "16px" : "20px", mb: 0.5 }}>
                                    {profileData?.following_count}
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: "bold", color: "#888888" }}>
                                    FOLLOWING
                                </Typography>
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* Profile Posts */}
                    {fetchingPosts ? (
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
                    ) : profileData?.is_private && !profileData?.is_following && currentUser?.id != userId ? (
                        <Grid item xs={12} sx={{ textAlign: "center", mt: 5 }}>
                            <LockIcon sx={{ fontSize: 60, color: "#888888" }} /> {/* Lock Icon */}
                            <Typography variant="body1" sx={{ fontSize: "18px", color: "#888888", mt: 1 }}>
                                This account is private. Follow to see their posts.
                            </Typography>
                        </Grid>
                    ) : (
                        <Grid container spacing={1} sx={{ padding: isMobile ? "0 10px" : 0 }}>
                            {posts.length > 0 ? (
                                posts.map((post) => (
                                    <Grid
                                        item
                                        xs={mobileGridWidth}
                                        sm={4}
                                        md={4}
                                        key={post.id}
                                        onClick={() => {
                                            isMobile ? toggleMobileGridWidth() : handleOpenModal(post);
                                        }}
                                        style={{ cursor: "pointer" }}
                                    >
                                        <ProfilePagePost fileUrl={post.file_url} />
                                    </Grid>
                                ))
                            ) : (
                                <Grid item xs={12}>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            mt: 6,
                                            mb: 6,
                                        }}
                                    >
                                        <Typography variant="h6" sx={{ mt: 2, color: "text.secondary", textAlign: "center" }}>
                                            No posts yet
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center", mt: 1 }}>
                                            This user hasn't shared anything yet.
                                        </Typography>
                                    </Box>
                                </Grid>
                            )}
                        </Grid>
                    )}

                    <Dialog
                        open={!!selectedPost}
                        onClose={handleCloseModal}
                        fullWidth
                        maxWidth="lg"
                        sx={{
                            "& .MuiDialog-paper": {
                                border: "1px solid #444",
                                borderRadius: "20px",
                            },
                        }}
                        BackdropProps={{
                            sx: {
                                backgroundColor: "rgba(0, 0, 0, 0.5)",
                                backdropFilter: "blur(5px)",
                            },
                        }}
                    >
                        {selectedPost && (
                            <ModalPost
                                userId={userId}
                                postId={selectedPost.id}
                                fetchPosts={fetchUserPosts}
                                borderRadius="20px"
                                isMobile={isMobile}
                                handleCloseModal={handleCloseModal}
                            />
                        )}
                    </Dialog>
                    <MoreOptionsDialog
                        openDialog={openDialog}
                        handleCloseDialog={handleCloseDialog}
                        userId={userId}
                        fetchProfile={fetchProfile}
                        fetchUserPosts={fetchUserPosts}
                        isFollowing={profileData?.is_following}
                    />
                </Container>
            )}
        </>
    );
};

export default ProfilePage;
