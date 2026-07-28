import { useState } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import TranslateRoundedIcon from "@mui/icons-material/TranslateRounded";
import { useTranslation } from "react-i18next";

interface TranslateButtonProps {
    text: string;
    onTranslated: (translated: string | null) => void;
    isTranslated: boolean;
}

async function translateText(text: string, targetLang: string): Promise<string> {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=autodetect|${targetLang}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Network error");
    const data = await res.json();
    if (data.responseStatus !== 200) throw new Error(data.responseMessage);
    return data.responseData.translatedText;
}

const TranslateButton = ({ text, onTranslated, isTranslated }: TranslateButtonProps) => {
    const { t, i18n } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    if (!text?.trim()) return null;

    const handleClick = async () => {
        if (isTranslated) {
            onTranslated(null);
            return;
        }
        setLoading(true);
        setError(false);
        try {
            const translated = await translateText(text, i18n.language);
            onTranslated(translated);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            onClick={handleClick}
            sx={{
                display: "inline-flex", alignItems: "center", gap: 0.5,
                cursor: loading ? "default" : "pointer",
                mt: 0.5,
                userSelect: "none",
                opacity: loading ? 0.6 : 1,
            }}
        >
            {loading ? (
                <CircularProgress size={10} thickness={5} sx={{ color: "text.disabled" }} />
            ) : (
                <TranslateRoundedIcon sx={{ fontSize: "0.75rem", color: "text.disabled" }} />
            )}
            <Typography sx={{ fontSize: "0.72rem", color: "text.disabled", lineHeight: 1, fontWeight: 500 }}>
                {loading
                    ? t("translate.translating")
                    : error
                    ? t("translate.error")
                    : isTranslated
                    ? t("translate.showOriginal")
                    : t("translate.button")}
            </Typography>
        </Box>
    );
};

export default TranslateButton;
