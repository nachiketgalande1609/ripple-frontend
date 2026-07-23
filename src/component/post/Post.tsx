import React, { useState, useRef, useEffect } from "react";
import { Typography, IconButton, Avatar, Box, TextField, Dialog, DialogContent, Button, CircularProgress, useTheme, Popover } from "@mui/material";
import SvgIcon from "@mui/material/SvgIcon";
import BlankProfileImage from "../../static/profile_blank.png";
import VideoPlayer from "../../component/VideoPlayer";
import {
    FavoriteBorder,
    Favorite,
    MoreHoriz,
    BookmarkBorderOutlined,
    Bookmark,
    LocationOn,
    Close,
    ChatBubbleOutline,
    PersonRounded as TaggedIcon,
    ArrowForwardIos,
    ArrowBackIos,
} from "@mui/icons-material";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import WarningRoundedIcon from "@mui/icons-material/WarningRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { deletePost, likePost, addComment, updatePost, savePost, deleteComment, getFollowingUsers } from "../../services/api";
import ScrollableCommentsDrawer from "./ScrollableCommentsDrawer";
import { useNavigate } from "react-router-dom";
import { useAppNotifications } from "../../hooks/useNotification";
import socket from "../../services/socket";
import { ACCENT_COLOR } from "../../theme";

const ACCENT = ACCENT_COLOR;

const PaperPlaneIcon = ({ size = 20 }: { size?: number }) => (
    <SvgIcon sx={{ fontSize: size, transform: "rotate(-45deg)" }}>
        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
    </SvgIcon>
);

interface Post {
    username: string;
    content: string;
    like_count: number;
    avatarUrl?: string;
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
    tagged_users?: Array<{ id: number; username: string; profile_picture?: string }>;
    media_files?: string[];
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
}

type User = {
    id: number;
    username: string;
    profile_picture: string;
    isOnline: boolean;
    latest_message: string;
    latest_message_timestamp: string;
    unread_count: number;
};

interface PostProps {
    post: Post;
    fetchPosts: () => Promise<void>;
    borderRadius: string;
}

function DialogBtn({
    icon,
    label,
    onClick,
    danger = false,
    warning = false,
    muted = false,
    disabled = false,
}: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    danger?: boolean;
    warning?: boolean;
    muted?: boolean;
    disabled?: boolean;
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
                borderRadius: "18px",
                textTransform: "none",
                justifyContent: "flex-start",
                fontFamily: "'Inter', -apple-system, sans-serif",
                fontWeight: warning ? 600 : 500,
                fontSize: "0.875rem",
                color: warning ? "error.light" : danger ? "error.main" : muted ? "text.disabled" : "text.primary",
                border: "none",
                backgroundColor: warning ? "rgba(211,47,47,0.12)" : "var(--nav-bg)",
                boxShadow: "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)",
                transition: "box-shadow 0.35s cubic-bezier(0.4,0,0.2,1), color 0.2s ease",
                mb: 0.75,
                "&:hover": {
                    backgroundColor: warning ? "rgba(211,47,47,0.18)" : "var(--nav-bg)",
                    boxShadow: "inset 3px 3px 10px var(--nav-neo-shadow1), inset -3px -3px 10px var(--nav-neo-shadow2)",
                    color: warning || danger ? "error.light" : muted ? "text.secondary" : "text.primary",
                },
                "&:disabled": { color: "text.disabled" },
            }}
        >
            <Box
                sx={{
                    width: 34,
                    height: 34,
                    borderRadius: "10px",
                    flexShrink: 0,
                    backgroundColor: danger || warning ? "rgba(211,47,47,0.08)" : "action.hover",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: danger || warning ? "error.main" : muted ? "text.disabled" : "text.secondary",
                }}
            >
                {icon}
            </Box>
            {label}
        </Button>
    );
}

