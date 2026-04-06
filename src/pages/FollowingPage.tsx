import { useState, useEffect } from "react";
import {
    Box,
    Container,
    Typography,
    Avatar,
    Stack,
    IconButton,
    LinearProgress,
    Skeleton as MuiSkeleton,
    Fade,
    alpha,
    useTheme,
    InputBase,
    Divider,
} from "@mui/material";
import { ArrowBack, Search, PersonOff } from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import BlankProfileImage from "../static/profile_blank.png";
import FollowButton from "./profile/FollowButton";
import { getFollowing, followUser, cancelFollowRequest, unfollowUser } from "../services/api";

interface FollowingUser {
    id: number;
    username: string;
    profile_picture?: string;
    is_following: boolean;
    is_request_active: boolean;
    is_private?: boolean;
    follow_status?: string;
}

const FollowingRow = ({
    user,
    currentUserId,
    onFollowChange,
}: {
    user: FollowingUser;
    currentUserId?: number;
    onFollowChange: (userId: number, following: boolean, requestActive: boolean) => void;
}) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const isOwnProfile = currentUserId === user.id;

    const handleFollow = async () => {
        if (!currentUserId) return;
        setLoading(true);
        try {
            const res = await followUser(currentUserId.toString(), user.id.toString());
            if (res?.success) {
                onFollowChange(user.id, true, true);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelRequest = async () => {
        if (!currentUserId) return;
        setLoading(true);
        try {
            const res = await cancelFollowRequest(currentUserId.toString(), user.id.toString());
            if (res?.success) {
                onFollowChange(user.id, false, false);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleUnfollow = async () => {
        if (!currentUserId) return;
        setLoading(true);
        try {
            const res = await unfollowUser(currentUserId.toString(), user.id.toString());
            if (res?.success) {
                onFollowChange(user.id, false, false);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Fade in timeout={300}>
            <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{
                    py: 1.25,
                    px: 1,
                    borderRadius: "12px",
                    transition: "background 0.15s ease",
                    "&:hover": { bgcolor: "action.hover" },
                }}
            >
                <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1.5}
                    sx={{ cursor: "pointer", flex: 1, minWidth: 0 }}
                    onClick={() => navigate(`/profile/${user.id}`)}
                >
                    <Avatar
                        src={user.profile_picture || BlankProfileImage}
                        sx={{
                            width: 46,
                            height: 46,
                            flexShrink: 0,
                            border: "2px solid",
                            borderColor: "divider",
                            transition: "transform 0.2s ease",
                            "&:hover": { transform: "scale(1.05)" },
                        }}
                    />
                    <Box sx={{ minWidth: 0 }}>
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
                            {user.username}
                        </Typography>
                    </Box>
                </Stack>
                {!isOwnProfile && currentUserId && (
                    <Box sx={{ flexShrink: 0, ml: 1.5 }}>
                        <FollowButton
                            isFollowing={user.is_following}
                            profileData={user}
                            followButtonLoading={loading}
                            handleFollow={handleFollow}
                            handleCancelRequest={handleCancelRequest}
                            handleUnfollow={handleUnfollow}
                        />
                    </Box>
                )}
            </Stack>
        </Fade>
    );
};

const FollowingPage = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const theme = useTheme();

    const currentUser = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") || "") : {};

    const [following, setFollowing] = useState<FollowingUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [username, setUsername] = useState("");

    useEffect(() => {
        const fetchFollowing = async () => {
            if (!userId) return;
            try {
                setLoading(true);
                const res = await getFollowing(userId);
                setFollowing(res.data.following || []);
                setUsername(res.data.username || "");
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchFollowing();
    }, [userId]);

    const filtered = following.filter((u) => u.username.toLowerCase().includes(search.toLowerCase()));

    const handleFollowChange = (uid: number, isFollowing: boolean, requestActive: boolean) => {
        setFollowing((prev) =>
            prev.map((u) =>
                u.id === uid
                    ? {
                          ...u,
                          is_following: isFollowing,
                          is_request_active: requestActive,
                      }
                    : u,
            ),
        );
    };

    return (
        <Box
            sx={{
                bgcolor: "background.default",
                minHeight: "100vh",
                fontFamily: '"DM Sans", sans-serif',
            }}
        >
            {loading && (
                <LinearProgress
                    sx={{
                        height: 2,
                        "& .MuiLinearProgress-bar": {
                            background: "linear-gradient(90deg, #6366f1, #a855f7, #ec4899)",
                        },
                    }}
                />
            )}
            <Container maxWidth="sm" sx={{ py: 3 }}>
                {/* Header */}
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
                    <IconButton
                        onClick={() => navigate(-1)}
                        size="small"
                        sx={{
                            border: "1px solid",
                            borderColor: "divider",
                            borderRadius: "10px",
                            width: 36,
                            height: 36,
                            "&:hover": { bgcolor: "action.hover" },
                        }}
                    >
                        <ArrowBack sx={{ fontSize: 18 }} />
                    </IconButton>
                    <Box>
                        <Typography
                            sx={{
                                fontFamily: '"Instrument Serif", Georgia, serif',
                                fontSize: "1.4rem",
                                fontWeight: 400,
                                lineHeight: 1.2,
                                letterSpacing: "-0.3px",
                            }}
                        >
                            Following
                        </Typography>
                        {username && (
                            <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.75rem" }}>
                                @{username}
                            </Typography>
                        )}
                    </Box>
                </Stack>

                {/* Search bar */}
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        px: 1.5,
                        py: 0.75,
                        bgcolor: alpha(theme.palette.text.primary, 0.05),
                        borderRadius: "12px",
                        border: "1px solid",
                        borderColor: "divider",
                        mb: 2.5,
                        transition: "border-color 0.2s",
                        "&:focus-within": { borderColor: "primary.main" },
                    }}
                >
                    <Search sx={{ fontSize: 18, color: "text.disabled" }} />
                    <InputBase
                        placeholder="Search following…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        sx={{
                            flex: 1,
                            fontSize: "0.88rem",
                            fontFamily: '"DM Sans", sans-serif',
                        }}
                    />
                </Box>

                {/* Count */}
                {!loading && (
                    <Typography
                        variant="caption"
                        sx={{
                            color: "text.disabled",
                            fontSize: "0.75rem",
                            fontWeight: 500,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            mb: 1.5,
                            display: "block",
                        }}
                    >
                        {filtered.length} {filtered.length === 1 ? "person" : "people"}
                    </Typography>
                )}

                <Divider sx={{ mb: 1.5 }} />

                {/* List */}
                {loading ? (
                    <Stack spacing={1}>
                        {[...Array(6)].map((_, i) => (
                            <Stack key={i} direction="row" alignItems="center" spacing={1.5} sx={{ py: 1 }}>
                                <MuiSkeleton variant="circular" width={46} height={46} />
                                <Box sx={{ flex: 1 }}>
                                    <MuiSkeleton variant="text" width="45%" height={18} />
                                    <MuiSkeleton variant="text" width="30%" height={14} />
                                </Box>
                                <MuiSkeleton variant="rounded" width={76} height={32} sx={{ borderRadius: "20px" }} />
                            </Stack>
                        ))}
                    </Stack>
                ) : filtered.length === 0 ? (
                    <Box sx={{ textAlign: "center", py: 10 }}>
                        <PersonOff sx={{ fontSize: 40, color: "text.disabled", mb: 1.5 }} />
                        <Typography
                            sx={{
                                fontFamily: '"Instrument Serif", Georgia, serif',
                                fontSize: "1.2rem",
                                mb: 0.5,
                            }}
                        >
                            {search ? "No results found" : "Not following anyone yet"}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.8rem" }}>
                            {search ? "Try a different search" : "Accounts this user follows will appear here"}
                        </Typography>
                    </Box>
                ) : (
                    <Stack>
                        {filtered.map((user) => (
                            <FollowingRow key={user.id} user={user} currentUserId={currentUser?.id} onFollowChange={handleFollowChange} />
                        ))}
                    </Stack>
                )}
            </Container>
        </Box>
    );
};

export default FollowingPage;
