import { useState, useEffect } from "react";
import { Drawer, Box, Typography, IconButton, Avatar, Skeleton, useTheme, Tooltip } from "@mui/material";
import { Close as CloseIcon, PeopleAltOutlined, NotificationsNoneRounded, ChevronRight } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import SuggestedUsers from "./SuggestedUsers";
import { getNotifications } from "../services/api";
import { timeAgo } from "../utils/utils";
import BlankProfileImage from "../static/profile_blank.png";

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
                        Recent activity
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
                    See all <ChevronRight sx={{ fontSize: 13 }} />
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

export default function SuggestionsDrawer() {
    const theme = useTheme();
    const [open, setOpen] = useState(true);

    return (
        <>
            {/* ── Collapsed tab button (visible when drawer is closed) ── */}
            {!open && (
                <Tooltip title="Activity & suggestions" placement="left">
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
                        <NotificationsNoneRounded sx={{ fontSize: 18, color: "text.secondary" }} />
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
                                For you
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
                        {/* Notifications */}
                        <NotificationsSection />

                        {/* Divider */}
                        <Box sx={{ borderTop: "1px solid", borderColor: "divider", mb: 2 }} />

                        {/* Suggestions header */}
                        <Box sx={{ mb: 1.25 }}>
                            <Box sx={{ borderLeft: "2.5px solid #6366f1", pl: 1.25 }}>
                                <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: "text.primary", lineHeight: 1.3 }}>
                                    People you may know
                                </Typography>
                                <Typography sx={{ fontSize: "0.7rem", color: "text.disabled", lineHeight: 1.3 }}>
                                    Based on your network
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
