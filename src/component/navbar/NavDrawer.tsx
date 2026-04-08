import { useState, useEffect, useRef, useCallback } from "react";
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
    Close as CloseIcon,
} from "@mui/icons-material";
import { Box, Drawer, IconButton, useMediaQuery, useTheme, Badge, Dialog, Button, Tooltip, Typography } from "@mui/material";
import BlankProfileImage from "../../static/profile_blank.png";
import { faSignIn, faUserPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

/* ─── Static CSS ────────────────────────────────────────────────── */
const staticStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

  .nav-item {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 12px; border-radius: 12px; cursor: pointer;
    transition: background 0.15s ease; text-decoration: none !important;
    margin: 1px 0; user-select: none; -webkit-tap-highlight-color: transparent;
  }
  .nav-item:hover { background: var(--nav-hover); }
  .nav-item.active { background: var(--nav-active-bg); }
  .nav-item.active:hover { background: var(--nav-active-bg); }

  .nav-icon {
    width: 22px; height: 22px; display: flex; align-items: center;
    justify-content: center; flex-shrink: 0; color: var(--nav-text); position: relative;
  }
  .nav-item.active .nav-icon { color: var(--nav-text-active); }

  .nav-label {
    font-family: 'Inter', -apple-system, sans-serif;
    font-size: 0.875rem; font-weight: 400; color: var(--nav-text); white-space: nowrap;
  }
  .nav-item.active .nav-label { font-weight: 500; color: var(--nav-text-active); }

  .nav-item.create-btn { background: #7c5cfc; margin-top: 8px; }
  .nav-item.create-btn:hover { background: #6b4de0; }
  .nav-item.create-btn .nav-icon,
  .nav-item.create-btn .nav-label { color: #fff !important; }

  .nav-item.danger .nav-icon,
  .nav-item.danger .nav-label { color: var(--nav-danger) !important; }
  .nav-item.danger:hover { background: var(--nav-danger-bg); }

  .nav-toggle {
    width: 28px !important; height: 28px !important;
    border-radius: 8px !important; border: 1px solid var(--nav-border) !important;
    background: var(--nav-surface) !important; color: var(--nav-text) !important;
    transition: border-color 0.15s, background 0.15s !important;
  }
  .nav-toggle:hover { background: var(--nav-hover) !important; border-color: var(--nav-text) !important; }

  .nav-divider { height: 1px; background: var(--nav-border); margin: 6px 4px; }

  .profile-avatar { width: 22px; height: 22px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }

  .brand-text {
    font-family: 'Inter', sans-serif; font-weight: 600; font-size: 1.2rem;
    color: #7c5cfc; letter-spacing: -0.3px; white-space: nowrap;
  }

  /* ── desktop toast ── */
  @keyframes toast-in {
    from { opacity: 0; transform: translateY(10px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes toast-out {
    from { opacity: 1; transform: translateY(0) scale(1); }
    to   { opacity: 0; transform: translateY(6px) scale(0.97); }
  }
  .msg-toast        { animation: toast-in  0.22s ease forwards; }
  .msg-toast.hiding { animation: toast-out 0.18s ease forwards; }

  /* ── mobile banner ── */
  @keyframes banner-in  { from { transform: translateY(-100%); } to { transform: translateY(0); } }
  @keyframes banner-out { from { transform: translateY(0); } to { transform: translateY(-100%); } }
  .mob-banner        { animation: banner-in  0.28s cubic-bezier(0.22,1,0.36,1) forwards; }
  .mob-banner.hiding { animation: banner-out 0.22s ease forwards; }

  /* shared progress bar */
  @keyframes progress-drain {
    from { transform: scaleX(1); }
    to   { transform: scaleX(0); }
  }
  .toast-progress {
    transform-origin: left;
    animation: progress-drain var(--toast-duration, 4s) linear forwards;
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
        Object.entries(vars).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
    }, [theme]);
}

/* ─── Types ─────────────────────────────────────────────────────── */
interface NavDrawerProps {
    unreadMessagesCount: number | null;
    unreadNotificationsCount: number | null;
    setUnreadMessagesCount: (count: number) => void;
}

interface MessagePreview {
    senderId: number;
    senderUsername: string;
    senderProfilePicture: string | null;
    messageText: string;
}

interface ToastItem {
    id: number;
    preview: MessagePreview;
    hiding: boolean;
    version: number;
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

const TOAST_DURATION = 64000;

/* ─── useToastStack ──────────────────────────────────────────────── */
function useToastStack() {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const timerMap = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
    const idRef = useRef(0);

    const scheduleRemove = useCallback((id: number) => {
        const existing = timerMap.current.get(id);
        if (existing) clearTimeout(existing);

        const hideTimer = setTimeout(() => {
            setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, hiding: true } : t)));
            const removeTimer = setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
                timerMap.current.delete(id);
            }, 260);
            timerMap.current.set(id, removeTimer);
        }, TOAST_DURATION);

        timerMap.current.set(id, hideTimer);
    }, []);

    const push = useCallback(
        (preview: MessagePreview) => {
            setToasts((prev) => {
                const existingIdx = prev.findIndex((t) => t.preview.senderId === preview.senderId);

                if (existingIdx !== -1) {
                    const existing = prev[existingIdx];
                    scheduleRemove(existing.id);
                    const next = [...prev];
                    next[existingIdx] = {
                        ...existing,
                        preview: { ...preview },
                        hiding: false,
                        version: existing.version + 1,
                    };
                    return next;
                }

                const id = ++idRef.current;
                scheduleRemove(id);
                return [...prev, { id, preview, hiding: false, version: 0 }];
            });
        },
        [scheduleRemove],
    );

    const dismiss = useCallback((id: number) => {
        const existing = timerMap.current.get(id);
        if (existing) clearTimeout(existing);
        setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, hiding: true } : t)));
        const t = setTimeout(() => {
            setToasts((prev) => prev.filter((toast) => toast.id !== id));
            timerMap.current.delete(id);
        }, 260);
        timerMap.current.set(id, t);
    }, []);

    const dismissAll = useCallback(() => {
        timerMap.current.forEach((t) => clearTimeout(t));
        timerMap.current.clear();
        setToasts([]);
    }, []);

    useEffect(
        () => () => {
            timerMap.current.forEach((t) => clearTimeout(t));
        },
        [],
    );

    return { toasts, push, dismiss, dismissAll };
}

