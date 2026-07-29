import { useState, useEffect } from "react";
import { Avatar, Box, Paper, Typography, useMediaQuery, useTheme } from "@mui/material";
import { ExpandMoreRounded, ExpandLessRounded } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { timeAgo } from "../../utils/utils";
import { useTranslation } from "react-i18next";
import NotificationCard, { Notification } from "./NotificationCard";
import BlankProfileImage from "../../static/profile_blank.png";

interface GroupedNotificationCardProps {
  notifications: Notification[];
  onFollowBack: (userId: string) => void;
  onFollowRequestResponse: (request_id: number, response: "accepted" | "rejected") => void;
  followRequestAcceptLoading: boolean;
  followRequestRejectLoading: boolean;
}

const STYLE_ID = "grouped-notif-unstack-styles";

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = STYLE_ID;
  el.textContent = `
    @keyframes notif-unstack {
      0%   { opacity: 0; transform: translateY(var(--unstack-from, -20px)) scaleX(0.96); }
      55%  { opacity: 1; }
      100% { opacity: 1; transform: translateY(0) scaleX(1); }
    }
    .notif-unstack-item {
      animation: notif-unstack 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
    }
  `;
  document.head.appendChild(el);
}

const GroupedNotificationCard: React.FC<GroupedNotificationCardProps> = ({
  notifications,
  onFollowBack,
  onFollowRequestResponse,
  followRequestAcceptLoading,
  followRequestRejectLoading,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => { injectStyles(); }, []);
  const theme = useTheme();
  const { t } = useTranslation();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();

  if (notifications.length === 1) {
    return (
      <NotificationCard
        notification={notifications[0]}
        onFollowBack={onFollowBack}
        onFollowRequestResponse={onFollowRequestResponse}
        followRequestAcceptLoading={followRequestAcceptLoading}
        followRequestRejectLoading={followRequestRejectLoading}
      />
    );
  }

  const latest = notifications[0];
  const count = notifications.length;
  const avatarSize = isMobile ? 38 : 42;
  const overlap = isMobile ? 14 : 16;

  const uniqueSenders = notifications.filter(
    (n, i, arr) => arr.findIndex((m) => m.sender_id === n.sender_id) === i
  );
  const avatars = uniqueSenders.slice(0, 3);
  const stackWidth = avatarSize + (avatars.length - 1) * (avatarSize - overlap);

  const uniqueNames = uniqueSenders.map((n) => n.username);
  const senderLabel =
    uniqueNames.length === 1
      ? `${uniqueNames[0]} and ${count - 1} other${count - 2 > 0 ? "s" : ""}`
      : uniqueNames.length === 2
      ? `${uniqueNames[0]} and ${uniqueNames[1]}`
      : `${uniqueNames[0]}, ${uniqueNames[1]} and ${count - 2} other${count - 2 > 1 ? "s" : ""}`;

  const timeLabel = timeAgo(latest.created_at);

  const handlePostClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (latest.post_id) navigate(`/posts/${latest.post_id}`);
  };

  const cardRadius = "20px";
  const stackCount = Math.min(count - 1, 2);
  const peekGap = 7;
  // Total padding = peekGap per layer so each strip has its own visible band
  const wrapperPb = expanded ? 0 : stackCount * peekGap;

  const isDark = theme.palette.mode === "dark";

  return (
    <Box sx={{ mb: 1.2, pb: `${wrapperPb}px`, position: "relative" }}>
      {/* Layer 2 — deepest, narrowest, peeks furthest below */}
      {!expanded && stackCount >= 2 && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 14,
            right: 14,
            backgroundColor: "var(--nav-bg)",
            borderRadius: cardRadius,
            border: "1px solid",
            borderColor: (t) => t.palette.divider,
            zIndex: 0,
          }}
        />
      )}
      {/* Layer 1 — middle, slightly narrower */}
      {!expanded && stackCount >= 1 && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            bottom: stackCount >= 2 ? `${peekGap}px` : 0,
            left: 7,
            right: 7,
            backgroundColor: "var(--nav-bg)",
            borderRadius: cardRadius,
            border: "1px solid",
            borderColor: (t) => t.palette.divider,
            zIndex: 1,
          }}
        />
      )}

      {/* Main card */}
      <Paper
        elevation={0}
        onClick={() => { setExpanded((v) => { if (!v) setAnimKey((k) => k + 1); return !v; }); }}
        sx={{
          position: "relative",
          zIndex: 2,
          borderRadius: cardRadius,
          border: "1px solid",
          borderColor: (t) => t.palette.divider,
          backgroundColor: "var(--nav-bg)",
          boxShadow: "none",
          overflow: "hidden",
          cursor: "pointer",
        }}
      >
        <Box sx={{ px: isMobile ? 1.5 : 2, py: isMobile ? 1.25 : 1.5, display: "flex", alignItems: "center", gap: 1.5 }}>
          {/* Stacked avatars */}
          <Box sx={{ position: "relative", flexShrink: 0, width: stackWidth, height: avatarSize }}>
            {avatars.map((n, i) => (
              <Avatar
                key={n.sender_id}
                src={n.profile_picture || BlankProfileImage}
                sx={{
                  width: avatarSize,
                  height: avatarSize,
                  border: "2px solid",
                  borderColor: "var(--nav-bg)",
                  position: "absolute",
                  left: i * (avatarSize - overlap),
                  zIndex: avatars.length - i,
                  boxShadow: i > 0 ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
                }}
              />
            ))}
          </Box>

          {/* Text */}
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: isMobile ? "0.83rem" : "0.9rem",
                color: (t) => t.palette.text.primary,
                lineHeight: 1.45,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              <span style={{ fontWeight: 600 }}>{senderLabel}</span>{" "}
              <span style={{ color: theme.palette.text.secondary }}>{latest.message}</span>
            </Typography>
            <Typography sx={{ fontSize: isMobile ? "0.69rem" : "0.74rem", color: (t) => t.palette.text.disabled, mt: 0.35 }}>
              {timeLabel === "Just Now" ? t("notifications.justNow") : t("notifications.timeAgo", { time: timeLabel })}
            </Typography>
          </Box>

          {/* Post thumbnail */}
          {(latest.type === "like" || latest.type === "comment" || latest.type === "tag") && latest.file_url && (
            <Box
              onClick={handlePostClick}
              sx={{
                flexShrink: 0,
                borderRadius: "10px",
                overflow: "hidden",
                border: "1px solid",
                borderColor: (t) => t.palette.divider,
                cursor: "pointer",
                "&:hover": { opacity: 0.85 },
              }}
            >
              <img
                src={latest.file_url}
                alt="Post"
                style={{ width: isMobile ? 42 : 48, height: isMobile ? 42 : 48, objectFit: "cover", display: "block" }}
              />
            </Box>
          )}

          {/* Expand chevron */}
          <Box
            sx={{
              flexShrink: 0,
              width: 26,
              height: 26,
              borderRadius: "50%",
              backgroundColor: (t) => t.palette.action.hover,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: (t) => t.palette.text.disabled,
            }}
          >
            {expanded ? <ExpandLessRounded sx={{ fontSize: 16 }} /> : <ExpandMoreRounded sx={{ fontSize: 16 }} />}
          </Box>
        </Box>
      </Paper>

      {/* Expanded list — no container, cards animate out directly */}
      {expanded && (
        <Box sx={{ position: "relative", zIndex: 2, mt: 0.75 }}>
          {notifications.map((n, i) => (
            <Box
              key={`${animKey}-${n.id}`}
              className="notif-unstack-item"
              style={{
                animationDelay: `${i * 75}ms`,
                ["--unstack-from" as string]: `-${16 + i * 8}px`,
              }}
            >
              <NotificationCard
                notification={n}
                onFollowBack={onFollowBack}
                onFollowRequestResponse={onFollowRequestResponse}
                followRequestAcceptLoading={followRequestAcceptLoading}
                followRequestRejectLoading={followRequestRejectLoading}
                compact
              />
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default GroupedNotificationCard;
