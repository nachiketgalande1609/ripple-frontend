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
    Button,
    Dialog,
    DialogContent,
} from "@mui/material";
import { ArrowBack, Search, PersonOff, PersonRemove } from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import BlankProfileImage from "../static/profile_blank.png";
import FollowButton from "./profile/FollowButton";
import { getFollowers, followUser, cancelFollowRequest, unfollowUser, removeFollower } from "../services/api";

interface FollowerUser {
    id: number;
    username: string;
    profile_picture?: string;
    is_following: boolean;
    is_request_active: boolean;
    is_private?: boolean;
    follow_status?: string;
}

/* ── Confirmation Dialog ─────────────────────────────────────── */
const RemoveConfirmDialog = ({
    open,
    username,
    profilePicture,
    loading,
    onConfirm,
    onCancel,
}: {
    open: boolean;
    username: string;
    profilePicture?: string;
    loading: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}) => (
    <Dialog
        open={open}
        onClose={onCancel}
        maxWidth="xs"
        fullWidth
        sx={{
            "& .MuiDialog-paper": {
                borderRadius: "20px",
                p: 0,
                overflow: "hidden",
            },
            "& .MuiBackdrop-root": {
                backdropFilter: "blur(4px)",
            },
        }}
    >
        <DialogContent sx={{ p: 3, textAlign: "center" }}>
            <Avatar
                src={profilePicture || BlankProfileImage}
                sx={{
                    width: 64,
                    height: 64,
                    mx: "auto",
                    mb: 2,
                    border: "2px solid",
                    borderColor: "divider",
                }}
            />
            <Typography
                sx={{
                    fontFamily: '"Instrument Serif", Georgia, serif',
                    fontSize: "1.2rem",
                    fontWeight: 400,
                    mb: 0.75,
                    color: "text.primary",
                }}
            >
                Remove follower?
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.83rem", mb: 3, lineHeight: 1.6 }}>
                <strong>@{username}</strong> will be removed from your followers. They won't be notified.
            </Typography>

            <Stack spacing={1.25}>
                <Button
                    fullWidth
                    onClick={onConfirm}
                    disabled={loading}
                    sx={{
                        textTransform: "none",
                        fontWeight: 600,
                        fontSize: "0.88rem",
                        borderRadius: "12px",
                        py: 1.1,
                        bgcolor: "rgba(255,59,48,0.1)",
                        color: "#ff5050",
                        border: "1.5px solid rgba(255,80,80,0.2)",
                        transition: "all 0.2s ease",
                        "&:hover": {
                            bgcolor: "rgba(255,59,48,0.18)",
                            borderColor: "rgba(255,80,80,0.4)",
                        },
                        "&:disabled": { opacity: 0.6 },
                    }}
                >
                    {loading ? "Removing…" : "Remove"}
                </Button>
                <Button
                    fullWidth
                    onClick={onCancel}
                    disabled={loading}
                    sx={{
                        textTransform: "none",
                        fontWeight: 500,
                        fontSize: "0.88rem",
                        borderRadius: "12px",
                        py: 1.1,
                        color: "text.secondary",
                        border: "1.5px solid",
                        borderColor: "divider",
                        "&:hover": {
                            bgcolor: "action.hover",
                            borderColor: "text.disabled",
                        },
                    }}
                >
                    Cancel
                </Button>
            </Stack>
        </DialogContent>
    </Dialog>
);

