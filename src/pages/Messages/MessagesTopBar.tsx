import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";

const AVATAR_GROUP_COLORS = [
  { bg: "#E8F5E9", color: "#2E7D32" },
  { bg: "#EDE7F6", color: "#4527A0" },
  { bg: "#FFF3E0", color: "#E65100" },
  { bg: "#E3F2FD", color: "#1565C0" },
];
const getGroupAvatarColor = (name: string) => {
  const idx = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_GROUP_COLORS.length;
  return AVATAR_GROUP_COLORS[idx];
};
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
import { formatLastSeen } from "../../utils/lastSeen";
import { useGlobalStore } from "../../store/store";

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
  last_seen?: string | null;
  latest_message: string;
  latest_message_timestamp: string;
  unread_count: number;
};

type Group = {
  id: number;
  name: string;
  profile_picture: string | null;
  member_count: number;
};

interface MessagesTopBarProps {
  selectedUser: User | null;
  selectedGroup?: Group | null;
  chatTheme: string;
  setChatTheme: (theme: string) => void;
  openVideoCall: () => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  onMuteToggle: () => void;
  onGroupInfoClick?: () => void;
}

// ── constants ────────────────────────────────────────────────────
const themeBackgroundValues = [
  { value: "black", defaultKey: true },
  { value: `url(${bg1})` },
  { value: `url(${bg2})` },
  { value: `url(${bg3})` },
  { value: `url(${bg4})` },
];

const dialogBackdrop = {
  sx: { backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.6)" },
};

// ── shared sub-components ───────────────────────────────────────
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
        backgroundColor: "action.hover",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: muted ? "text.disabled" : "text.secondary",
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
        borderRadius: "18px",
        textTransform: "none",
        justifyContent: "flex-start",
        fontFamily: "'Inter', sans-serif",
        fontWeight: 500,
        fontSize: "0.875rem",
        color: muted ? "text.disabled" : "text.primary",
        border: "none",
        backgroundColor: "var(--nav-bg)",
        boxShadow: "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)",
        transition: "box-shadow 0.35s cubic-bezier(0.4,0,0.2,1), color 0.2s ease",
        mb: 0.75,
        "&:hover": {
          backgroundColor: "var(--nav-bg)",
          boxShadow: "inset 3px 3px 10px var(--nav-neo-shadow1), inset -3px -3px 10px var(--nav-neo-shadow2)",
          color: muted ? "text.secondary" : "text.primary",
        },
      }}
    >
      <DialogIconWrap muted={muted}>{icon}</DialogIconWrap>
      {label}
    </Button>
  );
}

