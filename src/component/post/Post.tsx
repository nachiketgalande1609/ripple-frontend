import React, { useState, useRef } from "react";
import { Typography, IconButton, Avatar, Box, TextField, Dialog, DialogContent, Button, CircularProgress } from "@mui/material";
import BlankProfileImage from "../../static/profile_blank.png";
import {
    FavoriteBorder,
    Favorite,
    MoreHoriz,
    BookmarkBorderOutlined,
    Bookmark,
    LocationOn,
    Close,
    ChatBubbleOutline,
    SendOutlined,
} from "@mui/icons-material";

import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import WarningRoundedIcon from "@mui/icons-material/WarningRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

import { deletePost, likePost, addComment, updatePost, savePost, deleteComment, getFollowingUsers } from "../../services/api";
import ScrollableCommentsDrawer from "./ScrollableCommentsDrawer";
import { useNavigate } from "react-router-dom";
import { useAppNotifications } from "../../hooks/useNotification";
import ImageDialog from "../ImageDialog";
import socket from "../../services/socket";

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
    return (
        <Box
            sx={{
                width: 34,
                height: 34,
                borderRadius: "10px",
                background: danger || warning ? "rgba(255,59,48,0.08)" : muted ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: danger || warning ? "rgba(255,100,100,0.6)" : muted ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.5)",
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
                borderRadius: "12px",
                textTransform: "none",
                justifyContent: "flex-start",
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: warning ? 600 : 500,
                fontSize: "0.875rem",
                color: warning ? "#fff" : danger ? "rgba(255,100,100,0.85)" : muted ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.8)",
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
                    color: warning || danger ? "#ff6b6b" : muted ? "rgba(255,255,255,0.55)" : "#fff",
                },
                "&:disabled": { color: "rgba(255,255,255,0.2)" },
            }}
        >
            <DialogIconWrap danger={danger} warning={warning} muted={muted}>
                {icon}
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
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)",
                mx: 1,
                my: 0.5,
            }}
        />
    );
}

