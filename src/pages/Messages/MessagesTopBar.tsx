import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Avatar,
  Typography,
  Box,
  useMediaQuery,
  useTheme,
  IconButton,
  Dialog,
  Button,
  DialogContent,
  Grid,
} from "@mui/material";
import { ChevronLeft, MoreVert, Videocam } from "@mui/icons-material";
import WallpaperRoundedIcon from "@mui/icons-material/WallpaperRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import NotificationsOffRoundedIcon from "@mui/icons-material/NotificationsOffRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import bg1 from "../../static/bg1.jpg";
import bg2 from "../../static/bg2.jpg";
import bg3 from "../../static/bg3.png";
import bg4 from "../../static/bg4.jpg";
import BlankProfileImage from "../../static/profile_blank.png";
import { getMutedUsers, toggleMuteUser } from "../../services/api";
import { useAppNotifications } from "../../hooks/useNotification";

// ── your existing types ──────────────────────────────────────────
type Message = {
  message_id: number;
  receiver_id: number;
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

type User = {
  id: number;
  username: string;
  profile_picture: string;
  isOnline: boolean;
  latest_message: string;
  latest_message_timestamp: string;
  unread_count: number;
};

interface MessagesTopBarProps {
  selectedUser: User | null;
  chatTheme: string;
  setChatTheme: (theme: string) => void;
  openVideoCall: () => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  onMuteToggle: () => void;
}

// ── constants ────────────────────────────────────────────────────
const themeBackgrounds = [
  { value: "black", label: "Default" },
  { value: `url(${bg1})`, label: "" },
  { value: `url(${bg2})`, label: "" },
  { value: `url(${bg3})`, label: "" },
  { value: `url(${bg4})`, label: "" },
];

const dialogBackdrop = {
  sx: { backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.6)" },
};

// ── shared sub-components (unchanged) ───────────────────────────
function DialogIconWrap({
  children,
  muted = false,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <Box
      sx={{
        width: 34,
        height: 34,
        borderRadius: "10px",
        backgroundColor: (t) => t.palette.action.hover,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: muted
          ? (t) => t.palette.text.disabled
          : (t) => t.palette.text.secondary,
        transition: "all 0.2s ease",
        flexShrink: 0,
      }}
    >
      {children}
    </Box>
  );
}

function DialogButton({
  icon,
  label,
  onClick,
  muted = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
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
        color: muted
          ? (t) => t.palette.text.disabled
          : (t) => t.palette.text.secondary,
        transition: "all 0.2s ease",
        "&:hover": {
          backgroundColor: muted
            ? (t) => t.palette.action.hover
            : "rgba(124,92,252,0.12)",
          color: muted
            ? (t) => t.palette.text.secondary
            : (t) => t.palette.text.primary,
        },
      }}
    >
      <DialogIconWrap muted={muted}>{icon}</DialogIconWrap>
      {label}
    </Button>
  );
}

function DialogDivider() {
  return (
    <Box
      sx={{
        height: "1px",
        backgroundColor: (t) => t.palette.divider,
        mx: 1,
        my: 0.5,
      }}
    />
  );
}

