import { useNavigate, useLocation } from "react-router-dom";
import { Badge, Box, IconButton, useMediaQuery, useTheme } from "@mui/material";
import { FavoriteBorder, Favorite, MenuRounded, AddRounded } from "@mui/icons-material";
import { useGlobalStore } from "../../store/store";

interface MobileTopBarProps {
  unreadNotificationsCount: number | null;
}

export default function MobileTopBar({
  unreadNotificationsCount,
}: MobileTopBarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const location = useLocation();
  const { setProfileMenuOpen, setMobileCreateOpen } = useGlobalStore();
  const currentUser = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") || "null") : null;

  const hideBar = [
    "/login",
    "/register",
    "/reset-password",
    "/verify-email",
  ].includes(location.pathname);

  if (!isMobile || hideBar) return null;

  const isNotifActive = location.pathname === "/notifications";
  const isProfilePage = location.pathname.startsWith("/profile/");

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

      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        {/* Create */}
        {!!currentUser?.id && (
          <IconButton
            onClick={() => setMobileCreateOpen(true)}
            sx={{
              width: 36,
              height: 36,
              borderRadius: "10px",
              color: (t) => t.palette.text.secondary,
              transition: "background 0.15s, color 0.15s",
              "&:active": { transform: "scale(0.92)" },
            }}
          >
            <AddRounded sx={{ fontSize: "1.8rem" }} />
          </IconButton>
        )}

        {/* Notifications */}
        <IconButton
          onClick={() => navigate("/notifications")}
          sx={{
            width: 36,
            height: 36,
            borderRadius: "10px",
            backgroundColor: isNotifActive
              ? (t) => t.palette.action.selected
              : "transparent",
            color: isNotifActive
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
                fontSize: "0.75rem",
                minWidth: 15,
                height: 15,
              },
            }}
          >
            {isNotifActive ? (
              <Favorite sx={{ fontSize: "1.8rem" }} />
            ) : (
              <FavoriteBorder sx={{ fontSize: "1.8rem" }} />
            )}
          </Badge>
        </IconButton>

        {/* Hamburger — profile pages only */}
        {isProfilePage && (
          <IconButton
            onClick={() => setProfileMenuOpen(true)}
            sx={{
              width: 36,
              height: 36,
              borderRadius: "10px",
              color: (t) => t.palette.text.secondary,
              transition: "background 0.15s, color 0.15s",
              "&:active": { transform: "scale(0.92)" },
            }}
          >
            <MenuRounded sx={{ fontSize: "1.8rem" }} />
          </IconButton>
        )}
      </Box>
    </Box>
  );
}
