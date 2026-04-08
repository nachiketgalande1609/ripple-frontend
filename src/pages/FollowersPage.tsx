import { useState, useEffect } from "react";
import {
    Box,
    Container,
    Typography,
    Avatar,
    Stack,
    IconButton,
    Skeleton as MuiSkeleton,
    Fade,
    InputBase,
    Button,
    Dialog,
    DialogContent,
} from "@mui/material";
import { ArrowBack, Search, PersonOff, PersonRemove } from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import BlankProfileImage from "../static/profile_blank.png";
import FollowButton from "./profile/FollowButton";
import { getFollowers, followUser, cancelFollowRequest, unfollowUser, removeFollower } from "../services/api";

const ACCENT = "#7c5cfc";

interface FollowerUser {
    id: number;
    username: string;
    profile_picture?: string;
    is_following: boolean;
    is_request_active: boolean;
    is_private?: boolean;
    follow_status?: string;
}

/* ── Confirm dialog ───────────────────────────────────────────── */
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
                borderRadius: "16px",
                p: 0,
                overflow: "hidden",
                border: "1px solid",
                borderColor: (t) => t.palette.divider,
                boxShadow: "0 16px 40px rgba(0,0,0,0.2)",
                transform: "translateZ(0)",
                willChange: "transform",
            },
            "& .MuiBackdrop-root": { backgroundColor: "rgba(0,0,0,0.4)" },
        }}
    >
        <DialogContent sx={{ p: 2.5, textAlign: "center" }}>
            <Avatar
                src={profilePicture || BlankProfileImage}
                sx={{
                    width: 54,
                    height: 54,
                    mx: "auto",
                    mb: 1.75,
                    border: "1px solid",
                    borderColor: (t) => t.palette.divider,
                }}
            />
            <Typography
                sx={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.95rem",
                    fontWeight: 500,
                    mb: 0.5,
                    color: (t) => t.palette.text.primary,
                }}
            >
                Remove follower?
            </Typography>
            <Typography
                sx={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.8rem",
                    color: (t) => t.palette.text.secondary,
                    mb: 2.5,
                    lineHeight: 1.6,
                }}
            >
                <strong>@{username}</strong> will be removed from your followers. They won't be notified.
            </Typography>

            <Stack spacing={0.875}>
                <Button
                    fullWidth
                    onClick={onConfirm}
                    disabled={loading}
                    sx={{
                        textTransform: "none",
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 500,
                        fontSize: "0.84rem",
                        borderRadius: "10px",
                        py: 0.875,
                        backgroundColor: (t) => `${t.palette.error.main}14`,
                        color: (t) => t.palette.error.main,
                        border: "1px solid",
                        borderColor: (t) => `${t.palette.error.main}30`,
                        "&:hover": { backgroundColor: (t) => `${t.palette.error.main}20` },
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
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 500,
                        fontSize: "0.84rem",
                        borderRadius: "10px",
                        py: 0.875,
                        color: (t) => t.palette.text.secondary,
                        border: "1px solid",
                        borderColor: (t) => t.palette.divider,
                        "&:hover": {
                            backgroundColor: (t) => t.palette.action.hover,
                            borderColor: (t) => t.palette.text.disabled,
                        },
                    }}
                >
                    Cancel
                </Button>
            </Stack>
        </DialogContent>
    </Dialog>
);

