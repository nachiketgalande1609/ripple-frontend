import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import socket from "../../services/socket";
import CreatePostModal from "../../component/post/CreatePostModal";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComment } from "@fortawesome/free-regular-svg-icons";
import { faComment as faCommentSolid, faSearch } from "@fortawesome/free-solid-svg-icons";
import BlankProfileImage from "../../static/profile_blank.png";
import { faSignIn, faUserPlus } from "@fortawesome/free-solid-svg-icons";
import { Box, Drawer, IconButton, useMediaQuery, useTheme, Badge, Dialog, Button, Tooltip } from "@mui/material";
import {
    HomeOutlined,
    Home as HomeFilled,
    Add as AddIcon,
    FavoriteBorder,
    Favorite,
    MoreHoriz,
    ChevronLeft,
    ChevronRight,
} from "@mui/icons-material";

/* ─── Static styles (only geometry/animation — no colors) ──────── */
const staticStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

  .nav-item {
    position: relative;
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 11px 14px;
    border-radius: var(--nav-radius);
    cursor: pointer;
    transition: background var(--transition), transform var(--transition);
    text-decoration: none !important;
    margin: 2px 0;
    overflow: hidden;
  }

  .nav-item:hover {
    background: var(--nav-hover);
    transform: translateX(2px);
  }

  .nav-item.active {
    background: var(--nav-active-bg);
  }

  .nav-item.active:hover {
    background: var(--nav-active-bg);
    transform: none;
  }

  .nav-item .nav-icon {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    z-index: 1;
    color: var(--nav-text);
    transition: color var(--transition);
  }

  .nav-item.active .nav-icon { color: var(--nav-active-text); }

  .nav-item .nav-label {
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--nav-text);
    white-space: nowrap;
    position: relative;
    z-index: 1;
    transition: opacity var(--transition), transform var(--transition), color var(--transition);
  }

  .nav-item.active .nav-label {
    color: var(--nav-active-text);
    font-weight: 600;
  }

  .nav-item.create-btn {
    background: linear-gradient(135deg, var(--nav-accent), var(--nav-accent2));
    margin-top: 8px;
  }

  .nav-item.create-btn:hover {
    background: linear-gradient(135deg, #6b4de0, #e55520);
    transform: translateX(2px) scale(1.01);
  }

  .nav-item.create-btn .nav-icon,
  .nav-item.create-btn .nav-label { color: #fff !important; }

  .brand-logo {
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: 1.6rem;
    background: linear-gradient(135deg, var(--nav-accent) 0%, var(--nav-accent2) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: -0.5px;
    user-select: none;
    white-space: nowrap;
  }

  .toggle-btn {
    width: 28px !important;
    height: 28px !important;
    background: var(--nav-surface) !important;
    border: 1px solid var(--nav-border) !important;
    color: var(--nav-text) !important;
    transition: all var(--transition) !important;
  }

  .toggle-btn:hover {
    background: var(--nav-hover) !important;
    border-color: var(--nav-accent) !important;
    color: var(--nav-active-bg) !important;
  }

  .nav-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--nav-border), transparent);
    margin: 8px 0;
    border: none;
  }

  .profile-avatar {
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid transparent;
    background-clip: padding-box;
    box-shadow: 0 0 0 2px var(--nav-border);
    transition: box-shadow var(--transition);
  }

  .nav-item.active .profile-avatar { box-shadow: 0 0 0 2px var(--nav-active-text); }
  .nav-item:hover .profile-avatar  { box-shadow: 0 0 0 2px var(--nav-accent); }

  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateX(-8px); }
    to   { opacity: 1; transform: translateX(0); }
  }

  .label-animate { animation: fadeSlideIn 0.2s ease forwards; }
