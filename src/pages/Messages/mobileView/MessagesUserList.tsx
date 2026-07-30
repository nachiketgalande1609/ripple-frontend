import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Box,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Typography,
    Skeleton,
    TextField,
    InputAdornment,
    IconButton,
    useTheme,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import NotificationsOffRoundedIcon from "@mui/icons-material/NotificationsOffRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import BlankProfileImage from "../../../static/profile_blank.png";
import { timeAgo } from "../../../utils/utils";

type User = {
    id: number;
    username: string;
    profile_picture: string;
    isOnline: boolean;
    latest_message: string;
    latest_message_timestamp: string;
    unread_count: number;
};

type Group = {
    id: number;
    name: string;
    profile_picture: string | null;
    member_count: number;
    latest_message: string | null;
    latest_message_sender: string | null;
    latest_message_timestamp: string | null;
};

type MessagesUserListProps = {
    users: User[];
    groups?: Group[];
    onlineUsers: string[];
    handleUserClick: (userId: number) => void;
    handleGroupClick?: (groupId: number) => void;
    activeUserId?: number;
    activeGroupId?: number;
    loading?: boolean;
    mutedUserIds?: Set<number>;
};

const AVATAR_GROUP_COLORS = [
    { bg: "#E8F5E9", color: "#2E7D32" },
    { bg: "#EDE7F6", color: "#4527A0" },
    { bg: "#FFF3E0", color: "#E65100" },
    { bg: "#E3F2FD", color: "#1565C0" },
];
const getGroupAvatarColor = (name: string) => {
    const idx = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_GROUP_COLORS.length;
    return AVATAR_GROUP_COLORS[idx];
};

const AVATAR_COLORS = [
    { bg: "#E6F1FB", color: "#185FA5" },
    { bg: "#EEEDFE", color: "#534AB7" },
    { bg: "#E1F5EE", color: "#0F6E56" },
    { bg: "#FAEEDA", color: "#854F0B" },
    { bg: "#FAECE7", color: "#993C1D" },
    { bg: "#FBEAF0", color: "#993556" },
    { bg: "#EAF3DE", color: "#3B6D11" },
    { bg: "#FCEBEB", color: "#A32D2D" },
];

const getAvatarColor = (username: string) => {
    const index = username.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % AVATAR_COLORS.length;
    return AVATAR_COLORS[index];
};

const getInitials = (username: string) =>
    username.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

const UserSkeleton = () => (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 1.75, py: 1.25 }}>
        <Skeleton variant="circular" width={42} height={42} sx={{ bgcolor: (t) => t.palette.action.hover, flexShrink: 0 }} />
        <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="45%" height={14} sx={{ bgcolor: (t) => t.palette.action.hover }} />
            <Skeleton variant="text" width="70%" height={12} sx={{ bgcolor: (t) => t.palette.action.hover, mt: 0.5 }} />
        </Box>
    </Box>
);

