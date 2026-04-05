import { Dialog, Button, Box, useMediaQuery, useTheme } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { useNotifications } from "@toolpad/core/useNotifications";
import socket from "../../services/socket";
import { unfollowUser } from "../../services/api";

import EditRoundedIcon from "@mui/icons-material/EditRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import PersonRemoveRoundedIcon from "@mui/icons-material/PersonRemoveRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";

import BlankProfileImage from "../../static/profile_blank.png";

interface MoreOptionsDialogProps {
  openDialog: boolean;
  handleCloseDialog: () => void;
  userId: string | undefined;
  fetchProfile: () => void;
  fetchUserPosts: () => void;
  isFollowing: boolean | undefined;
}

/* Reusable icon container */
function DialogIconWrap({
  children,
  danger = false,
  muted = false,
}: {
  children: React.ReactNode;
  danger?: boolean;
  muted?: boolean;
}) {
  return (
    <Box
      sx={{
        width: 34,
        height: 34,
        borderRadius: "10px",
        background: danger
          ? "rgba(255,59,48,0.08)"
          : muted
            ? "rgba(255,255,255,0.04)"
            : "rgba(255,255,255,0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: danger
          ? "rgba(255,100,100,0.6)"
          : muted
            ? "rgba(255,255,255,0.25)"
            : "rgba(255,255,255,0.5)",
        transition: "all 0.2s ease",
        flexShrink: 0,
      }}
    >
      {children}
    </Box>
  );
}

/* Reusable dialog button */
function DialogButton({
  icon,
  label,
  onClick,
  danger = false,
  muted = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
  muted?: boolean;
}) {
  return (
    <Button
      fullWidth
      onClick={onClick}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        px: 2,
        py: 1.4,
        borderRadius: "12px",
        textTransform: "none",
        justifyContent: "flex-start",
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 500,
        fontSize: "0.875rem",
        color: danger
          ? "rgba(255,100,100,0.85)"
          : muted
            ? "rgba(255,255,255,0.3)"
            : "rgba(255,255,255,0.8)",
        transition: "all 0.2s ease",
        "&:hover": {
          background: danger
            ? "rgba(255,59,48,0.1)"
            : muted
              ? "rgba(255,255,255,0.04)"
              : "rgba(124,92,252,0.12)",
          color: danger
            ? "#ff6b6b"
            : muted
              ? "rgba(255,255,255,0.55)"
              : "#fff",
        },
      }}
    >
      <DialogIconWrap danger={danger} muted={muted}>
        {icon}
      </DialogIconWrap>
      {label}
    </Button>
  );
}

/* Gradient divider */
function DialogDivider() {
  return (
    <Box
      sx={{
        height: "1px",
        background:
          "linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)",
        mx: 1,
        my: 0.5,
      }}
    />
  );
}

export default function MoreOptionsDialog({
  openDialog,
  handleCloseDialog,
  userId,
  fetchProfile,
  fetchUserPosts,
  isFollowing,
}: MoreOptionsDialogProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const notifications = useNotifications();

  const profileUrl = `${window.location.origin}${location.pathname}`;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const currentUser = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user") || "")
    : {};

  const isOwnProfile = currentUser?.id == userId;

  const handleEditProfile = () => {
    navigate(isMobile ? "/settings" : "/settings?setting=profiledetails");
    handleCloseDialog();
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      notifications.show("Profile link copied to clipboard!", {
        severity: "success",
        autoHideDuration: 3000,
      });
      handleCloseDialog();
    } catch (err) {
      console.error("Failed to copy:", err);
      notifications.show("Failed to copy link. Please try again later.", {
        severity: "error",
        autoHideDuration: 3000,
      });
    }
  };

  const handleLogout = () => {
    if (currentUser) socket.disconnect();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("privateKey");
    handleCloseDialog();
    navigate("/login");
  };

  const handleUnfollow = async () => {
    try {
      const res = await unfollowUser(currentUser.id, userId || "");
      if (res.success) {
        handleCloseDialog();
        notifications.show("User Unfollowed", {
          severity: "success",
          autoHideDuration: 3000,
        });
        fetchProfile();
        fetchUserPosts();
      }
    } catch (err) {
      console.error("Unfollow request failed:", err);
      notifications.show("Failed to unfollow user. Please try again later.", {
        severity: "error",
        autoHideDuration: 3000,
      });
    }
  };

  return (
    <Dialog
      open={openDialog}
      onClose={handleCloseDialog}
      fullWidth
      maxWidth="xs"
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: "20px",
          background: "linear-gradient(160deg, #13131c 0%, #0e0e16 100%)",
          border: "1px solid rgba(255,255,255,0.07)",
          boxShadow:
            "0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(124,92,252,0.08)",
          color: "white",
          overflow: "hidden",
          padding: "6px",
        },
      }}
      BackdropProps={{
        sx: {
          backgroundColor: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(8px)",
        },
      }}
    >
      {/* User info header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: 2,
          py: 1.75,
          mb: 0.5,
        }}
      >
        <img
          src={currentUser?.profile_picture_url || BlankProfileImage}
          alt="Profile"
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            objectFit: "cover",
            border: "2px solid rgba(124,92,252,0.5)",
          }}
        />
        <Box>
          <Box
            sx={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600,
              fontSize: "0.9rem",
              color: "#fff",
              lineHeight: 1.3,
            }}
          >
            {currentUser?.username || "User"}
          </Box>
          <Box
            sx={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.75rem",
              color: "rgba(255,255,255,0.35)",
            }}
          >
            {isOwnProfile ? "Manage your profile" : "Profile options"}
          </Box>
        </Box>
      </Box>

      <DialogDivider />

      {/* Unfollow — shown to non-owners who follow this user */}
      {!isOwnProfile && isFollowing && (
        <DialogButton
          icon={<PersonRemoveRoundedIcon sx={{ fontSize: "1.1rem" }} />}
          label="Unfollow"
          onClick={handleUnfollow}
          danger
        />
      )}

      {/* Edit Profile — own profile only */}
      {isOwnProfile && (
        <DialogButton
          icon={<EditRoundedIcon sx={{ fontSize: "1.1rem" }} />}
          label="Edit Profile"
          onClick={handleEditProfile}
        />
      )}

      {/* Copy Profile Link — always visible */}
      <DialogButton
        icon={<LinkRoundedIcon sx={{ fontSize: "1.1rem" }} />}
        label="Copy Profile Link"
        onClick={handleCopyLink}
      />

      {/* Settings — mobile + own profile only */}
      {isMobile && isOwnProfile && (
        <DialogButton
          icon={<SettingsRoundedIcon sx={{ fontSize: "1.1rem" }} />}
          label="Settings"
          onClick={() => {
            navigate("/settings");
            handleCloseDialog();
          }}
        />
      )}

      {/* Logout — own profile only */}
      {isOwnProfile && (
        <DialogButton
          icon={<LogoutRoundedIcon sx={{ fontSize: "1.1rem" }} />}
          label="Log out"
          onClick={handleLogout}
          danger
        />
      )}

      <DialogDivider />

      {/* Cancel */}
      <DialogButton
        icon={<CloseRoundedIcon sx={{ fontSize: "1.1rem" }} />}
        label="Cancel"
        onClick={handleCloseDialog}
        muted
      />
    </Dialog>
  );
}