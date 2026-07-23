import { useEffect, useState } from "react";
import { Box, Typography, Skeleton, Avatar, Button } from "@mui/material";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import { getBlockedUsers, unblockUser } from "../../services/api";
import { useAppNotifications } from "../../hooks/useNotification";
import BlankProfileImage from "../../static/profile_blank.png";

type BlockedUser = {
    id: number;
    username: string;
    profile_picture: string;
};

const SkeletonCard = () => (
    <Box
        sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            px: 2.5,
            py: 2,
            mb: 1,
            borderRadius: "20px",
            border: "1px solid",
            borderColor: (t) => t.palette.divider,
            backgroundColor: "var(--nav-bg)",
        }}
    >
        <Skeleton variant="circular" width={44} height={44} sx={{ flexShrink: 0, bgcolor: (t) => t.palette.action.hover }} />
        <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="40%" height={16} sx={{ bgcolor: (t) => t.palette.action.hover, mb: 0.5 }} />
            <Skeleton variant="text" width="25%" height={13} sx={{ bgcolor: (t) => t.palette.action.hover }} />
        </Box>
        <Skeleton variant="rounded" width={76} height={32} sx={{ borderRadius: "10px", bgcolor: (t) => t.palette.action.hover }} />
    </Box>
);

const BlockedUserCard = ({
    user,
    onUnblock,
    unblocking,
}: {
    user: BlockedUser;
    onUnblock: (id: number) => void;
    unblocking: boolean;
}) => (
    <Box
        sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            px: 2.5,
            py: 2,
            mb: 1,
            borderRadius: "20px",
            border: "1px solid",
            borderColor: (t) => t.palette.divider,
            backgroundColor: "var(--nav-bg)",
            transition: "box-shadow 0.25s cubic-bezier(0.4,0,0.2,1)",
            "&:hover": {
                boxShadow: "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)",
                borderColor: "transparent",
            },
        }}
    >
        <Avatar
            src={user.profile_picture || BlankProfileImage}
            alt={user.username}
            sx={{ width: 44, height: 44, flexShrink: 0 }}
        />
        <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
                sx={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: (t) => t.palette.text.primary,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                }}
            >
                {user.username}
            </Typography>
        </Box>
        <Button
            size="small"
            disabled={unblocking}
            onClick={() => onUnblock(user.id)}
            sx={{
                fontSize: "0.78rem",
                fontWeight: 600,
                textTransform: "none",
                color: (t) => t.palette.text.secondary,
                borderRadius: "10px",
                px: 1.75,
                py: 0.75,
                flexShrink: 0,
                border: "1px solid",
                borderColor: (t) => t.palette.divider,
                backgroundColor: "var(--nav-bg)",
                transition: "box-shadow 0.25s cubic-bezier(0.4,0,0.2,1), color 0.2s ease",
                "&:hover": {
                    boxShadow: "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)",
                    borderColor: "transparent",
                    color: (t) => t.palette.text.primary,
                    backgroundColor: "var(--nav-bg)",
                },
            }}
        >
            Unblock
        </Button>
    </Box>
);

const BlockedUsers = () => {
    const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [unblockingId, setUnblockingId] = useState<number | null>(null);
    const notifications = useAppNotifications();

    const load = async () => {
        try {
            const data = await getBlockedUsers();
            setBlockedUsers(data);
        } catch {
            notifications.show("Failed to load blocked users", { severity: "error", autoHideDuration: 3000 });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const handleUnblock = async (id: number) => {
        setUnblockingId(id);
        try {
            await unblockUser(id);
            setBlockedUsers((prev) => prev.filter((u) => u.id !== id));
            notifications.show("User unblocked", { severity: "success", autoHideDuration: 2500 });
        } catch {
            notifications.show("Failed to unblock user", { severity: "error", autoHideDuration: 3000 });
        } finally {
            setUnblockingId(null);
        }
    };

    return (
        <Box sx={{ width: "100%", maxWidth: 620 }}>
            {/* Header */}
            <Box sx={{ mb: 2.5 }}>
                <Typography sx={{ fontSize: "0.95rem", fontWeight: 600, color: (t) => t.palette.text.primary }}>
                    Blocked Accounts
                </Typography>
                <Typography sx={{ fontSize: "0.78rem", color: (t) => t.palette.text.disabled, mt: 0.25 }}>
                    People you have blocked cannot see your profile or posts
                </Typography>
            </Box>

            {/* List */}
            {loading ? (
                [1, 2, 3].map((i) => <SkeletonCard key={i} />)
            ) : blockedUsers.length === 0 ? (
                <Box sx={{ py: 8, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                    <BlockOutlinedIcon sx={{ fontSize: 40, color: (t) => t.palette.action.disabled }} />
                    <Typography sx={{ color: (t) => t.palette.text.disabled, fontSize: "0.88rem" }}>
                        You haven't blocked anyone
                    </Typography>
                </Box>
            ) : (
                blockedUsers.map((user) => (
                    <BlockedUserCard
                        key={user.id}
                        user={user}
                        onUnblock={handleUnblock}
                        unblocking={unblockingId === user.id}
                    />
                ))
            )}

            {!loading && blockedUsers.length > 0 && (
                <Typography sx={{ fontSize: "0.72rem", color: (t) => t.palette.text.disabled, mt: 2, lineHeight: 1.6 }}>
                    Blocked users will not be notified. You can unblock them at any time.
                </Typography>
            )}
        </Box>
    );
};

export default BlockedUsers;
