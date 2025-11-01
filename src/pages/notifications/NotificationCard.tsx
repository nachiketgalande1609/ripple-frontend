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
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { timeAgo } from "../../utils/utils";
import BlankProfileImage from "../../static/profile_blank.png";

// Define the Notification interface separately
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

// Define props correctly
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

    return (
        <Paper key={notification.id} sx={{ mb: 1, boxShadow: 2, borderRadius: "20px" }}>
            <ListItem
                component="div"
                onClick={handleNotificationClick}
                sx={{
                    cursor: "pointer",
                    padding: isMobile ? "14px" : "16px",
                    display: "flex",
                    alignItems: "center",
                    height: isMobile ? "80px" : "90px",
                    justifyContent: "space-between",
                    backgroundColor: "#202327",
                    borderRadius: "20px",
                }}
            >
                <ListItemAvatar>
                    <Avatar
                        src={notification.profile_picture || BlankProfileImage}
                        alt={notification.username}
                        sx={{ height: isMobile ? "50px" : "58px", width: isMobile ? "50px" : "58px", mr: 2 }}
                    />
                </ListItemAvatar>
                <ListItemText
                    primary={
                        <Typography sx={{ fontSize: isMobile ? "0.85rem" : "1rem" }}>
                            {notification.username} {notification.message}
                        </Typography>
                    }
                    secondary={
                        <Typography color="gray" sx={{ fontSize: isMobile ? "0.7rem" : "0.8rem" }}>
                            {timeAgo(notification.created_at) === "Just Now"
                                ? timeAgo(notification.created_at)
                                : `${timeAgo(notification.created_at)} ago`}
                        </Typography>
                    }
                    sx={{ flexGrow: 1 }}
                />
                {notification.type === "follow" && (
                    <Button
                        variant="contained"
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (notification.request_status !== "pending") onFollowBack(notification.sender_id);
                        }}
                        disabled={notification.request_status === "pending"}
                        sx={{
                            ml: 2,
                            borderRadius: "10px",
                            backgroundColor: "#ffffff",
                            ":disabled": {
                                backgroundColor: "#202327",
                                color: "#000000",
                            },
                        }}
                    >
                        {notification.request_status === "accepted" ? "Following" : "Follow Back"}
                    </Button>
                )}
                {notification.type === "follow_request" && (
                    <Box sx={{ display: "flex", gap: 1 }}>
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
                                        borderRadius: "10px",
                                        backgroundColor: "#ffffff",
                                        height: "30.75px",
                                        width: "72px",
                                    }}
                                >
                                    {followRequestAcceptLoading ? <CircularProgress size={16} sx={{ color: "#ffffff" }} /> : "Accept"}
                                </Button>
                                <Button
                                    variant="contained"
                                    size="small"
                                    disabled={followRequestRejectLoading}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onFollowRequestResponse(notification.request_id, "rejected");
                                    }}
                                    sx={{
                                        borderRadius: "10px",
                                        backgroundColor: "#ffffff",
                                        height: "30.75px",
                                        width: "72px",
                                    }}
                                >
                                    {followRequestRejectLoading ? <CircularProgress size={16} sx={{ color: "#ffffff" }} /> : "Reject"}
                                </Button>
                            </>
                        ) : (
                            <Button
                                variant="contained"
                                size="small"
                                disabled
                                sx={{
                                    ml: 2,
                                    borderRadius: "10px",
                                    backgroundColor: "#ffffff",
                                    ":disabled": {
                                        backgroundColor: "#000000",
                                        color: "#505050",
                                    },
                                }}
                            >
                                {notification.request_status === "accepted"
                                    ? "Accepted"
                                    : notification.request_status === "rejected"
                                      ? "Rejected"
                                      : null}
                            </Button>
                        )}
                    </Box>
                )}
                {(notification.type === "like" || notification.type === "comment") && notification.file_url && (
                    <Box sx={{ ml: 2, display: "flex", justifyContent: "flex-end", width: "80px" }}>
                        <img
                            src={notification.file_url}
                            alt="Post image"
                            style={{ width: "58px", height: "58px", objectFit: "cover", borderRadius: "8px" }}
                        />
                    </Box>
                )}
            </ListItem>
        </Paper>
    );
};

export default NotificationCard;
