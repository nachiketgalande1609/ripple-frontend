import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from 'react-i18next';
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
    Tooltip,
    useTheme,
    useMediaQuery,
} from "@mui/material";
import { ACCENT_COLOR } from "../../theme";

const ACCENT = ACCENT_COLOR;
const PROFILE_POSTS_PER_PAGE = 9;

import { getProfile, getUserPosts, followUser, cancelFollowRequest, getSavedPosts, unfollowUser, getTaggedPosts, getBlockedUsers, recordProfileView, getUserReposts, getUserReels, getMutualFollowers, getPinnedPosts, pinPost, unpinPost, getHighlights, deleteHighlight, getUserStories } from "../../services/api";
import { usePageTitle } from "../../hooks/usePageTitle";
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
    PersonPin,
    RepeatRounded,
    SlowMotionVideoRounded,
    PushPin,
} from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import MoreOptionsDialog from "./MoreOptionsDialog";
import { useGlobalStore } from "../../store/store";
import FollowButton from "./FollowButton";
import BlankProfileImage from "../../static/profile_blank.png";
import CreatePostModal from "../../component/post/CreatePostModal";
import { formatLastSeen } from "../../utils/lastSeen";
import ShareProfileCardModal from "../../component/profile/ShareProfileCardModal";
import { type Highlight } from "../../component/stories/HighlightViewer";
import CreateHighlightModal from "../../component/stories/CreateHighlightModal";
import StoryDialog from "../../component/stories/StoryDialog";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import PremiumBadge from "../../component/premium/PremiumBadge";
import PremiumUpgradeModal from "../../component/premium/PremiumUpgradeModal";
import ProfileViewsModal from "../../component/premium/ProfileViewsModal";

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
    last_seen?: string | null;
    pronouns?: string;
    is_premium?: boolean;
    premium_expires_at?: string | null;
}

/* ─── Stat Column ─────────────────────────────────────────────── */
const StatCol = ({ value, label, onClick }: { value: number; label: string; onClick?: () => void }) => {
    const fmt = value >= 1_000_000 ? `${(value / 1_000_000).toFixed(1)}M` : value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value;
    return (
        <Box
            onClick={onClick}
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                flex: 1,
                cursor: onClick ? "pointer" : "default",
                gap: 0.25,
                "&:hover .stat-value": onClick ? { color: (t: any) => t.palette.text.primary } : {},
            }}
        >
            <Typography className="stat-value" sx={{ fontWeight: 700, fontSize: "1.1rem", lineHeight: 1.2, color: (t: any) => t.palette.text.primary, transition: "color 0.15s" }}>{fmt}</Typography>
            <Typography sx={{ fontSize: "0.72rem", fontWeight: 400, color: (t: any) => t.palette.text.disabled }}>
                {label}
            </Typography>
        </Box>
    );
};

/* ─── Pinned Posts Section ──────────────────────────────────── */
const pinnedCardCss = `
.pin-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding: 8px; padding-top: 0; }
.pin-card { position: relative; aspect-ratio: 1; border-radius: 14px; overflow: hidden; cursor: pointer; background: rgba(100,116,139,0.08); }
.pin-card img, .pin-card video { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.32s ease; }
.pin-card:hover img, .pin-card:hover video { transform: scale(1.04); }
.pin-card .pin-ovl { position: absolute; inset: 0; opacity: 0; transition: opacity 0.2s ease; background: linear-gradient(135deg,rgba(100,116,139,0.4) 0%,rgba(0,0,0,0.5) 100%); border-radius: 14px; }
.pin-card:hover .pin-ovl { opacity: 1; }
.pin-badge { position: absolute; bottom: 7px; right: 7px; width: 24px; height: 24px; border-radius: 50%; background: rgba(0,0,0,0.45); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; }
@media (max-width: 600px) {
  .pin-grid { gap: 3px; padding: 3px; }
  .pin-card { border-radius: 8px; }
}
`;

