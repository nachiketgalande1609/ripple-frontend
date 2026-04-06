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
  onFollowRequestResponse: (
    request_id: number,
    response: "accepted" | "rejected",
  ) => void;
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

  const handleNotificationClick = () =>
    navigate(`/profile/${notification.sender_id}`);
  const timeLabel = timeAgo(notification.created_at);

  const isAccepted = notification.request_status === "accepted";
  const isRejected = notification.request_status === "rejected";
  const isPending = notification.request_status === "pending";

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 1,
        borderRadius: "14px",
        border: "1px solid",
        borderColor: (t) => t.palette.divider,
        backgroundColor: (t) => t.palette.background.paper,
        overflow: "hidden",
        transition: "background-color 0.15s ease",
        "&:hover": { backgroundColor: (t) => t.palette.action.hover },
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
              border: "2px solid",
              borderColor: (t) => t.palette.divider,
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
                color: (t) => t.palette.text.primary,
                lineHeight: 1.4,
              }}
            >
              <span style={{ fontWeight: 600 }}>{notification.username}</span>{" "}
              <span style={{ color: theme.palette.text.secondary }}>
                {notification.message}
              </span>
            </Typography>
          }
          secondary={
            <Typography
              sx={{
                fontSize: isMobile ? "0.7rem" : "0.75rem",
                color: (t) => t.palette.text.disabled,
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
              if (!isPending) onFollowBack(notification.sender_id);
            }}
            disabled={isPending || isAccepted}
            sx={{
              borderRadius: "8px",
              fontSize: "0.75rem",
              fontWeight: 600,
              textTransform: "none",
              px: 1.5,
              py: 0.5,
              flexShrink: 0,
              borderColor: isAccepted
                ? "transparent"
                : (t) => t.palette.divider,
              color: isAccepted
                ? (t) => t.palette.text.disabled
                : (t) => t.palette.text.primary,
              backgroundColor: isAccepted
                ? "transparent"
                : (t) => t.palette.action.hover,
              "&:hover:not(:disabled)": {
                backgroundColor: (t) => t.palette.action.selected,
                borderColor: (t) => t.palette.text.disabled,
              },
              "&:disabled": {
                borderColor: "transparent",
                color: (t) => t.palette.text.disabled,
              },
            }}
          >
            {isAccepted ? "Following" : "Follow Back"}
          </Button>
        )}

        {/* Follow request accept/reject */}
        {notification.type === "follow_request" && (
          <Box sx={{ display: "flex", gap: 0.75, flexShrink: 0 }}>
            {isPending ? (
              <>
                <Button
                  variant="contained"
                  size="small"
                  disabled={followRequestAcceptLoading}
                  onClick={(e) => {
                    e.stopPropagation();
                    onFollowRequestResponse(
                      notification.request_id,
                      "accepted",
                    );
                  }}
                  sx={{
                    borderRadius: "20px",
                    textTransform: "none",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    px: 1.5,
                    py: 0.5,
                    minWidth: 68,
                    backgroundColor: (t) => t.palette.text.primary,
                    color: (t) => t.palette.background.default,
                    "&:hover": {
                      backgroundColor: (t) => t.palette.text.secondary,
                    },
                    "&:disabled": {
                      backgroundColor: (t) =>
                        t.palette.action.disabledBackground,
                      color: (t) => t.palette.action.disabled,
                    },
                  }}
                >
                  {followRequestAcceptLoading ? (
                    <CircularProgress
                      size={14}
                      sx={{ color: (t) => t.palette.background.default }}
                    />
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
                    onFollowRequestResponse(
                      notification.request_id,
                      "rejected",
                    );
                  }}
                  sx={{
                    borderRadius: "20px",
                    textTransform: "none",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    px: 1.5,
                    py: 0.5,
                    minWidth: 68,
                    borderColor: (t) => t.palette.divider,
                    color: (t) => t.palette.text.secondary,
                    "&:hover": {
                      borderColor: (t) => t.palette.text.disabled,
                      backgroundColor: (t) => t.palette.action.hover,
                    },
                    "&:disabled": {
                      borderColor: "transparent",
                      color: (t) => t.palette.text.disabled,
                    },
                  }}
                >
                  {followRequestRejectLoading ? (
                    <CircularProgress
                      size={14}
                      sx={{ color: (t) => t.palette.text.disabled }}
                    />
                  ) : (
                    "Decline"
                  )}
                </Button>
              </>
            ) : (
              <Chip
                label={isAccepted ? "Accepted" : isRejected ? "Declined" : null}
                size="small"
                sx={{
                  backgroundColor: (t) => t.palette.action.hover,
                  color: (t) => t.palette.text.disabled,
                  fontSize: "0.72rem",
                  height: 26,
                  border: "1px solid",
                  borderColor: (t) => t.palette.divider,
                }}
              />
            )}
          </Box>
        )}

        {/* Post thumbnail */}
        {(notification.type === "like" || notification.type === "comment") &&
          notification.file_url && (
            <Box
              sx={{
                flexShrink: 0,
                ml: 0.5,
                borderRadius: "8px",
                overflow: "hidden",
                border: "1px solid",
                borderColor: (t) => t.palette.divider,
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
