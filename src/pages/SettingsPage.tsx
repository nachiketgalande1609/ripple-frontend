import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Typography,
  useMediaQuery,
  useTheme,
  IconButton,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import ProfileDetails from "../component/settings/ProfileDetails";
import AccountPrivacy from "../component/settings/AccountPrivacy";
import General from "../component/settings/General";

const menuItems = [
  { label: "Profile Details" },
  { label: "General" },
  { label: "Account Privacy" },
  { label: "Notifications" },
  { label: "Blocked" },
  { label: "Comments" },
];

const DRAWER_WIDTH = 270;

const BackArrow = () => {
  const theme = useTheme();
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12.5 15L7.5 10L12.5 5"
        stroke={theme.palette.text.secondary}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const ChevronRight = () => {
  const theme = useTheme();
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M6 12L10 8L6 4"
        stroke={theme.palette.text.disabled}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const SettingsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const queryParams = new URLSearchParams(location.search);
  const currentSetting = queryParams.get("setting");

  const handleMenuItemClick = (setting: string) => {
    navigate(`/settings?setting=${setting}`);
  };

  const handleBack = () => {
    navigate("/settings");
  };

  const activeLabel = menuItems.find(
    (m) => m.label.toLowerCase().replace(/\s+/g, "") === currentSetting
  )?.label;

  const renderContent = () => {
    if (currentSetting === "profiledetails") return <ProfileDetails />;
    if (currentSetting === "accountprivacy") return <AccountPrivacy />;
    if (currentSetting === "general") return <General />;
    return (
      <Box sx={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: "16px",
            backgroundColor: (t) => t.palette.action.hover,
            border: "1px solid",
            borderColor: (t) => t.palette.divider,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "24px",
            mb: 1,
          }}
        >
          ⚙️
        </Box>
        <Typography
          sx={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "16px",
            fontWeight: 600,
            color: (t) => t.palette.text.secondary,
            letterSpacing: "-0.3px",
          }}
        >
          No category selected
        </Typography>
        <Typography
          sx={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "13px",
            color: (t) => t.palette.text.disabled,
            maxWidth: 260,
            lineHeight: 1.6,
          }}
        >
          Choose a section from the sidebar to manage your preferences.
        </Typography>
      </Box>
    );
  };

  // ─── MOBILE LAYOUT ───────────────────────────────────────────────────────────
  if (isMobile) {
    if (currentSetting) {
      return (
        <Box
          sx={{
            minHeight: "100vh",
            backgroundColor: (t) => t.palette.background.default,
            fontFamily: "'DM Sans', sans-serif",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Mobile top bar */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 2,
              py: 2,
              borderBottom: "1px solid",
              borderColor: (t) => t.palette.divider,
              backgroundColor: (t) => t.palette.background.paper,
              position: "sticky",
              top: 0,
              zIndex: 10,
            }}
          >
            <IconButton
              onClick={handleBack}
              sx={{
                p: "6px",
                borderRadius: "8px",
                backgroundColor: (t) => t.palette.action.hover,
                border: "1px solid",
                borderColor: (t) => t.palette.divider,
                "&:hover": { backgroundColor: (t) => t.palette.action.selected },
                "&:active": { transform: "scale(0.95)" },
                transition: "all 0.15s ease",
              }}
            >
              <BackArrow />
            </IconButton>
            <Typography
              sx={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "16px",
                fontWeight: 600,
                color: (t) => t.palette.text.primary,
                letterSpacing: "-0.3px",
              }}
            >
              {activeLabel}
            </Typography>
          </Box>

          {/* Content */}
          <Box
            sx={{
              flexGrow: 1,
              px: 3,
              py: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: currentSetting ? "flex-start" : "center",
              justifyContent: currentSetting ? "flex-start" : "center",
            }}
          >
            {renderContent()}
          </Box>
        </Box>
      );
    }

    // Menu page
    return (
      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: (t) => t.palette.background.default,
          fontFamily: "'DM Sans', sans-serif",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Mobile header */}
        <Box
          sx={{
            px: 3,
            pt: 5,
            pb: 3,
            borderBottom: "1px solid",
            borderColor: (t) => t.palette.divider,
            backgroundColor: (t) => t.palette.background.paper,
          }}
        >
          <Typography
            sx={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 700,
              fontSize: "22px",
              color: (t) => t.palette.text.primary,
              letterSpacing: "-0.5px",
            }}
          >
            Settings
          </Typography>
          <Typography
            sx={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "12px",
              color: (t) => t.palette.text.secondary,
              mt: 0.5,
              letterSpacing: "0.3px",
            }}
          >
            Manage your account
          </Typography>
        </Box>

        {/* Menu list */}
        <List sx={{ px: 2, pt: 2, flexGrow: 1 }}>
          {menuItems.map(({ label }, index) => {
            const settingKey = label.toLowerCase().replace(/\s+/g, "");
            return (
              <ListItem
                component="button"
                key={index}
                onClick={() => handleMenuItemClick(settingKey)}
                sx={{
                  width: "100%",
                  textAlign: "left",
                  padding: "13px 14px",
                  borderRadius: "12px",
                  marginBottom: "8px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: (t) => t.palette.action.hover,
                  border: "1px solid",
                  borderColor: (t) => t.palette.divider,
                  "&:hover": { backgroundColor: (t) => t.palette.action.selected },
                  "&:active": { transform: "scale(0.98)", backgroundColor: (t) => t.palette.action.focus },
                }}
              >
                <ListItemText
                  primary={label}
                  primaryTypographyProps={{
                    sx: {
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "15px",
                      fontWeight: 400,
                      color: (t) => t.palette.text.primary,
                      letterSpacing: "-0.1px",
                    },
                  }}
                />
                <ChevronRight />
              </ListItem>
            );
          })}
        </List>

        {/* Footer */}
        <Box sx={{ px: 3, py: 3, borderTop: "1px solid", borderColor: (t) => t.palette.divider }}>
          <Typography
            sx={{
              fontSize: "11px",
              color: (t) => t.palette.text.disabled,
              fontFamily: "'DM Sans', sans-serif",
              letterSpacing: "0.3px",
            }}
          >
            v2.4.1
          </Typography>
        </Box>
      </Box>
    );
  }

  // ─── DESKTOP LAYOUT ──────────────────────────────────────────────────────────
  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: (t) => t.palette.background.default,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
            backgroundColor: (t) => t.palette.background.paper,
            borderRight: "1px solid",
            borderColor: (t) => t.palette.divider,
            display: "flex",
            flexDirection: "column",
            padding: "0",
            position: "relative",
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 3,
            pt: 4,
            pb: 3,
            borderBottom: "1px solid",
            borderColor: (t) => t.palette.divider,
          }}
        >
          <Typography
            sx={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 700,
              fontSize: "22px",
              color: (t) => t.palette.text.primary,
              letterSpacing: "-0.5px",
            }}
          >
            Settings
          </Typography>
          <Typography
            sx={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "12px",
              color: (t) => t.palette.text.secondary,
              mt: 0.5,
              letterSpacing: "0.3px",
            }}
          >
            Manage your account
          </Typography>
        </Box>

        {/* Nav List */}
        <List sx={{ px: 2, pt: 2, flexGrow: 1 }}>
          {menuItems.map(({ label }, index) => {
            const settingKey = label.toLowerCase().replace(/\s+/g, "");
            const isActive = settingKey === currentSetting;

            return (
              <ListItem
                component="button"
                key={index}
                onClick={() => handleMenuItemClick(settingKey)}
                sx={{
                  border: "none",
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  marginBottom: "4px",
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  backgroundColor: isActive ? (t) => t.palette.action.selected : "transparent",
                  boxShadow: isActive ? (t) => `inset 0 0 0 1px ${t.palette.divider}` : "none",
                  "&:hover": {
                    backgroundColor: isActive
                      ? (t) => t.palette.action.selected
                      : (t) => t.palette.action.hover,
                  },
                  "&:active": { transform: "scale(0.98)" },
                }}
              >
                <ListItemText
                  primary={label}
                  primaryTypographyProps={{
                    sx: {
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "14px",
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? (t) => t.palette.text.primary : (t) => t.palette.text.secondary,
                      letterSpacing: "-0.1px",
                      transition: "color 0.18s",
                    },
                  }}
                />
                {isActive && (
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      backgroundColor: (t) => t.palette.text.primary,
                      flexShrink: 0,
                      opacity: 0.7,
                    }}
                  />
                )}
              </ListItem>
            );
          })}
        </List>

        {/* Footer */}
        <Box sx={{ px: 3, py: 2.5, borderTop: "1px solid", borderColor: (t) => t.palette.divider }}>
          <Typography
            sx={{
              fontSize: "11px",
              color: (t) => t.palette.text.disabled,
              fontFamily: "'DM Sans', sans-serif",
              letterSpacing: "0.3px",
            }}
          >
            v2.4.1
          </Typography>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          backgroundColor: (t) => t.palette.background.default,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {currentSetting && (
          <Box
            sx={{
              px: 5,
              py: 3,
              borderBottom: "1px solid",
              borderColor: (t) => t.palette.divider,
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Typography
              sx={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "12px",
                color: (t) => t.palette.text.disabled,
                letterSpacing: "0.3px",
              }}
            >
              Settings
            </Typography>
            <Typography sx={{ fontSize: "12px", color: (t) => t.palette.text.disabled }}>
              /
            </Typography>
            <Typography
              sx={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "12px",
                fontWeight: 500,
                color: (t) => t.palette.text.secondary,
                letterSpacing: "0.3px",
                textTransform: "capitalize",
              }}
            >
              {activeLabel}
            </Typography>
          </Box>
        )}

        {/* Content area */}
        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: currentSetting ? "flex-start" : "center",
            px: 5,
            py: 5,
          }}
        >
          {renderContent()}
        </Box>
      </Box>
    </Box>
  );
};

export default SettingsPage;