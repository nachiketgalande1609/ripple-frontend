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
import {
  getProfile,
  getUserPosts,
  followUser,
  cancelFollowRequest,
  getSavedPosts,
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
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`profile-tabpanel-${index}`}
    aria-labelledby={`profile-tab-${index}`}
    {...other}
  >
    {value === index && (
      <Box sx={{ pt: 1.5 }}>
        <Fade in timeout={300}>
          <div>{children}</div>
        </Fade>
      </Box>
    )}
  </div>
);

/* ─── Stat Box ─────────────────────────────────────────────── */
const StatBox = ({
  value,
  label,
  onClick,
}: {
  value: number;
  label: string;
  onClick?: () => void;
}) => (
  <Box
    onClick={onClick}
    sx={{
      textAlign: "center",
      px: { xs: 1, sm: 2 },
      py: 0.75,
      borderRadius: 1.5,
      cursor: onClick ? "pointer" : "default",
      transition: "background 0.15s",
      "&:hover": onClick
        ? { bgcolor: (theme) => alpha(theme.palette.primary.main, 0.07) }
        : {},
    }}
  >
    <Typography
      variant="subtitle1"
      sx={{
        fontWeight: 800,
        fontSize: { xs: "0.95rem", sm: "1.05rem" },
        lineHeight: 1.1,
        letterSpacing: "-0.3px",
      }}
    >
      {value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
    </Typography>
    <Typography
      variant="caption"
      sx={{
        color: "text.secondary",
        fontWeight: 500,
        textTransform: "uppercase",
        letterSpacing: "0.07em",
        fontSize: "0.6rem",
        display: "block",
      }}
    >
      {label}
    </Typography>
  </Box>
);

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
  <Zoom in timeout={120} style={{ transitionDelay: `${(index % 9) * 30}ms` }}>
    <Card
      onClick={onClick}
      sx={{
        position: "relative",
        cursor: "pointer",
        aspectRatio: "1",
        overflow: "hidden",
        borderRadius: 1,
        boxShadow: "none",
        border: "1px solid",
        borderColor: "divider",
        transition: "transform 0.2s cubic-bezier(.34,1.56,.64,1), box-shadow 0.2s ease",
        "&:hover": {
          transform: "scale(1.03)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          "& .post-overlay": { opacity: 1 },
        },
      }}
    >
      {!imageError ? (
        <CardMedia
          component="img"
          image={post.file_url}
          alt={`Post by ${username}`}
          sx={{ height: "100%", objectFit: "cover" }}
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
          background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.15) 55%, transparent 100%)",
          opacity: 0,
          transition: "opacity 0.2s ease",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          pb: 1,
          gap: 1.5,
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

  const currentUser = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user") || "")
    : {};

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
              ? { ...prev, is_following: true, is_request_active: true, followers_count: prev.followers_count + 1 }
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
              ? { ...prev, is_following: false, is_request_active: false, followers_count: prev.followers_count - 1 }
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  /* ── Loading skeleton ── */
  if (fetchingProfile) {
    return (
      <Box sx={{ width: "100%", minHeight: "100vh", bgcolor: "background.default" }}>
        <LinearProgress sx={{ height: 2 }} />
        <Container maxWidth="md" sx={{ py: 3 }}>
          <Stack spacing={2.5}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2.5} alignItems={{ xs: "center", sm: "flex-start" }}>
              <MuiSkeleton variant="circular" width={80} height={80} />
              <Box sx={{ flex: 1, width: "100%" }}>
                <MuiSkeleton variant="text" width="45%" height={28} />
                <MuiSkeleton variant="text" width="25%" height={18} sx={{ mt: 0.5 }} />
                <Box sx={{ mt: 1.5, display: "flex", gap: 1 }}>
                  {[1, 2, 3].map((i) => (
                    <Box key={i} sx={{ flex: 1 }}>
                      <MuiSkeleton variant="rectangular" height={36} sx={{ borderRadius: 1.5 }} />
                    </Box>
                  ))}
                </Box>
              </Box>
            </Stack>
            <Grid container spacing={1}>
              {[...Array(9)].map((_, i) => (
                <Grid item xs={4} key={i}>
                  <MuiSkeleton variant="rectangular" sx={{ paddingBottom: "100%", borderRadius: 1 }} />
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
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh", pb: 4 }}>
      <Container maxWidth="md" sx={{ pt: { xs: 1.5, sm: 2.5 } }}>

        {/* ── Profile Card ── */}
        <Fade in timeout={350}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2.5,
              border: "1px solid",
              borderColor: "divider",
              overflow: "hidden",
              mb: 1.5,
            }}
          >
            {/* Decorative header strip — slimmer */}
            <Box
              sx={{
                height: { xs: 48, sm: 60 },
                background: (theme) =>
                  theme.palette.mode === "dark"
                    ? "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)"
                    : "linear-gradient(135deg, #f0f4ff 0%, #e8eeff 50%, #dde6ff 100%)",
                position: "relative",
              }}
            >
              <Stack
                direction="row"
                spacing={0.5}
                sx={{ position: "absolute", top: 6, right: 8 }}
              >
                {!isOwnProfile && currentUser?.id && (
                  <Tooltip title="Send message">
                    <IconButton
                      onClick={() => navigate(`/messages/${userId}`, { state: profileData })}
                      size="small"
                      sx={{
                        bgcolor: (theme) => alpha(theme.palette.background.paper, 0.85),
                        backdropFilter: "blur(8px)",
                        width: 28,
                        height: 28,
                        "&:hover": { bgcolor: "background.paper" },
                      }}
                    >
                      <Message sx={{ fontSize: 15 }} />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title="More options">
                  <IconButton
                    onClick={() => setOpenDialog(true)}
                    size="small"
                    sx={{ width: 28, height: 28 }}
                  >
                    <MoreHoriz sx={{ fontSize: 15 }} />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>

            {/* Avatar + info */}
            <Box sx={{ px: { xs: 2, sm: 3 }, pb: 2 }}>
              {/* Avatar row */}
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="flex-end"
                sx={{ mt: "-34px", mb: 1 }}
              >
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                  badgeContent={
                    profileData?.is_verified ? (
                      <Verified
                        sx={{
                          fontSize: 17,
                          color: "#1DA1F2",
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
                      width: { xs: 66, sm: 78 },
                      height: { xs: 66, sm: 78 },
                      border: "2.5px solid",
                      borderColor: "background.paper",
                      boxShadow: "0 3px 12px rgba(0,0,0,0.12)",
                      fontSize: "1.6rem",
                    }}
                  />
                </Badge>

                <Stack direction="row" spacing={0.75} sx={{ mb: 0.25 }}>
                  {!isOwnProfile && currentUser?.id && (
                    <FollowButton
                      isFollowing={isFollowing}
                      profileData={profileData}
                      followButtonLoading={followButtonLoading}
                      handleFollow={handleFollow}
                      handleCancelRequest={handleCancelRequest}
                    />
                  )}
                </Stack>
              </Stack>

              {/* Username */}
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: "1rem", sm: "1.1rem" },
                  letterSpacing: "-0.2px",
                  lineHeight: 1.2,
                }}
              >
                {profileData?.username}
              </Typography>

              {/* Bio */}
              {profileData?.bio && (
                <Typography
                  variant="body2"
                  sx={{
                    mt: 0.5,
                    color: "text.primary",
                    whiteSpace: "pre-line",
                    lineHeight: 1.5,
                    maxWidth: 460,
                    fontSize: "0.82rem",
                  }}
                >
                  {profileData.bio}
                </Typography>
              )}

              {/* Meta info — tighter */}
              {(profileData?.location || profileData?.website || profileData?.created_at) && (
                <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 0.75 }}>
                  {profileData?.location && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
                      📍 {profileData.location}
                    </Typography>
                  )}
                  {profileData?.website && (
                    <Typography
                      variant="caption"
                      component="a"
                      href={profileData.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.4,
                        color: "primary.main",
                        textDecoration: "none",
                        fontWeight: 600,
                        "&:hover": { textDecoration: "underline" },
                      }}
                    >
                      <LinkIcon sx={{ fontSize: 11 }} />
                      {profileData.website.replace(/^https?:\/\//, "")}
                    </Typography>
                  )}
                  {profileData?.created_at && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
                      <CalendarToday sx={{ fontSize: 11 }} />
                      Joined {formatDate(profileData.created_at)}
                    </Typography>
                  )}
                </Stack>
              )}

              {/* Stats — inline, compact */}
              <Box
                sx={{
                  mt: 1.5,
                  display: "flex",
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <StatBox value={profileData?.posts_count || 0} label="Posts" />
                </Box>
                <Box sx={{ flex: 1 }}>
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
          </Paper>
        </Fade>

        {/* ── Tabs ── */}
        <Box sx={{ mb: 0 }}>
          <Tabs
            value={tabValue}
            onChange={(_, v) => setTabValue(v)}
            variant={isMobile ? "fullWidth" : "standard"}
            centered={!isMobile}
            sx={{
              borderBottom: "1px solid",
              borderColor: "divider",
              minHeight: 38,
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 600,
                fontSize: { xs: "0.73rem", sm: "0.8rem" },
                minHeight: 38,
                minWidth: "auto",
                px: { xs: 1.5, sm: 2.5 },
                gap: 0.5,
                color: "text.secondary",
                letterSpacing: "0.02em",
              },
              "& .Mui-selected": { color: "text.primary !important" },
              "& .MuiTabs-indicator": { height: 2, borderRadius: "2px 2px 0 0" },
            }}
          >
            <Tab icon={<GridOn sx={{ fontSize: 14 }} />} iconPosition="start" label="Posts" />
            <Tab
              icon={<BookmarkBorder sx={{ fontSize: 14 }} />}
              iconPosition="start"
              label="Saved"
              disabled={!isOwnProfile}
            />
          </Tabs>
        </Box>

        {/* ── Posts Tab ── */}
        <TabPanel value={tabValue} index={0}>
          {fetchingPosts ? (
            <Grid container spacing={1}>
              {[...Array(9)].map((_, i) => (
                <Grid item xs={4} key={i}>
                  <MuiSkeleton variant="rectangular" sx={{ paddingBottom: "100%", borderRadius: 1 }} />
                </Grid>
              ))}
            </Grid>
          ) : !canViewPosts ? (
            <Box sx={{ textAlign: "center", py: { xs: 6, sm: 8 }, px: 3 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  bgcolor: (theme) => alpha(theme.palette.text.primary, 0.06),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mx: "auto",
                  mb: 1.5,
                }}
              >
                <Lock sx={{ fontSize: 24, color: "text.disabled" }} />
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.25 }}>
                This account is private
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Follow to see their photos and videos
              </Typography>
            </Box>
          ) : posts.length === 0 ? (
            <Box sx={{ textAlign: "center", py: { xs: 6, sm: 8 } }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  bgcolor: (theme) => alpha(theme.palette.text.primary, 0.06),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mx: "auto",
                  mb: 1.5,
                }}
              >
                <PhotoCamera sx={{ fontSize: 24, color: "text.disabled" }} />
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.25 }}>
                No posts yet
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 2 }}>
                {isOwnProfile ? "Share your first photo or video" : "Nothing here yet"}
              </Typography>
              {isOwnProfile && (
                <Button
                  variant="contained"
                  size="small"
                  disableElevation
                  onClick={() => navigate("/create")}
                  sx={{ textTransform: "none", fontWeight: 700, borderRadius: 1.5, px: 2.5, fontSize: "0.78rem" }}
                >
                  Create post
                </Button>
              )}
            </Box>
          ) : (
            <Grid container spacing={1}>
              {posts.map((post, index) => (
                <Grid item xs={4} key={post.id}>
                  <PostCard
                    post={post}
                    username={profileData?.username}
                    index={index}
                    onClick={() => setSelectedPost(post)}
                    imageError={!!imageErrors[post.id]}
                    onImageError={() => setImageErrors((prev) => ({ ...prev, [post.id]: true }))}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        {/* ── Saved Tab ── */}
        <TabPanel value={tabValue} index={1}>
          {fetchingSavedPosts ? (
            <Grid container spacing={1}>
              {[...Array(6)].map((_, i) => (
                <Grid item xs={4} key={i}>
                  <MuiSkeleton variant="rectangular" sx={{ paddingBottom: "100%", borderRadius: 1 }} />
                </Grid>
              ))}
            </Grid>
          ) : savedPosts.length === 0 ? (
            <Box sx={{ textAlign: "center", py: { xs: 6, sm: 8 } }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  bgcolor: (theme) => alpha(theme.palette.text.primary, 0.06),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mx: "auto",
                  mb: 1.5,
                }}
              >
                <BookmarkBorder sx={{ fontSize: 24, color: "text.disabled" }} />
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.25 }}>
                No saved posts
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Posts you save will appear here
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={1}>
              {savedPosts.map((post, index) => (
                <Grid item xs={4} key={post.id}>
                  <PostCard
                    post={post}
                    index={index}
                    onClick={() => setSelectedPost(post)}
                    imageError={!!imageErrors[post.id]}
                    onImageError={() => setImageErrors((prev) => ({ ...prev, [post.id]: true }))}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>
      </Container>

      {/* ── Post Modal ── */}
      <Dialog
        open={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2.5,
            maxWidth: "min(92vw, 980px)",
            maxHeight: "92vh",
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
            handleCloseModal={() => setSelectedPost(null)}
          />
        )}
      </Dialog>

      {/* ── Snackbar ── */}
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
  );
};

export default ProfilePage;