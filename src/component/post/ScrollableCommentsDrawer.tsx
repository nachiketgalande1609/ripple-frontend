import React, { useEffect, useState } from "react";
import {
  Typography, IconButton, Avatar, Box, TextField,
  SwipeableDrawer, useMediaQuery, useTheme,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { SentimentSatisfiedAlt as EmojiIcon } from "@mui/icons-material";
import Popover from "@mui/material/Popover";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import { toggleLikeComment } from "../../services/api";
import BlankProfileImage from "../../static/profile_blank.png";

const ACCENT = "#64748B";

interface Comment {
  id: number;
  post_id: string;
  user_id: string;
  content: string;
  parent_comment_id: null | number;
  created_at: string;
  updated_at: string;
  commenter_username: string;
  commenter_profile_picture: string;
  timeAgo: string;
  likes_count: number;
  liked_by_user: boolean;
}

interface ScrollableCommentsDrawerProps {
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  postComments: Comment[];
  handleComment: (parentCommentId?: number | null) => void;
  commentText: string;
  setCommentText: (text: string) => void;
  commentInputRef: React.RefObject<HTMLInputElement>;
  content: string;
  username: string;
  avatarUrl: string | undefined;
  handleDeleteComment: (commentId: number) => void;
}


export default function ScrollableCommentsDrawer({
  drawerOpen, setDrawerOpen, postComments, handleComment,
  commentText, setCommentText, commentInputRef,
  content, username, avatarUrl,
  handleDeleteComment,
}: ScrollableCommentsDrawerProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isDark = theme.palette.mode === "dark";
  const currentUser = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") || "null") : {};

  const [activeCommentMenu, setActiveCommentMenu] = useState<number | null>(null);
  const [emojiAnchorEl, setEmojiAnchorEl] = useState<null | HTMLElement>(null);
  const [likesState, setLikesState] = useState<Record<number, { liked: boolean; count: number }>>({});
  const [likeAnimating, setLikeAnimating] = useState<number | null>(null);
  const [replyingTo, setReplyingTo] = useState<{ id: number; username: string } | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set());
  const [newIds, setNewIds] = useState<Set<number>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
  const prevCountRef = React.useRef(postComments.length);


  useEffect(() => {
    if (drawerOpen && commentInputRef.current) {
      setTimeout(() => commentInputRef.current?.focus(), 300);
    }
  }, [drawerOpen, commentInputRef]);

  useEffect(() => {
    if (!drawerOpen) setReplyingTo(null);
  }, [drawerOpen]);

  useEffect(() => {
    const initial: Record<number, { liked: boolean; count: number }> = {};
    postComments.forEach((c) => { initial[c.id] = { liked: c.liked_by_user, count: c.likes_count }; });
    setLikesState(initial);
  }, [postComments]);

  useEffect(() => {
    if (postComments.length > prevCountRef.current) {
      const latest = postComments[postComments.length - 1];
      setNewIds((p) => new Set(p).add(latest.id));
      setTimeout(() => setNewIds((p) => { const s = new Set(p); s.delete(latest.id); return s; }), 500);
    }
    prevCountRef.current = postComments.length;
  }, [postComments]);

  const handleEmojiClick = (emojiData: any) => setCommentText(commentText + emojiData.emoji);

  const handleToggleLike = async (commentId: number) => {
    const prev = likesState[commentId];
    const isLiked = prev?.liked;
    if (!isLiked) { setLikeAnimating(commentId); setTimeout(() => setLikeAnimating(null), 400); }
    setLikesState((s) => ({ ...s, [commentId]: { liked: !isLiked, count: prev?.count + (isLiked ? -1 : 1) } }));
    try {
      const res = await toggleLikeComment(commentId);
      if (res.error) throw new Error();
    } catch {
      setLikesState((s) => ({ ...s, [commentId]: { liked: isLiked, count: prev?.count } }));
    }
  };

  const handleDeleteAnimated = (commentId: number) => {
    setDeletingIds((p) => new Set(p).add(commentId));
    setTimeout(() => {
      handleDeleteComment(commentId);
      setDeletingIds((p) => { const s = new Set(p); s.delete(commentId); return s; });
    }, 260);
  };

  const handleReply = (comment: Comment) => {
    setReplyingTo({ id: comment.id, username: comment.commenter_username });
    setCommentText("");
    setTimeout(() => commentInputRef.current?.focus(), 100);
  };

  const handleSend = () => {
    if (!canSend) return;
    handleComment(replyingTo?.id ?? null);
    setReplyingTo(null);
    // auto-expand replies for the parent after sending
    if (replyingTo) setExpandedReplies((prev) => new Set(prev).add(replyingTo!.id));
  };

  const toggleReplies = (commentId: number) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      next.has(commentId) ? next.delete(commentId) : next.add(commentId);
      return next;
    });
  };

  const canSend = commentText.trim().length > 0;
  const topLevel = postComments.filter((c) => !c.parent_comment_id);
  const repliesFor = (id: number) => postComments.filter((c) => c.parent_comment_id === id);
  const totalCount = postComments.length;

  const renderComment = (comment: Comment, isReply = false) => {
    const likeData = likesState[comment.id];
    const isLiked = likeData?.liked;
    const likeCount = likeData?.count ?? 0;
    const isOwn = comment.user_id === currentUser?.id;
    const menuOpen = activeCommentMenu === comment.id;
    const replies = repliesFor(comment.id);
    const repliesExpanded = expandedReplies.has(comment.id);

    const isNew = newIds.has(comment.id);
    const isDeleting = deletingIds.has(comment.id);

    return (
      <Box
        key={comment.id}
        sx={{
          animation: isNew ? "commentEnter 0.35s cubic-bezier(0.22,1,0.36,1) both" : isDeleting ? "commentExit 0.24s ease forwards" : undefined,
          "@keyframes commentEnter": { from: { opacity: 0, transform: "translateY(16px)" }, to: { opacity: 1, transform: "translateY(0)" } },
          "@keyframes commentExit": { "0%": { opacity: 1, transform: "scale(1)", maxHeight: "200px", marginBottom: "12px" }, "40%": { opacity: 0, transform: "scale(0.7)" }, "100%": { opacity: 0, transform: "scale(0.7)", maxHeight: "0px", marginBottom: "0px" } },
          overflow: "hidden",
        }}
      >
        <Box
          sx={{ display: "flex", gap: isReply ? 1 : 1.25, mb: 1.5, alignItems: "flex-start", pl: isReply ? 4.5 : 0 }}
          onMouseEnter={() => setActiveCommentMenu(comment.id)}
          onMouseLeave={() => setActiveCommentMenu(null)}
        >
          <Avatar
            src={comment.commenter_profile_picture || BlankProfileImage}
            sx={{ width: isReply ? 28 : 33, height: isReply ? 28 : 33, flexShrink: 0, mt: 0.15 }}
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.35 }}>
              <Typography sx={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: isReply ? "0.76rem" : "0.8rem", color: (t) => t.palette.text.primary }}>
                {comment.commenter_username}
              </Typography>
              <Typography sx={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.68rem", color: (t) => t.palette.text.disabled }}>
                {comment.timeAgo}
              </Typography>
            </Box>

            <Box sx={{ display: "inline-block", backgroundColor: (t) => t.palette.action.hover, borderRadius: isReply ? "4px 12px 12px 12px" : "4px 14px 14px 14px", px: 1.5, py: 0.85, maxWidth: "100%" }}>
              <Typography sx={{ fontFamily: "'DM Sans', sans-serif", fontSize: isReply ? "0.8rem" : "0.83rem", color: (t) => t.palette.text.primary, lineHeight: 1.5, wordBreak: "break-word" }}>
                {comment.content}
              </Typography>
            </Box>

            {/* Reply button (top-level only) */}
            {!isReply && (
              <Box
                component="span"
                onClick={() => handleReply(comment)}
                sx={{
                  display: "inline-flex", alignItems: "center", gap: 0.4, mt: 0.5, ml: 1,
                  cursor: "pointer", color: (t) => t.palette.text.disabled,
                  fontSize: "0.7rem", fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
                  "&:hover": { color: ACCENT },
                  transition: "color 0.15s",
                }}
              >
                Reply
              </Box>
            )}
          </Box>

          {/* Right actions */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, flexShrink: 0, alignSelf: "center" }}>
            {/* Delete — slides in on hover */}
            {isOwn && (
              <IconButton
                size="small"
                onClick={() => handleDeleteAnimated(comment.id)}
                sx={{
                  p: 0.5,
                  color: (t) => t.palette.text.disabled,
                  opacity: menuOpen ? 1 : 0,
                  transform: menuOpen ? "translateX(0)" : "translateX(6px)",
                  transition: "opacity 0.18s ease, transform 0.18s ease, color 0.15s",
                  pointerEvents: menuOpen ? "auto" : "none",
                  "&:hover": { color: (t) => t.palette.error.main, backgroundColor: (t) => `${t.palette.error.main}1f` },
                }}
              >
                <DeleteRoundedIcon sx={{ fontSize: 14 }} />
              </IconButton>
            )}

            {/* Like */}
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.1 }}>
              <IconButton
                size="small"
                onClick={() => handleToggleLike(comment.id)}
                className={likeAnimating === comment.id ? "comment-like-pop" : ""}
                sx={{ p: 0.5, color: isLiked ? theme.palette.error.main : theme.palette.text.disabled, transition: "color 0.15s", "&:hover": { backgroundColor: "transparent", color: isLiked ? theme.palette.error.main : theme.palette.text.secondary } }}
              >
                {isLiked ? <FavoriteIcon sx={{ fontSize: 14 }} /> : <FavoriteBorderIcon sx={{ fontSize: 14 }} />}
              </IconButton>
              {likeCount > 0 && (
                <Typography sx={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.6rem", color: isLiked ? theme.palette.error.light : theme.palette.text.disabled, fontWeight: isLiked ? 600 : 400, lineHeight: 1 }}>
                  {likeCount}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>

        {/* Toggle replies */}
        {!isReply && replies.length > 0 && (
          <Box
            onClick={() => toggleReplies(comment.id)}
            sx={{ display: "flex", alignItems: "center", gap: 0.75, pl: 4.5, mb: 1, cursor: "pointer", width: "fit-content" }}
          >
            <Box sx={{ width: 24, height: "1px", backgroundColor: (t) => t.palette.divider }} />
            <Typography sx={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.72rem", fontWeight: 600, color: ACCENT }}>
              {repliesExpanded ? "Hide replies" : `${replies.length} ${replies.length === 1 ? "reply" : "replies"}`}
            </Typography>
          </Box>
        )}

        {/* Replies */}
        {!isReply && repliesExpanded && replies.map((r) => renderComment(r, true))}
      </Box>
    );
  };

  return (
    <>
      <style>{`
        @keyframes likePopComment { 0% { transform: scale(1); } 40% { transform: scale(1.6); } 70% { transform: scale(0.85); } 100% { transform: scale(1); } }
        .comment-like-pop { animation: likePopComment 0.35s cubic-bezier(0.36,0.07,0.19,0.97) both; }
        .comments-scroll::-webkit-scrollbar { width: 0px; }
        .comments-scroll { scrollbar-width: none; }
      `}</style>

      <SwipeableDrawer
        anchor="bottom" open={drawerOpen}
        onClose={() => setDrawerOpen(false)} onOpen={() => setDrawerOpen(true)}
        disableSwipeToOpen
        sx={{
          "& .MuiDrawer-paper": {
            borderRadius: "24px 24px 0 0",
            backgroundColor: (t) => t.palette.background.paper,
            borderTop: "1px solid", borderColor: (t) => t.palette.divider,
            color: (t) => t.palette.text.primary,
            width: isMobile ? "100%" : "520px",
            margin: isMobile ? 0 : "0 auto",
            left: 0, right: 0,
            display: "flex", flexDirection: "column",
            height: "88vh",
            boxShadow: "0 -8px 40px rgba(0,0,0,0.4)",
          },
        }}
      >
        {/* Puller */}
        <Box sx={{ display: "flex", justifyContent: "center", pt: 1.25, pb: 0.5, flexShrink: 0 }}>
          <Box sx={{ width: 36, height: 4, borderRadius: 2, backgroundColor: (t) => t.palette.action.selected }} />
        </Box>

        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", position: "relative", px: 2, pb: 1.25, flexShrink: 0 }}>
          <Typography sx={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: "0.92rem", color: (t) => t.palette.text.primary }}>
            Comments
          </Typography>
          {totalCount > 0 && (
            <Box sx={{ position: "absolute", right: 16, px: 1.25, py: 0.25, borderRadius: "20px", backgroundColor: (t) => t.palette.action.hover, border: "1px solid", borderColor: (t) => t.palette.divider }}>
              <Typography sx={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.72rem", color: (t) => t.palette.text.disabled, fontWeight: 500 }}>
                {totalCount}
              </Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ height: "1px", backgroundColor: (t) => t.palette.divider, mx: 2, mb: 0.5, flexShrink: 0 }} />

        {/* Scrollable content */}
        <Box className="comments-scroll" sx={{ flex: 1, overflowY: "auto", px: isMobile ? 1.5 : 2, py: 1.5 }}>
          {/* Caption */}
          <Box sx={{ display: "flex", gap: 1.25, mb: 2, alignItems: "flex-start", pb: 2, borderBottom: "1px solid", borderColor: (t) => t.palette.divider }}>
            <Avatar src={avatarUrl || BlankProfileImage} sx={{ width: 36, height: 36, flexShrink: 0, mt: 0.15, border: "2px solid", borderColor: (t) => t.palette.divider }} />
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", fontWeight: 600, color: (t) => t.palette.text.primary, lineHeight: 1.3 }}>
                {username}
              </Typography>
              <Typography sx={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", color: (t) => t.palette.text.secondary, mt: 0.3, lineHeight: 1.55 }}>
                {content}
              </Typography>
            </Box>
          </Box>

          {/* Empty state */}
          {topLevel.length === 0 ? (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 6, gap: 1.5 }}>
              <Box sx={{ width: 52, height: 52, borderRadius: "16px", backgroundColor: (t) => t.palette.action.hover, border: "1px solid", borderColor: (t) => t.palette.divider, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ChatBubbleOutlineRoundedIcon sx={{ fontSize: "1.4rem", color: (t) => t.palette.text.disabled }} />
              </Box>
              <Typography sx={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", color: (t) => t.palette.text.secondary, fontWeight: 500 }}>No comments yet</Typography>
              <Typography sx={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", color: (t) => t.palette.text.disabled }}>Be the first to comment</Typography>
            </Box>
          ) : (
            topLevel.map((c) => renderComment(c))
          )}
        </Box>

        {/* Input */}
        <Box sx={{ px: isMobile ? 2 : 2.5, pt: 1, pb: `calc(${theme.spacing(1.5)} + env(safe-area-inset-bottom, 0px))`, borderTop: "1px solid", borderColor: (t) => t.palette.divider, backgroundColor: (t) => t.palette.background.paper, flexShrink: 0 }}>
          {/* Replying to indicator */}
          {replyingTo && (
            <Box sx={{ pl: 1.25, py: 0.5, mb: 0.75, borderLeft: `2px solid ${ACCENT}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography sx={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.73rem", color: (t) => t.palette.text.disabled }}>
                Replying to <Box component="span" sx={{ color: ACCENT, fontWeight: 600 }}>@{replyingTo.username}</Box>
              </Typography>
              <IconButton size="small" onClick={() => setReplyingTo(null)} sx={{ p: 0.3, color: (t) => t.palette.text.disabled, "&:hover": { color: (t) => t.palette.text.secondary } }}>
                <CloseIcon sx={{ fontSize: 12 }} />
              </IconButton>
            </Box>
          )}

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, backgroundColor: (t) => t.palette.action.hover, borderRadius: "24px", border: "1px solid", borderColor: replyingTo ? ACCENT + "60" : (t) => t.palette.divider, px: 0.875, py: 0.875, transition: "border-color 0.2s ease, box-shadow 0.2s ease", "&:focus-within": { boxShadow: "0 0 0 3px rgba(100,116,139,0.08)" } }}>
            <Avatar src={currentUser?.profile_picture_url || BlankProfileImage} sx={{ width: 32, height: 32, flexShrink: 0, border: "1.5px solid", borderColor: (t) => t.palette.divider }} />

            <TextField
              fullWidth variant="standard"
              placeholder={replyingTo ? `Reply to @${replyingTo.username}…` : "Add a comment…"}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && canSend) { e.preventDefault(); handleSend(); } }}
              inputRef={commentInputRef}
              InputProps={{
                disableUnderline: true,
                sx: { fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", color: (t) => t.palette.text.primary, "& input::placeholder": { color: (t) => t.palette.text.disabled } },
              }}
            />

            <IconButton onClick={(e) => setEmojiAnchorEl(e.currentTarget)} size="small" sx={{ color: (t) => t.palette.text.disabled, p: 0.75, flexShrink: 0, "&:hover": { color: (t) => t.palette.text.secondary, backgroundColor: "transparent" } }}>
              <EmojiIcon sx={{ fontSize: "18px" }} />
            </IconButton>

            <Box
              onClick={handleSend}
              sx={{
                width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: canSend ? "linear-gradient(135deg, #64748B, #ff6b35)" : (t) => t.palette.action.hover,
                cursor: canSend ? "pointer" : "default",
                transition: "all 0.2s ease",
                "&:hover": canSend ? { background: "linear-gradient(135deg, #6b4de0, #e55520)", transform: "scale(1.06)" } : {},
              }}
            >
              <FontAwesomeIcon icon={faPaperPlane} style={{ fontSize: "13px", color: canSend ? "#fff" : theme.palette.text.disabled, transition: "color 0.2s ease" }} />
            </Box>
          </Box>
        </Box>


        {/* Emoji picker */}
        <Popover open={Boolean(emojiAnchorEl)} anchorEl={emojiAnchorEl} onClose={() => setEmojiAnchorEl(null)} anchorOrigin={{ vertical: "top", horizontal: "left" }} transformOrigin={{ vertical: "bottom", horizontal: "left" }} PaperProps={{ sx: { borderRadius: "16px", overflow: "hidden" } }}>
          <EmojiPicker theme={isDark ? Theme.DARK : Theme.LIGHT} onEmojiClick={handleEmojiClick} />
        </Popover>
      </SwipeableDrawer>
    </>
  );
}
