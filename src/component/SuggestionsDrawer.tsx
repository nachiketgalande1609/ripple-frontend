import { useState, useEffect } from "react";
import { Drawer, Box, Typography, IconButton, Avatar, Skeleton, useTheme, Tooltip } from "@mui/material";
import { Close as CloseIcon, DashboardCustomizeOutlined, ChevronRight, AddRounded, CheckRounded } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import SuggestedUsers from "./SuggestedUsers";
import AddAccountDialog from "./AddAccountDialog";
import { getNotifications } from "../services/api";
import { timeAgo } from "../utils/utils";
import BlankProfileImage from "../static/profile_blank.png";
import { getAccounts, switchAccount, StoredAccount } from "../utils/accounts";
import { useGlobalStore } from "../store/store";
import { useTranslation } from "react-i18next";

const DRAWER_WIDTH = 300;

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
        <Box sx={{ mb: 2 }}>
            {/* Section header */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.25 }}>
                <Box sx={{ borderLeft: "2.5px solid #f59e0b", pl: 1.25 }}>
                    <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: "text.primary", lineHeight: 1.3 }}>
                        {t("quickPanel.recentActivity")}
                    </Typography>
                </Box>
                <Typography
                    onClick={() => navigate("/notifications")}
                    sx={{
                        fontSize: "0.7rem", color: "text.disabled", cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 0.25,
                        "&:hover": { color: "text.secondary" },
                    }}
                >
                    {t("quickPanel.seeAll")} <ChevronRight sx={{ fontSize: 13 }} />
                </Typography>
            </Box>

            {/* Rows */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
                {loading
                    ? Array.from({ length: 3 }).map((_, i) => (
                          <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1.25, py: 1 }}>
                              <Skeleton variant="circular" width={32} height={32} sx={{ flexShrink: 0 }} />
                              <Box sx={{ flex: 1 }}>
                                  <Skeleton width="80%" height={11} sx={{ borderRadius: "6px" }} />
                                  <Skeleton width="40%" height={9} sx={{ borderRadius: "6px", mt: "4px" }} />
                              </Box>
                          </Box>
                      ))
                    : notifications.map((n) => (
                          <Box
                              key={n.id}
                              onClick={() => navigate(`/profile/${n.sender_id}`)}
                              sx={{
                                  display: "flex", alignItems: "center", gap: 1.25, py: 0.875,
                                  px: 0.75, borderRadius: "10px", cursor: "pointer",
                                  transition: "background 0.2s",
                                  "&:hover": { backgroundColor: "action.hover" },
                              }}
                          >
                              <Avatar
                                  src={n.profile_picture || BlankProfileImage}
                                  sx={{ width: 32, height: 32, flexShrink: 0 }}
                                  onError={(e) => { (e.target as HTMLImageElement).src = BlankProfileImage; }}
                              />
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Typography noWrap sx={{ fontSize: "0.76rem", color: "text.primary", lineHeight: 1.35 }}>
                                      <strong>{n.username}</strong> {n.message}
                                  </Typography>
                                  <Typography sx={{ fontSize: "0.67rem", color: "text.disabled", lineHeight: 1.3 }}>
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

    useEffect(() => {
        setAccounts(getAccounts());
    }, []);

    const handleSwitch = (id: string) => {
        if (id === String(currentUser?.id)) return;
        setSwitching(id);
        switchAccount(id);
        window.location.href = "/";
    };

    const otherAccounts = accounts.filter((a) => String(a.id) !== String(currentUser?.id));

    return (
        <Box sx={{ mb: 2 }}>
            {/* Section header */}
            <Box sx={{ mb: 1.25 }}>
                <Box sx={{ borderLeft: "2.5px solid #10b981", pl: 1.25 }}>
                    <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: "text.primary", lineHeight: 1.3 }}>
                        {t("quickPanel.accounts")}
                    </Typography>
                </Box>
            </Box>

            {/* Current account */}
            {currentUser && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, py: 0.875, px: 0.75, borderRadius: "10px", mb: 0.5, bgcolor: "action.selected" }}>
                    <Avatar
                        src={currentUser.profile_picture_url || BlankProfileImage}
                        sx={{ width: 34, height: 34, flexShrink: 0 }}
                        onError={(e) => { (e.target as HTMLImageElement).src = BlankProfileImage; }}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography noWrap sx={{ fontSize: "0.8rem", fontWeight: 600, color: "text.primary", lineHeight: 1.3 }}>
                            {currentUser.username}
                        </Typography>
                        <Typography noWrap sx={{ fontSize: "0.67rem", color: "text.disabled", lineHeight: 1.3 }}>
                            {currentUser.email}
                        </Typography>
                    </Box>
                    <CheckRounded sx={{ fontSize: 16, color: "#10b981", flexShrink: 0 }} />
                </Box>
            )}

            {/* Other accounts */}
            {otherAccounts.map((acc) => (
                <Box
                    key={acc.id}
                    onClick={() => handleSwitch(acc.id)}
                    sx={{
                        display: "flex", alignItems: "center", gap: 1.25,
                        py: 0.875, px: 0.75, borderRadius: "10px", cursor: "pointer",
                        transition: "background 0.2s",
                        "&:hover": { backgroundColor: "action.hover" },
                        opacity: switching === acc.id ? 0.6 : 1,
                    }}
                >
                    <Avatar
                        src={acc.profile_picture_url || BlankProfileImage}
                        sx={{ width: 34, height: 34, flexShrink: 0 }}
                        onError={(e) => { (e.target as HTMLImageElement).src = BlankProfileImage; }}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography noWrap sx={{ fontSize: "0.8rem", fontWeight: 600, color: "text.primary", lineHeight: 1.3 }}>
                            {acc.username}
                        </Typography>
                        <Typography noWrap sx={{ fontSize: "0.67rem", color: "text.disabled", lineHeight: 1.3 }}>
                            {acc.email}
                        </Typography>
                    </Box>
                    <button
                        style={{
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            padding: "0 10px", height: "26px", borderRadius: "10px", border: "none",
                            background: "var(--nav-bg)",
                            boxShadow: "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)",
                            color: "inherit", fontSize: "0.7rem", fontWeight: 600, cursor: "pointer",
                            whiteSpace: "nowrap", userSelect: "none", outline: "none", flexShrink: 0,
                            transition: "box-shadow 0.35s cubic-bezier(0.4,0,0.2,1)",
                        }}
                    >
                        {t("quickPanel.switchAccount")}
                    </button>
                </Box>
            ))}

            <AddAccountDialog
                open={addDialogOpen}
                onClose={() => setAddDialogOpen(false)}
            />

            {/* Add account */}
            <Box
                onClick={() => setAddDialogOpen(true)}
                sx={{
                    display: "flex", alignItems: "center", gap: 1.25,
                    py: 0.875, px: 0.75, mt: 0.5, borderRadius: "10px", cursor: "pointer",
                    transition: "background 0.2s",
                    "&:hover": { backgroundColor: "action.hover" },
                }}
            >
                <Box sx={{
                    width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: "1.5px dashed", borderColor: "divider",
                }}>
                    <AddRounded sx={{ fontSize: 18, color: "text.disabled" }} />
                </Box>
                <Typography sx={{ fontSize: "0.8rem", fontWeight: 500, color: "text.secondary" }}>
                    {t("quickPanel.addAccount")}
                </Typography>
            </Box>
        </Box>
    );
}

