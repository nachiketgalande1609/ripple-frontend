import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

import socket from "../../services/socket";
import CreatePostModal from "../../component/post/CreatePostModal";
import UploadStoryDialog from "../../component/stories/UploadStoryDialog";
import CreatePollModal from "../../component/post/CreatePollModal";
import {
    Home as HomeFilled,
    HomeOutlined,
    Add as AddIcon,
    FavoriteBorder,
    Favorite,
    Search as SearchFilled,
    SearchRounded,
    ChatBubbleOutlineRounded,
    ChatBubbleRounded,
    SettingsOutlined,
    LogoutOutlined,
    Close as CloseIcon,
    BarChartRounded,
    CameraAlt as CameraAltIcon,
    AutoStories as AutoStoriesIcon,
    Poll as PollIcon,
} from "@mui/icons-material";
import { Box, Drawer, useMediaQuery, useTheme, Badge, Dialog, Button, Typography, IconButton, Popover, List, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import BlankProfileImage from "../../static/profile_blank.png";
import LogoImage from "../../static/logo-transparent.png";
import { faSignIn, faUserPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

/* ─── Static CSS ────────────────────────────────────────────────── */
const staticStyles = `
  @keyframes nav-icon-bounce {
    0%   { transform: scale(1); }
    35%  { transform: scale(1.32); }
    65%  { transform: scale(0.88); }
    100% { transform: scale(1); }
  }
  @keyframes nav-icon-pop {
    0%   { transform: scale(1) rotate(0deg); }
    30%  { transform: scale(1.28) rotate(-8deg); }
    60%  { transform: scale(0.92) rotate(4deg); }
    100% { transform: scale(1) rotate(0deg); }
  }
  @keyframes nav-label-in {
    from { opacity: 0; transform: translateX(-8px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes create-panel-in {
    from { opacity: 0; transform: translateX(-10px) scaleX(0.92); }
    to   { opacity: 1; transform: translateX(0) scaleX(1); }
  }
  @keyframes create-item-in {
    from { opacity: 0; transform: translateX(-12px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  .create-panel-open {
    animation: create-panel-in 0.22s cubic-bezier(0.34,1.4,0.64,1) both;
    transform-origin: left center;
  }
  .create-item {
    opacity: 0;
    animation: create-item-in 0.2s cubic-bezier(0.34,1.4,0.64,1) both;
  }
  .create-item:nth-child(1) { animation-delay: 0.06s; }
  .create-item:nth-child(2) { animation-delay: 0.11s; }
  .create-item:nth-child(3) { animation-delay: 0.16s; }

  .nav-item {
    display: flex; align-items: center;
    padding: 11px 11px; cursor: pointer;
    text-decoration: none !important;
    margin: 2px 0; user-select: none; -webkit-tap-highlight-color: transparent;
    position: relative; background: transparent;
    border-radius: 16px;
    transition: background 0.35s cubic-bezier(0.4,0,0.2,1), box-shadow 0.35s cubic-bezier(0.4,0,0.2,1);
  }
  .nav-item:hover:not(.active) { background: transparent; }

  .nav-icon {
    width: 26px; height: 26px; display: flex; align-items: center;
    justify-content: center; flex-shrink: 0; color: var(--nav-text);
    transition: color 0.2s ease, filter 0.2s ease;
    position: relative;
  }
  .nav-item:hover .nav-icon { animation: nav-icon-bounce 0.4s cubic-bezier(0.34,1.56,0.64,1); }
  .nav-item.create-btn:hover .nav-icon { animation: nav-icon-pop 0.4s cubic-bezier(0.34,1.56,0.64,1); }

  .nav-item.active {
    background: var(--nav-bg);
    box-shadow: inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2);
  }
  .nav-item.active .nav-icon { color: #1e293b; }
  .nav-item:hover:not(.active) .nav-icon { color: #475569; }

  .nav-label {
    font-size: 0.875rem; font-weight: 400; color: var(--nav-text); white-space: nowrap;
    display: block; margin-left: 14px;
    transition: color 0.2s ease;
  }
  .nav-item.active .nav-label { font-weight: 600; background: linear-gradient(135deg, #64748B 0%, #94A3B8 100%); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .nav-item:hover:not(.active) .nav-label { color: var(--nav-text-active); }

  .nav-item.create-btn { background: transparent; margin-top: 4px; }
  .nav-item.create-btn .nav-icon { color: #64748B !important; }
  .nav-item.create-btn:hover { background: rgba(100,116,139,0.08); }
  .nav-item.create-btn:hover .nav-icon { color: #475569 !important; }
  .nav-item.create-btn .nav-label { background: linear-gradient(135deg, #64748B 0%, #94A3B8 100%); -webkit-background-clip: text; background-clip: text; color: transparent !important; font-weight: 600; }

  .nav-item.danger .nav-icon,
  .nav-item.danger .nav-label { color: var(--nav-danger) !important; }
  .nav-item.danger:hover { background: rgba(239,68,68,0.06); }

  .profile-avatar { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }

  .brand-text {
    font-weight: 700; font-size: 1.25rem;
    letter-spacing: -0.5px; white-space: nowrap;
  }
  .brand-char {
    background: linear-gradient(135deg, #64748B 0%, #94A3B8 100%);
    -webkit-background-clip: text; background-clip: text; color: transparent;
    display: inline-block;
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

if (typeof document !== "undefined") {
    const existing = document.getElementById("nav-styles-v4");
    if (existing) existing.remove();
    const s = document.createElement("style");
    s.id = "nav-styles-v4";
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
        const isDark = theme.palette.mode === "dark";
        vars["--nav-neo-shadow1"] = isDark ? "#000000" : "#cacaca";
        vars["--nav-neo-shadow2"] = isDark ? "rgba(255,255,255,0.08)" : "#f6f6f6";
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

const TOAST_DURATION = 4000;

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
                    style={{
                        width: 38,
                        height: 38,
                        borderRadius: "50%",
                        objectFit: "cover",
                        display: "block",
                    }}
                />
                <Box
                    sx={{
                        position: "absolute",
                        bottom: 0,
                        right: 0,
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: "#64748B",
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
                    sx={{
                        fontFamily: "'Inter',sans-serif",
                        fontSize: "0.8rem",
                        color: (t) => t.palette.text.secondary,
                        lineHeight: 1.4,
                    }}
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
                        background: "#64748B",
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
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        objectFit: "cover",
                        display: "block",
                    }}
                />
                <Box
                    sx={{
                        position: "absolute",
                        bottom: 0,
                        right: 0,
                        width: 9,
                        height: 9,
                        borderRadius: "50%",
                        background: "#64748B",
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
                    sx={{
                        fontFamily: "'Inter',sans-serif",
                        fontSize: "0.775rem",
                        color: (t) => t.palette.text.secondary,
                        lineHeight: 1.4,
                    }}
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
                        background: "#64748B",
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
        <Box
            sx={{
                position: "fixed",
                bottom: 20,
                right: 20,
                zIndex: 1400,
                height: containerHeight,
                width: 300,
            }}
        >
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
    const location = useLocation();
    const pathnameRef = useRef(location.pathname);

    const hideDrawer = ["/login", "/register", "/reset-password", "/verify-email"].includes(location.pathname);

    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    const [hovered, setHovered] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [moreOpen, setMoreOpen] = useState(false);
    const [storyOpen, setStoryOpen] = useState(false);
    const [pollOpen, setPollOpen] = useState(false);
    const [createAnchor, setCreateAnchor] = useState<HTMLElement | null>(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [panelTop, setPanelTop] = useState(0);
    const createBtnRef = useRef<HTMLDivElement>(null);
    const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const handleNavEnter = () => { if (leaveTimer.current) clearTimeout(leaveTimer.current); setHovered(true); };
    const handleNavLeave = () => { leaveTimer.current = setTimeout(() => { setHovered(false); setCreateOpen(false); }, 80); };

    useEffect(() => {
        if (location.pathname.startsWith("/messages") || location.pathname.startsWith("/settings")) {
            setCreateOpen(false);
            setHovered(false);
        }
    }, [location.pathname]);
    const handleCreateClick = () => {
        if (createBtnRef.current) {
            const rect = createBtnRef.current.getBoundingClientRect();
            setPanelTop(rect.top);
        }
        setCreateOpen((o) => !o);
    };

    const { toasts, push, dismiss, dismissAll } = useToastStack();

    const currentUser = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")!) : null;

    const DRAWER_OPEN = 232;
    const DRAWER_CLOSED = 68;

    useEffect(() => {
        const handleUnreadMessages = (data: any) => {
            setUnreadMessagesCount(data.unreadCount);
            if (data.preview && !pathnameRef.current.startsWith("/messages")) {
                push(data.preview);
            }
        };

        socket.on("unreadMessagesCount", handleUnreadMessages);
        return () => {
            socket.off("unreadMessagesCount", handleUnreadMessages);
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
        sx: {
            "& .MuiBadge-badge": { fontSize: "0.75rem", minWidth: 15, height: 15 },
        },
    };

    const navItems: NavItem[] = currentUser
        ? [
            {
                kind: "item",
                segment: "",
                title: "Home",
                icon: <HomeOutlined sx={{ fontSize: "1.5rem" }} />,
                activeIcon: <HomeFilled sx={{ fontSize: "1.5rem" }} />,
            },
            {
                kind: "item",
                segment: "search",
                title: "Search",
                icon: <SearchRounded sx={{ fontSize: "1.5rem" }} />,
                activeIcon: <SearchRounded sx={{ fontSize: "1.5rem" }} />,
            },
            {
                kind: "item",
                segment: "messages",
                title: "Messages",
                icon: (
                    <Badge badgeContent={unreadMessagesCount} {...badgeProps}>
                        <ChatBubbleOutlineRounded sx={{ fontSize: "1.5rem" }} />
                    </Badge>
                ),
                activeIcon: (
                    <Badge badgeContent={unreadMessagesCount} {...badgeProps}>
                        <ChatBubbleRounded sx={{ fontSize: "1.5rem" }} />
                    </Badge>
                ),
            },
            {
                kind: "item",
                segment: "insights",
                title: "Insights",
                icon: <BarChartRounded sx={{ fontSize: "1.5rem" }} />,
                activeIcon: <BarChartRounded sx={{ fontSize: "1.5rem" }} />,
            },
            {
                kind: "item",
                segment: "notifications",
                title: "Notifications",
                icon: (
                    <Badge badgeContent={unreadNotificationsCount} {...badgeProps}>
                        <FavoriteBorder sx={{ fontSize: "1.5rem" }} />
                    </Badge>
                ),
                activeIcon: (
                    <Badge badgeContent={unreadNotificationsCount} {...badgeProps}>
                        <Favorite sx={{ fontSize: "1.5rem" }} />
                    </Badge>
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
                            <Box
                                sx={{
                                    flex: 1,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Box
                                    onClick={(e) => setCreateAnchor(e.currentTarget)}
                                    sx={{
                                        width: 42,
                                        height: 42,
                                        borderRadius: "13px",
                                        background: "#64748B",
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
                            {rightItems.filter((i) => i.segment !== `profile/${currentUser?.id}`).map((item) => (
                                <MobNavItem key={item.segment} item={item} />
                            ))}
                            {/* Profile avatar */}
                            <Box
                                component={Link}
                                to={`/profile/${currentUser?.id}`}
                                sx={{
                                    flex: 1,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    py: 1,
                                    minHeight: 44,
                                    WebkitTapHighlightColor: "transparent",
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: "50%",
                                        overflow: "hidden",
                                        border: "2px solid",
                                        borderColor: location.pathname === `/profile/${currentUser?.id}` ? "text.primary" : "transparent",
                                        transition: "border-color 0.15s",
                                    }}
                                >
                                    <img
                                        src={currentUser?.profile_picture_url || BlankProfileImage}
                                        alt="Profile"
                                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                                    />
                                </Box>
                            </Box>
                        </>
                    ) : (
                        loggedOutItems.map((item) => <MobNavItem key={item.segment} item={item} />)
                    )}
                </Box>

                <CreatePostModal open={modalOpen} handleClose={() => setModalOpen(false)} />
                <UploadStoryDialog open={storyOpen} onClose={() => setStoryOpen(false)} fetchStories={async () => {}} />
                <CreatePollModal open={pollOpen} onClose={() => setPollOpen(false)} />
                <Popover
                    open={Boolean(createAnchor)}
                    anchorEl={createAnchor}
                    onClose={() => setCreateAnchor(null)}
                    anchorOrigin={{ vertical: "top", horizontal: "center" }}
                    transformOrigin={{ vertical: "bottom", horizontal: "center" }}
                    PaperProps={{
                        sx: {
                            borderRadius: "20px",
                            background: (t) => t.palette.mode === "dark" ? "rgba(30,30,40,0.85)" : "rgba(255,255,255,0.85)",
                            backdropFilter: "blur(18px)",
                            border: "1px solid",
                            borderColor: "divider",
                            boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
                            p: 1.5,
                            mb: 1,
                        },
                    }}
                >
                    <Box sx={{ display: "flex", gap: 1 }}>
                        {[
                            { label: "Post", icon: <CameraAltIcon sx={{ fontSize: "1.4rem" }} />, color: "#6366f1", bg: "rgba(99,102,241,0.12)", action: () => { setCreateAnchor(null); setModalOpen(true); } },
                            { label: "Story", icon: <AutoStoriesIcon sx={{ fontSize: "1.4rem" }} />, color: "#f59e0b", bg: "rgba(245,158,11,0.12)", action: () => { setCreateAnchor(null); setStoryOpen(true); } },
                            { label: "Poll", icon: <PollIcon sx={{ fontSize: "1.4rem" }} />, color: "#10b981", bg: "rgba(16,185,129,0.12)", action: () => { setCreateAnchor(null); setPollOpen(true); } },
                        ].map(({ label, icon, color, bg, action }) => (
                            <Box
                                key={label}
                                onClick={action}
                                sx={{
                                    display: "flex", flexDirection: "column", alignItems: "center", gap: 0.75,
                                    px: 2, py: 1.5, borderRadius: "14px", cursor: "pointer",
                                    transition: "background 0.15s, transform 0.12s",
                                    "&:hover": { background: bg, transform: "translateY(-2px)" },
                                    "&:active": { transform: "scale(0.94)" },
                                }}
                            >
                                <Box sx={{ width: 46, height: 46, borderRadius: "13px", background: bg, display: "flex", alignItems: "center", justifyContent: "center", color }}>
                                    {icon}
                                </Box>
                                <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: "text.secondary", letterSpacing: "0.02em" }}>{label}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Popover>
            </>
        );
    }

    /* ── DESKTOP ────────────────────────────────────────────────── */

    const labelStyle: React.CSSProperties = {
        opacity: hovered ? 1 : 0,
        transform: hovered ? "translateX(0)" : "translateX(-10px)",
        transition: hovered
            ? "opacity 0.2s ease 0.08s, transform 0.25s cubic-bezier(0.34,1.56,0.64,1) 0.08s"
            : "opacity 0.15s ease, transform 0.15s ease",
        whiteSpace: "nowrap",
    };

    const CREATE_PANEL_W = 180;
    const navBg = theme.palette.mode === "light" ? "#ffffff" : theme.palette.background.default;
    const drawerEdge = hovered ? DRAWER_OPEN : DRAWER_CLOSED;

    return (
        <>
            {/* ── fly-out create panel ── */}
            <Box
                onMouseEnter={handleNavEnter}
                onMouseLeave={handleNavLeave}
                sx={{
                    position: "fixed",
                    top: panelTop,
                    left: drawerEdge,
                    width: createOpen ? CREATE_PANEL_W : 0,
                    overflow: "hidden",
                    backgroundColor: navBg,
                    borderTop: createOpen ? "1px solid" : "none",
                    borderRight: createOpen ? "1px solid" : "none",
                    borderBottom: createOpen ? "1px solid" : "none",
                    borderColor: "divider",
                    borderRadius: "0 16px 16px 0",
                    transition: `left 0.28s cubic-bezier(0.4,0,0.2,1), width 0.2s cubic-bezier(0.34,1.2,0.64,1)`,
                    display: "flex",
                    flexDirection: "column",
                    py: createOpen ? 1 : 0,
                    px: createOpen ? 1 : 0,
                    gap: 0.25,
                    zIndex: 1300,
                }}
            >
                {createOpen && (
                    <Box className="create-panel-open" sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
                        {[
                            { label: "Post", icon: <CameraAltIcon sx={{ fontSize: "1.15rem" }} />, color: "#6366f1", bg: "rgba(99,102,241,0.12)", action: () => { setCreateOpen(false); setModalOpen(true); } },
                            { label: "Story", icon: <AutoStoriesIcon sx={{ fontSize: "1.15rem" }} />, color: "#f59e0b", bg: "rgba(245,158,11,0.12)", action: () => { setCreateOpen(false); setStoryOpen(true); } },
                            { label: "Poll", icon: <PollIcon sx={{ fontSize: "1.15rem" }} />, color: "#10b981", bg: "rgba(16,185,129,0.12)", action: () => { setCreateOpen(false); setPollOpen(true); } },
                        ].map(({ label, icon, color, bg, action }) => (
                            <Box
                                key={label}
                                onClick={action}
                                className="create-item"
                                sx={{
                                    display: "flex", alignItems: "center", gap: 1.5,
                                    px: 1.5, py: 1.1, borderRadius: "12px",
                                    cursor: "pointer", whiteSpace: "nowrap",
                                    transition: "background 0.15s",
                                    "&:hover": { background: bg },
                                }}
                            >
                                <Box sx={{ width: 32, height: 32, borderRadius: "9px", background: bg, display: "flex", alignItems: "center", justifyContent: "center", color, flexShrink: 0 }}>
                                    {icon}
                                </Box>
                                <Typography sx={{ fontSize: "0.875rem", fontWeight: 600, color: "text.primary" }}>{label}</Typography>
                            </Box>
                        ))}
                    </Box>
                )}
            </Box>

            <Drawer
                variant="permanent"
                anchor="left"
                open={true}
                onMouseEnter={handleNavEnter}
                onMouseLeave={handleNavLeave}
                sx={{
                    width: DRAWER_CLOSED,
                    minWidth: DRAWER_CLOSED,
                    flexShrink: 0,
                    "& .MuiDrawer-paper": {
                        width: hovered ? DRAWER_OPEN : DRAWER_CLOSED,
                        minWidth: DRAWER_CLOSED,
                        transition: "width 0.28s cubic-bezier(0.4,0,0.2,1), box-shadow 0.28s ease, border-color 0.28s ease",
                        boxSizing: "border-box",
                        overflowX: "hidden",
                        backgroundColor: theme.palette.mode === "light" ? "#ffffff" : theme.palette.background.default,
                        borderRight: "1px solid",
                        borderColor: hovered ? theme.palette.divider : "transparent",
                        boxShadow: hovered ? "8px 0 32px rgba(0,0,0,0.10)" : "none",
                        borderRadius: "0 16px 16px 0",
                        zIndex: 1201,
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
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            height: 52,
                            px: "14px",
                            mb: 1,
                            flexShrink: 0,
                            overflow: "hidden",
                        }}
                    >
                        {/* 26px icon wrapper matches nav-icon width */}
                        <Box sx={{ width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <img src={LogoImage} alt="Ripple" style={{ width: 34, height: 34, objectFit: "contain" }} />
                        </Box>
                        <span className="brand-text brand-char" style={{ ...labelStyle, marginLeft: 14 }}>Ripple</span>
                    </Box>

                    <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
                        {navItems.map((item, i) => {
                            if (item.kind === "divider") return <div key={i} className="nav-divider" />;
                            const it = item as Extract<NavItem, { kind: "item" }>;
                            const active = isActive(it.segment);
                            return (
                                <Box
                                    key={it.segment}
                                    component={Link}
                                    to={`/${it.segment}`}
                                    className={`nav-item${active ? " active" : ""}${it.extraClass ? ` ${it.extraClass}` : ""}`}
                                    sx={{ display: "flex" }}
                                >
                                    <span className="nav-icon">{active ? it.activeIcon : it.icon}</span>
                                    <span className="nav-label" style={labelStyle}>
                                        {it.title}
                                    </span>
                                </Box>
                            );
                        })}

                        {currentUser?.id && (
                            <Box
                                ref={createBtnRef}
                                className={`nav-item create-btn${createOpen ? " active" : ""}`}
                                onClick={handleCreateClick}
                                sx={{ display: "flex", mt: "6px" }}
                            >
                                <span className="nav-icon">
                                    <AddIcon sx={{ fontSize: "2rem", transition: "transform 0.25s", transform: createOpen ? "rotate(45deg)" : "rotate(0deg)" }} />
                                </span>
                                <span className="nav-label" style={labelStyle}>Create</span>
                            </Box>
                        )}
                    </Box>

                    {currentUser?.id && (
                        <>
                            <Box className={`nav-item${location.pathname === `/profile/${currentUser.id}` ? " active" : ""}`} onClick={() => navigate(`/profile/${currentUser.id}`)} sx={{ display: "flex" }}>
                                <span className="nav-icon">
                                    <img src={currentUser?.profile_picture_url || BlankProfileImage} alt="Profile" className="profile-avatar" />
                                </span>
                                <span className="nav-label" style={labelStyle}>
                                    Profile
                                </span>
                            </Box>
                            <Box className={`nav-item${location.pathname === "/settings" ? " active" : ""}`} onClick={() => navigate("/settings?setting=profiledetails")} sx={{ display: "flex" }}>
                                <span className="nav-icon">
                                    <SettingsOutlined sx={{ fontSize: "1.5rem" }} />
                                </span>
                                <span className="nav-label" style={labelStyle}>
                                    Settings
                                </span>
                            </Box>
                            <Box className="nav-item danger" onClick={() => setMoreOpen(true)} sx={{ display: "flex" }}>
                                <span className="nav-icon">
                                    <LogoutOutlined sx={{ fontSize: "1.5rem" }} />
                                </span>
                                <span className="nav-label" style={labelStyle}>
                                    Log out
                                </span>
                            </Box>
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
                        borderRadius: "36px",
                        backgroundColor: "background.paper",
                        border: "1px solid",
                        borderColor: "divider",
                        boxShadow: "0 24px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(100,116,139,0.08)",
                        overflow: "hidden",
                        padding: "6px",
                    },
                }}
                BackdropProps={{ sx: { backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)" } }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.75, mb: 0.5 }}>
                    <img
                        src={currentUser?.profile_picture_url || BlankProfileImage}
                        alt="Profile"
                        style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(100,116,139,0.4)" }}
                    />
                    <Box>
                        <Box sx={{ fontWeight: 600, fontSize: "0.9rem", color: (t: any) => t.palette.text.primary, lineHeight: 1.3 }}>
                            {currentUser?.username}
                        </Box>
                        <Box sx={{ fontSize: "0.75rem", color: (t: any) => t.palette.text.disabled }}>
                            Log out of Ripple?
                        </Box>
                    </Box>
                </Box>
                <Box sx={{ "& button": { borderRadius: "0 !important" }, "& button:first-of-type": { borderRadius: "32px 32px 0 0 !important" }, "& button:last-of-type": { borderRadius: "0 0 32px 32px !important", marginBottom: "0 !important" } }}>
                    <Button fullWidth onClick={handleLogout} sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.4, borderRadius: "18px", textTransform: "none", justifyContent: "flex-start", fontWeight: 500, fontSize: "0.875rem", color: "error.main", border: "none", backgroundColor: "var(--nav-bg)", boxShadow: "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)", transition: "box-shadow 0.35s cubic-bezier(0.4,0,0.2,1)", mb: 0.75, "&:hover": { backgroundColor: "var(--nav-bg)", boxShadow: "inset 3px 3px 10px var(--nav-neo-shadow1), inset -3px -3px 10px var(--nav-neo-shadow2)", color: "error.light" } }}>
                        <Box sx={{ width: 34, height: 34, borderRadius: "10px", backgroundColor: "rgba(211,47,47,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "error.main", flexShrink: 0 }}>
                            <LogoutOutlined sx={{ fontSize: "1.1rem" }} />
                        </Box>
                        Log out
                    </Button>
                    <Button fullWidth onClick={() => setMoreOpen(false)} sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.4, borderRadius: "18px", textTransform: "none", justifyContent: "flex-start", fontWeight: 500, fontSize: "0.875rem", color: "text.disabled", border: "none", backgroundColor: "var(--nav-bg)", boxShadow: "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)", transition: "box-shadow 0.35s cubic-bezier(0.4,0,0.2,1)", mb: 0.75, "&:hover": { backgroundColor: "var(--nav-bg)", boxShadow: "inset 3px 3px 10px var(--nav-neo-shadow1), inset -3px -3px 10px var(--nav-neo-shadow2)", color: "text.secondary" } }}>
                        <Box sx={{ width: 34, height: 34, borderRadius: "10px", backgroundColor: "action.hover", display: "flex", alignItems: "center", justifyContent: "center", color: "text.disabled", flexShrink: 0 }}>
                            <CloseIcon sx={{ fontSize: "1.1rem" }} />
                        </Box>
                        Cancel
                    </Button>
                </Box>
            </Dialog>

            <CreatePostModal open={modalOpen} handleClose={() => setModalOpen(false)} />
            <UploadStoryDialog open={storyOpen} onClose={() => setStoryOpen(false)} fetchStories={async () => {}} />
            <CreatePollModal open={pollOpen} onClose={() => setPollOpen(false)} />
        </>
    );
}
