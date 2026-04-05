import React, { useEffect, useState, useRef, useCallback } from "react";
import {
    Typography,
    Box,
    CircularProgress,
    useMediaQuery,
    useTheme,
    IconButton,
    Button,
    Popover,
    List,
    ListItem,
    ListItemAvatar,
    Avatar,
    Skeleton,
} from "@mui/material";
import {
    Done as DoneIcon,
    DoneAll as DoneAllIcon,
    AccessTime as AccessTimeIcon,
    Article as PdfIcon,
    InsertDriveFile as FolderIcon,
    Reply as ReplyIcon,
    MoreHoriz,
    EmojiEmotions,
    KeyboardArrowDown,
    Clear as DeleteIcon,
    ChatBubbleOutline as ChatIcon,
} from "@mui/icons-material";
import EmojiPicker, { Theme } from "emoji-picker-react";
import BlurBackgroundImage from "../../../static/blur.jpg";

import TypingIndicator from "../../../component/TypingIndicator";
import { getMessagesDataForSelectedUser } from "../../../services/api";
import MessageDetailsDrawer from "./MessageDetailsDrawer";
import MessageOptionsDialog from "./MessageOptionsDialog";
import BlankProfileImage from "../../../static/profile_blank.png";

interface MessagesContainerProps {
    selectedUser: User | null;
    messages: Message[];
    currentUser: User;
    handleImageClick: (fileUrl: string) => void;
    messagesEndRef: React.RefObject<HTMLDivElement>;
    handleReply: (msg: Message) => void;
    setAnchorEl: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
    handleDeleteMessage: (message: Message | null) => void;
    handleReaction: (messageId: number, reaction: string) => void;
    typingUser: number | null;
    initialMessageLoading: boolean;
}

type Message = {
    message_id: number;
    receiver_id: number;
    sender_id: number;
    message_text: string;
    timestamp: string;
    delivered?: boolean;
    read?: boolean;
    saved?: boolean;
    file_url: string;
    delivered_timestamp?: string | null;
    read_timestamp?: string | null;
    file_name: string | null;
    file_size: string | null;
    reply_to: number | null;
    media_height: number | null;
    media_width: number | null;
    reactions: ReactionDetail[];
    post?: {
        post_id: number;
        file_url: string;
        media_width: number;
        media_height: number;
        content: string;
        owner: {
            user_id: number;
            username: string;
            profile_picture: string;
        };
    } | null;
};

type User = {
    id: number;
    username: string;
    profile_picture: string;
    isOnline: boolean;
    latest_message: string;
    latest_message_timestamp: string;
    unread_count: number;
};

interface ReactionDetail {
    user_id: string;
    reaction: string;
    username: string;
    profile_picture: string;
}