export default function SuggestionsDrawer() {
    const { t } = useTranslation();
    const theme = useTheme();
    const [open, setOpen] = useState(true);

    return (
        <>
            {/* ── Collapsed tab button (visible when drawer is closed) ── */}
            {!open && (
                <Tooltip title={t("quickPanel.title")} placement="left">
                    <Box
                        onClick={() => setOpen(true)}
                        sx={{
                            position: "fixed",
                            right: 0,
                            top: "16px",
                            zIndex: 1200,
                            width: 36,
                            height: 64,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            backgroundColor: theme.palette.mode === "light" ? "#ffffff" : theme.palette.background.default,
                            borderLeft: "1px solid",
                            borderTop: "1px solid",
                            borderBottom: "1px solid",
                            borderColor: theme.palette.divider,
                            borderRadius: "12px 0 0 12px",
                            boxShadow: "-4px 0 16px rgba(0,0,0,0.08)",
                            transition: "box-shadow 0.2s ease",
                            "&:hover": { boxShadow: "-6px 0 20px rgba(0,0,0,0.13)" },
                        }}
                    >
                        <DashboardCustomizeOutlined sx={{ fontSize: 18, color: "text.secondary" }} />
                    </Box>
                </Tooltip>
            )}

            {/* ── Drawer ── */}
            <Drawer
                variant="persistent"
                anchor="right"
                open={open}
                sx={{
                    width: open ? DRAWER_WIDTH : 0,
                    flexShrink: 0,
                    transition: "width 0.28s cubic-bezier(0.4,0,0.2,1)",
                    "& .MuiDrawer-paper": {
                        width: DRAWER_WIDTH,
                        boxSizing: "border-box",
                        backgroundColor: theme.palette.mode === "light" ? "#ffffff" : theme.palette.background.default,
                        borderLeft: "1px solid",
                        borderColor: theme.palette.divider,
                        borderRight: "none",
                        borderRadius: "16px 0 0 16px",
                        overflowX: "hidden",
                        padding: "12px 10px 16px",
                        boxShadow: "-8px 0 32px rgba(0,0,0,0.06)",
                        transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
                    },
                }}
            >
                <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                    {/* Drawer header with close button */}
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            pl: "11px",
                            pr: "6px",
                            pt: 0.5,
                            pb: 2,
                            flexShrink: 0,
                        }}
                    >
                        <Box sx={{ borderLeft: "2.5px solid #6366f1", pl: 1.25, flex: 1 }}>
                            <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: "text.primary", lineHeight: 1.3 }}>
                                {t("quickPanel.title")}
                            </Typography>
                        </Box>
                        <IconButton
                            size="small"
                            onClick={() => setOpen(false)}
                            sx={{
                                color: "text.disabled",
                                p: 0.5,
                                borderRadius: "10px",
                                transition: "background 0.2s, color 0.2s",
                                "&:hover": { backgroundColor: "action.hover", color: "text.secondary" },
                            }}
                        >
                            <CloseIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                    </Box>

                    {/* Scrollable content */}
                    <Box sx={{ flex: 1, overflowY: "auto", px: "11px", pb: 2 }}>
                        {/* Account switcher */}
                        <AccountSwitcher />

                        {/* Divider */}
                        <Box sx={{ borderTop: "1px solid", borderColor: "divider", mb: 2 }} />

                        {/* Notifications */}
                        <NotificationsSection />

                        {/* Divider */}
                        <Box sx={{ borderTop: "1px solid", borderColor: "divider", mb: 2 }} />

                        {/* Suggestions header */}
                        <Box sx={{ mb: 1.25 }}>
                            <Box sx={{ borderLeft: "2.5px solid #6366f1", pl: 1.25 }}>
                                <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: "text.primary", lineHeight: 1.3 }}>
                                    {t("quickPanel.peopleYouMayKnow")}
                                </Typography>
                                <Typography sx={{ fontSize: "0.7rem", color: "text.disabled", lineHeight: 1.3 }}>
                                    {t("quickPanel.basedOnNetwork")}
                                </Typography>
                            </Box>
                        </Box>

                        {/* Suggestions list */}
                        <SuggestedUsers bare />
                    </Box>
                </Box>
            </Drawer>
        </>
    );
}
