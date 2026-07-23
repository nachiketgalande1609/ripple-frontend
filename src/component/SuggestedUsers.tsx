import { useEffect, useState } from "react";
import { Avatar, Box, Button, Skeleton, Typography } from "@mui/material";
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

    return (
        <Box sx={{ pt: 1 }}>
            <Typography
                sx={{
                    fontSize: "0.7rem",
                    fontWeight: 500,
                    letterSpacing: "0.06em",
                    color: "text.disabled",
                    textTransform: "uppercase",
                    mb: 1.5,
                    px: 0.5,
                }}
            >
                Suggested for you
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                {loading
                    ? Array.from({ length: 5 }).map((_, i) => (
                          <Box
                              key={i}
                              sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1.25,
                                  px: 0.5,
                                  py: 0.75,
                              }}
                          >
                              <Skeleton variant="circular" width={32} height={32} />
                              <Box sx={{ flex: 1 }}>
                                  <Skeleton width="60%" height={12} sx={{ borderRadius: "6px" }} />
                                  <Skeleton width="40%" height={9} sx={{ borderRadius: "6px", mt: "4px" }} />
                              </Box>
                              <Skeleton width={60} height={28} sx={{ borderRadius: "10px" }} />
                          </Box>
                      ))
                    : users.map((user) => {
                          const isRequested = requested.has(user.id);
                          return (
                              <Box
                                  key={user.id}
                                  sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 1.25,
                                      px: 0.5,
                                      py: 0.75,
                                      borderRadius: "10px",
                                      transition: "background 0.15s",
                                      "&:hover": {
                                          bgcolor: (t) => t.palette.action.hover,
                                      },
                                  }}
                              >
                                  <Avatar
                                      src={user.profile_picture || BlankProfileImage}
                                      sx={{ width: 32, height: 32, cursor: "pointer", flexShrink: 0 }}
                                      onClick={() => navigate(`/profile/${user.id}`)}
                                      onError={(e) => {
                                          (e.target as HTMLImageElement).src = BlankProfileImage;
                                      }}
                                  />

                                  <Box
                                      sx={{ flex: 1, minWidth: 0, cursor: "pointer" }}
                                      onClick={() => navigate(`/profile/${user.id}`)}
                                  >
                                      <Typography
                                          noWrap
                                          sx={{
                                              fontWeight: 600,
                                              fontSize: "0.85rem",
                                              lineHeight: 1.3,
                                              color: "text.primary",
                                          }}
                                      >
                                          {user.username}
                                      </Typography>
                                      {user.mutual_count > 0 && (
                                          <Typography
                                              sx={{
                                                  fontSize: "0.72rem",
                                                  color: "text.disabled",
                                                  lineHeight: 1.3,
                                              }}
                                          >
                                              {user.mutual_count} mutual
                                          </Typography>
                                      )}
                                  </Box>

                                  {isRequested ? (
                                      <Typography
                                          sx={{
                                              fontSize: "0.78rem",
                                              fontWeight: 600,
                                              color: "text.disabled",
                                              px: 1.5,
                                              flexShrink: 0,
                                          }}
                                      >
                                          Requested
                                      </Typography>
                                  ) : (
                                      <Button
                                          size="small"
                                          onClick={() => handleFollow(user.id)}
                                          sx={{
                                              backgroundColor: "var(--nav-bg)",
                                              boxShadow:
                                                  "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)",
                                              borderRadius: "10px",
                                              fontSize: "0.78rem",
                                              fontWeight: 600,
                                              px: 1.5,
                                              py: 0.5,
                                              textTransform: "none",
                                              border: "none",
                                              color: "text.primary",
                                              flexShrink: 0,
                                              minWidth: 0,
                                              "&:hover": {
                                                  backgroundColor: "var(--nav-bg)",
                                                  opacity: 0.85,
                                              },
                                          }}
                                      >
                                          Follow
                                      </Button>
                                  )}
                              </Box>
                          );
                      })}
            </Box>
        </Box>
    );
}
