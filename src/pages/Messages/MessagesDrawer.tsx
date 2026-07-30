import React, { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { List, ListItem, ListItemAvatar, ListItemText, Typography, Box, IconButton, Skeleton, InputBase } from "@mui/material";
import { PersonAdd as PersonAddIcon, Search as SearchIcon } from "@mui/icons-material";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import NotificationsOffRoundedIcon from "@mui/icons-material/NotificationsOffRounded";
import { getFollowingUsers } from "../../services/api";
import NewChatUsersList from "./NewChatUsersList";
import BlankProfileImage from "../../static/profile_blank.png";
import { timeAgo } from "../../utils/utils";
import { formatLastSeen } from "../../utils/lastSeen";
import { useGlobalStore } from "../../store/store";
import CreateGroupDialog from "./CreateGroupDialog";

type Group = {
    id: number;
    name: string;
    profile_picture: string | null;
    member_count: number;
    latest_message: string | null;
    latest_message_sender: string | null;
    latest_message_timestamp: string | null;
};

type MessagesDrawerProps = {
    users: User[];
    groups: Group[];
    onlineUsers: string[];
    selectedUser: User | null;
    selectedGroupId: number | null;
    handleUserClick: (userId: number) => void;
    handleGroupClick: (groupId: number) => void;
    anchorEl: HTMLElement | null;
    setAnchorEl: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
    mutedUserIds: Set<number>;
    onGroupCreated: (group: Group) => void;
};

type User = {
    id: number;
    username: string;
    profile_picture: string;
    isOnline: boolean;
    last_seen?: string | null;
    latest_message: string;
    latest_message_timestamp: string;
    unread_count: number;
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
    username
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

const UserSkeleton = () => (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 1.75, py: 1.25 }}>
        <Skeleton variant="circular" width={42} height={42} sx={{ bgcolor: (t) => t.palette.action.hover, flexShrink: 0 }} />
        <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="45%" height={14} sx={{ bgcolor: (t) => t.palette.action.hover }} />
            <Skeleton variant="text" width="70%" height={12} sx={{ bgcolor: (t) => t.palette.action.hover, mt: 0.5 }} />
        </Box>
    </Box>
);

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