/* ─── Mobile full-width banner (top of screen) ───────────────────── */
function MobileBanner({ toast, onDismiss, onClick }: { toast: ToastItem; onDismiss: (id: number) => void; onClick: (senderId: number) => void }) {
    return (
        <Box
            className={`mob-banner${toast.hiding ? " hiding" : ""}`}
            onClick={() => {
                onDismiss(toast.id);
                onClick(toast.preview.senderId);
            }}
            sx={{
                position: "fixed",
                mx: 1,
                my: 1.5,
                top: 0,
                left: 0,
                right: 0,
                zIndex: 1500,
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                px: 2,
                pt: "calc(env(safe-area-inset-top) + 10px)",
                pb: "12px",
                backgroundColor: (t) => t.palette.background.paper,
                border: "1px solid",
                borderColor: (t) => t.palette.divider,
                borderRadius: "14px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                cursor: "pointer",
                userSelect: "none",
                overflow: "hidden",
            }}
        >
            {/* Avatar */}
            <Box sx={{ position: "relative", flexShrink: 0 }}>
                <img
                    src={toast.preview.senderProfilePicture || BlankProfileImage}
                    alt={toast.preview.senderUsername}
                    style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", display: "block" }}
                />
                <Box
                    sx={{
                        position: "absolute",
                        bottom: 0,
                        right: 0,
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: "#7c5cfc",
                        border: "2px solid",
                        borderColor: (t) => t.palette.background.paper,
                    }}
                />
            </Box>

            {/* Text */}
            <Box sx={{ flex: 1, overflow: "hidden" }}>
                <Typography
                    sx={{
                        fontFamily: "'Inter',sans-serif",
                        fontWeight: 600,
                        fontSize: "0.82rem",
                        color: (t) => t.palette.text.primary,
                        lineHeight: 1.3,
                    }}
                >
                    {toast.preview.senderUsername}
                </Typography>
                <Typography
                    noWrap
                    sx={{ fontFamily: "'Inter',sans-serif", fontSize: "0.8rem", color: (t) => t.palette.text.secondary, lineHeight: 1.4 }}
                >
                    {toast.preview.messageText || "Sent you a message"}
                </Typography>
            </Box>

            {/* Dismiss */}
            <IconButton
                size="small"
                onClick={(e) => {
                    e.stopPropagation();
                    onDismiss(toast.id);
                }}
                sx={{ color: (t) => t.palette.text.disabled, p: 0.5, flexShrink: 0 }}
            >
                <CloseIcon sx={{ fontSize: "1rem" }} />
            </IconButton>

            {/* Progress bar — keyed on version to restart animation on each new message */}
            <Box
                key={`${toast.id}-${toast.version}`}
                className="toast-progress"
                sx={
                    {
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: "2px",
                        background: "#7c5cfc",
                        "--toast-duration": `${TOAST_DURATION}ms`,
                    } as React.CSSProperties
                }
            />
        </Box>
    );
}

