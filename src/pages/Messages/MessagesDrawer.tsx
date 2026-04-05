import React, { useEffect, useState } from "react";
import {
    List,
    ListItem,
    ListItemAvatar,
    Avatar,
    ListItemText,
    Typography,
    Box,
    IconButton,
    Skeleton,
} from "@mui/material";
import { PersonAdd as PersonAddIcon } from "@mui/icons-material";
import { getFollowingUsers } from "../../services/api";
import NewChatUsersList from "./NewChatUsersList";
import BlankProfileImage from "../../static/profile_blank.png";
import { timeAgo } from "../../utils/utils";

type MessagesDrawerProps = {
    users: User[];
    onlineUsers: string[];
    selectedUser: User | null;
    handleUserClick: (userId: number) => void;
    anchorEl: HTMLElement | null;
    setAnchorEl: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
};

type User = {
    id: number;
    username: string;
    profile_picture: string;
    isOnline: boolean;
    latest_message: string;
    latest_message_timestamp: string;
    unread_count: number;
};

const UserSkeleton = () => (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 1.5, py: 1.25 }}>
        <Skeleton variant="circular" width={46} height={46} sx={{ bgcolor: "rgba(255,255,255,0.06)", flexShrink: 0 }} />
        <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="50%" height={16} sx={{ bgcolor: "rgba(255,255,255,0.06)" }} />
            <Skeleton variant="text" width="75%" height={13} sx={{ bgcolor: "rgba(255,255,255,0.04)", mt: 0.5 }} />
        </Box>
    </Box>
);

const MessagesDrawer: React.FC<MessagesDrawerProps> = ({
    users,
    onlineUsers,
    selectedUser,
    handleUserClick,
    anchorEl,
    setAnchorEl,
}) => {
    const [usersList, setUsersList] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);

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

    const sortedUsers = [...users].sort(
        (a, b) =>
            new Date(b.latest_message_timestamp).getTime() -
            new Date(a.latest_message_timestamp).getTime()
    );

    return (
        <Box
            sx={{
                width: { sm: "250px", md: "300px", lg: "340px" },
                backgroundColor: "#111316",
                color: "white",
                borderRight: "1px solid rgba(255,255,255,0.07)",
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
                    borderBottom: "1px solid rgba(255,255,255,0.07)",
                    flexShrink: 0,
                }}
            >
                <Typography sx={{ fontWeight: 600, fontSize: "1rem", color: "#e8eaed" }}>
                    Messages
                </Typography>
                <IconButton
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                    size="small"
                    sx={{
                        color: "#9aa0a6",
                        "&:hover": { color: "#e8eaed", backgroundColor: "rgba(255,255,255,0.06)" },
                    }}
                >
                    <PersonAddIcon fontSize="small" />
                </IconButton>
            </Box>

            <NewChatUsersList
                anchorEl={anchorEl}
                open={open}
                setAnchorEl={setAnchorEl}
                usersList={usersList}
                handleUserClick={handleUserClick}
            />

            {/* List */}
            <Box sx={{ overflowY: "auto", flex: 1 }}>
                {loading ? (
                    <>
                        {[...Array(6)].map((_, i) => (
                            <UserSkeleton key={i} />
                        ))}
                    </>
                ) : sortedUsers.length === 0 ? (
                    <Box sx={{ mt: 6, textAlign: "center" }}>
                        <Typography sx={{ color: "#5f6368", fontSize: "0.85rem" }}>
                            No conversations yet
                        </Typography>
                    </Box>
                ) : (
                    <List disablePadding>
                        {sortedUsers.map((user) => {
                            const isOnline = onlineUsers.includes(user.id.toString());
                            const unreadCount = user.unread_count || 0;
                            const isSelected = selectedUser?.id === user.id;
                            const timestamp = timeAgo(user.latest_message_timestamp);

                            return (
                                <ListItem
                                    component="button"
                                    key={user.id}
                                    onClick={() => handleUserClick(user.id)}
                                    sx={{
                                        px: 1.5,
                                        py: 1.25,
                                        width: "100%",
                                        border: "none",
                                        cursor: "pointer",
                                        backgroundColor: isSelected
                                            ? "rgba(255,255,255,0.06)"
                                            : "transparent",
                                        transition: "background-color 0.12s ease",
                                        "&:hover": {
                                            backgroundColor: isSelected
                                                ? "rgba(255,255,255,0.08)"
                                                : "rgba(255,255,255,0.04)",
                                        },
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 0,
                                    }}
                                >
                                    {/* Avatar with online dot */}
                                    <ListItemAvatar sx={{ position: "relative", minWidth: "unset", mr: 1.5 }}>
                                        <Avatar
                                            src={user.profile_picture || BlankProfileImage}
                                            sx={{ width: 46, height: 46 }}
                                        />
                                        {isOnline && (
                                            <Box
                                                sx={{
                                                    width: 10,
                                                    height: 10,
                                                    borderRadius: "50%",
                                                    backgroundColor: "#4ade80",
                                                    position: "absolute",
                                                    bottom: 1,
                                                    right: 1,
                                                    border: "2px solid #111316",
                                                }}
                                            />
                                        )}
                                    </ListItemAvatar>

                                    {/* Text */}
                                    <ListItemText
                                        disableTypography
                                        primary={
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "baseline",
                                                    gap: 1,
                                                }}
                                            >
                                                <Typography
                                                    sx={{
                                                        fontSize: "0.88rem",
                                                        fontWeight: unreadCount > 0 ? 600 : 500,
                                                        color: unreadCount > 0 ? "#e8eaed" : "#c4c7cc",
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        whiteSpace: "nowrap",
                                                    }}
                                                >
                                                    {user.username}
                                                </Typography>
                                                <Typography
                                                    sx={{
                                                        fontSize: "0.7rem",
                                                        color: "#5f6368",
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    {timestamp}
                                                </Typography>
                                            </Box>
                                        }
                                        secondary={
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "center",
                                                    mt: 0.25,
                                                }}
                                            >
                                                <Typography
                                                    sx={{
                                                        fontSize: "0.78rem",
                                                        color: unreadCount > 0 ? "#9aa0a6" : "#5f6368",
                                                        whiteSpace: "nowrap",
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        maxWidth: unreadCount > 0 ? "calc(100% - 28px)" : "100%",
                                                    }}
                                                >
                                                    {user.latest_message}
                                                </Typography>
                                                {unreadCount > 0 && (
                                                    <Box
                                                        sx={{
                                                            ml: 1,
                                                            flexShrink: 0,
                                                            minWidth: 18,
                                                            height: 18,
                                                            borderRadius: "9px",
                                                            backgroundColor: "#1976D2",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            px: 0.5,
                                                        }}
                                                    >
                                                        <Typography sx={{ fontSize: "0.65rem", fontWeight: 700, color: "#fff" }}>
                                                            {unreadCount > 99 ? "99+" : unreadCount}
                                                        </Typography>
                                                    </Box>
                                                )}
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

export default MessagesDrawer;