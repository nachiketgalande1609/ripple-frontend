import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Avatar,
  Typography,
  IconButton,
  TextField,
  CircularProgress,
  Fade,
  Skeleton,
  Dialog,
  Button,
  Tooltip,
  useTheme,
  Popover,
} from "@mui/material";
import {
  ArrowBack,
  ChevronLeft,
  FavoriteBorder,
  Favorite,
  ChatBubbleOutline,
  BookmarkBorderOutlined,
  Bookmark,
  MoreHoriz,
  LocationOn,
  Close,
  SendRounded,
  PersonAdd as TagPeopleIcon,
  PersonRounded as TaggedIcon,
} from "@mui/icons-material";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import WarningRoundedIcon from "@mui/icons-material/WarningRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import BlankProfileImage from "../static/profile_blank.png";
import VideoPlayer from "../component/VideoPlayer";
import {
  getPost,
  likePost,
  addComment,
  savePost,
  deletePost,
  updatePost,
  deleteComment,
  toggleLikeComment,
  getSearchResults,
  updatePostTags,
} from "../services/api";
import { useAppNotifications } from "../hooks/useNotification";

/* ─── Theme-derived tokens ───────────────────────────────────── */
function useTokens() {
  const theme = useTheme();
  const p = theme.palette;
  return {
    bg0: p.background.default,
    bg1: p.background.paper,
    bg2: p.background.paper,
    bg3: p.action.hover,
    border: p.divider,
    borderHover: p.text.disabled,
    textPrimary: p.text.primary,
    textSecondary: p.text.secondary,
    textMuted: p.text.disabled,
    // accent is a brand color — stays fixed
    accent: "#64748B",
    accentDim: "rgba(100,116,139,0.15)",
    danger: p.error.main,
    dangerDim: `${p.error.main}1f`,
    fontDisplay: "'Playfair Display', Georgia, serif",
    fontBody: "'DM Sans', sans-serif",
    // Derived helpers
    bgNavbar: `${p.background.paper}eb`,
    actionHover: p.action.hover,
    actionSelected: p.action.selected,
    disabledBg: p.action.disabledBackground,
    disabledColor: p.action.disabled,
  };
}

/* ─── Dialog backdrop ──────────────────────────────────────────── */
const backdropProps = {
  sx: { backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.6)" },
};

/* ─── Small reusable pieces ──────────────────────────────────── */
function Divider() {
  return <Box sx={{ height: "1px", backgroundColor: (t) => t.palette.divider, mx: 1.5, my: 0.5 }} />;
}

function SheetButton({
  icon,
  label,
  onClick,
  variant = "default",
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: "default" | "danger" | "warning" | "muted";
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const colors = {
    default: { color: theme.palette.text.primary, hover: theme.palette.action.hover, hoverColor: theme.palette.text.primary, iconBg: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", iconColor: theme.palette.text.secondary },
    danger: { color: isDark ? "rgba(255,100,100,0.85)" : "#d32f2f", hover: "rgba(255,59,48,0.1)", hoverColor: "#ff4444", iconBg: "rgba(255,59,48,0.08)", iconColor: "rgba(255,100,100,0.6)" },
    warning: { color: "#fff", hover: "rgba(230,57,70,0.28)", hoverColor: "#ff6b6b", iconBg: "rgba(230,57,70,0.15)", iconColor: "rgba(255,100,100,0.6)" },
    muted: { color: theme.palette.text.disabled, hover: theme.palette.action.hover, hoverColor: theme.palette.text.secondary, iconBg: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", iconColor: theme.palette.text.disabled },
  };
  const c = colors[variant];

  return (
    <Button
      fullWidth
      onClick={onClick}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        px: 2,
        py: 1.3,
        borderRadius: "12px",
        textTransform: "none",
        justifyContent: "flex-start",
        fontFamily: "'Inter', sans-serif",
        fontWeight: variant === "warning" ? 600 : 500,
        fontSize: "0.875rem",
        color: c.color,
        bgcolor: variant === "warning" ? "rgba(230,57,70,0.18)" : "transparent",
        transition: "all 0.18s ease",
        "&:hover": { background: c.hover, color: c.hoverColor },
      }}
    >
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: "9px",
          background: c.iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          color: c.iconColor,
        }}
      >
        {icon}
      </Box>
      {label}
    </Button>
  );
}