const Post: React.FC<PostProps> = ({ post, fetchPosts, borderRadius }) => {
    const navigate = useNavigate();
    const notifications = useAppNotifications();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const [commentText, setCommentText] = useState("");
    const [comment_count, setCommentCount] = useState(post.comment_count);
    const [likeCount, setLikeCount] = useState(post.like_count);
    const [postComments, setPostComments] = useState(post.comments);
    const [optionsDialogOpen, setOptionsDialogOpen] = useState(false);
    const [isLiked, setIsLiked] = useState(post.liked_by_current_user);
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(post.content);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const postRef = useRef<HTMLDivElement>(null);
    const postWidth = postRef?.current?.offsetWidth || 0;
    const [isImageLoading, setIsImageLoading] = useState(true);
    const [isSaved, setIsSaved] = useState(post.saved_by_current_user);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [tagAnchorEl, setTagAnchorEl] = useState<HTMLElement | null>(null);
    const [carouselIndex, setCarouselIndex] = useState(0);
    const [usersModalOpen, setUsersModalOpen] = useState(false);
    const [usersList, setUsersList] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [likeAnimating, setLikeAnimating] = useState(false);

    const filteredUsers = usersList.filter((u: User) => u.username.toLowerCase().includes(searchTerm.toLowerCase()));

    const currentUser = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") || "null") : {};
    const commentInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const id = 'post-like-animation-styles';
        if (document.getElementById(id)) return;
        const el = document.createElement('style');
        el.id = id;
        el.textContent = `
        @keyframes likePopIn {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.45); }
          70%  { transform: scale(0.9); }
          100% { transform: scale(1); }
        }
        .like-pop { animation: likePopIn 0.35s cubic-bezier(0.36,0.07,0.19,0.97) both; }
      `;
        document.head.appendChild(el);
    }, []);
    const isOwner = currentUser?.id === post.user_id;

    const dialogPaperSx = {
        borderRadius: "36px",
        backgroundColor: theme.palette.background.paper,
        border: "1px solid",
        borderColor: theme.palette.divider,
        boxShadow: "0 24px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(100,116,139,0.08)",
        overflow: "hidden",
        padding: "6px",
    };

    const dialogBackdrop = {
        sx: { backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.6)" },
    };

    const handleUserClick = (user: User) => {
        socket.emit("sendMessage", {
            tempId: Date.now() + Math.floor(Math.random() * 1000),
            senderId: currentUser.id,
            receiverId: user.id,
            postId: post.id,
        });
        notifications.show("Post sent!", { severity: "success", autoHideDuration: 3000 });
        setUsersModalOpen(false);
    };

    const handleLike = async () => {
        const prev = isLiked;
        const prevCount = likeCount;
        setIsLiked(!prev);
        setLikeCount(prev ? prevCount - 1 : prevCount + 1);
        if (!prev) {
            setLikeAnimating(true);
            setTimeout(() => setLikeAnimating(false), 400);
        }
        try {
            await likePost(post.id);
        } catch {
            setIsLiked(prev);
            setLikeCount(prevCount);
        }
    };

    const handlePaperPlaneClick = async () => {
        try {
            const res = await getFollowingUsers();
            if (res.success) {
                setUsersList(res.data);
                setUsersModalOpen(true);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleComment = async (parentCommentId?: number | null) => {
        if (!commentText) return;
        const newComment = {
            id: Date.now(),
            post_id: post.id,
            user_id: currentUser.id,
            content: commentText,
            parent_comment_id: parentCommentId ?? null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            commenter_username: currentUser.username,
            commenter_profile_picture: currentUser.profile_picture_url,
            timeAgo: "Just now",
            likes_count: 0,
            liked_by_user: false,
        };
        setPostComments([...postComments, newComment]);
        setCommentText("");
        setCommentCount(comment_count + 1);
        try {
            const res = await addComment(post.id, commentText, parentCommentId);
            if (!res?.success) throw new Error();
            // Replace temp id with real DB id so delete works immediately
            setPostComments((p) => p.map((c) => c.id === newComment.id ? { ...c, id: res.commentId } : c));
        } catch {
            setPostComments((p) => p.filter((c) => c.id !== newComment.id));
            setCommentCount(comment_count - 1);
        }
    };

    const handleDeleteComment = async (commentId: number) => {
        const toDelete = postComments.find((c) => c.id === commentId);
        setPostComments((prev) => prev.filter((c) => c.id !== commentId));
        try {
            const res = await deleteComment(commentId);
            if (!res?.success) throw new Error();
        } catch {
            setPostComments((p) => [toDelete!, ...p]);
        }
    };

    const handleDelete = async () => {
        try {
            const res = await deletePost(post.id);
            if (res?.success) {
                setOptionsDialogOpen(false);
                setConfirmDelete(false);
                fetchPosts();
            }
        } catch {}
    };

    const handleSavePost = async () => {
        const prev = isSaved;
        setIsSaved(!prev);
        try {
            const res = await savePost(post.id);
            if (!res.success) setIsSaved(prev);
        } catch {
            setIsSaved(prev);
        }
    };

    const handleSaveEdit = async () => {
        try {
            const res = await updatePost(post.id, editedContent);
            if (res?.success) {
                setIsEditing(false);
                fetchPosts();
                setEditedContent("");
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <>
            <Box
                sx={{
                    width: "100%",
                    backgroundColor: "var(--nav-bg)",
                    borderRadius,
                    overflow: "hidden",
                    border: "none",
                    boxShadow: "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)",
                }}
            >
                {/* ── Header ── */}
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 1.75, py: 1.25 }}>
                    <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1.125, cursor: "pointer" }}
                        onClick={() => navigate(`/profile/${post.user_id}`)}
                    >
                        <Avatar
                            src={post.profile_picture || BlankProfileImage}
                            sx={{ width: 34, height: 34, border: "1px solid", borderColor: (t) => t.palette.divider }}
                        />
                        <Box>
                            <Typography
                                sx={{
                                    fontFamily: "'Inter', -apple-system, sans-serif",
                                    fontWeight: 500,
                                    fontSize: "0.85rem",
                                    color: (t) => t.palette.text.primary,
                                    lineHeight: 1.25,
                                }}
                            >
                                {post.username}
                            </Typography>
                            {post.location && (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, mt: "1px" }}>
                                    <LocationOn sx={{ fontSize: "0.75rem", color: (t) => t.palette.text.disabled }} />
                                    <Typography
                                        sx={{ fontFamily: "'Inter', sans-serif", fontSize: "0.68rem", color: (t) => t.palette.text.disabled }}
                                    >
                                        {post.location}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Box>
                    {isOwner && (
                        <IconButton
                            onClick={() => setOptionsDialogOpen(true)}
                            size="small"
                            sx={{
                                width: 30,
                                height: 30,
                                borderRadius: "8px",
                                color: (t) => t.palette.text.disabled,
                                "&:hover": { backgroundColor: (t) => t.palette.action.hover, color: (t) => t.palette.text.primary },
                            }}
                        >
                            <MoreHoriz sx={{ fontSize: 18 }} />
                        </IconButton>
                    )}
                </Box>

                {/* ── Media ── */}
                {post.file_url &&
                    (() => {
                        const allMedia = post.media_files && post.media_files.length > 1
                            ? post.media_files
                            : [post.file_url!];
                        const currentSrc = allMedia[carouselIndex] ?? post.file_url!;
                        const isVideo = /\.(mp4|mov|webm)$/i.test(currentSrc);
                        const height = postWidth ? (post.media_height / post.media_width) * postWidth : 400;
                        return (
                            <Box
                                ref={postRef}
                                sx={{
                                    position: "relative",
                                    width: "100%",
                                    height: isVideo ? height || 400 : height,
                                    overflow: "hidden",
                                    backgroundColor: (t) => t.palette.background.default,
                                    mb: 1,
                                    borderRadius: "12px",
                                }}
                            >
                                {isVideo ? (
                                    <VideoPlayer src={currentSrc} />
                                ) : (
                                    <>
                                        {isImageLoading && (
                                            <>
                                                <Box component="img" src={currentSrc}
                                                    sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "blur(20px)", transform: "scale(1.1)" }}
                                                />
                                                <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
                                                    <CircularProgress size={18} sx={{ color: (t) => t.palette.text.disabled }} />
                                                </Box>
                                            </>
                                        )}
                                        <Box
                                            component="img"
                                            src={currentSrc}
                                            alt="Post"
                                            onDoubleClick={async () => { if (!isLiked) await handleLike(); }}
                                            sx={{ width: "100%", height: "100%", objectFit: "contain", opacity: isImageLoading ? 0 : 1, transition: "opacity 0.3s ease", display: "block", cursor: "default" }}
                                            onLoad={() => setIsImageLoading(false)}
                                        />
                                    </>
                                )}

                                {/* Carousel arrows */}
                                {allMedia.length > 1 && carouselIndex > 0 && (
                                    <IconButton onClick={(e) => { e.stopPropagation(); setIsImageLoading(true); setCarouselIndex((i) => i - 1); }}
                                        sx={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", bgcolor: "rgba(0,0,0,0.45)", color: "#fff", width: 28, height: 28, zIndex: 4, "&:hover": { bgcolor: "rgba(0,0,0,0.7)" } }}>
                                        <ArrowBackIos sx={{ fontSize: 12, ml: 0.5 }} />
                                    </IconButton>
                                )}
                                {allMedia.length > 1 && carouselIndex < allMedia.length - 1 && (
                                    <IconButton onClick={(e) => { e.stopPropagation(); setIsImageLoading(true); setCarouselIndex((i) => i + 1); }}
                                        sx={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", bgcolor: "rgba(0,0,0,0.45)", color: "#fff", width: 28, height: 28, zIndex: 4, "&:hover": { bgcolor: "rgba(0,0,0,0.7)" } }}>
                                        <ArrowForwardIos sx={{ fontSize: 12 }} />
                                    </IconButton>
                                )}

                                {/* Dot indicators */}
                                {allMedia.length > 1 && (
                                    <Box sx={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 0.5, zIndex: 4 }}>
                                        {allMedia.map((_, i) => (
                                            <Box key={i} onClick={(e) => { e.stopPropagation(); setIsImageLoading(true); setCarouselIndex(i); }}
                                                sx={{ width: i === carouselIndex ? 14 : 6, height: 6, borderRadius: "3px", bgcolor: i === carouselIndex ? "#fff" : "rgba(255,255,255,0.5)", cursor: "pointer", transition: "all 0.2s" }} />
                                        ))}
                                    </Box>
                                )}

                                {/* Slide counter badge */}
                                {allMedia.length > 1 && (
                                    <Box sx={{ position: "absolute", top: 10, right: 10, bgcolor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", borderRadius: "20px", px: 1, py: 0.35, zIndex: 4 }}>
                                        <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: "#fff", fontFamily: "'Inter', sans-serif" }}>
                                            {carouselIndex + 1}/{allMedia.length}
                                        </Typography>
                                    </Box>
                                )}

                                {/* Tagged people icon overlay */}
                                {post.tagged_users && post.tagged_users.length > 0 && (
                                    <Box onClick={(e) => { e.stopPropagation(); setTagAnchorEl(e.currentTarget); }}
                                        sx={{ position: "absolute", bottom: 10, right: 10, bgcolor: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)", borderRadius: "20px", display: "flex", alignItems: "center", gap: 0.5, px: 0.9, py: 0.7, cursor: "pointer", zIndex: 3, transition: "background 0.15s", "&:hover": { bgcolor: "rgba(0,0,0,0.65)" } }}>
                                        <TaggedIcon sx={{ fontSize: 13, color: "#fff" }} />
                                        <Typography sx={{ fontSize: "0.7rem", fontWeight: 600, color: "#fff", fontFamily: "'Inter', sans-serif", lineHeight: 1 }}>
                                            {post.tagged_users.length}
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        );
                    })()}

                {/* ── Actions ── */}
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 1.25, pt: 0.625, pb: 0.25 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
                        {/* Like */}
                        <IconButton
                            onClick={handleLike}
                            disableRipple
                            className={likeAnimating ? "like-pop" : ""}
                            sx={{
                                p: 0.75,
                                color: isLiked ? (t) => t.palette.error.main : (t) => t.palette.text.disabled,
                                transition: "color 0.15s",
                                "&:hover": {
                                    backgroundColor: "transparent",
                                    color: isLiked ? (t) => t.palette.error.main : (t) => t.palette.text.primary,
                                },
                            }}
                        >
                            {isLiked ? <Favorite sx={{ fontSize: 21 }} /> : <FavoriteBorder sx={{ fontSize: 21 }} />}
                        </IconButton>
                        <Typography
                            sx={{
                                fontFamily: "'Inter', sans-serif",
                                fontSize: "0.75rem",
                                color: (t) => t.palette.text.disabled,
                                mr: 0.5,
                                minWidth: "14px",
                            }}
                        >
                            {likeCount}
                        </Typography>

                        {/* Comment */}
                        <IconButton
                            disableRipple
                            onClick={() => {
                                commentInputRef.current?.focus();
                                setDrawerOpen(true);
                            }}
                            sx={{
                                p: 0.75,
                                color: (t) => t.palette.text.disabled,
                                "&:hover": { backgroundColor: "transparent", color: (t) => t.palette.text.primary },
                            }}
                        >
                            <ChatBubbleOutline sx={{ fontSize: 20 }} />
                        </IconButton>
                        <Typography
                            sx={{
                                fontFamily: "'Inter', sans-serif",
                                fontSize: "0.75rem",
                                color: (t) => t.palette.text.disabled,
                                mr: 0.5,
                                minWidth: "14px",
                            }}
                        >
                            {post.comment_count}
                        </Typography>

                        {/* Share */}
                        <IconButton
                            disableRipple
                            onClick={handlePaperPlaneClick}
                            sx={{
                                p: 0.75,
                                color: (t) => t.palette.text.disabled,
                                "&:hover": { backgroundColor: "transparent", color: (t) => t.palette.text.primary },
                            }}
                        >
                            <PaperPlaneIcon size={20} />
                        </IconButton>
                    </Box>

                    {/* Save */}
                    <IconButton
                        disableRipple
                        onClick={handleSavePost}
                        sx={{
                            p: 0.75,
                            color: isSaved ? ACCENT : (t) => t.palette.text.disabled,
                            transition: "color 0.15s",
                            "&:hover": { backgroundColor: "transparent", color: isSaved ? ACCENT : (t) => t.palette.text.primary },
                        }}
                    >
                        {isSaved ? <Bookmark sx={{ fontSize: 21 }} /> : <BookmarkBorderOutlined sx={{ fontSize: 21 }} />}
                    </IconButton>
                </Box>

                {/* ── Caption ── */}
                <Box sx={{ px: 1.75, pb: 1.75, pt: 0.25 }}>
                    {post.content && (
                        <Typography
                            sx={{
                                fontFamily: "'Inter', -apple-system, sans-serif",
                                fontSize: "0.84rem",
                                color: (t) => t.palette.text.secondary,
                                lineHeight: 1.55,
                            }}
                        >
                            <Box
                                component="span"
                                onClick={() => navigate(`/profile/${post.user_id}`)}
                                sx={{
                                    fontWeight: 500,
                                    mr: 0.625,
                                    cursor: "pointer",
                                    color: (t) => t.palette.text.primary,
                                    "&:hover": { textDecoration: "underline" },
                                }}
                            >
                                {post.username}
                            </Box>
                            {post.content}
                        </Typography>
                    )}
                    <Typography
                        sx={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: "0.75rem",
                            color: (t) => t.palette.text.disabled,
                            mt: 0.625,
                        }}
                    >
                        {post.timeAgo}
                    </Typography>
                </Box>
            </Box>

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
                {(post.tagged_users || []).map((u) => (
                    <Box
                        key={u.id}
                        onClick={() => { setTagAnchorEl(null); navigate(`/profile/${u.id}`); }}
                        sx={{
                            display: "flex", alignItems: "center", gap: 1,
                            px: 1.5, py: 0.875, cursor: "pointer",
                            "&:hover": { bgcolor: (t) => t.palette.action.hover },
                        }}
                    >
                        <Avatar src={u.profile_picture} sx={{ width: 28, height: 28, fontSize: "0.7rem" }}>
                            {u.username.slice(0, 2).toUpperCase()}
                        </Avatar>
                        <Typography sx={{ fontFamily: "'Inter', sans-serif", fontSize: "0.83rem", fontWeight: 500, color: (t) => t.palette.text.primary }}>
                            {u.username}
                        </Typography>
                    </Box>
                ))}
            </Popover>

            {/* ── Edit dialog ── */}
            <Dialog
                open={isEditing}
                onClose={() => {
                    setIsEditing(false);
                    setEditedContent("");
                }}
                BackdropProps={dialogBackdrop}
                sx={{ "& .MuiDialog-paper": { ...dialogPaperSx, padding: 0, width: "90%", maxWidth: "480px" } }}
            >
                {post.file_url && (
                    <Box sx={{ position: "relative" }}>
                        <Box component="img" src={post.file_url} sx={{ width: "100%", height: 180, objectFit: "cover", display: "block" }} />
                        <IconButton
                            onClick={() => setIsEditing(false)}
                            size="small"
                            sx={{
                                position: "absolute",
                                top: 8,
                                right: 8,
                                backgroundColor: "rgba(0,0,0,0.5)",
                                color: "#fff",
                                width: 26,
                                height: 26,
                                "&:hover": { backgroundColor: "rgba(0,0,0,0.7)" },
                            }}
                        >
                            <Close sx={{ fontSize: 14 }} />
                        </IconButton>
                    </Box>
                )}
                <Box
                    sx={{
                        px: 2,
                        py: 1.5,
                        display: "flex",
                        gap: 1.25,
                        alignItems: "flex-end",
                        borderTop: post.file_url ? "1px solid" : "none",
                        borderColor: (t) => t.palette.divider,
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
                                fontFamily: "'Inter', sans-serif",
                                fontSize: "0.875rem",
                                color: (t) => t.palette.text.primary,
                                "& textarea::placeholder": { color: (t) => t.palette.text.disabled },
                            },
                        }}
                    />
                    <Button
                        onClick={handleSaveEdit}
                        disabled={editedContent === post.content}
                        sx={{
                            textTransform: "none",
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: 500,
                            fontSize: "0.82rem",
                            borderRadius: "10px",
                            px: 2,
                            py: 0.75,
                            flexShrink: 0,
                            backgroundColor: ACCENT,
                            color: "#fff",
                            "&:hover": { backgroundColor: "#6b4de0" },
                            "&:disabled": {
                                backgroundColor: (t) => t.palette.action.disabledBackground,
                                color: (t) => t.palette.action.disabled,
                            },
                        }}
                    >
                        Save
                    </Button>
                </Box>
            </Dialog>

            {/* ── Options dialog ── */}
            {isOwner && (
                <Dialog
                    open={optionsDialogOpen}
                    onClose={() => {
                        setOptionsDialogOpen(false);
                        setConfirmDelete(false);
                    }}
                    fullWidth
                    maxWidth="xs"
                    BackdropProps={dialogBackdrop}
                    sx={{ "& .MuiDialog-paper": dialogPaperSx }}
                >
                    <Box sx={{ "& button": { borderRadius: "0 !important" }, "& button:first-of-type": { borderRadius: "18px 18px 0 0 !important" }, "& button:last-of-type": { borderRadius: "0 0 18px 18px !important", marginBottom: "0 !important" } }}>
                        <DialogBtn
                            icon={<EditRoundedIcon sx={{ fontSize: "1rem" }} />}
                            label="Edit caption"
                            onClick={() => {
                                setIsEditing(true);
                                setEditedContent(post.content);
                                setOptionsDialogOpen(false);
                                setConfirmDelete(false);
                            }}
                        />
                        <DialogBtn
                            icon={confirmDelete ? <WarningRoundedIcon sx={{ fontSize: "1rem" }} /> : <DeleteRoundedIcon sx={{ fontSize: "1rem" }} />}
                            label={confirmDelete ? "Confirm delete" : "Delete post"}
                            onClick={() => (confirmDelete ? handleDelete() : setConfirmDelete(true))}
                            danger={!confirmDelete}
                            warning={confirmDelete}
                        />
                        <DialogBtn
                            icon={<CloseRoundedIcon sx={{ fontSize: "1rem" }} />}
                            label="Cancel"
                            onClick={() => {
                                setOptionsDialogOpen(false);
                                setConfirmDelete(false);
                            }}
                            muted
                        />
                    </Box>
                </Dialog>
            )}

            {/* ── Share dialog ── */}
            <Dialog
                open={usersModalOpen}
                onClose={() => {
                    setUsersModalOpen(false);
                    setSearchTerm("");
                }}
                fullWidth
                maxWidth="xs"
                BackdropProps={dialogBackdrop}
                sx={{ "& .MuiDialog-paper": dialogPaperSx }}
            >
                <DialogContent sx={{ p: 0 }}>
                    {/* Header */}
                    <Box sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        px: 2,
                        pt: 1.75,
                        pb: 1.5,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                    }}>
                        <Typography sx={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "0.95rem", color: theme.palette.text.primary }}>
                            Send to
                        </Typography>
                        <IconButton
                            size="small"
                            onClick={() => { setUsersModalOpen(false); setSearchTerm(""); }}
                            sx={{ color: theme.palette.text.disabled, "&:hover": { color: theme.palette.text.primary, backgroundColor: theme.palette.action.hover } }}
                        >
                            <Close sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Box>

                    {/* Search */}
                    <Box sx={{ px: 2, py: 1.25, borderBottom: `1px solid ${theme.palette.divider}` }}>
                        <Box sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            backgroundColor: theme.palette.action.hover,
                            borderRadius: "10px",
                            px: 1.25,
                            py: 0.75,
                        }}>
                            <Box component="span" sx={{ color: theme.palette.text.disabled, fontSize: 16, lineHeight: 1, mt: "1px" }}>⌕</Box>
                            <TextField
                                variant="standard"
                                size="small"
                                placeholder="Search people…"
                                fullWidth
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{
                                    disableUnderline: true,
                                    sx: {
                                        fontFamily: "'Inter', sans-serif",
                                        fontSize: "0.875rem",
                                        color: theme.palette.text.primary,
                                        "& input::placeholder": { color: theme.palette.text.disabled },
                                    },
                                }}
                            />
                        </Box>
                    </Box>

                    {/* User list */}
                    {filteredUsers.length > 0 ? (
                        <Box sx={{ py: 0.75, maxHeight: 280, overflowY: "auto" }}>
                            {filteredUsers.map((user: User) => (
                                <Box
                                    key={user.id}
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1.5,
                                        px: 2,
                                        py: 1,
                                        transition: "background 0.15s",
                                        "&:hover": { backgroundColor: theme.palette.action.hover },
                                    }}
                                >
                                    <Avatar
                                        src={user.profile_picture || BlankProfileImage}
                                        sx={{ width: 40, height: 40, border: `1.5px solid ${theme.palette.divider}` }}
                                    />
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography sx={{
                                            fontFamily: "'Inter', sans-serif",
                                            fontSize: "0.875rem",
                                            fontWeight: 500,
                                            color: theme.palette.text.primary,
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                        }}>
                                            {user.username}
                                        </Typography>
                                    </Box>
                                    <Button
                                        size="small"
                                        onClick={() => handleUserClick(user)}
                                        sx={{
                                            minWidth: 0,
                                            px: 1.75,
                                            py: 0.5,
                                            borderRadius: "20px",
                                            backgroundColor: ACCENT_COLOR,
                                            color: "#fff",
                                            fontSize: "0.78rem",
                                            fontWeight: 600,
                                            fontFamily: "'Inter', sans-serif",
                                            textTransform: "none",
                                            "&:hover": { backgroundColor: `${ACCENT_COLOR}cc` },
                                            flexShrink: 0,
                                        }}
                                    >
                                        Send
                                    </Button>
                                </Box>
                            ))}
                        </Box>
                    ) : (
                        <Box sx={{ py: 5, textAlign: "center" }}>
                            <Typography sx={{ fontFamily: "'Inter', sans-serif", fontSize: "0.82rem", color: theme.palette.text.disabled }}>
                                No people found
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
            </Dialog>

            <ScrollableCommentsDrawer
                drawerOpen={drawerOpen}
                setDrawerOpen={setDrawerOpen}
                postComments={postComments}
                handleComment={handleComment}
                commentText={commentText}
                setCommentText={setCommentText}
                commentInputRef={commentInputRef}
                content={post.content}
                username={post.username}
                avatarUrl={post.profile_picture}
                handleDeleteComment={handleDeleteComment}
            />
        </>
    );
};

export default Post;
