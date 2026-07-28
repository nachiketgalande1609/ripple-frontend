export function formatLastSeen(lastSeen: string | null | undefined, isOnline: boolean): string {
    if (isOnline) return "Online";
    if (!lastSeen) return "";

    const diff = Date.now() - new Date(lastSeen).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return "Last seen just now";
    const m = Math.floor(s / 60);
    if (m < 60) return `Last seen ${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `Last seen ${h}h ago`;
    const d = Math.floor(h / 24);
    if (d === 1) return "Last seen yesterday";
    if (d < 7) return `Last seen ${d}d ago`;
    return `Last seen ${new Date(lastSeen).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}