const formatFileSize = (size: string | null) => {
    if (!size) return "N/A";
    const bytes = Number(size);
    return bytes < 1024 * 1024
        ? (bytes / 1024).toFixed(1) + " KB"
        : (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

const MessagesContainer: React.FC<MessagesContainerProps> = ({
    selectedUser,
    messages,
    currentUser,
    handleImageClick,
    messagesEndRef,
    handleReply,
    setAnchorEl,
    handleDeleteMessage,
    handleReaction,
    typingUser,
    initialMessageLoading,
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [hoveredMessage, setHoveredMessage] = useState<number | null>(null);
    const [highlightedMessageId, setHighlightedMessageId] = useState<number | null>(null);

    const [moreMenuOpen, setMoreMenuOpen] = useState(false);
    const [selectedMessageForAction, setSelectedMessageForAction] = useState<Message | null>(null);

    const [emojiAnchorEl, setEmojiAnchorEl] = useState<null | HTMLElement>(null);
    const emojiPickerOpen = Boolean(emojiAnchorEl);
    const [selectedMessageForReaction, setSelectedMessageForReaction] = useState<Message | null>(null);

    const [reactionAnchor, setReactionAnchor] = useState<HTMLElement | null>(null);
    const [selectedReactions, setSelectedReactions] = useState<ReactionDetail[] | null>(null);

    const [isScrolledUp, setIsScrolledUp] = useState(false);
    const [allMessages, setAllMessages] = useState<Message[]>(messages);
    const [isLoading, setIsLoading] = useState(false);

    // All pagination state in refs — scroll handler always reads fresh values, no stale closures
    const offsetRef = useRef(0);
    const isLoadingRef = useRef(false);
    const hasMoreRef = useRef(true);
    // Track which user's messages are currently loaded
    const loadedForUserRef = useRef<number | null>(null);

    // ── Reset + seed when the selected user changes ──────────────────────
    useEffect(() => {
        if (!selectedUser) return;

        offsetRef.current = 0;
        isLoadingRef.current = false;
        hasMoreRef.current = true;
        loadedForUserRef.current = selectedUser.id;

        setIsLoading(false);
        setAllMessages(messages);
    }, [selectedUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Merge incoming real-time messages without wiping paginated history ─
    useEffect(() => {
        if (!selectedUser) return;
        // Skip — the user-change effect above already seeded allMessages
        if (loadedForUserRef.current !== selectedUser.id) return;

        setAllMessages((prev) => {
            if (prev.length === 0) return messages;
            const prevIds = new Set(prev.map((m) => m.message_id));
            const fresh = messages.filter((m) => !prevIds.has(m.message_id));
            return fresh.length > 0 ? [...prev, ...fresh] : prev;
        });
    }, [messages]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Load a page of older messages ────────────────────────────────────
    const loadMoreMessages = useCallback(async (userId: number) => {
        // Double-guard: both the ref (sync, no stale closure) and state
        if (isLoadingRef.current || !hasMoreRef.current) return;

        isLoadingRef.current = true;
        setIsLoading(true);

        const nextOffset = offsetRef.current + 20;

        try {
            const res = await getMessagesDataForSelectedUser(userId, nextOffset, 20);
            const fetched: Message[] = res.data ?? [];

            if (fetched.length === 0) {
                hasMoreRef.current = false;
            } else {
                setAllMessages((prev) => {
                    const prevIds = new Set(prev.map((m) => m.message_id));
                    const unique = fetched.filter((m: Message) => !prevIds.has(m.message_id));
                    if (unique.length === 0) return prev;
                    // API returns newest-first; reverse to oldest-first before prepending
                    return [[...unique].reverse(), ...prev].flat();
                });
                offsetRef.current = nextOffset;

                // Fewer results than requested means we've hit the beginning
                if (fetched.length < 20) {
                    hasMoreRef.current = false;
                }
            }
        } catch (err) {
            console.error("Error loading more messages:", err);
        } finally {
            // Always unlock — critical so subsequent scrolls can trigger loads
            isLoadingRef.current = false;
            setIsLoading(false);
        }
    }, []);

    // ── Scroll handler ───────────────────────────────────────────────────
    // Layout: flexDirection="column-reverse"
    //   scrollTop = 0       → user is at the BOTTOM (newest messages)
    //   scrollTop = negative → user scrolled UP toward older messages
    //   distanceFromTop = scrollHeight - clientHeight + scrollTop
    //                   → approaches 0 as user reaches the TOP
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

        setIsScrolledUp(scrollTop < -80);

        const distanceFromTop = scrollHeight - clientHeight + scrollTop;
        if (distanceFromTop < 200 && selectedUser && !isLoadingRef.current && hasMoreRef.current) {
            loadMoreMessages(selectedUser.id);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleReactionPopoverOpen = (e: React.MouseEvent<HTMLElement>, reactions: ReactionDetail[]) => {
        setReactionAnchor(e.currentTarget);
        setSelectedReactions(reactions);
    };

    const handleReactionPopoverClose = () => {
        setReactionAnchor(null);
        setSelectedReactions(null);
    };

    const findOriginalMessage = (replyToId: number | null) =>
        allMessages.find((m) => m.message_id === replyToId);

    const handleEmojiClick = (emojiObject: { emoji: string }) => {
        if (selectedMessageForReaction) {
            handleReaction(selectedMessageForReaction.message_id, emojiObject.emoji);
            setEmojiAnchorEl(null);
        }
    };

    const isSelf = (msg: Message) => msg.sender_id === currentUser.id;

    // ─── Loading skeleton ────────────────────────────────────────────────
    if (initialMessageLoading) {
        return (
            <Box sx={{ flexGrow: 1, p: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
                {[...Array(6)].map((_, i) => (
                    <Box key={i} sx={{ display: "flex", justifyContent: i % 2 === 0 ? "flex-end" : "flex-start" }}>
                        <Skeleton
                            variant="rounded"
                            width={`${Math.floor(Math.random() * 120) + 80}px`}
                            height={36}
                            sx={{
                                bgcolor: "rgba(255,255,255,0.06)",
                                borderRadius: i % 2 === 0 ? "12px 0 12px 12px" : "0 12px 12px 12px",
                            }}
                        />
                    </Box>
                ))}
            </Box>
        );
    }

    return (
        <Box
            sx={{
                flexGrow: 1,
                px: isMobile ? 1.5 : 2,
                py: 1.5,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column-reverse",
                position: "relative",
            }}
            onScroll={handleScroll}
        >
            <div ref={messagesEndRef} />

            {selectedUser ? (
                <>
                    {typingUser === selectedUser?.id && <TypingIndicator />}

                    {/* Messages — reversed so newest renders first in DOM; column-reverse flips visually */}
                    {[...allMessages].reverse().map((msg, index) => {
                        const originalMessage = msg.reply_to ? findOriginalMessage(msg.reply_to) : null;
                        const self = isSelf(msg);

                        return (
                            <Box
                                key={msg.message_id ?? index}
                                sx={{
                                    display: "flex",
                                    mb: "8px",
                                    flexDirection: "row",
                                    justifyContent: self ? "flex-end" : "flex-start",
                                    alignItems: "flex-end",
                                }}
                                onMouseEnter={() => setHoveredMessage(msg.message_id)}
                                onMouseLeave={() => setHoveredMessage(null)}
                            >
                                <Box sx={{ maxWidth: isMobile ? "75vw" : { lg: "45vw", md: "50vw", sm: "60vw" } }}>

                                    {/* ── Media attachment ── */}
                                    {msg.file_url && (
                                        <Box
                                            sx={{
                                                display: "flex",
                                                justifyContent: "center",
                                                alignItems: "center",
                                                mt: "4px",
                                                backgroundImage: `url(${BlurBackgroundImage})`,
                                                backgroundSize: "cover",
                                                backgroundPosition: "center",
                                                overflow: "hidden",
                                                borderRadius: "12px",
                                                position: "relative",
                                                cursor: "pointer",
                                            }}
                                        >
                                            {msg.file_url.match(/\.(jpeg|jpg|png|gif|bmp|webp)$/i) ? (
                                                <>
                                                    <CircularProgress sx={{ position: "absolute", color: "#fff" }} size={24} />
                                                    <Box
                                                        component="img"
                                                        src={msg.file_url}
                                                        alt="Sent"
                                                        sx={{
                                                            width: isMobile ? "200px" : "300px",
                                                            height: msg.media_width && msg.media_height
                                                                ? `${(msg.media_height / msg.media_width) * (isMobile ? 200 : 300)}px`
                                                                : "auto",
                                                            objectFit: "contain",
                                                            borderRadius: "12px",
                                                            visibility: "hidden",
                                                        }}
                                                        onLoad={(e) => {
                                                            const img = e.target as HTMLImageElement;
                                                            const loader = img.previousSibling as HTMLElement;
                                                            img.style.visibility = "visible";
                                                            if (loader) loader.style.display = "none";
                                                        }}
                                                        onClick={() => msg.file_url && handleImageClick(msg.file_url)}
                                                    />
                                                </>
                                            ) : msg.file_url.match(/\.(mp4|webm|ogg)$/i) ? (
                                                <video
                                                    controls
                                                    style={{
                                                        width: isMobile ? "200px" : "300px",
                                                        height: msg.media_width && msg.media_height
                                                            ? `${(msg.media_height / msg.media_width) * (isMobile ? 200 : 300)}px`
                                                            : "auto",
                                                        maxWidth: "100%",
                                                        borderRadius: "12px",
                                                    }}
                                                >
                                                    <source src={msg.file_url} />
                                                </video>
                                            ) : msg.file_url.match(/\.pdf$/i) ? (
                                                <Box
                                                    sx={{
                                                        width: "260px",
                                                        backgroundColor: "#1a1d21",
                                                        borderRadius: "12px",
                                                        border: "1px solid rgba(255,255,255,0.08)",
                                                        overflow: "hidden",
                                                        cursor: "pointer",
                                                    }}
                                                    onClick={() => window.open(msg.file_url, "_blank", "noopener,noreferrer")}
                                                >
                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.5 }}>
                                                        <PdfIcon sx={{ color: "#d32f2f", fontSize: 32, flexShrink: 0 }} />
                                                        <Box sx={{ overflow: "hidden" }}>
                                                            <Typography sx={{ fontSize: "0.82rem", fontWeight: 500, color: "#e8eaed", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                                {msg.file_name}
                                                            </Typography>
                                                            <Typography sx={{ fontSize: "0.72rem", color: "#5f6368" }}>
                                                                {formatFileSize(msg.file_size)}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            ) : (
                                                <Box
                                                    sx={{
                                                        width: "260px",
                                                        backgroundColor: "#1a1d21",
                                                        borderRadius: "12px",
                                                        border: "1px solid rgba(255,255,255,0.08)",
                                                        overflow: "hidden",
                                                        cursor: "pointer",
                                                    }}
                                                    onClick={() => {
                                                        const link = document.createElement("a");
                                                        link.href = msg.file_url;
                                                        link.download = "";
                                                        link.rel = "noopener noreferrer";
                                                        document.body.appendChild(link);
                                                        link.click();
                                                        document.body.removeChild(link);
                                                    }}
                                                >
                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.5 }}>
                                                        <FolderIcon sx={{ color: "#ffd014", fontSize: 32, flexShrink: 0 }} />
                                                        <Box sx={{ overflow: "hidden" }}>
                                                            <Typography sx={{ fontSize: "0.82rem", fontWeight: 500, color: "#e8eaed", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                                {msg.file_name}
                                                            </Typography>
                                                            <Typography sx={{ fontSize: "0.72rem", color: "#5f6368" }}>
                                                                {formatFileSize(msg.file_size)}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            )}
                                        </Box>
                                    )}

                                    {/* ── Reply quote ── */}
                                    {originalMessage && (
                                        <Box
                                            sx={{
                                                px: 1.25,
                                                py: 0.75,
                                                borderLeft: "3px solid #1976D2",
                                                borderRadius: "8px",
                                                backgroundColor: "rgba(255,255,255,0.05)",
                                                mb: 0.5,
                                                cursor: "pointer",
                                                "&:hover": { backgroundColor: "rgba(255,255,255,0.08)" },
                                            }}
                                            onClick={() => {
                                                const el = document.getElementById(`msg-${originalMessage.message_id}`);
                                                if (el) {
                                                    el.scrollIntoView({ behavior: "smooth", block: "center" });
                                                    setHighlightedMessageId(originalMessage.message_id);
                                                    setTimeout(() => setHighlightedMessageId(null), 2000);
                                                }
                                            }}
                                        >
                                            <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: "#1976D2", mb: 0.25 }}>
                                                {originalMessage.sender_id === currentUser.id ? "You" : selectedUser.username}
                                            </Typography>
                                            <Typography noWrap sx={{ fontSize: "0.78rem", color: "#9aa0a6" }}>
                                                {originalMessage.message_text.length > 50
                                                    ? originalMessage.message_text.slice(0, 50) + "…"
                                                    : originalMessage.message_text}
                                            </Typography>
                                        </Box>
                                    )}

                                    {/* ── Shared post ── */}
                                    {msg.post && (
                                        <Box
                                            sx={{
                                                backgroundColor: "#1a1d21",
                                                borderRadius: "12px",
                                                border: "1px solid rgba(255,255,255,0.08)",
                                                overflow: "hidden",
                                                mb: 0.5,
                                            }}
                                        >
                                            {msg.post.owner && (
                                                <Box sx={{ display: "flex", alignItems: "center", px: 1.25, py: 1, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                                                    <Box
                                                        component="img"
                                                        src={msg.post.owner.profile_picture || BlankProfileImage}
                                                        sx={{ width: 28, height: 28, borderRadius: "50%", mr: 1 }}
                                                    />
                                                    <Typography sx={{ fontSize: "0.82rem", fontWeight: 500, color: "#e8eaed" }}>
                                                        {msg.post.owner.username}
                                                    </Typography>
                                                </Box>
                                            )}
                                            <Box sx={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center", backgroundImage: `url(${BlurBackgroundImage})`, backgroundSize: "cover" }}>
                                                <CircularProgress sx={{ position: "absolute", color: "#fff" }} size={24} />
                                                <Box
                                                    component="img"
                                                    src={msg.post.file_url}
                                                    sx={{
                                                        width: isMobile ? "200px" : "300px",
                                                        height: msg.post.media_width && msg.post.media_height
                                                            ? `${(msg.post.media_height / msg.post.media_width) * (isMobile ? 200 : 300)}px`
                                                            : "auto",
                                                        objectFit: "cover",
                                                        visibility: "hidden",
                                                    }}
                                                    onLoad={(e) => {
                                                        const img = e.target as HTMLImageElement;
                                                        const loader = img.previousSibling as HTMLElement;
                                                        img.style.visibility = "visible";
                                                        if (loader) loader.style.display = "none";
                                                    }}
                                                />
                                            </Box>
                                            {msg.post.content && (
                                                <Box sx={{ px: 1.25, py: 1 }}>
                                                    <Typography sx={{ fontSize: "0.82rem", color: "#9aa0a6" }}>
                                                        <Box component="span" sx={{ fontWeight: 500, color: "#c4c7cc", mr: 0.5 }}>
                                                            {msg.post.owner.username}
                                                        </Box>
                                                        {msg.post.content}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    )}

                                    {/* ── Message bubble ── */}
                                    {msg.message_text && (
                                        <Box
                                            id={`msg-${msg.message_id}`}
                                            sx={{
                                                display: "flex",
                                                flexDirection: "row",
                                                alignItems: "center",
                                                justifyContent: self ? "flex-end" : "flex-start",
                                                transition: "background-color 0.4s ease",
                                                backgroundColor: highlightedMessageId === msg.message_id ? "rgba(25,118,210,0.15)" : "transparent",
                                                borderRadius: "12px",
                                                position: "relative",
                                                "&::before": {
                                                    content: '""',
                                                    position: "absolute",
                                                    top: 0,
                                                    [self ? "right" : "left"]: "-7px",
                                                    width: 0,
                                                    height: 0,
                                                    borderTop: "0px solid transparent",
                                                    borderBottom: "22px solid transparent",
                                                    borderLeft: self ? "18px solid #1976d2" : "none",
                                                    borderRight: !self ? "18px solid #1f2328" : "none",
                                                },
                                            }}
                                        >
                                            <Typography
                                                sx={{
                                                    backgroundColor: self ? "#1976d2" : "#1f2328",
                                                    padding: "8px 12px",
                                                    borderRadius: self ? "12px 0 12px 12px" : "0 12px 12px 12px",
                                                    fontSize: isMobile ? "0.82rem" : "0.92rem",
                                                    wordWrap: "break-word",
                                                    whiteSpace: "normal",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    lineHeight: 1.45,
                                                }}
                                            >
                                                <span>{msg.message_text}</span>
                                                <span style={{ fontSize: "0.67rem", color: "rgba(255,255,255,0.45)", marginTop: "3px", alignSelf: self ? "flex-start" : "flex-end" }}>
                                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}
                                                </span>
                                            </Typography>

                                            {/* ── Hover actions ── */}
                                            {hoveredMessage === msg.message_id && (
                                                <Box
                                                    sx={{
                                                        position: "absolute",
                                                        top: "50%",
                                                        transform: "translateY(-50%)",
                                                        [self ? "right" : "left"]: "calc(100% + 6px)",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "2px",
                                                        backgroundColor: "rgba(26,29,33,0.95)",
                                                        borderRadius: "20px",
                                                        border: "1px solid rgba(255,255,255,0.08)",
                                                        px: 0.5,
                                                        py: 0.25,
                                                    }}
                                                >
                                                    {self && (
                                                        <IconButton
                                                            size="small"
                                                            sx={{ color: "#9aa0a6", "&:hover": { color: "#e8eaed", backgroundColor: "transparent" } }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedMessageForAction(msg);
                                                                setMoreMenuOpen(true);
                                                            }}
                                                        >
                                                            <MoreHoriz sx={{ fontSize: 18 }} />
                                                        </IconButton>
                                                    )}
                                                    <IconButton
                                                        size="small"
                                                        sx={{ color: "#9aa0a6", "&:hover": { color: "#e8eaed", backgroundColor: "transparent" } }}
                                                        onClick={() => handleReply(msg)}
                                                    >
                                                        <ReplyIcon sx={{ fontSize: 18 }} />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        sx={{ color: "#9aa0a6", "&:hover": { color: "#e8eaed", backgroundColor: "transparent" } }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedMessageForReaction(msg);
                                                            setEmojiAnchorEl(e.currentTarget);
                                                        }}
                                                    >
                                                        <EmojiEmotions sx={{ fontSize: 18 }} />
                                                    </IconButton>
                                                </Box>
                                            )}
                                        </Box>
                                    )}

                                    {/* ── Reactions row ── */}
                                    {msg.reactions?.length > 0 && (
                                        <Box
                                            sx={{
                                                display: "flex",
                                                gap: "2px",
                                                justifyContent: self ? "flex-end" : "flex-start",
                                                mt: "2px",
                                                px: 1,
                                                cursor: "pointer",
                                                position: "relative",
                                                zIndex: 2,
                                            }}
                                            onClick={(e) => {
                                                setSelectedMessageForReaction(msg);
                                                handleReactionPopoverOpen(e, msg.reactions);
                                            }}
                                        >
                                            {msg.reactions.map((r, i) => (
                                                <Typography key={i} sx={{ fontSize: isMobile ? "0.95rem" : "1.2rem", lineHeight: 1 }}>
                                                    {r.reaction}
                                                </Typography>
                                            ))}
                                        </Box>
                                    )}

                                    {/* Reaction list popover */}
                                    <Popover
                                        open={Boolean(reactionAnchor)}
                                        anchorEl={reactionAnchor}
                                        onClose={handleReactionPopoverClose}
                                        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                                        transformOrigin={{ vertical: "top", horizontal: "right" }}
                                        PaperProps={{
                                            sx: {
                                                borderRadius: "14px",
                                                backgroundColor: "#1a1d21",
                                                border: "1px solid rgba(255,255,255,0.08)",
                                                minWidth: 200,
                                            },
                                        }}
                                    >
                                        <List sx={{ maxHeight: 250, overflowY: "auto", p: 0.5 }}>
                                            {selectedReactions?.map((r) => (
                                                <ListItem
                                                    key={r.user_id}
                                                    sx={{ borderRadius: "8px", px: 1, py: 0.75, justifyContent: "space-between" }}
                                                >
                                                    <Box sx={{ display: "flex", alignItems: "center" }}>
                                                        <ListItemAvatar sx={{ minWidth: "unset", mr: 1 }}>
                                                            <Avatar src={r.profile_picture} sx={{ width: 32, height: 32 }} />
                                                        </ListItemAvatar>
                                                        <Typography sx={{ fontSize: "0.85rem", color: "#e8eaed" }}>
                                                            {r.username || "Unknown"}
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                        <Typography sx={{ fontSize: "1.2rem" }}>{r.reaction}</Typography>
                                                        {r.user_id === currentUser.id.toString() && (
                                                            <IconButton
                                                                size="small"
                                                                sx={{ color: "#5f6368", "&:hover": { color: "#e8eaed", backgroundColor: "transparent" } }}
                                                                onClick={() => {
                                                                    if (selectedMessageForReaction) {
                                                                        handleReaction(selectedMessageForReaction.message_id, "");
                                                                    }
                                                                }}
                                                            >
                                                                <DeleteIcon sx={{ fontSize: 15 }} />
                                                            </IconButton>
                                                        )}
                                                    </Box>
                                                </ListItem>
                                            ))}
                                        </List>
                                    </Popover>
                                </Box>

                                {/* ── Read/delivered status ── */}
                                <Box sx={{ pb: "2px", flexShrink: 0 }}>
                                    {self && (
                                        msg.read ? (
                                            <DoneAllIcon sx={{ color: "#1976D2", fontSize: 15, ml: 0.75 }} />
                                        ) : msg.delivered ? (
                                            <DoneAllIcon sx={{ color: "#5f6368", fontSize: 15, ml: 0.75 }} />
                                        ) : msg.saved ? (
                                            <DoneIcon sx={{ color: "#5f6368", fontSize: 15, ml: 0.75 }} />
                                        ) : (
                                            <AccessTimeIcon sx={{ color: "#5f6368", fontSize: 15, ml: 0.75 }} />
                                        )
                                    )}
                                </Box>
                            </Box>
                        );
                    })}

                    {/* Spinner while loading older messages — appears at the top in column-reverse */}
                    {isLoading && (
                        <Box sx={{ display: "flex", justifyContent: "center", py: 1.5 }}>
                            <CircularProgress size={20} sx={{ color: "#5f6368" }} />
                        </Box>
                    )}

                    {/* End-of-history label — appears at the top in column-reverse */}
                    {!isLoading && !hasMoreRef.current && allMessages.length > 0 && (
                        <Box sx={{ display: "flex", justifyContent: "center", py: 1 }}>
                            <Typography sx={{ fontSize: "0.72rem", color: "#5f6368" }}>
                                No more messages
                            </Typography>
                        </Box>
                    )}

                    {/* Emoji picker popover */}
                    <Popover
                        open={emojiPickerOpen}
                        anchorEl={emojiAnchorEl}
                        onClose={() => setEmojiAnchorEl(null)}
                        anchorOrigin={{ vertical: "top", horizontal: "center" }}
                        transformOrigin={{ vertical: "bottom", horizontal: "center" }}
                        PaperProps={{ sx: { borderRadius: "16px", overflow: "hidden" } }}
                    >
                        <EmojiPicker theme={Theme.DARK} onEmojiClick={handleEmojiClick} />
                    </Popover>
                </>
            ) : (
                /* ── Empty state ── */
                <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 1.5 }}>
                    <ChatIcon sx={{ fontSize: 52, color: "#3a3d42" }} />
                    <Typography sx={{ color: "#5f6368", fontSize: "0.9rem" }}>
                        Select a conversation to start chatting
                    </Typography>
                    <Button
                        variant="outlined"
                        size="small"
                        sx={{
                            mt: 0.5,
                            borderRadius: "20px",
                            textTransform: "none",
                            borderColor: "rgba(255,255,255,0.15)",
                            color: "#9aa0a6",
                            "&:hover": { borderColor: "rgba(255,255,255,0.3)", backgroundColor: "rgba(255,255,255,0.04)" },
                        }}
                        onClick={(e) => setAnchorEl(e.currentTarget)}
                    >
                        New message
                    </Button>
                </Box>
            )}

            {/* ── Scroll to bottom button ── */}
            {isScrolledUp && (
                <IconButton
                    sx={{
                        position: "fixed",
                        bottom: 80,
                        right: 20,
                        backgroundColor: "#1a1d21",
                        border: "1px solid rgba(255,255,255,0.12)",
                        color: "#9aa0a6",
                        width: 34,
                        height: 34,
                        "&:hover": { backgroundColor: "#252830", color: "#e8eaed" },
                    }}
                    onClick={scrollToBottom}
                >
                    <KeyboardArrowDown sx={{ fontSize: 20 }} />
                </IconButton>
            )}

            <MessageOptionsDialog
                open={moreMenuOpen}
                onClose={() => setMoreMenuOpen(false)}
                onDelete={() => { handleDeleteMessage(selectedMessageForAction); setMoreMenuOpen(false); }}
                onInfo={() => { setSelectedMessage(selectedMessageForAction); setDrawerOpen(true); setMoreMenuOpen(false); }}
            />
            <MessageDetailsDrawer drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen} selectedMessage={selectedMessage} />
        </Box>
    );
};

export default MessagesContainer;