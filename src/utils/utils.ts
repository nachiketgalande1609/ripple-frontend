import { useState, useEffect } from "react";

export function useDebounce(text: string, delay: number) {
    const [debouncedInput, setDebouncedInput] = useState<string>(text);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedInput(text);
        }, delay);

        // Cleanup function to clear timeout if text or delay changes
        return () => {
            clearTimeout(handler);
        };
    }, [text, delay]);

    return debouncedInput;
}

export const getUserTimezone = (): string => {
    const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    try {
        const user = localStorage.getItem("user");
        if (user) {
            const parsed = JSON.parse(user);
            // Only use stored timezone if user explicitly set a non-UTC value
            if (parsed?.timezone && parsed.timezone !== "UTC") return parsed.timezone;
        }
    } catch {}
    return browserTz;
};

export const timeAgo = (timestamp: string) => {
    if (!timestamp) return "";
    const now = new Date();
    const past = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just Now";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}w`;
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths}mo`;
    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears}y`;
};

export const formatDateInUserTz = (timestamp: string, options?: Intl.DateTimeFormatOptions): string => {
    if (!timestamp) return "";
    const tz = getUserTimezone();
    const normalized = /Z|[+-]\d{2}:\d{2}$/.test(timestamp) ? timestamp : timestamp.replace(" ", "T") + "Z";
    const date = new Date(normalized);
    const defaultOptions: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: tz,
        timeZoneName: "short",
        ...options,
    };
    return new Intl.DateTimeFormat("en-US", defaultOptions).format(date);
};