const MessagesUserList: React.FC<MessagesUserListProps> = ({
    users,
    groups = [],
    onlineUsers,
    handleUserClick,
    handleGroupClick,
    activeUserId,
    activeGroupId,
    loading = false,
    mutedUserIds = new Set(),
}) => {
    const { t } = useTranslation();
    const theme = useTheme();
    const [search, setSearch] = useState("");

    const combinedItems = useMemo(() => {
        const userItems = users.map((u) => ({ ...u, kind: "user" as const, sortTs: u.latest_message_timestamp || "" }));
        const groupItems = groups.map((g) => ({ ...g, kind: "group" as const, sortTs: g.latest_message_timestamp || "" }));
        return [...userItems, ...groupItems].sort((a, b) => new Date(b.sortTs).getTime() - new Date(a.sortTs).getTime());
    }, [users, groups]);

    const filteredItems = useMemo(() => {
        const q = search.trim().toLowerCase();
        return q
            ? combinedItems.filter((item) =>
                item.kind === "user" ? item.username.toLowerCase().includes(q) : item.name.toLowerCase().includes(q)
              )
            : combinedItems;
    }, [combinedItems, search]);

    return (
        <Box
            sx={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                bgcolor: (t) => t.palette.background.default,
                color: (t) => t.palette.text.primary,
            }}
        >
            {/* Search */}
            <Box sx={{ px: 1, pt: 1, pb: 1.5, flexShrink: 0 }}>
                <TextField
                    fullWidth
                    placeholder={t("messages.searchPlaceholder")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    variant="outlined"
                    size="small"
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: theme.palette.text.disabled, fontSize: 20 }} />
                            </InputAdornment>
                        ),
                        endAdornment: search ? (
                            <InputAdornment position="end">
                                <IconButton size="small" onClick={() => setSearch("")} sx={{ color: theme.palette.text.disabled, p: 0.25 }}>
                                    <CloseIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                            </InputAdornment>
                        ) : null,
                    }}
                    sx={{
                        "& .MuiOutlinedInput-root": {
                            bgcolor: "var(--nav-bg)",
                            borderRadius: "14px",
                            fontSize: "0.9rem",
                            color: theme.palette.text.primary,
                            boxShadow: "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)",
                            transition: "box-shadow 0.2s ease",
                            "& fieldset": { border: "none" },
                            "&:hover fieldset": { border: "none" },
                            "&.Mui-focused fieldset": { border: "none" },
                            "&.Mui-focused": {
                                boxShadow: "inset 3px 3px 10px var(--nav-neo-shadow1), inset -3px -3px 10px var(--nav-neo-shadow2)",
                            },
                        },
                        "& input::placeholder": { color: theme.palette.text.disabled, opacity: 1 },
                    }}
                />
            </Box>

            {/* List */}
            <Box sx={{ overflowY: "auto", flex: 1 }}>
                {loading ? (
                    [...Array(7)].map((_, i) => <UserSkeleton key={i} />)
                ) : filteredItems.length === 0 ? (
                    <Box sx={{ mt: 6, textAlign: "center", px: 2 }}>
                        <Typography sx={{ color: (t) => t.palette.text.disabled, fontSize: "0.82rem" }}>
                            {search ? t("messages.noResults") : t("messages.noConversations")}
                        </Typography>
                    </Box>
                ) : (
                    <List disablePadding>
                        {filteredItems.map((item) => {
                            if (item.kind === "group") {
                                const gc = getGroupAvatarColor(item.name);
                                const isSelected = activeGroupId === item.id;
                                const ts = item.latest_message_timestamp ? timeAgo(item.latest_message_timestamp) : "";
                                const preview = item.latest_message
                                    ? (item.latest_message_sender ? `${item.latest_message_sender}: ${item.latest_message}` : item.latest_message)
                                    : `${item.member_count} members`;
                                return (
                                    <ListItem
                                        component="button"
                                        key={`group-${item.id}`}
                                        onClick={() => handleGroupClick?.(item.id)}
                                        sx={{
                                            px: 1.5, py: 1.6, mx: 1, mb: 0.75,
                                            width: "calc(100% - 16px)", border: "none", cursor: "pointer",
                                            backgroundColor: "var(--nav-bg)",
                                            boxShadow: isSelected
                                                ? "inset 3px 3px 10px var(--nav-neo-shadow1), inset -3px -3px 10px var(--nav-neo-shadow2)"
                                                : "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)",
                                            borderRadius: "28px",
                                            transition: "background-color 0.35s cubic-bezier(0.4,0,0.2,1), box-shadow 0.35s cubic-bezier(0.4,0,0.2,1)",
                                            "&:hover": { backgroundColor: "transparent" },
                                            "&:focus": { outline: "none" },
                                            display: "flex", alignItems: "center", gap: 0,
                                        }}
                                    >
                                        <ListItemAvatar sx={{ minWidth: "unset", mr: 1.5 }}>
                                            {item.profile_picture ? (
                                                <Box component="img" src={item.profile_picture} sx={{ width: 42, height: 42, borderRadius: "50%", objectFit: "cover", display: "block" }} />
                                            ) : (
                                                <Box sx={{ width: 42, height: 42, borderRadius: "50%", bgcolor: gc.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                    <GroupsRoundedIcon sx={{ fontSize: 20, color: gc.color }} />
                                                </Box>
                                            )}
                                        </ListItemAvatar>
                                        <ListItemText
                                            disableTypography
                                            primary={
                                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 1, mb: 0.25 }}>
                                                    <Typography sx={{ fontSize: "0.845rem", fontWeight: 500, color: (t) => t.palette.text.primary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                        {item.name}
                                                    </Typography>
                                                    <Typography sx={{ fontSize: "0.68rem", color: (t) => t.palette.text.disabled, flexShrink: 0 }}>
                                                        {ts}
                                                    </Typography>
                                                </Box>
                                            }
                                            secondary={
                                                <Typography sx={{ fontSize: "0.76rem", color: (t) => t.palette.text.disabled, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                    {preview}
                                                </Typography>
                                            }
                                            sx={{ my: 0, overflow: "hidden" }}
                                        />
                                    </ListItem>
                                );
                            }

                            const isOnline = onlineUsers.includes(item.id.toString());
                            const unreadCount = item.unread_count || 0;
                            const isSelected = activeUserId === item.id;
                            const timestamp = timeAgo(item.latest_message_timestamp);
                            const avatarColor = getAvatarColor(item.username);
                            const initials = getInitials(item.username);
                            const isMuted = mutedUserIds.has(item.id);

                            return (
                                <ListItem
                                    component="button"
                                    key={`user-${item.id}`}
                                    onClick={() => handleUserClick(item.id)}
                                    sx={{
                                        px: 1.5, py: 1.6, mx: 1, mb: 0.75,
                                        width: "calc(100% - 16px)", border: "none", cursor: "pointer",
                                        backgroundColor: "var(--nav-bg)",
                                        boxShadow: isSelected
                                            ? "inset 3px 3px 10px var(--nav-neo-shadow1), inset -3px -3px 10px var(--nav-neo-shadow2)"
                                            : "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)",
                                        borderRadius: "28px",
                                        transition: "background-color 0.35s cubic-bezier(0.4,0,0.2,1), box-shadow 0.35s cubic-bezier(0.4,0,0.2,1)",
                                        "&:hover": { backgroundColor: "transparent" },
                                        "&:focus": { outline: "none" },
                                        display: "flex", alignItems: "center", gap: 0,
                                    }}
                                >
                                    <ListItemAvatar sx={{ position: "relative", minWidth: "unset", mr: 1.5 }}>
                                        {item.profile_picture ? (
                                            <Box component="img" src={item.profile_picture || BlankProfileImage} sx={{ width: 42, height: 42, borderRadius: "50%", objectFit: "cover", display: "block" }} />
                                        ) : (
                                            <Box sx={{ width: 42, height: 42, borderRadius: "50%", backgroundColor: avatarColor.bg, color: avatarColor.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 600, flexShrink: 0 }}>
                                                {initials}
                                            </Box>
                                        )}
                                        {isOnline && (
                                            <Box sx={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: (t) => t.palette.success.main, position: "absolute", bottom: 1, right: 1, border: "2px solid", borderColor: (t) => t.palette.background.paper }} />
                                        )}
                                    </ListItemAvatar>
                                    <ListItemText
                                        disableTypography
                                        primary={
                                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 1, mb: 0.25 }}>
                                                <Typography sx={{ fontSize: "0.845rem", fontWeight: unreadCount > 0 ? 600 : 500, color: (t) => t.palette.text.primary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {item.username}
                                                </Typography>
                                                <Typography sx={{ fontSize: "0.68rem", color: (t) => unreadCount > 0 ? t.palette.primary.main : t.palette.text.disabled, flexShrink: 0, fontWeight: unreadCount > 0 ? 600 : 400 }}>
                                                    {timestamp}
                                                </Typography>
                                            </Box>
                                        }
                                        secondary={
                                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <Typography sx={{ fontSize: "0.76rem", color: (t) => unreadCount > 0 ? t.palette.text.secondary : t.palette.text.disabled, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: unreadCount > 0 ? 500 : 400, maxWidth: isMuted || unreadCount > 0 ? "calc(100% - 28px)" : "100%" }}>
                                                    {item.latest_message}
                                                </Typography>
                                                {isMuted ? (
                                                    <NotificationsOffRoundedIcon sx={{ ml: 1, flexShrink: 0, fontSize: "0.85rem", color: (t) => t.palette.text.disabled }} />
                                                ) : unreadCount > 0 ? (
                                                    <Box sx={{ ml: 1, flexShrink: 0, minWidth: 17, height: 17, borderRadius: "9px", backgroundColor: (t) => t.palette.primary.main, display: "flex", alignItems: "center", justifyContent: "center", px: 0.5 }}>
                                                        <Typography sx={{ fontSize: "0.62rem", fontWeight: 600, color: "#fff", lineHeight: 1 }}>
                                                            {unreadCount > 99 ? "99+" : unreadCount}
                                                        </Typography>
                                                    </Box>
                                                ) : null}
                                            </Box>
                                        }
                                        sx={{ my: 0, overflow: "hidden" }}
                                    />
                                </ListItem>
                            );
                        })}
                    </List>
                )}
            </Box>
        </Box>
    );
};

export default MessagesUserList;
