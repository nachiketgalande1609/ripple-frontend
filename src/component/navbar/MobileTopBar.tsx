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
        height: 52,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: 2,
        backgroundColor: (t) => t.palette.background.paper,
        borderBottom: "1px solid",
        borderColor: (t) => t.palette.divider,
        zIndex: 1200,
      }}
    >
      {/* Brand */}
      <span className="brand-text">Ripple</span>

      {/* Notifications */}
      <IconButton
        onClick={() => navigate("/notifications")}
        sx={{
          width: 36,
          height: 36,
          borderRadius: "10px",
          backgroundColor: isActive
            ? (t) => t.palette.action.selected
            : "transparent",
          color: isActive
            ? (t) => t.palette.text.primary
            : (t) => t.palette.text.secondary,
          transition: "background 0.15s, color 0.15s",
          "&:active": { transform: "scale(0.92)" },
        }}
      >
        <Badge
          badgeContent={unreadNotificationsCount}
          color="error"
          sx={{
            "& .MuiBadge-badge": {
              fontSize: "0.6rem",
              minWidth: 15,
              height: 15,
            },
          }}
        >
          {isActive ? (
            <Favorite sx={{ fontSize: "1.2rem" }} />
          ) : (
            <FavoriteBorder sx={{ fontSize: "1.2rem" }} />
          )}
        </Badge>
      </IconButton>
    </Box>
  );
}
