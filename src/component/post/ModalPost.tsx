import React, { useState, useRef, useEffect } from "react";
import {
  Typography,
  IconButton,
  Avatar,
  Box,
  TextField,
  Dialog,
  Button,
  Popover,
  Skeleton,
  CircularProgress,
} from "@mui/material";
import BlankProfileImage from "../../static/profile_blank.png";
import {
  FavoriteBorder,
  Favorite,
  MoreHoriz,
  Close,
  ChatBubbleOutline,
  SentimentSatisfiedAlt as EmojiIcon,
} from "@mui/icons-material";
import {
  deletePost,
  likePost,
  addComment,
  updatePost,
  deleteComment,
  toggleLikeComment,
  getUserPostDetails,
} from "../../services/api";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import WarningRoundedIcon from "@mui/icons-material/WarningRounded";
import ImageDialog from "../ImageDialog";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { useNotifications } from "@toolpad/core/useNotifications";

type Post = {
  username: string;
  content: string;
  like_count: number;
  file_url?: string;
  timeAgo: string;
  id: string;
  userId: string;
  liked_by_current_user: boolean;
  media_height: number;
  media_width: number;
  savedByCurrentUser: boolean;
  profile_picture: string;
  user_id: number;
  comment_count: number;
  saved_by_current_user: boolean;
  location: string;
  comments: Array<{
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
};

interface PostProps {
  postId: string;
  userId: string | undefined;
  fetchPosts: () => Promise<void>;
  borderRadius: string;
  isMobile: boolean;
  handleCloseModal: () => void;
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

/* ─── Reusable icon wrap ────────────────────────────────────────── */
function DialogIconWrap({
  children,
  danger = false,
  warning = false,
  muted = false,
}: {
  children: React.ReactNode;
  danger?: boolean;
  warning?: boolean;
  muted?: boolean;
}) {
  const bg = danger
    ? "rgba(255,59,48,0.08)"
    : warning
      ? "rgba(230,57,70,0.15)"
      : muted
        ? "rgba(255,255,255,0.04)"
        : "rgba(255,255,255,0.06)";
  const color =
    danger || warning
      ? "rgba(255,100,100,0.6)"
      : muted
        ? "rgba(255,255,255,0.25)"
        : "rgba(255,255,255,0.5)";
  return (
    <Box
      sx={{
        width: 34,
        height: 34,
        borderRadius: "10px",
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color,
        transition: "all 0.2s ease",
        flexShrink: 0,
      }}
    >
      {children}
    </Box>
  );
}

/* ─── Reusable dialog button ────────────────────────────────────── */
function DialogButton({
  icon,
  label,
  onClick,
  danger = false,
  warning = false,
  muted = false,
  disabled = false,
  loading = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
  warning?: boolean;
  muted?: boolean;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <Button
      fullWidth
      onClick={onClick}
      disabled={disabled}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        px: 2,
        py: 1.4,
        borderRadius: "12px",
        textTransform: "none",
        justifyContent: "flex-start",
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: warning ? 600 : 500,
        fontSize: "0.875rem",
        color: warning
          ? "#fff"
          : danger
            ? "rgba(255,100,100,0.85)"
            : muted
              ? "rgba(255,255,255,0.3)"
              : "rgba(255,255,255,0.8)",
        backgroundColor: warning ? "rgba(230,57,70,0.18)" : "transparent",
        transition: "all 0.2s ease",
        "&:hover": {
          background: warning
            ? "rgba(230,57,70,0.28)"
            : danger
              ? "rgba(255,59,48,0.1)"
              : muted
                ? "rgba(255,255,255,0.04)"
                : "rgba(124,92,252,0.12)",
          color:
            warning || danger
              ? "#ff6b6b"
              : muted
                ? "rgba(255,255,255,0.55)"
                : "#fff",
        },
        "&:disabled": {
          color: "rgba(255,255,255,0.2)",
        },
      }}
    >
      <DialogIconWrap danger={danger} warning={warning} muted={muted}>
        {loading ? (
          <CircularProgress size={14} sx={{ color: "inherit" }} />
        ) : (
          icon
        )}
      </DialogIconWrap>
      {label}
    </Button>
  );
}