/* ── Follower Row ─────────────────────────────────────────────── */
const FollowerRow = ({
    user,
    currentUserId,
    isOwnFollowersList,
    onFollowChange,
    onRemove,
}: {
    user: FollowerUser;
    currentUserId?: number;
    isOwnFollowersList: boolean;
    onFollowChange: (userId: number, following: boolean, requestActive: boolean) => void;
    onRemove: (userId: number) => void;
}) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [removeLoading, setRemoveLoading] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const isOwnProfile = currentUserId === user.id;

    const handleFollow = async () => {
        if (!currentUserId) return;
        setLoading(true);
        try {
            const res = await followUser(currentUserId.toString(), user.id.toString());
            if (res?.success) onFollowChange(user.id, true, true);
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
            if (res?.success) onFollowChange(user.id, false, false);
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
            if (res?.success) onFollowChange(user.id, false, false);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmRemove = async () => {
        if (!currentUserId) return;
        setRemoveLoading(true);
        try {
            const res = await removeFollower(user.id.toString(), currentUserId.toString());
            if (res?.success) {
                setConfirmOpen(false);
                onRemove(user.id);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setRemoveLoading(false);
        }
    };

    return (
        <>
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

                    <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0, ml: 1.5 }}>
                        {isOwnFollowersList && !isOwnProfile && (
                            <Button
                                size="small"
                                onClick={() => setConfirmOpen(true)}
                                disabled={removeLoading}
                                startIcon={<PersonRemove sx={{ fontSize: 13 }} />}
                                sx={{
                                    textTransform: "none",
                                    fontSize: "0.78rem",
                                    fontWeight: 500,
                                    borderRadius: "20px",
                                    px: 1.5,
                                    py: 0.6,
                                    color: "text.secondary",
                                    border: "1.5px solid",
                                    borderColor: "divider",
                                    bgcolor: "transparent",
                                    whiteSpace: "nowrap",
                                    transition: "all 0.2s ease",
                                    "&:hover": {
                                        borderColor: "rgba(255,80,80,0.4)",
                                        color: "#ff5050",
                                        bgcolor: "rgba(255,80,80,0.06)",
                                    },
                                }}
                            >
                                Remove
                            </Button>
                        )}

                        {!isOwnProfile && currentUserId && (
                            <Box sx={{ "& button": { marginTop: "0 !important" } }}>
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
                </Stack>
            </Fade>

            <RemoveConfirmDialog
                open={confirmOpen}
                username={user.username}
                profilePicture={user.profile_picture}
                loading={removeLoading}
                onConfirm={handleConfirmRemove}
                onCancel={() => setConfirmOpen(false)}
            />
        </>
    );
};

/* ── Page ─────────────────────────────────────────────────────── */
const FollowersPage = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const theme = useTheme();

    const currentUser = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") || "") : {};
    const isOwnFollowersList = currentUser?.id?.toString() === userId;

    const [followers, setFollowers] = useState<FollowerUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [username, setUsername] = useState("");

    useEffect(() => {
        const fetchFollowers = async () => {
            if (!userId) return;
            try {
                setLoading(true);
                const res = await getFollowers(userId);
                setFollowers(res.data.followers || []);
                setUsername(res.data.username || "");
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchFollowers();
    }, [userId]);

    const filtered = followers.filter((u) => u.username.toLowerCase().includes(search.toLowerCase()));

    const handleFollowChange = (uid: number, following: boolean, requestActive: boolean) => {
        setFollowers((prev) => prev.map((u) => (u.id === uid ? { ...u, is_following: following, is_request_active: requestActive } : u)));
    };

    const handleRemove = (uid: number) => {
        setFollowers((prev) => prev.filter((u) => u.id !== uid));
    };

    return (
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh", fontFamily: '"DM Sans", sans-serif' }}>
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
                            Followers
                        </Typography>
                        {username && (
                            <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.75rem" }}>
                                @{username}
                            </Typography>
                        )}
                    </Box>
                </Stack>

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
                        placeholder="Search followers…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        sx={{ flex: 1, fontSize: "0.88rem", fontFamily: '"DM Sans", sans-serif' }}
                    />
                </Box>

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
                        <Typography sx={{ fontFamily: '"Instrument Serif", Georgia, serif', fontSize: "1.2rem", mb: 0.5 }}>
                            {search ? "No results found" : "No followers yet"}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.8rem" }}>
                            {search ? "Try a different search" : "When someone follows this account, they'll appear here"}
                        </Typography>
                    </Box>
                ) : (
                    <Stack>
                        {filtered.map((user) => (
                            <FollowerRow
                                key={user.id}
                                user={user}
                                currentUserId={currentUser?.id}
                                isOwnFollowersList={isOwnFollowersList}
                                onFollowChange={handleFollowChange}
                                onRemove={handleRemove}
                            />
                        ))}
                    </Stack>
                )}
            </Container>
        </Box>
    );
};

export default FollowersPage;
