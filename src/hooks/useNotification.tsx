/**
 * useAppNotifications — drop-in replacement for @toolpad/core/useNotifications
 *
 * Usage:
 *   1. Wrap your app (or the relevant subtree) with <NotificationProvider>
 *   2. In any component: const notifications = useAppNotifications();
 *      notifications.show("Message!", { severity: "success", autoHideDuration: 3000 });
 *
 * API is intentionally identical to Toolpad's useNotifications so you only need
 * to change the import line in Post.tsx (and any other consumer).
 */

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

/* ─── Types ─────────────────────────────────────────────────────── */
type Severity = "success" | "error" | "info" | "warning";

interface NotificationOptions {
    severity?: Severity;
    autoHideDuration?: number;
}

interface NotificationItem extends Required<NotificationOptions> {
    id: string;
    message: string;
    /** 0 → entering  1 → visible  2 → leaving */
    phase: 0 | 1 | 2;
}

interface NotificationsAPI {
    show: (message: string, options?: NotificationOptions) => void;
}

/* ─── Context ───────────────────────────────────────────────────── */
const NotificationsContext = createContext<NotificationsAPI | null>(null);

/* ─── Colour map ────────────────────────────────────────────────── */
const palette: Record<Severity, { icon: string; accent: string; glow: string }> = {
    success: {
        icon: "✓",
        accent: "rgba(52,211,153,0.9)",
        glow: "rgba(52,211,153,0.18)",
    },
    error: {
        icon: "✕",
        accent: "rgba(230,57,70,0.9)",
        glow: "rgba(230,57,70,0.18)",
    },
    warning: {
        icon: "⚠",
        accent: "rgba(251,191,36,0.9)",
        glow: "rgba(251,191,36,0.18)",
    },
    info: {
        icon: "i",
        accent: "rgba(124,92,252,0.9)",
        glow: "rgba(124,92,252,0.18)",
    },
};

/* ─── Single toast ──────────────────────────────────────────────── */
const ENTER_MS = 340;
const LEAVE_MS = 280;

const Toast: React.FC<{
    item: NotificationItem;
    onRemove: (id: string) => void;
}> = ({ item, onRemove }) => {
    const { icon, accent, glow } = palette[item.severity];
    const [visible, setVisible] = useState(false);

    /* enter */
    useEffect(() => {
        const t = requestAnimationFrame(() => setVisible(true));
        return () => cancelAnimationFrame(t);
    }, []);

    /* auto-hide */
    useEffect(() => {
        if (item.autoHideDuration <= 0) return;
        const t = setTimeout(() => {
            setVisible(false);
            setTimeout(() => onRemove(item.id), LEAVE_MS);
        }, item.autoHideDuration);
        return () => clearTimeout(t);
    }, [item.autoHideDuration, item.id, onRemove]);

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px 10px 12px",
                borderRadius: 14,
                background: "linear-gradient(135deg, #1c1c28 0%, #16161f 100%)",
                border: `1px solid rgba(255,255,255,0.08)`,
                boxShadow: `0 8px 32px rgba(0,0,0,0.55), 0 0 0 1px ${glow}, inset 0 1px 0 rgba(255,255,255,0.05)`,
                backdropFilter: "blur(16px)",
                maxWidth: 340,
                minWidth: 220,
                pointerEvents: "auto",
                cursor: "default",
                /* transition */
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0) scale(1)" : "translateY(14px) scale(0.95)",
                transition: `opacity ${visible ? ENTER_MS : LEAVE_MS}ms cubic-bezier(0.22,1,0.36,1),
                     transform ${visible ? ENTER_MS : LEAVE_MS}ms cubic-bezier(0.22,1,0.36,1)`,
                willChange: "opacity, transform",
            }}
        >
            {/* icon pill */}
            <div
                style={{
                    width: 26,
                    height: 26,
                    borderRadius: 8,
                    background: glow,
                    border: `1px solid ${accent}22`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: accent,
                    fontSize: item.severity === "warning" ? 13 : 14,
                    fontWeight: 700,
                    flexShrink: 0,
                    fontFamily: "monospace",
                }}
            >
                {icon}
            </div>

            {/* message */}
            <span
                style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "0.84rem",
                    fontWeight: 500,
                    color: "#dde1e7",
                    lineHeight: 1.4,
                    flex: 1,
                }}
            >
                {item.message}
            </span>

            {/* dismiss */}
            <button
                onClick={() => {
                    setVisible(false);
                    setTimeout(() => onRemove(item.id), LEAVE_MS);
                }}
                style={{
                    background: "none",
                    border: "none",
                    padding: "2px 4px",
                    cursor: "pointer",
                    color: "rgba(255,255,255,0.25)",
                    fontSize: 16,
                    lineHeight: 1,
                    flexShrink: 0,
                    transition: "color 0.15s",
                    borderRadius: 4,
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.65)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.25)")}
                aria-label="Dismiss"
            >
                ×
            </button>
        </div>
    );
};

/* ─── Portal container ──────────────────────────────────────────── */
const NotificationStack: React.FC<{
    items: NotificationItem[];
    onRemove: (id: string) => void;
}> = ({ items, onRemove }) => (
    <div
        style={{
            position: "fixed",
            bottom: 24,
            right: 20,
            zIndex: 9999,
            display: "flex",
            flexDirection: "column-reverse",
            gap: 10,
            pointerEvents: "none",
        }}
    >
        {items.map((item) => (
            <Toast key={item.id} item={item} onRemove={onRemove} />
        ))}
    </div>
);

/* ─── Provider ──────────────────────────────────────────────────── */
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [items, setItems] = useState<NotificationItem[]>([]);
    const counter = useRef(0);

    const show = useCallback((message: string, options?: NotificationOptions) => {
        const id = `notif-${Date.now()}-${counter.current++}`;
        setItems((prev) => [
            ...prev,
            {
                id,
                message,
                severity: options?.severity ?? "info",
                autoHideDuration: options?.autoHideDuration ?? 4000,
                phase: 0,
            },
        ]);
    }, []);

    const remove = useCallback((id: string) => {
        setItems((prev) => prev.filter((n) => n.id !== id));
    }, []);

    return (
        <NotificationsContext.Provider value={{ show }}>
            <>
                <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap" />
                {children}
                <NotificationStack items={items} onRemove={remove} />
            </>
        </NotificationsContext.Provider>
    );
};

/* ─── Hook ──────────────────────────────────────────────────────── */
export function useAppNotifications(): NotificationsAPI {
    const ctx = useContext(NotificationsContext);
    if (!ctx) throw new Error("useAppNotifications must be used inside <NotificationProvider>");
    return ctx;
}