const PinnedSection = ({ posts, imageErrors, onImageError, onPostClick }: {
    posts: any[];
    imageErrors: Record<string, boolean>;
    onImageError: (id: string) => void;
    onPostClick: (id: number) => void;
}) => {
    const { t } = useTranslation();
    if (posts.length === 0) return null;
    return (
        <Box>
            <style>{pinnedCardCss}</style>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, px: 2, pt: 1, pb: 0.75 }}>
                <PushPin sx={{ fontSize: 15, color: "text.secondary", transform: "rotate(45deg)" }} />
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "text.secondary" }}>
                    {t("profile.pinned")}
                </Typography>
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 500, color: "text.disabled", ml: 0.5 }}>
                    {posts.length}
                </Typography>
            </Box>
            <div className="pin-grid">
                {posts.map((post) => {
                    const isVideo = post.file_url && /\.(mp4|mov|webm)$/i.test(post.file_url);
                    return (
                        <div key={post.id} className="pin-card" onClick={() => onPostClick(post.id)}>
                            {isVideo ? (
                                <video src={post.file_url} muted playsInline />
                            ) : !imageErrors[post.id] ? (
                                <img src={post.file_url} alt="" onError={() => onImageError(post.id)} />
                            ) : (
                                <Box sx={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <PhotoCamera sx={{ fontSize: 22, color: "rgba(255,255,255,0.2)" }} />
                                </Box>
                            )}
                            <div className="pin-ovl" />
                            <div className="pin-badge">
                                <PushPin sx={{ fontSize: 13, color: "#fff", transform: "rotate(45deg)" }} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </Box>
    );
};

/* ─── Post Card ─────────────────────────────────────────────────
   Uses CSS class selectors so hover works without re-renders.    */
const postCardCss = `
.pc { position:relative; aspect-ratio:1; overflow:hidden; cursor:pointer; background:rgba(255,255,255,0.04); }
.pc .pi { width:100%; height:100%; object-fit:cover; transition:transform 0.35s ease; display:block; }
.pc .ovl { position:absolute; inset:0; opacity:0; transition:opacity 0.22s ease;
  background:linear-gradient(135deg,rgba(100,116,139,0.45) 0%,rgba(0,0,0,0.55) 100%);
  display:flex; align-items:center; justify-content:center; gap:16px; }
@media (hover: hover) {
  .pc:hover .ovl { opacity:1; }
  .pc:hover .pi { transform:scale(1.06); }
}
.med { display:flex; align-items:center; gap:4px; }
`;

/* ─── Post Grid (masonry) ────────────────────────────────────── */
const masonryCss = `
.masonry { columns: 3; column-gap: 8px; padding: 8px; padding-top: 0; }
.masonry-item { break-inside: avoid; margin-bottom: 8px; border-radius: 14px; overflow: hidden; cursor: pointer; position: relative; }
@media (max-width: 600px) {
  .masonry { column-gap: 3px; padding: 3px; }
  .masonry-item { margin-bottom: 3px; border-radius: 8px; }
}
.masonry-item img, .masonry-item video { width: 100%; display: block; }
.masonry-item .ovl { position:absolute; inset:0; opacity:0; transition:opacity 0.22s ease;
  background:linear-gradient(135deg,rgba(100,116,139,0.45) 0%,rgba(0,0,0,0.55) 100%);
  display:flex; align-items:center; justify-content:center; gap:16px; border-radius:14px; }
@media (hover: hover) {
  .masonry-item:hover .ovl { opacity:1; }
  .masonry-item:hover img { transform: scale(1.04); }
}
.masonry-item img { transition: transform 0.35s ease; }
`;

const PostGrid = ({ posts, username, profilePicture, imageErrors, onImageError, onPostClick, pinnedIds }: {
    posts: any[];
    username?: string;
    profilePicture?: string;
    imageErrors: Record<string, boolean>;
    onImageError: (id: string) => void;
    onPostClick: (id: number) => void;
    pinnedIds?: Set<number>;
}) => (
    <>
        <style>{masonryCss}</style>
        <div className="masonry">
            {posts.map((post) => {
                const isVideo = post.file_url && /\.(mp4|mov|webm)$/i.test(post.file_url);
                const owner = post.username || username;
                const avatar = post.profile_picture || profilePicture;
                const isPinned = pinnedIds?.has(post.id) ?? false;
                return (
                    <div key={post.id} className="masonry-item" onClick={() => onPostClick(post.id)}>
                        {isVideo ? (
                            <video src={post.file_url} muted playsInline style={{ borderRadius: 14 }} />
                        ) : !imageErrors[post.id] ? (
                            <img src={post.file_url} alt={owner} onError={() => onImageError(post.id)} />
                        ) : (
                            <Box sx={{ aspectRatio: "1", bgcolor: "action.hover", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <PhotoCamera sx={{ fontSize: 20, color: "rgba(255,255,255,0.2)" }} />
                            </Box>
                        )}
                        {/* pin badge always visible on pinned posts */}
                        {isPinned && (
                            <div style={{ position: "absolute", top: 7, right: 7, width: 22, height: 22, borderRadius: "50%", background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
                                <PushPin style={{ fontSize: 12, color: "#fff", transform: "rotate(45deg)" }} />
                            </div>
                        )}
                        <div className="ovl" style={{ flexDirection: "column", alignItems: "flex-start", justifyContent: "flex-end", padding: "12px", gap: 6 }}>
                            {owner && (
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <img
                                        src={avatar || BlankProfileImage}
                                        alt={owner}
                                        style={{ width: 22, height: 22, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.6)", objectFit: "cover", flexShrink: 0 }}
                                        onError={(e) => { (e.target as HTMLImageElement).src = BlankProfileImage; }}
                                    />
                                    <span style={{ color: "#fff", fontWeight: 600, fontSize: "0.75rem", textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
                                        {owner}
                                    </span>
                                </div>
                            )}
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div className="med">
                                    <Favorite sx={{ color: "#fff", fontSize: 13 }} />
                                    <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.7rem" }}>{post.likes_count ?? post.like_count ?? 0}</Typography>
                                </div>
                                <div className="med">
                                    <Comment sx={{ color: "#fff", fontSize: 13 }} />
                                    <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.7rem" }}>{post.comments_count ?? 0}</Typography>
                                </div>
                                {(post.repost_count > 0) && (
                                    <div className="med">
                                        <RepeatRounded sx={{ color: "#fff", fontSize: 13 }} />
                                        <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.7rem" }}>{post.repost_count}</Typography>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    </>
);

const RepostGrid = ({ posts, imageErrors, onImageError, onPostClick }: {
    posts: any[];
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
                            <img src={post.file_url} alt={post.username} onError={() => onImageError(post.id)} />
                        ) : (
                            <Box sx={{ aspectRatio: "1", bgcolor: "action.hover", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <PhotoCamera sx={{ fontSize: 20, color: "rgba(255,255,255,0.2)" }} />
                            </Box>
                        )}
                        <div className="ovl" style={{ flexDirection: "column", alignItems: "flex-start", justifyContent: "flex-end", padding: "12px", gap: 6 }}>
                            {/* Owner row */}
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <img
                                    src={post.profile_picture || BlankProfileImage}
                                    alt={post.username}
                                    style={{ width: 22, height: 22, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.6)", objectFit: "cover", flexShrink: 0 }}
                                    onError={(e) => { (e.target as HTMLImageElement).src = BlankProfileImage; }}
                                />
                                <span style={{ color: "#fff", fontWeight: 600, fontSize: "0.75rem", textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
                                    {post.username}
                                </span>
                            </div>
                            {/* Counts row */}
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div className="med">
                                    <Favorite sx={{ color: "#fff", fontSize: 13 }} />
                                    <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.7rem" }}>{post.like_count ?? 0}</Typography>
                                </div>
                                <div className="med">
                                    <RepeatRounded sx={{ color: "#fff", fontSize: 13 }} />
                                    <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.7rem" }}>{post.repost_count ?? 0}</Typography>
                                </div>
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
                background: `rgba(100,116,139,0.1)`,
                border: `1px solid rgba(100,116,139,0.2)`,
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
    const { t } = useTranslation();
    const { postUploading, profileMenuOpen, setProfileMenuOpen, onlineUsers, hideActivity } = useGlobalStore();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    const currentUser = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") || "null") : {};

    const [profileData, setProfileData] = useState<Profile | null>(null);
    usePageTitle(profileData?.username ? `@${profileData.username}` : undefined);
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
    const [taggedPosts, setTaggedPosts] = useState<any[]>([]);
    const [fetchingTaggedPosts, setFetchingTaggedPosts] = useState(false);
    const [repostedPosts, setRepostedPosts] = useState<any[]>([]);
    const [fetchingRepostedPosts, setFetchingRepostedPosts] = useState(false);
    const [userReels, setUserReels] = useState<any[]>([]);
    const [fetchingUserReels, setFetchingUserReels] = useState(false);
    const [mutualFollowers, setMutualFollowers] = useState<{ id: number; username: string; profile_picture: string | null }[]>([]);
    const [mutualTotal, setMutualTotal] = useState(0);
    const [scrolled, setScrolled] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);
    const [premiumUpgradeOpen, setPremiumUpgradeOpen] = useState(false);
    const [profileViewsOpen, setProfileViewsOpen] = useState(false);
    const [pinnedPosts, setPinnedPosts] = useState<any[]>([]);
    const [shareCardOpen, setShareCardOpen] = useState(false);
    const [highlights, setHighlights] = useState<Highlight[]>([]);
    const [viewingHighlight, setViewingHighlight] = useState<Highlight | null>(null);
    const [createHighlightOpen, setCreateHighlightOpen] = useState(false);
    const [editingHighlight, setEditingHighlight] = useState<Highlight | null>(null);
    const [profileStories, setProfileStories] = useState<any[]>([]);
    const [storyDialogOpen, setStoryDialogOpen] = useState(false);

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
        window.scrollTo(0, 0);
        setScrolled(false);
        const handleScroll = () => setScrolled(window.scrollY > 80);
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => {
            window.removeEventListener("scroll", handleScroll);
            setScrolled(false);
        };
    }, [userId]);

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

    const fetchTaggedPosts = async () => {
        if (!userId) return;
        try {
            setFetchingTaggedPosts(true);
            const res = await getTaggedPosts(userId);
            setTaggedPosts(res.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setFetchingTaggedPosts(false);
        }
    };

    // On mobile, Saved tab is removed (it has its own page)
    const showSavedTab = isOwnProfile && !isMobile;
    const savedTabIndex = showSavedTab ? 1 : -1;
    const repostsTabIndex = showSavedTab ? 2 : (isOwnProfile ? 1 : 1);
    const reelsTabIndex = showSavedTab ? 3 : (isOwnProfile ? 2 : 2);
    const taggedTabIndex = showSavedTab ? 4 : (isOwnProfile ? 3 : 3);

    useEffect(() => {
        if (profileMenuOpen) {
            setOpenDialog(true);
            setProfileMenuOpen(false);
        }
    }, [profileMenuOpen]);

    const fetchUserReels = async () => {
        if (!userId) return;
        try {
            setFetchingUserReels(true);
            const res = await getUserReels(Number(userId));
            setUserReels(res.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setFetchingUserReels(false);
        }
    };

    const fetchRepostedPosts = async () => {
        if (!userId) return;
        try {
            setFetchingRepostedPosts(true);
            const res = await getUserReposts(userId);
            setRepostedPosts(res.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setFetchingRepostedPosts(false);
        }
    };

    useEffect(() => {
        if (tabValue === savedTabIndex && isOwnProfile && savedPosts.length === 0) fetchSavedPosts();
        if (tabValue === repostsTabIndex && repostedPosts.length === 0) fetchRepostedPosts();
        if (tabValue === reelsTabIndex && userReels.length === 0) fetchUserReels();
        if (tabValue === taggedTabIndex && taggedPosts.length === 0) fetchTaggedPosts();
    }, [tabValue, isOwnProfile]);

    async function fetchProfile() {
        try {
            setFetchingProfile(true);
            if (userId) {
                const res = await getProfile(userId);
                setProfileData(res.data);
                setIsFollowing(res.data.is_following);
            }
        } catch (e: any) {
            if (e?.response?.data?.error === "blocked") {
                setIsBlocked(true);
            }
            console.error(e);
        } finally {
            setFetchingProfile(false);
        }
    }

    async function checkBlockedStatus() {
        if (isOwnProfile) return;
        try {
            const blockedList = await getBlockedUsers();
            const blocked = blockedList.some((u) => String(u.id) === String(userId));
            setIsBlocked(blocked);
        } catch (e) {
            console.error(e);
        }
    }

    const fetchPinnedPostsFn = useCallback(async () => {
        if (!userId) return;
        try {
            const res = await getPinnedPosts(userId);
            setPinnedPosts(res.data ?? []);
        } catch (e) {
            console.error(e);
        }
    }, [userId]);

    const fetchHighlightsFn = useCallback(async () => {
        if (!userId) return;
        try {
            const res = await getHighlights(userId);
            setHighlights(res.data ?? []);
        } catch (e) {
            console.error(e);
        }
    }, [userId]);

    const handlePinToggle = async (postId: number, isPinned: boolean) => {
        try {
            if (isPinned) {
                await unpinPost(postId);
                setPinnedPosts((prev) => prev.filter((p) => p.id !== postId));
            } else {
                await pinPost(postId);
                const post = posts.find((p) => p.id === postId);
                if (post) setPinnedPosts((prev) => [post, ...prev.filter((p) => p.id !== postId)]);
            }
        } catch (e) {
            console.error(e);
        }
    };

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
        setIsBlocked(false);
        setMutualFollowers([]);
        setMutualTotal(0);
        fetchProfile();
        checkBlockedStatus();
        fetchPinnedPostsFn();
        fetchHighlightsFn();
        if (userId) getUserStories(Number(userId)).then(res => setProfileStories(res.data ?? [])).catch(() => setProfileStories([]));
        offsetRef.current = 0;
        hasMoreRef.current = true;
        setHasMore(true);
        fetchUserPosts(true);
        if (userId && !isOwnProfile) {
            recordProfileView(userId);
            getMutualFollowers(userId).then((res) => {
                if (res.success) {
                    setMutualFollowers(res.data);
                    setMutualTotal(res.total);
                }
            }).catch(() => {});
        }
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
                <Box sx={{ maxWidth: 900, mx: "auto", px: "8px" }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mt: 2 }}>
                        <MuiSkeleton variant="circular" width={88} height={88} sx={{ bgcolor: (t) => t.palette.action.selected, border: "3px solid", borderColor: "background.default" }} />
                        <MuiSkeleton variant="rounded" width={96} height={32} sx={{ bgcolor: (t) => t.palette.action.selected, borderRadius: "8px" }} />
                    </Stack>
                    <MuiSkeleton variant="text" width="45%" height={22} sx={{ mt: 1.5, bgcolor: (t) => t.palette.action.selected }} />
                    <MuiSkeleton variant="text" width="65%" height={14} sx={{ mt: 0.5, bgcolor: (t) => t.palette.action.hover }} />
                    <MuiSkeleton variant="rounded" height={58} sx={{ mt: 2, borderRadius: "14px", bgcolor: (t) => t.palette.action.hover }} />
                </Box>
                <Box sx={{ maxWidth: 900, mx: "auto", mt: 1.5 }}>
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
                    top: { xs: "52px", sm: 0 },
                    zIndex: 100,
                    height: scrolled ? 50 : 0,
                    overflow: "hidden",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(13,13,21,0.85)' : 'rgba(255,255,255,0.85)',
                    borderBottom: `1px solid ${scrolled ? theme.palette.divider : "transparent"}`,
                    transition: scrolled ? "height 0.2s ease, opacity 0.2s, border-color 0.2s" : "none",
                    opacity: scrolled ? 1 : 0,
                    pointerEvents: scrolled ? "auto" : "none",
                    px: { xs: 1.5, sm: 2 },
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                }}
            >
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
            </Box>

            {/* ── Profile content ── */}
            <Box sx={{ maxWidth: 900, mx: "auto", px: "8px" }}>
                {/* Avatar + action buttons row */}
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mt: 2 }}>
                    <Box
                        onClick={() => profileStories.length > 0 && setStoryDialogOpen(true)}
                        sx={{
                            flexShrink: 0,
                            cursor: profileStories.length > 0 ? "pointer" : "default",
                            p: "3px",
                            borderRadius: "50%",
                            background: profileStories.length > 0
                                ? "linear-gradient(135deg, #f97316, #ec4899, #8b5cf6)"
                                : "transparent",
                            display: "inline-flex",
                        }}
                    >
                        <Box sx={{
                            p: "2px", borderRadius: "50%",
                            background: "var(--nav-bg)",
                            display: "inline-flex",
                        }}>
                            <Avatar
                                src={profileData?.profile_picture || BlankProfileImage}
                                sx={{ width: { xs: 82, sm: 92 }, height: { xs: 82, sm: 92 }, fontSize: "1.8rem" }}
                            />
                        </Box>
                    </Box>

                    {/* Action buttons */}
                    <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ pb: 0.5 }}>
                        {!isOwnProfile && currentUser?.id && (
                            <>
                                <Tooltip title={t("profile.message")} placement="top">
                                    <IconButton
                                        size="small"
                                        onClick={() => navigate(`/messages/${userId}`, { state: profileData })}
                                        sx={{
                                            border: "none",
                                            borderRadius: "14px",
                                            width: 34,
                                            height: 34,
                                            backgroundColor: "var(--nav-bg)",
                                            boxShadow: "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)",
                                            color: (t) => t.palette.text.secondary,
                                            transition: "box-shadow 0.35s cubic-bezier(0.4,0,0.2,1), color 0.2s ease",
                                            "&:hover": { boxShadow: "inset 3px 3px 10px var(--nav-neo-shadow1), inset -3px -3px 10px var(--nav-neo-shadow2)", color: (t) => t.palette.text.primary, bgcolor: "var(--nav-bg)" },
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
                                <Tooltip title={t("profile.moreOptions")} placement="top">
                                    <IconButton
                                        size="small"
                                        onClick={() => setOpenDialog(true)}
                                        sx={{
                                            display: { xs: "none", sm: "flex" },
                                            border: "none",
                                            borderRadius: "14px",
                                            width: 34,
                                            height: 34,
                                            backgroundColor: "var(--nav-bg)",
                                            boxShadow: "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)",
                                            color: (t) => t.palette.text.secondary,
                                            transition: "box-shadow 0.35s cubic-bezier(0.4,0,0.2,1), color 0.2s ease",
                                            "&:hover": { boxShadow: "inset 3px 3px 10px var(--nav-neo-shadow1), inset -3px -3px 10px var(--nav-neo-shadow2)", color: (t) => t.palette.text.primary, bgcolor: "var(--nav-bg)" },
                                        }}
                                    >
                                        <MoreHoriz sx={{ fontSize: 18 }} />
                                    </IconButton>
                                </Tooltip>
                            </>
                        )}
                        {isOwnProfile && (
                            <>
                                {/* Premium: view profile viewers */}
                                {!!profileData?.is_premium && (
                                    <Tooltip title="See who viewed your profile" placement="top">
                                        <IconButton
                                            size="small"
                                            onClick={() => setProfileViewsOpen(true)}
                                            sx={{
                                                border: "none", borderRadius: "14px",
                                                width: 34, height: 34,
                                                backgroundColor: "rgba(245,158,11,0.1)",
                                                color: "#f59e0b",
                                                transition: "background 0.2s, box-shadow 0.2s",
                                                "&:hover": { backgroundColor: "rgba(245,158,11,0.18)", boxShadow: "0 0 12px rgba(245,158,11,0.3)" },
                                            }}
                                        >
                                            <VisibilityOutlinedIcon sx={{ fontSize: 17 }} />
                                        </IconButton>
                                    </Tooltip>
                                )}
                                {/* Non-premium: upgrade CTA */}
                                {!profileData?.is_premium && (
                                    <Tooltip title="Unlock Premium features" placement="top">
                                        <Button
                                            size="small"
                                            onClick={() => setPremiumUpgradeOpen(true)}
                                            startIcon={<WorkspacePremiumRoundedIcon sx={{ fontSize: "15px !important" }} />}
                                            sx={{
                                                textTransform: "none", fontWeight: 600,
                                                borderRadius: "14px", fontSize: "0.78rem",
                                                px: 1.75, py: 0.75, border: "none",
                                                background: "linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(217,119,6,0.1) 100%)",
                                                color: "#f59e0b",
                                                "&:hover": { background: "linear-gradient(135deg, rgba(245,158,11,0.25) 0%, rgba(217,119,6,0.18) 100%)" },
                                            }}
                                        >
                                            Premium
                                        </Button>
                                    </Tooltip>
                                )}
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => navigate(`/settings?setting=profiledetails`)}
                                    sx={{
                                        textTransform: "none",
                                        fontWeight: 500,
                                        borderRadius: "14px",
                                        fontSize: "0.8rem",
                                        px: 2.25,
                                        py: 0.75,
                                        border: "none",
                                        backgroundColor: "var(--nav-bg)",
                                        boxShadow: "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)",
                                        color: (t) => t.palette.text.secondary,
                                        transition: "box-shadow 0.35s cubic-bezier(0.4,0,0.2,1), color 0.2s ease",
                                        "&:hover": {
                                            border: "none",
                                            boxShadow: "inset 3px 3px 10px var(--nav-neo-shadow1), inset -3px -3px 10px var(--nav-neo-shadow2)",
                                            color: (t) => t.palette.text.primary,
                                            backgroundColor: "var(--nav-bg)",
                                        },
                                    }}
                                >
                                    {t("profile.editProfile")}
                                </Button>
                                <Tooltip title={t("profile.moreOptions")} placement="top">
                                    <IconButton
                                        size="small"
                                        onClick={() => setOpenDialog(true)}
                                        sx={{
                                            display: { xs: "none", sm: "flex" },
                                            border: "none",
                                            borderRadius: "14px",
                                            width: 34,
                                            height: 34,
                                            backgroundColor: "var(--nav-bg)",
                                            boxShadow: "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)",
                                            color: (t) => t.palette.text.secondary,
                                            transition: "box-shadow 0.35s cubic-bezier(0.4,0,0.2,1), color 0.2s ease",
                                            "&:hover": { boxShadow: "inset 3px 3px 10px var(--nav-neo-shadow1), inset -3px -3px 10px var(--nav-neo-shadow2)", color: (t) => t.palette.text.primary, bgcolor: "var(--nav-bg)" },
                                        }}
                                    >
                                        <MoreHoriz sx={{ fontSize: 18 }} />
                                    </IconButton>
                                </Tooltip>
                            </>
                        )}
                    </Stack>
                </Stack>

                {/* Name + verified + premium + online indicator */}
                <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 1.75 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: { xs: "1.05rem", sm: "1.15rem" }, color: (t) => t.palette.text.primary }}>
                        {profileData?.username}
                    </Typography>
                    {profileData?.is_verified && <Verified sx={{ fontSize: 15, color: "#1d9bf0" }} />}
                    {!!profileData?.is_premium && <PremiumBadge size={16} />}
                    {profileData && !isOwnProfile && !hideActivity && (() => {
                        const isOnline = onlineUsers.includes(String(profileData.id));
                        const label = !isOnline ? formatLastSeen(profileData.last_seen, false) : null;
                        return (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: isOnline ? "#22c55e" : "action.disabled", flexShrink: 0, opacity: isOnline ? 1 : 0.5 }} />
                                {label && (
                                    <Typography sx={{ fontSize: "0.75rem", color: "text.disabled", lineHeight: 1 }}>
                                        {label}
                                    </Typography>
                                )}
                            </Box>
                        );
                    })()}
                </Stack>

                {/* Pronouns chip */}
                {profileData?.pronouns && (
                    <Box
                        sx={{
                            display: "inline-flex", alignItems: "center",
                            mt: 0.5, px: 1.25, py: 0.35, borderRadius: "20px",
                            backgroundColor: "action.hover",
                            border: "1px solid", borderColor: "divider",
                        }}
                    >
                        <Typography sx={{ fontSize: "0.72rem", color: "text.secondary", fontWeight: 500 }}>
                            {profileData.pronouns}
                        </Typography>
                    </Box>
                )}

                {/* Mutual followers */}
                {!isOwnProfile && mutualFollowers.length > 0 && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.75 }}>
                        {/* Overlapping avatars */}
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                            {mutualFollowers.slice(0, 3).map((u, i) => (
                                <Box
                                    key={u.id}
                                    component="img"
                                    src={u.profile_picture || BlankProfileImage}
                                    alt={u.username}
                                    onClick={() => navigate(`/profile/${u.id}`)}
                                    sx={{
                                        width: 24, height: 24, borderRadius: "50%", objectFit: "cover",
                                        border: "2px solid", borderColor: "background.default",
                                        ml: i > 0 ? "-8px" : 0,
                                        position: "relative", zIndex: 3 - i,
                                        cursor: "pointer",
                                        transition: "transform 0.15s",
                                        "&:hover": { transform: "scale(1.15)", zIndex: 10 },
                                    }}
                                />
                            ))}
                        </Box>
                        <Typography sx={{ fontSize: "0.75rem", color: (t) => t.palette.text.disabled, lineHeight: 1.3 }}>
                            {t("profile.followedBy") + " "}
                            {mutualFollowers.slice(0, 2).map((u, i) => (
                                <Box key={u.id} component="span"
                                    onClick={() => navigate(`/profile/${u.id}`)}
                                    sx={{ fontWeight: 600, color: (t) => t.palette.text.secondary, cursor: "pointer", "&:hover": { color: (t) => t.palette.text.primary } }}
                                >
                                    {u.username}{i < Math.min(mutualFollowers.length, 2) - 1 ? ", " : ""}
                                </Box>
                            ))}
                            {mutualTotal > 2 && t("profile.moreMutual", { count: mutualTotal - 2 })}
                        </Typography>
                    </Box>
                )}

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
                        {t("profile.addBio")}
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
                                    {t("profile.joined", { date: formatDate(profileData.created_at) })}
                                </Typography>
                            </Stack>
                        )}
                    </Stack>
                )}

                {/* Stats */}
                <Stack
                    direction="row"
                    sx={{ mt: 2 }}
                >
                    <StatCol value={profileData?.posts_count || 0} label={t("profile.posts")} />
                    <Box sx={{ width: "1px", bgcolor: (t) => t.palette.divider, my: 0.5 }} />
                    <StatCol
                        value={profileData?.followers_count || 0}
                        label={t("profile.followers")}
                        onClick={() => navigate(`/profile/${userId}/followers`)}
                    />
                    <Box sx={{ width: "1px", bgcolor: (t) => t.palette.divider, my: 0.5 }} />
                    <StatCol
                        value={profileData?.following_count || 0}
                        label={t("profile.following")}
                        onClick={() => navigate(`/profile/${userId}/following`)}
                    />
                </Stack>
            </Box>

            {/* ── Story Highlights ── */}
            {(highlights.length > 0 || isOwnProfile) && (
                <Box sx={{ maxWidth: 900, mx: "auto", px: "8px", mt: 1.5, mb: 0.5 }}>
                    <Box
                        sx={{
                            display: "flex", alignItems: "center", gap: 1,
                            overflowX: "auto", pb: 1,
                            "&::-webkit-scrollbar": { display: "none" },
                            scrollbarWidth: "none",
                        }}
                    >
                        {/* Add New highlight card — own profile only */}
                        {isOwnProfile && (
                            <Box
                                onClick={() => setCreateHighlightOpen(true)}
                                sx={{
                                    position: "relative", flexShrink: 0, cursor: "pointer",
                                    width: 90, height: 130, borderRadius: "14px",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    backgroundColor: "var(--nav-bg)",
                                    boxShadow: "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)",
                                    transition: "box-shadow 0.35s cubic-bezier(0.4,0,0.2,1), color 0.2s ease",
                                    "&:hover": { boxShadow: "inset 3px 3px 10px var(--nav-neo-shadow1), inset -3px -3px 10px var(--nav-neo-shadow2)" },
                                }}
                            >
                                <AddRoundedIcon sx={{ fontSize: 36, color: "text.secondary" }} />
                            </Box>
                        )}

                        {/* Highlight cards */}
                        {highlights.map(highlight => (
                            <Box
                                key={highlight.id}
                                onClick={() => highlight.items.length > 0 && setViewingHighlight(highlight)}
                                sx={{
                                    position: "relative", flexShrink: 0,
                                    width: 90, height: 130, borderRadius: "14px", overflow: "hidden",
                                    cursor: highlight.items.length > 0 ? "pointer" : "default",
                                    display: "flex", alignItems: "flex-end",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                                    transition: "opacity 0.2s",
                                    "&:hover": { opacity: 0.85 },
                                }}
                            >
                                {highlight.cover_url || highlight.items[0]?.media_url ? (
                                    <Box component="img"
                                        src={highlight.cover_url || highlight.items[0].media_url}
                                        sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                                    />
                                ) : (
                                    <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "action.hover" }}>
                                        <AutoAwesomeRoundedIcon sx={{ fontSize: 28, color: "text.disabled" }} />
                                    </Box>
                                )}
                                {/* gradient overlay */}
                                <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 55%)" }} />
                                {/* title */}
                                <Typography sx={{
                                    position: "relative", zIndex: 1,
                                    px: "7px", pb: "7px",
                                    fontSize: "0.68rem", fontWeight: 600,
                                    color: "#fff", whiteSpace: "nowrap",
                                    overflow: "hidden", textOverflow: "ellipsis", width: "100%",
                                }}>
                                    {highlight.title}
                                </Typography>
                            </Box>
                        ))}

                    </Box>
                </Box>
            )}

            {/* ── Tabs ── */}
            <Box
                sx={{
                    maxWidth: 900,
                    mx: "auto",
                    mt: 0.5,
                    mb: 0.5,
                    px: "8px",
                    py: 1.25,
                }}
            >
                <Box sx={{ display: "flex", gap: 1 }}>
                    {[
                        { label: t("profile.posts"), icon: <GridOn sx={{ fontSize: 15 }} /> },
                        ...(showSavedTab ? [{ label: t("profile.saved"), icon: <BookmarkBorder sx={{ fontSize: 15 }} /> }] : []),
                        { label: t("profile.reposts"), icon: <RepeatRounded sx={{ fontSize: 15 }} /> },
                        { label: t("profile.reels"), icon: <SlowMotionVideoRounded sx={{ fontSize: 15 }} /> },
                        { label: t("profile.tagged"), icon: <PersonPin sx={{ fontSize: 15 }} /> },
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
                                py: 1.5,
                                borderRadius: "14px",
                                cursor: "pointer",
                                transition: "background 0.35s cubic-bezier(0.4,0,0.2,1), box-shadow 0.35s cubic-bezier(0.4,0,0.2,1), color 0.2s ease",
                                backgroundColor: tabValue === i ? "var(--nav-bg)" : "transparent",
                                boxShadow: tabValue === i
                                    ? "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)"
                                    : "none",
                                color: tabValue === i
                                    ? (t: any) => t.palette.text.primary
                                    : (t: any) => t.palette.text.disabled,
                                "&:hover": {
                                    color: (t: any) => t.palette.text.secondary,
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
            <Box sx={{ maxWidth: 900, mx: "auto" }} hidden={tabValue !== 0}>
                {tabValue === 0 && (
                    <Fade in timeout={250}>
                        <div>
                            {fetchingPosts ? (
                                <GridSkeleton />
                            ) : isBlocked ? (
                                <EmptyState
                                    icon={<Lock sx={{ fontSize: 22, color: ACCENT }} />}
                                    title={t("profile.blockedAccount")}
                                    subtitle={t("profile.blockedSubtitle")}
                                />
                            ) : !canViewPosts ? (
                                <EmptyState
                                    icon={<Lock sx={{ fontSize: 22, color: ACCENT }} />}
                                    title={t("profile.privateAccount")}
                                    subtitle={t("profile.followToSee")}
                                />
                            ) : posts.length === 0 ? (
                                <EmptyState
                                    icon={<PhotoCamera sx={{ fontSize: 22, color: ACCENT }} />}
                                    title={t("profile.noPostsYet")}
                                    subtitle={isOwnProfile ? t("profile.shareFirstPost") : t("profile.nothingHereYet")}
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
                                                    borderRadius: "14px",
                                                    px: 3,
                                                    fontSize: "0.82rem",
                                                    bgcolor: ACCENT,
                                                    "&:hover": { opacity: 0.88, bgcolor: ACCENT },
                                                }}
                                            >
                                                {t("profile.createFirstPost")}
                                            </Button>
                                        ) : undefined
                                    }
                                />
                            ) : (
                                <>
                                    {pinnedPosts.length > 0 && (
                                        <>
                                            <PinnedSection
                                                posts={pinnedPosts}
                                                imageErrors={imageErrors}
                                                onImageError={(id) => setImageErrors((prev) => ({ ...prev, [id]: true }))}
                                                onPostClick={(id) => navigate(`/posts/${id}`)}
                                            />
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.25 }}>
                                                <Box sx={{ flex: 1, height: "1px", bgcolor: "divider" }} />
                                                <Typography sx={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "text.disabled", whiteSpace: "nowrap" }}>
                                                    {t("profile.allPosts")}
                                                </Typography>
                                                <Box sx={{ flex: 1, height: "1px", bgcolor: "divider" }} />
                                            </Box>
                                        </>
                                    )}
                                    <PostGrid
                                        posts={posts}
                                        username={profileData?.username}
                                        profilePicture={profileData?.profile_picture}
                                        imageErrors={imageErrors}
                                        onImageError={(id) => setImageErrors((prev) => ({ ...prev, [id]: true }))}
                                        onPostClick={(id) => navigate(`/posts/${id}`)}
                                        pinnedIds={new Set(pinnedPosts.map((p) => p.id))}
                                    />
                                </>
                            )}

                            {loadingMore && (
                                <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                                    <CircularProgress size={22} sx={{ color: ACCENT }} />
                                </Box>
                            )}

                            {!hasMore && posts.length > 0 && <EndOfFeed message={t("profile.seenAllPosts")} />}
                        </div>
                    </Fade>
                )}
            </Box>

            {/* ── Saved Tab ── */}
            {isOwnProfile && (
                <Box sx={{ maxWidth: 900, mx: "auto" }} hidden={tabValue !== savedTabIndex}>
                    {tabValue === savedTabIndex && (
                        <Fade in timeout={250}>
                            <div>
                                {fetchingSavedPosts ? (
                                    <GridSkeleton count={6} />
                                ) : savedPosts.length === 0 ? (
                                    <EmptyState
                                        icon={<BookmarkBorder sx={{ fontSize: 22, color: ACCENT }} />}
                                        title={t("profile.nothingSaved")}
                                        subtitle={t("profile.savedAppearHere")}
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

            {/* ── Reposts Tab ── */}
            <Box sx={{ maxWidth: 900, mx: "auto" }} hidden={tabValue !== repostsTabIndex}>
                {tabValue === repostsTabIndex && (
                    <Fade in timeout={250}>
                        <div>
                            {fetchingRepostedPosts ? (
                                <GridSkeleton count={6} />
                            ) : repostedPosts.length === 0 ? (
                                <EmptyState
                                    icon={<RepeatRounded sx={{ fontSize: 22, color: ACCENT }} />}
                                    title={t("profile.noReposts")}
                                    subtitle={t("profile.repostsAppearHere")}
                                />
                            ) : (
                                <RepostGrid
                                    posts={repostedPosts}
                                    imageErrors={imageErrors}
                                    onImageError={(id) => setImageErrors((prev) => ({ ...prev, [id]: true }))}
                                    onPostClick={(id) => navigate(`/posts/${id}`)}
                                />
                            )}
                        </div>
                    </Fade>
                )}
            </Box>

            {/* ── Reels Tab ── */}
            <Box sx={{ maxWidth: 900, mx: "auto" }} hidden={tabValue !== reelsTabIndex}>
                {tabValue === reelsTabIndex && (
                    <Fade in timeout={250}>
                        <div>
                            {fetchingUserReels ? (
                                <GridSkeleton count={6} />
                            ) : userReels.length === 0 ? (
                                <EmptyState
                                    icon={<SlowMotionVideoRounded sx={{ fontSize: 22, color: ACCENT }} />}
                                    title={t("profile.noReels")}
                                    subtitle={isOwnProfile ? t("profile.uploadFirstReel") : t("profile.noReelsPosted")}
                                />
                            ) : (
                                <Box sx={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(3, 1fr)",
                                    gap: "3px",
                                }}>
                                    {userReels.map((reel) => (
                                        <Box
                                            key={reel.id}
                                            onClick={() => navigate("/reels", { state: { startPostId: reel.id } })}
                                            sx={{
                                                position: "relative",
                                                aspectRatio: "9/16",
                                                cursor: "pointer",
                                                overflow: "hidden",
                                                borderRadius: "4px",
                                                bgcolor: "#000",
                                                "&:hover .reel-overlay": { opacity: 1 },
                                            }}
                                        >
                                            <video
                                                src={reel.file_url}
                                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                muted
                                                preload="metadata"
                                            />
                                            <Box className="reel-overlay" sx={{
                                                position: "absolute", inset: 0,
                                                background: "rgba(0,0,0,0.45)",
                                                opacity: 0,
                                                transition: "opacity 0.2s",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: 2,
                                            }}>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "#fff" }}>
                                                    <Favorite sx={{ fontSize: 16 }} />
                                                    <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: "#fff" }}>{reel.like_count ?? 0}</Typography>
                                                </Box>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "#fff" }}>
                                                    <Comment sx={{ fontSize: 16 }} />
                                                    <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: "#fff" }}>{reel.comment_count ?? 0}</Typography>
                                                </Box>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "#fff" }}>
                                                    <SlowMotionVideoRounded sx={{ fontSize: 16 }} />
                                                    <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: "#fff" }}>{reel.view_count ?? 0}</Typography>
                                                </Box>
                                            </Box>
                                            <Box sx={{
                                                position: "absolute", bottom: 6, left: 6,
                                                bgcolor: "rgba(0,0,0,0.55)", borderRadius: "4px", px: 0.75, py: 0.25,
                                                display: "flex", alignItems: "center", gap: 0.4,
                                            }}>
                                                <SlowMotionVideoRounded sx={{ fontSize: 11, color: "#fff" }} />
                                                <Typography sx={{ fontSize: "0.7rem", fontWeight: 600, color: "#fff", lineHeight: 1 }}>
                                                    {(reel.view_count ?? 0) >= 1000 ? `${((reel.view_count ?? 0) / 1000).toFixed(1)}K` : reel.view_count ?? 0}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                            )}
                        </div>
                    </Fade>
                )}
            </Box>

            {/* ── Tagged Tab ── */}
            <Box sx={{ maxWidth: 900, mx: "auto" }} hidden={tabValue !== taggedTabIndex}>
                {tabValue === taggedTabIndex && (
                    <Fade in timeout={250}>
                        <div>
                            {fetchingTaggedPosts ? (
                                <GridSkeleton count={6} />
                            ) : taggedPosts.length === 0 ? (
                                <EmptyState
                                    icon={<PersonPin sx={{ fontSize: 22, color: ACCENT }} />}
                                    title={t("profile.noTaggedPosts")}
                                    subtitle={t("profile.taggedAppearHere")}
                                />
                            ) : (
                                <PostGrid
                                    posts={taggedPosts}
                                    imageErrors={imageErrors}
                                    onImageError={(id) => setImageErrors((prev) => ({ ...prev, [id]: true }))}
                                    onPostClick={(id) => navigate(`/posts/${id}`)}
                                />
                            )}
                        </div>
                    </Fade>
                )}
            </Box>

            {/* ── More Options ── */}
            <MoreOptionsDialog
                openDialog={openDialog}
                handleCloseDialog={() => setOpenDialog(false)}
                userId={userId}
                fetchProfile={fetchProfile}
                fetchUserPosts={() => fetchUserPosts(true)}
                isFollowing={profileData?.is_following}
                isBlocked={isBlocked}
                onBlockToggle={() => {
                    setIsBlocked((prev) => !prev);
                    fetchProfile();
                }}
                onShareCard={isOwnProfile ? () => setShareCardOpen(true) : undefined}
            />

            <ShareProfileCardModal
                open={shareCardOpen}
                onClose={() => setShareCardOpen(false)}
                profile={profileData}
            />

            <StoryDialog
                open={!!viewingHighlight}
                onClose={() => setViewingHighlight(null)}
                selectedStoryIndex={0}
                onDelete={isOwnProfile && viewingHighlight ? async () => {
                    await deleteHighlight(viewingHighlight.id);
                    setHighlights(prev => prev.filter(h => h.id !== viewingHighlight.id));
                    setViewingHighlight(null);
                } : undefined}
                onEdit={isOwnProfile && viewingHighlight ? () => {
                    setEditingHighlight(viewingHighlight);
                    setViewingHighlight(null);
                } : undefined}
                stories={viewingHighlight ? [{
                    user_id: profileData?.id ?? 0,
                    username: viewingHighlight.title,
                    profile_picture: viewingHighlight.cover_url ?? viewingHighlight.items[0]?.media_url ?? "",
                    stories: viewingHighlight.items.map(item => ({
                        story_id: item.id,
                        media_url: item.media_url,
                        media_type: item.media_type,
                        created_at: item.created_at ?? new Date().toISOString(),
                        viewers: [],
                    })),
                }] : []}
            />

            {/* Profile story viewer */}
            <StoryDialog
                open={storyDialogOpen}
                onClose={() => setStoryDialogOpen(false)}
                selectedStoryIndex={0}
                stories={profileStories.length > 0 ? [{
                    user_id: profileData?.id ?? 0,
                    username: profileData?.username ?? "",
                    profile_picture: profileData?.profile_picture ?? "",
                    stories: profileStories.map(s => ({
                        story_id: s.story_id,
                        media_url: s.media_url,
                        media_type: s.media_type,
                        created_at: s.created_at,
                        caption: s.caption,
                        viewers: s.viewers ?? [],
                    })),
                }] : []}
            />

            <CreateHighlightModal
                open={createHighlightOpen || !!editingHighlight}
                onClose={() => { setCreateHighlightOpen(false); setEditingHighlight(null); }}
                onCreated={fetchHighlightsFn}
                editHighlight={editingHighlight}
            />

            <CreatePostModal open={modalOpen} handleClose={() => setModalOpen(false)} />

            <PremiumUpgradeModal
                open={premiumUpgradeOpen}
                onClose={() => setPremiumUpgradeOpen(false)}
                onUpgraded={() => {
                    setProfileData((p) => p ? { ...p, is_premium: true } : p);
                    setPremiumUpgradeOpen(false);
                }}
            />

            <ProfileViewsModal
                open={profileViewsOpen}
                onClose={() => setProfileViewsOpen(false)}
            />
        </Box>
    );
};

export default ProfilePage;
