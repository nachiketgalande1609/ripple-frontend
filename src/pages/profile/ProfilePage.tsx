// In ProfilePage.tsx
// CHANGE 1: Remove these imports (no longer needed for post modal):
//   Dialog, Zoom (from MUI) — keep Zoom only if used elsewhere
//   ModalPost import

// CHANGE 2: Remove state:
//   const [selectedPost, setSelectedPost] = useState<any | null>(null);

// CHANGE 3: In PostCard onClick handlers, replace:
//   onClick={() => setSelectedPost(post)}
// with:
//   onClick={() => navigate(`/posts/${post.id}`)}

// CHANGE 4: Remove the entire <Dialog> block for the post modal:
//
//   <Dialog
//     open={!!selectedPost}
//     onClose={() => setSelectedPost(null)}
//     ...
//   >
//     {selectedPost && (
//       <ModalPost ... />
//     )}
//   </Dialog>
//
// Delete all of the above.

// ─── Full updated file below ──────────────────────────────────────────────────

import { useState, useEffect } from "react";
import {
    Container,
    Typography,
    Avatar,
    Grid,
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
    Chip,
} from "@mui/material";
import { getProfile, getUserPosts, followUser, cancelFollowRequest, getSavedPosts } from "../../services/api";
import {
    Lock,
    Message,
    CheckCircle,
    GridOn,
    Favorite,
    Comment,
    Verified,
    CalendarToday,
    Link as LinkIcon,
    BookmarkBorder,
    PhotoCamera,
    MoreHoriz,
    ArrowUpward,
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

const TabPanel = ({ children, value, index, ...other }: TabPanelProps) => (
    <div role="tabpanel" hidden={value !== index} id={`profile-tabpanel-${index}`} aria-labelledby={`profile-tab-${index}`} {...other}>
        {value === index && (
            <Box sx={{ pt: 2 }}>
                <Fade in timeout={400}>
                    <div>{children}</div>
                </Fade>
            </Box>
        )}
    </div>
);

/* ─── Animated Stat ─────────────────────────────────────────── */
const StatBox = ({ value, label, onClick }: { value: number; label: string; onClick?: () => void }) => {
    const formatted = value >= 1_000_000 ? `${(value / 1_000_000).toFixed(1)}M` : value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value;

    return (
        <Box
            onClick={onClick}
            sx={{
                textAlign: "center",
                px: { xs: 1.5, sm: 2.5 },
                py: 1.5,
                cursor: onClick ? "pointer" : "default",
                position: "relative",
                transition: "all 0.2s ease",
                "&::after": onClick
                    ? {
                          content: '""',
                          position: "absolute",
                          bottom: 0,
                          left: "50%",
                          transform: "translateX(-50%) scaleX(0)",
                          width: "50%",
                          height: "2px",
                          bgcolor: "primary.main",
                          transition: "transform 0.25s ease",
                          borderRadius: "2px 2px 0 0",
                      }
                    : {},
                "&:hover::after": onClick ? { transform: "translateX(-50%) scaleX(1)" } : {},
                "&:hover": onClick
                    ? {
                          "& .stat-value": { color: "primary.main" },
                          "& .stat-label": { color: "text.primary" },
                      }
                    : {},
            }}
        >
            <Typography
                className="stat-value"
                sx={{
                    fontFamily: '"Instrument Serif", Georgia, serif',
                    fontStyle: "italic",
                    fontWeight: 400,
                    fontSize: { xs: "1.6rem", sm: "2rem" },
                    lineHeight: 1,
                    letterSpacing: "-0.5px",
                    transition: "color 0.2s ease",
                    color: "text.primary",
                }}
            >
                {formatted}
            </Typography>
            <Typography
                className="stat-label"
                variant="caption"
                sx={{
                    color: "text.disabled",
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    fontSize: "0.58rem",
                    display: "block",
                    mt: 0.3,
                    transition: "color 0.2s ease",
                }}
            >
                {label}
            </Typography>
        </Box>
    );
};

/* ─── Post Card ─────────────────────────────────────────────── */
const PostCard = ({
    post,
    username,
    index,
    onClick,
    imageError,
    onImageError,
}: {
    post: any;
    username?: string;
    index: number;
    onClick: () => void;
    imageError: boolean;
    onImageError: () => void;
}) => (
    <Zoom in timeout={150} style={{ transitionDelay: `${(index % 12) * 25}ms` }}>
        <Card
            onClick={onClick}
            sx={{
                position: "relative",
                cursor: "pointer",
                aspectRatio: "1",
                overflow: "hidden",
                borderRadius: "12px",
                boxShadow: "none",
                border: "1px solid",
                borderColor: "divider",
                transition: "all 0.35s cubic-bezier(.34,1.56,.64,1)",
                "&:hover": {
                    transform: "translateY(-4px) scale(1.02)",
                    boxShadow: "0 20px 48px rgba(0,0,0,0.18)",
                    "& .post-overlay": { opacity: 1 },
                    "& .post-img": { transform: "scale(1.06)" },
                },
            }}
        >
            {!imageError ? (
                <CardMedia
                    component="img"
                    className="post-img"
                    image={post.file_url}
                    alt={`Post by ${username}`}
                    sx={{
                        height: "100%",
                        objectFit: "cover",
                        transition: "transform 0.45s cubic-bezier(0.4,0,0.2,1)",
                    }}
                    onError={onImageError}
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
                    <PhotoCamera sx={{ fontSize: 22, color: "text.disabled" }} />
                </Box>
            )}
            <Box
                className="post-overlay"
                sx={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 40%, transparent 100%)",
                    opacity: 0,
                    transition: "opacity 0.3s ease",
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "space-between",
                    px: 1.25,
                    pb: 1.25,
                }}
            >
                <Stack direction="row" spacing={0.5} alignItems="center">
                    <Favorite sx={{ color: "white", fontSize: 13 }} />
                    <Typography variant="caption" sx={{ color: "white", fontWeight: 700, fontSize: "0.65rem" }}>
                        {post.likes_count || 0}
                    </Typography>
                </Stack>
                <Stack direction="row" spacing={0.5} alignItems="center">
                    <Comment sx={{ color: "white", fontSize: 13 }} />
                    <Typography variant="caption" sx={{ color: "white", fontWeight: 700, fontSize: "0.65rem" }}>
                        {post.comments_count || 0}
                    </Typography>
                </Stack>
            </Box>
        </Card>
    </Zoom>
);

