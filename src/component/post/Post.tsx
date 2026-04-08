import React, { useState, useRef } from "react";
import { Typography, IconButton, Avatar, Box, TextField, Dialog, DialogContent, Button, CircularProgress, useTheme } from "@mui/material";
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

const ACCENT = "#7c5cfc";

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
    const theme = useTheme();
    return (
        <Button
            fullWidth
            onClick={onClick}
            disabled={disabled}
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                px: 1.5,
                py: 1.125,
                borderRadius: "10px",
                textTransform: "none",
                justifyContent: "flex-start",
                fontFamily: "'Inter', -apple-system, sans-serif",
                fontWeight: 500,
                fontSize: "0.875rem",
                color: warning
                    ? theme.palette.text.primary
                    : danger
                      ? theme.palette.error.main
                      : muted
                        ? theme.palette.text.disabled
                        : theme.palette.text.secondary,
                backgroundColor: warning ? `${theme.palette.error.main}18` : "transparent",
                transition: "background 0.15s",
                "&:hover": {
                    backgroundColor: warning || danger ? `${theme.palette.error.main}14` : muted ? theme.palette.action.hover : `${ACCENT}12`,
                    color: warning || danger ? theme.palette.error.main : muted ? theme.palette.text.secondary : theme.palette.text.primary,
                },
                "&:disabled": { color: theme.palette.action.disabled },
            }}
        >
            <Box
                sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "9px",
                    flexShrink: 0,
                    backgroundColor: danger || warning ? `${theme.palette.error.main}14` : theme.palette.action.hover,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: danger || warning ? theme.palette.error.main : muted ? theme.palette.text.disabled : theme.palette.text.secondary,
                }}
            >
                {icon}
            </Box>
            {label}
        </Button>
    );
}

function DialogDivider() {
    return <Box sx={{ height: "1px", backgroundColor: (t) => t.palette.divider, mx: 0.5, my: 0.375 }} />;
}

const Post: React.FC<PostProps> = ({ post, fetchPosts, borderRadius }) => {
    const theme = useTheme();
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
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [usersModalOpen, setUsersModalOpen] = useState(false);
    const [usersList, setUsersList] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [likeAnimating, setLikeAnimating] = useState(false);

    const filteredUsers = usersList.filter((u: User) => u.username.toLowerCase().includes(searchTerm.toLowerCase()));

    const currentUser = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") || "") : {};
    const commentInputRef = useRef<HTMLInputElement>(null);
    const isOwner = currentUser?.id === post.user_id;

    const dialogPaperSx = {
        borderRadius: "16px",
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: "0 16px 40px rgba(0,0,0,0.2)",
        color: theme.palette.text.primary,
        overflow: "hidden",
        padding: "6px",
    };

    const dialogBackdrop = {
        sx: { backdropFilter: "blur(4px)", backgroundColor: "rgba(0,0,0,0.4)" },
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
            <style>{`
        @keyframes likePopIn {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.45); }
          70%  { transform: scale(0.9); }
          100% { transform: scale(1); }
        }
        .like-pop { animation: likePopIn 0.35s cubic-bezier(0.36,0.07,0.19,0.97) both; }
      `}</style>

            <Box
                sx={{
                    width: "100%",
                    backgroundColor: (t) => t.palette.background.paper,
                    borderRadius,
                    overflow: "hidden",
                    border: "1px solid",
                    borderColor: (t) => t.palette.divider,
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
                                    <LocationOn sx={{ fontSize: "0.6rem", color: (t) => t.palette.text.disabled }} />
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
                        const isVideo = /\.(mp4|mov|webm)$/i.test(post.file_url!);
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
                                }}
                            >
                                {isVideo ? (
                                    <VideoPlayer src={post.file_url!} />
                                ) : (
                                    <>
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
                                                        filter: "blur(20px)",
                                                        transform: "scale(1.1)",
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
                                                    <CircularProgress size={18} sx={{ color: (t) => t.palette.text.disabled }} />
                                                </Box>
                                            </>
                                        )}
                                        <Box
                                            component="img"
                                            src={post.file_url}
                                            alt="Post"
                                            onClick={() => setOpenImageDialog(true)}
                                            onDoubleClick={async () => {
                                                if (!isLiked) await handleLike();
                                            }}
                                            sx={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "contain",
                                                opacity: isImageLoading ? 0 : 1,
                                                transition: "opacity 0.3s ease",
                                                display: "block",
                                                cursor: "pointer",
                                            }}
                                            onLoad={() => setIsImageLoading(false)}
                                        />
                                    </>
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
                            <SendOutlined sx={{ fontSize: 20 }} />
                        </IconButton>
                    </Box>

                    {/* Save */}
                    <IconButton
                        disableRipple
                        onClick={handleSavePost}
                        sx={{
                            p: 0.75,
                            color: isSaved ? (t) => t.palette.text.primary : (t) => t.palette.text.disabled,
                            transition: "color 0.15s",
                            "&:hover": { backgroundColor: "transparent", color: (t) => t.palette.text.primary },
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
                            fontSize: "0.67rem",
                            color: (t) => t.palette.text.disabled,
                            mt: 0.625,
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
                    <DialogDivider />
                    <DialogBtn
                        icon={<CloseRoundedIcon sx={{ fontSize: "1rem" }} />}
                        label="Cancel"
                        onClick={() => {
                            setOptionsDialogOpen(false);
                            setConfirmDelete(false);
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
                    <Box sx={{ px: 1.5, pt: 1.25, pb: 1, borderBottom: "1px solid", borderColor: (t) => t.palette.divider }}>
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
                                    fontFamily: "'Inter', sans-serif",
                                    fontSize: "0.875rem",
                                    color: (t) => t.palette.text.primary,
                                    "& input::placeholder": { color: (t) => t.palette.text.disabled },
                                },
                            }}
                        />
                    </Box>

                    {filteredUsers.length > 0 ? (
                        <Box sx={{ py: "4px" }}>
                            {filteredUsers.map((user: User) => (
                                <Box
                                    key={user.id}
                                    onClick={() => handleUserClick(user)}
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1.25,
                                        px: 1.5,
                                        py: 1,
                                        cursor: "pointer",
                                        borderRadius: "10px",
                                        mx: 0.5,
                                        transition: "background 0.15s",
                                        "&:hover": { backgroundColor: `${ACCENT}12` },
                                    }}
                                >
                                    <Avatar
                                        src={user.profile_picture || BlankProfileImage}
                                        sx={{ width: 32, height: 32, border: "1px solid", borderColor: (t) => t.palette.divider }}
                                    />
                                    <Typography
                                        sx={{
                                            fontFamily: "'Inter', sans-serif",
                                            fontSize: "0.85rem",
                                            fontWeight: 500,
                                            color: (t) => t.palette.text.primary,
                                        }}
                                    >
                                        {user.username}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    ) : (
                        <Box sx={{ py: 4, textAlign: "center" }}>
                            <Typography sx={{ fontFamily: "'Inter', sans-serif", fontSize: "0.82rem", color: (t) => t.palette.text.disabled }}>
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
