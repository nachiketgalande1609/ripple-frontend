import { useState, useEffect } from "react";
import { Box, Container, List, Typography, Skeleton, useMediaQuery } from "@mui/material";
import { followUser, getNotifications, respondToFollowRequest } from "../../services/api";
import { useGlobalStore } from "../../store/store";
import NotificationCard from "./NotificationCard";

interface Notification {
    id: number;
    type: string;
    message: string;
    post_id: number | null;
    created_at: string;
    sender_id: string;
    username: string;
    profile_picture: string;
    file_url?: string;
    request_status: string;
    requester_id?: number;
    request_id: number;
}

const NotificationSkeleton = () => (
    <Box
        sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            px: 2,
            py: 1.5,
            mb: 1,
            borderRadius: "14px",
            backgroundColor: "#1a1d21",
            border: "1px solid rgba(255,255,255,0.06)",
        }}
    >
        <Skeleton variant="circular" width={50} height={50} sx={{ bgcolor: "rgba(255,255,255,0.06)", flexShrink: 0 }} />
        <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="60%" height={18} sx={{ bgcolor: "rgba(255,255,255,0.06)" }} />
            <Skeleton variant="text" width="30%" height={14} sx={{ bgcolor: "rgba(255,255,255,0.04)", mt: 0.5 }} />
        </Box>
    </Box>
);

const NotificationsPage = () => {
    const { unreadNotificationsCount, resetNotificationsCount } = useGlobalStore();

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const currentUser = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") || "") : {};
    const isLarge = useMediaQuery("(min-width:1281px)");
    const [followRequestAcceptLoading, setFollowRequestAcceptLoading] = useState(false);
    const [followRequestRejectLoading, setFollowRequestRejectLoading] = useState(false);

    async function fetchNotifications() {
        if (!currentUser?.id) return;
        try {
            setLoading(true);
            const res = await getNotifications();
            setNotifications(res.data);
        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchNotifications();
        resetNotificationsCount();
    }, [currentUser?.id, unreadNotificationsCount]);

    const handleFollowBack = async (userId: string) => {
        if (!currentUser?.id || !userId) return;
        try {
            setLoading(true);
            const res = await followUser(currentUser.id.toString(), userId);
            if (res?.success) await fetchNotifications();
        } catch (error) {
            console.error("Failed to follow the user:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFollowRequestResponse = async (request_id: number, response: "accepted" | "rejected") => {
        response === "accepted" ? setFollowRequestAcceptLoading(true) : setFollowRequestRejectLoading(true);
        try {
            setLoading(true);
            const res = await respondToFollowRequest(request_id, response);
            if (res?.success) await fetchNotifications();
        } catch (error) {
            console.error(`Failed to ${response} the follow request:`, error);
        } finally {
            setLoading(false);
            setFollowRequestAcceptLoading(false);
            setFollowRequestRejectLoading(false);
        }
    };

    return (
        <Container
            sx={{
                maxWidth: "100%",
                width: isLarge ? "600px" : "525px",
                mt: 4,
                px: { xs: 1.5, sm: 2 },
            }}
        >
            {/* Header */}
            <Typography
                sx={{
                    fontSize: "1.05rem",
                    fontWeight: 600,
                    color: "#e8eaed",
                    mb: 2,
                    px: 0.5,
                }}
            >
                Notifications
            </Typography>

            {loading ? (
                <>
                    {[...Array(5)].map((_, i) => (
                        <NotificationSkeleton key={i} />
                    ))}
                </>
            ) : notifications.length === 0 ? (
                <Box
                    sx={{
                        mt: 8,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 1,
                    }}
                >
                    <Typography sx={{ fontSize: "2rem" }}>🔔</Typography>
                    <Typography sx={{ color: "#5f6368", fontSize: "0.9rem" }}>
                        You're all caught up
                    </Typography>
                </Box>
            ) : (
                <List disablePadding>
                    {notifications.map((notification) => (
                        <NotificationCard
                            key={notification.id}
                            notification={notification}
                            onFollowBack={handleFollowBack}
                            onFollowRequestResponse={handleFollowRequestResponse}
                            followRequestAcceptLoading={followRequestAcceptLoading}
                            followRequestRejectLoading={followRequestRejectLoading}
                        />
                    ))}
                </List>
            )}
        </Container>
    );
};

export default NotificationsPage;