`;

if (typeof document !== "undefined" && !document.getElementById("nav-styles")) {
    const s = document.createElement("style");
    s.id = "nav-styles";
    s.textContent = staticStyles;
    document.head.appendChild(s);
}

/* ─── Inject / update CSS variables from the MUI theme ─────────── */
function useNavCssVars() {
    const theme = useTheme();

    useEffect(() => {
        const vars: Record<string, string> = {
            "--nav-bg": theme.palette.background.default,
            "--nav-surface": theme.palette.background.paper,
            "--nav-border": theme.palette.divider,
            "--nav-hover": theme.palette.action.hover,
            // Active state: invert — white pill on dark, dark pill on light
            "--nav-active-bg": theme.palette.action.disabled,
            "--nav-active-text": theme.palette.text.primary,
            "--nav-text": theme.palette.text.secondary,
            "--nav-accent": "#7c5cfc",
            "--nav-accent2": "#ff6b35",
            "--nav-width-open": "240px",
            "--nav-width-closed": "72px",
            "--nav-radius": "16px",
            "--transition": "0.25s cubic-bezier(0.4,0,0.2,1)",
        };
        Object.entries(vars).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
    }, [theme]);
}

interface NavDrawerProps {
    unreadMessagesCount: number | null;
    unreadNotificationsCount: number | null;
    setUnreadMessagesCount: (count: number) => void;
}

export default function NavDrawer({ unreadMessagesCount, unreadNotificationsCount, setUnreadMessagesCount }: NavDrawerProps) {
    const theme = useTheme();
    const navigate = useNavigate();
    useNavCssVars(); // ← keeps CSS vars in sync with MUI theme

    const hideDrawer = ["/login", "/register", "/reset-password", "/verify-email"].includes(location.pathname);

    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const isMd = useMediaQuery(theme.breakpoints.up("md"));
    const [open, setOpen] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);

    const currentUser = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")!) : null;

    const DRAWER_OPEN = 240;
    const DRAWER_CLOSED = 72;

    useEffect(() => {
        setOpen(isMd);
    }, [isMd]);

    useEffect(() => {
        socket.on("unreadMessagesCount", (data) => setUnreadMessagesCount(data.unreadCount));
        return () => {
            socket.off("unreadMessagesCount");
        };
    }, []);

    const handleLogout = () => {
        if (currentUser) socket.disconnect();
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("privateKey");
        setOpenDialog(false);
        navigate("/login");
    };

    const handleCloseDialog = () => setOpenDialog(false);

    type NavItem =
        | { kind: "header" }
        | {
              kind: "item";
              segment: string;
              title: string;
              icon: React.ReactNode;
              activeIcon: React.ReactNode;
          };

    const navItems: NavItem[] = currentUser
        ? [
              { kind: "header" },
              {
                  kind: "item",
                  segment: "",
                  title: "Home",
                  icon: <HomeOutlined sx={{ fontSize: "1.4rem" }} />,
                  activeIcon: <HomeFilled sx={{ fontSize: "1.4rem" }} />,
              },
              {
                  kind: "item",
                  segment: "search",
                  title: "Search",
                  icon: <FontAwesomeIcon icon={faSearch} style={{ fontSize: "1.15rem" }} />,
                  activeIcon: <FontAwesomeIcon icon={faSearch} style={{ fontSize: "1.15rem" }} />,
              },
              {
                  kind: "item",
                  segment: "messages",
                  title: "Messages",
                  icon: (
                      <Badge
                          badgeContent={unreadMessagesCount}
                          color="error"
                          sx={{
                              "& .MuiBadge-badge": {
                                  fontSize: "0.6rem",
                                  minWidth: 16,
                                  height: 16,
                              },
                          }}
                      >
                          <FontAwesomeIcon icon={faComment} style={{ fontSize: "1.2rem" }} />
                      </Badge>
                  ),
                  activeIcon: (
                      <Badge
                          badgeContent={unreadMessagesCount}
                          color="error"
                          sx={{
                              "& .MuiBadge-badge": {
                                  fontSize: "0.6rem",
                                  minWidth: 16,
                                  height: 16,
                              },
                          }}
                      >
                          <FontAwesomeIcon icon={faCommentSolid} style={{ fontSize: "1.2rem" }} />
                      </Badge>
                  ),
              },
              {
                  kind: "item",
                  segment: "notifications",
                  title: "Notifications",
                  icon: (
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
                          <FavoriteBorder sx={{ fontSize: "1.4rem" }} />
                      </Badge>
                  ),
                  activeIcon: (
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
                          <Favorite sx={{ fontSize: "1.4rem" }} />
                      </Badge>
                  ),
              },
              {
                  kind: "item",
                  segment: `profile/${currentUser.id}`,
                  title: "Profile",
                  icon: (
                      <img
                          src={currentUser?.profile_picture_url || BlankProfileImage}
                          alt="Profile"
                          className="profile-avatar"
                          style={{ width: 26, height: 26 }}
                      />
                  ),
                  activeIcon: (
                      <img
                          src={currentUser?.profile_picture_url || BlankProfileImage}
                          alt="Profile"
                          className="profile-avatar"
                          style={{ width: 26, height: 26 }}
                      />
                  ),
              },
          ]
        : [
              { kind: "header" },
              {
                  kind: "item",
                  segment: "login",
                  title: "Login",
                  icon: <FontAwesomeIcon icon={faSignIn} style={{ fontSize: "1.15rem" }} />,
                  activeIcon: <FontAwesomeIcon icon={faSignIn} style={{ fontSize: "1.15rem" }} />,
              },
              {
                  kind: "item",
                  segment: "register",
                  title: "Register",
                  icon: <FontAwesomeIcon icon={faUserPlus} style={{ fontSize: "1.15rem" }} />,
                  activeIcon: <FontAwesomeIcon icon={faUserPlus} style={{ fontSize: "1.15rem" }} />,
              },
          ];

    const isActive = (segment: string) => (segment === "messages" ? location.pathname.startsWith("/messages") : location.pathname === `/${segment}`);

    if (hideDrawer) return null;

    /* ─── MOBILE ──────────────────────────────────────────────────── */
    if (isMobile) {
        const allItems = navItems.filter(
            (item): item is Extract<NavItem, { kind: "item" }> => item.kind === "item" && item.segment !== "notifications",
        );
        const leftItems = allItems.filter((item) => ["", "search"].includes(item.segment));
        const rightItems = allItems.filter((item) => item.segment === "messages" || item.segment === `profile/${currentUser?.id}`);
        const loggedOutItems = allItems;

        const renderMobileNavItem = (item: Extract<NavItem, { kind: "item" }>) => {
            const active = isActive(item.segment);
            return (
                <Box
                    key={item.segment}
                    component={Link}
                    to={`/${item.segment}`}
                    sx={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "5px",
                        py: 1,
                        textDecoration: "none",
                        color: active ? (t) => t.palette.text.primary : (t) => t.palette.text.disabled,
                        transition: "color 0.2s ease",
                        minHeight: 44,
                        WebkitTapHighlightColor: "transparent",
                    }}
                >
                    <Box
                        sx={{
                            fontSize: "1.5rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 28,
                            height: 28,
                        }}
                    >
                        {active ? item.activeIcon : item.icon}
                    </Box>
                    <Box
                        sx={{
                            fontSize: "0.65rem",
                            fontFamily: "'DM Sans', sans-serif",
                            fontWeight: active ? 600 : 400,
                            letterSpacing: "0.01em",
                        }}
                    >
                        {item.title}
                    </Box>
                </Box>
            );
        };

        return (
            <>
                <Box
                    sx={{
                        position: "fixed",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: "calc(68px + env(safe-area-inset-bottom))",
                        pb: "env(safe-area-inset-bottom)",
                        backgroundColor: (t) => t.palette.background.paper,
                        backdropFilter: "blur(20px) saturate(180%)",
                        WebkitBackdropFilter: "blur(20px) saturate(180%)",
                        borderTop: "1px solid",
                        borderColor: (t) => t.palette.divider,
                        display: "flex",
                        alignItems: "center",
                        px: 1,
                        zIndex: 1200,
                    }}
                >
                    {currentUser?.id ? (
                        <>
                            {leftItems.map(renderMobileNavItem)}
                            <Box
                                sx={{
                                    flex: 1,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Box
                                    onClick={() => setModalOpen(true)}
                                    sx={{
                                        width: 46,
                                        height: 46,
                                        borderRadius: "14px",
                                        background: "linear-gradient(135deg, #7c5cfc, #ff6b35)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        cursor: "pointer",
                                        WebkitTapHighlightColor: "transparent",
                                        transition: "transform 0.15s ease, opacity 0.15s ease",
                                        "&:active": { transform: "scale(0.92)", opacity: 0.9 },
                                    }}
                                >
                                    <AddIcon sx={{ color: "#fff", fontSize: "1.4rem" }} />
                                </Box>
                            </Box>
                            {rightItems.map(renderMobileNavItem)}
                        </>
                    ) : (
                        loggedOutItems.map(renderMobileNavItem)
                    )}
                </Box>
                <CreatePostModal open={modalOpen} handleClose={() => setModalOpen(false)} />
            </>
        );
    }

    /* ─── DESKTOP ─────────────────────────────────────────────────── */
    return (
        <>
            <Drawer
                variant="permanent"
                anchor="left"
                open={open}
                sx={{
                    width: open ? DRAWER_OPEN : DRAWER_CLOSED,
                    minWidth: open ? DRAWER_OPEN : DRAWER_CLOSED,
                    flexShrink: 0,
                    transition: "width 0.25s cubic-bezier(0.4,0,0.2,1), min-width 0.25s cubic-bezier(0.4,0,0.2,1)",
                    "& .MuiDrawer-paper": {
                        width: open ? DRAWER_OPEN : DRAWER_CLOSED,
                        minWidth: open ? DRAWER_OPEN : DRAWER_CLOSED,
                        transition: "width 0.25s cubic-bezier(0.4,0,0.2,1), min-width 0.25s cubic-bezier(0.4,0,0.2,1)",
                        boxSizing: "border-box",
                        overflowX: "hidden",
                        backgroundColor: (t) => t.palette.background.default,
                        borderRight: "1px solid",
                        borderColor: (t) => t.palette.divider,
                        boxShadow: "4px 0 40px rgba(0,0,0,0.3)",
                    },
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        height: "100%",
                        padding: "12px 10px",
                        gap: 0,
                    }}
                >
                    {/* ── Header ─────────────────────────────────────── */}
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: open ? "space-between" : "center",
                            height: 64,
                            px: open ? 1 : 0,
                            mb: 1,
                            flexShrink: 0,
                        }}
                    >
                        {open ? (
                            <>
                                <span className="brand-logo">Ripple</span>
                                <Tooltip title="Collapse" placement="right">
                                    <IconButton className="toggle-btn" onClick={() => setOpen(false)} size="small">
                                        <ChevronLeft sx={{ fontSize: "1rem" }} />
                                    </IconButton>
                                </Tooltip>
                            </>
                        ) : (
                            <Tooltip title="Expand" placement="right">
                                <IconButton className="toggle-btn" onClick={() => setOpen(true)} size="small">
                                    <ChevronRight sx={{ fontSize: "1rem" }} />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Box>

                    {/* ── Nav items ──────────────────────────────────── */}
                    <Box
                        sx={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            gap: 0,
                            mt: 1,
                        }}
                    >
                        {navItems.map((item) => {
                            if (item.kind === "header") return null;
                            const active = isActive(item.segment);
                            const inner = (
                                <Box
                                    key={item.segment}
                                    component={Link}
                                    to={`/${item.segment}`}
                                    className={`nav-item${active ? " active" : ""}`}
                                    onClick={() => {
                                        if (item.segment === "messages") setOpen(false);
                                    }}
                                    sx={{ display: "flex" }}
                                >
                                    <span className="nav-icon">{active ? item.activeIcon : item.icon}</span>
                                    {open && <span className="nav-label label-animate">{item.title}</span>}
                                </Box>
                            );
                            return open ? (
                                inner
                            ) : (
                                <Tooltip key={item.segment} title={item.title} placement="right" arrow>
                                    {inner}
                                </Tooltip>
                            );
                        })}

                        {/* Create Post */}
                        {currentUser?.id &&
                            (() => {
                                const btn = (
                                    <Box className="nav-item create-btn" onClick={() => setModalOpen(true)} sx={{ display: "flex", mt: 1 }}>
                                        <span className="nav-icon">
                                            <AddIcon sx={{ fontSize: "1.2rem" }} />
                                        </span>
                                        {open && <span className="nav-label label-animate">Create Post</span>}
                                    </Box>
                                );
                                return open ? (
                                    btn
                                ) : (
                                    <Tooltip title="Create Post" placement="right" arrow>
                                        {btn}
                                    </Tooltip>
                                );
                            })()}
                    </Box>

                    {/* ── Footer ─────────────────────────────────────── */}
                    {currentUser?.id && (
                        <>
                            <Box className="nav-divider" />
                            {(() => {
                                const btn = (
                                    <Box className="nav-item" onClick={() => setOpenDialog(true)} sx={{ display: "flex", mt: 1 }}>
                                        <span className="nav-icon">
                                            <MoreHoriz sx={{ fontSize: "1.3rem" }} />
                                        </span>
                                        {open && <span className="nav-label label-animate">More</span>}
                                    </Box>
                                );
                                return open ? (
                                    btn
                                ) : (
                                    <Tooltip title="More" placement="right" arrow>
                                        {btn}
                                    </Tooltip>
                                );
                            })()}
                        </>
                    )}
                </Box>
            </Drawer>

            {/* ── More Dialog ──────────────────────────────────────── */}
            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
                fullWidth
                maxWidth="xs"
                sx={{
                    "& .MuiDialog-paper": {
                        borderRadius: "20px",
                        backgroundColor: (t) => t.palette.background.paper,
                        border: "1px solid",
                        borderColor: (t) => t.palette.divider,
                        boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
                        color: (t) => t.palette.text.primary,
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
                                color: (t) => t.palette.text.primary,
                                lineHeight: 1.3,
                            }}
                        >
                            {currentUser?.username || "User"}
                        </Box>
                        <Box
                            sx={{
                                fontFamily: "'DM Sans', sans-serif",
                                fontSize: "0.75rem",
                                color: (t) => t.palette.text.disabled,
                            }}
                        >
                            Manage your account
                        </Box>
                    </Box>
                </Box>

                {/* Divider */}
                <Box
                    sx={{
                        height: "1px",
                        backgroundColor: (t) => t.palette.divider,
                        mx: 1,
                        mb: 0.5,
                    }}
                />

                {/* Settings */}
                <Button
                    fullWidth
                    onClick={() => {
                        navigate("/settings?setting=profiledetails");
                        setOpenDialog(false);
                    }}
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
                        color: (t) => t.palette.text.secondary,
                        transition: "all 0.2s ease",
                        "&:hover": {
                            background: "rgba(124,92,252,0.12)",
                            color: (t) => t.palette.text.primary,
                            "& .dialog-icon-wrap": {
                                background: "rgba(124,92,252,0.25)",
                                color: "#a989ff",
                            },
                        },
                    }}
                >
                    <Box
                        className="dialog-icon-wrap"
                        sx={{
                            width: 34,
                            height: 34,
                            borderRadius: "10px",
                            backgroundColor: (t) => t.palette.action.hover,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: (t) => t.palette.text.disabled,
                            transition: "all 0.2s ease",
                            flexShrink: 0,
                        }}
                    >
                        <SettingsRoundedIcon sx={{ fontSize: "1.1rem" }} />
                    </Box>
                    Settings
                </Button>

                {/* Logout */}
                <Button
                    fullWidth
                    onClick={() => {
                        handleLogout();
                        setOpenDialog(false);
                    }}
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
                        color: (t) => t.palette.error.light,
                        transition: "all 0.2s ease",
                        "&:hover": {
                            background: `${theme.palette.error.main}1a`,
                            color: (t) => t.palette.error.light,
                            "& .dialog-icon-wrap-danger": {
                                background: `${theme.palette.error.main}30`,
                                color: (t) => t.palette.error.light,
                            },
                        },
                    }}
                >
                    <Box
                        className="dialog-icon-wrap-danger"
                        sx={{
                            width: 34,
                            height: 34,
                            borderRadius: "10px",
                            backgroundColor: `${theme.palette.error.main}14`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: (t) => t.palette.error.light,
                            transition: "all 0.2s ease",
                            flexShrink: 0,
                        }}
                    >
                        <LogoutRoundedIcon sx={{ fontSize: "1.1rem" }} />
                    </Box>
                    Log out
                </Button>

                {/* Divider */}
                <Box
                    sx={{
                        height: "1px",
                        backgroundColor: (t) => t.palette.divider,
                        mx: 1,
                        my: 0.5,
                    }}
                />

                {/* Cancel */}
                <Button
                    fullWidth
                    onClick={handleCloseDialog}
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
                        color: (t) => t.palette.text.disabled,
                        transition: "all 0.2s ease",
                        "&:hover": {
                            backgroundColor: (t) => t.palette.action.hover,
                            color: (t) => t.palette.text.secondary,
                        },
                    }}
                >
                    <Box
                        sx={{
                            width: 34,
                            height: 34,
                            borderRadius: "10px",
                            backgroundColor: (t) => t.palette.action.hover,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: (t) => t.palette.text.disabled,
                            flexShrink: 0,
                        }}
                    >
                        <CloseRoundedIcon sx={{ fontSize: "1.1rem" }} />
                    </Box>
                    Cancel
                </Button>
            </Dialog>

            <CreatePostModal open={modalOpen} handleClose={() => setModalOpen(false)} />
        </>
    );
}
