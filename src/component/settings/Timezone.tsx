import { useState, useMemo } from "react";
import { Box, Typography, MenuItem, Select, Button, CircularProgress } from "@mui/material";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { updateTimezone } from "../../services/api";
import { useAppNotifications } from "../../hooks/useNotification";
import { getUserTimezone } from "../../utils/utils";

const labelSx = {
    fontFamily: "'Inter', -apple-system, sans-serif",
    fontSize: "0.7rem",
    fontWeight: 500,
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    color: (t: any) => t.palette.text.disabled,
    mb: 0.875,
    display: "block",
};

const selectSx = {
    borderRadius: "14px",
    backgroundColor: "var(--nav-bg)",
    fontSize: "0.875rem",
    boxShadow: "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)",
    transition: "box-shadow 0.35s cubic-bezier(0.4,0,0.2,1)",
    "& fieldset": { border: "none" },
    "&:hover fieldset": { border: "none" },
    "&.Mui-focused": {
        boxShadow: "inset 3px 3px 10px var(--nav-neo-shadow1), inset -3px -3px 10px var(--nav-neo-shadow2)",
    },
    "&.Mui-focused fieldset": { border: "none" },
};

function getUtcOffset(tz: string): string {
    try {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat("en-US", {
            timeZone: tz,
            timeZoneName: "shortOffset",
        });
        const parts = formatter.formatToParts(now);
        const offset = parts.find((p) => p.type === "timeZoneName")?.value ?? "";
        return offset;
    } catch {
        return "";
    }
}

function buildTimezoneList() {
    const all: string[] = (Intl as any).supportedValuesOf?.("timeZone") ?? [
        "UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
        "America/Sao_Paulo", "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Moscow",
        "Asia/Dubai", "Asia/Kolkata", "Asia/Singapore", "Asia/Tokyo", "Asia/Shanghai",
        "Australia/Sydney", "Pacific/Auckland",
    ];
    return all.map((tz) => ({ tz, label: `${tz.replace(/_/g, " ")} (${getUtcOffset(tz)})` }))
              .sort((a, b) => a.tz.localeCompare(b.tz));
}

export default function Timezone() {
    const notifications = useAppNotifications();
    const [selected, setSelected] = useState<string>(getUserTimezone);
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);
    const tzList = useMemo(() => buildTimezoneList(), []);

    const handleSave = async () => {
        setLoading(true);
        try {
            await updateTimezone(selected);
            const stored = localStorage.getItem("user");
            if (stored) {
                const user = JSON.parse(stored);
                user.timezone = selected;
                localStorage.setItem("user", JSON.stringify(user));
            }
            setSaved(true);
            notifications.show("Timezone updated successfully.", { severity: "success", autoHideDuration: 3000 });
            setTimeout(() => setSaved(false), 3000);
        } catch {
            notifications.show("Failed to update timezone.", { severity: "error", autoHideDuration: 3500 });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ width: "100%", maxWidth: 620 }}>
            {/* Header */}
            <Box sx={{ mb: 2.5 }}>
                <Typography sx={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "1rem", color: "text.primary", letterSpacing: "-0.3px" }}>
                    Timezone
                </Typography>
                <Typography sx={{ fontFamily: "'Inter', sans-serif", fontSize: "0.78rem", color: "text.disabled", mt: 0.3 }}>
                    All timestamps across Ripple will be shown in your selected timezone
                </Typography>
            </Box>

            {/* Card */}
            <Box sx={{ borderRadius: "14px", border: "1px solid", borderColor: "divider", backgroundColor: "background.paper", overflow: "hidden" }}>
                <Box sx={{ px: 2.5, pt: 2.5, pb: 2.5, display: "flex", flexDirection: "column", gap: 2.5 }}>
                    <Box>
                        <Typography component="label" sx={labelSx}>Your timezone</Typography>
                        <Select
                            fullWidth
                            value={selected}
                            onChange={(e) => { setSelected(e.target.value); setSaved(false); }}
                            sx={selectSx}
                            MenuProps={{
                                PaperProps: {
                                    sx: {
                                        maxHeight: 320,
                                        borderRadius: "14px",
                                        border: "1px solid",
                                        borderColor: "divider",
                                        backgroundColor: "background.paper",
                                        mt: 0.5,
                                    },
                                },
                            }}
                        >
                            {tzList.map(({ tz, label }) => (
                                <MenuItem key={tz} value={tz} sx={{ fontSize: "0.875rem" }}>
                                    {label}
                                </MenuItem>
                            ))}
                        </Select>
                    </Box>

                    {/* Preview */}
                    <Box sx={{ borderRadius: "10px", backgroundColor: (t) => t.palette.action.hover, px: 2, py: 1.5 }}>
                        <Typography sx={{ fontSize: "0.72rem", color: "text.disabled", textTransform: "uppercase", letterSpacing: "0.06em", mb: 0.5 }}>
                            Current time in selected timezone
                        </Typography>
                        <Typography sx={{ fontSize: "0.9rem", fontWeight: 600, color: "text.primary", fontVariantNumeric: "tabular-nums" }}>
                            {new Intl.DateTimeFormat("en-US", {
                                weekday: "long", year: "numeric", month: "long", day: "numeric",
                                hour: "2-digit", minute: "2-digit", second: "2-digit",
                                timeZone: selected,
                            }).format(new Date())}
                        </Typography>
                    </Box>
                </Box>

                {/* Footer */}
                <Box sx={{ px: 2.5, py: 2, borderTop: "1px solid", borderColor: "divider", display: "flex", justifyContent: "flex-end" }}>
                    <Button
                        onClick={handleSave}
                        disabled={loading || saved}
                        sx={{
                            borderRadius: "12px",
                            textTransform: "none",
                            fontWeight: 600,
                            fontSize: "0.875rem",
                            px: 3,
                            py: 1,
                            minWidth: 148,
                            height: 40,
                            position: "relative",
                            overflow: "hidden",
                            transition: "background-color 0.3s, box-shadow 0.35s, color 0.2s",
                            backgroundColor: saved ? "rgba(16,185,129,0.12)" : "var(--nav-bg)",
                            color: saved ? "#10b981" : "text.primary",
                            boxShadow: saved
                                ? "none"
                                : "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)",
                            "&:hover": {
                                backgroundColor: saved ? "rgba(16,185,129,0.16)" : "var(--nav-bg)",
                                boxShadow: saved
                                    ? "none"
                                    : "inset 3px 3px 10px var(--nav-neo-shadow1), inset -3px -3px 10px var(--nav-neo-shadow2)",
                            },
                        }}
                    >
                        {loading ? (
                            <CircularProgress size={18} />
                        ) : saved ? (
                            <>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                                    <CheckRoundedIcon sx={{ fontSize: "1.1rem" }} />
                                    Saved!
                                </Box>
                                <Box
                                    sx={{
                                        position: "absolute",
                                        bottom: 0,
                                        left: 0,
                                        height: "3px",
                                        backgroundColor: "#10b981",
                                        borderRadius: "0 0 12px 12px",
                                        "@keyframes drain": {
                                            from: { width: "100%" },
                                            to: { width: "0%" },
                                        },
                                        animation: "drain 3s linear forwards",
                                    }}
                                />
                            </>
                        ) : (
                            "Save timezone"
                        )}
                    </Button>
                </Box>
            </Box>
        </Box>
    );
}