/* ─── Component ─────────────────────────────────────────────────── */
const Post: React.FC<PostProps> = ({ post, fetchPosts, borderRadius }) => {
    const navigate = useNavigate();
    const notifications = useAppNotifications();

    const [commentText, setCommentText] = useState("");
    const [comment_count, setCommentCount] = useState(post.comment_count);
    const [likeCount, setLikeCount] = useState(post.like_count);
    const [postComments, setPostComments] = useState(post.comments);
    const [optionsDialogOpen, setOptionsDialogOpen] = useState(false);
    const [openImageDialog, setOpenImageDialog] = useState(false);
    const [isLiked, setIsLiked] = useState(post.liked_by_current_user);
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(post.content);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const postRef = useRef<HTMLDivElement>(null);
    const postWidth = postRef?.current?.offsetWidth || 0;
    const [isImageLoading, setIsImageLoading] = useState(true);
    const [selectedCommentId, setSelectedCommentId] = useState<number | null>(null);
    const [isSaved, setIsSaved] = useState(post.saved_by_current_user);
    const [confirmDeleteButtonVisibile, setConfirmDeleteButtonVisibile] = useState(false);
    const [usersModalOpen, setUsersModalOpen] = useState(false);
    const [usersList, setUsersList] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [likeAnimating, setLikeAnimating] = useState(false);

    const filteredUsers = usersList.filter((user: User) => user.username.toLowerCase().includes(searchTerm.toLowerCase()));

    const currentUser = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") || "") : {};

    const commentInputRef = useRef<HTMLInputElement>(null);
    const isOwner = currentUser?.id === post.user_id;

    const handleUserClick = (user: User) => {
        socket.emit("sendMessage", {
            tempId: Date.now() + Math.floor(Math.random() * 1000),
            senderId: currentUser.id,
            receiverId: user.id,
            postId: post.id,
        });
        notifications.show("Post sent!", {
            severity: "success",
            autoHideDuration: 3000,
        });
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
            notifications.show("Failed to update like", {
                severity: "error",
                autoHideDuration: 3000,
            });
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

    const handleComment = async () => {
        if (!commentText) return;
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
        setPostComments([newComment, ...postComments]);
        setCommentText("");
        setCommentCount(comment_count + 1);
        try {
            const res = await addComment(post.id, commentText);
            if (res?.success) fetchPosts();
            else throw new Error();
        } catch {
            setPostComments((p) => p.filter((c) => c.id !== newComment.id));
            setCommentCount(comment_count - 1);
            notifications.show("Error adding comment.", {
                severity: "error",
                autoHideDuration: 3000,
            });
        }
    };

    const handleDeleteComment = async () => {
        if (!selectedCommentId) return;
        const toDelete = postComments.find((c) => c.id === selectedCommentId);
        setPostComments(postComments.filter((c) => c.id !== selectedCommentId));
        try {
            const res = await deleteComment(selectedCommentId);
            if (res?.success) fetchPosts();
            else throw new Error();
        } catch {
            setPostComments((p) => [toDelete!, ...p]);
            notifications.show("Error deleting comment.", {
                severity: "error",
                autoHideDuration: 3000,
            });
        }
    };

    const handleDelete = async () => {
        try {
            const res = await deletePost(post.id);
            if (res?.success) {
                setOptionsDialogOpen(false);
                setConfirmDeleteButtonVisibile(false);
                fetchPosts();
            }
        } catch {}
    };

    const handleSavePost = async () => {
        const prev = isSaved;
        setIsSaved(!prev);
        try {
            const res = await savePost(post.id);
            if (res.success) {
                if (!prev)
                    notifications.show("Saved!", {
                        severity: "success",
                        autoHideDuration: 2000,
                    });
            } else {
                setIsSaved(prev);
            }
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

    const handleDoubleClickLike = async () => {
        if (!isLiked) await handleLike();
    };

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        @keyframes likePopIn {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.5); }
          70%  { transform: scale(0.88); }
          100% { transform: scale(1); }
        }
        .like-pop { animation: likePopIn 0.36s cubic-bezier(0.36,0.07,0.19,0.97) both; }
      `}</style>

            <Box
                sx={{
                    width: "100%",
                    backgroundColor: "#151515",
                    borderRadius: borderRadius,
                    overflow: "hidden",
                }}
            >
                {/* ── Header ── */}
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        px: 2,
                        py: 1.5,
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.25,
                            cursor: "pointer",
                        }}
                        onClick={() => navigate(`/profile/${post.user_id}`)}
                    >
                        <Avatar
                            src={post.profile_picture || BlankProfileImage}
                            sx={{
                                width: 36,
                                height: 36,
                                border: "2px solid rgba(255,255,255,0.08)",
                            }}
                        />
                        <Box>
                            <Typography
                                sx={{
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontWeight: 600,
                                    fontSize: "0.85rem",
                                    color: "#e8eaed",
                                    lineHeight: 1.2,
                                }}
                            >
                                {post.username}
                            </Typography>
                            {post.location && (
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 0.25,
                                        mt: 0.15,
                                    }}
                                >
                                    <LocationOn sx={{ fontSize: "0.65rem", color: "#aaa" }} />
                                    <Typography
                                        sx={{
                                            fontFamily: "'DM Sans', sans-serif",
                                            fontSize: "0.68rem",
                                            color: "#aaa",
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
                            onClick={() => setOptionsDialogOpen(true)}
                            size="small"
                            sx={{
                                color: "#bbb",
                                "&:hover": {
                                    backgroundColor: "rgba(255,255,255,0.05)",
                                    color: "#e8eaed",
                                },
                            }}
                        >
                            <MoreHoriz sx={{ fontSize: 20 }} />
                        </IconButton>
                    )}
                </Box>

                {/* ── Image ── */}
                {post.file_url && (
                    <Box
                        ref={postRef}
                        onDoubleClick={handleDoubleClickLike}
                        onClick={() => setOpenImageDialog(true)}
                        sx={{
                            position: "relative",
                            width: "100%",
                            height: postWidth ? (post.media_height / post.media_width) * postWidth : 400,
                            cursor: "pointer",
                            overflow: "hidden",
                            backgroundColor: "#111316",
                        }}
                    >
                        {isImageLoading && (
                            <>
                                <Box
                                    component="img"
                                    src={post.file_url}
                                    sx={{
                                        position: "absolute",
                                        inset: 0,
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        filter: "blur(24px)",
                                        transform: "scale(1.12)",
                                    }}
                                />
                                <Box
                                    sx={{
                                        position: "absolute",
                                        inset: 0,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        zIndex: 2,
                                    }}
                                >
                                    <CircularProgress size={20} sx={{ color: "rgba(255,255,255,0.3)" }} />
                                </Box>
                            </>
                        )}
                        <Box
                            component="img"
                            src={post.file_url}
                            alt="Post"
                            sx={{
                                width: "100%",
                                height: "100%",
                                objectFit: "contain",
                                opacity: isImageLoading ? 0 : 1,
                                transition: "opacity 0.4s ease",
                                display: "block",
                            }}
                            onLoad={() => setIsImageLoading(false)}
                        />
                    </Box>
                )}

                {/* ── Actions ── */}
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        px: 1.5,
                        pt: 0.75,
                        pb: 0.25,
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                        <IconButton
                            onClick={handleLike}
                            disableRipple
                            className={likeAnimating ? "like-pop" : ""}
                            sx={{
                                p: 0.75,
                                color: isLiked ? "#e63946" : "#aaa",
                                transition: "color 0.15s",
                                "&:hover": {
                                    backgroundColor: "transparent",
                                    color: isLiked ? "#e63946" : "#e8eaed",
                                },
                            }}
                        >
                            {isLiked ? <Favorite sx={{ fontSize: 22 }} /> : <FavoriteBorder sx={{ fontSize: 22 }} />}
                        </IconButton>
                        <Typography
                            sx={{
                                fontFamily: "'DM Sans', sans-serif",
                                fontSize: "0.78rem",
                                color: "#999",
                                mr: 1,
                            }}
                        >
                            {likeCount}
                        </Typography>
                        <IconButton
                            disableRipple
                            onClick={() => {
                                commentInputRef.current?.focus();
                                setDrawerOpen(true);
                            }}
                            sx={{
                                p: 0.75,
                                color: "#aaa",
                                "&:hover": { backgroundColor: "transparent", color: "#e8eaed" },
                            }}
                        >
                            <ChatBubbleOutline sx={{ fontSize: 21 }} />
                        </IconButton>
                        <Typography
                            sx={{
                                fontFamily: "'DM Sans', sans-serif",
                                fontSize: "0.78rem",
                                color: "#999",
                                mr: 1,
                            }}
                        >
                            {post.comment_count}
                        </Typography>
                        <IconButton
                            disableRipple
                            onClick={handlePaperPlaneClick}
                            sx={{
                                p: 0.75,
                                color: "#aaa",
                                "&:hover": { backgroundColor: "transparent", color: "#e8eaed" },
                            }}
                        >
                            <SendOutlined sx={{ fontSize: 21 }} />
                        </IconButton>
                    </Box>
                    <IconButton
                        disableRipple
                        onClick={handleSavePost}
                        sx={{
                            p: 0.75,
                            color: isSaved ? "#e8eaed" : "#aaa",
                            transition: "color 0.15s",
                            "&:hover": { backgroundColor: "transparent", color: "#e8eaed" },
                        }}
                    >
                        {isSaved ? <Bookmark sx={{ fontSize: 22 }} /> : <BookmarkBorderOutlined sx={{ fontSize: 22 }} />}
                    </IconButton>
                </Box>

                {/* ── Caption ── */}
                <Box sx={{ px: 2, pb: 2 }}>
                    {post.content && (
                        <Typography
                            sx={{
                                fontFamily: "'DM Sans', sans-serif",
                                fontSize: "0.88rem",
                                color: "#c4c7cc",
                                lineHeight: 1.6,
                            }}
                        >
                            <Box
                                component="span"
                                onClick={() => navigate(`/profile/${post.user_id}`)}
                                sx={{
                                    fontWeight: 600,
                                    mr: 0.75,
                                    cursor: "pointer",
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
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: "0.68rem",
                            color: "#ccc",
                            mt: 0.75,
                            letterSpacing: "0.04em",
                            textTransform: "uppercase",
                        }}
                    >
                        {post.timeAgo}
                    </Typography>
                </Box>
            </Box>

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
                {post.file_url && (
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
                            onClick={() => setIsEditing(false)}
                            size="small"
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
                        gap: 1.5,
                        alignItems: "flex-end",
                        borderTop: post.file_url ? "1px solid rgba(255,255,255,0.07)" : "none",
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
                        disabled={editedContent === post.content}
                        sx={{
                            textTransform: "none",
                            fontFamily: "'DM Sans', sans-serif",
                            fontWeight: 600,
                            fontSize: "0.82rem",
                            borderRadius: "10px",
                            px: 2.5,
                            py: 0.9,
                            flexShrink: 0,
                            backgroundColor: "#e8eaed",
                            color: "#0d0d0d",
                            "&:hover": { backgroundColor: "#c4c7cc" },
                            "&:disabled": {
                                backgroundColor: "rgba(255,255,255,0.08)",
                                color: "#bbb",
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
                        setConfirmDeleteButtonVisibile(false);
                    }}
                    fullWidth
                    maxWidth="xs"
                    BackdropProps={dialogBackdrop}
                    sx={{ "& .MuiDialog-paper": dialogPaperSx }}
                >
                    <DialogButton
                        icon={<EditRoundedIcon sx={{ fontSize: "1.1rem" }} />}
                        label="Edit caption"
                        onClick={() => {
                            setIsEditing(true);
                            setEditedContent(post.content);
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
                        label={confirmDeleteButtonVisibile ? "Confirm delete" : "Delete post"}
                        onClick={() => (confirmDeleteButtonVisibile ? handleDelete() : setConfirmDeleteButtonVisibile(true))}
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
                    {/* Search header */}
                    <Box
                        sx={{
                            px: 2,
                            pt: 1.75,
                            pb: 1.25,
                            borderBottom: "1px solid rgba(255,255,255,0.07)",
                        }}
                    >
                        <TextField
                            variant="standard"
                            size="small"
                            placeholder="Search…"
                            fullWidth
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                disableUnderline: true,
                                sx: {
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontSize: "0.88rem",
                                    color: "#e8eaed",
                                    "& input::placeholder": { color: "rgba(255,255,255,0.3)" },
                                },
                            }}
                        />
                    </Box>

                    {filteredUsers.length > 0 ? (
                        filteredUsers.map((user: User) => (
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
                                    borderRadius: "12px",
                                    mx: 0.5,
                                    transition: "background 0.2s ease",
                                    "&:hover": { backgroundColor: "rgba(124,92,252,0.1)" },
                                }}
                            >
                                <Avatar
                                    src={user.profile_picture || BlankProfileImage}
                                    sx={{
                                        width: 36,
                                        height: 36,
                                        border: "2px solid rgba(255,255,255,0.08)",
                                    }}
                                />
                                <Typography
                                    sx={{
                                        fontFamily: "'DM Sans', sans-serif",
                                        fontSize: "0.88rem",
                                        fontWeight: 500,
                                        color: "#e8eaed",
                                    }}
                                >
                                    {user.username}
                                </Typography>
                            </Box>
                        ))
                    ) : (
                        <Box sx={{ py: 5, textAlign: "center" }}>
                            <Typography
                                sx={{
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontSize: "0.85rem",
                                    color: "rgba(255,255,255,0.3)",
                                }}
                            >
                                No users found
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
                setSelectedCommentId={setSelectedCommentId}
                handleDeleteComment={handleDeleteComment}
            />
            <ImageDialog openDialog={openImageDialog} handleCloseDialog={() => setOpenImageDialog(false)} selectedImage={post.file_url || ""} />
        </>
    );
};

export default Post;
