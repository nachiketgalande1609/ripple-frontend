import { Box, Switch, Typography } from "@mui/material";
import { useColorScheme } from "@mui/material/styles";
import { useAppNotifications } from "../../hooks/useNotification";

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

    notifications.show(`Theme changed to ${newTheme}`, {
      severity: "success",
      autoHideDuration: 3000,
    });
  };

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 720,
        display: "flex",
        flexDirection: "column",
        gap: 4,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Header */}
      <Box>
        <Typography
          sx={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "20px",
            fontWeight: 700,
            color: (theme) => theme.palette.text.primary,
            letterSpacing: "-0.4px",
            mb: 0.5,
          }}
        >
          General
        </Typography>
        <Typography
          sx={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "13px",
            color: (theme) => theme.palette.text.secondary,
          }}
        >
          Manage your app preferences.
        </Typography>
      </Box>

      {/* Card */}
      <Box
        sx={{
          borderRadius: "14px",
          border: "1px solid",
          borderColor: (theme) => theme.palette.divider,
          backgroundColor: (theme) => theme.palette.background.paper,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 3,
            py: 2.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: "10px",
                backgroundColor: (theme) => theme.palette.action.hover,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "17px",
                flexShrink: 0,
                transition: "background 0.2s",
              }}
            >
              {isDark ? "🌙" : "☀️"}
            </Box>
            <Box>
              <Typography
                sx={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: (theme) => theme.palette.text.primary,
                  letterSpacing: "-0.1px",
                }}
              >
                {isDark ? "Dark Mode" : "Light Mode"}
              </Typography>
              <Typography
                sx={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "12px",
                  color: (theme) => theme.palette.text.secondary,
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
            sx={{ flexShrink: 0 }}
          />
        </Box>

        {/* Footer */}
        <Box
          sx={{
            borderTop: "1px solid",
            borderColor: (theme) => theme.palette.divider,
            px: 3,
            py: 2,
            backgroundColor: (theme) => theme.palette.action.hover,
          }}
        >
          <Typography
            sx={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "12px",
              color: (theme) => theme.palette.text.disabled,
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