// ── Main component ───────────────────────────────────────────────
const MessagesTopBar: React.FC<MessagesTopBarProps> = ({
  selectedUser,
  selectedGroup,
  chatTheme,
  setChatTheme,
  openVideoCall,
  setMessages,
  onMuteToggle,
  onGroupInfoClick,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const themeBackgrounds = themeBackgroundValues.map((bg) => ({
    value: bg.value,
    label: bg.defaultKey ? t("messages.defaultBackground") : "",
  }));

  const [openThemeDialog, setOpenThemeDialog] = useState(false);
  const [openColorDialog, setOpenColorDialog] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [muteLoading, setMuteLoading] = useState(false);
  const notifications = useAppNotifications();
  const { hideActivity } = useGlobalStore();

  const dialogPaperSx = {
    borderRadius: "36px",
    backgroundColor: "background.paper",
    border: "1px solid",
    borderColor: "divider",
    boxShadow: "0 24px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(100,116,139,0.08)",
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
          ? t("messages.muted", { username: selectedUser.username })
          : t("messages.unmuted", { username: selectedUser.username }),
        { severity: "success", autoHideDuration: 3000 },
      );
    } catch (err) {
      console.error("Failed to toggle mute:", err);
      notifications.show(t("messages.muteFailed"), {
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
      {/* Left: back + avatar + name */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, overflow: "hidden" }}>
        <IconButton
          onClick={() => { navigate("/messages"); setMessages([]); }}
          sx={{ ...iconButtonSx }}
        >
          <ChevronLeft fontSize="small" />
        </IconButton>

        {selectedGroup ? (
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 1, cursor: "pointer", borderRadius: "12px", px: 0.75, py: 0.25, transition: "background 0.15s", "&:hover": { bgcolor: (t) => t.palette.action.hover } }}
            onClick={onGroupInfoClick}
          >
            <Box sx={{ position: "relative", flexShrink: 0, ml: isMobile ? -1 : 0 }}>
              {selectedGroup.profile_picture ? (
                <Avatar src={selectedGroup.profile_picture} sx={{ width: 36, height: 36, border: "2px solid", borderColor: (t) => t.palette.divider }} />
              ) : (
                <Avatar sx={{ width: 36, height: 36, border: "2px solid", borderColor: (t) => t.palette.divider, bgcolor: getGroupAvatarColor(selectedGroup.name).bg }}>
                  <GroupsRoundedIcon sx={{ fontSize: 20, color: getGroupAvatarColor(selectedGroup.name).color }} />
                </Avatar>
              )}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ color: (t) => t.palette.text.primary, fontWeight: 500, fontSize: "0.92rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.25 }}>
                {selectedGroup.name}
              </Typography>
              <Typography sx={{ fontSize: "0.7rem", color: "text.disabled", lineHeight: 1.3, whiteSpace: "nowrap" }}>
                {selectedGroup.member_count} members
              </Typography>
            </Box>
          </Box>
        ) : (
          <>
            <Box sx={{ position: "relative", flexShrink: 0, ml: isMobile ? -1 : 0 }}>
              <Avatar
                sx={{ width: 36, height: 36, cursor: "pointer", border: "2px solid", borderColor: (t) => t.palette.divider }}
                src={selectedUser?.profile_picture || BlankProfileImage}
                onClick={() => navigate(`/profile/${selectedUser?.id}`)}
              />
              {selectedUser && !hideActivity && (
                <Box sx={{ width: 10, height: 10, borderRadius: "50%", position: "absolute", bottom: 0, right: 0, backgroundColor: selectedUser.isOnline ? "#22c55e" : "#9e9e9e", border: "2px solid", borderColor: (t: any) => t.palette.background.paper }} />
              )}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                onClick={() => navigate(`/profile/${selectedUser?.id}`)}
                sx={{ cursor: "pointer", color: (t) => t.palette.text.primary, fontWeight: 500, fontSize: "0.92rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.25, "&:hover": { color: (t) => t.palette.text.secondary } }}
              >
                {selectedUser?.username}
              </Typography>
              {selectedUser && !hideActivity && !selectedUser.isOnline && formatLastSeen(selectedUser.last_seen, false) && (
                <Typography sx={{ fontSize: "0.7rem", color: "text.disabled", lineHeight: 1.3, whiteSpace: "nowrap" }}>
                  {formatLastSeen(selectedUser.last_seen, false)}
                </Typography>
              )}
            </Box>
          </>
        )}
      </Box>

      {/* Right: actions */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
        {!selectedGroup && (
          <IconButton onClick={openVideoCall} sx={iconButtonSx}>
            <Videocam sx={{ fontSize: 20 }} />
          </IconButton>
        )}
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
        <Box sx={{ "& button": { borderRadius: "0 !important" }, "& button:first-of-type": { borderRadius: "32px 32px 0 0 !important" }, "& button:last-of-type": { borderRadius: "0 0 32px 32px !important", marginBottom: "0 !important" } }}>
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
                ? t("messages.updating")
                : isMuted
                  ? t("messages.unmute", { username: selectedUser?.username })
                  : t("messages.mute", { username: selectedUser?.username })
            }
            onClick={handleToggleMute}
          />

          {/* Background */}
          <DialogButton
            icon={<WallpaperRoundedIcon sx={{ fontSize: "1.1rem" }} />}
            label={t("messages.setChatBackground")}
            onClick={() => {
              setOpenColorDialog(true);
              setOpenThemeDialog(false);
            }}
          />

          {/* Cancel */}
          <DialogButton
            icon={<CloseRoundedIcon sx={{ fontSize: "1.1rem" }} />}
            label={t("common.cancel")}
            onClick={() => setOpenThemeDialog(false)}
            muted
          />
        </Box>
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
            {t("messages.chatBackground")}
          </Typography>
          <Typography
            sx={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.75rem",
              color: (t) => t.palette.text.disabled,
              mt: 0.25,
            }}
          >
            {t("messages.chatBackgroundSubtitle")}
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
                        ? "2px solid rgba(100,116,139,0.9)"
                        : `2px solid ${theme.palette.divider}`,
                      boxShadow: isSelected
                        ? "0 0 0 3px rgba(100,116,139,0.2)"
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
                          backgroundColor: "rgba(100,116,139,0.3)",
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
            label={t("common.cancel")}
            onClick={() => setOpenColorDialog(false)}
            muted
          />
        </Box>
      </Dialog>
    </Box>
  );
};

export default MessagesTopBar;
