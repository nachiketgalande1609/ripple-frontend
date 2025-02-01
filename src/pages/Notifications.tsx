import { useState, useEffect } from "react";
import { Container, List, ListItem, ListItemText, CircularProgress, ListItemAvatar, Avatar, Typography, Paper, Button, Box } from "@mui/material";
import { followUser, getNotifications } from "../services/api";
import { useNavigate } from "react-router-dom";

interface Notification {
    id: number;
    type: string;
    message: string;
    post_id: number | null;
    created_at: string;
    sender_id: string;
    username: string;
    profile_picture: string;
    is_following: boolean;
    image_url?: string; // Add image_url field for post images
}

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const navigate = useNavigate();
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

    async function fetchNotifications() {
        if (!currentUser?.id) return;

        try {
            setLoading(true);
            const res = await getNotifications(currentUser.id);
            setNotifications(res.data); // Assuming res.data is the array of notifications
        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchNotifications();
    }, [currentUser?.id]);

    const handleFollowBack = async (userId: string) => {
        if (currentUser?.id && userId) {
            try {
                const res = await followUser(currentUser.id.toString(), userId);
                if (res?.success) {
                    fetchNotifications();
                }
            } catch (error) {
                console.error("Failed to follow the user:", error);
            }
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        navigate(`/profile/${notification.sender_id}`);
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 4 }}>
            {loading ? (
                <CircularProgress sx={{ display: "block", mx: "auto", mt: 3 }} />
            ) : notifications.length === 0 ? (
                <Typography variant="body2" sx={{ textAlign: "center", mt: 3, color: "gray" }}>
                    No new notifications.
                </Typography>
            ) : (
                <List>
                    {notifications.map((notification) => (
                        <Paper key={notification.id} sx={{ mb: 1, borderRadius: 2, boxShadow: 2 }}>
                            <ListItem
                                component="div"
                                onClick={() => handleNotificationClick(notification)}
                                sx={{
                                    cursor: "pointer",
                                    p: 2,
                                    display: "flex",
                                    alignItems: "center",
                                    height: "90px",
                                    justifyContent: "space-between",
                                }}
                            >
                                <ListItemAvatar>
                                    <Avatar
                                        src={notification.profile_picture}
                                        alt={notification.username}
                                        sx={{ height: "58px", width: "58px", mr: 2 }}
                                    />
                                </ListItemAvatar>
                                <ListItemText
                                    primary={
                                        <Typography variant="body1">
                                            {notification.username} {notification.message}
                                        </Typography>
                                    }
                                    secondary={
                                        <Typography variant="caption" color="gray">
                                            {new Date(notification.created_at).toLocaleString()}
                                        </Typography>
                                    }
                                    sx={{ flexGrow: 1 }}
                                />
                                {notification.type === "follow" && (
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={
                                            notification.is_following
                                                ? () => {}
                                                : (e) => {
                                                      e.stopPropagation();
                                                      handleFollowBack(notification.sender_id);
                                                  }
                                        }
                                        disabled={notification.is_following}
                                        sx={{ ml: 2 }}
                                    >
                                        {notification.is_following ? "Following" : "Follow Back"}
                                    </Button>
                                )}
                                {(notification.type === "like" || notification.type === "comment") && notification.image_url && (
                                    <Box sx={{ ml: 2, display: "flex", justifyContent: "flex-end", width: "80px" }}>
                                        <img
                                            src={notification.image_url}
                                            alt="Post image"
                                            style={{
                                                width: "58px",
                                                height: "58px",
                                                objectFit: "cover",
                                                borderRadius: "8px",
                                            }}
                                        />
                                    </Box>
                                )}
                            </ListItem>
                        </Paper>
                    ))}
                </List>
            )}
        </Container>
    );
};

export default NotificationsPage;
