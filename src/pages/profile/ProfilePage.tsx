import { useState, useEffect, useRef, useCallback } from "react";
import {
    Typography,
    Avatar,
    Button,
    IconButton,
    Box,
    Stack,
    Fade,
    Skeleton as MuiSkeleton,
    CircularProgress,
    useTheme,
} from "@mui/material";
import { ACCENT_COLOR } from "../../theme";

const ACCENT = ACCENT_COLOR;
const PROFILE_POSTS_PER_PAGE = 9;

import { getProfile, getUserPosts, followUser, cancelFollowRequest, getSavedPosts, unfollowUser } from "../../services/api";
import EndOfFeed from "../../component/EndOfFeed";
import {
    Lock,
    Message,
    GridOn,
    Favorite,
    Comment,
    Verified,
    CalendarToday,
    Link as LinkIcon,
    BookmarkBorder,
    PhotoCamera,
    MoreHoriz,
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

/* ─── Stat Column ─────────────────────────────────────────────── */
const StatCol = ({ value, label, onClick }: { value: number; label: string; onClick?: () => void }) => {
    const fmt = value >= 1_000_000 ? `${(value / 1_000_000).toFixed(1)}M` : value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value;
    return (
        <Box
            onClick={onClick}
            sx={{
                textAlign: "center",
                flex: 1,
                py: 1.25,
                cursor: onClick ? "pointer" : "default",
                borderRadius: "10px",
                transition: "background 0.15s",
                "&:hover": onClick ? { background: (t: any) => t.palette.action.hover } : {},
            }}
        >
            <Typography sx={{ fontWeight: 700, fontSize: "1.15rem", lineHeight: 1, color: (t: any) => t.palette.text.primary }}>{fmt}</Typography>
            <Typography
                sx={{
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.09em",
                    color: (t: any) => t.palette.text.disabled,
                    mt: 0.4,
                    display: "block",
                }}
            >
                {label}
            </Typography>
        </Box>
    );
};

/* ─── Post Card ─────────────────────────────────────────────────
   Uses CSS class selectors so hover works without re-renders.    */
const postCardCss = `
.pc { position:relative; aspect-ratio:1; overflow:hidden; cursor:pointer; background:rgba(255,255,255,0.04); }
.pc .pi { width:100%; height:100%; object-fit:cover; transition:transform 0.35s ease; display:block; }
.pc .ovl { position:absolute; inset:0; opacity:0; transition:opacity 0.22s ease;
  background:linear-gradient(135deg,rgba(124,92,252,0.45) 0%,rgba(0,0,0,0.55) 100%);
  display:flex; align-items:center; justify-content:center; gap:16px; }
.pc:hover .ovl { opacity:1; }
.pc:hover .pi { transform:scale(1.06); }
.med { display:flex; align-items:center; gap:4px; }
`;

const PostCard = ({
    post,
    username,
    onClick,
    imageError,
    onImageError,
}: {
    post: any;
    username?: string;
    onClick: () => void;
    imageError: boolean;
    onImageError: () => void;
}) => {
    const isVideo = post.file_url && /\.(mp4|mov|webm)$/i.test(post.file_url);
    return (
        <div className="pc" onClick={onClick}>
            {isVideo ? (
                <VideoThumbnail src={post.file_url} />
            ) : !imageError ? (
                <img className="pi" src={post.file_url} alt={username} onError={onImageError} />
            ) : (
                <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <PhotoCamera sx={{ fontSize: 20, color: "rgba(255,255,255,0.2)" }} />
                </Box>
            )}
            <div className="ovl">
                <div className="med">
                    <Favorite sx={{ color: "#fff", fontSize: 14 }} />
                    <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.7rem" }}>{post.likes_count || 0}</Typography>
                </div>
                <div className="med">
                    <Comment sx={{ color: "#fff", fontSize: 14 }} />
                    <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.7rem" }}>{post.comments_count || 0}</Typography>
                </div>
            </div>
        </div>
    );
};

/* ─── Post Grid (masonry) ────────────────────────────────────── */
const masonryCss = `
.masonry { columns: 2; column-gap: 8px; padding: 8px; padding-top: 0; }
.masonry-item { break-inside: avoid; margin-bottom: 8px; border-radius: 14px; overflow: hidden; cursor: pointer; position: relative; }
.masonry-item img, .masonry-item video { width: 100%; display: block; }
.masonry-item .ovl { position:absolute; inset:0; opacity:0; transition:opacity 0.22s ease;
  background:linear-gradient(135deg,rgba(124,92,252,0.45) 0%,rgba(0,0,0,0.55) 100%);
  display:flex; align-items:center; justify-content:center; gap:16px; border-radius:14px; }
.masonry-item:hover .ovl { opacity:1; }
.masonry-item img { transition: transform 0.35s ease; }
.masonry-item:hover img { transform: scale(1.04); }
`;

const PostGrid = ({ posts, username, imageErrors, onImageError, onPostClick }: {
    posts: any[];
    username?: string;
    imageErrors: Record<string, boolean>;
    onImageError: (id: string) => void;
    onPostClick: (id: number) => void;
}) => (
    <>
        <style>{masonryCss}</style>
        <div className="masonry">
            {posts.map((post) => {
                const isVideo = post.file_url && /\.(mp4|mov|webm)$/i.test(post.file_url);
                return (
                    <div key={post.id} className="masonry-item" onClick={() => onPostClick(post.id)}>
                        {isVideo ? (
                            <video src={post.file_url} muted playsInline style={{ borderRadius: 14 }} />
                        ) : !imageErrors[post.id] ? (
                            <img src={post.file_url} alt={username} onError={() => onImageError(post.id)} />
                        ) : (
                            <Box sx={{ aspectRatio: "1", bgcolor: "action.hover", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <PhotoCamera sx={{ fontSize: 20, color: "rgba(255,255,255,0.2)" }} />
                            </Box>
                        )}
                        <div className="ovl">
                            <div className="med">
                                <Favorite sx={{ color: "#fff", fontSize: 14 }} />
                                <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.7rem" }}>{post.likes_count || 0}</Typography>
                            </div>
                            <div className="med">
                                <Comment sx={{ color: "#fff", fontSize: 14 }} />
                                <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.7rem" }}>{post.comments_count || 0}</Typography>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    </>
);

/* ─── Grid Skeleton ──────────────────────────────────────────── */
const GridSkeleton = ({ count = 6 }: { count?: number }) => (
    <>
        <style>{masonryCss}</style>
        <div className="masonry">
            {[...Array(count)].map((_, i) => (
                <div key={i} className="masonry-item">
                    <MuiSkeleton
                        variant="rectangular"
                        sx={{ width: "100%", height: i % 3 === 0 ? 220 : i % 3 === 1 ? 160 : 280, bgcolor: (t: any) => t.palette.action.selected }}
                    />
                </div>
            ))}
        </div>
    </>
);

/* ─── Empty / Private State ──────────────────────────────────── */
const EmptyState = ({ icon, title, subtitle, action }: { icon: React.ReactNode; title: string; subtitle: string; action?: React.ReactNode }) => (
    <Box sx={{ textAlign: "center", py: 10 }}>
        <Box
            sx={{
                width: 54,
                height: 54,
                borderRadius: "50%",
                background: `rgba(124,92,252,0.1)`,
                border: `1px solid rgba(124,92,252,0.2)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 2,
            }}
        >
            {icon}
        </Box>
        <Typography sx={{ fontWeight: 600, fontSize: "0.95rem", mb: 0.5, color: (t: any) => t.palette.text.primary }}>{title}</Typography>
        <Typography sx={{ color: (t: any) => t.palette.text.disabled, fontSize: "0.8rem" }}>{subtitle}</Typography>
        {action && <Box sx={{ mt: 2.5 }}>{action}</Box>}
    </Box>
);

/* ─── Profile Page ───────────────────────────────────────────── */
const ProfilePage = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { postUploading } = useGlobalStore();
    const theme = useTheme();

    const currentUser = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") || "null") : {};

    const [profileData, setProfileData] = useState<Profile | null>(null);
    const [posts, setPosts] = useState<any[]>([]);
    const [isFollowing, setIsFollowing] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [fetchingProfile, setFetchingProfile] = useState(false);
    const [fetchingPosts, setFetchingPosts] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const offsetRef = useRef(0);
    const fetchingRef = useRef(false);
    const hasMoreRef = useRef(true);
    const [followButtonLoading, setFollowButtonLoading] = useState(false);
    const [tabValue, setTabValue] = useState(0);
    const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
    const [savedPosts, setSavedPosts] = useState<any[]>([]);
    const [fetchingSavedPosts, setFetchingSavedPosts] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);

    const isOwnProfile = currentUser?.id == userId;

    useEffect(() => {
        const id = 'profile-post-card-styles';
        if (document.getElementById(id)) return;
        const el = document.createElement('style');
        el.id = id;
        el.textContent = postCardCss;
        document.head.appendChild(el);
    }, []);

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
        } catch (e) {
            console.error(e);
        } finally {
            setFetchingSavedPosts(false);
        }
    };

    useEffect(() => {
        if (tabValue === 1 && isOwnProfile && savedPosts.length === 0) fetchSavedPosts();
    }, [tabValue, isOwnProfile]);

    async function fetchProfile() {
        try {
            setFetchingProfile(true);
            if (userId) {
                const res = await getProfile(userId);
                setProfileData(res.data);
                setIsFollowing(res.data.is_following);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setFetchingProfile(false);
        }
    }

    const fetchUserPosts = useCallback(
        async (reset = false) => {
            if (fetchingRef.current) return;
            if (!reset && !hasMoreRef.current) return;
            fetchingRef.current = true;

            const offset = reset ? 0 : offsetRef.current;
            if (offset === 0) setFetchingPosts(true);
            else setLoadingMore(true);

            try {
                if (userId) {
                    const res = await getUserPosts(userId, offset, PROFILE_POSTS_PER_PAGE);
                    const newPosts: any[] = res.data ?? [];
                    setPosts((prev) => (reset ? newPosts : [...prev, ...newPosts]));
                    hasMoreRef.current = res.hasMore ?? false;
                    setHasMore(res.hasMore ?? false);
                    offsetRef.current = offset + newPosts.length;
                }
            } catch (e) {
                console.error(e);
            } finally {
                setFetchingPosts(false);
                setLoadingMore(false);
                fetchingRef.current = false;
                requestAnimationFrame(() => {
                    if (hasMoreRef.current && !fetchingRef.current) {
                        const nearBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 400;
                        if (nearBottom) fetchUserPosts();
                    }
                });
            }
        },
        [userId],
    );

    useEffect(() => {
        fetchProfile();
        offsetRef.current = 0;
        hasMoreRef.current = true;
        setHasMore(true);
        fetchUserPosts(true);
    }, [userId]);

    useEffect(() => {
        const onScroll = () => {
            if (fetchingRef.current || !hasMoreRef.current || tabValue !== 0) return;
            const nearBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 400;
            if (nearBottom) fetchUserPosts();
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, [fetchUserPosts, tabValue]);

    useEffect(() => {
        const canView = profileData && (isOwnProfile || !profileData.is_private || profileData.is_following);
        if (!postUploading && canView) {
            offsetRef.current = 0;
            hasMoreRef.current = true;
            setHasMore(true);
            fetchUserPosts(true);
        }
    }, [postUploading, userId, currentUser?.id]);

    const handleFollow = async () => {
        if (!currentUser?.id || !userId) return;
        setFollowButtonLoading(true);
        try {
            const res = await followUser(currentUser.id.toString(), userId);
            if (res?.success) {
                setIsFollowing(true);
                setProfileData((p) => p ? { ...p, is_following: true, is_request_active: true, followers_count: p.followers_count + 1 } : p);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setFollowButtonLoading(false);
        }
    };

    const handleCancelRequest = async () => {
        if (!currentUser?.id || !userId) return;
        setFollowButtonLoading(true);
        try {
            const res = await cancelFollowRequest(currentUser.id, userId);
            if (res?.success) {
                setIsFollowing(false);
                setProfileData((p) => p ? { ...p, is_following: false, is_request_active: false, followers_count: p.followers_count - 1 } : p);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setFollowButtonLoading(false);
        }
    };

    const handleUnfollow = async () => {
        if (!currentUser?.id || !userId) return;
        setFollowButtonLoading(true);
        try {
            const res = await unfollowUser(currentUser.id.toString(), userId);
            if (res?.success) {
                setIsFollowing(false);
                setProfileData((p) => p ? { ...p, is_following: false, is_request_active: false, followers_count: p.followers_count - 1 } : p);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setFollowButtonLoading(false);
        }
    };

    const formatDate = (d?: string) =>
        d ? new Date(d).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "";

    /* ── Loading skeleton ── */
    if (fetchingProfile) {
        return (
            <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
                {/* skeleton top bar */}
                <Box sx={{ height: 50, borderBottom: "1px solid", borderColor: (t) => t.palette.divider }} />
                {/* skeleton banner */}
                <MuiSkeleton variant="rectangular" height={130} sx={{ bgcolor: (t) => t.palette.action.selected }} />
                <Box sx={{ maxWidth: 600, mx: "auto", px: { xs: 2, sm: 3 } }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mt: -4.5 }}>
                        <MuiSkeleton variant="circular" width={88} height={88} sx={{ bgcolor: (t) => t.palette.action.selected, border: "3px solid", borderColor: "background.default" }} />
                        <MuiSkeleton variant="rounded" width={96} height={32} sx={{ bgcolor: (t) => t.palette.action.selected, borderRadius: "8px" }} />
                    </Stack>
                    <MuiSkeleton variant="text" width="45%" height={22} sx={{ mt: 1.5, bgcolor: (t) => t.palette.action.selected }} />
                    <MuiSkeleton variant="text" width="65%" height={14} sx={{ mt: 0.5, bgcolor: (t) => t.palette.action.hover }} />
                    <MuiSkeleton variant="rounded" height={58} sx={{ mt: 2, borderRadius: "14px", bgcolor: (t) => t.palette.action.hover }} />
                </Box>
                <Box sx={{ maxWidth: 600, mx: "auto", mt: 1.5 }}>
                    <GridSkeleton />
                </Box>
            </Box>
        );
    }

    const canViewPosts = profileData && (isOwnProfile || !profileData.is_private || profileData.is_following);

    return (
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh", pb: 8 }}>
            {/* ── Sticky Top Bar ── */}
            <Box
                sx={{
                    position: "sticky",
                    top: 0,
                    zIndex: 100,
                    height: 50,
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(13,13,21,0.85)' : 'rgba(255,255,255,0.85)',
                    borderBottom: scrolled ? `1px solid ${theme.palette.divider}` : "1px solid transparent",
                    transition: "border-color 0.25s",
                    px: { xs: 1.5, sm: 2 },
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                }}
            >
                <IconButton size="small" onClick={() => navigate(-1)} sx={{ color: (t) => t.palette.text.secondary, "&:hover": { color: (t) => t.palette.text.primary } }}>
                    <ArrowBack sx={{ fontSize: 20 }} />
                </IconButton>

                <Fade in={scrolled}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1, minWidth: 0 }}>
                        <Avatar src={profileData?.profile_picture || BlankProfileImage} sx={{ width: 26, height: 26 }} />
                        <Typography
                            sx={{
                                fontWeight: 600,
                                fontSize: "0.9rem",
                                color: (t) => t.palette.text.primary,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {profileData?.username}
                        </Typography>
                        {profileData?.is_verified && <Verified sx={{ fontSize: 13, color: "#1d9bf0", flexShrink: 0 }} />}
                    </Stack>
                </Fade>

                <Box sx={{ flex: scrolled ? "none" : 1 }} />

                <IconButton
                    size="small"
                    onClick={() => setOpenDialog(true)}
                    sx={{ color: (t) => t.palette.text.disabled, "&:hover": { color: (t) => t.palette.text.secondary } }}
                >
                    <MoreHoriz sx={{ fontSize: 20 }} />
                </IconButton>
            </Box>

            {/* ── Banner ── */}
            <Box
                sx={{
                    height: 130,
                    position: "relative",
                    background: `linear-gradient(160deg, ${ACCENT}28 0%, rgba(40,15,90,0.22) 55%, transparent 100%)`,
                    "&::after": {
                        content: '""',
                        position: "absolute",
                        inset: 0,
                        background: `radial-gradient(ellipse 60% 120% at 20% 50%, ${ACCENT}14 0%, transparent 70%)`,
                    },
                    overflow: "hidden",
                }}
            />

            {/* ── Profile content ── */}
            <Box sx={{ maxWidth: 600, mx: "auto", px: { xs: 2, sm: 3 } }}>
                {/* Avatar + action buttons row (avatar overlaps banner) */}
                <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mt: -5.5 }}>
                    {/* Gradient ring around avatar */}
                    <Box
                        sx={{
                            borderRadius: "50%",
                            background: `linear-gradient(135deg, ${ACCENT} 0%, #b06aff 100%)`,
                            padding: "2.5px",
                            flexShrink: 0,
                        }}
                    >
                        <Avatar
                            src={profileData?.profile_picture || BlankProfileImage}
                            sx={{
                                width: { xs: 82, sm: 92 },
                                height: { xs: 82, sm: 92 },
                                border: "3px solid",
                                borderColor: "background.default",
                                fontSize: "1.8rem",
                            }}
                        />
                    </Box>

                    {/* Action buttons */}
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ pb: 0.5 }}>
                        {!isOwnProfile && currentUser?.id && (
                            <>
                                <IconButton
                                    size="small"
                                    onClick={() => navigate(`/messages/${userId}`, { state: profileData })}
                                    sx={{
                                        border: "1px solid",
                                        borderColor: (t) => t.palette.divider,
                                        borderRadius: "9px",
                                        width: 34,
                                        height: 34,
                                        color: (t) => t.palette.text.secondary,
                                        "&:hover": { borderColor: (t) => t.palette.text.secondary, color: (t) => t.palette.text.primary, bgcolor: (t) => t.palette.action.hover },
                                    }}
                                >
                                    <Message sx={{ fontSize: 17 }} />
                                </IconButton>
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
                                onClick={() => navigate(`/settings?setting=profiledetails`)}
                                sx={{
                                    textTransform: "none",
                                    fontWeight: 500,
                                    borderRadius: "9px",
                                    fontSize: "0.8rem",
                                    px: 2.25,
                                    py: 0.75,
                                    borderColor: (t) => t.palette.divider,
                                    color: (t) => t.palette.text.secondary,
                                    "&:hover": { borderColor: (t) => t.palette.text.primary, bgcolor: (t) => t.palette.action.hover, color: (t) => t.palette.text.primary },
                                }}
                            >
                                Edit profile
                            </Button>
                        )}
                    </Stack>
                </Stack>

                {/* Name + verified */}
                <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 1.75 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: { xs: "1.05rem", sm: "1.15rem" }, color: (t) => t.palette.text.primary }}>
                        {profileData?.username}
                    </Typography>
                    {profileData?.is_verified && <Verified sx={{ fontSize: 15, color: "#1d9bf0" }} />}
                </Stack>

                {/* Bio */}
                {profileData?.bio ? (
                    <Typography
                        sx={{
                            color: (t) => t.palette.text.secondary,
                            whiteSpace: "pre-line",
                            lineHeight: 1.65,
                            fontSize: "0.855rem",
                            mt: 0.6,
                        }}
                    >
                        {profileData.bio}
                    </Typography>
                ) : isOwnProfile ? (
                    <Typography
                        onClick={() => navigate(`/settings?setting=profiledetails`)}
                        sx={{
                            color: (t) => t.palette.text.disabled,
                            fontSize: "0.82rem",
                            mt: 0.6,
                            cursor: "pointer",
                            "&:hover": { color: (t) => t.palette.text.secondary },
                        }}
                    >
                        + Add a bio
                    </Typography>
                ) : null}

                {/* Meta chips */}
                {(profileData?.location || profileData?.website || profileData?.created_at) && (
                    <Stack direction="row" flexWrap="wrap" gap={1.25} sx={{ mt: 1.25 }}>
                        {profileData?.location && (
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                                <Typography sx={{ fontSize: "11px" }}>📍</Typography>
                                <Typography sx={{ color: (t) => t.palette.text.disabled, fontSize: "0.77rem" }}>{profileData.location}</Typography>
                            </Stack>
                        )}
                        {profileData?.website && (
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                                <LinkIcon sx={{ fontSize: 12, color: ACCENT }} />
                                <Typography
                                    component="a"
                                    href={profileData.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    sx={{
                                        color: ACCENT,
                                        fontSize: "0.77rem",
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
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                                <CalendarToday sx={{ fontSize: 11, color: (t) => t.palette.text.disabled }} />
                                <Typography sx={{ color: (t) => t.palette.text.disabled, fontSize: "0.77rem" }}>
                                    Joined {formatDate(profileData.created_at)}
                                </Typography>
                            </Stack>
                        )}
                    </Stack>
                )}

                {/* Stats pill */}
                <Stack
                    direction="row"
                    divider={<Box sx={{ width: "1px", bgcolor: (t) => t.palette.divider, my: 1 }} />}
                    sx={{
                        mt: 2,
                        background: (t) => t.palette.action.hover,
                        border: "1px solid",
                        borderColor: (t) => t.palette.divider,
                        borderRadius: "14px",
                        overflow: "hidden",
                    }}
                >
                    <StatCol value={profileData?.posts_count || 0} label="Posts" />
                    <StatCol
                        value={profileData?.followers_count || 0}
                        label="Followers"
                        onClick={() => navigate(`/profile/${userId}/followers`)}
                    />
                    <StatCol
                        value={profileData?.following_count || 0}
                        label="Following"
                        onClick={() => navigate(`/profile/${userId}/following`)}
                    />
                </Stack>
            </Box>

            {/* ── Tabs ── */}
            <Box
                sx={{
                    maxWidth: 600,
                    mx: "auto",
                    mt: 0.5,
                    mb: 0.5,
                    px: 2,
                    position: "sticky",
                    top: 50,
                    zIndex: 9,
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    py: 1.25,
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        gap: 1,
                        backgroundColor: (t) => t.palette.action.hover,
                        borderRadius: "12px",
                        p: 0.5,
                    }}
                >
                    {[
                        { label: "Posts", icon: <GridOn sx={{ fontSize: 15 }} /> },
                        ...(isOwnProfile ? [{ label: "Saved", icon: <BookmarkBorder sx={{ fontSize: 15 }} /> }] : []),
                    ].map((tab, i) => (
                        <Box
                            key={tab.label}
                            onClick={() => setTabValue(i)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setTabValue(i); }}
                            sx={{
                                flex: 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 0.75,
                                py: 0.875,
                                borderRadius: "9px",
                                cursor: "pointer",
                                transition: "all 0.18s ease",
                                backgroundColor: tabValue === i
                                    ? (t) => t.palette.background.paper
                                    : "transparent",
                                boxShadow: tabValue === i
                                    ? "0 1px 4px rgba(0,0,0,0.15)"
                                    : "none",
                                color: tabValue === i
                                    ? ACCENT_COLOR
                                    : (t) => t.palette.text.disabled,
                                "&:hover": {
                                    color: tabValue === i ? ACCENT_COLOR : (t) => t.palette.text.secondary,
                                },
                            }}
                        >
                            {tab.icon}
                            <Typography sx={{
                                fontSize: "0.82rem",
                                fontWeight: tabValue === i ? 600 : 500,
                                letterSpacing: "0.01em",
                                color: "inherit",
                            }}>
                                {tab.label}
                            </Typography>
                        </Box>
                    ))}
                </Box>
            </Box>

            {/* ── Posts Tab ── */}
            <Box sx={{ maxWidth: 600, mx: "auto" }} hidden={tabValue !== 0}>
                {tabValue === 0 && (
                    <Fade in timeout={250}>
                        <div>
                            {fetchingPosts ? (
                                <GridSkeleton />
                            ) : !canViewPosts ? (
                                <EmptyState
                                    icon={<Lock sx={{ fontSize: 22, color: ACCENT }} />}
                                    title="This account is private"
                                    subtitle="Follow to see their photos and videos"
                                />
                            ) : posts.length === 0 ? (
                                <EmptyState
                                    icon={<PhotoCamera sx={{ fontSize: 22, color: ACCENT }} />}
                                    title="No posts yet"
                                    subtitle={isOwnProfile ? "Share your first photo or video" : "Nothing here yet"}
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
                                                    borderRadius: "9px",
                                                    px: 3,
                                                    fontSize: "0.82rem",
                                                    bgcolor: ACCENT,
                                                    "&:hover": { opacity: 0.88, bgcolor: ACCENT },
                                                }}
                                            >
                                                Create your first post
                                            </Button>
                                        ) : undefined
                                    }
                                />
                            ) : (
                                <PostGrid
                                    posts={posts}
                                    username={profileData?.username}
                                    imageErrors={imageErrors}
                                    onImageError={(id) => setImageErrors((prev) => ({ ...prev, [id]: true }))}
                                    onPostClick={(id) => navigate(`/posts/${id}`)}
                                />
                            )}

                            {loadingMore && (
                                <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                                    <CircularProgress size={22} sx={{ color: ACCENT }} />
                                </Box>
                            )}

                            {!hasMore && posts.length > 0 && <EndOfFeed message="You've seen all posts" />}
                        </div>
                    </Fade>
                )}
            </Box>

            {/* ── Saved Tab ── */}
            {isOwnProfile && (
                <Box sx={{ maxWidth: 600, mx: "auto" }} hidden={tabValue !== 1}>
                    {tabValue === 1 && (
                        <Fade in timeout={250}>
                            <div>
                                {fetchingSavedPosts ? (
                                    <GridSkeleton count={6} />
                                ) : savedPosts.length === 0 ? (
                                    <EmptyState
                                        icon={<BookmarkBorder sx={{ fontSize: 22, color: ACCENT }} />}
                                        title="Nothing saved yet"
                                        subtitle="Posts you save will appear here"
                                    />
                                ) : (
                                    <PostGrid
                                        posts={savedPosts}
                                        imageErrors={imageErrors}
                                        onImageError={(id) => setImageErrors((prev) => ({ ...prev, [id]: true }))}
                                        onPostClick={(id) => navigate(`/posts/${id}`)}
                                    />
                                )}
                            </div>
                        </Fade>
                    )}
                </Box>
            )}

            {/* ── More Options ── */}
            <MoreOptionsDialog
                openDialog={openDialog}
                handleCloseDialog={() => setOpenDialog(false)}
                userId={userId}
                fetchProfile={fetchProfile}
                fetchUserPosts={() => fetchUserPosts(true)}
                isFollowing={profileData?.is_following}
            />

            <CreatePostModal open={modalOpen} handleClose={() => setModalOpen(false)} />
        </Box>
    );
};

export default ProfilePage;
