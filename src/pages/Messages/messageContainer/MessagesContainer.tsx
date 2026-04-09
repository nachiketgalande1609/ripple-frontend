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
import { useNavigate } from "react-router-dom";
import TypingIndicator from "../../../component/TypingIndicator";
import { getMessagesDataForSelectedUser } from "../../../services/api";
import MessageDetailsDrawer from "./MessageDetailsDrawer";
import MessageOptionsDialog from "./MessageOptionsDialog";
import BlankProfileImage from "../../../static/profile_blank.png";
import VideoThumbnail from "../../../component/post/VideoThumbnail";

interface MessagesContainerProps {
  selectedUser: User | null;
  messages: Message[];
  currentUser: User;
  handleImageClick: (fileUrl: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  handleReply: (msg: Message) => void;
  setAnchorEl: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
  handleDeleteMessage: (message: Message | null) => void;
  handleReaction: (messageId: number, reaction: string | null) => void;
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
    owner: { user_id: number; username: string; profile_picture: string };
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

// ── Hover action toolbar ───────────────────────────────────────────────────
function HoverActions({
  self,
  onMore,
  onReply,
  onEmoji,
}: {
  self: boolean;
  onMore: () => void;
  onReply: () => void;
  onEmoji: (e: React.MouseEvent<HTMLElement>) => void;
}) {
  return (
    <Box
      sx={{
        position: "absolute",
        top: "50%",
        transform: "translateY(-50%)",
        [self ? "right" : "left"]: "calc(100% + 8px)",
        display: "flex",
        alignItems: "center",
        gap: "1px",
        backgroundColor: (t) => t.palette.background.paper,
        borderRadius: "10px",
        border: "1px solid",
        borderColor: (t) => t.palette.divider,
        px: "4px",
        py: "3px",
        zIndex: 10,
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}
    >
      {self && (
        <IconButton
          size="small"
          onClick={onMore}
          sx={{
            width: 28,
            height: 28,
            borderRadius: "7px",
            color: (t) => t.palette.text.secondary,
            "&:hover": {
              color: (t) => t.palette.text.primary,
              backgroundColor: (t) => t.palette.action.hover,
            },
          }}
        >
          <MoreHoriz sx={{ fontSize: 16 }} />
        </IconButton>
      )}
      <IconButton
        size="small"
        onClick={onReply}
        sx={{
          width: 28,
          height: 28,
          borderRadius: "7px",
          color: (t) => t.palette.text.secondary,
          "&:hover": {
            color: (t) => t.palette.text.primary,
            backgroundColor: (t) => t.palette.action.hover,
          },
        }}
      >
        <ReplyIcon sx={{ fontSize: 16 }} />
      </IconButton>
      <IconButton
        size="small"
        onClick={onEmoji}
        sx={{
          width: 28,
          height: 28,
          borderRadius: "7px",
          color: (t) => t.palette.text.secondary,
          "&:hover": {
            color: (t) => t.palette.text.primary,
            backgroundColor: (t) => t.palette.action.hover,
          },
        }}
      >
        <EmojiEmotions sx={{ fontSize: 16 }} />
      </IconButton>
    </Box>
  );
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
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isDark = theme.palette.mode === "dark";

  // ── Older (paginated) messages loaded via infinite scroll ─────────────────
  // `messages` prop is the source of truth for the current page.
  // `olderMessages` holds pages loaded by scrolling up.
  const [olderMessages, setOlderMessages] = useState<Message[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [hoveredMessage, setHoveredMessage] = useState<number | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<
    number | null
  >(null);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [selectedMessageForAction, setSelectedMessageForAction] =
    useState<Message | null>(null);
  const [emojiAnchorEl, setEmojiAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMessageForReaction, setSelectedMessageForReaction] =
    useState<Message | null>(null);
  const [reactionAnchor, setReactionAnchor] = useState<HTMLElement | null>(
    null,
  );
  const [selectedReactions, setSelectedReactions] = useState<
    ReactionDetail[] | null
  >(null);
  const [isScrolledUp, setIsScrolledUp] = useState(false);

  const emojiPickerOpen = Boolean(emojiAnchorEl);

  // ── Pagination refs ───────────────────────────────────────────────────────
  const offsetRef = useRef(0);
  const isLoadingRef = useRef(false);
  const hasMoreRef = useRef(true);

  // ── Reset older messages when the selected user changes ───────────────────
  useEffect(() => {
    setOlderMessages([]);
    offsetRef.current = 0;
    isLoadingRef.current = false;
    hasMoreRef.current = true;
    setIsLoadingMore(false);
  }, [selectedUser?.id]);

  // ── Merge older pages: exclude IDs already present in `messages` prop ─────
  // This prevents duplicates when the initial fetch and paginated fetch overlap.
  const currentIds = new Set(messages.map((m) => m.message_id));
  const dedupedOlder = olderMessages.filter(
    (m) => !currentIds.has(m.message_id),
  );

  // Final list in chronological order: older first, then current messages
  const allMessages = [...dedupedOlder, ...messages];

  // ── Load older messages on scroll-to-top ─────────────────────────────────
  const loadMoreMessages = useCallback(async (userId: number) => {
    if (isLoadingRef.current || !hasMoreRef.current) return;
    isLoadingRef.current = true;
    setIsLoadingMore(true);

    const nextOffset = offsetRef.current + 20;
    try {
      const res = await getMessagesDataForSelectedUser(userId, nextOffset, 20);
      const fetched: Message[] = res.data ?? [];

      if (fetched.length === 0) {
        hasMoreRef.current = false;
      } else {
        // API returns newest-first; reverse so oldest is first
        const chronological = [...fetched].reverse();
        setOlderMessages((prev) => {
          const prevIds = new Set(prev.map((m) => m.message_id));
          const unique = chronological.filter(
            (m) => !prevIds.has(m.message_id),
          );
          return [...unique, ...prev];
        });
        offsetRef.current = nextOffset;
        if (fetched.length < 20) hasMoreRef.current = false;
      }
    } catch (err) {
      console.error("Error loading more messages:", err);
    } finally {
      isLoadingRef.current = false;
      setIsLoadingMore(false);
    }
  }, []);

  // ── Scroll handler ────────────────────────────────────────────────────────
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    // Container uses flex-direction: column-reverse, so scrollTop is negative when scrolled up
    setIsScrolledUp(scrollTop < -80);
    // Distance from the top of content (in reversed layout)
    const distanceFromTop = scrollHeight - clientHeight + scrollTop;
    if (
      distanceFromTop < 200 &&
      selectedUser &&
      !isLoadingRef.current &&
      hasMoreRef.current
    ) {
      loadMoreMessages(selectedUser.id);
    }
  };

  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  // ── Helpers ───────────────────────────────────────────────────────────────
  const findOriginalMessage = (replyToId: number | null) =>
    allMessages.find((m) => m.message_id === replyToId);

  const handleEmojiClick = (emojiObject: { emoji: string }) => {
    if (selectedMessageForReaction) {
      handleReaction(selectedMessageForReaction.message_id, emojiObject.emoji);
      setEmojiAnchorEl(null);
    }
  };

  const handleReactionPopoverOpen = (
    e: React.MouseEvent<HTMLElement>,
    reactions: ReactionDetail[],
  ) => {
    setReactionAnchor(e.currentTarget);
    setSelectedReactions(reactions);
  };

  const handleReactionPopoverClose = () => {
    setReactionAnchor(null);
    setSelectedReactions(null);
  };

  const isSelf = (msg: Message) => msg.sender_id === currentUser.id;

  // ── Design tokens ─────────────────────────────────────────────────────────
  const ACCENT = "#7c5cfc";
  const selfBg = ACCENT;
  const otherBg = theme.palette.background.paper;
  const selfTextColor = "#fff";
  const otherTextColor = theme.palette.text.primary;
  const selfTimeColor = "rgba(255,255,255,0.65)";
  const otherTimeColor = theme.palette.text.disabled;
  const mediaW = isMobile ? 220 : 280;

  // ── Skeleton loader ───────────────────────────────────────────────────────
  if (initialMessageLoading) {
    return (
      <Box
        sx={{
          flexGrow: 1,
          p: isMobile ? 1.5 : 2,
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
        }}
      >
        {[...Array(7)].map((_, i) => (
          <Box
            key={i}
            sx={{
              display: "flex",
              justifyContent: i % 2 === 0 ? "flex-end" : "flex-start",
              alignItems: "flex-end",
              gap: 1,
            }}
          >
            {i % 2 !== 0 && (
              <Skeleton
                variant="circular"
                width={28}
                height={28}
                sx={{ bgcolor: (t) => t.palette.action.hover, flexShrink: 0 }}
              />
            )}
            <Skeleton
              variant="rounded"
              width={`${Math.floor(Math.random() * 140) + 80}px`}
              height={i % 3 === 0 ? 56 : 36}
              sx={{
                bgcolor: (t) => t.palette.action.hover,
                borderRadius:
                  i % 2 === 0 ? "14px 4px 14px 14px" : "4px 14px 14px 14px",
              }}
            />
          </Box>
        ))}
      </Box>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <Box
      sx={{
        flexGrow: 1,
        px: isMobile ? 1.5 : 2.5,
        py: 2,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column-reverse",
        position: "relative",
        backgroundColor: isDark ? theme.palette.background.default : "#f7f7f8",
        "&::-webkit-scrollbar": { width: 4 },
        "&::-webkit-scrollbar-track": { background: "transparent" },
        "&::-webkit-scrollbar-thumb": {
          background: theme.palette.action.disabled,
          borderRadius: 4,
        },
      }}
      onScroll={handleScroll}
    >
      {/* Scroll anchor */}
      <div ref={messagesEndRef} />

      {selectedUser ? (
        <>
          {typingUser === selectedUser.id && <TypingIndicator />}

          {/* Render in reverse because of flex-direction: column-reverse */}
          {[...allMessages].reverse().map((msg, index) => {
            const originalMessage = msg.reply_to
              ? findOriginalMessage(msg.reply_to)
              : null;
            const self = isSelf(msg);

            return (
              <Box
                key={msg.message_id ?? index}
                sx={{
                  display: "flex",
                  mb: "6px",
                  flexDirection: "row",
                  justifyContent: self ? "flex-end" : "flex-start",
                  alignItems: "flex-start",
                  gap: 0.75,
                }}
                onMouseEnter={() => setHoveredMessage(msg.message_id)}
                onMouseLeave={() => setHoveredMessage(null)}
              >
                {/* Avatar for received messages */}
                {!self && (
                  <Box
                    component="img"
                    src={selectedUser.profile_picture || BlankProfileImage}
                    sx={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      objectFit: "cover",
                      flexShrink: 0,
                      mb: "2px",
                      mt: "4px",
                      opacity: 0.9,
                    }}
                  />
                )}

                <Box
                  sx={{
                    maxWidth: isMobile
                      ? "72vw"
                      : { lg: "44vw", md: "50vw", sm: "58vw" },
                    display: "flex",
                    flexDirection: "column",
                    alignItems: self ? "flex-end" : "flex-start",
                  }}
                >
                  {/* ── Media attachment ── */}
                  {msg.file_url && (
                    <Box
                      sx={{
                        borderRadius: "14px",
                        overflow: "hidden",
                        mb: msg.message_text ? "4px" : 0,
                        position: "relative",
                        cursor: "pointer",
                        border: "1px solid",
                        borderColor: (t) => t.palette.divider,
                      }}
                    >
                      {msg.file_url.match(/\.(jpeg|jpg|png|gif|bmp|webp)$/i) ? (
                        <Box
                          sx={{
                            position: "relative",
                            backgroundImage: `url(${BlurBackgroundImage})`,
                            backgroundSize: "cover",
                          }}
                        >
                          <CircularProgress
                            sx={{
                              position: "absolute",
                              top: "50%",
                              left: "50%",
                              transform: "translate(-50%,-50%)",
                              color: "#fff",
                            }}
                            size={22}
                          />
                          <Box
                            component="img"
                            src={msg.file_url}
                            alt="Sent"
                            sx={{
                              width: `${mediaW}px`,
                              height:
                                msg.media_width && msg.media_height
                                  ? `${(msg.media_height / msg.media_width) * mediaW}px`
                                  : "auto",
                              objectFit: "contain",
                              display: "block",
                              visibility: "hidden",
                            }}
                            onLoad={(e) => {
                              const img = e.target as HTMLImageElement;
                              const loader = img.previousSibling as HTMLElement;
                              img.style.visibility = "visible";
                              if (loader) loader.style.display = "none";
                            }}
                            onClick={() =>
                              msg.file_url && handleImageClick(msg.file_url)
                            }
                          />
                        </Box>
                      ) : msg.file_url.match(/\.(mp4|webm|ogg)$/i) ? (
                        <video
                          controls
                          style={{
                            width: `${mediaW}px`,
                            height:
                              msg.media_width && msg.media_height
                                ? `${(msg.media_height / msg.media_width) * mediaW}px`
                                : "auto",
                            display: "block",
                          }}
                        >
                          <source src={msg.file_url} />
                        </video>
                      ) : (
                        /* PDF / generic file */
                        <Box
                          sx={{
                            width: "240px",
                            backgroundColor: (t) => t.palette.background.paper,
                            cursor: "pointer",
                            "&:hover": {
                              backgroundColor: (t) => t.palette.action.hover,
                            },
                          }}
                          onClick={() => {
                            if (msg.file_url.match(/\.pdf$/i)) {
                              window.open(
                                msg.file_url,
                                "_blank",
                                "noopener,noreferrer",
                              );
                            } else {
                              const link = document.createElement("a");
                              link.href = msg.file_url;
                              link.download = "";
                              link.rel = "noopener noreferrer";
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1.5,
                              p: 1.25,
                            }}
                          >
                            {msg.file_url.match(/\.pdf$/i) ? (
                              <PdfIcon
                                sx={{
                                  color: (t) => t.palette.error.main,
                                  fontSize: 28,
                                  flexShrink: 0,
                                }}
                              />
                            ) : (
                              <FolderIcon
                                sx={{
                                  color: (t) => t.palette.warning.main,
                                  fontSize: 28,
                                  flexShrink: 0,
                                }}
                              />
                            )}
                            <Box sx={{ overflow: "hidden" }}>
                              <Typography
                                sx={{
                                  fontSize: "0.8rem",
                                  fontWeight: 500,
                                  color: (t) => t.palette.text.primary,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {msg.file_name}
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: "0.7rem",
                                  color: (t) => t.palette.text.disabled,
                                }}
                              >
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
                        borderLeft: "3px solid",
                        borderColor: ACCENT,
                        borderRadius: "8px",
                        backgroundColor: isDark
                          ? "rgba(124,92,252,0.1)"
                          : "rgba(124,92,252,0.07)",
                        mb: "4px",
                        cursor: "pointer",
                        maxWidth: "100%",
                        transition: "background 0.15s",
                        "&:hover": {
                          backgroundColor: isDark
                            ? "rgba(124,92,252,0.16)"
                            : "rgba(124,92,252,0.12)",
                        },
                      }}
                      onClick={() => {
                        const el = document.getElementById(
                          `msg-${originalMessage.message_id}`,
                        );
                        if (el) {
                          el.scrollIntoView({
                            behavior: "smooth",
                            block: "center",
                          });
                          setHighlightedMessageId(originalMessage.message_id);
                          setTimeout(() => setHighlightedMessageId(null), 2000);
                        }
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          color: ACCENT,
                          mb: "2px",
                        }}
                      >
                        {originalMessage.sender_id === currentUser.id
                          ? "You"
                          : selectedUser.username}
                      </Typography>
                      <Typography
                        noWrap
                        sx={{
                          fontSize: "0.77rem",
                          color: (t) => t.palette.text.secondary,
                        }}
                      >
                        {originalMessage.message_text.length > 55
                          ? originalMessage.message_text.slice(0, 55) + "…"
                          : originalMessage.message_text}
                      </Typography>
                    </Box>
                  )}

                  {/* ── Shared post ── */}
                  {msg.post && (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: self ? "flex-end" : "flex-start",
                        position: "relative",
                        mb: msg.message_text ? "4px" : 0,
                      }}
                    >
                      <Box
                        id={`msg-${msg.message_id}-post`}
                        onClick={() => {
                          if (msg.post?.post_id)
                            navigate(`/posts/${msg.post.post_id}`);
                        }}
                        sx={{
                          backgroundColor: (t) => t.palette.background.paper,
                          borderRadius: "14px",
                          border: "1px solid",
                          borderColor: (t) => t.palette.divider,
                          overflow: "hidden",
                          cursor: "pointer",
                          transition: "opacity 0.15s",
                          "&:hover": { opacity: 0.9 },
                        }}
                      >
                        {msg.post.owner && (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              px: 1.25,
                              py: 0.875,
                              borderBottom: "1px solid",
                              borderColor: (t) => t.palette.divider,
                            }}
                          >
                            <Box
                              component="img"
                              src={
                                msg.post.owner.profile_picture ||
                                BlankProfileImage
                              }
                              sx={{
                                width: 24,
                                height: 24,
                                borderRadius: "50%",
                                mr: 0.875,
                                objectFit: "cover",
                              }}
                            />
                            <Typography
                              sx={{
                                fontSize: "0.8rem",
                                fontWeight: 500,
                                color: (t) => t.palette.text.primary,
                              }}
                            >
                              {msg.post.owner.username}
                            </Typography>
                          </Box>
                        )}
                        {msg.post.file_url?.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                          <Box
                            sx={{
                              width: `${mediaW}px`,
                              height:
                                msg.post.media_width && msg.post.media_height
                                  ? `${(msg.post.media_height / msg.post.media_width) * mediaW}px`
                                  : "200px",
                              position: "relative",
                              overflow: "hidden",
                            }}
                          >
                            <VideoThumbnail src={msg.post.file_url} />
                          </Box>
                        ) : (
                          <Box
                            sx={{
                              position: "relative",
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              backgroundImage: `url(${BlurBackgroundImage})`,
                              backgroundSize: "cover",
                            }}
                          >
                            <CircularProgress
                              sx={{ position: "absolute", color: "#fff" }}
                              size={22}
                            />
                            <Box
                              component="img"
                              src={msg.post.file_url}
                              sx={{
                                width: `${mediaW}px`,
                                height:
                                  msg.post.media_width && msg.post.media_height
                                    ? `${(msg.post.media_height / msg.post.media_width) * mediaW}px`
                                    : "auto",
                                objectFit: "cover",
                                visibility: "hidden",
                                display: "block",
                              }}
                              onLoad={(e) => {
                                const img = e.target as HTMLImageElement;
                                const loader =
                                  img.previousSibling as HTMLElement;
                                img.style.visibility = "visible";
                                if (loader) loader.style.display = "none";
                              }}
                            />
                          </Box>
                        )}
                        {msg.post.content && (
                          <Box sx={{ px: 1.25, py: 0.875 }}>
                            <Typography
                              sx={{
                                fontSize: "0.8rem",
                                color: (t) => t.palette.text.secondary,
                              }}
                            >
                              <Box
                                component="span"
                                sx={{
                                  fontWeight: 500,
                                  color: (t) => t.palette.text.primary,
                                  mr: 0.5,
                                }}
                              >
                                {msg.post.owner.username}
                              </Box>
                              {msg.post.content}
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      {hoveredMessage === msg.message_id && (
                        <HoverActions
                          self={self}
                          onMore={() => {
                            setSelectedMessageForAction(msg);
                            setMoreMenuOpen(true);
                          }}
                          onReply={() => handleReply(msg)}
                          onEmoji={(e) => {
                            setSelectedMessageForReaction(msg);
                            setEmojiAnchorEl(e.currentTarget);
                          }}
                        />
                      )}
                    </Box>
                  )}

                  {/* ── Text bubble ── */}
                  {msg.message_text && (
                    <Box
                      id={`msg-${msg.message_id}`}
                      sx={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: self ? "flex-end" : "flex-start",
                        transition: "background-color 0.4s ease",
                        backgroundColor:
                          highlightedMessageId === msg.message_id
                            ? "rgba(124,92,252,0.15)"
                            : "transparent",
                        borderRadius: "16px",
                        position: "relative",
                      }}
                    >
                      <Box
                        sx={{
                          backgroundColor: self ? selfBg : otherBg,
                          color: self ? selfTextColor : otherTextColor,
                          padding: isMobile ? "8px 12px" : "9px 14px",
                          borderRadius: self
                            ? "14px 4px 14px 14px"
                            : "4px 14px 14px 14px",
                          fontSize: isMobile ? "0.83rem" : "0.9rem",
                          lineHeight: 1.5,
                          wordBreak: "break-word",
                          whiteSpace: "normal",
                          boxShadow: self
                            ? "0 1px 4px rgba(124,92,252,0.2)"
                            : isDark
                              ? "0 1px 3px rgba(0,0,0,0.2)"
                              : "0 1px 3px rgba(0,0,0,0.06)",
                          border: self ? "none" : "1px solid",
                          borderColor: self
                            ? "transparent"
                            : (t: any) => t.palette.divider,
                        }}
                      >
                        <Box component="span" sx={{ display: "block" }}>
                          {msg.message_text}
                        </Box>
                        <Box
                          component="span"
                          sx={{
                            display: "block",
                            fontSize: "0.65rem",
                            color: self ? selfTimeColor : otherTimeColor,
                            mt: "3px",
                            textAlign: self ? "left" : "right",
                          }}
                        >
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </Box>
                      </Box>

                      {hoveredMessage === msg.message_id && (
                        <HoverActions
                          self={self}
                          onMore={() => {
                            setSelectedMessageForAction(msg);
                            setMoreMenuOpen(true);
                          }}
                          onReply={() => handleReply(msg)}
                          onEmoji={(e) => {
                            setSelectedMessageForReaction(msg);
                            setEmojiAnchorEl(e.currentTarget);
                          }}
                        />
                      )}
                    </Box>
                  )}

                  {/* ── Reactions ── */}
                  {msg.reactions?.length > 0 && (
                    <Box
                      sx={{
                        display: "flex",
                        gap: "1px",
                        justifyContent: self ? "flex-end" : "flex-start",
                        mt: "-8px",
                        zIndex: 1,
                        cursor: "pointer",
                        backgroundColor: (t) => t.palette.background.paper,
                        border: "1px solid",
                        borderColor: (t) => t.palette.divider,
                        borderRadius: "20px",
                        px: "6px",
                        py: "2px",
                        width: "fit-content",
                        alignSelf: self ? "flex-start" : "flex-end",
                      }}
                      onClick={(e) => {
                        setSelectedMessageForReaction(msg);
                        handleReactionPopoverOpen(e, msg.reactions);
                      }}
                    >
                      {msg.reactions.map((r, i) => (
                        <Typography
                          key={i}
                          sx={{
                            fontSize: isMobile ? "0.85rem" : "1rem",
                            lineHeight: 1.4,
                          }}
                        >
                          {r.reaction}
                        </Typography>
                      ))}
                    </Box>
                  )}

                  {/* ── Reaction detail popover ── */}
                  <Popover
                    open={Boolean(reactionAnchor)}
                    anchorEl={reactionAnchor}
                    onClose={handleReactionPopoverClose}
                    anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                    transformOrigin={{ vertical: "top", horizontal: "right" }}
                    PaperProps={{
                      sx: {
                        borderRadius: "14px",
                        backgroundColor: (t) => t.palette.background.paper,
                        border: "1px solid",
                        borderColor: (t) => t.palette.divider,
                        minWidth: 190,
                        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                      },
                    }}
                  >
                    <List sx={{ maxHeight: 240, overflowY: "auto", p: "6px" }}>
                      {selectedReactions?.map((r) => (
                        <ListItem
                          key={r.user_id}
                          sx={{
                            borderRadius: "9px",
                            px: 1,
                            py: 0.625,
                            justifyContent: "space-between",
                            "&:hover": {
                              backgroundColor: (t) => t.palette.action.hover,
                            },
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <ListItemAvatar sx={{ minWidth: "unset" }}>
                              <Avatar
                                src={r.profile_picture}
                                sx={{ width: 28, height: 28 }}
                              />
                            </ListItemAvatar>
                            <Typography
                              sx={{
                                fontSize: "0.82rem",
                                color: (t) => t.palette.text.primary,
                              }}
                            >
                              {r.username || "Unknown"}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            <Typography sx={{ fontSize: "1.1rem" }}>
                              {r.reaction}
                            </Typography>
                            {r.user_id === currentUser.id.toString() && (
                              <IconButton
                                size="small"
                                sx={{
                                  width: 24,
                                  height: 24,
                                  color: (t) => t.palette.text.disabled,
                                  "&:hover": {
                                    color: (t) => t.palette.error.main,
                                    backgroundColor: "transparent",
                                  },
                                }}
                                onClick={() => {
                                  if (selectedMessageForReaction) {
                                    handleReaction(
                                      selectedMessageForReaction.message_id,
                                      null,
                                    );
                                    setSelectedReactions((prev) =>
                                      prev
                                        ? prev.filter(
                                            (x) =>
                                              x.user_id !==
                                              currentUser.id.toString(),
                                          )
                                        : prev,
                                    );
                                    if ((selectedReactions?.length ?? 0) <= 1)
                                      handleReactionPopoverClose();
                                  }
                                }}
                              >
                                <DeleteIcon sx={{ fontSize: 13 }} />
                              </IconButton>
                            )}
                          </Box>
                        </ListItem>
                      ))}
                    </List>
                  </Popover>
                </Box>

                {/* ── Read / delivered tick ── */}
                {self && (
                  <Box sx={{ pb: "4px", flexShrink: 0 }}>
                    {msg.read ? (
                      <DoneAllIcon
                        sx={{ color: ACCENT, fontSize: 14, ml: 0.5 }}
                      />
                    ) : msg.delivered ? (
                      <DoneAllIcon
                        sx={{
                          color: (t) => t.palette.text.disabled,
                          fontSize: 14,
                          ml: 0.5,
                        }}
                      />
                    ) : msg.saved ? (
                      <DoneIcon
                        sx={{
                          color: (t) => t.palette.text.disabled,
                          fontSize: 14,
                          ml: 0.5,
                        }}
                      />
                    ) : (
                      <AccessTimeIcon
                        sx={{
                          color: (t) => t.palette.text.disabled,
                          fontSize: 13,
                          ml: 0.5,
                        }}
                      />
                    )}
                  </Box>
                )}
              </Box>
            );
          })}

          {/* Load-more spinner (shown at the top of the list) */}
          {isLoadingMore && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
              <CircularProgress
                size={18}
                sx={{ color: (t) => t.palette.text.disabled }}
              />
            </Box>
          )}

          {/* "Beginning of conversation" pill */}
          {!isLoadingMore && !hasMoreRef.current && allMessages.length > 0 && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 1.5 }}>
              <Box
                sx={{
                  fontSize: "0.7rem",
                  color: (t) => t.palette.text.disabled,
                  backgroundColor: (t) => t.palette.action.hover,
                  borderRadius: "20px",
                  px: 1.5,
                  py: 0.5,
                }}
              >
                Beginning of conversation
              </Box>
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
            <EmojiPicker
              theme={isDark ? Theme.DARK : Theme.LIGHT}
              onEmojiClick={handleEmojiClick}
            />
          </Popover>
        </>
      ) : (
        /* ── Empty state ── */
        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: 2,
            py: 6,
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: "20px",
              backgroundColor: isDark
                ? "rgba(124,92,252,0.12)"
                : "rgba(124,92,252,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ChatIcon sx={{ fontSize: 30, color: ACCENT, opacity: 0.8 }} />
          </Box>
          <Box sx={{ textAlign: "center" }}>
            <Typography
              sx={{
                fontWeight: 500,
                fontSize: "0.95rem",
                color: (t) => t.palette.text.primary,
                mb: 0.5,
              }}
            >
              No conversation selected
            </Typography>
            <Typography
              sx={{
                fontSize: "0.82rem",
                color: (t) => t.palette.text.disabled,
              }}
            >
              Pick someone to message or start a new one
            </Typography>
          </Box>
          <Button
            variant="outlined"
            size="small"
            sx={{
              mt: 0.5,
              borderRadius: "10px",
              textTransform: "none",
              fontSize: "0.82rem",
              fontWeight: 500,
              px: 2,
              borderColor: ACCENT,
              color: ACCENT,
              "&:hover": {
                borderColor: ACCENT,
                backgroundColor: "rgba(124,92,252,0.08)",
              },
            }}
            onClick={(e) => setAnchorEl(e.currentTarget)}
          >
            New message
          </Button>
        </Box>
      )}

      {/* ── Scroll-to-bottom FAB ── */}
      {isScrolledUp && (
        <IconButton
          sx={{
            position: "fixed",
            bottom: isMobile ? 140 : 80,
            right: isMobile ? 8 : 20,
            backgroundColor: (t) => t.palette.background.paper,
            border: "1px solid",
            borderColor: (t) => t.palette.divider,
            color: (t) => t.palette.text.secondary,
            width: 32,
            height: 32,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            transition: "all 0.15s",
            "&:hover": {
              backgroundColor: (t) => t.palette.action.hover,
              color: (t) => t.palette.text.primary,
              borderColor: ACCENT,
            },
          }}
          onClick={scrollToBottom}
        >
          <KeyboardArrowDown sx={{ fontSize: 18 }} />
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
      <MessageDetailsDrawer
        drawerOpen={drawerOpen}
        setDrawerOpen={setDrawerOpen}
        selectedMessage={selectedMessage}
      />
    </Box>
  );
};

export default MessagesContainer;