/* ─── Mobile banner stack (renders newest on top, others slide up underneath) ── */
function MobileBannerStack({
    toasts,
    onDismiss,
    onNavigate,
}: {
    toasts: ToastItem[];
    onDismiss: (id: number) => void;
    onNavigate: (senderId: number) => void;
}) {
    if (toasts.length === 0) return null;
    // Only show the most recent (last) toast as the top banner.
    // Earlier ones auto-expire naturally; stacking full-width banners would cover too much screen.
    const latest = toasts[toasts.length - 1];
    return <MobileBanner toast={latest} onDismiss={onDismiss} onClick={onNavigate} />;
}

/* ─── Desktop toast (bottom-right corner) ───────────────────────── */
function DesktopToast({
    toast,
    index,
    total,
    onDismiss,
    onClick,
}: {
    toast: ToastItem;
    index: number;
    total: number;
    onDismiss: (id: number) => void;
    onClick: (senderId: number) => void;
}) {
    const stackOffset = (total - 1 - index) * 58;

    return (
        <Box
            className={`msg-toast${toast.hiding ? " hiding" : ""}`}
            onClick={() => {
                onDismiss(toast.id);
                onClick(toast.preview.senderId);
            }}
            sx={{
                position: "absolute",
                bottom: stackOffset,
                right: 0,
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                px: 1.75,
                py: 1.25,
                borderRadius: "14px",
                backgroundColor: (t) => t.palette.background.paper,
                border: "1px solid",
                borderColor: (t) => t.palette.divider,
                boxShadow: "0 6px 20px rgba(0,0,0,0.13)",
                cursor: "pointer",
                width: 300,
                userSelect: "none",
                overflow: "hidden",
                transform: `scale(${1 - (total - 1 - index) * 0.025})`,
                transformOrigin: "bottom right",
                transition: "bottom 0.22s ease, transform 0.22s ease",
            }}
        >
            <Box sx={{ position: "relative", flexShrink: 0 }}>
                <img
                    src={toast.preview.senderProfilePicture || BlankProfileImage}
                    alt={toast.preview.senderUsername}
                    style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", display: "block" }}
                />
                <Box
                    sx={{
                        position: "absolute",
                        bottom: 0,
                        right: 0,
                        width: 9,
                        height: 9,
                        borderRadius: "50%",
                        background: "#7c5cfc",
                        border: "2px solid",
                        borderColor: (t) => t.palette.background.paper,
                    }}
                />
            </Box>

            <Box sx={{ flex: 1, overflow: "hidden" }}>
                <Typography
                    sx={{
                        fontFamily: "'Inter',sans-serif",
                        fontWeight: 600,
                        fontSize: "0.8rem",
                        color: (t) => t.palette.text.primary,
                        lineHeight: 1.3,
                    }}
                >
                    {toast.preview.senderUsername}
                </Typography>
                <Typography
                    noWrap
                    sx={{ fontFamily: "'Inter',sans-serif", fontSize: "0.775rem", color: (t) => t.palette.text.secondary, lineHeight: 1.4 }}
                >
                    {toast.preview.messageText || "Sent you a message"}
                </Typography>
            </Box>

            <IconButton
                size="small"
                onClick={(e) => {
                    e.stopPropagation();
                    onDismiss(toast.id);
                }}
                sx={{ color: (t) => t.palette.text.disabled, p: 0.25, flexShrink: 0 }}
            >
                <CloseIcon sx={{ fontSize: "0.85rem" }} />
            </IconButton>

            <Box
                key={`${toast.id}-${toast.version}`}
                className="toast-progress"
                sx={
                    {
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: "2px",
                        background: "#7c5cfc",
                        "--toast-duration": `${TOAST_DURATION}ms`,
                    } as React.CSSProperties
                }
            />
        </Box>
    );
}

