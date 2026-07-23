import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Skeleton,
  IconButton,
  Button,
  Tooltip,
} from "@mui/material";
import ComputerRoundedIcon from "@mui/icons-material/ComputerRounded";
import SmartphoneRoundedIcon from "@mui/icons-material/SmartphoneRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import { getActiveSessions, revokeSession, revokeAllSessions } from "../../services/api";
import { useAppNotifications } from "../../hooks/useNotification";
import { timeAgo } from "../../utils/utils";

type Session = {
  id: number;
  ip: string;
  city: string;
  region: string;
  country: string;
  device_type: string;
  browser: string;
  os: string;
  logged_in_at: string;
  last_active: string;
};

function formatLocation(s: Session) {
  const parts = [s.city, s.region, s.country].filter(Boolean);
  return parts.length ? parts.join(", ") : s.ip || "Unknown location";
}

function formatBrowser(s: Session) {
  const parts = [s.browser, s.os].filter((v) => v && v !== "Other");
  return parts.join(" · ") || "Unknown browser";
}

const SessionCard = ({
  session,
  onRevoke,
  revoking,
}: {
  session: Session;
  onRevoke: (id: number) => void;
  revoking: boolean;
}) => {
  const isDesktop = session.device_type === "Desktop";

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        px: 2.5,
        py: 2,
        mb: 1,
        borderRadius: "20px",
        border: "1px solid",
        borderColor: (t) => t.palette.divider,
        backgroundColor: "var(--nav-bg)",
        transition: "box-shadow 0.25s cubic-bezier(0.4,0,0.2,1)",
        "&:hover": {
          boxShadow:
            "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)",
          borderColor: "transparent",
        },
      }}
    >
      {/* Device icon */}
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: "13px",
          bgcolor: (t) => t.palette.action.hover,
          border: "1px solid",
          borderColor: (t) => t.palette.divider,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {isDesktop ? (
          <ComputerRoundedIcon sx={{ fontSize: 22, color: (t) => t.palette.text.secondary }} />
        ) : (
          <SmartphoneRoundedIcon sx={{ fontSize: 22, color: (t) => t.palette.text.secondary }} />
        )}
      </Box>

      {/* Info */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{ fontSize: "0.875rem", fontWeight: 600, color: (t) => t.palette.text.primary, mb: 0.25 }}
        >
          {formatBrowser(session)}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.25 }}>
          <LocationOnOutlinedIcon sx={{ fontSize: 13, color: (t) => t.palette.text.disabled }} />
          <Typography sx={{ fontSize: "0.77rem", color: (t) => t.palette.text.disabled, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {formatLocation(session)}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <AccessTimeRoundedIcon sx={{ fontSize: 13, color: (t) => t.palette.text.disabled }} />
          <Typography sx={{ fontSize: "0.77rem", color: (t) => t.palette.text.disabled }}>
            Logged in {timeAgo(session.logged_in_at)} ago
          </Typography>
        </Box>
      </Box>

      {/* Revoke */}
      <Tooltip title="Remove session">
        <IconButton
          size="small"
          disabled={revoking}
          onClick={() => onRevoke(session.id)}
          sx={{
            color: (t) => t.palette.text.disabled,
            "&:hover": { color: "error.main", bgcolor: "rgba(211,47,47,0.08)" },
          }}
        >
          <DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

const SkeletonCard = () => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      gap: 2,
      px: 2.5,
      py: 2,
      mb: 1,
      borderRadius: "20px",
      border: "1px solid",
      borderColor: (t) => t.palette.divider,
      backgroundColor: "var(--nav-bg)",
    }}
  >
    <Skeleton variant="rounded" width={44} height={44} sx={{ borderRadius: "13px", flexShrink: 0, bgcolor: (t) => t.palette.action.hover }} />
    <Box sx={{ flex: 1 }}>
      <Skeleton variant="text" width="45%" height={16} sx={{ bgcolor: (t) => t.palette.action.hover, mb: 0.5 }} />
      <Skeleton variant="text" width="60%" height={13} sx={{ bgcolor: (t) => t.palette.action.hover, mb: 0.25 }} />
      <Skeleton variant="text" width="38%" height={13} sx={{ bgcolor: (t) => t.palette.action.hover }} />
    </Box>
  </Box>
);

const LinkedDevices = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<number | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);
  const notifications = useAppNotifications();

  const load = async () => {
    try {
      const data = await getActiveSessions();
      setSessions(data);
    } catch {
      notifications.show("Failed to load sessions", { severity: "error", autoHideDuration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRevoke = async (id: number) => {
    setRevokingId(id);
    try {
      await revokeSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      notifications.show("Session removed", { severity: "success", autoHideDuration: 2500 });
    } catch {
      notifications.show("Failed to remove session", { severity: "error", autoHideDuration: 3000 });
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeAll = async () => {
    setRevokingAll(true);
    try {
      await revokeAllSessions();
      setSessions([]);
      notifications.show("All sessions cleared", { severity: "success", autoHideDuration: 2500 });
    } catch {
      notifications.show("Failed to clear sessions", { severity: "error", autoHideDuration: 3000 });
    } finally {
      setRevokingAll(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 520, mx: "auto", px: { xs: 0, sm: 1 } }}>
      {/* Header row */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
        <Box>
          <Typography sx={{ fontSize: "0.95rem", fontWeight: 600, color: (t) => t.palette.text.primary }}>
            Active Sessions
          </Typography>
          <Typography sx={{ fontSize: "0.78rem", color: (t) => t.palette.text.disabled, mt: 0.25 }}>
            Devices where your account is currently logged in
          </Typography>
        </Box>
        {sessions.length > 1 && (
          <Button
            size="small"
            disabled={revokingAll}
            onClick={handleRevokeAll}
            sx={{
              fontSize: "0.75rem",
              fontWeight: 600,
              textTransform: "none",
              color: "error.main",
              borderRadius: "10px",
              px: 1.5,
              py: 0.5,
              flexShrink: 0,
              "&:hover": { bgcolor: "rgba(211,47,47,0.08)" },
            }}
          >
            Clear all
          </Button>
        )}
      </Box>

      {/* List */}
      {loading ? (
        [1, 2, 3].map((i) => <SkeletonCard key={i} />)
      ) : sessions.length === 0 ? (
        <Box sx={{ py: 8, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
          <ComputerRoundedIcon sx={{ fontSize: 40, color: (t) => t.palette.action.disabled }} />
          <Typography sx={{ color: (t) => t.palette.text.disabled, fontSize: "0.88rem" }}>
            No active sessions found
          </Typography>
        </Box>
      ) : (
        sessions.map((s) => (
          <SessionCard
            key={s.id}
            session={s}
            onRevoke={handleRevoke}
            revoking={revokingId === s.id}
          />
        ))
      )}

      <Typography sx={{ fontSize: "0.72rem", color: (t) => t.palette.text.disabled, mt: 2, lineHeight: 1.6 }}>
        Location is estimated from IP address and may not be exact. Removing a session does not invalidate the token on that device immediately — the user will be logged out on their next action.
      </Typography>
    </Box>
  );
};

export default LinkedDevices;
