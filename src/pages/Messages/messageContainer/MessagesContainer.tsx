import React, { useEffect, useState } from "react";
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
    LinearProgress,
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
    ExpandMore,
    Clear as DeleteIcon,
} from "@mui/icons-material";
import EmojiPicker, { Theme } from "emoji-picker-react";
import BlurBackgroundImage from "../../../static/blur.jpg";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComments } from "@fortawesome/free-solid-svg-icons";

import TypingIndicator from "../../../component/TypingIndicator";
import { getMessagesDataForSelectedUser } from "../../../services/api";
import MessageDetailsDrawer from "./MessageDetailsDrawer";
import MessageOptionsDialog from "./MessageOptionsDialog";

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

    // State to manage the drawer
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [hoveredMessage, setHoveredMessage] = useState<number | null>(null);
    const [highlightedMessageId, setHighlightedMessageId] = useState<number | null>(null);

    const [moreMenuOpen, setMoreMenuOpen] = useState(false);
    const [selectedMessageForAction, setSelectedMessageForAction] = useState<Message | null>(null);

    // State for emoji picker
    const [emojiAnchorEl, setEmojiAnchorEl] = useState<null | HTMLElement>(null);
    const emojiPickerOpen = Boolean(emojiAnchorEl);
    const [selectedMessageForReaction, setSelectedMessageForReaction] = useState<Message | null>(null);

    const [reactionAnchor, setReactionAnchor] = useState<HTMLElement | null>(null);
    const [selectedReactions, setSelectedReactions] = useState<ReactionDetail[] | null>(null);

    const [isScrolledUp, setIsScrolledUp] = useState(false);

    const [offset, setOffset] = useState(0); // Track the offset for pagination
    const [allMessages, setAllMessages] = useState<Message[]>(messages); // Store all messages
    const [isLoading, setIsLoading] = useState(false);
    const [hasMoreMessages, setHasMoreMessages] = useState(true);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

        const scrollBottom = scrollHeight - clientHeight - Math.abs(scrollTop);

        if (scrollBottom < 100) {
            loadMoreMessages();
        }

        // Check if the user is near the bottom
        const isNearBottom = scrollTop > -10;
        setIsScrolledUp(!isNearBottom);
    };

    useEffect(() => {
        setAllMessages(messages);
    }, [messages]);

    const loadMoreMessages = async () => {
        if (!selectedUser || isLoading || !hasMoreMessages) return;

        setIsLoading(true);

        try {
            const newOffset = offset + 20; // Increment the offset
            const res = await getMessagesDataForSelectedUser(selectedUser.id, newOffset, 20);
            if (res.data.length > 0) {
                setAllMessages((prevMessages) => [...[...res.data].reverse(), ...prevMessages]);
                setOffset(newOffset);
            } else {
                setHasMoreMessages(false); // No more messages to load
            }
        } catch (error) {
            console.error("Error loading more messages:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    };

    const handleReactionPopoverOpen = (event: React.MouseEvent<HTMLElement>, reactions: ReactionDetail[]) => {
        setReactionAnchor(event.currentTarget);
        setSelectedReactions(reactions); // Set the selected reactions array
    };

    const handleReactionPopoverClose = () => {
        setReactionAnchor(null);
        setSelectedReactions(null);
    };

    const findOriginalMessage = (replyToId: number | null) => {
        return Object.values(messages)
            .flat()
            .find((m) => m.message_id === replyToId);
    };

    // Handle emoji selection
    const handleEmojiClick = (emojiObject: { emoji: string }) => {
        if (selectedMessageForReaction) {
            handleReaction(selectedMessageForReaction.message_id, emojiObject.emoji);
            setEmojiAnchorEl(null);
        }
    };

    const handleCloseEmojiPicker = () => {
        setEmojiAnchorEl(null);
    };

    return (
        <>
            {initialMessageLoading ? (
                <Box
                    sx={{
                        flexGrow: 1,
                    }}
                >
                    <LinearProgress
                        sx={{
                            width: "100%",
                            height: "3px",
                            background: "linear-gradient(90deg, #7a60ff, #ff8800)",
                            "& .MuiLinearProgress-bar": {
                                background: "linear-gradient(90deg, #7a60ff, #ff8800)",
                            },
                        }}
                    />
                </Box>
            ) : (
                <Box
                    sx={{
                        flexGrow: 1,
                        padding: 2,
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
                            {Object.values(allMessages)
                                .flat()
                                .reverse()
                                .map((msg, index) => {
                                    const originalMessage = msg.reply_to ? findOriginalMessage(msg.reply_to) : null;

                                    return (
                                        <Box
                                            key={index}
                                            sx={{
                                                display: "flex",
                                                mb: "10px",
                                                flexDirection: "row",
                                                justifyContent: msg.sender_id === currentUser.id ? "flex-end" : "flex-start",
                                                alignItems: "end",
                                            }}
                                            onTouchEnd={(e) => {
                                                if (isMobile) {
                                                    clearTimeout(Number(e.currentTarget.dataset.timeout));
                                                }
                                            }}
                                            onMouseEnter={() => setHoveredMessage(msg.message_id)}
                                            onMouseLeave={() => setHoveredMessage(null)}
                                        >
                                            <Box>
                                                {msg.file_url && (
                                                    <Box
                                                        sx={{
                                                            display: "flex",
                                                            justifyContent: "center",
                                                            alignItems: "center",
                                                            marginTop: "5px",
                                                            backgroundImage: `url(${BlurBackgroundImage})`,
                                                            backgroundSize: "cover",
                                                            backgroundPosition: "center",
                                                            overflow: "hidden",
                                                            borderRadius: "10px",
                                                            position: "relative",
                                                            cursor: "pointer",
                                                        }}
                                                    >
                                                        {msg.file_url.match(/\.(jpeg|jpg|png|gif|bmp|webp)$/i) ? (
                                                            <>
                                                                <CircularProgress
                                                                    sx={{
                                                                        position: "absolute",
                                                                        visibility: "visible",
                                                                        color: "#ffffff",
                                                                    }}
                                                                />
                                                                <Box
                                                                    component="img"
                                                                    src={msg.file_url}
                                                                    alt="Sent Image"
                                                                    sx={{
                                                                        width: isMobile ? "200" : "300px",
                                                                        height:
                                                                            msg.media_width && msg.media_height
                                                                                ? `${(msg.media_height / msg.media_width) * (isMobile ? 200 : 300)}px`
                                                                                : "auto",
                                                                        objectFit: "contain",
                                                                        borderRadius: "10px",
                                                                        visibility: "hidden",
                                                                    }}
                                                                    onLoad={(e) => {
                                                                        const imgElement = e.target as HTMLImageElement;
                                                                        const loader = imgElement.previousSibling as HTMLElement;

                                                                        imgElement.style.visibility = "visible";
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
                                                                    height:
                                                                        msg.media_width && msg.media_height
                                                                            ? `${(msg.media_height / msg.media_width) * (isMobile ? 200 : 300)}px`
                                                                            : "100%",
                                                                    maxWidth: "100%",
                                                                    borderRadius: "10px",
                                                                }}
                                                            >
                                                                <source src={msg.file_url} />
                                                                Your browser does not support the video tag.
                                                            </video>
                                                        ) : msg.file_url.match(/\.pdf$/i) ? (
                                                            <Box
                                                                sx={{
                                                                    display: "flex",
                                                                    flexDirection: "column",
                                                                    width: "300px",
                                                                    backgroundColor: "#202327",
                                                                }}
                                                            >
                                                                <Box
                                                                    sx={{
                                                                        display: "flex",
                                                                        flexDirection: "column",
                                                                        width: "100%",
                                                                        backgroundColor: "#202327",
                                                                        cursor: "pointer",
                                                                    }}
                                                                    onClick={() => window.open(msg.file_url, "_blank", "noopener,noreferrer")}
                                                                >
                                                                    <Box
                                                                        sx={{
                                                                            display: "flex",
                                                                            alignItems: "center",
                                                                            gap: 1,
                                                                            padding: 1.5,
                                                                            borderRadius: 2,
                                                                            border: "1px solid #505050",
                                                                            boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.1)",
                                                                            margin: "6px",
                                                                            justifyContent: "center",
                                                                        }}
                                                                    >
                                                                        <PdfIcon sx={{ color: "#d32f2f", fontSize: 40 }} />
                                                                        {msg.file_name && (
                                                                            <Typography fontSize={14} color="text.secondary">
                                                                                .{msg.file_name.split(".").pop()}
                                                                            </Typography>
                                                                        )}
                                                                    </Box>
                                                                </Box>

                                                                <Box sx={{ flex: 1, overflow: "hidden", padding: "8px 8px 4px 8px" }}>
                                                                    <Typography
                                                                        fontWeight={500}
                                                                        sx={{
                                                                            whiteSpace: "nowrap",
                                                                            overflow: "hidden",
                                                                            textOverflow: "ellipsis",
                                                                            maxWidth: "100%",
                                                                            fontSize: "14px",
                                                                        }}
                                                                    >
                                                                        {msg.file_name}
                                                                    </Typography>
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        {msg.file_size
                                                                            ? Number(msg.file_size) < 1024 * 1024
                                                                                ? (Number(msg.file_size) / 1024).toFixed(2) + " KB"
                                                                                : (Number(msg.file_size) / (1024 * 1024)).toFixed(2) + " MB"
                                                                            : "N/A"}
                                                                    </Typography>
                                                                </Box>
                                                            </Box>
                                                        ) : (
                                                            <Box
                                                                sx={{
                                                                    display: "flex",
                                                                    flexDirection: "column",
                                                                    width: "300px",
                                                                    backgroundColor: "#202327",
                                                                }}
                                                            >
                                                                <Box
                                                                    sx={{
                                                                        display: "flex",
                                                                        justifyContent: "center",
                                                                        alignItems: "center",
                                                                        gap: 1,
                                                                        padding: 1.5,
                                                                        borderRadius: 2,
                                                                        border: "1px solid #505050",
                                                                        boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.1)",
                                                                        margin: "6px",
                                                                        cursor: "pointer",
                                                                    }}
                                                                    onClick={() => {
                                                                        const link = document.createElement("a");
                                                                        link.href = msg.file_url;
                                                                        link.download = ""; // Allows the browser to handle the filename
                                                                        link.rel = "noopener noreferrer";
                                                                        document.body.appendChild(link);
                                                                        link.click();
                                                                        document.body.removeChild(link);
                                                                    }}
                                                                >
                                                                    <FolderIcon sx={{ color: "#ffd014", fontSize: 40 }} />
                                                                    {msg.file_name && (
                                                                        <Typography fontSize={14} color="text.secondary">
                                                                            .{msg.file_name.split(".").pop()}
                                                                        </Typography>
                                                                    )}
                                                                </Box>

                                                                <Box sx={{ flex: 1, overflow: "hidden", padding: "8px 8px 4px 8px" }}>
                                                                    <Typography
                                                                        fontWeight={500}
                                                                        sx={{
                                                                            whiteSpace: "nowrap",
                                                                            overflow: "hidden",
                                                                            textOverflow: "ellipsis",
                                                                            maxWidth: "100%",
                                                                            fontSize: "14px",
                                                                        }}
                                                                    >
                                                                        {msg.file_name}
                                                                    </Typography>
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        {msg.file_size
                                                                            ? Number(msg.file_size) < 1024 * 1024
                                                                                ? (Number(msg.file_size) / 1024).toFixed(2) + " KB"
                                                                                : (Number(msg.file_size) / (1024 * 1024)).toFixed(2) + " MB"
                                                                            : "N/A"}
                                                                    </Typography>
                                                                </Box>
                                                            </Box>
                                                        )}
                                                    </Box>
                                                )}
                                                {originalMessage && (
                                                    <Box
                                                        sx={{
                                                            backgroundColor: "#333",
                                                            padding: "6px",
                                                            borderLeft: "3px solid #1DA1F2",
                                                            borderRadius: "8px",
                                                            maxWidth: "70%",
                                                            minWidth: "100px",
                                                            fontSize: "0.85rem",
                                                            color: "#ccc",
                                                            mb: 1,
                                                            cursor: "pointer",
                                                            "&:hover": { backgroundColor: "#444" },
                                                        }}
                                                        onClick={() => {
                                                            const messageElement = document.getElementById(`msg-${originalMessage.message_id}`);
                                                            if (messageElement) {
                                                                messageElement.scrollIntoView({ behavior: "smooth", block: "center" });

                                                                // Highlighting effect
                                                                setHighlightedMessageId(originalMessage.message_id);

                                                                setTimeout(() => {
                                                                    setHighlightedMessageId(null);
                                                                }, 2000);
                                                            }
                                                        }}
                                                    >
                                                        <Typography variant="caption" sx={{ fontWeight: "bold", color: "#1DA1F2" }}>
                                                            {originalMessage.sender_id === currentUser.id ? "You" : selectedUser.username}
                                                        </Typography>
                                                        <Typography noWrap sx={{ fontSize: "0.8rem" }}>
                                                            {originalMessage.message_text.length > 50
                                                                ? originalMessage.message_text.slice(0, 50) + "..."
                                                                : originalMessage.message_text}
                                                        </Typography>
                                                    </Box>
                                                )}
                                                {msg.post && (
                                                    <Box
                                                        sx={{
                                                            display: "flex",
                                                            flexDirection: "column",
                                                            backgroundColor: "#202327",
                                                            borderRadius: "12px",
                                                            overflow: "hidden",
                                                        }}
                                                    >
                                                        {/* Post Owner Info */}
                                                        {msg.post.owner && (
                                                            <Box
                                                                sx={{
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    padding: "10px",
                                                                    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                                                                }}
                                                            >
                                                                <Box
                                                                    component="img"
                                                                    src={
                                                                        msg.post.owner.profile_picture ||
                                                                        "https://static-00.iconduck.com/assets.00/profile-major-icon-512x512-xosjbbdq.png"
                                                                    }
                                                                    alt="Owner Profile"
                                                                    sx={{
                                                                        width: "32px",
                                                                        height: "32px",
                                                                        borderRadius: "50%",
                                                                        marginRight: "8px",
                                                                    }}
                                                                />
                                                                <Typography sx={{ fontSize: "0.85rem", color: "#fff" }}>
                                                                    {msg.post.owner.username}
                                                                </Typography>
                                                            </Box>
                                                        )}

                                                        {/* Post Image with Loader */}
                                                        <Box
                                                            sx={{
                                                                display: "flex",
                                                                justifyContent: "center",
                                                                alignItems: "center",
                                                                backgroundImage: `url(${BlurBackgroundImage})`,
                                                                backgroundSize: "cover",
                                                                backgroundPosition: "center",
                                                                overflow: "hidden",
                                                                position: "relative",
                                                            }}
                                                        >
                                                            <CircularProgress
                                                                sx={{
                                                                    position: "absolute",
                                                                    visibility: "visible",
                                                                    color: "#ffffff",
                                                                }}
                                                            />
                                                            <Box
                                                                component="img"
                                                                src={msg.post.file_url}
                                                                alt="Post Image"
                                                                sx={{
                                                                    width: isMobile ? "200px" : "300px",
                                                                    height:
                                                                        msg.post.media_width && msg.post.media_height
                                                                            ? `${(msg.post.media_height / msg.post.media_width) * (isMobile ? 200 : 300)}px`
                                                                            : "auto",
                                                                    position: "relative",
                                                                    objectFit: "cover",
                                                                    visibility: "hidden",
                                                                }}
                                                                onLoad={(e) => {
                                                                    const imgElement = e.target as HTMLImageElement;
                                                                    const loader = imgElement.previousSibling as HTMLElement;

                                                                    imgElement.style.visibility = "visible";
                                                                    if (loader) loader.style.display = "none";
                                                                }}
                                                            />
                                                        </Box>

                                                        {/* Post Content */}
                                                        <Box sx={{ padding: "10px" }}>
                                                            <Typography sx={{ fontSize: "0.85rem", color: "#fff" }}>
                                                                <Box component="span" sx={{ color: "#cccccc" }}>
                                                                    {msg.post.owner.username}
                                                                </Box>
                                                                {msg.post.content}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                )}

                                                <Box
                                                    id={`msg-${msg.message_id}`}
                                                    sx={{
                                                        display: "flex",
                                                        flexDirection: "row",
                                                        alignItems: "center",
                                                        justifyContent: msg.sender_id === currentUser.id ? "flex-end" : "flex-start",
                                                        width: "100%",
                                                        transition: "background-color 0.5s ease-in-out",
                                                        backgroundColor: highlightedMessageId === msg.message_id ? "#0b335b" : "transparent",
                                                        borderRadius: "12px",
                                                        position: "relative",
                                                        ...(msg.message_text && {
                                                            "&::before": {
                                                                content: '""',
                                                                position: "absolute",
                                                                top: "0px",
                                                                [msg.sender_id === currentUser.id ? "right" : "left"]: "-8px",
                                                                width: 0,
                                                                height: 0,
                                                                borderTop: "0px solid transparent",
                                                                borderBottom: "25px solid transparent",
                                                                borderLeft: msg.sender_id === currentUser.id ? "20px solid #1976d2" : "none", // Apply only for sender
                                                                borderRight: msg.sender_id !== currentUser.id ? "20px solid #202327" : "none", // Apply only for receiver
                                                            },
                                                        }),
                                                    }}
                                                >
                                                    {msg?.message_text && (
                                                        <Typography
                                                            sx={{
                                                                backgroundColor: msg.sender_id === currentUser.id ? "#1976d2" : "#202327",
                                                                padding: "8px 12px",
                                                                borderRadius:
                                                                    msg.sender_id === currentUser.id ? "12px 0px 12px 12px" : "0px 12px 12px 12px",
                                                                maxWidth: isMobile ? "70vw" : { lg: "40vw", md: "30vw", sm: "30vw", xs: "20vw" },
                                                                fontSize: isMobile ? "0.8rem" : "1rem",
                                                                wordWrap: "break-word",
                                                                whiteSpace: "normal",
                                                                display: "flex",
                                                                flexDirection: "column",
                                                                position: "relative",
                                                            }}
                                                        >
                                                            <span>{msg.message_text}</span>
                                                            <span
                                                                style={{
                                                                    fontSize: "0.7rem",
                                                                    color: "#bbb",
                                                                    marginTop: "4px",
                                                                    alignSelf: msg.sender_id === currentUser.id ? "flex-start" : "flex-end",
                                                                }}
                                                            >
                                                                {new Date(msg.timestamp).toLocaleTimeString([], {
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                    hour12: true,
                                                                })}
                                                            </span>
                                                            {hoveredMessage === msg.message_id && (
                                                                <Box
                                                                    sx={{
                                                                        position: "absolute",
                                                                        top: "50%",
                                                                        transform: "translateY(-50%)",
                                                                        left: msg.sender_id === currentUser.id ? "-104px" : "auto",
                                                                        right: msg.sender_id === currentUser.id ? "auto" : "-70px",
                                                                        display: "flex",
                                                                        gap: "8px",
                                                                    }}
                                                                >
                                                                    {msg.sender_id === currentUser.id && (
                                                                        <IconButton
                                                                            sx={{
                                                                                color: "white",
                                                                                "&:hover": {
                                                                                    backgroundColor: "transparent",
                                                                                },
                                                                                paddingRight: 0,
                                                                            }}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setSelectedMessageForAction(msg);
                                                                                setMoreMenuOpen(true);
                                                                            }}
                                                                        >
                                                                            <MoreHoriz sx={{ fontSize: "20px" }} />
                                                                        </IconButton>
                                                                    )}
                                                                    <IconButton
                                                                        sx={{
                                                                            color: "white",
                                                                            "&:hover": {
                                                                                backgroundColor: "transparent",
                                                                            },
                                                                            paddingLeft: 0,
                                                                            paddingRight: 0,
                                                                        }}
                                                                        onClick={() => handleReply(msg)}
                                                                    >
                                                                        <ReplyIcon sx={{ fontSize: "20px" }} />
                                                                    </IconButton>
                                                                    <IconButton
                                                                        sx={{
                                                                            color: "white",
                                                                            "&:hover": {
                                                                                backgroundColor: "transparent",
                                                                            },
                                                                            paddingLeft: 0,
                                                                        }}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setSelectedMessageForReaction(msg);
                                                                            setEmojiAnchorEl(e.currentTarget);
                                                                        }}
                                                                    >
                                                                        <EmojiEmotions sx={{ fontSize: "20px" }} />
                                                                    </IconButton>
                                                                    {/* Emoji Picker */}
                                                                    <Popover
                                                                        open={emojiPickerOpen}
                                                                        anchorEl={emojiAnchorEl}
                                                                        onClose={handleCloseEmojiPicker}
                                                                        anchorOrigin={{
                                                                            vertical: "bottom",
                                                                            horizontal: "left",
                                                                        }}
                                                                        transformOrigin={{
                                                                            vertical: "top",
                                                                            horizontal: "right",
                                                                        }}
                                                                        PaperProps={{
                                                                            sx: {
                                                                                borderRadius: "20px",
                                                                            },
                                                                        }}
                                                                    >
                                                                        <EmojiPicker theme={Theme.DARK} onEmojiClick={handleEmojiClick} />
                                                                    </Popover>
                                                                </Box>
                                                            )}
                                                        </Typography>
                                                    )}
                                                </Box>
                                                {msg.reactions && (
                                                    <Box
                                                        sx={{
                                                            display: "flex",
                                                            gap: "2px",
                                                            justifyContent: msg.sender_id === currentUser.id ? "flex-end" : "flex-start",
                                                            position: "relative",
                                                            bottom: "8px",
                                                            paddingLeft: msg.sender_id === currentUser.id ? "0px" : "10px",
                                                            paddingRight: msg.sender_id === currentUser.id ? "10px" : "0px",
                                                            zIndex: 1,
                                                            cursor: "pointer",
                                                        }}
                                                        onClick={(e) => {
                                                            setSelectedMessageForReaction(msg);
                                                            handleReactionPopoverOpen(e, msg.reactions);
                                                        }}
                                                    >
                                                        {msg.reactions.map((reactionDetail, index) => (
                                                            <Typography
                                                                key={index}
                                                                sx={{
                                                                    fontSize: isMobile ? "1rem" : "1.4rem",
                                                                    borderRadius: "12px",
                                                                }}
                                                            >
                                                                {reactionDetail.reaction}
                                                            </Typography>
                                                        ))}
                                                    </Box>
                                                )}

                                                <Popover
                                                    open={Boolean(reactionAnchor)}
                                                    anchorEl={reactionAnchor}
                                                    onClose={handleReactionPopoverClose}
                                                    anchorOrigin={{
                                                        vertical: "bottom",
                                                        horizontal: "left",
                                                    }}
                                                    transformOrigin={{
                                                        vertical: "top",
                                                        horizontal: "right",
                                                    }}
                                                    PaperProps={{
                                                        sx: {
                                                            borderRadius: "20px",
                                                            boxShadow: 3,
                                                            minWidth: 200,
                                                            backgroundColor: "#000000",
                                                        },
                                                    }}
                                                >
                                                    <Box sx={{ p: 1 }}>
                                                        <List sx={{ maxHeight: 250, overflowY: "auto", padding: 0 }}>
                                                            {selectedReactions &&
                                                                selectedReactions.map((reactionDetail) => (
                                                                    <ListItem
                                                                        key={reactionDetail.user_id}
                                                                        sx={{
                                                                            borderRadius: 2,
                                                                            padding: "8px 5px",
                                                                            justifyContent: "space-between",
                                                                            display: "flex",
                                                                        }}
                                                                    >
                                                                        <Box sx={{ display: "flex", alignItems: "center" }}>
                                                                            <ListItemAvatar>
                                                                                <Avatar
                                                                                    sx={{ height: "35px", width: "35px" }}
                                                                                    src={reactionDetail.profile_picture}
                                                                                    alt={reactionDetail.username}
                                                                                />
                                                                            </ListItemAvatar>
                                                                            <Typography sx={{ marginRight: 1 }}>
                                                                                {reactionDetail.username || "Unknown User"}
                                                                            </Typography>
                                                                        </Box>

                                                                        <Box sx={{ display: "flex", alignItems: "center" }}>
                                                                            <Typography color="text.secondary" sx={{ fontSize: "22px" }}>
                                                                                {reactionDetail.reaction}
                                                                            </Typography>

                                                                            {/* Remove Reaction Button */}
                                                                            <Box sx={{ width: "32px", height: "32px" }}>
                                                                                {reactionDetail.user_id === currentUser.id.toString() && (
                                                                                    <IconButton
                                                                                        sx={{
                                                                                            ":hover": {
                                                                                                backgroundColor: "transparent",
                                                                                            },
                                                                                        }}
                                                                                        onClick={() => {
                                                                                            if (selectedMessageForReaction) {
                                                                                                handleReaction(
                                                                                                    selectedMessageForReaction.message_id,
                                                                                                    ""
                                                                                                );
                                                                                            }
                                                                                        }}
                                                                                    >
                                                                                        <DeleteIcon
                                                                                            sx={{
                                                                                                color: "#fff",
                                                                                                fontSize: "16px",
                                                                                            }}
                                                                                        />
                                                                                    </IconButton>
                                                                                )}
                                                                            </Box>
                                                                        </Box>
                                                                    </ListItem>
                                                                ))}
                                                        </List>
                                                    </Box>
                                                </Popover>
                                            </Box>
                                            <Box sx={{ paddingBottom: "2px" }}>
                                                {msg.sender_id === currentUser.id &&
                                                    (msg.read ? (
                                                        <DoneAllIcon sx={{ color: "#1DA1F2", fontSize: 16, ml: 1 }} />
                                                    ) : msg.delivered ? (
                                                        <DoneAllIcon sx={{ color: "#aaa", fontSize: 16, ml: 1 }} />
                                                    ) : msg.saved ? (
                                                        <DoneIcon sx={{ color: "#aaa", fontSize: 16, ml: 1 }} />
                                                    ) : (
                                                        <AccessTimeIcon sx={{ color: "#aaa", fontSize: 16, ml: 1 }} />
                                                    ))}
                                            </Box>
                                        </Box>
                                    );
                                })}
                        </>
                    ) : (
                        <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
                            <FontAwesomeIcon icon={faComments} style={{ fontSize: "80px", marginBottom: "10px" }} />
                            <Typography variant="body2" sx={{ textAlign: "center", mt: 2 }}>
                                Select a user to start chatting
                            </Typography>
                            <Button
                                variant="outlined"
                                size="medium"
                                sx={{ display: "block", margin: "20px auto", textAlign: "center", borderRadius: "15px" }}
                                onClick={(e) => setAnchorEl(e.currentTarget)}
                            >
                                Send Message
                            </Button>
                        </Box>
                    )}
                    {isScrolledUp && (
                        <IconButton
                            sx={{
                                position: "fixed",
                                bottom: "75px",
                                right: "20px",
                                backgroundColor: "rgb(255,255,255,0.5)",
                                color: "black",
                                "&:hover": {
                                    backgroundColor: "rgb(255,255,255,0.6)",
                                },
                            }}
                            onClick={scrollToBottom}
                        >
                            <ExpandMore sx={{ fontSize: "20px" }} />
                        </IconButton>
                    )}
                    <MessageOptionsDialog
                        open={moreMenuOpen}
                        onClose={() => setMoreMenuOpen(false)}
                        onDelete={() => {
                            handleDeleteMessage(selectedMessageForAction);
                            setMoreMenuOpen(false);
                        }}
                        onInfo={() => {
                            setSelectedMessage(selectedMessageForAction);
                            setDrawerOpen(true);
                            setMoreMenuOpen(false);
                        }}
                    />
                    <MessageDetailsDrawer drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen} selectedMessage={selectedMessage} />
                </Box>
            )}
        </>
    );
};

export default MessagesContainer;
