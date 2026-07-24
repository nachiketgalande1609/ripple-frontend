import { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Avatar,
    Stack,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
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
                borderRadius: "36px",
                p: 0,
                overflow: "hidden",
                bgcolor: "background.paper",
                border: "1px solid",
                borderColor: "divider",
            },
            "& .MuiBackdrop-root": {
                backdropFilter: "blur(8px)",
                backgroundColor: "rgba(0,0,0,0.4)",
            },
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
                    borderColor: "divider",
                }}
            />
            <Typography
                sx={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.95rem",
                    fontWeight: 500,
                    mb: 0.5,
                    color: "text.primary",
                }}
            >
                Remove follower?
            </Typography>
            <Typography
                sx={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.8rem",
                    color: "text.secondary",
                    mb: 2.5,
                    lineHeight: 1.6,
                }}
            >
                <Box component="strong" sx={{ color: "text.primary" }}>@{username}</Box>{" "}
                will be removed from your followers. They won't be notified.
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
                        borderRadius: "12px",
                        py: 0.875,
                        bgcolor: (t) => `${t.palette.error.main}14`,
                        color: "error.main",
                        border: "1px solid",
                        borderColor: (t) => `${t.palette.error.main}40`,
                        boxShadow: "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)",
                        "&:hover": {
                            bgcolor: (t) => `${t.palette.error.main}20`,
                            boxShadow: "inset 3px 3px 10px var(--nav-neo-shadow1), inset -3px -3px 10px var(--nav-neo-shadow2)",
                        },
                        "&:disabled": { opacity: 0.5 },
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
                        borderRadius: "12px",
                        py: 0.875,
                        color: "text.secondary",
                        border: "1px solid",
                        borderColor: "divider",
                        boxShadow: "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)",
                        "&:hover": {
                            bgcolor: "action.hover",
                            color: "text.primary",
                            boxShadow: "inset 3px 3px 10px var(--nav-neo-shadow1), inset -3px -3px 10px var(--nav-neo-shadow2)",
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
                <ListItem
                    component="div"
                    sx={{
                        borderRadius: "28px",
                        px: 1.5,
                        py: 1.25,
                        mx: 1,
                        mb: 0.5,
                        transition: "background-color 0.15s",
                        "&:hover": { bgcolor: "action.hover" },
                        cursor: "default",
                    }}
                >
                    <ListItemAvatar
                        sx={{ minWidth: 54, cursor: "pointer" }}
                        onClick={() => navigate(`/profile/${user.id}`)}
                    >
                        <Avatar
                            src={user.profile_picture || BlankProfileImage}
                            sx={{
                                width: 42,
                                height: 42,
                                border: "1px solid",
                                borderColor: "divider",
                            }}
                        />
                    </ListItemAvatar>
                    <ListItemText
                        onClick={() => navigate(`/profile/${user.id}`)}
                        sx={{ cursor: "pointer", minWidth: 0 }}
                        primary={
                            <Typography
                                sx={{
                                    fontFamily: "'Inter', sans-serif",
                                    fontWeight: 500,
                                    fontSize: "0.845rem",
                                    color: "text.primary",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {user.username}
                            </Typography>
                        }
                    />
                    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ flexShrink: 0, ml: 1 }}>
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

                        {isOwnFollowersList && !isOwnProfile && (
                            <button
                                onClick={() => setConfirmOpen(true)}
                                disabled={removeLoading}
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "6px",
                                    padding: "0 16px",
                                    height: "34px",
                                    minWidth: "100px",
                                    borderRadius: "14px",
                                    border: "none",
                                    background: "var(--nav-bg)",
                                    boxShadow: "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)",
                                    color: "inherit",
                                    fontSize: "13px",
                                    fontWeight: 500,
                                    letterSpacing: "0.01em",
                                    cursor: removeLoading ? "default" : "pointer",
                                    whiteSpace: "nowrap",
                                    userSelect: "none",
                                    outline: "none",
                                    transition: "box-shadow 0.35s cubic-bezier(0.4,0,0.2,1)",
                                    opacity: removeLoading ? 0.6 : 1,
                                }}
                            >
                                <PersonRemove style={{ fontSize: 14, display: "flex" }} />
                                <span>Remove</span>
                            </button>
                        )}
                    </Stack>
                </ListItem>
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

    const currentUser = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") || "null") : {};
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
                bgcolor: "background.default",
                minHeight: "100vh",
                fontFamily: "'Inter', -apple-system, sans-serif",
            }}
        >
            {/* ── Sticky header ── */}
            <Box
                sx={{
                    position: "sticky",
                    top: { xs: "56px", sm: 0 },
                    zIndex: 10,
                    bgcolor: "background.default",
                    px: { xs: 2, sm: 3 },
                    py: 1.25,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.25,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                }}
            >
                <IconButton
                    onClick={() => navigate(-1)}
                    size="small"
                    sx={{
                        width: 36,
                        height: 36,
                        borderRadius: "12px",
                        bgcolor: "var(--nav-bg)",
                        boxShadow: "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)",
                        color: "text.secondary",
                        "&:hover": {
                            boxShadow: "inset 3px 3px 10px var(--nav-neo-shadow1), inset -3px -3px 10px var(--nav-neo-shadow2)",
                            color: "text.primary",
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
                            color: "text.primary",
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
                                color: "text.disabled",
                            }}
                        >
                            @{username}
                        </Typography>
                    )}
                </Box>
            </Box>

            <Box sx={{ px: { xs: 1, sm: 2 }, pt: 1.5, pb: 3, maxWidth: "sm", mx: "auto" }}>
                {/* ── Search bar ── */}
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        px: 1.25,
                        py: 0.6,
                        bgcolor: "var(--nav-bg)",
                        borderRadius: "14px",
                        boxShadow: "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)",
                        mb: 1.5,
                        transition: "box-shadow 0.15s",
                        "&:focus-within": {
                            boxShadow: "inset 3px 3px 10px var(--nav-neo-shadow1), inset -3px -3px 10px var(--nav-neo-shadow2)",
                        },
                        mx: 1,
                    }}
                >
                    <Search sx={{ fontSize: 17, color: "text.disabled", flexShrink: 0 }} />
                    <InputBase
                        placeholder="Search followers…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        sx={{
                            flex: 1,
                            fontSize: "0.875rem",
                            fontFamily: "'Inter', sans-serif",
                            color: "text.primary",
                            "& input::placeholder": { color: "text.disabled" },
                        }}
                    />
                </Box>

                {/* ── List ── */}
                {loading ? (
                    <List disablePadding>
                        {[...Array(6)].map((_, i) => (
                            <ListItem
                                key={i}
                                component="div"
                                sx={{ borderRadius: "28px", px: 1.5, py: 1.25, mx: 1, mb: 0.5 }}
                            >
                                <ListItemAvatar sx={{ minWidth: 54 }}>
                                    <MuiSkeleton
                                        variant="circular"
                                        width={42}
                                        height={42}
                                        sx={{ bgcolor: "action.hover" }}
                                    />
                                </ListItemAvatar>
                                <ListItemText
                                    primary={
                                        <MuiSkeleton
                                            width="42%"
                                            height={14}
                                            sx={{ borderRadius: "5px", bgcolor: "action.hover" }}
                                        />
                                    }
                                />
                                <MuiSkeleton
                                    variant="rounded"
                                    width={68}
                                    height={30}
                                    sx={{ borderRadius: "9px", bgcolor: "action.hover" }}
                                />
                            </ListItem>
                        ))}
                    </List>
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
                                bgcolor: "var(--nav-bg)",
                                boxShadow: "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <PersonOff sx={{ fontSize: 26, color: "text.disabled" }} />
                        </Box>
                        <Box sx={{ textAlign: "center" }}>
                            <Typography
                                sx={{
                                    fontFamily: "'Inter', sans-serif",
                                    fontSize: "0.95rem",
                                    fontWeight: 500,
                                    color: "text.primary",
                                    mb: 0.375,
                                }}
                            >
                                {search ? "No results found" : "No followers yet"}
                            </Typography>
                            <Typography
                                sx={{
                                    fontFamily: "'Inter', sans-serif",
                                    fontSize: "0.8rem",
                                    color: "text.disabled",
                                }}
                            >
                                {search ? "Try a different search" : "When someone follows this account, they'll appear here"}
                            </Typography>
                        </Box>
                    </Box>
                ) : (
                    <List disablePadding>
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
                    </List>
                )}
            </Box>
        </Box>
    );
};

export default FollowersPage;
