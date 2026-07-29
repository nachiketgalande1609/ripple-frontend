import { useState, useEffect } from "react";
import {
  Box, Dialog, Typography, IconButton, Backdrop, Fade,
  Skeleton, useTheme,
} from "@mui/material";
import {
  Close, AccessTime, DeleteOutline, CalendarMonth,
} from "@mui/icons-material";
import { getScheduledPosts, deletePost } from "../../services/api";
import { useAppNotifications } from "../../hooks/useNotification";
import { useTranslation } from "react-i18next";

interface ScheduledPost {
  id: number;
  file_url: string;
  content: string;
  scheduled_at: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onCountChange?: (count: number) => void;
}

function formatScheduled(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

const ACCENT = "#64748B";

const ScheduledPostsModal: React.FC<Props> = ({ open, onClose, onCountChange }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const notifications = useAppNotifications();
  const isDark = theme.palette.mode === "dark";
  const bc = theme.palette.divider;

  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getScheduledPosts()
      .then((res) => {
        const data = res.data || [];
        setPosts(data);
        onCountChange?.(data.length);
      })
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [open]);

  const handleCancel = async (post: ScheduledPost) => {
    setCancelling(post.id);
    try {
      await deletePost(String(post.id));
      const next = posts.filter((p) => p.id !== post.id);
      setPosts(next);
      onCountChange?.(next.length);
      notifications.show("Scheduled post cancelled", { severity: "info", autoHideDuration: 2500 });
    } catch {
      notifications.show("Failed to cancel post", { severity: "error", autoHideDuration: 2500 });
    } finally {
      setCancelling(null);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{ timeout: 200, sx: { backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" } }}
      PaperProps={{
        sx: {
          borderRadius: "20px",
          width: "100%",
          maxWidth: 420,
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: bc,
          boxShadow: isDark ? "0 32px 80px rgba(0,0,0,0.6)" : "0 20px 60px rgba(0,0,0,0.14)",
          overflow: "hidden",
        },
      }}
    >
      <Fade in={open} timeout={200}>
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
          {/* Header */}
          <Box sx={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            px: 2.5, py: 1.5, borderBottom: "1px solid", borderColor: bc, flexShrink: 0,
          }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CalendarMonth sx={{ fontSize: 17, color: ACCENT }} />
              <Typography sx={{ fontFamily: "'Inter', sans-serif", fontSize: "0.95rem", fontWeight: 600, color: (t) => t.palette.text.primary }}>
                Scheduled Posts
              </Typography>
              {posts.length > 0 && (
                <Box sx={{ bgcolor: `${ACCENT}18`, border: `1px solid ${ACCENT}30`, borderRadius: "20px", px: 1, py: "1px" }}>
                  <Typography sx={{ fontFamily: "'Inter', sans-serif", fontSize: "0.7rem", fontWeight: 600, color: ACCENT }}>
                    {posts.length}
                  </Typography>
                </Box>
              )}
            </Box>
            <IconButton onClick={onClose} size="small" sx={{ width: 30, height: 30, borderRadius: "9px", color: (t) => t.palette.text.secondary, "&:hover": { bgcolor: (t) => t.palette.action.hover } }}>
              <Close sx={{ fontSize: 15 }} />
            </IconButton>
          </Box>

          {/* Body */}
          <Box sx={{ flex: 1, overflowY: "auto", "&::-webkit-scrollbar": { width: 3 }, "&::-webkit-scrollbar-thumb": { bgcolor: (t) => t.palette.action.selected, borderRadius: 4 } }}>
            {loading ? (
              <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
                {[...Array(3)].map((_, i) => (
                  <Box key={i} sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                    <Skeleton variant="rounded" width={56} height={56} sx={{ borderRadius: "10px", flexShrink: 0, bgcolor: (t) => t.palette.action.hover }} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton variant="text" width="70%" sx={{ bgcolor: (t) => t.palette.action.hover }} />
                      <Skeleton variant="text" width="40%" sx={{ bgcolor: (t) => t.palette.action.hover, mt: 0.5 }} />
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : posts.length === 0 ? (
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 7, gap: 1.5 }}>
                <Box sx={{ width: 48, height: 48, borderRadius: "14px", bgcolor: `${ACCENT}12`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CalendarMonth sx={{ fontSize: 22, color: ACCENT }} />
                </Box>
                <Typography sx={{ fontFamily: "'Inter', sans-serif", fontSize: "0.875rem", color: (t) => t.palette.text.secondary, fontWeight: 500 }}>
                  No scheduled posts
                </Typography>
                <Typography sx={{ fontFamily: "'Inter', sans-serif", fontSize: "0.78rem", color: (t) => t.palette.text.disabled }}>
                  Posts you schedule will appear here
                </Typography>
              </Box>
            ) : (
              <Box sx={{ py: 1 }}>
                {posts.map((post) => (
                  <Box
                    key={post.id}
                    sx={{
                      display: "flex", alignItems: "center", gap: 1.5,
                      px: 2, py: 1.25,
                      "&:not(:last-child)": { borderBottom: "1px solid", borderColor: bc },
                      transition: "background 0.12s",
                      "&:hover": { bgcolor: (t) => t.palette.action.hover },
                    }}
                  >
                    {/* Thumbnail */}
                    <Box sx={{ width: 56, height: 56, borderRadius: "10px", overflow: "hidden", flexShrink: 0, bgcolor: (t) => t.palette.action.hover, border: "1px solid", borderColor: bc }}>
                      {post.file_url ? (
                        <Box component="img" src={post.file_url} sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      ) : (
                        <Box sx={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <CalendarMonth sx={{ fontSize: 20, color: (t) => t.palette.text.disabled }} />
                        </Box>
                      )}
                    </Box>

                    {/* Info */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{
                        fontFamily: "'Inter', sans-serif", fontSize: "0.83rem", fontWeight: 500,
                        color: (t) => t.palette.text.primary,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {post.content || "No caption"}
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.4 }}>
                        <AccessTime sx={{ fontSize: 11, color: ACCENT }} />
                        <Typography sx={{ fontFamily: "'Inter', sans-serif", fontSize: "0.72rem", color: ACCENT, fontWeight: 500 }}>
                          {formatScheduled(post.scheduled_at)}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Cancel */}
                    <IconButton
                      size="small"
                      onClick={() => handleCancel(post)}
                      disabled={cancelling === post.id}
                      sx={{
                        width: 30, height: 30, borderRadius: "8px", flexShrink: 0,
                        color: (t) => t.palette.text.disabled,
                        "&:hover": { bgcolor: (t) => `${t.palette.error.main}18`, color: (t) => t.palette.error.main },
                      }}
                    >
                      <DeleteOutline sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Box>
      </Fade>
    </Dialog>
  );
};

export default ScheduledPostsModal;