function DesktopToastStack({
    toasts,
    onDismiss,
    onNavigate,
}: {
    toasts: ToastItem[];
    onDismiss: (id: number) => void;
    onNavigate: (senderId: number) => void;
}) {
    if (toasts.length === 0) return null;
    const containerHeight = 68 + (toasts.length - 1) * 58;
    return (
        <Box sx={{ position: "fixed", bottom: 20, right: 20, zIndex: 1400, height: containerHeight, width: 300 }}>
            {toasts.map((toast, index) => (
                <DesktopToast key={toast.id} toast={toast} index={index} total={toasts.length} onDismiss={onDismiss} onClick={onNavigate} />
            ))}
        </Box>
    );
}

/* ─── NavDrawer ──────────────────────────────────────────────────── */
export default function NavDrawer({ unreadMessagesCount, unreadNotificationsCount, setUnreadMessagesCount }: NavDrawerProps) {
    const theme = useTheme();
    const navigate = useNavigate();
    useNavCssVars();

    const hideDrawer = ["/login", "/register", "/reset-password", "/verify-email"].includes(location.pathname);

    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const isMd = useMediaQuery(theme.breakpoints.up("md"));

    const [open, setOpen] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [moreOpen, setMoreOpen] = useState(false);

    const { toasts, push, dismiss, dismissAll } = useToastStack();

    const currentUser = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")!) : null;

    const DRAWER_OPEN = 232;
    const DRAWER_CLOSED = 68;

    useEffect(() => {
        setOpen(isMd);
    }, [isMd]);

    useEffect(() => {
        socket.on("unreadMessagesCount", (data) => {
            setUnreadMessagesCount(data.unreadCount);
            if (data.preview && !location.pathname.startsWith("/messages")) {
                push(data.preview);
            }
        });
        return () => {
            socket.off("unreadMessagesCount");
        };
    }, [push]);

    useEffect(() => {
        if (location.pathname.startsWith("/messages")) dismissAll();
    }, [location.pathname, dismissAll]);

    const handleNavigateToChat = useCallback(
        (senderId: number) => {
            dismissAll();
            navigate(`/messages/${senderId}`);
        },
        [dismissAll, navigate],
    );

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
                  icon: <img src={currentUser?.profile_picture_url || BlankProfileImage} alt="Profile" className="profile-avatar" />,
                  activeIcon: <img src={currentUser?.profile_picture_url || BlankProfileImage} alt="Profile" className="profile-avatar" />,
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

    const isActive = (segment: string) => (segment === "messages" ? location.pathname.startsWith("/messages") : location.pathname === `/${segment}`);

    if (hideDrawer) return null;

    /* ── MOBILE ─────────────────────────────────────────────────── */
    if (isMobile) {
        const items = navItems.filter((i): i is Extract<NavItem, { kind: "item" }> => i.kind === "item");
        const leftItems = items.filter((i) => ["", "search"].includes(i.segment));
        const rightItems = items.filter((i) => i.segment === "messages" || i.segment === `profile/${currentUser?.id}`);
        const loggedOutItems = items;

        const MobNavItem = ({ item }: { item: Extract<NavItem, { kind: "item" }> }) => {
            const active = isActive(item.segment);
            return (
                <Box
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
                        color: active ? (t) => t.palette.text.primary : (t) => t.palette.text.disabled,
                        minHeight: 44,
                        WebkitTapHighlightColor: "transparent",
                        transition: "color 0.15s",
                    }}
                >
                    <Box sx={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {active ? item.activeIcon : item.icon}
                    </Box>
                </Box>
            );
        };

        return (
            <>
                {/* Full-width top banner for mobile */}
                <MobileBannerStack toasts={toasts} onDismiss={dismiss} onNavigate={handleNavigateToChat} />

                {/* Bottom nav bar */}
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
                            {leftItems.map((item) => (
                                <MobNavItem key={item.segment} item={item} />
                            ))}
                            <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
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
                            {rightItems.map((item) => (
                                <MobNavItem key={item.segment} item={item} />
                            ))}
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
    const NavItemEl = ({ item }: { item: Extract<NavItem, { kind: "item" }> }) => {
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
                <Box sx={{ display: "flex", flexDirection: "column", height: "100%", padding: "12px 10px 16px" }}>
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
                                    <IconButton className="nav-toggle" onClick={() => setOpen(false)} size="small">
                                        <ChevronLeft sx={{ fontSize: "1rem" }} />
                                    </IconButton>
                                </Tooltip>
                            </>
                        ) : (
                            <Tooltip title="Expand" placement="right">
                                <IconButton className="nav-toggle" onClick={() => setOpen(true)} size="small">
                                    <ChevronRight sx={{ fontSize: "1rem" }} />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Box>

                    <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
                        {navItems.map((item, i) => {
                            if (item.kind === "divider") return <div key={i} className="nav-divider" />;
                            return <NavItemEl key={item.segment} item={item} />;
                        })}

                        {currentUser?.id &&
                            (() => {
                                const btn = (
                                    <Box className="nav-item create-btn" onClick={() => setModalOpen(true)} sx={{ display: "flex", mt: "6px" }}>
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

                    {currentUser?.id && (
                        <>
                            <div className="nav-divider" />
                            {(() => {
                                const btn = (
                                    <Box className="nav-item" onClick={() => navigate("/settings?setting=profiledetails")} sx={{ display: "flex" }}>
                                        <span className="nav-icon">
                                            <SettingsOutlined sx={{ fontSize: "1.2rem" }} />
                                        </span>
                                        {open && <span className="nav-label">Settings</span>}
                                    </Box>
                                );
                                return open ? (
                                    btn
                                ) : (
                                    <Tooltip title="Settings" placement="right" arrow>
                                        {btn}
                                    </Tooltip>
                                );
                            })()}
                            {(() => {
                                const btn = (
                                    <Box className="nav-item danger" onClick={() => setMoreOpen(true)} sx={{ display: "flex" }}>
                                        <span className="nav-icon">
                                            <LogoutOutlined sx={{ fontSize: "1.2rem" }} />
                                        </span>
                                        {open && <span className="nav-label">Log out</span>}
                                    </Box>
                                );
                                return open ? (
                                    btn
                                ) : (
                                    <Tooltip title="Log out" placement="right" arrow>
                                        {btn}
                                    </Tooltip>
                                );
                            })()}
                        </>
                    )}
                </Box>
            </Drawer>

            {/* Desktop bottom-right toast stack */}
            <DesktopToastStack toasts={toasts} onDismiss={dismiss} onNavigate={handleNavigateToChat} />

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
                BackdropProps={{ sx: { backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" } }}
            >
                <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
                    <Typography
                        sx={{ fontFamily: "'Inter',sans-serif", fontWeight: 500, fontSize: "0.95rem", color: (t) => t.palette.text.primary, mb: 0.5 }}
                    >
                        Log out of Ripple?
                    </Typography>
                    <Typography sx={{ fontFamily: "'Inter',sans-serif", fontSize: "0.83rem", color: (t) => t.palette.text.secondary }}>
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
                            fontFamily: "'Inter',sans-serif",
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
                            fontFamily: "'Inter',sans-serif",
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