/* ─── Comment Item ──────────────────────────────────────────── */
function CommentItem({
  comment,
  isOwner,
  onDelete,
  onReply,
  isReply = false,
  replies = [],
  isNew = false,
  isDeleting = false,
}: {
  comment: any;
  isOwner: boolean;
  onDelete: (id: number) => void;
  onReply: (id: number, username: string) => void;
  isReply?: boolean;
  replies?: any[];
  isNew?: boolean;
  isDeleting?: boolean;
}) {
  const navigate = useNavigate();
  const theme = useTheme();
  const [hovered, setHovered] = useState(false);
  const [repliesOpen, setRepliesOpen] = useState(false);
  const [liked, setLiked] = useState<boolean>(!!comment.liked_by_user);
  const [likeCount, setLikeCount] = useState<number>(comment.likes_count ?? 0);
  const [likeAnimating, setLikeAnimating] = useState(false);

  const handleLike = async () => {
    const wasLiked = liked;
    if (!wasLiked) { setLikeAnimating(true); setTimeout(() => setLikeAnimating(false), 350); }
    setLiked(!wasLiked);
    setLikeCount((c) => c + (wasLiked ? -1 : 1));
    try {
      const res = await toggleLikeComment(comment.id);
      if (res?.error) throw new Error();
    } catch {
      setLiked(wasLiked);
      setLikeCount((c) => c + (wasLiked ? 1 : -1));
    }
  };

  return (
    <Box
      sx={{
        animation: isNew ? "commentEnter 0.35s cubic-bezier(0.22,1,0.36,1) both" : isDeleting ? "commentExit 0.24s ease forwards" : undefined,
        "@keyframes commentEnter": { from: { opacity: 0, transform: "translateY(16px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        "@keyframes commentExit": { "0%": { opacity: 1, transform: "scale(1)", maxHeight: "200px", marginBottom: "8px" }, "40%": { opacity: 0, transform: "scale(0.7)" }, "100%": { opacity: 0, transform: "scale(0.7)", maxHeight: "0px", marginBottom: "0px" } },
        overflow: "hidden",
      }}
    >
      <Box>
        <Box
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          sx={{
            display: "flex", gap: 1.5, py: 1, px: 1,
            pl: isReply ? 4 : 1,
            borderRadius: "12px", position: "relative",
            transition: "background 0.15s",
            "&:hover": { bgcolor: (t) => t.palette.action.hover },
          }}
        >
          <Avatar
            src={comment.commenter_profile_picture || BlankProfileImage}
            sx={{ width: isReply ? 24 : 30, height: isReply ? 24 : 30, cursor: "pointer", flexShrink: 0, mt: 0.2, border: "1.5px solid", borderColor: (t) => t.palette.divider }}
            onClick={() => navigate(`/profile/${comment.user_id}`)}
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography component="p" sx={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", color: (t) => t.palette.text.secondary, lineHeight: 1.6, wordBreak: "break-word" }}>
              <Box component="span" onClick={() => navigate(`/profile/${comment.user_id}`)} sx={{ fontWeight: 600, color: (t) => t.palette.text.primary, mr: 0.7, cursor: "pointer", "&:hover": { color: "#64748B" }, transition: "color 0.15s" }}>
                {comment.commenter_username}
              </Box>
              {comment.content}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 0.35 }}>
              <Typography sx={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.68rem", color: (t) => t.palette.text.disabled }}>
                {comment.timeAgo}
              </Typography>
              {!isReply && (
                <Typography
                  component="span"
                  onClick={() => onReply(comment.id, comment.commenter_username)}
                  sx={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.68rem", fontWeight: 600, color: (t) => t.palette.text.disabled, cursor: "pointer", "&:hover": { color: "#64748B" }, transition: "color 0.15s" }}
                >
                  Reply
                </Typography>
              )}
            </Box>
          </Box>
          {/* Right actions — fixed width so layout never shifts */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, flexShrink: 0, alignSelf: "center" }}>
            {/* Delete — slides in on hover */}
            {isOwner && (
              <Tooltip title="Delete">
                <IconButton
                  onClick={() => onDelete(comment.id)}
                  size="small"
                  sx={{
                    p: 0.5,
                    color: (t) => t.palette.text.disabled,
                    opacity: hovered ? 1 : 0,
                    transform: hovered ? "translateX(0)" : "translateX(6px)",
                    transition: "opacity 0.18s ease, transform 0.18s ease, color 0.15s",
                    pointerEvents: hovered ? "auto" : "none",
                    "&:hover": { color: (t) => t.palette.error.main, bgcolor: (t) => `${t.palette.error.main}1f` },
                  }}
                >
                  <DeleteRoundedIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Tooltip>
            )}

            {/* Like */}
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.1 }}>
              <IconButton
                size="small"
                onClick={handleLike}
                sx={{
                  p: 0.5,
                  color: liked ? theme.palette.error.main : (t) => t.palette.text.disabled,
                  transition: "color 0.15s, transform 0.15s",
                  transform: likeAnimating ? "scale(1.45)" : "scale(1)",
                  "&:hover": { backgroundColor: "transparent", color: liked ? theme.palette.error.main : (t) => t.palette.text.secondary },
                }}
              >
                {liked ? <Favorite sx={{ fontSize: 13 }} /> : <FavoriteBorder sx={{ fontSize: 13 }} />}
              </IconButton>
              {likeCount > 0 && (
                <Typography sx={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.6rem", color: liked ? theme.palette.error.light : (t) => t.palette.text.disabled, fontWeight: liked ? 600 : 400, lineHeight: 1 }}>
                  {likeCount}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>

        {/* Toggle replies */}
        {!isReply && replies.length > 0 && (
          <Box onClick={() => setRepliesOpen((v) => !v)} sx={{ display: "flex", alignItems: "center", gap: 0.75, pl: 4, pb: 0.5, cursor: "pointer", width: "fit-content" }}>
            <Box sx={{ width: 20, height: "1px", backgroundColor: (t) => t.palette.divider }} />
            <Typography sx={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.7rem", fontWeight: 600, color: "#64748B" }}>
              {repliesOpen ? "Hide replies" : `${replies.length} ${replies.length === 1 ? "reply" : "replies"}`}
            </Typography>
          </Box>
        )}

        {/* Replies */}
        {!isReply && repliesOpen && replies.map((r) => (
          <CommentItem key={r.id} comment={r} isOwner={isOwner} onDelete={onDelete} onReply={onReply} isReply replies={[]} />
        ))}
      </Box>
    </Box>
  );
}

/* ─── Like animation ────────────────────────────────────────── */
const heartAnimStyle = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
@keyframes heartPop {
  0%   { transform: scale(0.6); opacity:0; }
  40%  { transform: scale(1.35); opacity:1; }
  70%  { transform: scale(0.9); opacity:1; }
  100% { transform: scale(1); opacity:0; }
}
.heart-pop { animation: heartPop 0.72s cubic-bezier(0.34,1.56,0.64,1) forwards; }
@keyframes likeBtn {
  0%   { transform: scale(1); }
  35%  { transform: scale(1.4); }
  65%  { transform: scale(0.88); }
  100% { transform: scale(1); }
}
.like-btn-pop { animation: likeBtn 0.32s ease both; }
`;

/* ─── Main Component ─────────────────────────────────────────── */
const PostDetailPage = () => {
  const tokens = useTokens();
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const notifications = useAppNotifications();
  const commentInputRef = useRef<HTMLInputElement>(null);

  const currentUser = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user") || "null")
    : {};

  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [heartVisible, setHeartVisible] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  const [commentCount, setCommentCount] = useState(0);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [mediaFiles, setMediaFiles] = useState<string[]>([]);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: number; username: string } | null>(null);
  const [newCommentIds, setNewCommentIds] = useState<Set<number>>(new Set());
  const [deletingCommentIds, setDeletingCommentIds] = useState<Set<number>>(new Set());
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [tagAnchorEl, setTagAnchorEl] = useState<HTMLElement | null>(null);
  const [taggedUsers, setTaggedUsers] = useState<{ id: number; username: string; profile_picture?: string }[]>([]);
  const [tagSearch, setTagSearch] = useState("");
  const [tagResults, setTagResults] = useState<{ id: number; username: string; profile_picture?: string }[]>([]);
  const [tagSearchLoading, setTagSearchLoading] = useState(false);
  const [savingTags, setSavingTags] = useState(false);
  const tagSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isOwner = currentUser?.id === post?.user_id;

  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const paperSx = {
    borderRadius: "20px",
    background: isDark ? "linear-gradient(160deg, #13131c 0%, #0e0e16 100%)" : theme.palette.background.paper,
    border: "1px solid",
    borderColor: theme.palette.divider,
    boxShadow: isDark ? "0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(100,116,139,0.08)" : "0 8px 32px rgba(0,0,0,0.12)",
    overflow: "hidden",
    p: "6px",
    width: "90%",
    maxWidth: "360px",
  };

  useEffect(() => {
    fetchPost();
  }, [postId]);

  useEffect(() => {
    if (!tagSearch.trim()) { setTagResults([]); return; }
    if (tagSearchTimer.current) clearTimeout(tagSearchTimer.current);
    tagSearchTimer.current = setTimeout(async () => {
      setTagSearchLoading(true);
      try {
        const res = await getSearchResults(tagSearch);
        const filtered = (res?.data?.users || []).filter(
          (u: any) => u.id !== Number(currentUser?.id) && !taggedUsers.some((t) => t.id === u.id)
        );
        setTagResults(filtered);
      } catch { setTagResults([]); }
      finally { setTagSearchLoading(false); }
    }, 300);
  }, [tagSearch, taggedUsers]);

  const fetchPost = async () => {
    if (!postId) return;
    try {
      setLoading(true);
      const res = await getPost(postId);
      const data = res.data;
      setPost(data);
      setIsLiked(data.liked_by_current_user);
      setLikeCount(data.like_count);
      setIsSaved(data.saved_by_current_user);
      setComments(data.comments || []);
      setCommentCount(data.comment_count || 0);
      setTaggedUsers(data.tagged_users || []);
      setMediaFiles(data.media_files || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    const prev = isLiked;
    const prevCount = likeCount;
    setIsLiked(!prev);
    setLikeCount(prev ? prevCount - 1 : prevCount + 1);
    if (!prev) {
      setLikeAnimating(true);
      setTimeout(() => setLikeAnimating(false), 360);
    }
    try {
      await likePost(post.id);
    } catch {
      setIsLiked(prev);
      setLikeCount(prevCount);
    }
  };

  const handleDoubleClickLike = async () => {
    setHeartVisible(true);
    setTimeout(() => setHeartVisible(false), 750);
    if (!isLiked) await handleLike();
  };

  const handleSave = async () => {
    const prev = isSaved;
    setIsSaved(!prev);
    try {
      const res = await savePost(post.id);
      if (res.success && !prev)
        notifications.show("Saved!", {
          severity: "success",
          autoHideDuration: 2000,
        });
      else if (!res.success) setIsSaved(prev);
    } catch {
      setIsSaved(prev);
    }
  };

  const handleReplyTo = (id: number, username: string) => {
    setReplyingTo({ id, username });
    setCommentText("");
    setTimeout(() => commentInputRef.current?.focus(), 100);
  };

  const handleComment = async () => {
    if (!commentText.trim() || submitting) return;
    const parentId = replyingTo?.id ?? null;
    const newComment = {
      id: Date.now(),
      post_id: post.id,
      user_id: currentUser.id,
      content: commentText,
      parent_comment_id: parentId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      commenter_username: currentUser.username,
      commenter_profile_picture: currentUser.profile_picture_url,
      timeAgo: "Just now",
      likes_count: 0,
      liked_by_user: false,
    };
    setComments((p) => [...p, newComment]);
    setCommentCount((c) => c + 1);
    setNewCommentIds((p) => new Set(p).add(newComment.id));
    setTimeout(() => setNewCommentIds((p) => { const s = new Set(p); s.delete(newComment.id); return s; }), 500);
    setCommentText("");
    setReplyingTo(null);
    setSubmitting(true);
    try {
      const res = await addComment(post.id, commentText, parentId);
      if (!res?.success) throw new Error();
      setNewCommentIds((p) => { const s = new Set(p); s.delete(newComment.id); s.add(res.commentId); return s; });
      setTimeout(() => setNewCommentIds((p) => { const s = new Set(p); s.delete(res.commentId); return s; }), 500);
      setComments((p) => p.map((c) => c.id === newComment.id ? { ...c, id: res.commentId } : c));
    } catch {
      setComments((p) => p.filter((c) => c.id !== newComment.id));
      setCommentCount((c) => c - 1);
      notifications.show("Error adding comment.", { severity: "error", autoHideDuration: 3000 });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    setDeletingCommentIds((p) => new Set(p).add(commentId));
    await new Promise((r) => setTimeout(r, 260));
    setDeletingCommentIds((p) => { const s = new Set(p); s.delete(commentId); return s; });
    const toDelete = comments.find((c) => c.id === commentId);
    setComments((p) => p.filter((c) => c.id !== commentId));
    setCommentCount((c) => c - 1);
    try {
      const res = await deleteComment(commentId);
      if (!res?.success) throw new Error();
    } catch {
      setComments((p) => [toDelete!, ...p]);
      setCommentCount((c) => c + 1);
      notifications.show("Error deleting comment.", {
        severity: "error",
        autoHideDuration: 3000,
      });
    }
  };

  const handleDeletePost = async () => {
    try {
      const res = await deletePost(post.id);
      if (res?.success) {
        setOptionsOpen(false);
        navigate(-1);
      }
    } catch {
      notifications.show("Error deleting post.", {
        severity: "error",
        autoHideDuration: 3000,
      });
    }
  };

  const handleSaveEdit = async () => {
    try {
      const res = await updatePost(post.id, editedContent);
      if (res?.success) {
        setIsEditing(false);
        fetchPost();
      }
    } catch (e) {
      console.error(e);
    }
  };

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: (t) => t.palette.background.default,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <style>{heartAnimStyle}</style>
        <Box
          sx={{
            height: 56,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            px: 2,
            borderBottom: "1px solid",
            borderColor: (t) => t.palette.divider,
          }}
        >
          <Skeleton
            variant="circular"
            width={34}
            height={34}
            sx={{ bgcolor: (t) => t.palette.action.hover }}
          />
          <Skeleton
            variant="text"
            width={80}
            height={18}
            sx={{ bgcolor: (t) => t.palette.action.hover }}
          />
        </Box>
        <Box
          sx={{
            display: "flex",
            flex: 1,
            flexDirection: { xs: "column", md: "row" },
          }}
        >
          <Skeleton
            variant="rectangular"
            sx={{
              flex: { xs: "none", md: 1 },
              height: { xs: 320, md: "calc(100vh - 56px)" },
              bgcolor: (t) => t.palette.action.hover,
            }}
          />
          <Box
            sx={{
              width: { xs: "100%", md: 380 },
              p: 2.5,
              bgcolor: (t) => t.palette.background.paper,
            }}
          >
            <Box sx={{ display: "flex", gap: 1.5, mb: 2.5 }}>
              <Skeleton
                variant="circular"
                width={42}
                height={42}
                sx={{ bgcolor: (t) => t.palette.action.hover }}
              />
              <Box sx={{ flex: 1 }}>
                <Skeleton
                  variant="text"
                  width="45%"
                  sx={{ bgcolor: (t) => t.palette.action.hover, mb: 0.5 }}
                />
                <Skeleton
                  variant="text"
                  width="30%"
                  sx={{ bgcolor: (t) => t.palette.action.hover }}
                />
              </Box>
            </Box>
            {[...Array(6)].map((_, i) => (
              <Skeleton
                key={i}
                variant="text"
                sx={{ bgcolor: (t) => t.palette.action.hover, mb: 0.75 }}
              />
            ))}
          </Box>
        </Box>
      </Box>
    );
  }

  if (!post) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: (t) => t.palette.background.default,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          <Typography
            sx={{
              color: (t) => t.palette.text.disabled,
              fontFamily: "'DM Sans', sans-serif",
              mb: 2,
              fontSize: "0.9rem",
            }}
          >
            Post not found
          </Typography>
          <IconButton
            onClick={() => navigate(-1)}
            sx={{ color: (t) => t.palette.text.secondary }}
          >
            <ArrowBack />
          </IconButton>
        </Box>
      </Box>
    );
  }

  const allMedia = mediaFiles.length > 1 ? mediaFiles : (post.file_url ? [post.file_url] : []);
  const currentSrc = allMedia[carouselIndex] ?? post.file_url ?? "";
  const isVideo = currentSrc && /\.(mp4|mov|webm)$/i.test(currentSrc);

  /* ── Media section ── */
  const ImageSection = (
    <Box
      sx={{
        flex: 1,
        bgcolor: "#0a0a0a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        minHeight: { xs: 300, md: "auto" },
        overflow: "hidden",
        cursor: "default",
      }}
      onDoubleClick={(!isVideo && currentSrc) ? handleDoubleClickLike : undefined}
    >
      {!isVideo && !isImageLoaded && (
        <CircularProgress size={22} sx={{ color: (t) => t.palette.text.disabled, position: "absolute", zIndex: 2 }} />
      )}
      {currentSrc && !isVideo && (
        <Box sx={{ position: "relative", maxWidth: "100%", maxHeight: "100%", display: "flex" }}>
          <Box
            component="img"
            key={currentSrc}
            src={currentSrc}
            alt="Post"
            sx={{ zIndex: 1, maxWidth: "100%", maxHeight: "100%", objectFit: "contain", opacity: isImageLoaded ? 1 : 0, transition: "opacity 0.45s ease", display: "block", userSelect: "none" }}
            onLoad={() => setIsImageLoaded(true)}
          />

          {/* Carousel arrows */}
          {allMedia.length > 1 && carouselIndex > 0 && (
            <IconButton onClick={() => { setIsImageLoaded(false); setCarouselIndex((i) => i - 1); }}
              sx={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", bgcolor: "rgba(0,0,0,0.45)", color: "#fff", width: 32, height: 32, zIndex: 4, "&:hover": { bgcolor: "rgba(0,0,0,0.7)" } }}>
              <ArrowBack sx={{ fontSize: 15 }} />
            </IconButton>
          )}
          {allMedia.length > 1 && carouselIndex < allMedia.length - 1 && (
            <IconButton onClick={() => { setIsImageLoaded(false); setCarouselIndex((i) => i + 1); }}
              sx={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", bgcolor: "rgba(0,0,0,0.45)", color: "#fff", width: 32, height: 32, zIndex: 4, "&:hover": { bgcolor: "rgba(0,0,0,0.7)" } }}>
              <ArrowBack sx={{ fontSize: 15, transform: "rotate(180deg)" }} />
            </IconButton>
          )}

          {/* Dot indicators */}
          {allMedia.length > 1 && (
            <Box sx={{ position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 0.5, zIndex: 4 }}>
              {allMedia.map((_, i) => (
                <Box key={i} onClick={() => { setIsImageLoaded(false); setCarouselIndex(i); }}
                  sx={{ width: i === carouselIndex ? 16 : 6, height: 6, borderRadius: "3px", bgcolor: i === carouselIndex ? "#fff" : "rgba(255,255,255,0.45)", cursor: "pointer", transition: "all 0.2s" }} />
              ))}
            </Box>
          )}

          {/* Slide counter */}
          {allMedia.length > 1 && (
            <Box sx={{ position: "absolute", top: 12, right: 12, bgcolor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", borderRadius: "20px", px: 1.25, py: 0.4, zIndex: 4 }}>
              <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: "#fff", fontFamily: "'Inter', sans-serif" }}>
                {carouselIndex + 1}/{allMedia.length}
              </Typography>
            </Box>
          )}

          {/* Tagged overlay */}
          {taggedUsers.length > 0 && isImageLoaded && (
            <Box onClick={(e) => { e.stopPropagation(); setTagAnchorEl(e.currentTarget); }}
              sx={{ position: "absolute", bottom: 10, right: 10, bgcolor: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)", borderRadius: "20px", display: "flex", alignItems: "center", gap: 0.5, px: 0.9, py: 0.7, cursor: "pointer", zIndex: 3, transition: "background 0.15s", "&:hover": { bgcolor: "rgba(0,0,0,0.65)" } }}>
              <TaggedIcon sx={{ fontSize: 13, color: "#fff" }} />
              <Typography sx={{ fontSize: "0.7rem", fontWeight: 600, color: "#fff", fontFamily: "'Inter', sans-serif", lineHeight: 1 }}>
                {taggedUsers.length}
              </Typography>
            </Box>
          )}
        </Box>
      )}
      {currentSrc && isVideo && <VideoPlayer src={currentSrc} />}
      {heartVisible && !isVideo && (
        <Box
          sx={{
            position: "absolute",
            zIndex: 10,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            fontSize: "5rem",
            lineHeight: 1,
          }}
          className="heart-pop"
        >
          ❤️
        </Box>
      )}

      {/* ── Tagged people popover ── */}
      <Popover
        open={Boolean(tagAnchorEl)}
        anchorEl={tagAnchorEl}
        onClose={() => setTagAnchorEl(null)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "bottom", horizontal: "right" }}
        PaperProps={{
          sx: {
            borderRadius: "14px",
            border: "1px solid",
            borderColor: (t) => t.palette.divider,
            boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
            overflow: "hidden",
            minWidth: 180,
          }
        }}
      >
        {taggedUsers.map((u) => (
          <Box
            key={u.id}
            onClick={() => { setTagAnchorEl(null); navigate(`/profile/${u.id}`); }}
            sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 0.875, cursor: "pointer", "&:hover": { bgcolor: (t) => t.palette.action.hover } }}
          >
            <Avatar src={u.profile_picture} sx={{ width: 28, height: 28, fontSize: "0.7rem" }}>
              {u.username.slice(0, 2).toUpperCase()}
            </Avatar>
            <Typography sx={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.83rem", fontWeight: 500, color: (t) => t.palette.text.primary }}>
              {u.username}
            </Typography>
          </Box>
        ))}
      </Popover>
    </Box>
  );

  /* ── Side panel ── */
  const SidePanel = (
    <Box
      sx={{
        width: { xs: "100%", md: 360 },
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        bgcolor: (t) => t.palette.background.paper,
        borderTop: { xs: "1px solid", md: "none" },
        borderColor: { md: (t) => t.palette.divider },
        height: { xs: "auto", md: "100%" },
        overflow: "hidden",
      }}
    >
      {/* ── Post author header ── */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
          borderBottom: "1px solid",
          borderColor: (t) => t.palette.divider,
        }}
      >
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 1.25, cursor: "pointer", flex: 1, minWidth: 0 }}
          onClick={() => navigate(`/profile/${post.user_id}`)}
        >
          <Avatar
            src={post.profile_picture || BlankProfileImage}
            sx={{ width: 36, height: 36, border: "2px solid", borderColor: (t) => t.palette.divider }}
          />
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: "0.875rem", color: (t) => t.palette.text.primary, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {post.username}
            </Typography>
            {post.location && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.3, mt: 0.2 }}>
                <LocationOn sx={{ fontSize: "0.65rem", color: tokens.accent }} />
                <Typography sx={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.65rem", color: (t) => t.palette.text.disabled }}>
                  {post.location}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
        {isOwner && (
          <IconButton onClick={() => setOptionsOpen(true)} size="small" sx={{ color: (t) => t.palette.text.disabled, ml: 1, flexShrink: 0, "&:hover": { bgcolor: (t) => t.palette.action.hover, color: (t) => t.palette.text.secondary }, borderRadius: "8px", p: 0.6 }}>
            <MoreHoriz sx={{ fontSize: 18 }} />
          </IconButton>
        )}
      </Box>

      {/* ── Caption ── */}
      {post.content && (
        <Box sx={{ px: 2, py: 1.5, flexShrink: 0, borderBottom: "1px solid", borderColor: (t) => t.palette.divider }}>
          <Box sx={{ display: "flex", gap: 1.25, alignItems: "flex-start" }}>
            <Avatar
              src={post.profile_picture || BlankProfileImage}
              onClick={() => navigate(`/profile/${post.user_id}`)}
              sx={{ width: 28, height: 28, cursor: "pointer", flexShrink: 0, mt: 0.2 }}
            />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.84rem", color: (t) => t.palette.text.secondary, lineHeight: 1.65 }}>
                <Box component="span" onClick={() => navigate(`/profile/${post.user_id}`)} sx={{ fontWeight: 700, color: (t) => t.palette.text.primary, mr: 0.75, cursor: "pointer", "&:hover": { color: tokens.accent } }}>
                  {post.username}
                </Box>
                {post.content}
              </Typography>
              <Typography sx={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.62rem", color: (t) => t.palette.text.disabled, mt: 0.5, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                {post.timeAgo}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}

      {/* ── Comments ── */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          px: 1.5,
          py: 1,
          "&::-webkit-scrollbar": { width: 3 },
          "&::-webkit-scrollbar-track": { bgcolor: "transparent" },
          "&::-webkit-scrollbar-thumb": {
            bgcolor: (t) => t.palette.action.selected,
            borderRadius: 4,
            "&:hover": { bgcolor: (t) => t.palette.text.disabled },
          },
        }}
      >
        {comments.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              py: 7,
              gap: 1.25,
            }}
          >
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                bgcolor: (t) => t.palette.action.hover,
                border: "1px solid",
                borderColor: (t) => t.palette.divider,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ChatBubbleOutline
                sx={{ fontSize: 20, color: (t) => t.palette.text.disabled }}
              />
            </Box>
            <Typography
              sx={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.85rem",
                color: (t) => t.palette.text.secondary,
                fontWeight: 500,
              }}
            >
              No comments yet
            </Typography>
            <Typography
              sx={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.75rem",
                color: (t) => t.palette.text.disabled,
              }}
            >
              Start the conversation
            </Typography>
          </Box>
        ) : (
          comments
            .filter((c) => !c.parent_comment_id)
            .map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                isOwner={currentUser?.id === comment.user_id || isOwner}
                onDelete={handleDeleteComment}
                onReply={handleReplyTo}
                replies={comments.filter((c) => c.parent_comment_id === comment.id)}
                isNew={newCommentIds.has(comment.id)}
                isDeleting={deletingCommentIds.has(comment.id)}
              />
            ))
        )}
      </Box>

      {/* ── Action bar + comment input ── */}
      <Box
        sx={{
          flexShrink: 0,
          bgcolor: (t) => t.palette.background.paper,
          borderTop: "1px solid",
          borderColor: (t) => t.palette.divider,
        }}
      >
        {/* Actions row */}
        <Box
          sx={{
            px: 2,
            pt: 1,
            pb: 0.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <IconButton
                onClick={handleLike}
                disableRipple
                className={likeAnimating ? "like-btn-pop" : ""}
                sx={{
                  p: 0.9,
                  color: isLiked ? (t) => t.palette.error.main : (t) => t.palette.text.disabled,
                  transition: "color 0.15s",
                  "&:hover": { bgcolor: "transparent", color: isLiked ? (t) => t.palette.error.light : (t) => t.palette.text.secondary },
                }}
              >
                {isLiked ? <Favorite sx={{ fontSize: 21 }} /> : <FavoriteBorder sx={{ fontSize: 21 }} />}
              </IconButton>
              {likeCount > 0 && (
                <Typography sx={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.78rem", color: (t) => t.palette.text.secondary, fontWeight: 500 }}>
                  {likeCount}
                </Typography>
              )}
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <IconButton
                disableRipple
                onClick={() => commentInputRef.current?.focus()}
                sx={{
                  p: 0.9,
                  color: (t) => t.palette.text.disabled,
                  "&:hover": { bgcolor: "transparent", color: (t) => t.palette.text.secondary },
                }}
              >
                <ChatBubbleOutline sx={{ fontSize: 20 }} />
              </IconButton>
              {commentCount > 0 && (
                <Typography sx={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.78rem", color: (t) => t.palette.text.secondary, fontWeight: 500 }}>
                  {commentCount}
                </Typography>
              )}
            </Box>
          </Box>
          <IconButton
            disableRipple
            onClick={handleSave}
            sx={{
              p: 0.9,
              color: isSaved ? tokens.accent : (t) => t.palette.text.disabled,
              transition: "color 0.15s, transform 0.2s",
              "&:hover": {
                bgcolor: "transparent",
                color: isSaved
                  ? tokens.accent
                  : (t) => t.palette.text.secondary,
                transform: "scale(1.1)",
              },
            }}
          >
            {isSaved ? (
              <Bookmark sx={{ fontSize: 21 }} />
            ) : (
              <BookmarkBorderOutlined sx={{ fontSize: 21 }} />
            )}
          </IconButton>
        </Box>

        {/* Replying to indicator */}
        {replyingTo && (
          <Box sx={{
            mx: 2, mt: 0.75, mb: 0.25,
            pl: 1.25, py: 0.5,
            borderLeft: "2px solid #64748B",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <Typography sx={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.73rem", color: (t) => t.palette.text.disabled }}>
              Replying to{" "}
              <Box component="span" sx={{ color: "#64748B", fontWeight: 600 }}>@{replyingTo.username}</Box>
            </Typography>
            <IconButton size="small" onClick={() => setReplyingTo(null)} sx={{ p: 0.3, color: (t) => t.palette.text.disabled, "&:hover": { color: (t) => t.palette.text.secondary } }}>
              <CloseRoundedIcon sx={{ fontSize: 12 }} />
            </IconButton>
          </Box>
        )}

        {/* Comment input */}
        <Box
          sx={{
            px: 2,
            pb: 2,
            pt: 0.5,
            display: "flex",
            alignItems: "center",
            gap: 1.25,
          }}
        >
          <Box
            sx={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              backgroundColor: "var(--nav-bg)",
              borderRadius: "14px",
              border: "none",
              boxShadow: "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)",
              px: 1.75,
              py: 0.6,
              transition: "box-shadow 0.2s ease",
              "&:focus-within": {
                boxShadow: "inset 3px 3px 10px var(--nav-neo-shadow1), inset -3px -3px 10px var(--nav-neo-shadow2)",
              },
            }}
          >
            <TextField
              inputRef={commentInputRef}
              fullWidth
              variant="standard"
              placeholder={replyingTo ? `Reply to @${replyingTo.username}…` : "Add a comment…"}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleComment();
                }
              }}
              InputProps={{
                disableUnderline: true,
                sx: {
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.82rem",
                  color: (t) => t.palette.text.primary,
                  "& input::placeholder": {
                    color: (t) => t.palette.text.disabled,
                    fontSize: "0.82rem",
                  },
                },
              }}
            />
          </Box>
          <IconButton
            onClick={handleComment}
            disabled={!commentText.trim() || submitting}
            size="small"
            sx={{
              p: 0.85,
              backgroundColor: "var(--nav-bg)",
              border: "none",
              color: commentText.trim() ? tokens.accent : (t) => t.palette.text.disabled,
              borderRadius: "10px",
              boxShadow: "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)",
              transition: "box-shadow 0.35s cubic-bezier(0.4,0,0.2,1), color 0.2s ease",
              "&:hover": {
                backgroundColor: "var(--nav-bg)",
                boxShadow: "inset 3px 3px 10px var(--nav-neo-shadow1), inset -3px -3px 10px var(--nav-neo-shadow2)",
              },
              "&.Mui-disabled": {
                backgroundColor: "var(--nav-bg)",
                color: (t) => t.palette.action.disabled,
                boxShadow: "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)",
              },
            }}
          >
            <SendRounded sx={{ fontSize: 17 }} />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Fade in timeout={280}>
      <Box
        sx={{
          height: "100vh",
          overflow: "hidden",
          bgcolor: (t) => t.palette.background.default,
          display: "flex",
          flexDirection: "column",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <style>{heartAnimStyle}</style>

        {/* ── Main layout ── */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            py: { xs: 2, md: 3 },
            px: { xs: 1, md: 3 },
            overflow: "hidden",
          }}
        >
          {/* Centered content wrapper */}
          <Box sx={{ maxWidth: 1100, width: "100%", mx: "auto", position: "relative", display: "flex", flexDirection: "column", height: "100%" }}>
            {/* Floating back button */}
            <IconButton
              onClick={() => navigate(-1)}
              size="small"
              sx={{
                mb: 1.5,
                alignSelf: "flex-start",
                color: (t) => t.palette.text.secondary,
                backgroundColor: "var(--nav-bg)",
                border: "none",
                boxShadow: "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)",
                transition: "box-shadow 0.35s cubic-bezier(0.4,0,0.2,1), color 0.2s ease",
                "&:hover": {
                  backgroundColor: "var(--nav-bg)",
                  boxShadow: "inset 3px 3px 10px var(--nav-neo-shadow1), inset -3px -3px 10px var(--nav-neo-shadow2)",
                  color: (t) => t.palette.text.primary,
                },
                borderRadius: "10px",
                p: 0.75,
              }}
            >
              <ChevronLeft sx={{ fontSize: 22 }} />
            </IconButton>

            {/* Main card */}
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: (t) =>
                  t.palette.mode === "dark"
                    ? "0 8px 48px rgba(0,0,0,0.65)"
                    : "0 4px 40px rgba(0,0,0,0.13)",
              }}
            >
              {ImageSection}
              {SidePanel}
            </Box>
          </Box>
        </Box>

        {/* ── Options sheet ── */}
        {isOwner && (
          <Dialog
            open={optionsOpen}
            onClose={() => {
              setOptionsOpen(false);
              setConfirmDelete(false);
            }}
            fullWidth
            maxWidth="xs"
            BackdropProps={backdropProps}
            sx={{ "& .MuiDialog-paper": paperSx }}
          >
            <SheetButton
              icon={
                <EditRoundedIcon
                  sx={{
                    fontSize: "1rem",
                    color: (t: any) => t.palette.text.secondary,
                  }}
                />
              }
              label="Edit caption"
              onClick={() => {
                setIsEditing(true);
                setEditedContent(post.content);
                setOptionsOpen(false);
                setConfirmDelete(false);
              }}
            />
            <SheetButton
              icon={<TagPeopleIcon sx={{ fontSize: "1rem", color: (t: any) => t.palette.text.secondary }} />}
              label="Tag people"
              onClick={() => {
                setTagDialogOpen(true);
                setOptionsOpen(false);
                setConfirmDelete(false);
                setTagSearch("");
                setTagResults([]);
              }}
            />
            <SheetButton
              icon={
                confirmDelete ? (
                  <WarningRoundedIcon sx={{ fontSize: "1rem" }} />
                ) : (
                  <DeleteRoundedIcon sx={{ fontSize: "1rem" }} />
                )
              }
              label={
                confirmDelete ? "Tap again to confirm delete" : "Delete post"
              }
              onClick={() =>
                confirmDelete ? handleDeletePost() : setConfirmDelete(true)
              }
              variant={confirmDelete ? "warning" : "danger"}
            />
            <Divider />
            <SheetButton
              icon={<CloseRoundedIcon sx={{ fontSize: "1rem" }} />}
              label="Cancel"
              onClick={() => {
                setOptionsOpen(false);
                setConfirmDelete(false);
              }}
              variant="muted"
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
          BackdropProps={backdropProps}
          sx={{
            "& .MuiDialog-paper": {
              ...paperSx,
              padding: 0,
              width: "92%",
              maxWidth: "500px",
            },
          }}
        >
          {post.file_url && (
            <Box sx={{ position: "relative" }}>
              {isVideo ? (
                <Box
                  component="video"
                  src={post.file_url}
                  muted
                  playsInline
                  sx={{
                    width: "100%",
                    height: 180,
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              ) : (
                <Box
                  component="img"
                  src={post.file_url}
                  sx={{
                    width: "100%",
                    height: 180,
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              )}
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)",
                }}
              />
              <IconButton
                onClick={() => setIsEditing(false)}
                size="small"
                sx={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  bgcolor: "rgba(0,0,0,0.5)",
                  backdropFilter: "blur(6px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#fff",
                  width: 28,
                  height: 28,
                  "&:hover": { bgcolor: "rgba(0,0,0,0.75)" },
                }}
              >
                <Close sx={{ fontSize: 14 }} />
              </IconButton>
            </Box>
          )}

          <Box
            sx={{
              px: 2.5,
              py: 2,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <Typography
              sx={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600,
                fontSize: "0.8rem",
                color: (t) => t.palette.text.disabled,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Edit caption
            </Typography>
            <Box
              sx={{
                bgcolor: (t) => t.palette.action.hover,
                border: "1px solid",
                borderColor: (t) => t.palette.divider,
                borderRadius: "12px",
                px: 1.75,
                py: 1.25,
                "&:focus-within": { borderColor: "rgba(212,169,106,0.3)" },
                transition: "border-color 0.2s",
              }}
            >
              <TextField
                fullWidth
                multiline
                minRows={3}
                variant="standard"
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                placeholder="Write a caption…"
                InputProps={{
                  disableUnderline: true,
                  sx: {
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "0.9rem",
                    color: (t) => t.palette.text.primary,
                    lineHeight: 1.65,
                    "& textarea::placeholder": {
                      color: (t) => t.palette.text.disabled,
                    },
                  },
                }}
              />
            </Box>
            <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
              <Button
                onClick={() => setIsEditing(false)}
                sx={{
                  textTransform: "none",
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 500,
                  fontSize: "0.82rem",
                  color: (t) => t.palette.text.disabled,
                  borderRadius: "10px",
                  px: 2,
                  py: 0.9,
                  "&:hover": { bgcolor: (t) => t.palette.action.hover },
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={editedContent === post.content}
                sx={{
                  textTransform: "none",
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 600,
                  fontSize: "0.82rem",
                  borderRadius: "10px",
                  px: 2.5,
                  py: 0.9,
                  bgcolor: tokens.accent,
                  color: (t) => t.palette.background.default,
                  "&:hover": { bgcolor: "#E0B870" },
                  "&:disabled": {
                    bgcolor: (t) => t.palette.action.disabledBackground,
                    color: (t) => t.palette.action.disabled,
                  },
                  transition: "background 0.18s",
                }}
              >
                Save
              </Button>
            </Box>
          </Box>
        </Dialog>

        {/* ── Tag people dialog ── */}
        <Dialog
          open={tagDialogOpen}
          onClose={() => setTagDialogOpen(false)}
          fullWidth
          maxWidth="xs"
          BackdropProps={backdropProps}
          sx={{ "& .MuiDialog-paper": { ...paperSx, padding: 0, width: "92%", maxWidth: "420px" } }}
        >
          {/* Header */}
          <Box sx={{
            px: 2.5, pt: 2.25, pb: 1.75,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <Box>
              <Typography sx={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: "1rem", lineHeight: 1.2 }}>
                Tag people
              </Typography>
              <Typography sx={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.73rem", color: (t) => t.palette.text.disabled, mt: 0.3 }}>
                {taggedUsers.length > 0 ? `${taggedUsers.length} tagged` : "Search to tag someone"}
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => setTagDialogOpen(false)}
              sx={{ borderRadius: "8px", color: (t) => t.palette.text.disabled, "&:hover": { color: (t) => t.palette.text.primary, bgcolor: (t) => t.palette.action.hover } }}>
              <CloseRoundedIcon sx={{ fontSize: 17 }} />
            </IconButton>
          </Box>

          {/* Search bar */}
          <Box sx={{ px: 2, pb: 1 }}>
            <Box sx={{
              display: "flex", alignItems: "center", gap: 1,
              bgcolor: (t) => t.palette.action.hover,
              borderRadius: "12px", px: 1.5, py: 0.75,
              border: "1.5px solid", borderColor: tagSearch ? tokens.accent : "transparent",
              transition: "border-color 0.15s",
            }}>
              <TagPeopleIcon sx={{ fontSize: 16, color: tagSearch ? tokens.accent : (t: any) => t.palette.text.disabled, flexShrink: 0 }} />
              <Box
                component="input"
                autoFocus
                placeholder="Search users…"
                value={tagSearch}
                onChange={(e: any) => setTagSearch(e.target.value)}
                sx={{
                  flex: 1, border: "none", outline: "none", background: "transparent",
                  fontFamily: "'DM Sans', sans-serif", fontSize: "0.875rem",
                  color: (t: any) => t.palette.text.primary,
                  "&::placeholder": { color: (t: any) => t.palette.text.disabled },
                }}
              />
              {tagSearchLoading && <CircularProgress size={13} sx={{ color: tokens.accent, flexShrink: 0 }} />}
              {tagSearch && !tagSearchLoading && (
                <IconButton size="small" onClick={() => { setTagSearch(""); setTagResults([]); }}
                  sx={{ p: 0.25, color: (t) => t.palette.text.disabled }}>
                  <CloseRoundedIcon sx={{ fontSize: 13 }} />
                </IconButton>
              )}
            </Box>
          </Box>

          {/* Body — search results or tagged list */}
          <Box sx={{ minHeight: 120, maxHeight: 300, overflowY: "auto" }}>
            {/* Search results */}
            {tagResults.length > 0 && tagResults.map((u) => (
              <Box
                key={u.id}
                onClick={() => { setTaggedUsers((p) => [...p, u]); setTagSearch(""); setTagResults([]); }}
                sx={{
                  display: "flex", alignItems: "center", gap: 1.5,
                  px: 2.5, py: 1.125, cursor: "pointer",
                  transition: "background 0.12s",
                  "&:hover": { bgcolor: (t) => t.palette.action.hover },
                }}
              >
                <Avatar src={u.profile_picture}
                  sx={{ width: 36, height: 36, fontSize: "0.8rem", border: "1.5px solid", borderColor: (t) => t.palette.divider }}>
                  {u.username.slice(0, 2).toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.875rem", fontWeight: 600, lineHeight: 1.2 }}>
                    {u.username}
                  </Typography>
                </Box>
                <Box sx={{
                  fontSize: "0.72rem", fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
                  color: tokens.accent, bgcolor: `${tokens.accent}14`,
                  border: `1px solid ${tokens.accent}28`,
                  borderRadius: "20px", px: 1.25, py: 0.35,
                }}>
                  Tag
                </Box>
              </Box>
            ))}

            {/* Tagged users list */}
            {!tagSearch && taggedUsers.length > 0 && taggedUsers.map((u) => (
              <Box
                key={u.id}
                sx={{
                  display: "flex", alignItems: "center", gap: 1.5,
                  px: 2.5, py: 1.125,
                }}
              >
                <Avatar src={u.profile_picture}
                  sx={{ width: 36, height: 36, fontSize: "0.8rem", border: `1.5px solid ${tokens.accent}40` }}>
                  {u.username.slice(0, 2).toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.875rem", fontWeight: 600, lineHeight: 1.2 }}>
                    @{u.username}
                  </Typography>
                </Box>
                <IconButton size="small"
                  onClick={() => setTaggedUsers((p) => p.filter((t) => t.id !== u.id))}
                  sx={{
                    width: 28, height: 28, borderRadius: "8px",
                    color: (t) => t.palette.text.disabled,
                    "&:hover": { bgcolor: (t) => t.palette.error.main + "18", color: (t) => t.palette.error.main },
                  }}>
                  <CloseRoundedIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Box>
            ))}

            {/* Empty state */}
            {!tagSearch && taggedUsers.length === 0 && (
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 3, gap: 1 }}>
                <Box sx={{
                  width: 44, height: 44, borderRadius: "14px",
                  bgcolor: `${tokens.accent}12`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <TagPeopleIcon sx={{ fontSize: 20, color: tokens.accent }} />
                </Box>
                <Typography sx={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem", color: (t) => t.palette.text.disabled }}>
                  No one tagged yet
                </Typography>
              </Box>
            )}
          </Box>

          {/* Footer */}
          <Box sx={{
            px: 2.5, py: 1.75,
            borderTop: "1px solid", borderColor: (t) => t.palette.divider,
            display: "flex", justifyContent: "flex-end", gap: 1,
          }}>
            <Button variant="text" onClick={() => setTagDialogOpen(false)}
              sx={{ textTransform: "none", fontFamily: "'DM Sans', sans-serif", fontSize: "0.84rem", borderRadius: "10px", color: (t) => t.palette.text.secondary, px: 2 }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              disabled={savingTags}
              onClick={async () => {
                setSavingTags(true);
                try {
                  const res = await updatePostTags(post.id, taggedUsers.map((u) => u.id));
                  if (res?.success) setTaggedUsers(res.data);
                } catch { /* noop */ }
                finally { setSavingTags(false); setTagDialogOpen(false); }
              }}
              sx={{
                textTransform: "none", fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
                fontSize: "0.84rem", borderRadius: "10px", px: 2.5,
                bgcolor: tokens.accent, color: "#fff", boxShadow: "none",
                "&:hover": { bgcolor: "#6b4de0", boxShadow: "none" },
                "&.Mui-disabled": { bgcolor: `${tokens.accent}35`, color: "rgba(255,255,255,0.5)" },
              }}
            >
              {savingTags ? <CircularProgress size={14} sx={{ color: "#fff" }} /> : "Save tags"}
            </Button>
          </Box>
        </Dialog>
      </Box>
    </Fade>
  );
};

export default PostDetailPage;