const MessagesDrawer: React.FC<MessagesDrawerProps> = ({
    users,
    groups,
    onlineUsers,
    selectedUser,
    selectedGroupId,
    handleUserClick,
    handleGroupClick,
    anchorEl,
    setAnchorEl,
    mutedUserIds,
    onGroupCreated,
}) => {
    const { t } = useTranslation();
    const { hideActivity } = useGlobalStore();
    const [usersList, setUsersList] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [createGroupOpen, setCreateGroupOpen] = useState(false);

    const open = Boolean(anchorEl);

    const fetchUsersList = async () => {
        setLoading(true);
        try {
            const response = await getFollowingUsers();
            if (response.success) setUsersList(response.data);
        } catch (error) {
            console.error("Error fetching users list:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsersList();
    }, []);

    type ConversationItem =
        | ({ kind: "user" } & User)
        | ({ kind: "group" } & Group);

    const allItems = useMemo((): ConversationItem[] => {
        const userItems: ConversationItem[] = users.map((u) => ({ kind: "user" as const, ...u }));
        const groupItems: ConversationItem[] = groups.map((g) => ({ kind: "group" as const, ...g }));
        return [...userItems, ...groupItems].sort((a, b) => {
            const ta = a.kind === "user" ? a.latest_message_timestamp : a.latest_message_timestamp;
            const tb = b.kind === "user" ? b.latest_message_timestamp : b.latest_message_timestamp;
            if (!ta) return 1;
            if (!tb) return -1;
            return new Date(tb).getTime() - new Date(ta).getTime();
        });
    }, [users, groups]);

    const filteredItems = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return allItems;
        return allItems.filter((item) =>
            item.kind === "user"
                ? item.username.toLowerCase().includes(q)
                : item.name.toLowerCase().includes(q)
        );
    }, [allItems, search]);

    return (
        <Box
            sx={{
                width: { sm: "250px", md: "300px", lg: "320px" },
                backgroundColor: (t) => t.palette.background.paper,
                color: (t) => t.palette.text.primary,
                borderRight: "1px solid",
                borderColor: (t) => t.palette.divider,
                height: "100vh",
                display: "flex",
                flexDirection: "column",
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    px: 2,
                    py: 1.75,
                    flexShrink: 0,
                }}
            >
                <Typography
                    sx={{
                        fontWeight: 600,
                        fontSize: "0.975rem",
                        color: (t) => t.palette.text.primary,
                    }}
                >
                    {t("messages.title")}
                </Typography>
                <Box sx={{ display: "flex", gap: 0.75 }}>
                    <IconButton
                        onClick={() => setCreateGroupOpen(true)}
                        size="small"
                        title="New group"
                        sx={{
                            width: 34,
                            height: 34,
                            border: "none",
                            borderRadius: "11px",
                            backgroundColor: "var(--nav-bg)",
                            boxShadow: "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)",
                            color: (t) => t.palette.text.secondary,
                            transition: "box-shadow 0.2s ease, color 0.2s ease",
                            "&:hover": {
                                color: (t) => t.palette.text.primary,
                                backgroundColor: "var(--nav-bg)",
                                boxShadow: "inset 3px 3px 10px var(--nav-neo-shadow1), inset -3px -3px 10px var(--nav-neo-shadow2)",
                            },
                        }}
                    >
                        <GroupAddIcon sx={{ fontSize: 15 }} />
                    </IconButton>
                    <IconButton
                        onClick={(e) => setAnchorEl(e.currentTarget)}
                        size="small"
                        title="New chat"
                        sx={{
                            width: 34,
                            height: 34,
                            border: "none",
                            borderRadius: "11px",
                            backgroundColor: "var(--nav-bg)",
                            boxShadow: "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)",
                            color: (t) => t.palette.text.secondary,
                            transition: "box-shadow 0.2s ease, color 0.2s ease",
                            "&:hover": {
                                color: (t) => t.palette.text.primary,
                                backgroundColor: "var(--nav-bg)",
                                boxShadow: "inset 3px 3px 10px var(--nav-neo-shadow1), inset -3px -3px 10px var(--nav-neo-shadow2)",
                            },
                        }}
                    >
                        <PersonAddIcon sx={{ fontSize: 15 }} />
                    </IconButton>
                </Box>
            </Box>

            {/* Search */}
            <Box
                sx={{
                    px: 1,
                    py: 1.5,
                    flexShrink: 0,
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        px: 1.25,
                        py: 0.6,
                        borderRadius: "14px",
                        backgroundColor: "var(--nav-bg)",
                        boxShadow: "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)",
                        transition: "box-shadow 0.2s ease",
                        "&:focus-within": {
                            boxShadow: "inset 3px 3px 10px var(--nav-neo-shadow1), inset -3px -3px 10px var(--nav-neo-shadow2)",
                        },
                    }}
                >
                    <SearchIcon
                        sx={{
                            fontSize: 15,
                            color: (t) => t.palette.text.disabled,
                            flexShrink: 0,
                        }}
                    />
                    <InputBase
                        placeholder={t("messages.searchPlaceholder")}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        sx={{
                            flex: 1,
                            fontSize: "0.8rem",
                            color: (t) => t.palette.text.primary,
                            "& input::placeholder": {
                                color: (t) => t.palette.text.disabled,
                                opacity: 1,
                            },
                        }}
                    />
                </Box>
            </Box>

            <NewChatUsersList anchorEl={anchorEl} open={open} setAnchorEl={setAnchorEl} usersList={usersList} handleUserClick={handleUserClick} />

            {/* List */}
            <Box sx={{ overflowY: "auto", flex: 1 }}>
                {loading ? (
                    [...Array(6)].map((_, i) => <UserSkeleton key={i} />)
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
                                const isSelected = selectedGroupId === item.id;
                                const gc = getGroupAvatarColor(item.name);
                                const ts = item.latest_message_timestamp ? timeAgo(item.latest_message_timestamp) : "";
                                const preview = item.latest_message
                                    ? (item.latest_message_sender ? `${item.latest_message_sender}: ${item.latest_message}` : item.latest_message)
                                    : `${item.member_count} members`;
                                return (
                                    <ListItem
                                        component="button"
                                        key={`group-${item.id}`}
                                        onClick={() => handleGroupClick(item.id)}
                                        sx={{
                                            px: 1.5, py: 0, mx: 1, mb: 0.75, height: 72,
                                            width: "calc(100% - 16px)", border: "none", cursor: "pointer",
                                            backgroundColor: isSelected ? "var(--nav-bg)" : "transparent",
                                            boxShadow: isSelected ? "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)" : "none",
                                            borderRadius: "28px", transition: "background-color 0.35s cubic-bezier(0.4,0,0.2,1), box-shadow 0.35s cubic-bezier(0.4,0,0.2,1)",
                                            "&:hover": { backgroundColor: "transparent" }, "&:focus": { outline: "none" }, display: "flex", alignItems: "center",
                                        }}
                                    >
                                        <ListItemAvatar sx={{ minWidth: "unset", mr: 1.5 }}>
                                            {item.profile_picture ? (
                                                <Box component="img" src={item.profile_picture} sx={{ width: 42, height: 42, borderRadius: "50%", objectFit: "cover" }} />
                                            ) : (
                                                <Box sx={{ width: 42, height: 42, borderRadius: "50%", bgcolor: gc.bg, color: gc.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                    <GroupsRoundedIcon sx={{ fontSize: 20 }} />
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

                            const user = item;
                            const isOnline = !hideActivity && onlineUsers.includes(user.id.toString());
                            const unreadCount = user.unread_count || 0;
                            const isSelected = selectedUser?.id === user.id;
                            const timestamp = timeAgo(user.latest_message_timestamp);
                            const avatarColor = getAvatarColor(user.username);
                            const initials = getInitials(user.username);
                            const isMuted = mutedUserIds.has(user.id);

                            return (
                                <ListItem
                                    component="button"
                                    key={`user-${user.id}`}
                                    onClick={() => handleUserClick(user.id)}
                                    sx={{
                                        px: 1.5, py: 0, mx: 1, mb: 0.75, height: 72,
                                        width: "calc(100% - 16px)", border: "none", cursor: "pointer",
                                        backgroundColor: isSelected ? "var(--nav-bg)" : "transparent",
                                        boxShadow: isSelected ? "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)" : "none",
                                        borderRadius: "28px", borderBottom: "none",
                                        transition: "background-color 0.35s cubic-bezier(0.4,0,0.2,1), box-shadow 0.35s cubic-bezier(0.4,0,0.2,1)",
                                        "&:last-of-type": { borderBottom: "none" },
                                        "&:hover": { backgroundColor: "transparent" },
                                        "&:focus": { outline: "none" },
                                        display: "flex", alignItems: "center",
                                    }}
                                >
                                    <ListItemAvatar sx={{ position: "relative", minWidth: "unset", mr: 1.5 }}>
                                        {user.profile_picture ? (
                                            <Box component="img" src={user.profile_picture || BlankProfileImage} sx={{ width: 42, height: 42, borderRadius: "50%", objectFit: "cover", display: "block" }} />
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
                                                    {user.username}
                                                </Typography>
                                                <Typography sx={{ fontSize: "0.68rem", color: (t) => (unreadCount > 0 ? t.palette.primary.main : t.palette.text.disabled), flexShrink: 0, fontWeight: unreadCount > 0 ? 600 : 400 }}>
                                                    {timestamp}
                                                </Typography>
                                            </Box>
                                        }
                                        secondary={
                                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                                    <Typography sx={{ fontSize: "0.76rem", color: (t) => (unreadCount > 0 ? t.palette.text.secondary : t.palette.text.disabled), whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: unreadCount > 0 ? 500 : 400, maxWidth: isMuted || unreadCount > 0 ? "calc(100% - 28px)" : "100%" }}>
                                                        {user.latest_message}
                                                    </Typography>
                                                    {!isOnline && !hideActivity && formatLastSeen(user.last_seen, false) && (
                                                        <Typography sx={{ fontSize: "0.67rem", color: "text.disabled", whiteSpace: "nowrap", lineHeight: 1.3 }}>
                                                            {formatLastSeen(user.last_seen, false)}
                                                        </Typography>
                                                    )}
                                                </Box>
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
            <CreateGroupDialog
                open={createGroupOpen}
                onClose={() => setCreateGroupOpen(false)}
                onGroupCreated={(g) => { onGroupCreated(g); setCreateGroupOpen(false); }}
            />
        </Box>
    );
};

export default MessagesDrawer;
