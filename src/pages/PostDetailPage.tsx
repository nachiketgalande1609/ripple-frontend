import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Avatar, Typography, IconButton, TextField, CircularProgress, Fade, Skeleton, Dialog, Button, Tooltip } from "@mui/material";
import {
    ArrowBack,
    FavoriteBorder,
    Favorite,
    ChatBubbleOutline,
    BookmarkBorderOutlined,
    Bookmark,
    MoreHoriz,
    LocationOn,
    Close,
    SendRounded,
} from "@mui/icons-material";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import WarningRoundedIcon from "@mui/icons-material/WarningRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import BlankProfileImage from "../static/profile_blank.png";
import { getPost, likePost, addComment, savePost, deletePost, updatePost, deleteComment } from "../services/api";
import { useAppNotifications } from "../hooks/useNotification";

/* ─── Design tokens ──────────────────────────────────────────── */
const tokens = {
    bg0: "#0C0C0C",
    bg1: "#111113",
    bg2: "#18181B",
    bg3: "#212126",
    border: "rgba(255,255,255,0.07)",
    borderHover: "rgba(255,255,255,0.13)",
    textPrimary: "#F2F0EB",
    textSecondary: "#9B9893",
    textMuted: "#525050",
    accent: "#D4A96A",
    accentDim: "rgba(212,169,106,0.15)",
    danger: "#E05252",
    dangerDim: "rgba(224,82,82,0.12)",
    fontDisplay: "'Playfair Display', Georgia, serif",
    fontBody: "'DM Sans', sans-serif",
};

/* ─── Dialog backdrop ──────────────────────────────────────────── */
const backdropProps = {
    sx: { backdropFilter: "blur(12px)", backgroundColor: "rgba(0,0,0,0.65)" },
};

const paperSx = {
    borderRadius: "18px",
    background: tokens.bg2,
    border: `1px solid ${tokens.border}`,
    boxShadow: "0 32px 80px rgba(0,0,0,0.8)",
    color: tokens.textPrimary,
    overflow: "hidden",
    p: "6px",
    width: "90%",
    maxWidth: "360px",
};

/* ─── Small reusable pieces ──────────────────────────────────── */
const Divider = () => <Box sx={{ height: "1px", bgcolor: tokens.border, mx: 1.5, my: 0.5 }} />;

