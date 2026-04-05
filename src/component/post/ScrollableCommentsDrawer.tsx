import React, { useEffect, useState } from "react";
import {
  Typography,
  IconButton,
  Avatar,
  Box,
  TextField,
  SwipeableDrawer,
  useMediaQuery,
  useTheme,
  Dialog,
  Button,
} from "@mui/material";
import { MoreHoriz } from "@mui/icons-material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { SentimentSatisfiedAlt as EmojiIcon } from "@mui/icons-material";
import Popover from "@mui/material/Popover";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import WarningRoundedIcon from "@mui/icons-material/WarningRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import { toggleLikeComment } from "../../services/api";
import BlankProfileImage from "../../static/profile_blank.png";

interface ScrollableCommentsDrawerProps {
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  postComments: Array<{
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
  }>;
  handleComment: () => void;
  commentText: string;
  setCommentText: (text: string) => void;
  commentInputRef: React.RefObject<HTMLInputElement>;
  content: string;
  username: string;
  avatarUrl: string | undefined;
  setSelectedCommentId: (id: number | null) => void;
  handleDeleteComment: () => void;
}

/* ─── Shared dialog styles ──────────────────────────────────────── */
const dialogBackdrop = {
  sx: { backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.6)" },
};

const dialogPaperSx = {
  borderRadius: "20px",
  background: "linear-gradient(160deg, #13131c 0%, #0e0e16 100%)",
  border: "1px solid rgba(255,255,255,0.07)",
  boxShadow: "0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(124,92,252,0.08)",
  color: "white",
  overflow: "hidden",
  padding: "6px",
};

function DialogIconWrap({ children, danger = false, warning = false, muted = false }: { children: React.ReactNode; danger?: boolean; warning?: boolean; muted?: boolean }) {
  return (
    <Box sx={{ width: 34, height: 34, borderRadius: "10px", background: danger || warning ? "rgba(255,59,48,0.08)" : muted ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", color: danger || warning ? "rgba(255,100,100,0.6)" : muted ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.5)", transition: "all 0.2s ease", flexShrink: 0 }}>
      {children}
    </Box>
  );
}

function DialogButton({ icon, label, onClick, danger = false, warning = false, muted = false }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean; warning?: boolean; muted?: boolean }) {
  return (
    <Button fullWidth onClick={onClick} sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.4, borderRadius: "12px", textTransform: "none", justifyContent: "flex-start", fontFamily: "'DM Sans', sans-serif", fontWeight: warning ? 600 : 500, fontSize: "0.875rem", color: warning ? "#fff" : danger ? "rgba(255,100,100,0.85)" : muted ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.8)", backgroundColor: warning ? "rgba(230,57,70,0.18)" : "transparent", transition: "all 0.2s ease", "&:hover": { background: warning ? "rgba(230,57,70,0.28)" : danger ? "rgba(255,59,48,0.1)" : muted ? "rgba(255,255,255,0.04)" : "rgba(124,92,252,0.12)", color: warning || danger ? "#ff6b6b" : muted ? "rgba(255,255,255,0.55)" : "#fff" } }}>
      <DialogIconWrap danger={danger} warning={warning} muted={muted}>{icon}</DialogIconWrap>
      {label}
    </Button>
  );
}

