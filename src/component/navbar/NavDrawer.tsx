import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import socket from "../../services/socket";
import CreatePostModal from "../../component/post/CreatePostModal";
import {
    Home as HomeFilled,
    HomeOutlined,
    Add as AddIcon,
    FavoriteBorder,
    Favorite,
    ChevronLeft,
    ChevronRight,
    SearchRounded,
    ChatBubbleOutlineRounded,
    ChatBubbleRounded,
    SettingsOutlined,
    LogoutOutlined,
} from "@mui/icons-material";
import {
    Box,
    Drawer,
    IconButton,
    useMediaQuery,
    useTheme,
    Badge,
    Dialog,
    Button,
    Tooltip,
    Typography,
} from "@mui/material";
import BlankProfileImage from "../../static/profile_blank.png";
import { faSignIn, faUserPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

/* ─── Static CSS ────────────────────────────────────────────────── */
const staticStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

  .nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 12px;
    cursor: pointer;
    transition: background 0.15s ease;
    text-decoration: none !important;
    margin: 1px 0;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }

  .nav-item:hover { background: var(--nav-hover); }
  .nav-item.active { background: var(--nav-active-bg); }
  .nav-item.active:hover { background: var(--nav-active-bg); }

  .nav-icon {
    width: 22px;
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: var(--nav-text);
    position: relative;
  }

  .nav-item.active .nav-icon { color: var(--nav-text-active); }

  .nav-label {
    font-family: 'Inter', -apple-system, sans-serif;
    font-size: 0.875rem;
    font-weight: 400;
    color: var(--nav-text);
    white-space: nowrap;
  }

  .nav-item.active .nav-label {
    font-weight: 500;
    color: var(--nav-text-active);
  }

  .nav-item.create-btn {
    background: #7c5cfc;
    margin-top: 8px;
  }
  .nav-item.create-btn:hover { background: #6b4de0; }
  .nav-item.create-btn .nav-icon,
  .nav-item.create-btn .nav-label { color: #fff !important; }

  .nav-item.danger .nav-icon,
  .nav-item.danger .nav-label { color: var(--nav-danger) !important; }
  .nav-item.danger:hover { background: var(--nav-danger-bg); }

  .nav-toggle {
    width: 28px !important;
    height: 28px !important;
    border-radius: 8px !important;
    border: 1px solid var(--nav-border) !important;
    background: var(--nav-surface) !important;
    color: var(--nav-text) !important;
    transition: border-color 0.15s, background 0.15s !important;
  }
  .nav-toggle:hover {
    background: var(--nav-hover) !important;
    border-color: var(--nav-text) !important;
  }

  .nav-divider {
    height: 1px;
    background: var(--nav-border);
    margin: 6px 4px;
  }

  .profile-avatar {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }

  .brand-text {
    font-family: 'Inter', sans-serif;
    font-weight: 600;
    font-size: 1.2rem;
    color: #7c5cfc;
    letter-spacing: -0.3px;
    white-space: nowrap;
  }
`;

if (typeof document !== "undefined" && !document.getElementById("nav-styles-v2")) {
    const s = document.createElement("style");
    s.id = "nav-styles-v2";
    s.textContent = staticStyles;
    document.head.appendChild(s);
}

/* ─── CSS variables from MUI theme ─────────────────────────────── */
function useNavCssVars() {
    const theme = useTheme();
    useEffect(() => {
        const vars: Record<string, string> = {
            "--nav-bg": theme.palette.background.default,
            "--nav-surface": theme.palette.background.paper,
            "--nav-border": theme.palette.divider,
            "--nav-hover": theme.palette.action.hover,
            "--nav-active-bg": theme.palette.action.selected,
            "--nav-text": theme.palette.text.secondary,
            "--nav-text-active": theme.palette.text.primary,
            "--nav-danger": theme.palette.error.main,
            "--nav-danger-bg": `${theme.palette.error.main}14`,
        };
        Object.entries(vars).forEach(([k, v]) =>
            document.documentElement.style.setProperty(k, v)
        );
    }, [theme]);
}

/* ─── Types ─────────────────────────────────────────────────────── */
interface NavDrawerProps {
    unreadMessagesCount: number | null;
    unreadNotificationsCount: number | null;
    setUnreadMessagesCount: (count: number) => void;
}

type NavItem =
    | { kind: "divider" }
    | {
          kind: "item";
          segment: string;
          title: string;
          icon: React.ReactNode;
          activeIcon: React.ReactNode;
          extraClass?: string;
      };

/* ─── Component ─────────────────────────────────────────────────── */
export default function NavDrawer({
    unreadMessagesCount,
    unreadNotificationsCount,
    setUnreadMessagesCount,
}: NavDrawerProps) {
    const theme = useTheme();
    const navigate = useNavigate();
    useNavCssVars();

    const hideDrawer = ["/login", "/register", "/reset-password", "/verify-email"].includes(
        location.pathname
    );

    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const isMd = useMediaQuery(theme.breakpoints.up("md"));

    const [open, setOpen] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [moreOpen, setMoreOpen] = useState(false);

    const currentUser = localStorage.getItem("user")
        ? JSON.parse(localStorage.getItem("user")!)
        : null;

    const DRAWER_OPEN = 232;
    const DRAWER_CLOSED = 68;

    useEffect(() => { setOpen(isMd); }, [isMd]);

    useEffect(() => {
        socket.on("unreadMessagesCount", (data) =>
            setUnreadMessagesCount(data.unreadCount)
        );
        return () => { socket.off("unreadMessagesCount"); };
    }, []);

    const handleLogout = () => {
        if (currentUser) socket.disconnect();
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("privateKey");
        setMoreOpen(false);
        navigate("/login");
    };

    const badgeProps = {
        color: "error" as const,
        sx: { "& .MuiBadge-badge": { fontSize: "0.6rem", minWidth: 15, height: 15 } },
    };

    const navItems: NavItem[] = currentUser
        ? [
              {
                  kind: "item",
                  segment: "",
                  title: "Home",
                  icon: <HomeOutlined sx={{ fontSize: "1.25rem" }} />,
                  activeIcon: <HomeFilled sx={{ fontSize: "1.25rem" }} />,
              },
              {
                  kind: "item",
                  segment: "search",
                  title: "Search",
                  icon: <SearchRounded sx={{ fontSize: "1.25rem" }} />,
                  activeIcon: <SearchRounded sx={{ fontSize: "1.25rem" }} />,
              },
              {
                  kind: "item",
                  segment: "messages",
                  title: "Messages",
                  icon: (
                      <Badge badgeContent={unreadMessagesCount} {...badgeProps}>
                          <ChatBubbleOutlineRounded sx={{ fontSize: "1.2rem" }} />
                      </Badge>
                  ),
                  activeIcon: (
                      <Badge badgeContent={unreadMessagesCount} {...badgeProps}>
                          <ChatBubbleRounded sx={{ fontSize: "1.2rem" }} />
                      </Badge>
                  ),
              },
              {
                  kind: "item",
                  segment: "notifications",
                  title: "Notifications",
                  icon: (
                      <Badge badgeContent={unreadNotificationsCount} {...badgeProps}>
                          <FavoriteBorder sx={{ fontSize: "1.25rem" }} />
                      </Badge>
                  ),
                  activeIcon: (
                      <Badge badgeContent={unreadNotificationsCount} {...badgeProps}>
                          <Favorite sx={{ fontSize: "1.25rem" }} />
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
                      />
                  ),
                  activeIcon: (
                      <img
                          src={currentUser?.profile_picture_url || BlankProfileImage}
                          alt="Profile"
                          className="profile-avatar"
                      />
                  ),
              },
          ]
        : [
              {
                  kind: "item",
                  segment: "login",
                  title: "Log in",
                  icon: <FontAwesomeIcon icon={faSignIn} style={{ fontSize: "1rem" }} />,
                  activeIcon: <FontAwesomeIcon icon={faSignIn} style={{ fontSize: "1rem" }} />,
              },
              {
                  kind: "item",
                  segment: "register",
                  title: "Register",
                  icon: <FontAwesomeIcon icon={faUserPlus} style={{ fontSize: "1rem" }} />,
                  activeIcon: <FontAwesomeIcon icon={faUserPlus} style={{ fontSize: "1rem" }} />,
              },
          ];

    const isActive = (segment: string) =>
        segment === "messages"
            ? location.pathname.startsWith("/messages")
            : location.pathname === `/${segment}`;

    if (hideDrawer) return null;

    /* ── MOBILE ─────────────────────────────────────────────────── */
    if (isMobile) {
        const items = navItems.filter(
            (i): i is Extract<NavItem, { kind: "item" }> => i.kind === "item"
        );
        const leftItems = items.filter((i) => ["", "search"].includes(i.segment));
        const rightItems = items.filter(
            (i) => i.segment === "messages" || i.segment === `profile/${currentUser?.id}`
        );
        const loggedOutItems = items;

        const MobNavItem = ({ item }: { item: Extract<NavItem, { kind: "item" }> }) => {
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
                        gap: "3px",
                        py: 1,
                        textDecoration: "none",
                        color: active
                            ? (t) => t.palette.text.primary
                            : (t) => t.palette.text.disabled,
                        minHeight: 44,
                        WebkitTapHighlightColor: "transparent",
                        transition: "color 0.15s",
                    }}
                >
                    <Box
                        sx={{
                            width: 24,
                            height: 24,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        {active ? item.activeIcon : item.icon}
                    </Box>
                    {/* <Box
                        sx={{
                            fontSize: "0.65rem",
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: active ? 500 : 400,
                        }}
                    >
                        {item.title}
                    </Box> */}
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
                        height: "calc(60px + env(safe-area-inset-bottom))",
                        pb: "env(safe-area-inset-bottom)",
                        backgroundColor: (t) => t.palette.background.paper,
                        borderTop: "1px solid",
                        borderColor: (t) => t.palette.divider,
                        display: "flex",
                        alignItems: "center",
                        px: 2,
                        zIndex: 1200,
                    }}
                >
                    {currentUser?.id ? (
                        <>
                            {leftItems.map((item) => <MobNavItem key={item.segment} item={item} />)}
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
                                        width: 42,
                                        height: 42,
                                        borderRadius: "13px",
                                        background: "#7c5cfc",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        cursor: "pointer",
                                        WebkitTapHighlightColor: "transparent",
                                        transition: "transform 0.1s ease, opacity 0.1s ease",
                                        "&:active": { transform: "scale(0.92)", opacity: 0.85 },
                                    }}
                                >
                                    <AddIcon sx={{ color: "#fff", fontSize: "1.3rem" }} />
                                </Box>
                            </Box>
                            {rightItems.map((item) => <MobNavItem key={item.segment} item={item} />)}
                        </>
                    ) : (
                        loggedOutItems.map((item) => <MobNavItem key={item.segment} item={item} />)
                    )}
                </Box>
                <CreatePostModal open={modalOpen} handleClose={() => setModalOpen(false)} />
            </>
        );
    }

    /* ── DESKTOP ────────────────────────────────────────────────── */
    const NavItemEl = ({
        item,
    }: {
        item: Extract<NavItem, { kind: "item" }>;
    }) => {
        const active = isActive(item.segment);
        const el = (
            <Box
                component={Link}
                to={`/${item.segment}`}
                className={`nav-item${active ? " active" : ""}${item.extraClass ? ` ${item.extraClass}` : ""}`}
                onClick={() => {
                    if (item.segment === "messages" && open) setOpen(false);
                }}
                sx={{ display: "flex" }}
            >
                <span className="nav-icon">{active ? item.activeIcon : item.icon}</span>
                {open && <span className="nav-label">{item.title}</span>}
            </Box>
        );
        return open ? (
            el
        ) : (
            <Tooltip key={item.segment} title={item.title} placement="right" arrow>
                {el}
            </Tooltip>
        );
    };

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
                    transition: "width 0.2s ease, min-width 0.2s ease",
                    "& .MuiDrawer-paper": {
                        width: open ? DRAWER_OPEN : DRAWER_CLOSED,
                        minWidth: open ? DRAWER_OPEN : DRAWER_CLOSED,
                        transition: "width 0.2s ease, min-width 0.2s ease",
                        boxSizing: "border-box",
                        overflowX: "hidden",
                        backgroundColor: (t) => t.palette.background.default,
                        borderRight: "1px solid",
                        borderColor: (t) => t.palette.divider,
                        boxShadow: "none",
                    },
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        height: "100%",
                        padding: "12px 10px 16px",
                    }}
                >
                    {/* Header */}
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: open ? "space-between" : "center",
                            height: 52,
                            px: open ? "4px" : 0,
                            mb: 1,
                            flexShrink: 0,
                        }}
                    >
                        {open ? (
                            <>
                                <span className="brand-text">Ripple</span>
                                <Tooltip title="Collapse" placement="right">
                                    <IconButton
                                        className="nav-toggle"
                                        onClick={() => setOpen(false)}
                                        size="small"
                                    >
                                        <ChevronLeft sx={{ fontSize: "1rem" }} />
                                    </IconButton>
                                </Tooltip>
                            </>
                        ) : (
                            <Tooltip title="Expand" placement="right">
                                <IconButton
                                    className="nav-toggle"
                                    onClick={() => setOpen(true)}
                                    size="small"
                                >
                                    <ChevronRight sx={{ fontSize: "1rem" }} />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Box>

                    {/* Nav items */}
                    <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
                        {navItems.map((item, i) => {
                            if (item.kind === "divider") return <div key={i} className="nav-divider" />;
                            return <NavItemEl key={item.segment} item={item} />;
                        })}

                        {/* Create Post */}
                        {currentUser?.id &&
                            (() => {
                                const btn = (
                                    <Box
                                        className="nav-item create-btn"
                                        onClick={() => setModalOpen(true)}
                                        sx={{ display: "flex", mt: "6px" }}
                                    >
                                        <span className="nav-icon">
                                            <AddIcon sx={{ fontSize: "1.15rem" }} />
                                        </span>
                                        {open && <span className="nav-label">Create post</span>}
                                    </Box>
                                );
                                return open ? (
                                    btn
                                ) : (
                                    <Tooltip title="Create post" placement="right" arrow>
                                        {btn}
                                    </Tooltip>
                                );
                            })()}
                    </Box>

                    {/* Footer */}
                    {currentUser?.id && (
                        <>
                            <div className="nav-divider" />
                            {/* Settings */}
                            {(() => {
                                const btn = (
                                    <Box
                                        className="nav-item"
                                        onClick={() => {
                                            navigate("/settings?setting=profiledetails");
                                        }}
                                        sx={{ display: "flex" }}
                                    >
                                        <span className="nav-icon">
                                            <SettingsOutlined sx={{ fontSize: "1.2rem" }} />
                                        </span>
                                        {open && <span className="nav-label">Settings</span>}
                                    </Box>
                                );
                                return open ? btn : (
                                    <Tooltip title="Settings" placement="right" arrow>{btn}</Tooltip>
                                );
                            })()}
                            {/* Log out */}
                            {(() => {
                                const btn = (
                                    <Box
                                        className="nav-item danger"
                                        onClick={() => setMoreOpen(true)}
                                        sx={{ display: "flex" }}
                                    >
                                        <span className="nav-icon">
                                            <LogoutOutlined sx={{ fontSize: "1.2rem" }} />
                                        </span>
                                        {open && <span className="nav-label">Log out</span>}
                                    </Box>
                                );
                                return open ? btn : (
                                    <Tooltip title="Log out" placement="right" arrow>{btn}</Tooltip>
                                );
                            })()}
                        </>
                    )}
                </Box>
            </Drawer>

            {/* Logout confirmation dialog */}
            <Dialog
                open={moreOpen}
                onClose={() => setMoreOpen(false)}
                maxWidth="xs"
                fullWidth
                sx={{
                    "& .MuiDialog-paper": {
                        borderRadius: "16px",
                        backgroundColor: (t) => t.palette.background.paper,
                        border: "1px solid",
                        borderColor: (t) => t.palette.divider,
                        padding: "8px",
                        boxShadow: "0 16px 40px rgba(0,0,0,0.2)",
                    },
                }}
                BackdropProps={{
                    sx: { backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" },
                }}
            >
                <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
                    <Typography
                        sx={{
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: 500,
                            fontSize: "0.95rem",
                            color: (t) => t.palette.text.primary,
                            mb: 0.5,
                        }}
                    >
                        Log out of Ripple?
                    </Typography>
                    <Typography
                        sx={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: "0.83rem",
                            color: (t) => t.palette.text.secondary,
                        }}
                    >
                        You can always log back in.
                    </Typography>
                </Box>

                <Box sx={{ display: "flex", gap: 1, px: 1, pt: 1, pb: 0.5 }}>
                    <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => setMoreOpen(false)}
                        sx={{
                            borderRadius: "10px",
                            textTransform: "none",
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: 500,
                            fontSize: "0.875rem",
                            borderColor: (t) => t.palette.divider,
                            color: (t) => t.palette.text.secondary,
                            "&:hover": { borderColor: (t) => t.palette.text.secondary, background: "transparent" },
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        fullWidth
                        onClick={handleLogout}
                        sx={{
                            borderRadius: "10px",
                            textTransform: "none",
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: 500,
                            fontSize: "0.875rem",
                            background: (t) => t.palette.error.main,
                            color: "#fff",
                            "&:hover": { background: (t) => t.palette.error.dark },
                        }}
                    >
                        Log out
                    </Button>
                </Box>
            </Dialog>

            <CreatePostModal open={modalOpen} handleClose={() => setModalOpen(false)} />
        </>
    );
}