import React, { useState } from "react";
import { Dialog, Box, Typography, IconButton, CircularProgress } from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { useTranslation } from 'react-i18next';
import { loginUser } from "../services/api";
import { getAccounts, saveAccount, switchAccount } from "../utils/accounts";

interface AddAccountDialogProps {
    open: boolean;
    onClose: () => void;
}

export default function AddAccountDialog({ open, onClose }: AddAccountDialogProps) {
    const { t } = useTranslation();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const dismiss = () => {
        setError(null);
        setEmail("");
        setPassword("");
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const res = await loginUser({ email, password });
            if (res.success) {
                const existing = getAccounts().find((a) => String(a.id) === String(res.data.user.id));
                if (existing) {
                    setError(t("auth.alreadyAdded"));
                    setLoading(false);
                    return;
                }
                saveAccount(res.data.user, res.data.token);
                switchAccount(String(res.data.user.id));
                window.location.href = "/";
            } else {
                setError(res.error || "Login failed");
            }
        } catch (err: any) {
            setError(err.response?.data?.error || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={dismiss}
            maxWidth="xs"
            fullWidth
            BackdropProps={{ sx: { backdropFilter: "blur(10px)", backgroundColor: "rgba(0,0,0,0.6)" } }}
            sx={{
                "& .MuiDialog-paper": {
                    borderRadius: "20px",
                    backgroundColor: "#0e0a08",
                    border: "1px solid rgba(255,255,255,0.06)",
                    boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
                    p: 0, mx: 2,
                    overflow: "hidden",
                    position: "relative",
                    "&::before": {
                        content: '""',
                        position: "absolute",
                        top: "-80px", right: "-80px",
                        width: "280px", height: "280px",
                        borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(234,100,80,0.09) 0%, transparent 70%)",
                        pointerEvents: "none",
                    },
                },
            }}
        >
            <Box sx={{ p: "36px 40px", fontFamily: "'Figtree', sans-serif", position: "relative", zIndex: 1 }}>
                {/* Header */}
                <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 3 }}>
                    <Box>
                        <Typography sx={{
                            fontFamily: "'Fraunces', serif", fontWeight: 300, fontSize: "1.7rem",
                            color: "#fff", lineHeight: 1.15, letterSpacing: "-0.5px", mb: 0.5,
                        }}>
                            {t("auth.signIn")}
                        </Typography>
                        <Typography sx={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.35)", fontWeight: 300 }}>
                            {t("auth.addAnotherAccount")}
                        </Typography>
                    </Box>
                    <IconButton
                        size="small"
                        onClick={dismiss}
                        sx={{ color: "rgba(255,255,255,0.25)", p: 0.5, mt: 0.5, borderRadius: "10px", "&:hover": { color: "rgba(255,255,255,0.6)", backgroundColor: "rgba(255,255,255,0.06)" } }}
                    >
                        <CloseIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                </Box>

                {/* Error */}
                {error && (
                    <Box sx={{ mb: 2, p: "10px 14px", borderRadius: "10px", backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                        <Typography sx={{ fontSize: "0.78rem", color: "#f87171", fontFamily: "'Figtree', sans-serif" }}>
                            ⚠ {error}
                        </Typography>
                    </Box>
                )}

                {/* Form */}
                <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <Box>
                        <Typography sx={{ fontSize: "11px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", mb: 1, fontFamily: "'Figtree', sans-serif" }}>
                            {t("auth.email")}
                        </Typography>
                        <input
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                            required
                            style={{ width: "100%", height: "50px", background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "0 18px", fontSize: "15px", fontFamily: "'Figtree', sans-serif", fontWeight: 400, color: "#fff", outline: "none", boxSizing: "border-box" }}
                            onFocus={(e) => { e.target.style.borderColor = "rgba(244,169,106,0.55)"; e.target.style.background = "rgba(244,169,106,0.05)"; e.target.style.boxShadow = "0 0 0 4px rgba(244,169,106,0.08)"; }}
                            onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.background = "rgba(255,255,255,0.04)"; e.target.style.boxShadow = "none"; }}
                        />
                    </Box>

                    <Box>
                        <Typography sx={{ fontSize: "11px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", mb: 1, fontFamily: "'Figtree', sans-serif" }}>
                            {t("auth.password")}
                        </Typography>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            required
                            style={{ width: "100%", height: "50px", background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "0 18px", fontSize: "15px", fontFamily: "'Figtree', sans-serif", fontWeight: 400, color: "#fff", outline: "none", boxSizing: "border-box" }}
                            onFocus={(e) => { e.target.style.borderColor = "rgba(244,169,106,0.55)"; e.target.style.background = "rgba(244,169,106,0.05)"; e.target.style.boxShadow = "0 0 0 4px rgba(244,169,106,0.08)"; }}
                            onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.background = "rgba(255,255,255,0.04)"; e.target.style.boxShadow = "none"; }}
                        />
                    </Box>

                    <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
                        <button
                            type="submit"
                            disabled={loading || !email || !password}
                            style={{
                                height: "50px", padding: "0 32px", borderRadius: "14px", border: "none",
                                background: "linear-gradient(135deg, #f4a96a 0%, #e05c7e 100%)",
                                color: "#fff", fontSize: "15px", fontWeight: 600,
                                fontFamily: "'Figtree', sans-serif", cursor: loading ? "default" : "pointer",
                                display: "flex", alignItems: "center", gap: 8,
                                boxShadow: "0 6px 28px rgba(224,92,126,0.35)",
                                opacity: (loading || !email || !password) ? 0.4 : 1,
                                transition: "opacity 0.2s, transform 0.15s, box-shadow 0.2s",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {loading
                                ? <CircularProgress size={16} thickness={4} sx={{ color: "#fff" }} />
                                : <>{t("auth.signIn")} <span style={{ fontSize: 16, opacity: 0.75 }}>→</span></>
                            }
                        </button>
                    </Box>
                </Box>
            </Box>
        </Dialog>
    );
}
