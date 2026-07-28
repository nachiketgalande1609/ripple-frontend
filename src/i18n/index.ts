import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./locales/en";
import hi from "./locales/hi";
import es from "./locales/es";
import fr from "./locales/fr";
import de from "./locales/de";
import pt from "./locales/pt";
import ja from "./locales/ja";

export const SUPPORTED_LANGUAGES = [
    { code: "en", label: "English", nativeLabel: "English", flag: "🇺🇸" },
    { code: "hi", label: "Hindi", nativeLabel: "हिन्दी", flag: "🇮🇳" },
    { code: "es", label: "Spanish", nativeLabel: "Español", flag: "🇪🇸" },
    { code: "fr", label: "French", nativeLabel: "Français", flag: "🇫🇷" },
    { code: "de", label: "German", nativeLabel: "Deutsch", flag: "🇩🇪" },
    { code: "pt", label: "Portuguese", nativeLabel: "Português", flag: "🇧🇷" },
    { code: "ja", label: "Japanese", nativeLabel: "日本語", flag: "🇯🇵" },
];

const savedLang = localStorage.getItem("appLanguage") || "en";

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: { en: { translation: en }, hi: { translation: hi }, es: { translation: es }, fr: { translation: fr }, de: { translation: de }, pt: { translation: pt }, ja: { translation: ja } },
        lng: savedLang,
        fallbackLng: "en",
        interpolation: { escapeValue: false },
        detection: { order: ["localStorage", "navigator"], caches: [] },
    });

export default i18n;