const SheetButton = ({
    icon,
    label,
    onClick,
    variant = "default",
}: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    variant?: "default" | "danger" | "warning" | "muted";
}) => {
    const colors = {
        default: { color: tokens.textSecondary, hover: "rgba(255,255,255,0.05)", hoverColor: tokens.textPrimary },
        danger: { color: tokens.danger, hover: tokens.dangerDim, hoverColor: "#FF7B7B" },
        warning: { color: "#F2A65A", hover: "rgba(242,166,90,0.15)", hoverColor: "#FFB97A" },
        muted: { color: tokens.textMuted, hover: "rgba(255,255,255,0.03)", hoverColor: tokens.textSecondary },
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
                fontFamily: tokens.fontBody,
                fontWeight: 500,
                fontSize: "0.875rem",
                color: c.color,
                bgcolor: "transparent",
                transition: "all 0.18s ease",
                "&:hover": { bgcolor: c.hover, color: c.hoverColor },
            }}
        >
            <Box
                sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "9px",
                    bgcolor: "rgba(255,255,255,0.04)",
                    border: `1px solid ${tokens.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                }}
            >
                {icon}
            </Box>
            {label}
        </Button>
    );
};

/* ─── Comment Item ──────────────────────────────────────────── */
const CommentItem = ({ comment, isOwner, onDelete }: { comment: any; isOwner: boolean; onDelete: (id: number) => void }) => {
    const navigate = useNavigate();
    const [hovered, setHovered] = useState(false);

    return (
        <Fade in timeout={280}>
            <Box
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                sx={{
                    display: "flex",
                    gap: 1.5,
                    py: 1.2,
                    px: 1,
                    borderRadius: "12px",
                    position: "relative",
                    transition: "background 0.15s",
                    "&:hover": { bgcolor: "rgba(255,255,255,0.025)" },
                }}
            >
                <Avatar
                    src={comment.commenter_profile_picture || BlankProfileImage}
                    sx={{
                        width: 30,
                        height: 30,
                        cursor: "pointer",
                        flexShrink: 0,
                        mt: 0.2,
                        border: `1.5px solid ${tokens.border}`,
                    }}
                    onClick={() => navigate(`/profile/${comment.user_id}`)}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                        component="p"
                        sx={{
                            fontFamily: tokens.fontBody,
                            fontSize: "0.82rem",
                            color: tokens.textSecondary,
                            lineHeight: 1.6,
                            wordBreak: "break-word",
                        }}
                    >
                        <Box
                            component="span"
                            onClick={() => navigate(`/profile/${comment.user_id}`)}
                            sx={{
                                fontWeight: 600,
                                color: tokens.textPrimary,
                                mr: 0.7,
                                cursor: "pointer",
                                "&:hover": { color: tokens.accent },
                                transition: "color 0.15s",
                            }}
                        >
                            {comment.commenter_username}
                        </Box>
                        {comment.content}
                    </Typography>
                    <Typography sx={{ fontFamily: tokens.fontBody, fontSize: "0.68rem", color: tokens.textMuted, mt: 0.35 }}>
                        {comment.timeAgo}
                    </Typography>
                </Box>
                {isOwner && hovered && (
                    <Tooltip title="Delete">
                        <IconButton
                            onClick={() => onDelete(comment.id)}
                            size="small"
                            sx={{
                                color: tokens.textMuted,
                                p: 0.5,
                                alignSelf: "center",
                                "&:hover": { color: tokens.danger, bgcolor: tokens.dangerDim },
                            }}
                        >
                            <DeleteRoundedIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                    </Tooltip>
                )}
            </Box>
        </Fade>
    );
};

/* ─── Like heart pop animation ──────────────────────────────── */
const heartAnimStyle = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
@keyframes heartPop {
    0%   { transform: scale(0.6); opacity:0; }
    40%  { transform: scale(1.35); opacity:1; }
    70%  { transform: scale(0.9); opacity:1; }
    100% { transform: scale(1); opacity:0; }
}
.heart-pop {
    animation: heartPop 0.72s cubic-bezier(0.34,1.56,0.64,1) forwards;
}
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
    const { postId } = useParams<{ postId: string }>();
    const navigate = useNavigate();
    const notifications = useAppNotifications();
    const commentInputRef = useRef<HTMLInputElement>(null);

    const currentUser = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") || "") : {};

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
    const [optionsOpen, setOptionsOpen] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const isOwner = currentUser?.id === post?.user_id;

    useEffect(() => {
        fetchPost();
    }, [postId]);

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
            if (res.success && !prev) {
                notifications.show("Saved!", { severity: "success", autoHideDuration: 2000 });
            } else if (!res.success) setIsSaved(prev);
        } catch {
            setIsSaved(prev);
        }
    };

    const handleComment = async () => {
        if (!commentText.trim() || submitting) return;
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
        setComments((p) => [newComment, ...p]);
        setCommentCount((c) => c + 1);
        setCommentText("");
        setSubmitting(true);
        try {
            const res = await addComment(post.id, commentText);
            if (res?.success) fetchPost();
            else throw new Error();
        } catch {
            setComments((p) => p.filter((c) => c.id !== newComment.id));
            setCommentCount((c) => c - 1);
            notifications.show("Error adding comment.", { severity: "error", autoHideDuration: 3000 });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteComment = async (commentId: number) => {
        const toDelete = comments.find((c) => c.id === commentId);
        setComments((p) => p.filter((c) => c.id !== commentId));
        setCommentCount((c) => c - 1);
        try {
            const res = await deleteComment(commentId);
            if (!res?.success) throw new Error();
        } catch {
            setComments((p) => [toDelete!, ...p]);
            setCommentCount((c) => c + 1);
            notifications.show("Error deleting comment.", { severity: "error", autoHideDuration: 3000 });
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
            notifications.show("Error deleting post.", { severity: "error", autoHideDuration: 3000 });
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
            <Box sx={{ minHeight: "100vh", bgcolor: tokens.bg0, display: "flex", flexDirection: "column" }}>
                <style>{heartAnimStyle}</style>
                <Box
                    sx={{
                        height: 56,
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        px: 2,
                        borderBottom: `1px solid ${tokens.border}`,
                    }}
                >
                    <Skeleton variant="circular" width={34} height={34} sx={{ bgcolor: tokens.bg3 }} />
                    <Skeleton variant="text" width={80} height={18} sx={{ bgcolor: tokens.bg3 }} />
                </Box>
                <Box sx={{ display: "flex", flex: 1, flexDirection: { xs: "column", md: "row" } }}>
                    <Skeleton
                        variant="rectangular"
                        sx={{
                            flex: { xs: "none", md: 1 },
                            height: { xs: 320, md: "calc(100vh - 56px)" },
                            bgcolor: tokens.bg1,
                        }}
                    />
                    <Box sx={{ width: { xs: "100%", md: 380 }, p: 2.5, bgcolor: tokens.bg1 }}>
                        <Box sx={{ display: "flex", gap: 1.5, mb: 2.5 }}>
                            <Skeleton variant="circular" width={42} height={42} sx={{ bgcolor: tokens.bg3 }} />
                            <Box sx={{ flex: 1 }}>
                                <Skeleton variant="text" width="45%" sx={{ bgcolor: tokens.bg3, mb: 0.5 }} />
                                <Skeleton variant="text" width="30%" sx={{ bgcolor: tokens.bg2 }} />
                            </Box>
                        </Box>
                        {[...Array(6)].map((_, i) => (
                            <Skeleton key={i} variant="text" sx={{ bgcolor: i % 3 === 2 ? tokens.bg2 : tokens.bg3, mb: 0.75 }} />
                        ))}
                    </Box>
                </Box>
            </Box>
        );
    }

    if (!post) {
        return (
            <Box sx={{ minHeight: "100vh", bgcolor: tokens.bg0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Box sx={{ textAlign: "center" }}>
                    <Typography sx={{ color: tokens.textMuted, fontFamily: tokens.fontBody, mb: 2, fontSize: "0.9rem" }}>Post not found</Typography>
                    <IconButton onClick={() => navigate(-1)} sx={{ color: tokens.textSecondary }}>
                        <ArrowBack />
                    </IconButton>
                </Box>
            </Box>
        );
    }

    /* ── Image section ── */
    const ImageSection = (
        <Box
            sx={{
                flex: 1,
                bgcolor: "#090909",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                minHeight: { xs: 300, md: "auto" },
                overflow: "hidden",
                cursor: "default",
            }}
            onDoubleClick={handleDoubleClickLike}
        >
            {/* Blurred ambient bg */}
            {post.file_url && (
                <Box
                    component="img"
                    src={post.file_url}
                    sx={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        filter: "blur(60px) saturate(0.4)",
                        transform: "scale(1.2)",
                        opacity: 0.18,
                        pointerEvents: "none",
                    }}
                />
            )}

            {/* Loading spinner */}
            {!isImageLoaded && <CircularProgress size={22} sx={{ color: "rgba(255,255,255,0.15)", position: "absolute", zIndex: 2 }} />}

            {/* Main image */}
            {post.file_url && (
                <Box
                    component="img"
                    src={post.file_url}
                    alt="Post"
                    sx={{
                        position: "relative",
                        zIndex: 1,
                        maxWidth: "100%",
                        maxHeight: { xs: 420, md: "calc(100vh - 56px)" },
                        objectFit: "contain",
                        opacity: isImageLoaded ? 1 : 0,
                        transition: "opacity 0.45s ease",
                        display: "block",
                        borderRadius: { xs: 0, md: "16px" },
                        userSelect: "none",
                    }}
                    onLoad={() => setIsImageLoaded(true)}
                />
            )}

            {/* Double-click heart */}
            {heartVisible && (
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
        </Box>
    );

    /* ── Side panel ── */
    const SidePanel = (
        <Box
            sx={{
                width: { xs: "100%", md: 400 },
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                bgcolor: tokens.bg1,
                borderLeft: { xs: "none", md: `1px solid ${tokens.border}` },
                borderTop: { xs: `1px solid ${tokens.border}`, md: "none" },
                height: { xs: "auto", md: "calc(100vh - 56px)" },
                overflow: "hidden",
            }}
        >
            {/* ── Post author header ── */}
            <Box
                sx={{
                    px: 2.5,
                    py: 1.75,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottom: `1px solid ${tokens.border}`,
                    flexShrink: 0,
                }}
            >
                <Box
                    sx={{ display: "flex", alignItems: "center", gap: 1.5, cursor: "pointer", flex: 1, minWidth: 0 }}
                    onClick={() => navigate(`/profile/${post.user_id}`)}
                >
                    <Box sx={{ position: "relative", flexShrink: 0 }}>
                        <Avatar src={post.profile_picture || BlankProfileImage} sx={{ width: 40, height: 40, border: `2px solid ${tokens.bg3}` }} />
                        {/* Subtle accent ring on hover via wrapper */}
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography
                            sx={{
                                fontFamily: tokens.fontBody,
                                fontWeight: 600,
                                fontSize: "0.9rem",
                                color: tokens.textPrimary,
                                lineHeight: 1.25,
                                letterSpacing: "-0.01em",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {post.username}
                        </Typography>
                        {post.location && (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.3, mt: 0.15 }}>
                                <LocationOn sx={{ fontSize: "0.6rem", color: tokens.accent }} />
                                <Typography
                                    sx={{
                                        fontFamily: tokens.fontBody,
                                        fontSize: "0.68rem",
                                        color: tokens.textMuted,
                                        letterSpacing: "0.02em",
                                    }}
                                >
                                    {post.location}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Box>

                {isOwner && (
                    <IconButton
                        onClick={() => setOptionsOpen(true)}
                        size="small"
                        sx={{
                            color: tokens.textMuted,
                            ml: 1,
                            flexShrink: 0,
                            "&:hover": { bgcolor: "rgba(255,255,255,0.05)", color: tokens.textSecondary },
                            borderRadius: "10px",
                            p: 0.75,
                        }}
                    >
                        <MoreHoriz sx={{ fontSize: 19 }} />
                    </IconButton>
                )}
            </Box>

            {/* ── Caption ── */}
            {post.content && (
                <Box
                    sx={{
                        px: 2.5,
                        py: 1.75,
                        borderBottom: `1px solid ${tokens.border}`,
                        flexShrink: 0,
                    }}
                >
                    <Typography
                        sx={{
                            fontFamily: tokens.fontBody,
                            fontSize: "0.875rem",
                            color: tokens.textSecondary,
                            lineHeight: 1.7,
                        }}
                    >
                        <Box
                            component="span"
                            onClick={() => navigate(`/profile/${post.user_id}`)}
                            sx={{
                                fontWeight: 600,
                                color: tokens.textPrimary,
                                mr: 0.75,
                                cursor: "pointer",
                                transition: "color 0.15s",
                                "&:hover": { color: tokens.accent },
                            }}
                        >
                            {post.username}
                        </Box>
                        {post.content}
                    </Typography>
                    <Typography
                        sx={{
                            fontFamily: tokens.fontBody,
                            fontSize: "0.65rem",
                            color: tokens.textMuted,
                            mt: 0.75,
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                        }}
                    >
                        {post.timeAgo}
                    </Typography>
                </Box>
            )}

            {/* ── Comments ── */}
            <Box
                sx={{
                    flex: 1,
                    overflowY: "auto",
                    px: 1.5,
                    py: 0.75,
                    "&::-webkit-scrollbar": { width: 3 },
                    "&::-webkit-scrollbar-track": { bgcolor: "transparent" },
                    "&::-webkit-scrollbar-thumb": {
                        bgcolor: "rgba(255,255,255,0.07)",
                        borderRadius: 4,
                        "&:hover": { bgcolor: "rgba(255,255,255,0.12)" },
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
                                bgcolor: tokens.bg3,
                                border: `1px solid ${tokens.border}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <ChatBubbleOutline sx={{ fontSize: 20, color: tokens.textMuted }} />
                        </Box>
                        <Typography
                            sx={{
                                fontFamily: tokens.fontBody,
                                fontSize: "0.85rem",
                                color: tokens.textSecondary,
                                fontWeight: 500,
                            }}
                        >
                            No comments yet
                        </Typography>
                        <Typography sx={{ fontFamily: tokens.fontBody, fontSize: "0.75rem", color: tokens.textMuted }}>
                            Start the conversation
                        </Typography>
                    </Box>
                ) : (
                    comments.map((comment) => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            isOwner={currentUser?.id === comment.user_id || isOwner}
                            onDelete={handleDeleteComment}
                        />
                    ))
                )}
            </Box>

            {/* ── Action bar + comment input ── */}
            <Box sx={{ borderTop: `1px solid ${tokens.border}`, flexShrink: 0, bgcolor: tokens.bg0 }}>
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
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
                        {/* Like */}
                        <IconButton
                            onClick={handleLike}
                            disableRipple
                            className={likeAnimating ? "like-btn-pop" : ""}
                            sx={{
                                p: 0.9,
                                color: isLiked ? "#E05252" : tokens.textMuted,
                                transition: "color 0.15s",
                                "&:hover": {
                                    bgcolor: "transparent",
                                    color: isLiked ? "#FF6B6B" : tokens.textSecondary,
                                },
                            }}
                        >
                            {isLiked ? <Favorite sx={{ fontSize: 21 }} /> : <FavoriteBorder sx={{ fontSize: 21 }} />}
                        </IconButton>
                        <Typography
                            sx={{
                                fontFamily: tokens.fontBody,
                                fontSize: "0.78rem",
                                color: likeCount > 0 ? tokens.textSecondary : tokens.textMuted,
                                fontWeight: 500,
                                minWidth: "20px",
                            }}
                        >
                            {likeCount > 0 ? likeCount : ""}
                        </Typography>

                        {/* Comment */}
                        <IconButton
                            disableRipple
                            onClick={() => commentInputRef.current?.focus()}
                            sx={{
                                p: 0.9,
                                ml: 0.5,
                                color: tokens.textMuted,
                                "&:hover": { bgcolor: "transparent", color: tokens.textSecondary },
                            }}
                        >
                            <ChatBubbleOutline sx={{ fontSize: 20 }} />
                        </IconButton>
                        <Typography
                            sx={{
                                fontFamily: tokens.fontBody,
                                fontSize: "0.78rem",
                                color: commentCount > 0 ? tokens.textSecondary : tokens.textMuted,
                                fontWeight: 500,
                                minWidth: "20px",
                            }}
                        >
                            {commentCount > 0 ? commentCount : ""}
                        </Typography>
                    </Box>

                    {/* Save */}
                    <IconButton
                        disableRipple
                        onClick={handleSave}
                        sx={{
                            p: 0.9,
                            color: isSaved ? tokens.accent : tokens.textMuted,
                            transition: "color 0.15s, transform 0.2s",
                            "&:hover": {
                                bgcolor: "transparent",
                                color: isSaved ? tokens.accent : tokens.textSecondary,
                                transform: "scale(1.1)",
                            },
                        }}
                    >
                        {isSaved ? <Bookmark sx={{ fontSize: 21 }} /> : <BookmarkBorderOutlined sx={{ fontSize: 21 }} />}
                    </IconButton>
                </Box>

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
                    <Avatar
                        src={currentUser?.profile_picture_url || BlankProfileImage}
                        sx={{ width: 28, height: 28, flexShrink: 0, border: `1.5px solid ${tokens.border}` }}
                    />
                    <Box
                        sx={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            bgcolor: tokens.bg2,
                            borderRadius: "20px",
                            border: `1px solid ${tokens.border}`,
                            px: 1.75,
                            py: 0.6,
                            transition: "border-color 0.2s",
                            "&:focus-within": { borderColor: `rgba(212,169,106,0.35)` },
                        }}
                    >
                        <TextField
                            inputRef={commentInputRef}
                            fullWidth
                            variant="standard"
                            placeholder="Add a comment…"
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
                                    fontFamily: tokens.fontBody,
                                    fontSize: "0.82rem",
                                    color: tokens.textPrimary,
                                    "& input::placeholder": { color: tokens.textMuted, fontSize: "0.82rem" },
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
                            bgcolor: commentText.trim() ? tokens.accentDim : "transparent",
                            color: commentText.trim() ? tokens.accent : tokens.textMuted,
                            border: `1px solid ${commentText.trim() ? "rgba(212,169,106,0.25)" : tokens.border}`,
                            borderRadius: "50%",
                            transition: "all 0.2s ease",
                            "&:hover": {
                                bgcolor: commentText.trim() ? "rgba(212,169,106,0.22)" : "transparent",
                                transform: commentText.trim() ? "scale(1.1)" : "none",
                            },
                            "&.Mui-disabled": { color: tokens.textMuted, bgcolor: "transparent", borderColor: tokens.border },
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
                    minHeight: "100vh",
                    bgcolor: tokens.bg0,
                    display: "flex",
                    flexDirection: "column",
                    fontFamily: tokens.fontBody,
                }}
            >
                <style>{heartAnimStyle}</style>

                {/* ── Top nav ── */}
                <Box
                    sx={{
                        height: 56,
                        display: "flex",
                        alignItems: "center",
                        px: 2,
                        gap: 1.5,
                        borderBottom: `1px solid ${tokens.border}`,
                        bgcolor: `rgba(12,12,12,0.92)`,
                        backdropFilter: "blur(16px)",
                        position: "sticky",
                        top: 0,
                        zIndex: 100,
                        flexShrink: 0,
                    }}
                >
                    <IconButton
                        onClick={() => navigate(-1)}
                        size="small"
                        sx={{
                            color: tokens.textSecondary,
                            "&:hover": { bgcolor: "rgba(255,255,255,0.05)", color: tokens.textPrimary },
                            borderRadius: "10px",
                            p: 0.75,
                        }}
                    >
                        <ArrowBack sx={{ fontSize: 19 }} />
                    </IconButton>
                    <Typography
                        sx={{
                            fontFamily: tokens.fontDisplay,
                            fontStyle: "italic",
                            fontSize: "1.15rem",
                            color: tokens.textPrimary,
                            letterSpacing: "-0.02em",
                            lineHeight: 1,
                        }}
                    >
                        Post
                    </Typography>
                </Box>

                {/* ── Main layout ── */}
                <Box
                    sx={{
                        flex: 1,
                        display: "flex",
                        flexDirection: { xs: "column", md: "row" },
                        overflow: { xs: "visible", md: "hidden" },
                    }}
                >
                    {ImageSection}
                    {SidePanel}
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
                            icon={<EditRoundedIcon sx={{ fontSize: "1rem", color: tokens.textSecondary }} />}
                            label="Edit caption"
                            onClick={() => {
                                setIsEditing(true);
                                setEditedContent(post.content);
                                setOptionsOpen(false);
                                setConfirmDelete(false);
                            }}
                        />
                        <SheetButton
                            icon={confirmDelete ? <WarningRoundedIcon sx={{ fontSize: "1rem" }} /> : <DeleteRoundedIcon sx={{ fontSize: "1rem" }} />}
                            label={confirmDelete ? "Tap again to confirm delete" : "Delete post"}
                            onClick={() => (confirmDelete ? handleDeletePost() : setConfirmDelete(true))}
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
                            <Box component="img" src={post.file_url} sx={{ width: "100%", height: 180, objectFit: "cover", display: "block" }} />
                            {/* Gradient overlay */}
                            <Box
                                sx={{
                                    position: "absolute",
                                    inset: 0,
                                    background: "linear-gradient(to top, rgba(17,17,19,1) 0%, transparent 60%)",
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
                                    border: `1px solid rgba(255,255,255,0.1)`,
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

                    <Box sx={{ px: 2.5, py: 2, display: "flex", flexDirection: "column", gap: 2 }}>
                        <Typography
                            sx={{
                                fontFamily: tokens.fontBody,
                                fontWeight: 600,
                                fontSize: "0.8rem",
                                color: tokens.textMuted,
                                textTransform: "uppercase",
                                letterSpacing: "0.08em",
                            }}
                        >
                            Edit caption
                        </Typography>
                        <Box
                            sx={{
                                bgcolor: tokens.bg2,
                                border: `1px solid ${tokens.border}`,
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
                                        fontFamily: tokens.fontBody,
                                        fontSize: "0.9rem",
                                        color: tokens.textPrimary,
                                        lineHeight: 1.65,
                                        "& textarea::placeholder": { color: tokens.textMuted },
                                    },
                                }}
                            />
                        </Box>

                        <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                            <Button
                                onClick={() => setIsEditing(false)}
                                sx={{
                                    textTransform: "none",
                                    fontFamily: tokens.fontBody,
                                    fontWeight: 500,
                                    fontSize: "0.82rem",
                                    color: tokens.textMuted,
                                    borderRadius: "10px",
                                    px: 2,
                                    py: 0.9,
                                    "&:hover": { bgcolor: "rgba(255,255,255,0.04)" },
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSaveEdit}
                                disabled={editedContent === post.content}
                                sx={{
                                    textTransform: "none",
                                    fontFamily: tokens.fontBody,
                                    fontWeight: 600,
                                    fontSize: "0.82rem",
                                    borderRadius: "10px",
                                    px: 2.5,
                                    py: 0.9,
                                    bgcolor: tokens.accent,
                                    color: "#0C0C0C",
                                    "&:hover": { bgcolor: "#E0B870" },
                                    "&:disabled": { bgcolor: tokens.bg3, color: tokens.textMuted },
                                    transition: "background 0.18s",
                                }}
                            >
                                Save
                            </Button>
                        </Box>
                    </Box>
                </Dialog>
            </Box>
        </Fade>
    );
};

export default PostDetailPage;
