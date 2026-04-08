import { useState } from "react";
import { Box, Switch, Typography, CircularProgress } from "@mui/material";
import { updatePrivacy } from "../../services/api";
import { useAppNotifications } from "../../hooks/useNotification";

const ACCENT = "#7c5cfc";

const AccountPrivacy = () => {
  const notifications = useAppNotifications();
  const [loading, setLoading] = useState(false);
  const currentUser = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user") || "")
    : {};
  const [isPrivate, setIsPrivate] = useState(currentUser.is_private);

  const handleToggle = async () => {
    const newVal = !isPrivate;
    setIsPrivate(newVal);
    setLoading(true);
    try {
      const res = await updatePrivacy(newVal);
      if (res.success) {
        currentUser.is_private = newVal;
        localStorage.setItem("user", JSON.stringify(currentUser));
        notifications.show(
          `Account changed to ${newVal ? "private" : "public"}`,
          { severity: "success", autoHideDuration: 3000 },
        );
      }
    } catch (error) {
      console.error("Error updating privacy setting:", error);
      setIsPrivate(!newVal);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 620,
        display: "flex",
        flexDirection: "column",
        gap: 2.5,
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      {/* ── Header ── */}
      <Box sx={{ mb: 0.25 }}>
        <Typography
          sx={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "1rem",
            fontWeight: 500,
            color: (t) => t.palette.text.primary,
            lineHeight: 1.3,
          }}
        >
          Account privacy
        </Typography>
        <Typography
          sx={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.8rem",
            color: (t) => t.palette.text.disabled,
            mt: 0.375,
          }}
        >
          Control who can see your profile and content
        </Typography>
      </Box>

      {/* ── Privacy card ── */}
      <Box
        sx={{
          borderRadius: "14px",
          border: "1px solid",
          borderColor: (t) => t.palette.divider,
          backgroundColor: (t) => t.palette.background.paper,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2.5,
            py: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.75 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "10px",
                backgroundColor: (t) => t.palette.action.hover,
                border: "1px solid",
                borderColor: (t) => t.palette.divider,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "16px",
                flexShrink: 0,
                transition: "background-color 0.15s",
              }}
            >
              {isPrivate ? "🔒" : "🌐"}
            </Box>

            <Box>
              <Typography
                sx={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: (t) => t.palette.text.primary,
                  lineHeight: 1.3,
                }}
              >
                {isPrivate ? "Private account" : "Public account"}
              </Typography>
              <Typography
                sx={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.75rem",
                  color: (t) => t.palette.text.disabled,
                  mt: 0.25,
                }}
              >
                {isPrivate
                  ? "Only approved followers can see your posts"
                  : "Anyone can view your profile and posts"}
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              flexShrink: 0,
            }}
          >
            {loading && (
              <CircularProgress
                size={13}
                thickness={5}
                sx={{ color: (t) => t.palette.text.disabled }}
              />
            )}
            <Switch
              checked={isPrivate}
              onChange={handleToggle}
              disabled={loading}
              sx={{
                "& .MuiSwitch-switchBase.Mui-checked": { color: ACCENT },
                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                  backgroundColor: ACCENT,
                },
              }}
            />
          </Box>
        </Box>

        {/* Footer note */}
        <Box
          sx={{
            borderTop: "1px solid",
            borderColor: (t) => t.palette.divider,
            px: 2.5,
            py: 1.375,
            backgroundColor: (t) => t.palette.action.hover,
          }}
        >
          <Typography
            sx={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.75rem",
              color: (t) => t.palette.text.disabled,
              lineHeight: 1.6,
            }}
          >
            {isPrivate
              ? "When your account is private, only people you approve can follow you and see your content."
              : "When your account is public, anyone on the platform can view your profile, posts, and activity."}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default AccountPrivacy;