/* ── Follower row ─────────────────────────────────────────────── */
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
            <Fade in timeout={250}>
                <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{
                        py: 1,
                        px: 1,
                        borderRadius: "10px",
                        transition: "background-color 0.15s",
                        "&:hover": { backgroundColor: (t) => t.palette.action.hover },
                    }}
                >
                    <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1.25}
                        sx={{ cursor: "pointer", flex: 1, minWidth: 0 }}
                        onClick={() => navigate(`/profile/${user.id}`)}
                    >
                        <Avatar
                            src={user.profile_picture || BlankProfileImage}
                            sx={{
                                width: 40,
                                height: 40,
                                flexShrink: 0,
                                border: "1px solid",
                                borderColor: (t) => t.palette.divider,
                            }}
                        />
                        <Typography
                            sx={{
                                fontFamily: "'Inter', sans-serif",
                                fontWeight: 500,
                                fontSize: "0.875rem",
                                color: (t) => t.palette.text.primary,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {user.username}
                        </Typography>
                    </Stack>

                    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ flexShrink: 0, ml: 1.5 }}>
                        {isOwnFollowersList && !isOwnProfile && (
                            <Button
                                size="small"
                                onClick={() => setConfirmOpen(true)}
                                disabled={removeLoading}
                                startIcon={<PersonRemove sx={{ fontSize: 13 }} />}
                                sx={{
                                    textTransform: "none",
                                    fontFamily: "'Inter', sans-serif",
                                    fontSize: "0.78rem",
                                    fontWeight: 500,
                                    borderRadius: "9px",
                                    px: 1.25,
                                    py: 0.5,
                                    color: (t) => t.palette.text.secondary,
                                    border: "1px solid",
                                    borderColor: (t) => t.palette.divider,
                                    whiteSpace: "nowrap",
                                    transition: "all 0.15s",
                                    "&:hover": {
                                        borderColor: (t) => `${t.palette.error.main}50`,
                                        color: (t) => t.palette.error.main,
                                        backgroundColor: (t) => `${t.palette.error.main}0a`,
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

    const currentUser = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") || "") : {};
    const isOwnFollowersList = currentUser?.id?.toString() === userId;

    const [followers, setFollowers] = useState<FollowerUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [username, setUsername] = useState("");

    useEffect(() => {
        const fetch = async () => {
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
        fetch();
    }, [userId]);

    const filtered = followers.filter((u) => u.username.toLowerCase().includes(search.toLowerCase()));

    const handleFollowChange = (uid: number, following: boolean, requestActive: boolean) => {
        setFollowers((prev) => prev.map((u) => (u.id === uid ? { ...u, is_following: following, is_request_active: requestActive } : u)));
    };

    const handleRemove = (uid: number) => {
        setFollowers((prev) => prev.filter((u) => u.id !== uid));
    };

    return (
        <Box
            sx={{
                backgroundColor: (t) => t.palette.background.default,
                minHeight: "100vh",
                fontFamily: "'Inter', -apple-system, sans-serif",
            }}
        >
            <Container maxWidth="sm" sx={{ py: 2.5, px: { xs: 2, sm: 3 } }}>
                {/* ── Header ── */}
                <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 2.5 }}>
                    <IconButton
                        onClick={() => navigate(-1)}
                        size="small"
                        sx={{
                            width: 34,
                            height: 34,
                            borderRadius: "9px",
                            border: "1px solid",
                            borderColor: (t) => t.palette.divider,
                            color: (t) => t.palette.text.secondary,
                            "&:hover": {
                                backgroundColor: (t) => t.palette.action.hover,
                                color: (t) => t.palette.text.primary,
                            },
                        }}
                    >
                        <ArrowBack sx={{ fontSize: 17 }} />
                    </IconButton>
                    <Box>
                        <Typography
                            sx={{
                                fontFamily: "'Inter', sans-serif",
                                fontSize: "1rem",
                                fontWeight: 500,
                                color: (t) => t.palette.text.primary,
                                lineHeight: 1.3,
                            }}
                        >
                            Followers
                        </Typography>
                        {username && (
                            <Typography
                                sx={{
                                    fontFamily: "'Inter', sans-serif",
                                    fontSize: "0.75rem",
                                    color: (t) => t.palette.text.disabled,
                                }}
                            >
                                @{username}
                            </Typography>
                        )}
                    </Box>
                </Stack>

                {/* ── Search bar ── */}
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        px: 1.375,
                        py: 0.625,
                        backgroundColor: (t) => t.palette.action.hover,
                        borderRadius: "10px",
                        border: "1px solid",
                        borderColor: (t) => t.palette.divider,
                        mb: 2,
                        transition: "border-color 0.15s",
                        "&:focus-within": { borderColor: `${ACCENT}80` },
                    }}
                >
                    <Search
                        sx={{
                            fontSize: 17,
                            color: (t) => t.palette.text.disabled,
                            flexShrink: 0,
                        }}
                    />
                    <InputBase
                        placeholder="Search followers…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        sx={{
                            flex: 1,
                            fontSize: "0.875rem",
                            fontFamily: "'Inter', sans-serif",
                            color: (t) => t.palette.text.primary,
                            "& input::placeholder": { color: (t) => t.palette.text.disabled },
                        }}
                    />
                </Box>

                {/* ── Count label ── */}
                {!loading && (
                    <Typography
                        sx={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: "0.7rem",
                            fontWeight: 500,
                            letterSpacing: "0.07em",
                            textTransform: "uppercase",
                            color: (t) => t.palette.text.disabled,
                            mb: 1,
                        }}
                    >
                        {filtered.length} {filtered.length === 1 ? "person" : "people"}
                    </Typography>
                )}

                {/* ── List ── */}
                {loading ? (
                    <Stack spacing={0.5}>
                        {[...Array(6)].map((_, i) => (
                            <Stack key={i} direction="row" alignItems="center" spacing={1.25} sx={{ py: 1, px: 1 }}>
                                <MuiSkeleton
                                    variant="circular"
                                    width={40}
                                    height={40}
                                    sx={{ flexShrink: 0, bgcolor: (t) => t.palette.action.hover }}
                                />
                                <Box sx={{ flex: 1 }}>
                                    <MuiSkeleton
                                        width="40%"
                                        height={14}
                                        sx={{
                                            borderRadius: "5px",
                                            bgcolor: (t) => t.palette.action.hover,
                                        }}
                                    />
                                </Box>
                                <MuiSkeleton
                                    variant="rounded"
                                    width={68}
                                    height={30}
                                    sx={{
                                        borderRadius: "9px",
                                        bgcolor: (t) => t.palette.action.hover,
                                    }}
                                />
                            </Stack>
                        ))}
                    </Stack>
                ) : filtered.length === 0 ? (
                    <Box
                        sx={{
                            textAlign: "center",
                            py: 8,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 1.5,
                        }}
                    >
                        <Box
                            sx={{
                                width: 56,
                                height: 56,
                                borderRadius: "16px",
                                backgroundColor: (t) => t.palette.action.hover,
                                border: "1px solid",
                                borderColor: (t) => t.palette.divider,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <PersonOff sx={{ fontSize: 26, color: (t) => t.palette.text.disabled }} />
                        </Box>
                        <Box sx={{ textAlign: "center" }}>
                            <Typography
                                sx={{
                                    fontFamily: "'Inter', sans-serif",
                                    fontSize: "0.95rem",
                                    fontWeight: 500,
                                    color: (t) => t.palette.text.primary,
                                    mb: 0.375,
                                }}
                            >
                                {search ? "No results found" : "No followers yet"}
                            </Typography>
                            <Typography
                                sx={{
                                    fontFamily: "'Inter', sans-serif",
                                    fontSize: "0.8rem",
                                    color: (t) => t.palette.text.disabled,
                                }}
                            >
                                {search ? "Try a different search" : "When someone follows this account, they'll appear here"}
                            </Typography>
                        </Box>
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