/* ─── Gradient divider ──────────────────────────────────────────── */
function DialogDivider() {
  return (
    <Box
      sx={{
        height: "1px",
        background:
          "linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)",
        mx: 1,
        my: 0.5,
      }}
    />
  );
}

/* ─── Component ─────────────────────────────────────────────────── */
const ModalPost: React.FC<PostProps> = ({
  postId,
  fetchPosts,
  isMobile,
  handleCloseModal,
  userId,
}) => {
  const [commentText, setCommentText] = useState("");
  const [commentOptionsDialogOpen, setCommentOptionsDialog] = useState(false);
  const [confirmDeleteButtonVisibile, setConfirmDeleteButtonVisibile] =
    useState(false);
  const [selectedCommentId, setSelectedCommentId] = useState<number | null>(
    null,
  );
  const [hoveredCommentId, setHoveredCommentId] = useState<number | null>(null);
  const [emojiAnchorEl, setEmojiAnchorEl] = useState<null | HTMLElement>(null);
  const notifications = useNotifications();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [openImageDialog, setOpenImageDialog] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const [fetchingPostDetails, setFetchingPostDetails] = useState(false);
  const [post, setPost] = useState<Post | null>(null);
  const [optionsDialogOpen, setOptionsDialogOpen] = useState(false);
  const [deletingPostCommentLoading, setDeletingPostCommentLoading] =
    useState(false);
  const [postingCommentLoading, setPostingCommentLoading] = useState(false);
  const [editingPostLoading, setEditingPostLoading] = useState(false);

  const currentUser = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user") || "")
    : {};
  const commentInputRef = useRef<HTMLInputElement>(null);
  const isOwner = currentUser?.id === post?.user_id;

  const visibleComments = showAllComments
    ? post?.comments || []
    : (post?.comments || []).slice(0, 2);

  async function fetchUserPosts() {
    try {
      setFetchingPostDetails(true);
      if (userId) {
        const res = await getUserPostDetails(userId, postId);
        setPost(res.data);
        setEditedContent(res.data.content);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setFetchingPostDetails(false);
    }
  }

  useEffect(() => {
    fetchUserPosts();
  }, [postId, userId]);

  const handleLike = async () => {
    if (!post) return;
    const prevLiked = post.liked_by_current_user;
    const prevCount = post.like_count;
    setPost({
      ...post,
      liked_by_current_user: !prevLiked,
      like_count: prevLiked ? prevCount - 1 : prevCount + 1,
    });
    try {
      await likePost(post.id);
      fetchPosts();
    } catch {
      setPost({
        ...post,
        liked_by_current_user: prevLiked,
        like_count: prevCount,
      });
      notifications.show(`Failed to ${prevLiked ? "unlike" : "like"} post.`, {
        severity: "error",
        autoHideDuration: 3000,
      });
    }
  };

  const handleComment = async () => {
    if (!post || !commentText) return;
    setPostingCommentLoading(true);
    try {
      const res = await addComment(post.id, commentText);
      if (res?.success) {
        const newComment = {
          id: Date.now(),
          post_id: post.id,
          user_id: currentUser.id,
          content: commentText,
          parent_comment_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          commenter_username: currentUser.username,
          commenter_profile_picture: currentUser.profile_picture_url,
          timeAgo: "Just now",
          likes_count: 0,
          liked_by_user: false,
        };
        setPost({
          ...post,
          comments: [newComment, ...post.comments],
          comment_count: post.comment_count + 1,
        });
        setCommentText("");
        fetchPosts();
      }
    } catch {
      notifications.show("Failed to post comment.", {
        severity: "error",
        autoHideDuration: 3000,
      });
    } finally {
      setPostingCommentLoading(false);
    }
  };

  const handleDeleteComment = async () => {
    if (!post || !selectedCommentId) return;
    setDeletingPostCommentLoading(true);
    try {
      const res = await deleteComment(selectedCommentId);
      if (res?.success) {
        setPost({
          ...post,
          comments: post.comments.filter((c) => c.id !== selectedCommentId),
          comment_count: post.comment_count - 1,
        });
        fetchPosts();
      }
    } catch {
      notifications.show("Failed to delete comment.", {
        severity: "error",
        autoHideDuration: 3000,
      });
    } finally {
      setDeletingPostCommentLoading(false);
      setCommentOptionsDialog(false);
      setSelectedCommentId(null);
      setConfirmDeleteButtonVisibile(false);
    }
  };

  const handleLikeComment = async (commentId: number) => {
    if (!post) return;
    const comment = post.comments.find((c) => c.id === commentId);
    if (!comment) return;
    const newLiked = !comment.liked_by_user;
    const newCount = newLiked
      ? comment.likes_count + 1
      : comment.likes_count - 1;
    setPost({
      ...post,
      comments: post.comments.map((c) =>
        c.id === commentId
          ? { ...c, liked_by_user: newLiked, likes_count: newCount }
          : c,
      ),
    });
    try {
      await toggleLikeComment(commentId);
    } catch {
      setPost({
        ...post,
        comments: post.comments.map((c) =>
          c.id === commentId
            ? {
                ...c,
                liked_by_user: comment.liked_by_user,
                likes_count: comment.likes_count,
              }
            : c,
        ),
      });
    }
  };

  const handleDeletePost = async () => {
    if (!post) return;
    try {
      const res = await deletePost(post.id);
      if (res?.success) {
        fetchPosts();
        handleCloseModal();
      }
    } catch {
      notifications.show("Failed to delete post.", {
        severity: "error",
        autoHideDuration: 3000,
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!post) return;
    setEditingPostLoading(true);
    try {
      const res = await updatePost(post.id, editedContent);
      if (res?.success) {
        setIsEditing(false);
        setPost({ ...post, content: editedContent });
        fetchPosts();
      }
    } catch {
      notifications.show("Failed to update post.", {
        severity: "error",
        autoHideDuration: 3000,
      });
    } finally {
      setEditingPostLoading(false);
    }
  };

  // ── Loading skeleton ──
  if (fetchingPostDetails) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          backgroundColor: "#0d0d0d",
          minHeight: isMobile ? "auto" : 560,
        }}
      >
        <Box sx={{ flex: isMobile ? "none" : 1 }}>
          <Skeleton
            variant="rectangular"
            width="100%"
            height={isMobile ? 280 : "100%"}
            sx={{
              bgcolor: "rgba(255,255,255,0.06)",
              minHeight: isMobile ? 280 : 560,
            }}
          />
        </Box>
        <Box
          sx={{
            flex: isMobile ? "none" : "0 0 380px",
            p: 2.5,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Skeleton
              variant="circular"
              width={40}
              height={40}
              sx={{ bgcolor: "rgba(255,255,255,0.06)" }}
            />
            <Box>
              <Skeleton
                variant="text"
                width={100}
                height={16}
                sx={{ bgcolor: "rgba(255,255,255,0.06)" }}
              />
              <Skeleton
                variant="text"
                width={60}
                height={13}
                sx={{ bgcolor: "rgba(255,255,255,0.04)" }}
              />
            </Box>
          </Box>
          <Skeleton
            variant="text"
            width="85%"
            height={15}
            sx={{ bgcolor: "rgba(255,255,255,0.05)" }}
          />
          <Skeleton
            variant="text"
            width="65%"
            height={15}
            sx={{ bgcolor: "rgba(255,255,255,0.04)" }}
          />
          <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
            <Skeleton
              variant="circular"
              width={28}
              height={28}
              sx={{ bgcolor: "rgba(255,255,255,0.06)" }}
            />
            <Skeleton
              variant="circular"
              width={28}
              height={28}
              sx={{ bgcolor: "rgba(255,255,255,0.06)" }}
            />
          </Box>
          {[1, 2, 3].map((i) => (
            <Box
              key={i}
              sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}
            >
              <Skeleton
                variant="circular"
                width={32}
                height={32}
                sx={{ bgcolor: "rgba(255,255,255,0.06)", flexShrink: 0 }}
              />
              <Box sx={{ flex: 1 }}>
                <Skeleton
                  variant="text"
                  width="50%"
                  height={14}
                  sx={{ bgcolor: "rgba(255,255,255,0.06)" }}
                />
                <Skeleton
                  variant="text"
                  width="80%"
                  height={13}
                  sx={{ bgcolor: "rgba(255,255,255,0.04)" }}
                />
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');`}</style>

      <Box
        sx={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          backgroundColor: "#0d0d0d",
          fontFamily: "'DM Sans', sans-serif",
          overflow: "hidden",
        }}
      >
        {/* ── Left: image ── */}
        {post?.file_url && (
          <Box
            sx={{
              flex: isMobile ? "none" : 1,
              backgroundColor: "#080808",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: isMobile ? 240 : 480,
              cursor: "zoom-in",
              overflow: "hidden",
            }}
            onClick={() => setOpenImageDialog(true)}
          >
            <Box
              component="img"
              src={post.file_url}
              alt="Post"
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                display: "block",
              }}
            />
          </Box>
        )}

        {/* ── Right: details ── */}
        <Box
          sx={{
            flex: isMobile ? "none" : "0 0 360px",
            display: "flex",
            flexDirection: "column",
            borderLeft: isMobile ? "none" : "1px solid rgba(255,255,255,0.07)",
            maxHeight: isMobile ? "none" : 560,
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              px: 2,
              py: 1.5,
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              flexShrink: 0,
            }}
          >
            <Avatar
              src={post?.profile_picture || BlankProfileImage}
              alt={post?.username}
              sx={{
                width: 36,
                height: 36,
                border: "2px solid rgba(255,255,255,0.08)",
              }}
            />
            <Box sx={{ ml: 1.25, flex: 1 }}>
              <Typography
                sx={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 600,
                  fontSize: "0.86rem",
                  color: "#e8eaed",
                  lineHeight: 1.2,
                }}
              >
                {post?.username}
              </Typography>
              <Typography
                sx={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.7rem",
                  color: "#5f6368",
                  mt: 0.1,
                }}
              >
                {post?.timeAgo}
              </Typography>
            </Box>
            {currentUser?.id && isOwner && (
              <IconButton
                size="small"
                onClick={() => setOptionsDialogOpen(true)}
                sx={{
                  color: "#5f6368",
                  "&:hover": {
                    color: "#9aa0a6",
                    backgroundColor: "rgba(255,255,255,0.06)",
                  },
                }}
              >
                <MoreHoriz sx={{ fontSize: 20 }} />
              </IconButton>
            )}
          </Box>

          {/* Caption */}
          {post?.content && (
            <Box
              sx={{
                px: 2,
                py: 1.5,
                borderBottom: "1px solid rgba(255,255,255,0.07)",
                flexShrink: 0,
              }}
            >
              <Typography
                sx={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.87rem",
                  color: "#c4c7cc",
                  lineHeight: 1.55,
                }}
              >
                <Box
                  component="span"
                  sx={{ fontWeight: 600, color: "#e8eaed", mr: 0.75 }}
                >
                  {post.username}
                </Box>
                {post.content}
              </Typography>
            </Box>
          )}

          {/* Comments list */}
          <Box sx={{ flex: 1, overflowY: "auto", px: 2, py: 1.5 }}>
            {visibleComments.length === 0 ? (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  py: 3,
                }}
              >
                <Typography
                  sx={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "0.83rem",
                    color: "#5f6368",
                  }}
                >
                  No comments yet
                </Typography>
              </Box>
            ) : (
              <>
                {visibleComments.map((comment) => (
                  <Box
                    key={comment.id}
                    sx={{
                      display: "flex",
                      gap: 1.25,
                      mb: 2,
                      alignItems: "flex-start",
                    }}
                    onMouseEnter={() => setHoveredCommentId(comment.id)}
                    onMouseLeave={() => setHoveredCommentId(null)}
                  >
                    <Avatar
                      src={
                        comment.commenter_profile_picture || BlankProfileImage
                      }
                      sx={{ width: 30, height: 30, flexShrink: 0, mt: 0.25 }}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <Typography
                          sx={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontWeight: 600,
                            fontSize: "0.8rem",
                            color: "#e8eaed",
                          }}
                        >
                          {comment.commenter_username}
                        </Typography>
                        {hoveredCommentId === comment.id &&
                          comment.user_id === currentUser.id && (
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedCommentId(comment.id);
                                setCommentOptionsDialog(true);
                              }}
                              sx={{
                                p: 0.25,
                                color: "#5f6368",
                                "&:hover": {
                                  color: "#9aa0a6",
                                  backgroundColor: "transparent",
                                },
                              }}
                            >
                              <MoreHoriz sx={{ fontSize: 16 }} />
                            </IconButton>
                          )}
                        <Typography
                          sx={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: "0.68rem",
                            color: "#5f6368",
                            ml: "auto",
                          }}
                        >
                          {comment.timeAgo}
                        </Typography>
                      </Box>
                      <Typography
                        sx={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: "0.82rem",
                          color: "#9aa0a6",
                          mt: 0.2,
                          lineHeight: 1.45,
                        }}
                      >
                        {comment.content}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={() => handleLikeComment(comment.id)}
                        sx={{
                          p: 0.25,
                          color: comment.liked_by_user ? "#e63946" : "#5f6368",
                          "&:hover": {
                            backgroundColor: "transparent",
                            color: comment.liked_by_user
                              ? "#e63946"
                              : "#9aa0a6",
                          },
                        }}
                      >
                        {comment.liked_by_user ? (
                          <Favorite sx={{ fontSize: 14 }} />
                        ) : (
                          <FavoriteBorder sx={{ fontSize: 14 }} />
                        )}
                      </IconButton>
                      {comment.likes_count > 0 && (
                        <Typography
                          sx={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: "0.65rem",
                            color: "#5f6368",
                          }}
                        >
                          {comment.likes_count}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                ))}
                {(post?.comments?.length ?? 0) > 2 && !showAllComments && (
                  <Typography
                    onClick={() => setShowAllComments(true)}
                    sx={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "0.78rem",
                      color: "#9aa0a6",
                      cursor: "pointer",
                      mb: 1,
                      "&:hover": { color: "#e8eaed" },
                    }}
                  >
                    View all {post?.comments.length} comments
                  </Typography>
                )}
              </>
            )}
          </Box>

          {/* Action bar */}
          {currentUser?.id && (
            <Box
              sx={{
                px: 1.5,
                pt: 0.75,
                pb: 0.5,
                borderTop: "1px solid rgba(255,255,255,0.07)",
                flexShrink: 0,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <IconButton
                  disableRipple
                  onClick={handleLike}
                  sx={{
                    p: 0.75,
                    color: post?.liked_by_current_user ? "#e63946" : "#5f6368",
                    transition: "color 0.15s",
                    "&:hover": {
                      backgroundColor: "transparent",
                      color: post?.liked_by_current_user
                        ? "#e63946"
                        : "#9aa0a6",
                    },
                  }}
                >
                  {post?.liked_by_current_user ? (
                    <Favorite sx={{ fontSize: 22 }} />
                  ) : (
                    <FavoriteBorder sx={{ fontSize: 22 }} />
                  )}
                </IconButton>
                <Typography
                  sx={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "0.78rem",
                    color: "#5f6368",
                    mr: 1,
                  }}
                >
                  {post?.like_count}
                </Typography>
                <IconButton
                  disableRipple
                  onClick={() => commentInputRef.current?.focus()}
                  sx={{
                    p: 0.75,
                    color: "#5f6368",
                    "&:hover": {
                      backgroundColor: "transparent",
                      color: "#9aa0a6",
                    },
                  }}
                >
                  <ChatBubbleOutline sx={{ fontSize: 21 }} />
                </IconButton>
                <Typography
                  sx={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "0.78rem",
                    color: "#5f6368",
                  }}
                >
                  {post?.comment_count}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Comment input */}
          {currentUser?.id && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                px: 1.5,
                py: 1,
                borderTop: "1px solid rgba(255,255,255,0.07)",
                flexShrink: 0,
              }}
            >
              <TextField
                fullWidth
                placeholder="Add a comment…"
                variant="standard"
                size="small"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                inputRef={commentInputRef}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && commentText) {
                    e.preventDefault();
                    handleComment();
                  }
                }}
                InputProps={{
                  disableUnderline: true,
                  sx: {
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "0.85rem",
                    color: "#e8eaed",
                    "& input::placeholder": { color: "#5f6368" },
                  },
                }}
              />
              <IconButton
                size="small"
                onClick={(e) => setEmojiAnchorEl(e.currentTarget)}
                sx={{
                  color: "#5f6368",
                  "&:hover": {
                    color: "#9aa0a6",
                    backgroundColor: "transparent",
                  },
                }}
              >
                <EmojiIcon sx={{ fontSize: 20 }} />
              </IconButton>
              <Button
                onClick={handleComment}
                disabled={!commentText || postingCommentLoading}
                disableRipple
                sx={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  textTransform: "none",
                  px: 1.5,
                  py: 0.5,
                  minWidth: "auto",
                  borderRadius: "8px",
                  color: commentText ? "#e8eaed" : "#5f6368",
                  backgroundColor: "transparent",
                  "&:hover": { backgroundColor: "transparent", color: "#fff" },
                  "&:disabled": { color: "#5f6368" },
                  transition: "color 0.15s",
                  flexShrink: 0,
                }}
              >
                {postingCommentLoading ? (
                  <CircularProgress size={14} sx={{ color: "#9aa0a6" }} />
                ) : (
                  "Post"
                )}
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      {/* ── Comment options dialog ── */}
      <Dialog
        open={commentOptionsDialogOpen}
        onClose={() => {
          setCommentOptionsDialog(false);
          setSelectedCommentId(null);
          setConfirmDeleteButtonVisibile(false);
        }}
        fullWidth
        maxWidth="xs"
        BackdropProps={dialogBackdrop}
        sx={{ "& .MuiDialog-paper": dialogPaperSx }}
      >
        <DialogButton
          icon={
            confirmDeleteButtonVisibile ? (
              <WarningRoundedIcon sx={{ fontSize: "1.1rem" }} />
            ) : (
              <DeleteRoundedIcon sx={{ fontSize: "1.1rem" }} />
            )
          }
          label={
            deletingPostCommentLoading
              ? "Deleting…"
              : confirmDeleteButtonVisibile
                ? "Confirm delete"
                : "Delete comment"
          }
          onClick={() =>
            confirmDeleteButtonVisibile
              ? handleDeleteComment()
              : setConfirmDeleteButtonVisibile(true)
          }
          danger={!confirmDeleteButtonVisibile}
          warning={confirmDeleteButtonVisibile}
          disabled={deletingPostCommentLoading}
          loading={deletingPostCommentLoading}
        />

        <DialogDivider />

        <DialogButton
          icon={<CloseRoundedIcon sx={{ fontSize: "1.1rem" }} />}
          label="Cancel"
          onClick={() => {
            setCommentOptionsDialog(false);
            setSelectedCommentId(null);
            setConfirmDeleteButtonVisibile(false);
          }}
          muted
        />
      </Dialog>

      {/* ── Post options dialog ── */}
      {isOwner && (
        <Dialog
          open={optionsDialogOpen}
          onClose={() => {
            setOptionsDialogOpen(false);
            setConfirmDeleteButtonVisibile(false);
          }}
          fullWidth
          maxWidth="xs"
          BackdropProps={dialogBackdrop}
          sx={{ "& .MuiDialog-paper": dialogPaperSx }}
        >
          <DialogButton
            icon={<EditRoundedIcon sx={{ fontSize: "1.1rem" }} />}
            label="Edit post"
            onClick={() => {
              setIsEditing(true);
              setEditedContent(post?.content || "");
              setOptionsDialogOpen(false);
              setConfirmDeleteButtonVisibile(false);
            }}
          />

          <DialogButton
            icon={
              confirmDeleteButtonVisibile ? (
                <WarningRoundedIcon sx={{ fontSize: "1.1rem" }} />
              ) : (
                <DeleteRoundedIcon sx={{ fontSize: "1.1rem" }} />
              )
            }
            label={
              confirmDeleteButtonVisibile ? "Confirm delete" : "Delete post"
            }
            onClick={() =>
              confirmDeleteButtonVisibile
                ? handleDeletePost()
                : setConfirmDeleteButtonVisibile(true)
            }
            danger={!confirmDeleteButtonVisibile}
            warning={confirmDeleteButtonVisibile}
          />

          <DialogDivider />

          <DialogButton
            icon={<CloseRoundedIcon sx={{ fontSize: "1.1rem" }} />}
            label="Cancel"
            onClick={() => {
              setOptionsDialogOpen(false);
              setConfirmDeleteButtonVisibile(false);
            }}
            muted
          />
        </Dialog>
      )}

      {/* ── Edit dialog ── */}
      <Dialog
        open={isEditing}
        onClose={() => {
          setIsEditing(false);
          setEditedContent("");
        }}
        BackdropProps={dialogBackdrop}
        sx={{
          "& .MuiDialog-paper": {
            ...dialogPaperSx,
            padding: 0,
            width: "90%",
            maxWidth: "520px",
          },
        }}
      >
        {post?.file_url && (
          <Box sx={{ position: "relative" }}>
            <Box
              component="img"
              src={post.file_url}
              sx={{
                width: "100%",
                height: 200,
                objectFit: "cover",
                display: "block",
              }}
            />
            <IconButton
              size="small"
              onClick={() => setIsEditing(false)}
              sx={{
                position: "absolute",
                top: 8,
                right: 8,
                backgroundColor: "rgba(0,0,0,0.55)",
                color: "#fff",
                width: 28,
                height: 28,
                backdropFilter: "blur(4px)",
                border: "1px solid rgba(255,255,255,0.12)",
                "&:hover": { backgroundColor: "rgba(0,0,0,0.75)" },
              }}
            >
              <Close sx={{ fontSize: 15 }} />
            </IconButton>
          </Box>
        )}
        <Box
          sx={{
            px: 2,
            py: 1.5,
            display: "flex",
            alignItems: "flex-end",
            gap: 1.5,
            borderTop: post?.file_url
              ? "1px solid rgba(255,255,255,0.07)"
              : "none",
          }}
        >
          <TextField
            fullWidth
            multiline
            size="small"
            variant="standard"
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            placeholder="Write a caption…"
            InputProps={{
              disableUnderline: true,
              sx: {
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.9rem",
                color: "#e8eaed",
                "& textarea::placeholder": { color: "#5f6368" },
              },
            }}
          />
          <Button
            onClick={handleSaveEdit}
            disabled={editedContent === post?.content || editingPostLoading}
            sx={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600,
              fontSize: "0.82rem",
              textTransform: "none",
              borderRadius: "10px",
              px: 2.5,
              py: 0.9,
              flexShrink: 0,
              backgroundColor: "#e8eaed",
              color: "#111",
              "&:hover": { backgroundColor: "#c4c7cc" },
              "&:disabled": {
                backgroundColor: "rgba(255,255,255,0.08)",
                color: "#5f6368",
              },
            }}
          >
            {editingPostLoading ? (
              <CircularProgress size={14} sx={{ color: "#9aa0a6" }} />
            ) : (
              "Save"
            )}
          </Button>
        </Box>
      </Dialog>

      {/* ── Emoji picker ── */}
      <Popover
        open={Boolean(emojiAnchorEl)}
        anchorEl={emojiAnchorEl}
        onClose={() => setEmojiAnchorEl(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        transformOrigin={{ vertical: "bottom", horizontal: "center" }}
        PaperProps={{ sx: { borderRadius: "16px", overflow: "hidden" } }}
      >
        <EmojiPicker
          theme={Theme.DARK}
          onEmojiClick={(e) => setCommentText((p) => p + e.emoji)}
        />
      </Popover>

      <ImageDialog
        openDialog={openImageDialog}
        handleCloseDialog={() => setOpenImageDialog(false)}
        selectedImage={post?.file_url || ""}
      />
    </>
  );
};

export default ModalPost;
