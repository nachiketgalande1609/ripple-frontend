import { useState, useEffect } from "react";
import {
  Box, Typography, Button, Chip, Divider, CircularProgress,
  useTheme, Dialog, Backdrop, Fade, IconButton,
} from "@mui/material";
import {
  WorkspacePremiumRounded, Visibility, BarChart,
  CalendarMonth, TrendingUp, Shield, Star, CheckCircle,
  CancelOutlined, Close,
} from "@mui/icons-material";
import { useGlobalStore } from "../../store/store";
import { getProfile, grantPremium, cancelPremium } from "../../services/api";
import { useAppNotifications } from "../../hooks/useNotification";
import PremiumUpgradeModal from "../premium/PremiumUpgradeModal";

const GOLD    = "#f59e0b";
const GOLD_L  = "#fbbf24";
const GOLD_BG = "#fef3c7";
const GOLD_DK = "#78350f";

const features = [
  { icon: WorkspacePremiumRounded, label: "Premium gold badge",     desc: "Stand out with a gold badge next to your name" },
  { icon: Visibility,              label: "See profile viewers",    desc: "Know exactly who's been visiting your profile" },
  { icon: BarChart,                label: "Advanced insights",      desc: "Detailed analytics on reach, saves & engagement" },
  { icon: CalendarMonth,           label: "Unlimited scheduling",   desc: "Schedule as many posts as you want, any time" },
  { icon: TrendingUp,              label: "Priority in suggestions",desc: "Appear higher in follow suggestions for others" },
  { icon: Shield,                  label: "Early access",           desc: "Try new Ripple features before everyone else" },
];

