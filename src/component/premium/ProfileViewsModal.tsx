import { useState, useEffect } from "react";
import {
  Box, Dialog, Typography, IconButton, Backdrop, Fade,
  Avatar, Skeleton, useTheme,
} from "@mui/material";
import { Close, Visibility } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { getProfileViews } from "../../services/api";
import BlankProfileImage from "../../static/profile_blank.png";

interface Viewer {
  id: number;
  viewer_id: number;
  username: string;
  profile_picture: string;
  viewed_at: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

const GOLD = "#f59e0b";

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const ProfileViewsModal: React.FC<Props> = ({ open, onClose }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isDark = theme.palette.mode === "dark";
  const bc = theme.palette.divider;

  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getProfileViews()
      .then((res) => {
        setViewers(res.data ?? []);
        setTotal(res.total ?? 0);
      })
      .catch(() => setViewers([]))
      .finally(() => setLoading(false));
  }, [open]);

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
          maxWidth: 400,
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
              <Visibility sx={{ fontSize: 16, color: GOLD }} />
              <Typography sx={{ fontFamily: "'Inter', sans-serif", fontSize: "0.95rem", fontWeight: 600, color: (t) => t.palette.text.primary }}>
                Profile Views
              </Typography>
              {total > 0 && (
                <Box sx={{ bgcolor: `${GOLD}18`, border: `1px solid ${GOLD}40`, borderRadius: "20px", px: 1, py: "1px" }}>
                  <Typography sx={{ fontFamily: "'Inter', sans-serif", fontSize: "0.7rem", fontWeight: 600, color: GOLD }}>
                    {total}
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
              <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1 }}>
                {[...Array(5)].map((_, i) => (
                  <Box key={i} sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                    <Skeleton variant="circular" width={38} height={38} sx={{ flexShrink: 0, bgcolor: (t) => t.palette.action.hover }} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton variant="text" width="55%" sx={{ bgcolor: (t) => t.palette.action.hover }} />
                      <Skeleton variant="text" width="30%" sx={{ bgcolor: (t) => t.palette.action.hover, mt: 0.3 }} />
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : viewers.length === 0 ? (
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 7, gap: 1.5 }}>
                <Box sx={{ width: 48, height: 48, borderRadius: "14px", bgcolor: `${GOLD}12`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Visibility sx={{ fontSize: 22, color: GOLD }} />
                </Box>
                <Typography sx={{ fontFamily: "'Inter', sans-serif", fontSize: "0.875rem", color: (t) => t.palette.text.secondary, fontWeight: 500 }}>
                  No views yet
                </Typography>
                <Typography sx={{ fontFamily: "'Inter', sans-serif", fontSize: "0.78rem", color: (t) => t.palette.text.disabled, textAlign: "center", maxWidth: 220 }}>
                  People who visit your profile will appear here
                </Typography>
              </Box>
            ) : (
              <Box sx={{ py: 1 }}>
                {viewers.map((v) => (
                  <Box
                    key={v.id}
                    onClick={() => { navigate(`/profile/${v.viewer_id}`); onClose(); }}
                    sx={{
                      display: "flex", alignItems: "center", gap: 1.5,
                      px: 2, py: 1.1, cursor: "pointer",
                      "&:not(:last-child)": { borderBottom: "1px solid", borderColor: bc },
                      "&:hover": { bgcolor: (t) => t.palette.action.hover },
                      transition: "background 0.12s",
                    }}
                  >
                    <Avatar
                      src={v.profile_picture || BlankProfileImage}
                      sx={{ width: 38, height: 38, flexShrink: 0 }}
                      onError={(e) => { (e.target as HTMLImageElement).src = BlankProfileImage; }}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontFamily: "'Inter', sans-serif", fontSize: "0.85rem", fontWeight: 600, color: (t) => t.palette.text.primary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {v.username}
                      </Typography>
                      {v.viewed_at && (
                        <Typography sx={{ fontFamily: "'Inter', sans-serif", fontSize: "0.72rem", color: (t) => t.palette.text.disabled }}>
                          {timeAgo(v.viewed_at)}
                        </Typography>
                      )}
                    </Box>
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

export default ProfileViewsModal;
