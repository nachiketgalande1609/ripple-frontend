import { useState } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES } from "../../i18n";
import { useAppNotifications } from "../../hooks/useNotification";

const LanguageSettings = () => {
    const { t, i18n } = useTranslation();
    const notifications = useAppNotifications();
    const [saving, setSaving] = useState<string | null>(null);
    const [selected, setSelected] = useState(i18n.language || "en");

    const handleSelect = async (code: string) => {
        if (code === selected || saving) return;
        setSaving(code);
        try {
            await i18n.changeLanguage(code);
            localStorage.setItem("appLanguage", code);
            setSelected(code);
            notifications.show(t("language.saved"), { severity: "success", autoHideDuration: 2500 });
        } finally {
            setSaving(null);
        }
    };

    return (
        <Box sx={{ width: "100%", maxWidth: 620, display: "flex", flexDirection: "column", gap: 2.5 }}>
            {/* Header */}
            <Box sx={{ mb: 0.25 }}>
                <Typography sx={{ fontFamily: "'Inter', sans-serif", fontSize: "1rem", fontWeight: 500, color: (t) => t.palette.text.primary, lineHeight: 1.3 }}>
                    {t("language.title")}
                </Typography>
                <Typography sx={{ fontFamily: "'Inter', sans-serif", fontSize: "0.8rem", color: (t) => t.palette.text.disabled, mt: 0.375 }}>
                    {t("language.subtitle")}
                </Typography>
            </Box>

            {/* Language list */}
            <Box sx={{ borderRadius: "14px", border: "1px solid", borderColor: (t) => t.palette.divider, backgroundColor: (t) => t.palette.background.paper, overflow: "hidden" }}>
                {SUPPORTED_LANGUAGES.map((lang, index) => {
                    const isSelected = selected === lang.code;
                    const isSaving = saving === lang.code;
                    const isLast = index === SUPPORTED_LANGUAGES.length - 1;
                    return (
                        <Box
                            key={lang.code}
                            onClick={() => handleSelect(lang.code)}
                            sx={{
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                px: 2.5, py: 1.75,
                                cursor: "pointer",
                                borderBottom: isLast ? "none" : "1px solid",
                                borderColor: (t) => t.palette.divider,
                                backgroundColor: isSelected ? (t) => t.palette.action.hover : "transparent",
                                transition: "background-color 0.15s",
                                "&:hover": { backgroundColor: (t) => t.palette.action.hover },
                            }}
                        >
                            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                <Typography sx={{ fontSize: "1.5rem", lineHeight: 1 }}>{lang.flag}</Typography>
                                <Box>
                                    <Typography sx={{ fontFamily: "'Inter', sans-serif", fontSize: "0.875rem", fontWeight: isSelected ? 600 : 500, color: (t) => t.palette.text.primary, lineHeight: 1.3 }}>
                                        {lang.nativeLabel}
                                    </Typography>
                                    <Typography sx={{ fontFamily: "'Inter', sans-serif", fontSize: "0.75rem", color: (t) => t.palette.text.disabled, mt: 0.125 }}>
                                        {t(`language.${lang.code}`)}
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                {isSaving ? (
                                    <CircularProgress size={14} thickness={5} sx={{ color: "text.disabled" }} />
                                ) : isSelected ? (
                                    <CheckRoundedIcon sx={{ fontSize: "1.1rem", color: "#6366f1" }} />
                                ) : null}
                            </Box>
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
};

export default LanguageSettings;