function DialogDivider() {
  return <Box sx={{ height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)", mx: 1, my: 0.5 }} />;
}

/* ─── Component ─────────────────────────────────────────────────── */
export default function ScrollableCommentsDrawer({
  drawerOpen, setDrawerOpen, postComments, handleComment, commentText,
  setCommentText, commentInputRef, content, username, avatarUrl,
  setSelectedCommentId, handleDeleteComment,
}: ScrollableCommentsDrawerProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const currentUser = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") || "") : {};

  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmDeleteButtonVisibile, setConfirmDeleteButtonVisibile] = useState(false);
  const [activeCommentMenu, setActiveCommentMenu] = useState<number | null>(null);
  const [emojiAnchorEl, setEmojiAnchorEl] = useState<null | HTMLElement>(null);
  const [likesState, setLikesState] = useState<Record<number, { liked: boolean; count: number }>>({});
  const [likeAnimating, setLikeAnimating] = useState<number | null>(null);

  const handleOpenDialog = (commentId: number) => {
    setSelectedCommentId(commentId);
    setDialogOpen(true);
    setActiveCommentMenu(null);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedCommentId(null);
    setConfirmDeleteButtonVisibile(false);
  };

  useEffect(() => {
    if (drawerOpen && commentInputRef.current) {
      setTimeout(() => commentInputRef.current?.focus(), 300);
    }
  }, [drawerOpen, commentInputRef]);

  useEffect(() => {
    const initial: Record<number, { liked: boolean; count: number }> = {};
    postComments.forEach((c) => { initial[c.id] = { liked: c.liked_by_user, count: c.likes_count }; });
    setLikesState(initial);
  }, [postComments]);

  const handleEmojiClick = (emojiData: any) => setCommentText(commentText + emojiData.emoji);

  const handleToggleLike = async (commentId: number) => {
    const prev = likesState[commentId];
    const isLiked = prev?.liked;
    if (!isLiked) {
      setLikeAnimating(commentId);
      setTimeout(() => setLikeAnimating(null), 400);
    }
    setLikesState((s) => ({ ...s, [commentId]: { liked: !isLiked, count: prev?.count + (isLiked ? -1 : 1) } }));
    try {
      const res = await toggleLikeComment(commentId);
      if (res.error) throw new Error();
    } catch {
      setLikesState((s) => ({ ...s, [commentId]: { liked: isLiked, count: prev?.count } }));
    }
  };

  const canSend = commentText.trim().length > 0;

  return (
    <>
      <style>{`
        @keyframes likePopComment {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.6); }
          70%  { transform: scale(0.85); }
          100% { transform: scale(1); }
        }
        .comment-like-pop { animation: likePopComment 0.35s cubic-bezier(0.36,0.07,0.19,0.97) both; }
        .comments-scroll::-webkit-scrollbar { width: 0px; }
        .comments-scroll { scrollbar-width: none; }
      `}</style>

      <SwipeableDrawer
        anchor="bottom"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onOpen={() => setDrawerOpen(true)}
        disableSwipeToOpen
        sx={{
          "& .MuiDrawer-paper": {
            borderRadius: "24px 24px 0 0",
            background: "linear-gradient(180deg, #111118 0%, #0a0a0f 100%)",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            color: "white",
            width: isMobile ? "100%" : "520px",
            margin: isMobile ? 0 : "0 auto",
            left: 0,
            right: 0,
            display: "flex",
            flexDirection: "column",
            height: "88vh",
            boxShadow: "0 -8px 40px rgba(0,0,0,0.6)",
          },
        }}
      >
        {/* ── Puller ── */}
        <Box sx={{ display: "flex", justifyContent: "center", pt: 1.25, pb: 0.5, flexShrink: 0 }}>
          <Box sx={{ width: 36, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.15)" }} />
        </Box>

        {/* ── Header ── */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", position: "relative", px: 2, pb: 1.25, flexShrink: 0 }}>
          <Typography sx={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: "0.92rem", color: "rgba(255,255,255,0.85)", letterSpacing: "0.01em" }}>
            Comments
          </Typography>
          {postComments.length > 0 && (
            <Box sx={{ position: "absolute", right: 16, px: 1.25, py: 0.25, borderRadius: "20px", backgroundColor: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Typography sx={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>
                {postComments.length}
              </Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)", mx: 2, mb: 0.5, flexShrink: 0 }} />

        {/* ── Scrollable content ── */}
        <Box className="comments-scroll" sx={{ flex: 1, overflowY: "auto", px: isMobile ? 1.5 : 2, py: 1.5 }}>

          {/* Caption row */}
          <Box sx={{ display: "flex", gap: 1.25, mb: 2, alignItems: "flex-start", pb: 2, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <Avatar src={avatarUrl || BlankProfileImage} sx={{ width: 36, height: 36, flexShrink: 0, mt: 0.15, border: "2px solid rgba(255,255,255,0.08)" }} />
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", fontWeight: 600, color: "#e8eaed", lineHeight: 1.3 }}>
                {username}
              </Typography>
              <Typography sx={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", color: "rgba(255,255,255,0.45)", mt: 0.3, lineHeight: 1.55 }}>
                {content}
              </Typography>
            </Box>
          </Box>

          {/* Empty state */}
          {postComments.length === 0 ? (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 6, gap: 1.5 }}>
              <Box sx={{ width: 52, height: 52, borderRadius: "16px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ChatBubbleOutlineRoundedIcon sx={{ fontSize: "1.4rem", color: "rgba(255,255,255,0.2)" }} />
              </Box>
              <Typography sx={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>
                No comments yet
              </Typography>
              <Typography sx={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", color: "rgba(255,255,255,0.18)" }}>
                Be the first to comment
              </Typography>
            </Box>
          ) : (
            postComments.map((comment) => {
              const likeData = likesState[comment.id];
              const isLiked = likeData?.liked;
              const likeCount = likeData?.count ?? 0;
              const isOwn = comment.user_id === currentUser?.id;
              const menuOpen = activeCommentMenu === comment.id;

              return (
                <Box
                  key={comment.id}
                  sx={{ display: "flex", gap: 1.25, mb: 2.25, alignItems: "flex-start" }}
                  onMouseEnter={() => setActiveCommentMenu(comment.id)}
                  onMouseLeave={() => setActiveCommentMenu(null)}
                >
                  <Avatar src={comment.commenter_profile_picture || BlankProfileImage} sx={{ width: 33, height: 33, flexShrink: 0, mt: 0.15 }} />

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    {/* Name + timestamp + options */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.35 }}>
                      <Typography sx={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: "0.8rem", color: "#e8eaed" }}>
                        {comment.commenter_username}
                      </Typography>
                      <Typography sx={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.68rem", color: "rgba(255,255,255,0.22)" }}>
                        {comment.timeAgo}
                      </Typography>
                      {menuOpen && isOwn && (
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(comment.id)}
                          sx={{ ml: "auto", p: 0.5, color: "rgba(255,255,255,0.3)", borderRadius: "8px", "&:hover": { color: "rgba(255,255,255,0.75)", backgroundColor: "rgba(255,255,255,0.06)" } }}
                        >
                          <MoreHoriz sx={{ fontSize: 15 }} />
                        </IconButton>
                      )}
                    </Box>

                    {/* Comment bubble */}
                    <Box sx={{ display: "inline-block", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "4px 14px 14px 14px", px: 1.5, py: 0.85, maxWidth: "100%" }}>
                      <Typography sx={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.83rem", color: "rgba(255,255,255,0.82)", lineHeight: 1.5, wordBreak: "break-word" }}>
                        {comment.content}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Like */}
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, gap: 0.15, pt: 0.25, minWidth: 28 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleToggleLike(comment.id)}
                      className={likeAnimating === comment.id ? "comment-like-pop" : ""}
                      sx={{ p: 0.75, color: isLiked ? "#e63946" : "rgba(255,255,255,0.28)", transition: "color 0.15s", "&:hover": { backgroundColor: "transparent", color: isLiked ? "#e63946" : "rgba(255,255,255,0.65)" } }}
                    >
                      {isLiked ? <FavoriteIcon sx={{ fontSize: 15 }} /> : <FavoriteBorderIcon sx={{ fontSize: 15 }} />}
                    </IconButton>
                    {likeCount > 0 && (
                      <Typography sx={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.62rem", color: isLiked ? "rgba(230,57,70,0.7)" : "rgba(255,255,255,0.25)", fontWeight: isLiked ? 600 : 400, lineHeight: 1 }}>
                        {likeCount}
                      </Typography>
                    )}
                  </Box>
                </Box>
              );
            })
          )}
        </Box>

        {/* ── Comment input ── */}
        <Box sx={{ px: isMobile ? 1.5 : 2, py: 1.25, borderTop: "1px solid rgba(255,255,255,0.06)", backgroundColor: "#0a0a0f", flexShrink: 0 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              backgroundColor: "rgba(255,255,255,0.05)",
              borderRadius: "16px",
              border: "1px solid rgba(255,255,255,0.07)",
              px: 1.5,
              py: 0.5,
              transition: "border-color 0.2s ease",
              "&:focus-within": { borderColor: "rgba(124,92,252,0.4)", backgroundColor: "rgba(255,255,255,0.06)" },
            }}
          >
            <Avatar src={currentUser?.profile_picture_url || BlankProfileImage} sx={{ width: 28, height: 28, flexShrink: 0, border: "1.5px solid rgba(255,255,255,0.1)" }} />

            <TextField
              fullWidth
              variant="standard"
              placeholder="Add a comment…"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && canSend) { e.preventDefault(); handleComment(); } }}
              inputRef={commentInputRef}
              InputProps={{
                disableUnderline: true,
                sx: { fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", color: "#e8eaed", "& input::placeholder": { color: "rgba(255,255,255,0.22)" } },
              }}
            />

            <IconButton onClick={(e) => setEmojiAnchorEl(e.currentTarget)} size="small" sx={{ color: "rgba(255,255,255,0.3)", p: 0.75, flexShrink: 0, "&:hover": { color: "rgba(255,255,255,0.65)", backgroundColor: "transparent" } }}>
              <EmojiIcon sx={{ fontSize: "18px" }} />
            </IconButton>

            {/* Send button */}
            <Box
              onClick={canSend ? handleComment : undefined}
              sx={{
                width: 32, height: 32, borderRadius: "10px", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: canSend ? "linear-gradient(135deg, #7c5cfc, #ff6b35)" : "rgba(255,255,255,0.06)",
                cursor: canSend ? "pointer" : "default",
                transition: "all 0.2s ease",
                "&:hover": canSend ? { background: "linear-gradient(135deg, #6b4de0, #e55520)", transform: "scale(1.06)" } : {},
              }}
            >
              <FontAwesomeIcon icon={faPaperPlane} style={{ fontSize: "13px", color: canSend ? "#fff" : "rgba(255,255,255,0.2)", transition: "color 0.2s ease" }} />
            </Box>
          </Box>
        </Box>

        {/* ── Comment options dialog ── */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} fullWidth maxWidth="xs" BackdropProps={dialogBackdrop} sx={{ "& .MuiDialog-paper": dialogPaperSx }}>
          <DialogButton
            icon={confirmDeleteButtonVisibile ? <WarningRoundedIcon sx={{ fontSize: "1.1rem" }} /> : <DeleteRoundedIcon sx={{ fontSize: "1.1rem" }} />}
            label={confirmDeleteButtonVisibile ? "Confirm delete" : "Delete comment"}
            onClick={() => { if (confirmDeleteButtonVisibile) { handleDeleteComment(); setDialogOpen(false); } else setConfirmDeleteButtonVisibile(true); }}
            danger={!confirmDeleteButtonVisibile}
            warning={confirmDeleteButtonVisibile}
          />
          <DialogDivider />
          <DialogButton icon={<CloseRoundedIcon sx={{ fontSize: "1.1rem" }} />} label="Cancel" onClick={handleCloseDialog} muted />
        </Dialog>

        {/* ── Emoji picker ── */}
        <Popover
          open={Boolean(emojiAnchorEl)}
          anchorEl={emojiAnchorEl}
          onClose={() => setEmojiAnchorEl(null)}
          anchorOrigin={{ vertical: "top", horizontal: "left" }}
          transformOrigin={{ vertical: "bottom", horizontal: "left" }}
          PaperProps={{ sx: { borderRadius: "16px", overflow: "hidden" } }}
        >
          <EmojiPicker theme={Theme.DARK} onEmojiClick={handleEmojiClick} />
        </Popover>
      </SwipeableDrawer>
    </>
  );
}