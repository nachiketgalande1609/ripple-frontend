import React, { useEffect } from "react";
import BlankProfileImage from "../../../static/profile_blank.png";
import { timeAgo } from "../../../utils/utils";

// ─── Types ──────────────────────────────────────────────────────────────────

type User = {
    id: number;
    username: string;
    profile_picture: string;
    isOnline: boolean;
    latest_message: string;
    latest_message_timestamp: string;
    unread_count: number;
};

type MessagesUserListProps = {
    users: User[];
    onlineUsers: string[];
    handleUserClick: (userId: number) => void;
    activeUserId?: number;
};

// ─── Styles (injected once) ──────────────────────────────────────────────────

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');

  .msg-list-root {
    --bg: #0d0d0f;
    --surface: #141416;
    --surface-hover: rgba(255,255,255,0.05);
    --surface-active: rgba(255,255,255,0.07);
    --border: rgba(255,255,255,0.06);
    --accent: #7c5cfc;
    --accent-glow: rgba(124,92,252,0.15);
    --online: #3ecf8e;
    --text-primary: #f0eeff;
    --text-secondary: #8b8a97;
    --text-muted: #55535f;
    --unread-bg: #7c5cfc;
    --radius: 14px;
    font-family: 'DM Sans', sans-serif;
    background: var(--bg);
    color: var(--text-primary);
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
    box-sizing: border-box;
  }

  /* ── Header ── */
  .msg-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 22px 20px 16px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
    position: relative;
    z-index: 1;
  }

  .msg-header-title {
    font-size: 18px;
    font-weight: 600;
    letter-spacing: -0.3px;
    color: var(--text-primary);
    margin: 0;
  }

  .msg-header-count {
    font-size: 11px;
    font-weight: 500;
    color: var(--accent);
    background: var(--accent-glow);
    border: 1px solid rgba(124,92,252,0.35);
    border-radius: 20px;
    padding: 2px 9px;
    letter-spacing: 0.3px;
  }

  /* ── Search ── */
  .msg-search-wrap {
    padding: 12px 14px 8px;
    flex-shrink: 0;
    position: relative;
    z-index: 1;
  }

  .msg-search {
    width: 100%;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 9px 14px 9px 36px;
    color: var(--text-primary);
    font-family: 'DM Sans', sans-serif;
    font-size: 13.5px;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.2s, background 0.2s;
  }

  .msg-search::placeholder { color: var(--text-muted); }

  .msg-search:focus {
    border-color: rgba(124,92,252,0.5);
    background: #171720;
  }

  .msg-search-icon {
    position: absolute;
    left: 26px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-muted);
    pointer-events: none;
    width: 15px;
    height: 15px;
  }

  /* ── Loader ── */
  .msg-loader {
    padding: 28px 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .msg-skeleton {
    display: flex;
    align-items: center;
    gap: 12px;
    animation: pulse 1.6s ease-in-out infinite;
  }

  .msg-skeleton-avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: var(--surface-hover);
    flex-shrink: 0;
  }

  .msg-skeleton-lines {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 7px;
  }

  .msg-skeleton-line {
    height: 11px;
    border-radius: 6px;
    background: var(--surface-hover);
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  /* ── List ── */
  .msg-list {
    flex: 1;
    overflow-y: auto;
    padding: 6px 8px;
    position: relative;
    z-index: 1;
  }

  .msg-list::-webkit-scrollbar { width: 4px; }
  .msg-list::-webkit-scrollbar-track { background: transparent; }
  .msg-list::-webkit-scrollbar-thumb {
    background: rgba(124,92,252,0.3);
    border-radius: 99px;
  }

  /* ── Item ── */
  .msg-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: var(--radius);
    cursor: pointer;
    border: none;
    width: 100%;
    text-align: left;
    background: transparent;
    color: var(--text-primary);
    position: relative;
    transition: background 0.15s ease;
    box-sizing: border-box;
    outline: none;
  }

  .msg-item:hover {
    background: var(--surface-hover);
  }

  .msg-item:focus-visible {
    box-shadow: 0 0 0 2px var(--accent);
  }

  .msg-item.active {
    background: var(--surface-active);
    box-shadow: inset 3px 0 0 var(--accent);
  }

  .msg-item.has-unread .msg-name {
    font-weight: 600;
    color: #fff;
  }

  .msg-item.has-unread .msg-preview {
    color: var(--text-secondary);
  }

  /* ── Avatar ── */
  .msg-avatar-wrap {
    position: relative;
    flex-shrink: 0;
  }

  .msg-avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    object-fit: cover;
    display: block;
    background: var(--surface-hover);
  }

  .msg-online-dot {
    position: absolute;
    bottom: 1px;
    right: 1px;
    width: 11px;
    height: 11px;
    border-radius: 50%;
    background: var(--online);
    border: 2px solid var(--bg);
  }

  /* ── Content ── */
  .msg-content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .msg-top-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .msg-name {
    font-size: 14px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--text-primary);
    letter-spacing: -0.1px;
  }

  .msg-time {
    font-size: 11px;
    color: var(--text-muted);
    white-space: nowrap;
    flex-shrink: 0;
  }

  .msg-item.has-unread .msg-time {
    color: var(--accent);
  }

  .msg-preview {
    font-size: 12.5px;
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.4;
    transition: color 0.15s;
  }

  /* ── Unread badge ── */
  .msg-badge {
    flex-shrink: 0;
    min-width: 20px;
    height: 20px;
    border-radius: 99px;
    background: var(--accent);
    color: #fff;
    font-size: 10.5px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 5px;

    letter-spacing: 0.2px;
  }

  /* ── Empty state ── */
  .msg-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    gap: 10px;
    color: var(--text-muted);
  }

  .msg-empty-icon {
    width: 40px;
    height: 40px;
    opacity: 0.4;
  }

  .msg-empty-text {
    font-size: 13.5px;
    text-align: center;
    line-height: 1.5;
  }

  /* ── Fade-in animation for items ── */
  .msg-item {
    animation: fadeSlide 0.2s ease both;
  }

  @keyframes fadeSlide {
    from { opacity: 0; transform: translateY(4px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

// ─── Component ───────────────────────────────────────────────────────────────

const MessagesUserList: React.FC<MessagesUserListProps> = ({ users, onlineUsers, handleUserClick, activeUserId }) => {
    // Inject styles once
    useEffect(() => {
        const id = "msg-user-list-styles";
        if (!document.getElementById(id)) {
            const el = document.createElement("style");
            el.id = id;
            el.textContent = CSS;
            document.head.appendChild(el);
        }
    }, []);

    const sorted = [...users].sort((a, b) => new Date(b.latest_message_timestamp).getTime() - new Date(a.latest_message_timestamp).getTime());

    const totalUnread = users.reduce((n, u) => n + (u.unread_count || 0), 0);

    return (
        <div className="msg-list-root">
            {/* Header */}
            <div className="msg-header">
                <h1 className="msg-header-title">Messages</h1>
                {totalUnread > 0 && <span className="msg-header-count">{totalUnread} new</span>}
            </div>

            {sorted.length === 0 ? (
                <div className="msg-empty">
                    <svg className="msg-empty-icon" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M8 12a2 2 0 012-2h20a2 2 0 012 2v14a2 2 0 01-2 2H12l-6 4V12z"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinejoin="round"
                        />
                    </svg>
                    <p className="msg-empty-text">No conversations yet.</p>
                </div>
            ) : (
                <ul className="msg-list" role="list" style={{ margin: 0, padding: "6px 8px", listStyle: "none" }}>
                    {sorted.map((user, i) => {
                        const isOnline = onlineUsers.includes(user.id.toString());
                        const isActive = activeUserId === user.id;
                        const hasUnread = (user.unread_count || 0) > 0;
                        const classes = ["msg-item", isActive ? "active" : "", hasUnread ? "has-unread" : ""].filter(Boolean).join(" ");

                        return (
                            <li key={user.id} style={{ animationDelay: `${i * 0.04}s` }}>
                                <button
                                    className={classes}
                                    onClick={() => handleUserClick(user.id)}
                                    aria-label={`Open conversation with ${user.username}${hasUnread ? `, ${user.unread_count} unread` : ""}`}
                                >
                                    {/* Avatar */}
                                    <div className="msg-avatar-wrap">
                                        <img
                                            className="msg-avatar"
                                            src={user.profile_picture || BlankProfileImage}
                                            alt={user.username}
                                            onError={(e) => {
                                                (e.currentTarget as HTMLImageElement).src = BlankProfileImage;
                                            }}
                                        />
                                        {isOnline && <span className="msg-online-dot" aria-label="Online" />}
                                    </div>

                                    {/* Text content */}
                                    <div className="msg-content">
                                        <div className="msg-top-row">
                                            <span className="msg-name">{user.username}</span>
                                            <span className="msg-time">{timeAgo(user.latest_message_timestamp)}</span>
                                        </div>
                                        <span className="msg-preview">{user.latest_message || "No messages yet"}</span>
                                    </div>

                                    {/* Unread badge */}
                                    {hasUnread && (
                                        <span className="msg-badge" aria-label={`${user.unread_count} unread messages`}>
                                            {user.unread_count > 99 ? "99+" : user.unread_count}
                                        </span>
                                    )}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};

export default MessagesUserList;
