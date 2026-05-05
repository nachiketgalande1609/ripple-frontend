import { useState, useEffect, useRef, useCallback } from "react";
import { Box, Typography, IconButton, InputBase, CircularProgress, Skeleton, Badge } from "@mui/material";
import { ChatBubbleOutlineRounded, Close as CloseIcon, ArrowBack as ArrowBackIcon, Send as SendIcon } from "@mui/icons-material";
import socket from "../../services/socket";
import { getAllMessageUsersData, getMessagesDataForSelectedUser } from "../../services/api";
import BlankProfileImage from "../../static/profile_blank.png";
import { timeAgo } from "../../utils/utils";

const ACCENT = "#7c5cfc";
const MSG_PAGE = 30;

type User = {
    id: number;
    username: string;
    profile_picture: string;
    isOnline: boolean;
    latest_message: string;
    latest_message_timestamp: string;
    unread_count: number;
};

type Message = {
    message_id: number;
    sender_id: number;
    receiver_id: number;
    message_text: string;
    timestamp: string;
    file_url: string | null;
    saved?: boolean;
};

interface MessagesPipProps {
    unreadMessagesCount: number | null;
}

export default function MessagesPip({ unreadMessagesCount }: MessagesPipProps) {
    const [open, setOpen] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [loadingOlder, setLoadingOlder] = useState(false);
    const [inputText, setInputText] = useState("");

    const msgListRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const msgOffsetRef = useRef(0);
    const hasMoreRef = useRef(true);
    const fetchingOlderRef = useRef(false);
    const selectedUserRef = useRef<User | null>(null);

    const currentUser = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") || "{}") : null;

    // Keep ref in sync so socket handler can read latest selected user
    useEffect(() => {
        selectedUserRef.current = selectedUser;
    }, [selectedUser]);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    }, []);

    // ── Fetch user list ──────────────────────────────────────────────
    useEffect(() => {
        if (!open) return;
        (async () => {
            setLoadingUsers(true);
            try {
                const res = await getAllMessageUsersData();
                setUsers(res.data || []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingUsers(false);
            }
        })();
    }, [open]);

    // ── Fetch messages (initial or older) ───────────────────────────
    const fetchMessages = useCallback(
        async (userId: number, offset: number, _prepend: boolean) => {
            if (offset === 0) {
                setLoadingMessages(true);
            } else {
                if (fetchingOlderRef.current) return;
                fetchingOlderRef.current = true;
                setLoadingOlder(true);
            }

            try {
                const res = await getMessagesDataForSelectedUser(userId, offset, MSG_PAGE);
                const batch: Message[] = (res.data || []).slice().reverse();
                hasMoreRef.current = res.data?.length === MSG_PAGE;

                if (offset === 0) {
                    setMessages(batch);
                    // Scroll to bottom after initial load
                    requestAnimationFrame(() => scrollToBottom());
                } else {
                    // Preserve scroll position when prepending older messages
                    const container = msgListRef.current;
                    const prevScrollHeight = container?.scrollHeight ?? 0;
                    setMessages((prev) => [...batch, ...prev]);
                    requestAnimationFrame(() => {
                        if (container) {
                            container.scrollTop += container.scrollHeight - prevScrollHeight;
                        }
                    });
                }

                msgOffsetRef.current = offset + batch.length;
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingMessages(false);
                setLoadingOlder(false);
                fetchingOlderRef.current = false;
            }
        },
        [scrollToBottom],
    );

    // ── Scroll handler: load older on approach top ───────────────────
    const handleMsgScroll = useCallback(() => {
        const container = msgListRef.current;
        if (!container || !selectedUserRef.current) return;
        if (fetchingOlderRef.current || !hasMoreRef.current) return;
        if (container.scrollTop < 80) {
            fetchMessages(selectedUserRef.current.id, msgOffsetRef.current, true);
        }
    }, [fetchMessages]);

    // ── Real-time receive ────────────────────────────────────────────
    useEffect(() => {
        if (!open || !currentUser) return;

        const onReceive = (data: any) => {
            if (data.senderId === currentUser.id) return;
            const active = selectedUserRef.current;
            if (active && data.senderId === active.id) {
                setMessages((prev) => {
                    if (prev.some((m) => m.message_id === data.messageId)) return prev;
                    return [
                        ...prev,
                        {
                            message_id: data.messageId,
                            sender_id: data.senderId,
                            receiver_id: currentUser.id,
                            message_text: data.message_text,
                            timestamp: new Date().toISOString(),
                            file_url: data.fileUrl || null,
                            saved: true,
                        },
                    ];
                });
                requestAnimationFrame(() => scrollToBottom());
            } else {
                setUsers((prev) => prev.map((u) => (u.id === data.senderId ? { ...u, unread_count: (u.unread_count || 0) + 1 } : u)));
            }
        };

        const onSaved = (data: any) => {
            setMessages((prev) => prev.map((m) => (m.message_id === data.tempId ? { ...m, message_id: data.messageId, saved: true } : m)));
        };

        socket.on("receiveMessage", onReceive);
        socket.on("messageSaved", onSaved);
        return () => {
            socket.off("receiveMessage", onReceive);
            socket.off("messageSaved", onSaved);
        };
    }, [open, currentUser, scrollToBottom]);

    // ── User actions ─────────────────────────────────────────────────
    const handleUserClick = (user: User) => {
        setSelectedUser(user);
        setMessages([]);
        msgOffsetRef.current = 0;
        hasMoreRef.current = true;
        setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, unread_count: 0 } : u)));
        fetchMessages(user.id, 0, false);
    };

    const handleBack = () => {
        setSelectedUser(null);
        setMessages([]);
        msgOffsetRef.current = 0;
        hasMoreRef.current = true;
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedUser(null);
        setMessages([]);
        msgOffsetRef.current = 0;
        hasMoreRef.current = true;
    };

    const handleSend = () => {
        if (!inputText.trim() || !selectedUser || !currentUser) return;
        const tempId = Date.now();
        setMessages((prev) => [
            ...prev,
            {
                message_id: tempId,
                sender_id: currentUser.id,
                receiver_id: selectedUser.id,
                message_text: inputText,
                timestamp: new Date().toISOString(),
                file_url: null,
                saved: false,
            },
        ]);
        socket.emit("sendMessage", {
            tempId,
            senderId: currentUser.id,
            receiverId: selectedUser.id,
            text: inputText,
            fileUrl: null,
            fileName: null,
            fileSize: null,
            mediaWidth: null,
            mediaHeight: null,
            replyTo: null,
        });
        setInputText("");
        requestAnimationFrame(() => scrollToBottom());
    };

    const totalUnread = users.reduce((sum, u) => sum + (u.unread_count || 0), 0) || unreadMessagesCount || 0;
    const sortedUsers = [...users].sort((a, b) => new Date(b.latest_message_timestamp).getTime() - new Date(a.latest_message_timestamp).getTime());

    // Stop wheel events from escaping the PIP and scrolling the page behind it
    const stopWheel = (e: React.WheelEvent) => e.stopPropagation();

    if (!currentUser) return null;

    return (
        <>
            {/* ── Floating pill ── */}
            {!open && (
                <Box
                    onClick={() => setOpen(true)}
                    onWheel={stopWheel}
                    sx={{
                        position: "fixed",
                        bottom: 24,
                        right: 24,
                        zIndex: 1300,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        px: 2,
                        py: 1,
                        borderRadius: "999px",
                        backgroundColor: ACCENT,
                        color: "#fff",
                        cursor: "pointer",
                        boxShadow: "0 4px 20px rgba(124,92,252,0.35)",
                        userSelect: "none",
                        transition: "transform 0.15s ease, box-shadow 0.15s ease",
                        "&:hover": { transform: "scale(1.04)", boxShadow: "0 6px 28px rgba(124,92,252,0.45)" },
                        "&:active": { transform: "scale(0.97)" },
                    }}
                >
                    <Badge badgeContent={totalUnread} color="error" sx={{ "& .MuiBadge-badge": { fontSize: "0.58rem", minWidth: 14, height: 14 } }}>
                        <ChatBubbleOutlineRounded sx={{ fontSize: "1.05rem" }} />
                    </Badge>
                    <Typography sx={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "0.875rem" }}>Messages</Typography>
                </Box>
            )}

            {/* ── PIP window ── */}
            {open && (
                <Box
                    onWheel={stopWheel}
                    sx={{
                        position: "fixed",
                        bottom: 24,
                        right: 24,
                        zIndex: 1300,
                        width: 360,
                        height: 500,
                        display: "flex",
                        flexDirection: "column",
                        borderRadius: "16px",
                        backgroundColor: (t) => t.palette.background.paper,
                        border: "1px solid",
                        borderColor: (t) => t.palette.divider,
                        boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
                        overflow: "hidden",
                        animation: "pipIn 0.2s ease both",
                        "@keyframes pipIn": {
                            from: { opacity: 0, transform: "scale(0.92) translateY(12px)" },
                            to: { opacity: 1, transform: "scale(1) translateY(0)" },
                        },
                    }}
                >
                    {/* Header */}
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            px: 1.75,
                            py: 1.25,
                            borderBottom: "1px solid",
                            borderColor: (t) => t.palette.divider,
                            flexShrink: 0,
                        }}
                    >
                        {selectedUser && (
                            <IconButton size="small" onClick={handleBack} sx={{ p: 0.5 }}>
                                <ArrowBackIcon sx={{ fontSize: "1rem" }} />
                            </IconButton>
                        )}

                        {selectedUser ? (
                            <>
                                <img
                                    src={selectedUser.profile_picture || BlankProfileImage}
                                    alt={selectedUser.username}
                                    style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", display: "block" }}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = BlankProfileImage;
                                    }}
                                />
                                <Typography sx={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "0.875rem", flex: 1 }}>
                                    {selectedUser.username}
                                </Typography>
                            </>
                        ) : (
                            <>
                                <ChatBubbleOutlineRounded sx={{ fontSize: "1rem", color: ACCENT }} />
                                <Typography sx={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "0.875rem", flex: 1 }}>
                                    Messages
                                </Typography>
                            </>
                        )}

                        <IconButton size="small" onClick={handleClose} sx={{ p: 0.5 }}>
                            <CloseIcon sx={{ fontSize: "1rem" }} />
                        </IconButton>
                    </Box>

                    {/* Body */}
                    {selectedUser ? (
                        <>
                            {/* Message list */}
                            <Box
                                ref={msgListRef}
                                onScroll={handleMsgScroll}
                                sx={{
                                    flex: 1,
                                    overflowY: "auto",
                                    px: 1.75,
                                    py: 1.25,
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 0.5,
                                    "&::-webkit-scrollbar": { width: 4 },
                                    "&::-webkit-scrollbar-thumb": { borderRadius: 4, backgroundColor: (t) => t.palette.divider },
                                }}
                            >
                                {/* Older messages spinner at top */}
                                {loadingOlder && (
                                    <Box sx={{ display: "flex", justifyContent: "center", py: 1 }}>
                                        <CircularProgress size={16} sx={{ color: ACCENT }} />
                                    </Box>
                                )}

                                {loadingMessages ? (
                                    <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
                                        <CircularProgress size={22} sx={{ color: ACCENT }} />
                                    </Box>
                                ) : messages.length === 0 ? (
                                    <Typography
                                        sx={{
                                            textAlign: "center",
                                            color: (t) => t.palette.text.disabled,
                                            fontSize: "0.8rem",
                                            mt: 6,
                                            fontFamily: "'Inter', sans-serif",
                                        }}
                                    >
                                        No messages yet
                                    </Typography>
                                ) : (
                                    messages.map((msg) => {
                                        const isMine = msg.sender_id === currentUser.id;
                                        return (
                                            <Box key={msg.message_id} sx={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start" }}>
                                                <Box
                                                    sx={{
                                                        maxWidth: "78%",
                                                        px: 1.5,
                                                        py: 0.75,
                                                        borderRadius: isMine ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                                                        backgroundColor: isMine ? ACCENT : (t) => t.palette.action.selected,
                                                        color: isMine ? "#fff" : (t) => t.palette.text.primary,
                                                    }}
                                                >
                                                    {msg.file_url && (
                                                        <Box
                                                            component="img"
                                                            src={msg.file_url}
                                                            sx={{
                                                                maxWidth: "100%",
                                                                borderRadius: "8px",
                                                                display: "block",
                                                                mb: msg.message_text ? 0.5 : 0,
                                                            }}
                                                        />
                                                    )}
                                                    {msg.message_text && (
                                                        <Typography
                                                            sx={{
                                                                fontSize: "0.82rem",
                                                                lineHeight: 1.45,
                                                                wordBreak: "break-word",
                                                                fontFamily: "'Inter', sans-serif",
                                                            }}
                                                        >
                                                            {msg.message_text}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Box>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </Box>

                            {/* Input */}
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.75,
                                    px: 1.25,
                                    py: 1,
                                    borderTop: "1px solid",
                                    borderColor: (t) => t.palette.divider,
                                    flexShrink: 0,
                                }}
                            >
                                <InputBase
                                    placeholder="Message…"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                    multiline
                                    maxRows={3}
                                    sx={{
                                        flex: 1,
                                        fontSize: "0.825rem",
                                        px: 1.5,
                                        py: 0.6,
                                        borderRadius: "10px",
                                        backgroundColor: (t) => t.palette.action.hover,
                                        color: (t) => t.palette.text.primary,
                                        fontFamily: "'Inter', sans-serif",
                                        "& textarea::placeholder": { color: (t) => t.palette.text.disabled, opacity: 1 },
                                    }}
                                />
                                <IconButton
                                    size="small"
                                    onClick={handleSend}
                                    disabled={!inputText.trim()}
                                    sx={{
                                        width: 34,
                                        height: 34,
                                        flexShrink: 0,
                                        backgroundColor: inputText.trim() ? ACCENT : "transparent",
                                        color: inputText.trim() ? "#fff" : (t) => t.palette.text.disabled,
                                        transition: "background 0.15s",
                                        "&:hover": { backgroundColor: inputText.trim() ? "#6b4de0" : "transparent" },
                                        "&.Mui-disabled": { color: (t) => t.palette.text.disabled },
                                    }}
                                >
                                    <SendIcon sx={{ fontSize: "0.9rem" }} />
                                </IconButton>
                            </Box>
                        </>
                    ) : (
                        /* User list */
                        <Box
                            sx={{
                                flex: 1,
                                overflowY: "auto",
                                "&::-webkit-scrollbar": { width: 4 },
                                "&::-webkit-scrollbar-thumb": { borderRadius: 4, backgroundColor: (t) => t.palette.divider },
                            }}
                        >
                            {loadingUsers ? (
                                [...Array(5)].map((_, i) => (
                                    <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.25 }}>
                                        <Skeleton variant="circular" width={38} height={38} sx={{ flexShrink: 0 }} />
                                        <Box sx={{ flex: 1 }}>
                                            <Skeleton width="42%" height={12} />
                                            <Skeleton width="65%" height={10} sx={{ mt: 0.5 }} />
                                        </Box>
                                    </Box>
                                ))
                            ) : sortedUsers.length === 0 ? (
                                <Typography
                                    sx={{
                                        textAlign: "center",
                                        color: (t) => t.palette.text.disabled,
                                        fontSize: "0.8rem",
                                        mt: 6,
                                        fontFamily: "'Inter', sans-serif",
                                    }}
                                >
                                    No conversations yet
                                </Typography>
                            ) : (
                                sortedUsers.map((user) => (
                                    <Box
                                        key={user.id}
                                        onClick={() => handleUserClick(user)}
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1.5,
                                            px: 2,
                                            py: 1.25,
                                            cursor: "pointer",
                                            borderBottom: "0.5px solid",
                                            borderColor: (t) => t.palette.divider,
                                            transition: "background 0.1s",
                                            "&:hover": { backgroundColor: (t) => t.palette.action.hover },
                                            "&:last-of-type": { borderBottom: "none" },
                                        }}
                                    >
                                        <Box sx={{ position: "relative", flexShrink: 0 }}>
                                            <img
                                                src={user.profile_picture || BlankProfileImage}
                                                alt={user.username}
                                                style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", display: "block" }}
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = BlankProfileImage;
                                                }}
                                            />
                                            {user.isOnline && (
                                                <Box
                                                    sx={{
                                                        position: "absolute",
                                                        bottom: 0,
                                                        right: 0,
                                                        width: 9,
                                                        height: 9,
                                                        borderRadius: "50%",
                                                        backgroundColor: (t) => t.palette.success.main,
                                                        border: "2px solid",
                                                        borderColor: (t) => t.palette.background.paper,
                                                    }}
                                                />
                                            )}
                                        </Box>

                                        <Box sx={{ flex: 1, overflow: "hidden" }}>
                                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", mb: 0.25 }}>
                                                <Typography
                                                    sx={{
                                                        fontSize: "0.845rem",
                                                        fontWeight: user.unread_count > 0 ? 600 : 500,
                                                        color: (t) => t.palette.text.primary,
                                                        fontFamily: "'Inter', sans-serif",
                                                    }}
                                                >
                                                    {user.username}
                                                </Typography>
                                                <Typography
                                                    sx={{
                                                        fontSize: "0.68rem",
                                                        color: (t) => (user.unread_count > 0 ? t.palette.primary.main : t.palette.text.disabled),
                                                        flexShrink: 0,
                                                        fontWeight: user.unread_count > 0 ? 600 : 400,
                                                        fontFamily: "'Inter', sans-serif",
                                                    }}
                                                >
                                                    {timeAgo(user.latest_message_timestamp)}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <Typography
                                                    noWrap
                                                    sx={{
                                                        fontSize: "0.76rem",
                                                        color: (t) => (user.unread_count > 0 ? t.palette.text.secondary : t.palette.text.disabled),
                                                        fontWeight: user.unread_count > 0 ? 500 : 400,
                                                        flex: 1,
                                                        fontFamily: "'Inter', sans-serif",
                                                    }}
                                                >
                                                    {user.latest_message}
                                                </Typography>
                                                {user.unread_count > 0 && (
                                                    <Box
                                                        sx={{
                                                            ml: 1,
                                                            flexShrink: 0,
                                                            minWidth: 17,
                                                            height: 17,
                                                            borderRadius: "9px",
                                                            backgroundColor: (t) => t.palette.primary.main,
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            px: 0.5,
                                                        }}
                                                    >
                                                        <Typography sx={{ fontSize: "0.62rem", fontWeight: 600, color: "#fff", lineHeight: 1 }}>
                                                            {user.unread_count > 99 ? "99+" : user.unread_count}
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </Box>
                                        </Box>
                                    </Box>
                                ))
                            )}
                        </Box>
                    )}
                </Box>
            )}
        </>
    );
}
