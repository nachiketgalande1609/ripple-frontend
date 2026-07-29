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
import { useTranslation } from "react-i18next";
import { timeAgo } from "../../utils/utils";
import BlankProfileImage from "../../static/profile_blank.png";

export interface Notification {
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
  compact?: boolean;
}

const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onFollowBack,
  onFollowRequestResponse,
  followRequestAcceptLoading,
  followRequestRejectLoading,
  compact = false,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();

  const timeLabel = timeAgo(notification.created_at);
  const isAccepted = notification.request_status === "accepted";
  const isRejected = notification.request_status === "rejected";
  const isPending = notification.request_status === "pending";

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/profile/${notification.sender_id}`);
  };
  const handlePostClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (notification.post_id) navigate(`/posts/${notification.post_id}`);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        mb: compact ? 0.5 : 1.2,
        borderRadius: compact ? "16px" : "28px",
        border: "1px solid",
        borderColor: (t: any) => t.palette.divider,
        backgroundColor: compact ? (t: any) => t.palette.action.hover : "var(--nav-bg)",
        boxShadow: "none",
        overflow: "hidden",
        transition: "box-shadow 0.35s cubic-bezier(0.4,0,0.2,1)",
        "&:hover": {
          boxShadow: "inset 3px 3px 10px var(--nav-neo-shadow1), inset -3px -3px 10px var(--nav-neo-shadow2)",
        },
      }}
    >
      <ListItem
        component="div"
        sx={{
          px: compact ? 1.5 : (isMobile ? 1.5 : 2),
          py: compact ? 1 : (isMobile ? 1.25 : 1.8),
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <ListItemAvatar sx={{ minWidth: "unset", cursor: "pointer" }} onClick={handleProfileClick}>
          <Avatar
            src={notification.profile_picture || BlankProfileImage}
            alt={notification.username}
            sx={{
              height: compact ? 36 : (isMobile ? 44 : 50),
              width: compact ? 36 : (isMobile ? 44 : 50),
              border: "2px solid",
              borderColor: (t) => t.palette.divider,
            }}
          />
        </ListItemAvatar>

        <ListItemText
          disableTypography
          primary={
            <Typography sx={{ fontSize: compact ? "0.82rem" : (isMobile ? "0.84rem" : "0.93rem"), color: (t) => t.palette.text.primary, lineHeight: 1.4 }}>
              <span style={{ fontWeight: 600, cursor: "pointer" }} onClick={handleProfileClick}>{notification.username}</span>{" "}
              <span style={{ color: theme.palette.text.secondary }}>{notification.message}</span>
            </Typography>
          }
          secondary={
            <Typography sx={{ fontSize: compact ? "0.68rem" : (isMobile ? "0.7rem" : "0.75rem"), color: (t) => t.palette.text.disabled, mt: 0.4 }}>
              {timeLabel === "Just Now" ? t("notifications.justNow") : t("notifications.timeAgo", { time: timeLabel })}
            </Typography>
          }
          sx={{ flexGrow: 1, my: 0 }}
        />

        {notification.type === "follow" && !compact && (
          <Button
            variant="outlined"
            size="small"
            onClick={(e) => { e.stopPropagation(); if (!isPending) onFollowBack(notification.sender_id); }}
            disabled={isPending || isAccepted}
            sx={{
              borderRadius: "8px", fontSize: "0.75rem", fontWeight: 600, textTransform: "none",
              px: 1.5, py: 0.5, flexShrink: 0,
              borderColor: isAccepted ? "transparent" : (t) => t.palette.divider,
              color: isAccepted ? (t) => t.palette.text.disabled : (t) => t.palette.text.primary,
              backgroundColor: isAccepted ? "transparent" : (t) => t.palette.action.hover,
              "&:hover:not(:disabled)": { backgroundColor: (t) => t.palette.action.selected, borderColor: (t) => t.palette.text.disabled },
              "&:disabled": { borderColor: "transparent", color: (t) => t.palette.text.disabled },
            }}
          >
            {isAccepted ? t("notifications.accepted") : t("notifications.followBack")}
          </Button>
        )}

        {notification.type === "follow_request" && !compact && (
          <Box sx={{ display: "flex", gap: 0.75, flexShrink: 0 }}>
            {isPending ? (
              <>
                <Button variant="contained" size="small" disabled={followRequestAcceptLoading}
                  onClick={(e) => { e.stopPropagation(); onFollowRequestResponse(notification.request_id, "accepted"); }}
                  sx={{ borderRadius: "20px", textTransform: "none", fontSize: "0.75rem", fontWeight: 600, px: 1.5, py: 0.5, minWidth: 68, backgroundColor: (t) => t.palette.text.primary, color: (t) => t.palette.background.default, "&:hover": { backgroundColor: (t) => t.palette.text.secondary }, "&:disabled": { backgroundColor: (t) => t.palette.action.disabledBackground, color: (t) => t.palette.action.disabled } }}
                >
                  {followRequestAcceptLoading ? <CircularProgress size={14} sx={{ color: (t) => t.palette.background.default }} /> : t("notifications.accept")}
                </Button>
                <Button variant="outlined" size="small" disabled={followRequestRejectLoading}
                  onClick={(e) => { e.stopPropagation(); onFollowRequestResponse(notification.request_id, "rejected"); }}
                  sx={{ borderRadius: "20px", textTransform: "none", fontSize: "0.75rem", fontWeight: 600, px: 1.5, py: 0.5, minWidth: 68, borderColor: (t) => t.palette.divider, color: (t) => t.palette.text.secondary, "&:hover": { borderColor: (t) => t.palette.text.disabled, backgroundColor: (t) => t.palette.action.hover }, "&:disabled": { borderColor: "transparent", color: (t) => t.palette.text.disabled } }}
                >
                  {followRequestRejectLoading ? <CircularProgress size={14} sx={{ color: (t) => t.palette.text.disabled }} /> : t("notifications.decline")}
                </Button>
              </>
            ) : (
              <Chip label={isAccepted ? t("notifications.accepted") : isRejected ? t("notifications.declined") : null} size="small"
                sx={{ backgroundColor: (t) => t.palette.action.hover, color: (t) => t.palette.text.disabled, fontSize: "0.72rem", height: 26, border: "1px solid", borderColor: (t) => t.palette.divider }}
              />
            )}
          </Box>
        )}

        {(notification.type === "like" || notification.type === "comment" || notification.type === "tag") && notification.file_url && (
          <Box onClick={handlePostClick} sx={{ flexShrink: 0, ml: 0.5, borderRadius: "8px", overflow: "hidden", border: "1px solid", borderColor: (t) => t.palette.divider, cursor: "pointer", "&:hover": { opacity: 0.85 } }}>
            <img src={notification.file_url} alt="Post" style={{ width: compact ? 36 : (isMobile ? 44 : 50), height: compact ? 36 : (isMobile ? 44 : 50), objectFit: "cover", display: "block" }} />
          </Box>
        )}
      </ListItem>
    </Paper>
  );
};

export default NotificationCard;
