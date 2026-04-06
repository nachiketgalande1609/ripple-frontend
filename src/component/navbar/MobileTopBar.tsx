import { useNavigate } from "react-router-dom";
import { Badge, Box, IconButton, useMediaQuery, useTheme } from "@mui/material";
import { FavoriteBorder, Favorite } from "@mui/icons-material";

interface MobileTopBarProps {
  unreadNotificationsCount: number | null;
}

export default function MobileTopBar({
  unreadNotificationsCount,
}: MobileTopBarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();

  const hideBar = [
    "/login",
    "/register",
    "/reset-password",
    "/verify-email",
  ].includes(location.pathname);

  if (!isMobile || hideBar) return null;

  const isActive = location.pathname === "/notifications";

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: 2,
        backgroundColor: (t) => t.palette.background.paper,
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderBottom: "1px solid",
        borderColor: (t) => t.palette.divider,
        zIndex: 1200,
      }}
    >
      {/* Brand — gradient stays fixed as a brand color */}
      <Box
        sx={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 800,
          fontSize: "1.4rem",
          background: "linear-gradient(135deg, #7c5cfc 0%, #ff6b35 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          letterSpacing: "-0.5px",
          userSelect: "none",
        }}
      >
        Ripple
      </Box>

      {/* Notifications */}
      <IconButton
        onClick={() => navigate("/notifications")}
        sx={{
          width: 40,
          height: 40,
          borderRadius: "12px",
          backgroundColor: isActive ? "rgba(124,92,252,0.15)" : "transparent",
          color: isActive ? "#a989ff" : (t) => t.palette.text.secondary,
          transition: "all 0.2s ease",
          "&:active": {
            transform: "scale(0.92)",
            backgroundColor: "rgba(124,92,252,0.2)",
          },
        }}
      >
        <Badge
          badgeContent={unreadNotificationsCount}
          color="error"
          sx={{
            "& .MuiBadge-badge": {
              fontSize: "0.6rem",
              minWidth: 16,
              height: 16,
            },
          }}
        >
          {isActive ? (
            <Favorite sx={{ fontSize: "1.35rem" }} />
          ) : (
            <FavoriteBorder sx={{ fontSize: "1.35rem" }} />
          )}
        </Badge>
      </IconButton>
    </Box>
  );
}