/* ─── Main Component ─────────────────────────────────────────── */
const ProfilePage = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const { postUploading } = useGlobalStore();

    const currentUser = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") || "") : {};

    const [profileData, setProfileData] = useState<Profile | null>(null);
    const [posts, setPosts] = useState<any[]>([]);
    // ✅ REMOVED: selectedPost state (no longer needed)
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
    const [scrolled, setScrolled] = useState(false);

    const isOwnProfile = currentUser?.id == userId;

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 80);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

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

    useEffect(() => {
        if (tabValue === 1 && isOwnProfile && savedPosts.length === 0) {
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

    const formatDate = (dateString?: string) => {
        if (!dateString) return "";
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
        });
    };

    /* ── Loading skeleton ── */
    if (fetchingProfile) {
        return (
            <Box sx={{ width: "100%", minHeight: "100vh", bgcolor: "background.default" }}>
                <LinearProgress
                    sx={{
                        height: 2,
                        "& .MuiLinearProgress-bar": {
                            background: "linear-gradient(90deg, #6366f1, #a855f7, #ec4899)",
                        },
                    }}
                />
                <Container maxWidth="md" sx={{ py: 4 }}>
                    <Stack spacing={3}>
                        <MuiSkeleton variant="rectangular" sx={{ borderRadius: 3, height: 180 }} />
                        <Stack direction="row" spacing={2.5} alignItems="flex-start" sx={{ mt: -6, ml: 3 }}>
                            <MuiSkeleton variant="circular" width={96} height={96} />
                            <Box sx={{ flex: 1, pt: 6 }}>
                                <MuiSkeleton variant="text" width="40%" height={28} />
                                <MuiSkeleton variant="text" width="60%" height={18} sx={{ mt: 0.5 }} />
                            </Box>
                        </Stack>
                        <Grid container spacing={1.5}>
                            {[...Array(9)].map((_, i) => (
                                <Grid item xs={4} key={i}>
                                    <MuiSkeleton variant="rectangular" sx={{ paddingBottom: "100%", borderRadius: "12px" }} />
                                </Grid>
                            ))}
                        </Grid>
                    </Stack>
                </Container>
            </Box>
        );
    }

    const canViewPosts = profileData && (isOwnProfile || !profileData.is_private || profileData.is_following);

    /* ── Gradient accent based on username (deterministic) ── */
    const gradients = [
        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
        "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
        "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
        "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
        "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
        "linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)",
        "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)",
    ];

    const usernameHash = (profileData?.username || "").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const coverGradient = gradients[usernameHash % gradients.length];

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600&display=swap');
      `}</style>

            <Box
                sx={{
                    bgcolor: "background.default",
                    minHeight: "100vh",
                    pb: 8,
                    fontFamily: '"DM Sans", sans-serif',
                }}
            >
                {/* ── Sticky mini-header on scroll ── */}
                <Fade in={scrolled}>
                    <Box
                        sx={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            right: 0,
                            zIndex: 100,
                            backdropFilter: "blur(20px)",
                            bgcolor: alpha(theme.palette.background.default, 0.85),
                            borderBottom: "1px solid",
                            borderColor: "divider",
                            px: 3,
                            py: 1,
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                        }}
                    >
                        <Avatar src={profileData?.profile_picture || BlankProfileImage} sx={{ width: 32, height: 32 }} />
                        <Typography sx={{ fontWeight: 600, fontSize: "0.9rem" }}>{profileData?.username}</Typography>
                        {profileData?.is_verified && <Verified sx={{ fontSize: 14, color: "#1DA1F2" }} />}
                        <Box sx={{ flex: 1 }} />
                        <Typography
                            variant="caption"
                            sx={{
                                color: "text.secondary",
                                fontWeight: 500,
                                letterSpacing: "0.05em",
                            }}
                        >
                            {profileData?.posts_count || 0} posts
                        </Typography>
                    </Box>
                </Fade>

                <Container maxWidth="md" sx={{ pt: 0 }}>
                    <Fade in timeout={400}>
                        <Box>
                            {/* ── Cover image ── */}
                            <Box
                                sx={{
                                    height: { xs: 140, sm: 200 },
                                    background: coverGradient,
                                    borderRadius: "0 0 24px 24px",
                                    position: "relative",
                                    overflow: "hidden",
                                    mb: 0,
                                }}
                            >
                                <Box
                                    sx={{
                                        position: "absolute",
                                        inset: 0,
                                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E")`,
                                        opacity: 0.4,
                                    }}
                                />

                                <Stack direction="row" spacing={0.75} sx={{ position: "absolute", top: 12, right: 12 }}>
                                    {!isOwnProfile && currentUser?.id && (
                                        <Tooltip title="Send message">
                                            <IconButton
                                                onClick={() => navigate(`/messages/${userId}`, { state: profileData })}
                                                size="small"
                                                sx={{
                                                    bgcolor: "rgba(255,255,255,0.25)",
                                                    backdropFilter: "blur(12px)",
                                                    border: "1px solid rgba(255,255,255,0.3)",
                                                    width: 34,
                                                    height: 34,
                                                    "&:hover": { bgcolor: "rgba(255,255,255,0.4)" },
                                                }}
                                            >
                                                <Message sx={{ fontSize: 16, color: "white" }} />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                    <Tooltip title="More options">
                                        <IconButton
                                            onClick={() => setOpenDialog(true)}
                                            size="small"
                                            sx={{
                                                bgcolor: "rgba(0, 0, 0, 0.25)",
                                                backdropFilter: "blur(12px)",
                                                border: "1px solid rgba(255,255,255,0.3)",
                                                width: 34,
                                                height: 34,
                                                "&:hover": { bgcolor: "rgba(0, 0, 0, 0.4)" },
                                            }}
                                        >
                                            <MoreHoriz sx={{ fontSize: 16, color: "white" }} />
                                        </IconButton>
                                    </Tooltip>
                                </Stack>
                            </Box>

                            {/* ── Profile body ── */}
                            <Box sx={{ px: { xs: 2, sm: 3 } }}>
                                {/* Avatar + follow row */}
                                <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mt: "-52px", mb: 2 }}>
                                    <Badge
                                        overlap="circular"
                                        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                                        badgeContent={
                                            profileData?.is_verified ? (
                                                <Verified
                                                    sx={{
                                                        fontSize: 18,
                                                        color: "#1DA1F2",
                                                        bgcolor: "background.paper",
                                                        borderRadius: "50%",
                                                        p: "1.5px",
                                                        boxShadow: "0 0 0 2px " + theme.palette.background.paper,
                                                    }}
                                                />
                                            ) : null
                                        }
                                    >
                                        <Avatar
                                            src={profileData?.profile_picture || BlankProfileImage}
                                            sx={{
                                                width: { xs: 88, sm: 104 },
                                                height: { xs: 88, sm: 104 },
                                                border: "4px solid",
                                                borderColor: "background.default",
                                                boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                                                fontSize: "2rem",
                                                transition: "transform 0.3s cubic-bezier(.34,1.56,.64,1)",
                                                "&:hover": { transform: "scale(1.04)" },
                                            }}
                                        />
                                    </Badge>

                                    <Stack direction="row" spacing={1} alignItems="center">
                                        {!isOwnProfile && currentUser?.id && (
                                            <FollowButton
                                                isFollowing={isFollowing}
                                                profileData={profileData}
                                                followButtonLoading={followButtonLoading}
                                                handleFollow={handleFollow}
                                                handleCancelRequest={handleCancelRequest}
                                            />
                                        )}
                                        {isOwnProfile && (
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={() => navigate(`/settings?setting=profiledetails`)}
                                                sx={{
                                                    textTransform: "none",
                                                    fontWeight: 600,
                                                    borderRadius: "20px",
                                                    fontSize: "0.8rem",
                                                    px: 2.5,
                                                    py: 0.75,
                                                    borderColor: "divider",
                                                    color: "text.primary",
                                                    "&:hover": {
                                                        borderColor: "text.secondary",
                                                        bgcolor: alpha(theme.palette.text.primary, 0.04),
                                                    },
                                                }}
                                            >
                                                Edit profile
                                            </Button>
                                        )}
                                    </Stack>
                                </Stack>

                                {/* Name + username */}
                                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                                    <Typography
                                        sx={{
                                            fontFamily: '"Instrument Serif", Georgia, serif',
                                            fontWeight: 400,
                                            fontSize: { xs: "1.5rem", sm: "1.85rem" },
                                            letterSpacing: "-0.5px",
                                            lineHeight: 1.15,
                                            color: "text.primary",
                                        }}
                                    >
                                        {profileData?.username}
                                    </Typography>
                                </Stack>

                                {/* Bio */}
                                {profileData?.bio && (
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            mt: 1,
                                            color: "text.secondary",
                                            whiteSpace: "pre-line",
                                            lineHeight: 1.7,
                                            maxWidth: 480,
                                            fontSize: "0.88rem",
                                        }}
                                    >
                                        {profileData.bio}
                                    </Typography>
                                )}

                                {/* Meta chips */}
                                {(profileData?.location || profileData?.website || profileData?.created_at) && (
                                    <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mt: 1.5 }}>
                                        {profileData?.location && (
                                            <Chip
                                                label={profileData.location}
                                                icon={<Typography sx={{ fontSize: "12px !important", pl: 0.5 }}>📍</Typography>}
                                                size="small"
                                                variant="outlined"
                                                sx={{
                                                    fontSize: "0.73rem",
                                                    height: 26,
                                                    fontWeight: 500,
                                                    borderColor: "divider",
                                                    color: "text.secondary",
                                                    bgcolor: "transparent",
                                                    "&:hover": { bgcolor: alpha(theme.palette.text.primary, 0.04) },
                                                }}
                                            />
                                        )}
                                        {profileData?.website && (
                                            <Chip
                                                component="a"
                                                href={profileData.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                label={profileData.website.replace(/^https?:\/\//, "")}
                                                icon={<LinkIcon sx={{ fontSize: "13px !important" }} />}
                                                size="small"
                                                variant="outlined"
                                                clickable
                                                sx={{
                                                    fontSize: "0.73rem",
                                                    height: 26,
                                                    fontWeight: 600,
                                                    borderColor: alpha(theme.palette.primary.main, 0.4),
                                                    color: "primary.main",
                                                    bgcolor: alpha(theme.palette.primary.main, 0.04),
                                                    "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.1) },
                                                }}
                                            />
                                        )}
                                        {profileData?.created_at && (
                                            <Chip
                                                label={`Joined ${formatDate(profileData.created_at)}`}
                                                icon={<CalendarToday sx={{ fontSize: "12px !important" }} />}
                                                size="small"
                                                variant="outlined"
                                                sx={{
                                                    fontSize: "0.73rem",
                                                    height: 26,
                                                    fontWeight: 500,
                                                    borderColor: "divider",
                                                    color: "text.disabled",
                                                    bgcolor: "transparent",
                                                }}
                                            />
                                        )}
                                    </Stack>
                                )}

                                {/* Stats row */}
                                <Box
                                    sx={{
                                        mt: 2.5,
                                        mb: 0.5,
                                        display: "flex",
                                        borderTop: "1px solid",
                                        borderBottom: "1px solid",
                                        borderColor: "divider",
                                        mx: -0.5,
                                    }}
                                >
                                    <Box sx={{ flex: 1, borderRight: "1px solid", borderColor: "divider" }}>
                                        <StatBox value={profileData?.posts_count || 0} label="Posts" />
                                    </Box>
                                    <Box sx={{ flex: 1, borderRight: "1px solid", borderColor: "divider" }}>
                                        <StatBox
                                            value={profileData?.followers_count || 0}
                                            label="Followers"
                                            onClick={() => navigate(`/profile/${userId}/followers`)}
                                        />
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <StatBox
                                            value={profileData?.following_count || 0}
                                            label="Following"
                                            onClick={() => navigate(`/profile/${userId}/following`)}
                                        />
                                    </Box>
                                </Box>
                            </Box>

                            {/* ── Tabs ── */}
                            <Box sx={{ px: { xs: 2, sm: 3 }, mt: 0 }}>
                                <Tabs
                                    value={tabValue}
                                    onChange={(_, v) => setTabValue(v)}
                                    variant={isMobile ? "fullWidth" : "standard"}
                                    centered={!isMobile}
                                    sx={{
                                        minHeight: 44,
                                        "& .MuiTab-root": {
                                            textTransform: "none",
                                            fontWeight: 600,
                                            fontFamily: '"DM Sans", sans-serif',
                                            fontSize: { xs: "0.78rem", sm: "0.85rem" },
                                            minHeight: 44,
                                            minWidth: "auto",
                                            px: { xs: 1.5, sm: 3 },
                                            gap: 0.75,
                                            color: "text.disabled",
                                            letterSpacing: "0.03em",
                                            transition: "color 0.2s ease",
                                        },
                                        "& .Mui-selected": { color: "text.primary !important" },
                                        "& .MuiTabs-indicator": {
                                            height: 2,
                                            borderRadius: "2px 2px 0 0",
                                            background: "linear-gradient(90deg, #6366f1, #a855f7)",
                                        },
                                    }}
                                >
                                    <Tab icon={<GridOn sx={{ fontSize: 15 }} />} iconPosition="start" label="Posts" />
                                    <Tab
                                        icon={<BookmarkBorder sx={{ fontSize: 15 }} />}
                                        iconPosition="start"
                                        label="Saved"
                                        disabled={!isOwnProfile}
                                    />
                                </Tabs>
                            </Box>

                            {/* ── Posts Tab ── */}
                            <Box sx={{ px: { xs: 2, sm: 3 } }}>
                                <TabPanel value={tabValue} index={0}>
                                    {fetchingPosts ? (
                                        <Grid container spacing={1.5}>
                                            {[...Array(9)].map((_, i) => (
                                                <Grid item xs={4} key={i}>
                                                    <MuiSkeleton variant="rectangular" sx={{ paddingBottom: "100%", borderRadius: "12px" }} />
                                                </Grid>
                                            ))}
                                        </Grid>
                                    ) : !canViewPosts ? (
                                        <Box sx={{ textAlign: "center", py: { xs: 8, sm: 12 } }}>
                                            <Box
                                                sx={{
                                                    width: 72,
                                                    height: 72,
                                                    borderRadius: "50%",
                                                    background: coverGradient,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    mx: "auto",
                                                    mb: 2,
                                                    opacity: 0.7,
                                                }}
                                            >
                                                <Lock sx={{ fontSize: 28, color: "white" }} />
                                            </Box>
                                            <Typography
                                                sx={{
                                                    fontFamily: '"Instrument Serif", Georgia, serif',
                                                    fontSize: "1.3rem",
                                                    mb: 0.75,
                                                }}
                                            >
                                                This account is private
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.82rem" }}>
                                                Follow to see their photos and videos
                                            </Typography>
                                        </Box>
                                    ) : posts.length === 0 ? (
                                        <Box sx={{ textAlign: "center", py: { xs: 8, sm: 12 } }}>
                                            <Box
                                                sx={{
                                                    width: 72,
                                                    height: 72,
                                                    borderRadius: "50%",
                                                    background: coverGradient,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    mx: "auto",
                                                    mb: 2,
                                                    opacity: 0.7,
                                                }}
                                            >
                                                <PhotoCamera sx={{ fontSize: 28, color: "white" }} />
                                            </Box>
                                            <Typography
                                                sx={{
                                                    fontFamily: '"Instrument Serif", Georgia, serif',
                                                    fontSize: "1.3rem",
                                                    mb: 0.5,
                                                }}
                                            >
                                                No posts yet
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: "text.secondary",
                                                    display: "block",
                                                    mb: 2.5,
                                                    fontSize: "0.82rem",
                                                }}
                                            >
                                                {isOwnProfile ? "Share your first photo or video" : "Nothing here yet"}
                                            </Typography>
                                            {isOwnProfile && (
                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    disableElevation
                                                    onClick={() => navigate("/create")}
                                                    sx={{
                                                        textTransform: "none",
                                                        fontWeight: 700,
                                                        borderRadius: "20px",
                                                        px: 3,
                                                        py: 1,
                                                        fontSize: "0.82rem",
                                                        background: coverGradient,
                                                        "&:hover": { opacity: 0.9 },
                                                    }}
                                                >
                                                    Create your first post
                                                </Button>
                                            )}
                                        </Box>
                                    ) : (
                                        <Grid container spacing={1.5}>
                                            {posts.map((post, index) => (
                                                <Grid item xs={4} key={post.id}>
                                                    <PostCard
                                                        post={post}
                                                        username={profileData?.username}
                                                        index={index}
                                                        // ✅ Navigate to post detail page instead of opening modal
                                                        onClick={() => navigate(`/posts/${post.id}`)}
                                                        imageError={!!imageErrors[post.id]}
                                                        onImageError={() =>
                                                            setImageErrors((prev) => ({
                                                                ...prev,
                                                                [post.id]: true,
                                                            }))
                                                        }
                                                    />
                                                </Grid>
                                            ))}
                                        </Grid>
                                    )}
                                </TabPanel>

                                {/* ── Saved Tab ── */}
                                <TabPanel value={tabValue} index={1}>
                                    {fetchingSavedPosts ? (
                                        <Grid container spacing={1.5}>
                                            {[...Array(6)].map((_, i) => (
                                                <Grid item xs={4} key={i}>
                                                    <MuiSkeleton variant="rectangular" sx={{ paddingBottom: "100%", borderRadius: "12px" }} />
                                                </Grid>
                                            ))}
                                        </Grid>
                                    ) : savedPosts.length === 0 ? (
                                        <Box sx={{ textAlign: "center", py: { xs: 8, sm: 12 } }}>
                                            <Box
                                                sx={{
                                                    width: 72,
                                                    height: 72,
                                                    borderRadius: "50%",
                                                    background: coverGradient,
                                                    opacity: 0.7,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    mx: "auto",
                                                    mb: 2,
                                                }}
                                            >
                                                <BookmarkBorder sx={{ fontSize: 28, color: "white" }} />
                                            </Box>
                                            <Typography
                                                sx={{
                                                    fontFamily: '"Instrument Serif", Georgia, serif',
                                                    fontSize: "1.3rem",
                                                    mb: 0.5,
                                                }}
                                            >
                                                Nothing saved yet
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.82rem" }}>
                                                Posts you save will appear here
                                            </Typography>
                                        </Box>
                                    ) : (
                                        <Grid container spacing={1.5}>
                                            {savedPosts.map((post, index) => (
                                                <Grid item xs={4} key={post.id}>
                                                    <PostCard
                                                        post={post}
                                                        index={index}
                                                        // ✅ Navigate to post detail page instead of opening modal
                                                        onClick={() => navigate(`/posts/${post.id}`)}
                                                        imageError={!!imageErrors[post.id]}
                                                        onImageError={() =>
                                                            setImageErrors((prev) => ({
                                                                ...prev,
                                                                [post.id]: true,
                                                            }))
                                                        }
                                                    />
                                                </Grid>
                                            ))}
                                        </Grid>
                                    )}
                                </TabPanel>
                            </Box>
                        </Box>
                    </Fade>
                </Container>

                {/* ── Back-to-top FAB ── */}
                <Fade in={scrolled}>
                    <IconButton
                        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                        sx={{
                            position: "fixed",
                            bottom: 24,
                            right: 24,
                            width: 44,
                            height: 44,
                            background: coverGradient,
                            color: "white",
                            boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
                            zIndex: 50,
                            "&:hover": { opacity: 0.9, transform: "translateY(-2px)" },
                            transition: "all 0.2s ease",
                        }}
                    >
                        <ArrowUpward sx={{ fontSize: 18 }} />
                    </IconButton>
                </Fade>

                {/* ✅ REMOVED: Post modal Dialog (replaced by navigation to /posts/:postId) */}

                {/* ── Snackbar ── */}
                <Snackbar
                    open={showCopiedSnackbar}
                    autoHideDuration={2000}
                    onClose={() => setShowCopiedSnackbar(false)}
                    anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                >
                    <Alert severity="success" variant="filled" icon={<CheckCircle />} sx={{ borderRadius: "12px", fontWeight: 600 }}>
                        Profile link copied!
                    </Alert>
                </Snackbar>

                {/* ── More Options ── */}
                <MoreOptionsDialog
                    openDialog={openDialog}
                    handleCloseDialog={() => setOpenDialog(false)}
                    userId={userId}
                    fetchProfile={fetchProfile}
                    fetchUserPosts={fetchUserPosts}
                    isFollowing={profileData?.is_following}
                />
            </Box>
        </>
    );
};

export default ProfilePage;