function formatExpiry(iso: string | null): string {
  if (!iso) return "Lifetime";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

const PremiumSettings = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const notifications = useAppNotifications();
  const user = useGlobalStore((s) => s.user);

  const [isPremium, setIsPremium] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    getProfile(user.id)
      .then((res) => {
        const data = res?.data ?? res;
        setIsPremium(data?.is_premium === 1 || data?.is_premium === true);
        setExpiresAt(data?.premium_expires_at ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  const handleCancel = async () => {
    setCancelLoading(true);
    try {
      await cancelPremium();
      setIsPremium(false);
      setExpiresAt(null);
      notifications.show("Premium membership cancelled.", { severity: "info", autoHideDuration: 3000 });
    } catch {
      notifications.show("Something went wrong. Please try again.", { severity: "error", autoHideDuration: 3000 });
    } finally {
      setCancelLoading(false);
      setConfirmCancelOpen(false);
    }
  };

  const bc = theme.palette.divider;

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", pt: 6 }}>
        <CircularProgress size={28} sx={{ color: GOLD }} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 560, width: "100%" }}>

      {/* Status card */}
      <Box sx={{
        borderRadius: "18px",
        border: "1px solid",
        borderColor: isPremium ? `${GOLD}55` : bc,
        background: isPremium
          ? (isDark
            ? "linear-gradient(145deg, #1c1407 0%, #242009 100%)"
            : "linear-gradient(145deg, #fffbeb 0%, #fef3c7 100%)")
          : (theme.palette.background.paper),
        p: 2.5,
        mb: 3,
        display: "flex",
        alignItems: "center",
        gap: 2,
      }}>
        <Box sx={{
          width: 48, height: 48, borderRadius: "14px", flexShrink: 0,
          bgcolor: isPremium ? (isDark ? "rgba(245,158,11,0.15)" : "rgba(245,158,11,0.2)") : (theme.palette.action.hover),
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <WorkspacePremiumRounded sx={{ fontSize: 26, color: isPremium ? GOLD : theme.palette.text.disabled }} />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.4 }}>
            <Typography sx={{ fontFamily: "'Inter', sans-serif", fontSize: "1rem", fontWeight: 700, color: isPremium ? (isDark ? GOLD_L : GOLD_DK) : theme.palette.text.primary }}>
              Ripple Premium
            </Typography>
            {isPremium && (
              <Chip
                label="Active"
                size="small"
                icon={<CheckCircle sx={{ fontSize: "13px !important", color: "#16a34a !important" }} />}
                sx={{ height: 20, fontSize: "0.68rem", fontWeight: 600, bgcolor: "#dcfce7", color: "#15803d", border: "1px solid #bbf7d0", "& .MuiChip-icon": { ml: "4px" } }}
              />
            )}
          </Box>
          <Typography sx={{ fontFamily: "'Inter', sans-serif", fontSize: "0.8rem", color: isPremium ? (isDark ? "rgba(251,191,36,0.65)" : "#92400e") : theme.palette.text.secondary }}>
            {isPremium
              ? `Renews · ${formatExpiry(expiresAt)}`
              : "Unlock exclusive features and stand out from the crowd"}
          </Typography>
        </Box>

        {!isPremium && (
          <Button
            onClick={() => setUpgradeOpen(true)}
            size="small"
            sx={{
              borderRadius: "10px", px: 2, py: 0.8, flexShrink: 0,
              fontFamily: "'Inter', sans-serif", fontSize: "0.8rem", fontWeight: 700,
              textTransform: "none",
              background: `linear-gradient(135deg, ${GOLD} 0%, #d97706 100%)`,
              color: "#fff",
              boxShadow: `0 3px 12px rgba(245,158,11,0.4)`,
              "&:hover": { background: `linear-gradient(135deg, ${GOLD_L} 0%, ${GOLD} 100%)` },
            }}
          >
            Upgrade
          </Button>
        )}
      </Box>

      {/* Features */}
      <Typography sx={{ fontFamily: "'Inter', sans-serif", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: theme.palette.text.disabled, mb: 1.5 }}>
        Features included
      </Typography>

      <Box sx={{ borderRadius: "16px", border: "1px solid", borderColor: bc, overflow: "hidden", mb: 3 }}>
        {features.map(({ icon: Icon, label, desc }, i) => (
          <Box key={label}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.4 }}>
              <Box sx={{ width: 32, height: 32, borderRadius: "9px", flexShrink: 0, bgcolor: isPremium ? (isDark ? "rgba(245,158,11,0.1)" : GOLD_BG) : theme.palette.action.hover, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon sx={{ fontSize: 16, color: isPremium ? GOLD : theme.palette.text.disabled }} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontFamily: "'Inter', sans-serif", fontSize: "0.855rem", fontWeight: 600, color: theme.palette.text.primary, lineHeight: 1.3 }}>
                  {label}
                </Typography>
                <Typography sx={{ fontFamily: "'Inter', sans-serif", fontSize: "0.77rem", color: theme.palette.text.secondary, lineHeight: 1.4 }}>
                  {desc}
                </Typography>
              </Box>
              {isPremium && <CheckCircle sx={{ fontSize: 16, color: "#16a34a", flexShrink: 0 }} />}
            </Box>
            {i < features.length - 1 && <Divider />}
          </Box>
        ))}
      </Box>

      {/* Cancel button (premium only) */}
      {isPremium && (
        <Box sx={{ pt: 1 }}>
          <Typography sx={{ fontFamily: "'Inter', sans-serif", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: theme.palette.text.disabled, mb: 1.5 }}>
            Manage
          </Typography>
          <Box sx={{ borderRadius: "16px", border: "1px solid", borderColor: bc, overflow: "hidden" }}>
            <Box
              component="button"
              onClick={() => setConfirmCancelOpen(true)}
              sx={{
                width: "100%", display: "flex", alignItems: "center", gap: 1.5,
                px: 2, py: 1.6, bgcolor: "transparent", border: "none", cursor: "pointer",
                "&:hover": { bgcolor: theme.palette.action.hover },
                transition: "background 0.12s",
              }}
            >
              <CancelOutlined sx={{ fontSize: 18, color: theme.palette.error.main }} />
              <Typography sx={{ fontFamily: "'Inter', sans-serif", fontSize: "0.875rem", fontWeight: 500, color: theme.palette.error.main }}>
                Cancel Premium
              </Typography>
            </Box>
          </Box>
          <Typography sx={{ fontFamily: "'Inter', sans-serif", fontSize: "0.72rem", color: theme.palette.text.disabled, mt: 1 }}>
            Your Premium benefits will remain active until {formatExpiry(expiresAt)}.
          </Typography>
        </Box>
      )}

      {/* Upgrade modal */}
      <PremiumUpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        onUpgraded={() => {
          setIsPremium(true);
          setUpgradeOpen(false);
        }}
      />

      {/* Cancel confirm dialog */}
      <Dialog
        open={confirmCancelOpen}
        onClose={() => setConfirmCancelOpen(false)}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 200, sx: { backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" } }}
        PaperProps={{ sx: { borderRadius: "20px", width: "100%", maxWidth: 360, bgcolor: "background.paper", border: "1px solid", borderColor: bc } }}
      >
        <Fade in={confirmCancelOpen} timeout={180}>
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: "12px", bgcolor: `${theme.palette.error.main}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CancelOutlined sx={{ fontSize: 20, color: theme.palette.error.main }} />
              </Box>
              <IconButton size="small" onClick={() => setConfirmCancelOpen(false)} sx={{ width: 28, height: 28, borderRadius: "8px" }}>
                <Close sx={{ fontSize: 14 }} />
              </IconButton>
            </Box>
            <Typography sx={{ fontFamily: "'Inter', sans-serif", fontSize: "1rem", fontWeight: 700, color: theme.palette.text.primary, mb: 0.75 }}>
              Cancel Premium?
            </Typography>
            <Typography sx={{ fontFamily: "'Inter', sans-serif", fontSize: "0.85rem", color: theme.palette.text.secondary, lineHeight: 1.55, mb: 2.5 }}>
              You'll lose access to all Premium features including your gold badge and profile viewers. Your membership will remain active until {formatExpiry(expiresAt)}.
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                fullWidth variant="outlined"
                onClick={() => setConfirmCancelOpen(false)}
                sx={{ borderRadius: "12px", textTransform: "none", fontFamily: "'Inter', sans-serif", fontWeight: 600, py: 1, borderColor: bc, color: theme.palette.text.primary, "&:hover": { borderColor: theme.palette.text.secondary } }}
              >
                Keep Premium
              </Button>
              <Button
                fullWidth
                onClick={handleCancel}
                disabled={cancelLoading}
                sx={{
                  borderRadius: "12px", textTransform: "none", fontFamily: "'Inter', sans-serif", fontWeight: 600, py: 1,
                  bgcolor: theme.palette.error.main, color: "#fff",
                  "&:hover": { bgcolor: theme.palette.error.dark },
                  "&.Mui-disabled": { opacity: 0.6 },
                }}
                startIcon={cancelLoading ? <CircularProgress size={14} sx={{ color: "#fff" }} /> : undefined}
              >
                {cancelLoading ? "Cancelling…" : "Yes, cancel"}
              </Button>
            </Box>
          </Box>
        </Fade>
      </Dialog>
    </Box>
  );
};

export default PremiumSettings;
