import { useState, useEffect } from "react";
import {
    Container,
    Typography,
    Avatar,
    Grid,
    Paper,
    Dialog,
    Button,
    IconButton,
    useMediaQuery,
    useTheme,
    Box,
    LinearProgress,
    Stack,
    Fade,
    Zoom,
    Tooltip,
    alpha,
    Card,
    CardMedia,
    Skeleton as MuiSkeleton,
    Tabs,
    Tab,
    Badge,
    Alert,
    Snackbar,
} from "@mui/material";
import ModalPost from "../../component/post/ModalPost";
import { getProfile, getUserPosts, followUser, cancelFollowRequest, getSavedPosts } from "../../services/api";
import {
    MoreVert,
    Lock,
    Message,
    CheckCircle,
    Instagram,
    GridOn,
    Favorite,
    Comment,
    Verified,
    CalendarToday,
    Link as LinkIcon,
} from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import MoreOptionsDialog from "./MoreOptionsDialog";
import { useGlobalStore } from "../../store/store";
import FollowButton from "./FollowButton";
import BlankProfileImage from "../../static/profile_blank.png";

interface Profile {
    id?: number;
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
    is_verified?: boolean;
    website?: string;
    location?: string;
    created_at?: string;
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

const TabPanel = ({ children, value, index, ...other }: TabPanelProps) => {
    return (
        <div role="tabpanel" hidden={value !== index} id={`profile-tabpanel-${index}`} aria-labelledby={`profile-tab-${index}`} {...other}>
            {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </div>
    );
};

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
    const [fetchingProfile, setFetchingProfile] = useState(false);
    const [fetchingPosts, setFetchingPosts] = useState(false);
    const [followButtonLoading, setFollowButtonLoading] = useState(false);
    const [tabValue, setTabValue] = useState(0);
    const [showCopiedSnackbar, setShowCopiedSnackbar] = useState(false);
    const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

    const [savedPosts, setSavedPosts] = useState<any[]>([]);
    const [fetchingSavedPosts, setFetchingSavedPosts] = useState(false);
    const isOwnProfile = currentUser?.id == userId;

    // Add this function to fetch saved posts
    const fetchSavedPosts = async () => {
        if (!isOwnProfile) return;
        try {
            setFetchingSavedPosts(true);
            const res = await getSavedPosts();
            setSavedPosts(res.data);
        } catch (error) {
            console.error("Error fetching saved posts:", error);
        } finally {
            setFetchingSavedPosts(false);
        }
    };

    // Add useEffect to fetch saved posts when tab changes to saved (index 2)
    useEffect(() => {
        if (tabValue === 2 && isOwnProfile && savedPosts.length === 0) {
            fetchSavedPosts();
        }
    }, [tabValue, isOwnProfile]);

    async function fetchProfile() {
        try {
            setFetchingProfile(true);
            if (userId) {
                const res = await getProfile(userId);
                setProfileData(res.data);
                setIsFollowing(res.data.is_following);
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
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
            console.error("Error fetching posts:", error);
        } finally {
            setFetchingPosts(false);
        }
    }

    useEffect(() => {
        fetchProfile();
        fetchUserPosts();
    }, [userId]);

    useEffect(() => {
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
                    setIsFollowing(true);
                    setProfileData((prev) =>
                        prev
                            ? {
                                  ...prev,
                                  is_following: true,
                                  is_request_active: true,
                                  followers_count: prev.followers_count + 1,
                              }
                            : prev,
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
                                  followers_count: prev.followers_count - 1,
                              }
                            : prev,
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

    const handleImageError = (postId: string) => {
        setImageErrors((prev) => ({ ...prev, [postId]: true }));
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    };

    if (fetchingProfile) {
        return (
            <Box sx={{ width: "100%" }}>
                <LinearProgress sx={{ height: 3 }} />
                <Container maxWidth="lg" sx={{ py: 4 }}>
                    <Stack spacing={3}>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={3} alignItems="center">
                            <MuiSkeleton variant="circular" width={100} height={100} />
                            <Box sx={{ flex: 1, width: "100%" }}>
                                <MuiSkeleton variant="text" width="60%" height={32} />
                                <MuiSkeleton variant="text" width="40%" height={20} />
                                <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                                    <MuiSkeleton variant="text" width={60} height={24} />
                                    <MuiSkeleton variant="text" width={60} height={24} />
                                    <MuiSkeleton variant="text" width={60} height={24} />
                                </Stack>
                            </Box>
                        </Stack>
                        <Grid container spacing={1}>
                            {[...Array(6)].map((_, i) => (
                                <Grid item xs={4} key={i}>
                                    <MuiSkeleton variant="rectangular" height={150} sx={{ borderRadius: 1 }} />
                                </Grid>
                            ))}
                        </Grid>
                    </Stack>
                </Container>
            </Box>
        );
    }

    return (
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
            <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 } }}>
                {/* Profile Header - Compact Design */}
                <Paper
                    elevation={0}
                    sx={{
                        borderRadius: 2,
                        bgcolor: "background.paper",
                        overflow: "hidden",
                        mb: 2,
                        border: "1px solid",
                        borderColor: "divider",
                    }}
                >
                    <Box sx={{ p: { xs: 2, sm: 3 } }}>
                        {/* Avatar and Basic Info Row */}
                        <Stack direction="row" spacing={2} alignItems="flex-start">
                            {/* Avatar */}
                            <Badge
                                overlap="circular"
                                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                                badgeContent={
                                    profileData?.is_verified && (
                                        <Verified sx={{ fontSize: 20, color: "#1DA1F2", bgcolor: "background.paper", borderRadius: "50%" }} />
                                    )
                                }
                            >
                                <Avatar
                                    src={profileData?.profile_picture || BlankProfileImage}
                                    sx={{
                                        width: { xs: 80, sm: 100 },
                                        height: { xs: 80, sm: 100 },
                                        border: "2px solid",
                                        borderColor: "background.paper",
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                    }}
                                />
                            </Badge>

                            {/* User Info and Actions */}
                            <Box sx={{ flex: 1 }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Typography variant="h5" sx={{ fontWeight: 600 }}>
                                            {profileData?.username}
                                        </Typography>
                                    </Stack>

                                    {/* Action Buttons */}
                                    <Stack direction="row" spacing={1}>
                                        {!isOwnProfile && currentUser?.id && (
                                            <>
                                                <FollowButton
                                                    isFollowing={isFollowing}
                                                    profileData={profileData}
                                                    followButtonLoading={followButtonLoading}
                                                    handleFollow={handleFollow}
                                                    handleCancelRequest={handleCancelRequest}
                                                />
                                                <Tooltip title="Send message">
                                                    <IconButton
                                                        onClick={handleSendMessage}
                                                        size="small"
                                                        sx={{
                                                            border: "1px solid",
                                                            borderColor: "divider",
                                                            borderRadius: 2,
                                                        }}
                                                    >
                                                        <Message fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </>
                                        )}
                                        <Tooltip title="More options">
                                            <IconButton onClick={handleMoreOptionsClick} size="small">
                                                <MoreVert fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Stack>
                                </Stack>

                                {/* Bio - Compact */}
                                {profileData?.bio && (
                                    <Typography variant="body2" sx={{ color: "text.primary", mt: 1, whiteSpace: "pre-line" }}>
                                        {profileData.bio}
                                    </Typography>
                                )}

                                {/* Compact Stats Row */}
                                <Stack
                                    direction="row"
                                    sx={{
                                        mt: 1.5,
                                        justifyContent: "space-between",
                                        textAlign: "center",
                                    }}
                                >
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {profileData?.posts_count || 0}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                            Posts
                                        </Typography>
                                    </Box>

                                    <Box sx={{ flex: 1, cursor: "pointer" }} onClick={() => navigate(`/profile/${userId}/followers`)}>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {profileData?.followers_count || 0}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                            Followers
                                        </Typography>
                                    </Box>

                                    <Box sx={{ flex: 1, cursor: "pointer" }} onClick={() => navigate(`/profile/${userId}/following`)}>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {profileData?.following_count || 0}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                            Following
                                        </Typography>
                                    </Box>
                                </Stack>

                                {/* Additional Info - Compact */}
                                {(profileData?.location || profileData?.website || profileData?.created_at) && (
                                    <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mt: 1.5 }}>
                                        {profileData?.location && (
                                            <Stack direction="row" spacing={0.5} alignItems="center">
                                                <Typography variant="caption" color="text.secondary">
                                                    📍
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {profileData.location}
                                                </Typography>
                                            </Stack>
                                        )}
                                        {profileData?.website && (
                                            <Stack direction="row" spacing={0.5} alignItems="center">
                                                <LinkIcon sx={{ fontSize: 12, color: "text.secondary" }} />
                                                <Typography
                                                    variant="caption"
                                                    component="a"
                                                    href={profileData.website}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    sx={{ color: "primary.main", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
                                                >
                                                    {profileData.website.replace(/^https?:\/\//, "")}
                                                </Typography>
                                            </Stack>
                                        )}
                                        {profileData?.created_at && (
                                            <Stack direction="row" spacing={0.5} alignItems="center">
                                                <CalendarToday sx={{ fontSize: 12, color: "text.secondary" }} />
                                                <Typography variant="caption" color="text.secondary">
                                                    Joined {formatDate(profileData.created_at)}
                                                </Typography>
                                            </Stack>
                                        )}
                                    </Stack>
                                )}
                            </Box>
                        </Stack>
                    </Box>
                </Paper>

                {/* Tabs Section */}
                <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                    <Tabs
                        value={tabValue}
                        onChange={(_, v) => setTabValue(v)}
                        variant={isMobile ? "fullWidth" : "standard"}
                        centered={!isMobile}
                        sx={{
                            "& .MuiTab-root": {
                                textTransform: "none",
                                fontWeight: 600,
                                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                                minHeight: 44,
                                minWidth: "auto",
                                px: 2,
                            },
                            "& .Mui-selected": { color: "primary.main" },
                            "& .MuiTabs-indicator": { bgcolor: "primary.main", height: 2 },
                        }}
                    >
                        <Tab icon={<GridOn sx={{ fontSize: 18 }} />} iconPosition="start" label="Posts" />
                        <Tab icon={<Favorite sx={{ fontSize: 18 }} />} iconPosition="start" label="Saved" disabled={!isOwnProfile} />
                    </Tabs>
                </Box>

                <TabPanel value={tabValue} index={0}>
                    {/* Posts Grid */}
                    {fetchingPosts ? (
                        <Grid container spacing={1}>
                            {[...Array(9)].map((_, i) => (
                                <Grid item xs={4} key={i}>
                                    <MuiSkeleton variant="rectangular" height={0} sx={{ paddingBottom: "100%", borderRadius: 1 }} />
                                </Grid>
                            ))}
                        </Grid>
                    ) : profileData?.is_private && !profileData?.is_following && !isOwnProfile ? (
                        <Fade in>
                            <Box sx={{ textAlign: "center", py: 8 }}>
                                <Lock sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
                                <Typography variant="body1" sx={{ color: "text.secondary", mb: 0.5 }}>
                                    This Account is Private
                                </Typography>
                                <Typography variant="body2" sx={{ color: "text.disabled" }}>
                                    Follow to see photos and videos
                                </Typography>
                            </Box>
                        </Fade>
                    ) : posts.length === 0 ? (
                        <Box sx={{ textAlign: "center", py: 8 }}>
                            <Instagram sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
                            <Typography variant="body1" sx={{ color: "text.secondary", mb: 0.5 }}>
                                No Posts Yet
                            </Typography>
                            <Typography variant="body2" sx={{ color: "text.disabled" }}>
                                {isOwnProfile ? "Share your first post!" : "No posts to show"}
                            </Typography>
                            {isOwnProfile && (
                                <Button variant="contained" size="small" sx={{ mt: 2 }} onClick={() => navigate("/create")}>
                                    Create Post
                                </Button>
                            )}
                        </Box>
                    ) : (
                        <Grid container spacing={1}>
                            {posts.map((post, index) => (
                                <Grid item xs={4} key={post.id}>
                                    <Zoom in timeout={200 * (index % 10)} style={{ transitionDelay: `${(index % 10) * 30}ms` }}>
                                        <Card
                                            sx={{
                                                position: "relative",
                                                cursor: "pointer",
                                                aspectRatio: "1",
                                                overflow: "hidden",
                                                borderRadius: 1,
                                                transition: "transform 0.2s ease",
                                                "&:hover": {
                                                    transform: "scale(1.02)",
                                                    "& .post-overlay": { opacity: 1 },
                                                },
                                            }}
                                            onClick={() => handleOpenModal(post)}
                                        >
                                            {!imageErrors[post.id] ? (
                                                <CardMedia
                                                    component="img"
                                                    image={post.file_url}
                                                    alt={`Post by ${profileData?.username}`}
                                                    sx={{ height: "100%", objectFit: "cover" }}
                                                    onError={() => handleImageError(post.id)}
                                                />
                                            ) : (
                                                <Box
                                                    sx={{
                                                        height: "100%",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        bgcolor: "action.hover",
                                                    }}
                                                >
                                                    <Instagram sx={{ fontSize: 32, color: "text.disabled" }} />
                                                </Box>
                                            )}
                                            <Box
                                                className="post-overlay"
                                                sx={{
                                                    position: "absolute",
                                                    inset: 0,
                                                    bgcolor: alpha("#000", 0.4),
                                                    opacity: 0,
                                                    transition: "opacity 0.2s ease",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    gap: 2,
                                                }}
                                            >
                                                <Stack direction="row" spacing={0.5} alignItems="center">
                                                    <Favorite sx={{ color: "white", fontSize: 16 }} />
                                                    <Typography variant="caption" sx={{ color: "white", fontWeight: 600 }}>
                                                        {post.likes_count || 0}
                                                    </Typography>
                                                </Stack>
                                                <Stack direction="row" spacing={0.5} alignItems="center">
                                                    <Comment sx={{ color: "white", fontSize: 16 }} />
                                                    <Typography variant="caption" sx={{ color: "white", fontWeight: 600 }}>
                                                        {post.comments_count || 0}
                                                    </Typography>
                                                </Stack>
                                            </Box>
                                        </Card>
                                    </Zoom>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                    {fetchingSavedPosts ? (
                        <Grid container spacing={1}>
                            {[...Array(6)].map((_, i) => (
                                <Grid item xs={4} key={i}>
                                    <MuiSkeleton variant="rectangular" height={0} sx={{ paddingBottom: "100%", borderRadius: 1 }} />
                                </Grid>
                            ))}
                        </Grid>
                    ) : savedPosts.length === 0 ? (
                        <Box sx={{ textAlign: "center", py: 8 }}>
                            <Favorite sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
                            <Typography variant="body1" sx={{ color: "text.secondary", mb: 0.5 }}>
                                No Saved Posts
                            </Typography>
                            <Typography variant="body2" sx={{ color: "text.disabled" }}>
                                Posts you save will appear here
                            </Typography>
                        </Box>
                    ) : (
                        <Grid container spacing={1.5}>
                            {savedPosts.map((post, index) => (
                                <Grid item xs={4} key={post.id}>
                                    <Zoom in timeout={200 * (index % 10)} style={{ transitionDelay: `${(index % 10) * 30}ms` }}>
                                        <Card
                                            sx={{
                                                position: "relative",
                                                cursor: "pointer",
                                                aspectRatio: "1",
                                                overflow: "hidden",
                                                borderRadius: 1,
                                                transition: "transform 0.2s ease",
                                                "&:hover": {
                                                    transform: "scale(1.02)",
                                                    "& .post-overlay": { opacity: 1 },
                                                },
                                            }}
                                            onClick={() => handleOpenModal(post)}
                                        >
                                            <CardMedia
                                                component="img"
                                                image={post.file_url}
                                                alt={`Saved post`}
                                                sx={{ height: "100%", objectFit: "cover" }}
                                            />
                                            <Box
                                                className="post-overlay"
                                                sx={{
                                                    position: "absolute",
                                                    inset: 0,
                                                    bgcolor: alpha("#000", 0.4),
                                                    opacity: 0,
                                                    transition: "opacity 0.2s ease",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    gap: 2,
                                                }}
                                            >
                                                <Stack direction="row" spacing={0.5} alignItems="center">
                                                    <Favorite sx={{ color: "white", fontSize: 16 }} />
                                                    <Typography variant="caption" sx={{ color: "white", fontWeight: 600 }}>
                                                        {post.likes_count || 0}
                                                    </Typography>
                                                </Stack>
                                                <Stack direction="row" spacing={0.5} alignItems="center">
                                                    <Comment sx={{ color: "white", fontSize: 16 }} />
                                                    <Typography variant="caption" sx={{ color: "white", fontWeight: 600 }}>
                                                        {post.comments_count || 0}
                                                    </Typography>
                                                </Stack>
                                            </Box>
                                        </Card>
                                    </Zoom>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </TabPanel>
            </Container>

            {/* Post Modal */}
            <Dialog
                open={!!selectedPost}
                onClose={handleCloseModal}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        bgcolor: "background.paper",
                        maxWidth: "min(90vw, 1000px)",
                        maxHeight: "90vh",
                        overflow: "hidden",
                    },
                }}
                TransitionComponent={Zoom}
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

            {/* Copy Link Snackbar */}
            <Snackbar
                open={showCopiedSnackbar}
                autoHideDuration={2000}
                onClose={() => setShowCopiedSnackbar(false)}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert severity="success" variant="filled" icon={<CheckCircle />} sx={{ borderRadius: 2 }}>
                    Profile link copied!
                </Alert>
            </Snackbar>

            {/* More Options Dialog */}
            <MoreOptionsDialog
                openDialog={openDialog}
                handleCloseDialog={handleCloseDialog}
                userId={userId}
                fetchProfile={fetchProfile}
                fetchUserPosts={fetchUserPosts}
                isFollowing={profileData?.is_following}
            />
        </Box>
    );
};

export default ProfilePage;
