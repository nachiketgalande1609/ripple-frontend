import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Select, MenuItem, SelectChangeEvent } from "@mui/material";
import { SUPPORTED_LANGUAGES } from "../../i18n";

const AuthLanguageSelector = () => {
    const { i18n } = useTranslation();

    const supportedCodes = SUPPORTED_LANGUAGES.map((l) => l.code);

    const resolveInitialLang = (): string => {
        const stored = localStorage.getItem("authPageLanguage");
        if (stored && supportedCodes.includes(stored)) return stored;
        const browser = navigator.language.split("-")[0];
        if (supportedCodes.includes(browser)) return browser;
        return "en";
    };

    const [selected, setSelected] = useState<string>(resolveInitialLang);
    const savedAppLang = useRef<string>(
        localStorage.getItem("appLanguage") || i18n.language || "en"
    );

    useEffect(() => {
        // Switch i18n to the auth-page language without touching the app setting
        i18n.changeLanguage(selected);

        return () => {
            // Restore the app language when the auth page unmounts
            i18n.changeLanguage(savedAppLang.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleChange = (event: SelectChangeEvent<string>) => {
        const code = event.target.value;
        setSelected(code);
        localStorage.setItem("authPageLanguage", code);
        i18n.changeLanguage(code);
    };

    return (
        <Select
            value={selected}
            onChange={handleChange}
            variant="standard"
            disableUnderline
            sx={{
                fontSize: 13,
                fontWeight: 400,
                letterSpacing: "0.3px",
                color: "rgba(255,255,255,0.55)",
                "& .MuiSelect-select": { paddingRight: "24px !important", paddingBottom: 0 },
                "& .MuiSvgIcon-root": { color: "rgba(255,255,255,0.4)", fontSize: 18 },
                "&:hover .MuiSelect-select": { color: "rgba(255,255,255,0.85)" },
                "&:hover .MuiSvgIcon-root": { color: "rgba(255,255,255,0.7)" },
            }}
            MenuProps={{
                PaperProps: {
                    sx: {
                        background: "#1a1410",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 2,
                        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                        "& .MuiMenuItem-root": {
                            fontSize: 13,
                            color: "rgba(255,255,255,0.7)",
                            "&:hover": { background: "rgba(255,255,255,0.06)", color: "#fff" },
                            "&.Mui-selected": { background: "rgba(244,169,106,0.12)", color: "#f4a96a" },
                            "&.Mui-selected:hover": { background: "rgba(244,169,106,0.18)" },
                        },
                    },
                },
            }}
        >
            {SUPPORTED_LANGUAGES.map((lang) => (
                <MenuItem key={lang.code} value={lang.code}>
                    {lang.flag} {lang.nativeLabel}
                </MenuItem>
            ))}
        </Select>
    );
};

export default AuthLanguageSelector;
