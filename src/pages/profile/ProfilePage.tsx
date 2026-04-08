import { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Avatar,
  Grid,
  Button,
  IconButton,
  Box,
  LinearProgress,
  Stack,
  Fade,
  Zoom,
  Tooltip,
  Card,
  CardMedia,
  Skeleton as MuiSkeleton,
  Tabs,
  Tab,
  Badge,
  Alert,
  Snackbar,
} from "@mui/material";
import {
  getProfile,
  getUserPosts,
  followUser,
  cancelFollowRequest,
  getSavedPosts,
  unfollowUser,
} from "../../services/api";
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
  ArrowBack,
} from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import MoreOptionsDialog from "./MoreOptionsDialog";
import { useGlobalStore } from "../../store/store";
import FollowButton from "./FollowButton";
import BlankProfileImage from "../../static/profile_blank.png";
import CreatePostModal from "../../component/post/CreatePostModal";
import VideoThumbnail from "../../component/post/VideoThumbnail";

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
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`profile-tabpanel-${index}`}
    aria-labelledby={`profile-tab-${index}`}
    {...other}
  >
    {value === index && (
      <Fade in timeout={300}>
        <div>{children}</div>
      </Fade>
    )}
  </div>
);

/* ─── Stat Box ───────────────────────────────────────────────── */
const StatBox = ({
  value,
  label,
  onClick,
}: {
  value: number;
  label: string;
  onClick?: () => void;
}) => {
  const formatted =
    value >= 1_000_000
      ? `${(value / 1_000_000).toFixed(1)}M`
      : value >= 1000
        ? `${(value / 1000).toFixed(1)}K`
        : value;

  return (
    <Box
      onClick={onClick}
      sx={{
        textAlign: "center",
        px: { xs: 1, sm: 2 },
        py: 1.5,
        cursor: onClick ? "pointer" : "default",
        transition: "background 0.15s",
        "&:hover": onClick ? { bgcolor: "action.hover" } : {},
      }}
    >
      <Typography
        sx={{
          fontWeight: 600,
          fontSize: { xs: "1.15rem", sm: "1.35rem" },
          lineHeight: 1,
          color: "text.primary",
        }}
      >
        {formatted}
      </Typography>
      <Typography
        variant="caption"
        sx={{
          color: "text.disabled",
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          fontSize: "0.6rem",
          display: "block",
          mt: 0.4,
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
}) => {
  const isVideo = post.file_url && /\.(mp4|mov|webm)$/i.test(post.file_url);

  return (
    <Zoom
      in
      timeout={120}
      style={{ transitionDelay: `${(index % 12) * 20}ms` }}
    >
      <Card
        onClick={onClick}
        sx={{
          position: "relative",
          cursor: "pointer",
          aspectRatio: "1",
          overflow: "hidden",
          borderRadius: "8px",
          boxShadow: "none",
          bgcolor: "action.hover",
          transition: "transform 0.2s ease",
          "&:hover": {
            transform: "scale(1.02)",
            "& .post-overlay": { opacity: 1 },
            "& .post-img": { transform: "scale(1.05)" },
          },
        }}
      >
        {isVideo ? (
          <VideoThumbnail src={post.file_url} />
        ) : !imageError ? (
          <CardMedia
            component="img"
            className="post-img"
            image={post.file_url}
            alt={`Post by ${username}`}
            sx={{
              height: "100%",
              objectFit: "cover",
              transition: "transform 0.35s ease",
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
            <PhotoCamera sx={{ fontSize: 20, color: "text.disabled" }} />
          </Box>
        )}

        <Box
          className="post-overlay"
          sx={{
            position: "absolute",
            inset: 0,
            bgcolor: "rgba(0,0,0,0.38)",
            opacity: 0,
            transition: "opacity 0.2s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
          }}
        >
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Favorite sx={{ color: "white", fontSize: 14 }} />
            <Typography
              variant="caption"
              sx={{ color: "white", fontWeight: 600, fontSize: "0.7rem" }}
            >
              {post.likes_count || 0}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Comment sx={{ color: "white", fontSize: 14 }} />
            <Typography
              variant="caption"
              sx={{ color: "white", fontWeight: 600, fontSize: "0.7rem" }}
            >
              {post.comments_count || 0}
            </Typography>
          </Stack>
        </Box>
      </Card>
    </Zoom>
  );
};

/* ─── Empty / Private State ──────────────────────────────────── */
const EmptyState = ({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) => (
  <Box sx={{ textAlign: "center", py: { xs: 8, sm: 10 } }}>
    <Box
      sx={{
        width: 56,
        height: 56,
        borderRadius: "50%",
        bgcolor: "action.hover",
        border: "1px solid",
        borderColor: "divider",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        mx: "auto",
        mb: 2,
      }}
    >
      {icon}
    </Box>
    <Typography
      sx={{
        fontWeight: 600,
        fontSize: "0.95rem",
        mb: 0.5,
        color: "text.primary",
      }}
    >
      {title}
    </Typography>
    <Typography
      variant="caption"
      sx={{ color: "text.secondary", fontSize: "0.8rem", display: "block" }}
    >
      {subtitle}
    </Typography>
    {action && <Box sx={{ mt: 2.5 }}>{action}</Box>}
  </Box>
);

/* ─── Main Component ─────────────────────────────────────────── */
const ProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { postUploading } = useGlobalStore();

  const currentUser = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user") || "")
    : {};

  const [profileData, setProfileData] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
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
  const [modalOpen, setModalOpen] = useState(false);

  const isOwnProfile = currentUser?.id == userId;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
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
    const canView =
      profileData &&
      (isOwnProfile || !profileData.is_private || profileData.is_following);
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

  const handleUnfollow = async () => {
    if (currentUser?.id && userId) {
      setFollowButtonLoading(true);
      try {
        const res = await unfollowUser(currentUser.id.toString(), userId);
        if (res?.success) {
          setIsFollowing(false);
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
        }
      } catch (error) {
        console.error("Failed to unfollow the user:", error);
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
      <Box
        sx={{
          width: "100%",
          minHeight: "100vh",
          bgcolor: "background.default",
        }}
      >
        <LinearProgress sx={{ height: 2 }} />
        <Container maxWidth="sm" sx={{ py: 3, px: { xs: 2, sm: 3 } }}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={2} alignItems="flex-start">
              <MuiSkeleton variant="circular" width={80} height={80} />
              <Box sx={{ flex: 1, pt: 1 }}>
                <MuiSkeleton variant="text" width="50%" height={22} />
                <MuiSkeleton
                  variant="text"
                  width="35%"
                  height={16}
                  sx={{ mt: 0.5 }}
                />
                <MuiSkeleton
                  variant="text"
                  width="70%"
                  height={14}
                  sx={{ mt: 1 }}
                />
              </Box>
            </Stack>
            <MuiSkeleton
              variant="rectangular"
              height={48}
              sx={{ borderRadius: 1 }}
            />
            <Grid container spacing={1}>
              {[...Array(9)].map((_, i) => (
                <Grid item xs={4} key={i}>
                  <MuiSkeleton
                    variant="rectangular"
                    sx={{ paddingBottom: "100%", borderRadius: "8px" }}
                  />
                </Grid>
              ))}
            </Grid>
          </Stack>
        </Container>
      </Box>
    );
  }

  const canViewPosts =
    profileData &&
    (isOwnProfile || !profileData.is_private || profileData.is_following);

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh", pb: 8 }}>
      {/* ── Sticky top bar (always visible on mobile, fades in on scroll for desktop) ── */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          bgcolor: "background.paper",
          borderBottom: "0.5px solid",
          borderColor: "divider",
          px: { xs: 1.5, sm: 2 },
          py: 1,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <IconButton
          size="small"
          onClick={() => navigate(-1)}
          sx={{ color: "text.primary" }}
        >
          <ArrowBack sx={{ fontSize: 20 }} />
        </IconButton>

        <Fade in={scrolled}>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ flex: 1, minWidth: 0 }}
          >
            <Avatar
              src={profileData?.profile_picture || BlankProfileImage}
              sx={{ width: 28, height: 28 }}
            />
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: "0.88rem",
                color: "text.primary",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {profileData?.username}
            </Typography>
            {profileData?.is_verified && (
              <Verified
                sx={{ fontSize: 13, color: "#1d9bf0", flexShrink: 0 }}
              />
            )}
          </Stack>
        </Fade>

        <Box sx={{ flex: scrolled ? "none" : 1 }} />

        <IconButton
          size="small"
          onClick={() => setOpenDialog(true)}
          sx={{ color: "text.secondary" }}
        >
          <MoreHoriz sx={{ fontSize: 20 }} />
        </IconButton>
      </Box>

      <Container maxWidth="sm" sx={{ pt: 0, px: { xs: 0, sm: 2 } }}>
        <Fade in timeout={350}>
          <Box>
            {/* ── Profile header ── */}
            <Box
              sx={{
                bgcolor: "background.paper",
                borderBottom: "0.5px solid",
                borderColor: "divider",
                px: { xs: 2, sm: 3 },
                pt: 2.5,
                pb: 0,
              }}
            >
              {/* Avatar row */}
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="flex-start"
                sx={{ mb: 2 }}
              >
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                  badgeContent={
                    profileData?.is_verified ? (
                      <Verified
                        sx={{
                          fontSize: 16,
                          color: "#1d9bf0",
                          bgcolor: "background.paper",
                          borderRadius: "50%",
                          p: "1px",
                        }}
                      />
                    ) : null
                  }
                >
                  <Avatar
                    src={profileData?.profile_picture || BlankProfileImage}
                    sx={{
                      width: { xs: 76, sm: 88 },
                      height: { xs: 76, sm: 88 },
                      border: "2.5px solid",
                      borderColor: "divider",
                      fontSize: "1.75rem",
                    }}
                  />
                </Badge>

                {/* Action buttons */}
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ pt: 0.5 }}
                >
                  {!isOwnProfile && currentUser?.id && (
                    <>
                      <Tooltip title="Send message">
                        <IconButton
                          size="small"
                          onClick={() =>
                            navigate(`/messages/${userId}`, {
                              state: profileData,
                            })
                          }
                          sx={{
                            border: "0.5px solid",
                            borderColor: "divider",
                            borderRadius: "8px",
                            width: 30.8,
                            height: 30.8,
                            color: "text.secondary",
                            "&:hover": { bgcolor: "action.hover" },
                          }}
                        >
                          <Message sx={{ fontSize: 17 }} />
                        </IconButton>
                      </Tooltip>
                      <FollowButton
                        isFollowing={isFollowing}
                        profileData={profileData}
                        followButtonLoading={followButtonLoading}
                        handleFollow={handleFollow}
                        handleCancelRequest={handleCancelRequest}
                        handleUnfollow={handleUnfollow}
                      />
                    </>
                  )}
                  {isOwnProfile && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() =>
                        navigate(`/settings?setting=profiledetails`)
                      }
                      sx={{
                        textTransform: "none",
                        fontWeight: 500,
                        borderRadius: "8px",
                        fontSize: "0.8rem",
                        px: 2,
                        py: 0.75,
                        borderColor: "divider",
                        color: "text.primary",
                        "&:hover": {
                          borderColor: "text.secondary",
                          bgcolor: "action.hover",
                        },
                      }}
                    >
                      Edit profile
                    </Button>
                  )}
                </Stack>
              </Stack>

              {/* Name */}
              <Stack
                direction="row"
                alignItems="center"
                spacing={0.75}
                sx={{ mb: 0.25 }}
              >
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: "1rem", sm: "1.1rem" },
                    color: "text.primary",
                  }}
                >
                  {profileData?.username}
                </Typography>
                {profileData?.is_verified && (
                  <Verified sx={{ fontSize: 15, color: "#1d9bf0" }} />
                )}
              </Stack>

              {/* Bio */}
              {profileData?.bio ? (
                <Typography
                  variant="body2"
                  sx={{
                    color: "text.primary",
                    whiteSpace: "pre-line",
                    lineHeight: 1.6,
                    fontSize: "0.85rem",
                    mt: 0.5,
                    mb: 1,
                  }}
                >
                  {profileData.bio}
                </Typography>
              ) : isOwnProfile ? (
                <Typography
                  variant="body2"
                  onClick={() => navigate(`/settings?setting=profiledetails`)}
                  sx={{
                    color: "text.disabled",
                    fontSize: "0.82rem",
                    mt: 0.5,
                    mb: 1,
                    cursor: "pointer",
                    "&:hover": { color: "text.secondary" },
                  }}
                >
                  + Add a bio
                </Typography>
              ) : null}

              {/* Meta */}
              {(profileData?.location ||
                profileData?.website ||
                profileData?.created_at) && (
                <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 1.5 }}>
                  {profileData?.location && (
                    <Stack direction="row" alignItems="center" spacing={0.4}>
                      <Typography sx={{ fontSize: "12px" }}>📍</Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary", fontSize: "0.78rem" }}
                      >
                        {profileData.location}
                      </Typography>
                    </Stack>
                  )}
                  {profileData?.website && (
                    <Stack direction="row" alignItems="center" spacing={0.4}>
                      <LinkIcon sx={{ fontSize: 12, color: "primary.main" }} />
                      <Typography
                        component="a"
                        href={profileData.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="caption"
                        sx={{
                          color: "primary.main",
                          fontSize: "0.78rem",
                          fontWeight: 500,
                          textDecoration: "none",
                          "&:hover": { textDecoration: "underline" },
                        }}
                      >
                        {profileData.website.replace(/^https?:\/\//, "")}
                      </Typography>
                    </Stack>
                  )}
                  {profileData?.created_at && (
                    <Stack direction="row" alignItems="center" spacing={0.4}>
                      <CalendarToday
                        sx={{ fontSize: 12, color: "text.disabled" }}
                      />
                      <Typography
                        variant="caption"
                        sx={{ color: "text.disabled", fontSize: "0.78rem" }}
                      >
                        Joined {formatDate(profileData.created_at)}
                      </Typography>
                    </Stack>
                  )}
                </Stack>
              )}

              {/* Stats row */}
              <Box
                sx={{
                  display: "flex",
                  borderTop: "0.5px solid",
                  borderColor: "divider",
                  mx: { xs: -2, sm: -3 },
                }}
              >
                {[
                  { value: profileData?.posts_count || 0, label: "Posts" },
                  {
                    value: profileData?.followers_count || 0,
                    label: "Followers",
                    onClick: () => navigate(`/profile/${userId}/followers`),
                  },
                  {
                    value: profileData?.following_count || 0,
                    label: "Following",
                    onClick: () => navigate(`/profile/${userId}/following`),
                  },
                ].map((stat, i, arr) => (
                  <Box
                    key={stat.label}
                    sx={{
                      flex: 1,
                      borderRight: i < arr.length - 1 ? "0.5px solid" : "none",
                      borderColor: "divider",
                    }}
                  >
                    <StatBox {...stat} />
                  </Box>
                ))}
              </Box>
            </Box>

            {/* ── Tabs ── */}
            <Box
              sx={{
                bgcolor: "background.paper",
                borderBottom: "0.5px solid",
                borderColor: "divider",
                position: "sticky",
                top: 49,
                zIndex: 9,
              }}
            >
              <Tabs
                value={tabValue}
                onChange={(_, v) => setTabValue(v)}
                variant="fullWidth"
                sx={{
                  minHeight: 44,
                  "& .MuiTab-root": {
                    textTransform: "none",
                    fontWeight: 500,
                    fontSize: "0.82rem",
                    minHeight: 44,
                    gap: 0.6,
                    color: "text.disabled",
                    letterSpacing: "0.02em",
                  },
                  "& .Mui-selected": {
                    color: "text.primary !important",
                    fontWeight: 600,
                  },
                  "& .MuiTabs-indicator": {
                    height: 1.5,
                    bgcolor: "text.primary",
                  },
                }}
              >
                <Tab
                  icon={<GridOn sx={{ fontSize: 14 }} />}
                  iconPosition="start"
                  label="Posts"
                />
                {isOwnProfile && (
                  <Tab
                    icon={<BookmarkBorder sx={{ fontSize: 14 }} />}
                    iconPosition="start"
                    label="Saved"
                    disabled={!isOwnProfile}
                  />
                )}
              </Tabs>
            </Box>

            {/* ── Posts Tab ── */}
            <TabPanel value={tabValue} index={0}>
              {fetchingPosts ? (
                <Grid container spacing={0.5} sx={{ p: { xs: 0.5, sm: 1 } }}>
                  {[...Array(9)].map((_, i) => (
                    <Grid item xs={4} key={i}>
                      <MuiSkeleton
                        variant="rectangular"
                        sx={{ paddingBottom: "100%", borderRadius: "8px" }}
                      />
                    </Grid>
                  ))}
                </Grid>
              ) : !canViewPosts ? (
                <Box sx={{ bgcolor: "background.paper" }}>
                  <EmptyState
                    icon={
                      <Lock sx={{ fontSize: 22, color: "text.disabled" }} />
                    }
                    title="This account is private"
                    subtitle="Follow to see their photos and videos"
                  />
                </Box>
              ) : posts.length === 0 ? (
                <Box sx={{ bgcolor: "background.paper" }}>
                  <EmptyState
                    icon={
                      <PhotoCamera
                        sx={{ fontSize: 22, color: "text.disabled" }}
                      />
                    }
                    title="No posts yet"
                    subtitle={
                      isOwnProfile
                        ? "Share your first photo or video"
                        : "Nothing here yet"
                    }
                    action={
                      isOwnProfile ? (
                        <Button
                          variant="contained"
                          size="small"
                          disableElevation
                          onClick={() => setModalOpen(true)}
                          sx={{
                            textTransform: "none",
                            fontWeight: 600,
                            borderRadius: "8px",
                            px: 3,
                            fontSize: "0.82rem",
                            bgcolor: "text.primary",
                            color: "background.default",
                            "&:hover": {
                              opacity: 0.85,
                              bgcolor: "text.primary",
                            },
                          }}
                        >
                          Create your first post
                        </Button>
                      ) : undefined
                    }
                  />
                </Box>
              ) : (
                <Grid container spacing={0.5} sx={{ p: { xs: 0.5, sm: 1 } }}>
                  {posts.map((post, index) => (
                    <Grid item xs={4} key={post.id}>
                      <PostCard
                        post={post}
                        username={profileData?.username}
                        index={index}
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
                <Grid container spacing={0.5} sx={{ p: { xs: 0.5, sm: 1 } }}>
                  {[...Array(6)].map((_, i) => (
                    <Grid item xs={4} key={i}>
                      <MuiSkeleton
                        variant="rectangular"
                        sx={{ paddingBottom: "100%", borderRadius: "8px" }}
                      />
                    </Grid>
                  ))}
                </Grid>
              ) : savedPosts.length === 0 ? (
                <Box sx={{ bgcolor: "background.paper" }}>
                  <EmptyState
                    icon={
                      <BookmarkBorder
                        sx={{ fontSize: 22, color: "text.disabled" }}
                      />
                    }
                    title="Nothing saved yet"
                    subtitle="Posts you save will appear here"
                  />
                </Box>
              ) : (
                <Grid container spacing={0.5} sx={{ p: { xs: 0.5, sm: 1 } }}>
                  {savedPosts.map((post, index) => (
                    <Grid item xs={4} key={post.id}>
                      <PostCard
                        post={post}
                        index={index}
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
        </Fade>
      </Container>

      {/* ── Back-to-top FAB ── */}
      <Fade in={scrolled}>
        <IconButton
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          sx={{
            position: "fixed",
            bottom: 24,
            right: 20,
            width: 40,
            height: 40,
            bgcolor: "text.primary",
            color: "background.default",
            border: "none",
            zIndex: 50,
            "&:hover": { opacity: 0.85, bgcolor: "text.primary" },
            transition: "all 0.2s ease",
          }}
        >
          <ArrowUpward sx={{ fontSize: 17 }} />
        </IconButton>
      </Fade>

      {/* ── Snackbar ── */}
      <Snackbar
        open={showCopiedSnackbar}
        autoHideDuration={2000}
        onClose={() => setShowCopiedSnackbar(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="success"
          variant="filled"
          icon={<CheckCircle />}
          sx={{ borderRadius: "8px", fontWeight: 500 }}
        >
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

      <CreatePostModal
        open={modalOpen}
        handleClose={() => setModalOpen(false)}
      />
    </Box>
  );
};

export default ProfilePage;
