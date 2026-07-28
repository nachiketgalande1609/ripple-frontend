import { useState, useEffect } from "react";
import { Drawer, Box, Typography, IconButton, Avatar, Skeleton, Tooltip } from "@mui/material";
import { ChevronRight, AddRounded, CheckRounded, DashboardCustomizeOutlined } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import SuggestedUsers from "./SuggestedUsers";
import AddAccountDialog from "./AddAccountDialog";
import { getNotifications } from "../services/api";
import { timeAgo } from "../utils/utils";
import BlankProfileImage from "../static/profile_blank.png";
import { getAccounts, switchAccount, StoredAccount } from "../utils/accounts";
import { useGlobalStore } from "../store/store";
import { useTranslation } from "react-i18next";

const DRAWER_WIDTH = 288;

interface Notification {
    id: number;
    type: string;
    message: string;
    post_id: number | null;
    created_at: string;
    sender_id: string;
    username: string;
    profile_picture: string;
}

function SectionLabel({ label, action, onAction }: { label: string; action?: string; onAction?: () => void }) {
    return (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.25 }}>
            <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "text.disabled" }}>
                {label}
            </Typography>
            {action && (
                <Typography onClick={onAction} sx={{ fontSize: "0.7rem", color: "text.disabled", cursor: "pointer", display: "flex", alignItems: "center", gap: 0.25, "&:hover": { color: "text.primary" } }}>
                    {action} <ChevronRight sx={{ fontSize: 13 }} />
                </Typography>
            )}
        </Box>
    );
}

function NotificationsSection() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getNotifications()
            .then((res) => setNotifications((res.data ?? []).slice(0, 3)))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    if (!loading && notifications.length === 0) return null;

    return (
        <Box sx={{ mb: 3 }}>
            <SectionLabel label={t("quickPanel.recentActivity")} action={t("quickPanel.seeAll")} onAction={() => navigate("/notifications")} />
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
                {loading
                    ? Array.from({ length: 3 }).map((_, i) => (
                        <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1.25, py: 0.875 }}>
                            <Skeleton variant="circular" width={32} height={32} sx={{ flexShrink: 0 }} />
                            <Box sx={{ flex: 1 }}>
                                <Skeleton width="80%" height={10} sx={{ borderRadius: "6px" }} />
                                <Skeleton width="40%" height={8} sx={{ borderRadius: "6px", mt: "5px" }} />
                            </Box>
                        </Box>
                    ))
                    : notifications.map((n) => (
                        <Box key={n.id} onClick={() => navigate(`/profile/${n.sender_id}`)}
                            sx={{ display: "flex", alignItems: "center", gap: 1.25, py: 0.75, px: 0.75, borderRadius: "10px", cursor: "pointer", transition: "background 0.15s", "&:hover": { backgroundColor: "action.hover" } }}>
                            <Avatar src={n.profile_picture || BlankProfileImage} sx={{ width: 30, height: 30, flexShrink: 0 }}
                                onError={(e) => { (e.target as HTMLImageElement).src = BlankProfileImage; }} />
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography noWrap sx={{ fontSize: "0.75rem", color: "text.primary", lineHeight: 1.4 }}>
                                    <strong>{n.username}</strong> {n.message}
                                </Typography>
                                <Typography sx={{ fontSize: "0.65rem", color: "text.disabled", lineHeight: 1.3 }}>
                                    {timeAgo(n.created_at)}
                                </Typography>
                            </Box>
                        </Box>
                    ))}
            </Box>
        </Box>
    );
}

