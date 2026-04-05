import {
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Typography,
    Paper,
    Button,
    Box,
    useMediaQuery,
    useTheme,
    CircularProgress,
    Chip,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { timeAgo } from "../../utils/utils";
import BlankProfileImage from "../../static/profile_blank.png";

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

interface NotificationCardProps {
    notification: Notification;
    onFollowBack: (userId: string) => void;
    onFollowRequestResponse: (request_id: number, response: "accepted" | "rejected") => void;
    followRequestAcceptLoading: boolean;
    followRequestRejectLoading: boolean;
}

const NotificationCard: React.FC<NotificationCardProps> = ({
    notification,
    onFollowBack,
    onFollowRequestResponse,
    followRequestAcceptLoading,
    followRequestRejectLoading,
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const navigate = useNavigate();

    const handleNotificationClick = () => {
        navigate(`/profile/${notification.sender_id}`);
    };

    const timeLabel = timeAgo(notification.created_at);

    return (
        <Paper
            key={notification.id}
            elevation={0}
            sx={{
                mb: 1,
                borderRadius: "14px",
                border: "1px solid rgba(255,255,255,0.06)",
                backgroundColor: "#1a1d21",
                overflow: "hidden",
                transition: "background-color 0.15s ease",
                "&:hover": {
                    backgroundColor: "#1f2328",
                },
            }}
        >
            <ListItem
                component="div"
                onClick={handleNotificationClick}
                sx={{
                    cursor: "pointer",
                    px: isMobile ? 1.5 : 2,
                    py: isMobile ? 1.25 : 1.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                }}
            >
                {/* Avatar */}
                <ListItemAvatar sx={{ minWidth: "unset" }}>
                    <Avatar
                        src={notification.profile_picture || BlankProfileImage}
                        alt={notification.username}
                        sx={{
                            height: isMobile ? 44 : 50,
                            width: isMobile ? 44 : 50,
                            border: "2px solid rgba(255,255,255,0.08)",
                        }}
                    />
                </ListItemAvatar>

                {/* Text */}
                <ListItemText
                    disableTypography
                    primary={
                        <Typography
                            sx={{
                                fontSize: isMobile ? "0.84rem" : "0.93rem",
                                color: "#e8eaed",
                                lineHeight: 1.4,
                            }}
                        >
                            <span style={{ fontWeight: 600 }}>{notification.username}</span>{" "}
                            <span style={{ color: "#9aa0a6" }}>{notification.message}</span>
                        </Typography>
                    }
                    secondary={
                        <Typography
                            sx={{
                                fontSize: isMobile ? "0.7rem" : "0.75rem",
                                color: "#5f6368",
                                mt: 0.4,
                            }}
                        >
                            {timeLabel === "Just Now" ? timeLabel : `${timeLabel} ago`}
                        </Typography>
                    }
                    sx={{ flexGrow: 1, my: 0 }}
                />

                {/* Follow back button */}
                {notification.type === "follow" && (
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (notification.request_status !== "pending") onFollowBack(notification.sender_id);
                        }}
                        disabled={notification.request_status === "pending" || notification.request_status === "accepted"}
                        sx={{
                            borderRadius: "8px",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            textTransform: "none",
                            px: 1.5,
                            py: 0.5,
                            flexShrink: 0,
                            borderColor: notification.request_status === "accepted" ? "transparent" : "rgba(255,255,255,0.2)",
                            color: notification.request_status === "accepted" ? "#5f6368" : "#e8eaed",
                            backgroundColor: notification.request_status === "accepted" ? "transparent" : "rgba(255,255,255,0.06)",
                            "&:hover:not(:disabled)": {
                                backgroundColor: "rgba(255,255,255,0.12)",
                                borderColor: "rgba(255,255,255,0.3)",
                            },
                            "&:disabled": {
                                borderColor: "transparent",
                                color: "#5f6368",
                            },
                        }}
                    >
                        {notification.request_status === "accepted" ? "Following" : "Follow Back"}
                    </Button>
                )}

                {/* Follow request accept/reject */}
                {notification.type === "follow_request" && (
                    <Box sx={{ display: "flex", gap: 0.75, flexShrink: 0 }}>
                        {notification.request_status === "pending" ? (
                            <>
                                <Button
                                    variant="contained"
                                    size="small"
                                    disabled={followRequestAcceptLoading}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onFollowRequestResponse(notification.request_id, "accepted");
                                    }}
                                    sx={{
                                        borderRadius: "8px",
                                        textTransform: "none",
                                        fontSize: "0.75rem",
                                        fontWeight: 600,
                                        px: 1.5,
                                        py: 0.5,
                                        minWidth: 68,
                                        backgroundColor: "#e8eaed",
                                        color: "#111",
                                        "&:hover": { backgroundColor: "#f1f3f4" },
                                        "&:disabled": { backgroundColor: "rgba(255,255,255,0.08)", color: "#5f6368" },
                                    }}
                                >
                                    {followRequestAcceptLoading ? (
                                        <CircularProgress size={14} sx={{ color: "#555" }} />
                                    ) : (
                                        "Accept"
                                    )}
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    disabled={followRequestRejectLoading}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onFollowRequestResponse(notification.request_id, "rejected");
                                    }}
                                    sx={{
                                        borderRadius: "8px",
                                        textTransform: "none",
                                        fontSize: "0.75rem",
                                        fontWeight: 600,
                                        px: 1.5,
                                        py: 0.5,
                                        minWidth: 68,
                                        borderColor: "rgba(255,255,255,0.15)",
                                        color: "#9aa0a6",
                                        "&:hover": {
                                            borderColor: "rgba(255,255,255,0.25)",
                                            backgroundColor: "rgba(255,255,255,0.05)",
                                        },
                                        "&:disabled": { borderColor: "transparent", color: "#5f6368" },
                                    }}
                                >
                                    {followRequestRejectLoading ? (
                                        <CircularProgress size={14} sx={{ color: "#555" }} />
                                    ) : (
                                        "Decline"
                                    )}
                                </Button>
                            </>
                        ) : (
                            <Chip
                                label={
                                    notification.request_status === "accepted"
                                        ? "Accepted"
                                        : notification.request_status === "rejected"
                                          ? "Declined"
                                          : null
                                }
                                size="small"
                                sx={{
                                    backgroundColor: "rgba(255,255,255,0.05)",
                                    color: "#5f6368",
                                    fontSize: "0.72rem",
                                    height: 26,
                                    border: "1px solid rgba(255,255,255,0.08)",
                                }}
                            />
                        )}
                    </Box>
                )}

                {/* Post thumbnail for like/comment */}
                {(notification.type === "like" || notification.type === "comment") && notification.file_url && (
                    <Box
                        sx={{
                            flexShrink: 0,
                            ml: 0.5,
                            borderRadius: "8px",
                            overflow: "hidden",
                            border: "1px solid rgba(255,255,255,0.08)",
                        }}
                    >
                        <img
                            src={notification.file_url}
                            alt="Post"
                            style={{
                                width: isMobile ? 44 : 50,
                                height: isMobile ? 44 : 50,
                                objectFit: "cover",
                                display: "block",
                            }}
                        />
                    </Box>
                )}
            </ListItem>
        </Paper>
    );
};

export default NotificationCard;