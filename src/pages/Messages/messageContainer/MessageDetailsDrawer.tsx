import {
  Typography,
  Box,
  Drawer,
  IconButton,
  useMediaQuery,
  useTheme,
  Divider,
  Avatar,
} from "@mui/material";
import {
  Done as DoneIcon,
  DoneAll as DoneAllIcon,
  Close as CloseIcon,
} from "@mui/icons-material";

type Message = {
  message_id: number;
  sender_id: number;
  message_text: string;
  timestamp: string;
  delivered?: boolean;
  read?: boolean;
  saved?: boolean;
  file_url: string;
  delivered_timestamp?: string | null;
  read_timestamp?: string | null;
  file_name: string | null;
  file_size: string | null;
  reply_to: number | null;
  media_height: number | null;
  media_width: number | null;
  reactions: ReactionDetail[];
  post?: {
    post_id: number;
    file_url: string;
    media_width: number;
    media_height: number;
    content: string;
    owner: { user_id: number; username: string; profile_picture: string };
  } | null;
};

interface ReactionDetail {
  user_id: string;
  reaction: string;
  username: string;
  profile_picture: string;
}

interface MessageDetailsDrawerProps {
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  selectedMessage?: Message | null;
}

function formatDate(isoString: string) {
  const date = new Date(isoString);
  const dateStr = date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return { dateStr, timeStr };
}

type StatusRowProps = {
  icon: React.ReactNode;
  label: string;
  iconColor: string;
  timestamp: string;
  isLast?: boolean;
};

function StatusRow({
  icon,
  label,
  iconColor,
  timestamp,
  isLast,
}: StatusRowProps) {
  const { dateStr, timeStr } = formatDate(timestamp);

  return (
    <Box sx={{ display: "flex", gap: 2, position: "relative" }}>
      {/* Timeline line */}
      {!isLast && (
        <Box
          sx={{
            position: "absolute",
            left: "15px",
            top: "32px",
            bottom: "-16px",
            width: "2px",
            background: (t) =>
              `linear-gradient(to bottom, ${t.palette.divider}, transparent)`,
          }}
        />
      )}

      {/* Icon circle */}
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          backgroundColor: (t) => t.palette.action.hover,
          border: `1.5px solid ${iconColor}30`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          zIndex: 1,
        }}
      >
        {icon}
      </Box>

      {/* Content */}
      <Box sx={{ pb: 3, flex: 1 }}>
        <Typography
          sx={{
            fontSize: "13px",
            fontWeight: 600,
            color: (t) => t.palette.text.primary,
            letterSpacing: "0.02em",
            mb: 0.25,
          }}
        >
          {label}
        </Typography>
        <Typography
          sx={{
            fontSize: "11px",
            color: (t) => t.palette.text.disabled,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {dateStr} · {timeStr}
        </Typography>
      </Box>
    </Box>
  );
}

export default function MessageDetailsDrawer({
  drawerOpen,
  setDrawerOpen,
  selectedMessage,
}: MessageDetailsDrawerProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const statuses = [
    selectedMessage?.timestamp
      ? {
          label: "Sent",
          iconColor: theme.palette.text.disabled,
          timestamp: selectedMessage.timestamp,
          icon: (
            <DoneIcon
              sx={{ color: theme.palette.text.disabled, fontSize: 15 }}
            />
          ),
        }
      : null,
    selectedMessage?.delivered_timestamp
      ? {
          label: "Delivered",
          iconColor: theme.palette.text.secondary,
          timestamp: selectedMessage.delivered_timestamp,
          icon: (
            <DoneAllIcon
              sx={{ color: theme.palette.text.secondary, fontSize: 15 }}
            />
          ),
        }
      : null,
    selectedMessage?.read_timestamp
      ? {
          label: "Read",
          iconColor: "#38acff",
          timestamp: selectedMessage.read_timestamp,
          icon: <DoneAllIcon sx={{ color: "#38acff", fontSize: 15 }} />,
        }
      : null,
  ].filter(Boolean) as {
    label: string;
    iconColor: string;
    timestamp: string;
    icon: React.ReactNode;
  }[];

  return (
    <Drawer
      anchor="right"
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)}
      PaperProps={{
        sx: {
          width: isMobile ? "80vw" : "300px",
          backgroundColor: (t) => t.palette.background.default,
          color: (t) => t.palette.text.primary,
          borderLeft: "1px solid",
          borderColor: (t) => t.palette.divider,
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2.5,
          py: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid",
          borderColor: (t) => t.palette.divider,
        }}
      >
        <Typography
          sx={{
            fontSize: "14px",
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: (t) => t.palette.text.secondary,
          }}
        >
          Message Info
        </Typography>
        <IconButton
          onClick={() => setDrawerOpen(false)}
          size="small"
          sx={{
            color: (t) => t.palette.text.disabled,
            borderRadius: "8px",
            "&:hover": {
              color: (t) => t.palette.text.primary,
              backgroundColor: (t) => t.palette.action.hover,
            },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Message preview */}
      {selectedMessage?.message_text && (
        <Box
          sx={{
            mx: 2.5,
            mt: 2.5,
            mb: 1,
            px: 2,
            py: 1.5,
            backgroundColor: (t) => t.palette.action.hover,
            borderRadius: "12px",
            borderLeft: "2px solid",
            borderColor: (t) => t.palette.divider,
          }}
        >
          <Typography
            sx={{
              fontSize: "13px",
              color: (t) => t.palette.text.secondary,
              lineHeight: 1.5,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {selectedMessage.message_text}
          </Typography>
        </Box>
      )}

      {/* Status section label */}
      <Box sx={{ px: 2.5, pt: 2.5, pb: 1.5 }}>
        <Typography
          sx={{
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: (t) => t.palette.text.disabled,
          }}
        >
          Delivery Status
        </Typography>
      </Box>

      {/* Timeline */}
      <Box sx={{ px: 2.5, pt: 0.5 }}>
        {statuses.length > 0 ? (
          statuses.map((s, i) => (
            <StatusRow
              key={s.label}
              {...s}
              isLast={i === statuses.length - 1}
            />
          ))
        ) : (
          <Typography
            sx={{
              fontSize: "13px",
              color: (t) => t.palette.text.disabled,
              py: 1,
            }}
          >
            No status available.
          </Typography>
        )}
      </Box>

      {/* Reactions */}
      {selectedMessage?.reactions && selectedMessage.reactions.length > 0 && (
        <>
          <Divider
            sx={{ borderColor: (t) => t.palette.divider, mx: 2.5, mt: 1 }}
          />
          <Box sx={{ px: 2.5, pt: 2, pb: 1.5 }}>
            <Typography
              sx={{
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: (t) => t.palette.text.disabled,
                mb: 1.5,
              }}
            >
              Reactions
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
              {selectedMessage.reactions.map((r) => (
                <Box
                  key={r.user_id}
                  sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                >
                  <Avatar
                    src={r.profile_picture}
                    sx={{ width: 28, height: 28, fontSize: 12 }}
                  >
                    {r.username?.[0]?.toUpperCase()}
                  </Avatar>
                  <Typography
                    sx={{
                      fontSize: "13px",
                      color: (t) => t.palette.text.secondary,
                      flex: 1,
                    }}
                  >
                    {r.username}
                  </Typography>
                  <Typography sx={{ fontSize: "18px", lineHeight: 1 }}>
                    {r.reaction}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </>
      )}
    </Drawer>
  );
}