function AccountSwitcher() {
    const { t } = useTranslation();
    const currentUser = useGlobalStore((s) => s.user);
    const [accounts, setAccounts] = useState<StoredAccount[]>([]);
    const [switching, setSwitching] = useState<string | null>(null);
    const [addDialogOpen, setAddDialogOpen] = useState(false);

    useEffect(() => { setAccounts(getAccounts()); }, []);

    const handleSwitch = (id: string) => {
        if (id === String(currentUser?.id)) return;
        setSwitching(id);
        switchAccount(id);
        window.location.href = "/";
    };

    const otherAccounts = accounts.filter((a) => String(a.id) !== String(currentUser?.id));

    return (
        <Box sx={{ mb: 3 }}>
            <SectionLabel label={t("quickPanel.accounts")} />

            {/* Current account */}
            {currentUser && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, py: 0.875, px: 0.75, borderRadius: "10px", mb: 0.25, backgroundColor: "action.selected" }}>
                    <Avatar src={currentUser.profile_picture_url || BlankProfileImage} sx={{ width: 32, height: 32, flexShrink: 0 }}
                        onError={(e) => { (e.target as HTMLImageElement).src = BlankProfileImage; }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography noWrap sx={{ fontSize: "0.8rem", fontWeight: 600, color: "text.primary", lineHeight: 1.3 }}>
                            {currentUser.username}
                        </Typography>
                        <Typography noWrap sx={{ fontSize: "0.65rem", color: "text.disabled", lineHeight: 1.3 }}>
                            {currentUser.email}
                        </Typography>
                    </Box>
                    <CheckRounded sx={{ fontSize: 15, color: "text.secondary", flexShrink: 0 }} />
                </Box>
            )}

            {/* Other accounts */}
            {otherAccounts.map((acc) => (
                <Box key={acc.id} onClick={() => handleSwitch(acc.id)}
                    sx={{ display: "flex", alignItems: "center", gap: 1.25, py: 0.875, px: 0.75, borderRadius: "10px", cursor: "pointer", transition: "background 0.15s", "&:hover": { backgroundColor: "action.hover" }, opacity: switching === acc.id ? 0.5 : 1 }}>
                    <Avatar src={acc.profile_picture_url || BlankProfileImage} sx={{ width: 32, height: 32, flexShrink: 0 }}
                        onError={(e) => { (e.target as HTMLImageElement).src = BlankProfileImage; }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography noWrap sx={{ fontSize: "0.8rem", fontWeight: 600, color: "text.primary", lineHeight: 1.3 }}>{acc.username}</Typography>
                        <Typography noWrap sx={{ fontSize: "0.65rem", color: "text.disabled", lineHeight: 1.3 }}>{acc.email}</Typography>
                    </Box>
                    <Box component="button" onClick={(e) => { e.stopPropagation(); handleSwitch(acc.id); }}
                        sx={{ display: "inline-flex", alignItems: "center", justifyContent: "center", px: "10px", height: "26px", borderRadius: "10px", border: "none", background: "var(--nav-bg)", boxShadow: "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)", color: "text.secondary", fontSize: "0.68rem", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", userSelect: "none", outline: "none", flexShrink: 0, transition: "box-shadow 0.25s", fontFamily: "'Inter', sans-serif" }}>
                        {t("quickPanel.switchAccount")}
                    </Box>
                </Box>
            ))}

            <AddAccountDialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} />

            {/* Add account */}
            <Box onClick={() => setAddDialogOpen(true)}
                sx={{ display: "flex", alignItems: "center", gap: 1.25, py: 0.875, px: 0.75, mt: 0.25, borderRadius: "10px", cursor: "pointer", transition: "background 0.15s", "&:hover": { backgroundColor: "action.hover" } }}>
                <Box sx={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px dashed", borderColor: "divider" }}>
                    <AddRounded sx={{ fontSize: 16, color: "text.disabled" }} />
                </Box>
                <Typography sx={{ fontSize: "0.78rem", fontWeight: 500, color: "text.secondary" }}>
                    {t("quickPanel.addAccount")}
                </Typography>
            </Box>
        </Box>
    );
}

export default function SuggestionsDrawer() {
    const { t } = useTranslation();
    const [open, setOpen] = useState(true);

    return (
        <>
            {/* Collapsed tab */}
            {!open && (
                <Tooltip title={t("quickPanel.title")} placement="left">
                    <Box onClick={() => setOpen(true)}
                        sx={{ position: "fixed", right: 0, top: "20px", zIndex: 1200, width: 32, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backgroundColor: "background.paper", borderLeft: "1px solid", borderTop: "1px solid", borderBottom: "1px solid", borderColor: "divider", borderRadius: "10px 0 0 10px", "&:hover": { backgroundColor: "action.hover" } }}>
                        <DashboardCustomizeOutlined sx={{ fontSize: 16, color: "text.secondary" }} />
                    </Box>
                </Tooltip>
            )}

            <Drawer variant="persistent" anchor="right" open={open}
                sx={{
                    width: open ? DRAWER_WIDTH : 0,
                    flexShrink: 0,
                    transition: "width 0.25s cubic-bezier(0.4,0,0.2,1)",
                    "& .MuiDrawer-paper": {
                        width: DRAWER_WIDTH,
                        boxSizing: "border-box",
                        backgroundColor: "background.paper",
                        borderLeft: "1px solid",
                        borderColor: "divider",
                        borderRight: "none",
                        overflowX: "hidden",
                        boxShadow: "none",
                        transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
                    },
                }}
            >
                <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                    {/* Header */}
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, pt: 2.5, pb: 2, flexShrink: 0, borderBottom: "1px solid", borderColor: "divider" }}>
                        <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.04em", color: "text.primary" }}>
                            {t("quickPanel.title")}
                        </Typography>
                        <IconButton size="small" onClick={() => setOpen(false)}
                            sx={{ color: "text.disabled", p: 0.5, borderRadius: "8px", "&:hover": { backgroundColor: "action.hover", color: "text.primary" } }}>
                            <ChevronRight sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Box>

                    {/* Content */}
                    <Box sx={{ flex: 1, overflowY: "auto", px: 2, pt: 2.5, pb: 3 }}>
                        <AccountSwitcher />

                        <Box sx={{ borderTop: "1px solid", borderColor: "divider", mb: 3 }} />

                        <NotificationsSection />

                        <Box sx={{ borderTop: "1px solid", borderColor: "divider", mb: 3 }} />

                        <SectionLabel label={t("quickPanel.peopleYouMayKnow")} />
                        <SuggestedUsers bare />
                    </Box>
                </Box>
            </Drawer>
        </>
    );
}