// ── Main component ───────────────────────────────────────────────
const MessagesTopBar: React.FC<MessagesTopBarProps> = ({
  selectedUser,
  chatTheme,
  setChatTheme,
  openVideoCall,
  setMessages,
  onMuteToggle,
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [openThemeDialog, setOpenThemeDialog] = useState(false);
  const [openColorDialog, setOpenColorDialog] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [muteLoading, setMuteLoading] = useState(false);
  const notifications = useAppNotifications();

  const dialogPaperSx = {
    borderRadius: "20px",
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
    color: theme.palette.text.primary,
    overflow: "hidden",
    padding: "6px",
  };

  const iconButtonSx = {
    color: (t: any) => t.palette.text.secondary,
    width: 34,
    height: 34,
    "&:hover": {
      color: (t: any) => t.palette.text.primary,
      backgroundColor: (t: any) => t.palette.action.hover,
    },
  };

  // Fetch mute status whenever the selected user changes
  useEffect(() => {
    if (!selectedUser) return;

    const fetchMuteStatus = async () => {
      try {
        const ids = await getMutedUsers();
        setIsMuted(ids.includes(selectedUser.id));
      } catch (err) {
        console.error("Failed to fetch mute status:", err);
      }
    };

    fetchMuteStatus();
  }, [selectedUser?.id]);

  const handleToggleMute = async () => {
    if (!selectedUser || muteLoading) return;
    setMuteLoading(true);
    try {
      const result = await toggleMuteUser(selectedUser.id);
      setIsMuted(result.muted);
      onMuteToggle();
      notifications.show(
        result.muted
          ? `${selectedUser.username} has been muted`
          : `${selectedUser.username} has been unmuted`,
        { severity: "success", autoHideDuration: 3000 },
      );
    } catch (err) {
      console.error("Failed to toggle mute:", err);
      notifications.show("Failed to update notification settings.", {
        severity: "error",
        autoHideDuration: 3000,
      });
    } finally {
      setMuteLoading(false);
      setOpenThemeDialog(false);
    }
  };

  return (
    <Box
      sx={{
        backgroundColor: (t) => t.palette.background.paper,
        px: isMobile ? 0.5 : 1.5,
        py: "9px",
        display: "flex",
        alignItems: "center",
        borderBottom: "1px solid",
        borderColor: (t) => t.palette.divider,
        justifyContent: "space-between",
        height: 60,
      }}
    >
      {/* Left: back + avatar + username */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          overflow: "hidden",
        }}
      >
        <IconButton
          onClick={() => {
            navigate("/messages");
            setMessages([]);
          }}
          sx={{ ...iconButtonSx }}
        >
          <ChevronLeft fontSize="small" />
        </IconButton>
        <Avatar
          sx={{
            width: 36,
            height: 36,
            cursor: "pointer",
            ml: isMobile ? -1 : 0,
            border: "2px solid",
            borderColor: (t) => t.palette.divider,
          }}
          src={selectedUser?.profile_picture || BlankProfileImage}
          onClick={() => navigate(`/profile/${selectedUser?.id}`)}
        />
        <Typography
          onClick={() => navigate(`/profile/${selectedUser?.id}`)}
          sx={{
            cursor: "pointer",
            color: (t) => t.palette.text.primary,
            fontWeight: 500,
            fontSize: "0.92rem",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            "&:hover": { color: (t) => t.palette.text.secondary },
          }}
        >
          {selectedUser?.username}
        </Typography>
      </Box>

      {/* Right: actions */}
      <Box
        sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}
      >
        <IconButton onClick={openVideoCall} sx={iconButtonSx}>
          <Videocam sx={{ fontSize: 20 }} />
        </IconButton>
        <IconButton onClick={() => setOpenThemeDialog(true)} sx={iconButtonSx}>
          <MoreVert sx={{ fontSize: 20 }} />
        </IconButton>
      </Box>

      {/* ── Options dialog ── */}
      <Dialog
        open={openThemeDialog}
        onClose={() => setOpenThemeDialog(false)}
        fullWidth
        maxWidth="xs"
        BackdropProps={dialogBackdrop}
        sx={{ "& .MuiDialog-paper": dialogPaperSx }}
      >
        {/* Mute / Unmute */}
        <DialogButton
          icon={
            isMuted ? (
              <NotificationsRoundedIcon sx={{ fontSize: "1.1rem" }} />
            ) : (
              <NotificationsOffRoundedIcon sx={{ fontSize: "1.1rem" }} />
            )
          }
          label={
            muteLoading
              ? "Updating…"
              : isMuted
                ? `Unmute ${selectedUser?.username}`
                : `Mute ${selectedUser?.username}`
          }
          onClick={handleToggleMute}
        />
        <DialogDivider />

        {/* Background */}
        <DialogButton
          icon={<WallpaperRoundedIcon sx={{ fontSize: "1.1rem" }} />}
          label="Set Chat Background"
          onClick={() => {
            setOpenColorDialog(true);
            setOpenThemeDialog(false);
          }}
        />
        <DialogDivider />

        {/* Cancel */}
        <DialogButton
          icon={<CloseRoundedIcon sx={{ fontSize: "1.1rem" }} />}
          label="Cancel"
          onClick={() => setOpenThemeDialog(false)}
          muted
        />
      </Dialog>

      {/* ── Background picker dialog (unchanged) ── */}
      <Dialog
        open={openColorDialog}
        onClose={() => setOpenColorDialog(false)}
        BackdropProps={dialogBackdrop}
        sx={{ "& .MuiDialog-paper": { ...dialogPaperSx, padding: 0 } }}
      >
        <Box
          sx={{
            px: 2.5,
            pt: 2,
            pb: 1.5,
            borderBottom: "1px solid",
            borderColor: (t) => t.palette.divider,
          }}
        >
          <Typography
            sx={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600,
              fontSize: "0.95rem",
              color: (t) => t.palette.text.primary,
            }}
          >
            Chat Background
          </Typography>
          <Typography
            sx={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.75rem",
              color: (t) => t.palette.text.disabled,
              mt: 0.25,
            }}
          >
            Choose a background for this conversation
          </Typography>
        </Box>

        <DialogContent sx={{ pt: 2, pb: 1.5 }}>
          <Grid container spacing={1.5}>
            {themeBackgrounds.map(({ value, label }, index) => {
              const isSelected = chatTheme === value;
              return (
                <Grid item xs={3} key={index}>
                  <Box
                    onClick={() => {
                      localStorage.setItem("chatTheme", value);
                      setChatTheme(value);
                      setOpenColorDialog(false);
                      setOpenThemeDialog(false);
                    }}
                    sx={{
                      width: isMobile ? 58 : 72,
                      height: isMobile ? 58 : 72,
                      background:
                        value === "black"
                          ? theme.palette.background.default
                          : value,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      cursor: "pointer",
                      borderRadius: "12px",
                      border: isSelected
                        ? "2px solid rgba(124,92,252,0.9)"
                        : `2px solid ${theme.palette.divider}`,
                      boxShadow: isSelected
                        ? "0 0 0 3px rgba(124,92,252,0.2)"
                        : "none",
                      transition: "all 0.15s ease",
                      "&:hover": {
                        borderColor: theme.palette.text.disabled,
                        transform: "scale(1.05)",
                      },
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {isSelected && (
                      <Box
                        sx={{
                          position: "absolute",
                          inset: 0,
                          backgroundColor: "rgba(124,92,252,0.3)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "10px",
                        }}
                      >
                        <CheckRoundedIcon
                          sx={{ fontSize: "1.1rem", color: "#fff" }}
                        />
                      </Box>
                    )}
                    {label && !isSelected && (
                      <Typography
                        sx={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: "0.7rem",
                          color: (t) => t.palette.text.disabled,
                          fontWeight: 500,
                        }}
                      >
                        {label}
                      </Typography>
                    )}
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </DialogContent>

        <Box
          sx={{
            borderTop: "1px solid",
            borderColor: (t) => t.palette.divider,
            px: 1,
            py: 0.75,
          }}
        >
          <DialogButton
            icon={<CloseRoundedIcon sx={{ fontSize: "1.1rem" }} />}
            label="Cancel"
            onClick={() => setOpenColorDialog(false)}
            muted
          />
        </Box>
      </Dialog>
    </Box>
  );
};

export default MessagesTopBar;
