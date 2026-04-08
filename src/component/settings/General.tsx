import { Box, Switch, Typography } from "@mui/material";
import { useColorScheme } from "@mui/material/styles";
import { useAppNotifications } from "../../hooks/useNotification";

const ACCENT = "#7c5cfc";

const General = () => {
  const notifications = useAppNotifications();
  const { mode, setMode } = useColorScheme();

  const isDark = mode === "dark";

  const handleToggle = () => {
    const newTheme = isDark ? "light" : "dark";
    setMode(newTheme);
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    localStorage.setItem(
      "user",
      JSON.stringify({ ...currentUser, theme: newTheme }),
    );
    notifications.show(`Switched to ${newTheme} mode`, {
      severity: "success",
      autoHideDuration: 3000,
    });
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
          General
        </Typography>
        <Typography
          sx={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.8rem",
            color: (t) => t.palette.text.disabled,
            mt: 0.375,
          }}
        >
          Manage your app preferences
        </Typography>
      </Box>

      {/* ── Theme card ── */}
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
              }}
            >
              {isDark ? "🌙" : "☀️"}
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
                {isDark ? "Dark mode" : "Light mode"}
              </Typography>
              <Typography
                sx={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.75rem",
                  color: (t) => t.palette.text.disabled,
                  mt: 0.25,
                }}
              >
                {isDark
                  ? "Easy on the eyes in low light"
                  : "Bright and clear for daytime use"}
              </Typography>
            </Box>
          </Box>

          <Switch
            checked={isDark}
            onChange={handleToggle}
            sx={{
              flexShrink: 0,
              "& .MuiSwitch-switchBase.Mui-checked": { color: ACCENT },
              "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                backgroundColor: ACCENT,
              },
            }}
          />
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
            Your theme preference is saved locally and applied across all
            sessions on this device.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default General;
