import { useEffect, useRef, useState } from "react";
import { Avatar, Box, Button, IconButton, Skeleton, Typography } from "@mui/material";
import { KeyboardArrowUpRounded } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { getSuggestedUsers, followUser } from "../services/api";
import BlankProfileImage from "../static/profile_blank.png";

interface SuggestedUser {
    id: number;
    username: string;
    profile_picture: string | null;
    follower_count: number;
    mutual_count: number;
}

export default function SuggestedUsers() {
    const navigate = useNavigate();
    const [users, setUsers] = useState<SuggestedUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [requested, setRequested] = useState<Set<number>>(new Set());
    const [collapsed, setCollapsed] = useState(false);
    const bodyRef = useRef<HTMLDivElement>(null);

    const currentUser = localStorage.getItem("user")
        ? JSON.parse(localStorage.getItem("user")!)
        : null;

    useEffect(() => {
        const load = async () => {
            try {
                const res = await getSuggestedUsers();
                setUsers(res.data || []);
            } catch (e) {
                console.error("Failed to fetch suggestions:", e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleFollow = async (userId: number) => {
        if (!currentUser?.id) return;
        try {
            await followUser(String(currentUser.id), String(userId));
            setRequested((prev) => new Set(prev).add(userId));
        } catch (e) {
            console.error("Follow failed:", e);
        }
    };

    if (!loading && users.length === 0) return null;

    const bodyHeight = bodyRef.current?.scrollHeight ?? 0;

    return (
        <Box sx={{
            backgroundColor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: "16px",
            overflow: "hidden",
        }}>
            {/* Header */}
            <Box
                onClick={() => setCollapsed((c) => !c)}
                sx={{
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                    px: 2.5,
                    pt: 2.5,
                    pb: collapsed ? 2.5 : 1.75,
                    transition: "padding-bottom 0.35s ease",
                    userSelect: "none",
                }}
            >
                <Box sx={{ borderLeft: "2.5px solid #6366f1", pl: 1.25, flex: 1 }}>
                    <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: "text.primary", lineHeight: 1.3 }}>
                        People you may know
                    </Typography>
                    <Typography sx={{ fontSize: "0.7rem", color: "text.disabled", lineHeight: 1.3 }}>
                        Based on your network
                    </Typography>
                </Box>
                <IconButton
                    size="small"
                    tabIndex={-1}
                    sx={{
                        color: "text.disabled",
                        p: 0.25,
                        transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)",
                        transform: collapsed ? "rotate(180deg)" : "rotate(0deg)",
                        "&:hover": { backgroundColor: "transparent", color: "text.secondary" },
                    }}
                >
                    <KeyboardArrowUpRounded sx={{ fontSize: "1.1rem" }} />
                </IconButton>
            </Box>

            {/* Collapsible body */}
            <Box
                ref={bodyRef}
                sx={{
                    overflow: "hidden",
                    maxHeight: collapsed ? 0 : (bodyHeight > 0 ? `${bodyHeight}px` : "600px"),
                    opacity: collapsed ? 0 : 1,
                    transition: "max-height 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease",
                    px: 2.5,
                    pb: collapsed ? 0 : 2.5,
                }}
            >
                <Box sx={{ display: "flex", flexDirection: "column" }}>
                    {loading
                        ? Array.from({ length: 4 }).map((_, i) => (
                              <Box key={i}>
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, py: 1.25 }}>
                                      <Skeleton variant="circular" width={36} height={36} />
                                      <Box sx={{ flex: 1 }}>
                                          <Skeleton width="65%" height={12} sx={{ borderRadius: "6px" }} />
                                          <Skeleton width="40%" height={9} sx={{ borderRadius: "6px", mt: "4px" }} />
                                      </Box>
                                      <Skeleton width={52} height={26} sx={{ borderRadius: "20px" }} />
                                  </Box>
                                  {i < 3 && <Box sx={{ borderTop: "1px solid", borderColor: "divider" }} />}
                              </Box>
                          ))
                        : users.map((user, i) => {
                              const isRequested = requested.has(user.id);
                              return (
                                  <Box key={user.id}>
                                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, py: 1.25 }}>
                                          <Avatar
                                              src={user.profile_picture || BlankProfileImage}
                                              sx={{ width: 36, height: 36, cursor: "pointer", flexShrink: 0 }}
                                              onClick={() => navigate(`/profile/${user.id}`)}
                                              onError={(e) => { (e.target as HTMLImageElement).src = BlankProfileImage; }}
                                          />
                                          <Box
                                              sx={{ flex: 1, minWidth: 0, cursor: "pointer" }}
                                              onClick={() => navigate(`/profile/${user.id}`)}
                                          >
                                              <Typography noWrap sx={{ fontWeight: 600, fontSize: "0.82rem", lineHeight: 1.3, color: "text.primary" }}>
                                                  {user.username}
                                              </Typography>
                                              <Typography sx={{ fontSize: "0.7rem", color: "text.disabled", lineHeight: 1.3 }}>
                                                  {user.mutual_count > 0 ? `${user.mutual_count} mutual` : `${user.follower_count} followers`}
                                              </Typography>
                                          </Box>
                                          {isRequested ? (
                                              <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: "text.disabled", flexShrink: 0 }}>
                                                  Requested
                                              </Typography>
                                          ) : (
                                              <Button
                                                  size="small"
                                                  onClick={() => handleFollow(user.id)}
                                                  sx={{
                                                      borderRadius: "20px",
                                                      border: "1px solid #6366f1",
                                                      color: "#6366f1",
                                                      fontSize: "0.72rem",
                                                      fontWeight: 600,
                                                      px: 1.25,
                                                      py: 0.25,
                                                      textTransform: "none",
                                                      backgroundColor: "transparent",
                                                      flexShrink: 0,
                                                      minWidth: 0,
                                                      lineHeight: 1.6,
                                                      "&:hover": { backgroundColor: "rgba(99,102,241,0.08)", border: "1px solid #6366f1" },
                                                  }}
                                              >
                                                  Follow
                                              </Button>
                                          )}
                                      </Box>
                                      {i < users.length - 1 && <Box sx={{ borderTop: "1px solid", borderColor: "divider" }} />}
                                  </Box>
                              );
                          })}
                </Box>
            </Box>
        </Box>
    );
}
