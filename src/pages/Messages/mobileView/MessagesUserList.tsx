import React, { useEffect, useMemo, useState } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import BlankProfileImage from "../../../static/profile_blank.png";
import { timeAgo } from "../../../utils/utils";

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
  loading?: boolean;
};

// ─── Avatar helpers ────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  { bg: "#E6F1FB", color: "#185FA5" },
  { bg: "#EEEDFE", color: "#534AB7" },
  { bg: "#E1F5EE", color: "#0F6E56" },
  { bg: "#FAEEDA", color: "#854F0B" },
  { bg: "#FAECE7", color: "#993C1D" },
  { bg: "#FBEAF0", color: "#993556" },
  { bg: "#EAF3DE", color: "#3B6D11" },
  { bg: "#FCEBEB", color: "#A32D2D" },
];

const getAvatarColor = (username: string) => {
  const index =
    username.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) %
    AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
};

const getInitials = (username: string) =>
  username
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

// ─── Styles ────────────────────────────────────────────────────────────────────

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');

  .msg-list-root {
    font-family: 'DM Sans', sans-serif;
    background: var(--msg-bg);
    color: var(--msg-text-primary);
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
    box-sizing: border-box;
  }

  .msg-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 18px 14px;
    border-bottom: 0.5px solid var(--msg-border);
    flex-shrink: 0; position: relative; z-index: 1;
  }
  .msg-header-title {
    font-size: 15px; font-weight: 600; letter-spacing: -0.2px;
    color: var(--msg-text-primary); margin: 0;
  }
  .msg-header-count {
    font-size: 10.5px; font-weight: 600; color: var(--msg-accent);
    background: var(--msg-accent-glow); border: 1px solid var(--msg-accent-border);
    border-radius: 20px; padding: 2px 8px; letter-spacing: 0.2px;
  }

  /* ── Search ── */
  .msg-search-wrap {
    padding: 10px 12px 8px; flex-shrink: 0; position: relative; z-index: 1;
    border-bottom: 0.5px solid var(--msg-border);
  }
  .msg-search-inner { position: relative; }
  .msg-search {
    width: 100%; background: var(--msg-surface-hover);
    border: 1px solid transparent;
    border-radius: 10px; padding: 7px 12px 7px 32px;
    color: var(--msg-text-primary); font-family: 'DM Sans', sans-serif;
    font-size: 13px; outline: none; box-sizing: border-box;
    transition: border-color 0.15s, background 0.15s;
  }
  .msg-search::placeholder { color: var(--msg-text-muted); }
  .msg-search:focus {
    border-color: var(--msg-accent-border);
    background: var(--msg-surface);
  }
  .msg-search-icon {
    position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
    color: var(--msg-text-muted); pointer-events: none; width: 14px; height: 14px;
  }

  /* ── Section label ── */
  .msg-section-label {
    font-size: 10.5px; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.06em; color: var(--msg-text-muted);
    padding: 10px 20px 4px; flex-shrink: 0;
  }

  /* ── Skeleton ── */
  .msg-skeleton-wrap { padding: 8px 10px; display: flex; flex-direction: column; gap: 2px; }
  .msg-skeleton-item { display: flex; align-items: center; gap: 12px; padding: 10px 10px; border-radius: 12px; }
  .msg-skeleton-avatar { width: 42px; height: 42px; border-radius: 50%; background: var(--msg-surface-hover); flex-shrink: 0; animation: skeletonPulse 1.6s ease-in-out infinite; }
  .msg-skeleton-lines { flex: 1; display: flex; flex-direction: column; gap: 7px; }
  .msg-skeleton-line { height: 10px; border-radius: 6px; background: var(--msg-surface-hover); animation: skeletonPulse 1.6s ease-in-out infinite; }
  .msg-skeleton-line.short { width: 50%; }
  .msg-skeleton-line.long  { width: 78%; }
  .msg-skeleton-line.time  { width: 26px; height: 9px; flex-shrink: 0; border-radius: 4px; background: var(--msg-surface-hover); animation: skeletonPulse 1.6s ease-in-out infinite; }
  .msg-skeleton-top { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
  @keyframes skeletonPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }

  /* ── List ── */
  .msg-list {
    flex: 1; overflow-y: auto; padding: 4px 8px;
    position: relative; z-index: 1;
  }
  .msg-list::-webkit-scrollbar { width: 3px; }
  .msg-list::-webkit-scrollbar-track { background: transparent; }
  .msg-list::-webkit-scrollbar-thumb { background: var(--msg-accent-glow); border-radius: 99px; }

  /* ── Item ── */
  .msg-item {
    display: flex; align-items: center; gap: 11px;
    padding: 9px 10px; border-radius: 12px; cursor: pointer;
    border: none; border-bottom: 0.5px solid var(--msg-border);
    width: 100%; text-align: left; background: transparent;
    color: var(--msg-text-primary); position: relative;
    transition: background 0.12s ease; box-sizing: border-box; outline: none;
    animation: fadeSlide 0.2s ease both;
  }
  .msg-list li:last-child .msg-item { border-bottom: none; }
  .msg-item:hover { background: var(--msg-surface-hover); }
  .msg-item:focus-visible { box-shadow: 0 0 0 2px var(--msg-accent); }
  .msg-item.active {
    background: var(--msg-surface-active);
    box-shadow: inset 3px 0 0 var(--msg-accent);
  }
  .msg-item.has-unread .msg-name { font-weight: 600; color: var(--msg-text-primary); }
  .msg-item.has-unread .msg-preview { color: var(--msg-text-secondary); font-weight: 500; }
  .msg-item.has-unread .msg-time { color: var(--msg-accent); font-weight: 600; }

  /* ── Avatar ── */
  .msg-avatar-wrap { position: relative; flex-shrink: 0; }
  .msg-avatar {
    width: 42px; height: 42px; border-radius: 50%; object-fit: cover;
    display: block; background: var(--msg-surface-hover);
  }
  .msg-avatar-initials {
    width: 42px; height: 42px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 600; flex-shrink: 0;
    font-family: 'DM Sans', sans-serif;
  }
  .msg-online-dot {
    position: absolute; bottom: 1px; right: 1px;
    width: 10px; height: 10px; border-radius: 50%;
    background: var(--msg-online); border: 2px solid var(--msg-bg);
  }

  /* ── Content ── */
  .msg-content { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
  .msg-top-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .msg-name { font-size: 13.5px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--msg-text-primary); letter-spacing: -0.1px; }
  .msg-time { font-size: 10.5px; color: var(--msg-text-muted); white-space: nowrap; flex-shrink: 0; }
  .msg-preview { font-size: 12px; color: var(--msg-text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.4; }

  /* ── Badge ── */
  .msg-badge {
    flex-shrink: 0; min-width: 17px; height: 17px; border-radius: 99px;
    background: var(--msg-accent); color: #fff; font-size: 10px;
    font-weight: 600; display: flex; align-items: center; justify-content: center;
    padding: 0 4px; letter-spacing: 0.1px;
  }

  /* ── Empty ── */
  .msg-empty {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; padding: 60px 20px; gap: 10px;
    color: var(--msg-text-muted);
  }
  .msg-empty-icon { width: 38px; height: 38px; opacity: 0.35; }
  .msg-empty-text { font-size: 13px; text-align: center; line-height: 1.5; }

  @keyframes fadeSlide { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
`;

// ─── CSS vars hook ─────────────────────────────────────────────────────────────

function useMessagesListCssVars() {
  const theme = useTheme();
  useEffect(() => {
    const p = theme.palette;
    const vars: Record<string, string> = {
      "--msg-bg": p.background.default,
      "--msg-surface": p.background.paper,
      "--msg-surface-hover": p.action.hover,
      "--msg-surface-active": p.action.selected,
      "--msg-surface-focus": p.action.selected,
      "--msg-border": p.divider,
      "--msg-text-primary": p.text.primary,
      "--msg-text-secondary": p.text.secondary,
      "--msg-text-muted": p.text.disabled,
      "--msg-online": p.success.main,
      "--msg-accent": "#378ADD",
      "--msg-accent-glow": "rgba(55,138,221,0.12)",
      "--msg-accent-border": "rgba(55,138,221,0.3)",
    };
    Object.entries(vars).forEach(([k, v]) =>
      document.documentElement.style.setProperty(k, v),
    );
  }, [theme]);
}

// ─── Skeleton row ──────────────────────────────────────────────────────────────

const SkeletonRow = ({ delay }: { delay: number }) => (
  <div className="msg-skeleton-item" style={{ animationDelay: `${delay}s` }}>
    <div className="msg-skeleton-avatar" />
    <div className="msg-skeleton-lines">
      <div className="msg-skeleton-top">
        <div className="msg-skeleton-line short" />
        <div className="msg-skeleton-line time" />
      </div>
      <div className="msg-skeleton-line long" />
    </div>
  </div>
);

// ─── Component ─────────────────────────────────────────────────────────────────

const MessagesUserList: React.FC<MessagesUserListProps> = ({
  users,
  onlineUsers,
  handleUserClick,
  activeUserId,
  loading = false,
}) => {
  useMessagesListCssVars();
  const [search, setSearch] = useState("");

  useEffect(() => {
    const id = "msg-user-list-styles";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id;
      el.textContent = CSS;
      document.head.appendChild(el);
    }
  }, []);

  const sorted = useMemo(
    () =>
      [...users].sort(
        (a, b) =>
          new Date(b.latest_message_timestamp).getTime() -
          new Date(a.latest_message_timestamp).getTime(),
      ),
    [users],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q
      ? sorted.filter((u) => u.username.toLowerCase().includes(q))
      : sorted;
  }, [sorted, search]);

  const totalUnread = useMemo(
    () => users.reduce((n, u) => n + (u.unread_count || 0), 0),
    [users],
  );

  return (
    <div className="msg-list-root">
      {/* Header */}
      <div className="msg-header">
        <h1 className="msg-header-title">Messages</h1>
        {!loading && totalUnread > 0 && (
          <span className="msg-header-count">{totalUnread} new</span>
        )}
      </div>

      {/* Search */}
      <div className="msg-search-wrap">
        <div className="msg-search-inner">
          <svg
            className="msg-search-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="msg-search"
            type="text"
            placeholder="Search messages…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div className="msg-skeleton-wrap">
          {[...Array(7)].map((_, i) => (
            <SkeletonRow key={i} delay={i * 0.06} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="msg-empty">
          <svg
            className="msg-empty-icon"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8 12a2 2 0 012-2h20a2 2 0 012 2v14a2 2 0 01-2 2H12l-6 4V12z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </svg>
          <p className="msg-empty-text">
            {search ? "No results found" : "No conversations yet."}
          </p>
        </div>
      ) : (
        <>
          <div>
            <Typography
              sx={{
                fontSize: "0.68rem",
                fontWeight: 600,
                color: (t) => t.palette.text.disabled,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                px: 1.75,
                pt: 1.25,
                pb: 0.5,
                flexShrink: 0,
              }}
            >
              Recent
            </Typography>
          </div>
          <ul
            className="msg-list"
            role="list"
            style={{ margin: 0, padding: "4px 8px", listStyle: "none" }}
          >
            {filtered.map((user, i) => {
              const isOnline = onlineUsers.includes(user.id.toString());
              const isActive = activeUserId === user.id;
              const hasUnread = (user.unread_count || 0) > 0;
              const avatarColor = getAvatarColor(user.username);
              const initials = getInitials(user.username);
              const classes = [
                "msg-item",
                isActive ? "active" : "",
                hasUnread ? "has-unread" : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <li key={user.id} style={{ animationDelay: `${i * 0.04}s` }}>
                  <button
                    className={classes}
                    onClick={() => handleUserClick(user.id)}
                    aria-label={`Open conversation with ${user.username}${hasUnread ? `, ${user.unread_count} unread` : ""}`}
                  >
                    <div className="msg-avatar-wrap">
                      {user.profile_picture ? (
                        <img
                          className="msg-avatar"
                          src={user.profile_picture}
                          alt={user.username}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              BlankProfileImage;
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: 42,
                            height: 42,
                            borderRadius: "50%",
                            backgroundColor: avatarColor.bg,
                            color: avatarColor.color,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            flexShrink: 0,
                          }}
                        >
                          {initials}
                        </Box>
                      )}
                      {isOnline && (
                        <span className="msg-online-dot" aria-label="Online" />
                      )}
                    </div>

                    <div className="msg-content">
                      <div className="msg-top-row">
                        <span className="msg-name">{user.username}</span>
                        <span className="msg-time">
                          {timeAgo(user.latest_message_timestamp)}
                        </span>
                      </div>
                      <span className="msg-preview">
                        {user.latest_message || "No messages yet"}
                      </span>
                    </div>

                    {hasUnread && (
                      <span
                        className="msg-badge"
                        aria-label={`${user.unread_count} unread messages`}
                      >
                        {user.unread_count > 99 ? "99+" : user.unread_count}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
};

export default MessagesUserList;
