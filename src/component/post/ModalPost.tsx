import React, { useState, useRef, useEffect } from "react";
import {
    Card,
    CardContent,
    Typography,
    CardActions,
    IconButton,
    Avatar,
    Grid,
    Box,
    CardMedia,
    TextField,
    Dialog,
    Button,
    Popover,
    Skeleton,
    CircularProgress,
} from "@mui/material";
import BlankProfileImage from "../../static/profile_blank.png";
import { FavoriteBorder, Favorite, MoreVert, MoreHoriz, Close } from "@mui/icons-material";
import { deletePost, likePost, addComment, updatePost, deleteComment, toggleLikeComment, getUserPostDetails } from "../../services/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComment } from "@fortawesome/free-regular-svg-icons";
import ImageDialog from "../ImageDialog";
import { SentimentSatisfiedAlt as EmojiIcon } from "@mui/icons-material";
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

const ModalPost: React.FC<PostProps> = ({ postId, fetchPosts, borderRadius, isMobile, handleCloseModal, userId }) => {
    const [commentText, setCommentText] = useState("");
    const [commentOptionsDialogOpen, setCommentOptionsDialog] = useState(false);
    const [confirmDeleteButtonVisibile, setConfirmDeleteButtonVisibile] = useState<boolean>(false);
    const [selectedCommentId, setSelectedCommentId] = useState<number | null>(null);
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
    const [deletingPostCommentLoading, setDeletingPostCommentLoading] = useState(false);
    const [postingCommentLoading, setPostingCommentLoading] = useState(false);
    const [editingPostLoading, setEditingPostLoading] = useState(false);

    const currentUser = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") || "") : {};
    const commentInputRef = useRef<HTMLInputElement>(null);

    const visibleComments = showAllComments ? post?.comments || [] : (post?.comments || []).slice(0, 2);

    const handleFocusCommentField = () => {
        if (commentInputRef.current) {
            commentInputRef.current.focus();
        }
    };

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

        const previousIsLiked = post?.liked_by_current_user;
        const previousLikes = post?.like_count;

        // Optimistic update
        setPost({
            ...post,
            liked_by_current_user: !previousIsLiked,
            like_count: previousIsLiked ? previousLikes - 1 : previousLikes + 1,
        });

        try {
            await likePost(post?.id);
            fetchPosts();
        } catch (error) {
            notifications.show(`Failed to ${previousIsLiked ? "unlike" : "like"} the post. Please try again later.`, {
                severity: "error",
                autoHideDuration: 3000,
            });
            console.log(error);
            // Revert on error
            setPost({
                ...post,
                liked_by_current_user: previousIsLiked,
                like_count: previousLikes,
            });
        }
    };

    const handleComment = async () => {
        if (!post || !commentText) return;
        setPostingCommentLoading(true);

        try {
            const response = await addComment(post?.id, commentText);
            if (response?.success) {
                const newComment = {
                    id: Date.now(),
                    post_id: post?.id,
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
                    comments: [newComment, ...post?.comments],
                    comment_count: post?.comment_count + 1,
                });
                setCommentText("");
                fetchPosts();
            }
        } catch (error) {
            console.error("Error adding comment:", error);
            notifications.show(`Failed to post comment. Please try again later.`, {
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
                    comments: post?.comments.filter((comment) => comment.id !== selectedCommentId),
                    comment_count: post?.comment_count - 1,
                });
                fetchPosts();
            }
        } catch (error) {
            console.error("Error deleting comment:", error);
            notifications.show(`Failed to delete comment. Please try again later.`, {
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

        // Find the comment to update
        const commentToUpdate = post?.comments.find((comment) => comment.id === commentId);
        if (!commentToUpdate) return;

        const newLikedStatus = !commentToUpdate.liked_by_user;
        const newLikeCount = newLikedStatus ? commentToUpdate.likes_count + 1 : commentToUpdate.likes_count - 1;

        // Optimistic update
        setPost({
            ...post,
            comments: post?.comments.map((comment) =>
                comment.id === commentId ? { ...comment, liked_by_user: newLikedStatus, likes_count: newLikeCount } : comment
            ),
        });

        try {
            await toggleLikeComment(commentId);
        } catch (error) {
            console.error("Failed to like/unlike comment:", error);
            // Revert on error
            setPost({
                ...post,
                comments: post?.comments.map((comment) =>
                    comment.id === commentId
                        ? { ...comment, liked_by_user: commentToUpdate.liked_by_user, likes_count: commentToUpdate.likes_count }
                        : comment
                ),
            });

            notifications.show(`Failed to ${newLikedStatus ? "like" : "unlike"} the comment. Please try again later.`, {
                severity: "error",
                autoHideDuration: 3000,
            });
        }
    };

    const handleDeletePost = async () => {
        if (!post) return;

        try {
            const res = await deletePost(post?.id);
            if (res?.success) {
                fetchPosts();
                handleCloseModal();
            }
        } catch (error) {
            console.error("Error deleting post:", error);
            notifications.show(`Failed to delete post. Please try again later.`, {
                severity: "error",
                autoHideDuration: 3000,
            });
        }
    };

    const handleOptionsDialogClose = () => {
        setOptionsDialogOpen(false);
        setConfirmDeleteButtonVisibile(false);
    };

    const handleOptionsDialogOpen = () => {
        setOptionsDialogOpen(true);
    };

    const handleEditClick = () => {
        if (post?.content) {
            setEditedContent(post.content);
        }
        setIsEditing(true);
    };

    const handleCloseDialog = () => {
        setOpenImageDialog(false);
    };

    const handleOpenCommentOptionsDialog = (commentId: number) => {
        setSelectedCommentId(commentId);
        setCommentOptionsDialog(true);
    };

    const handleCloseCommentOptionsDialog = () => {
        setCommentOptionsDialog(false);
        setSelectedCommentId(null);
        setConfirmDeleteButtonVisibile(false);
    };

    const handleSaveEdit = async () => {
        if (!post) return;
        setEditingPostLoading(true);

        try {
            const response = await updatePost(post?.id, editedContent);
            if (response?.success) {
                setIsEditing(false);
                setPost({
                    ...post,
                    content: editedContent,
                });
                fetchPosts();
            }
        } catch (error) {
            console.error("Error updating post:", error);
            notifications.show(`Failed to update post. Please try again later.`, {
                severity: "error",
                autoHideDuration: 3000,
            });
        } finally {
            setEditingPostLoading(false);
        }
    };

    const handleEmojiClick = (emojiData: any) => {
        setCommentText((prev) => prev + emojiData.emoji);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditedContent("");
    };

    return (
        <Card
            sx={{
                borderRadius: { borderRadius },
                "& .MuiCardContent-root": {
                    padding: 0,
                    backgroundColor: "black",
                },
                padding: 0,
            }}
        >
            <CardContent
                sx={{
                    padding: "0px !important",
                }}
            >
                {fetchingPostDetails ? (
                    <Box sx={{ p: 0 }}>
                        <Grid container spacing={2}>
                            {/* Left column for image skeleton */}
                            <Grid item xs={12} sm={6}>
                                <Skeleton variant="rectangular" width="100%" height={500} />
                            </Grid>

                            {/* Right column for content skeleton */}
                            <Grid item xs={12} sm={6}>
                                <Box sx={{ display: "flex", alignItems: "center", mb: 2, p: "20px 0" }}>
                                    <Skeleton variant="circular" width={50} height={50} />
                                    <Box sx={{ ml: 2 }}>
                                        <Skeleton variant="text" width={100} height={20} />
                                        <Skeleton variant="text" width={80} height={16} />
                                    </Box>
                                </Box>

                                <Box sx={{ mb: 2 }}>
                                    <Skeleton variant="text" width="80%" height={24} />
                                    <Skeleton variant="text" width="60%" height={24} />
                                </Box>

                                <Box sx={{ display: "flex", mb: 2 }}>
                                    <Skeleton variant="circular" width={32} height={32} sx={{ mr: 1 }} />
                                    <Skeleton variant="circular" width={32} height={32} sx={{ mr: 1 }} />
                                </Box>

                                <Box sx={{ mb: 2 }}>
                                    <Skeleton variant="text" width="100%" height={56} />
                                </Box>

                                <Box>
                                    {[1, 2, 3].map((item) => (
                                        <Box key={item} sx={{ display: "flex", mb: 2 }}>
                                            <Skeleton variant="circular" width={32} height={32} sx={{ mr: 2 }} />
                                            <Box sx={{ flexGrow: 1 }}>
                                                <Skeleton variant="text" width="60%" height={20} />
                                                <Skeleton variant="text" width="80%" height={16} />
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                            </Grid>
                        </Grid>
                    </Box>
                ) : (
                    <Box sx={{}}>
                        <Grid container spacing={2}>
                            {/* Left column for image */}
                            <Grid item xs={12} sm={6}>
                                {post?.file_url && (
                                    <CardMedia
                                        component="img"
                                        image={post?.file_url}
                                        alt="Post Image"
                                        sx={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            cursor: "pointer",
                                        }}
                                        onClick={() => setOpenImageDialog(true)}
                                    />
                                )}
                            </Grid>

                            {/* Right column for post details */}
                            <Grid item xs={12} sm={6} sx={{ padding: "0px !important" }}>
                                <Box>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            padding: isMobile ? "0 10px 10px 10px" : "35px 15px 5px 15px",
                                        }}
                                    >
                                        <Avatar
                                            src={post?.profile_picture || BlankProfileImage}
                                            alt={post?.username}
                                            sx={{ width: isMobile ? 42 : 52, height: isMobile ? 42 : 52 }}
                                        />
                                        <Box sx={{ ml: 2 }}>
                                            <Typography sx={{ fontSize: isMobile ? "0.85rem" : "1rem" }}>{post?.username}</Typography>
                                            <Typography sx={{ fontSize: isMobile ? "0.7rem" : "0.8rem" }} color="text.secondary">
                                                {post?.timeAgo}
                                            </Typography>
                                        </Box>
                                        {currentUser?.id && (
                                            <>
                                                <IconButton
                                                    onClick={handleOptionsDialogOpen}
                                                    sx={{
                                                        ml: "auto",
                                                        ":hover": {
                                                            backgroundColor: "transparent",
                                                        },
                                                    }}
                                                >
                                                    <MoreVert
                                                        sx={{
                                                            fontSize: isMobile ? "1rem" : "1.2rem",
                                                        }}
                                                    />
                                                </IconButton>
                                            </>
                                        )}
                                    </Box>

                                    {currentUser?.id && (
                                        <CardActions
                                            sx={{
                                                justifyContent: "space-between",
                                                marginTop: "16px",
                                                padding: isMobile ? "0 10px 10px 10px" : "0 15px",
                                            }}
                                        >
                                            <Box>
                                                <IconButton
                                                    onClick={handleLike}
                                                    sx={{ color: post?.liked_by_current_user ? "#FF3040" : "#787a7a", padding: "0" }}
                                                >
                                                    {post?.liked_by_current_user ? (
                                                        <Favorite sx={{ fontSize: "35px", mr: 1 }} />
                                                    ) : (
                                                        <FavoriteBorder sx={{ fontSize: "35px", mr: 1 }} />
                                                    )}
                                                </IconButton>
                                                <Typography variant="body2" component="span" sx={{ mr: 2, color: "#787a7a" }}>
                                                    {post?.like_count}
                                                </Typography>
                                                <IconButton onClick={handleFocusCommentField} sx={{ color: "#787a7a", padding: "0", mr: 1 }}>
                                                    <FontAwesomeIcon icon={faComment} style={{ fontSize: "31px" }} />
                                                </IconButton>
                                                <Typography variant="body2" component="span" sx={{ mr: 1, color: "#787a7a" }}>
                                                    {post?.comment_count}
                                                </Typography>
                                            </Box>
                                        </CardActions>
                                    )}
                                    <Typography
                                        sx={{
                                            mt: 2,
                                            fontSize: isMobile ? "0.85rem" : "1rem",
                                            padding: isMobile ? "0 10px 10px 10px" : "0 15px",
                                        }}
                                    >
                                        {post?.content}
                                    </Typography>

                                    <Box
                                        sx={{
                                            mt: 2,
                                            display: "flex",
                                            alignItems: "flex-start", // top alignment
                                            borderTop: "1px solid #202327",
                                            padding: isMobile ? "0 10px 10px 10px" : "15px",
                                            gap: 0,
                                        }}
                                    >
                                        {currentUser?.id && (
                                            <>
                                                <TextField
                                                    fullWidth
                                                    placeholder="Add a comment..."
                                                    variant="standard"
                                                    value={commentText}
                                                    onChange={(e) => setCommentText(e.target.value)}
                                                    inputRef={commentInputRef}
                                                    sx={{
                                                        "& .MuiInput-underline:before": { borderBottom: "none !important" },
                                                        "& .MuiInput-underline:after": { borderBottom: "none !important" },
                                                        "& .MuiInput-underline:hover:before": { borderBottom: "none !important" },
                                                    }}
                                                />
                                                <IconButton size="small" onClick={(e) => setEmojiAnchorEl(e.currentTarget)}>
                                                    <EmojiIcon />
                                                </IconButton>
                                                <Button
                                                    onClick={handleComment}
                                                    size="small"
                                                    sx={{
                                                        color: "#ffffff",
                                                        borderRadius: "15px",
                                                        alignSelf: "flex-start",
                                                        mt: "2px",
                                                        ":hover": { backgroundColor: "transparent" },
                                                    }}
                                                    disabled={!commentText || postingCommentLoading}
                                                >
                                                    {postingCommentLoading ? <CircularProgress size={20} sx={{ color: "#ffffff" }} /> : "Post"}
                                                </Button>
                                            </>
                                        )}
                                    </Box>

                                    <Box sx={{ padding: isMobile ? "0 10px 10px 10px" : "15px", borderTop: "1px solid #202327" }}>
                                        {visibleComments.length === 0 ? (
                                            <Box sx={{ display: "flex", justifyContent: "center" }}>
                                                <Typography variant="body2" color="#787a7a">
                                                    No comments yet
                                                </Typography>
                                            </Box>
                                        ) : (
                                            <Box
                                                sx={{
                                                    maxHeight: "50vh",
                                                    overflowY: "scroll",
                                                    paddingRight: 2,
                                                }}
                                            >
                                                {visibleComments.map((comment) => (
                                                    <Box key={comment.id} sx={{ mb: 3 }}>
                                                        <Box
                                                            sx={{ display: "flex", alignItems: "center" }}
                                                            onMouseEnter={() => setHoveredCommentId(comment.id)}
                                                            onMouseLeave={() => setHoveredCommentId(null)}
                                                        >
                                                            <Avatar
                                                                src={comment.commenter_profile_picture || BlankProfileImage}
                                                                alt={comment.commenter_username}
                                                                sx={{ width: isMobile ? 30 : 40, height: isMobile ? 30 : 40 }}
                                                            />
                                                            <Box sx={{ ml: 2, display: "flex", justifyContent: "space-between", width: "100%" }}>
                                                                <Box>
                                                                    <Box sx={{ display: "flex", flexDirection: "row" }}>
                                                                        <Typography variant="body2" color="text.primary">
                                                                            <strong
                                                                                style={{
                                                                                    fontWeight: "bold",
                                                                                    marginRight: "4px",
                                                                                    color: "#aaaaaa",
                                                                                }}
                                                                            >
                                                                                {comment.commenter_username}
                                                                            </strong>
                                                                        </Typography>
                                                                        {hoveredCommentId === comment.id && comment.user_id === currentUser.id && (
                                                                            <IconButton
                                                                                onClick={() => handleOpenCommentOptionsDialog(comment.id)}
                                                                                sx={{ color: "#aaaaaa", padding: 0 }}
                                                                            >
                                                                                <MoreHoriz sx={{ fontSize: 20 }} />
                                                                            </IconButton>
                                                                        )}
                                                                    </Box>
                                                                    <Typography variant="body2" color="text.primary">
                                                                        {comment.content}
                                                                    </Typography>
                                                                </Box>
                                                                <Typography variant="caption" sx={{ ml: 2, color: "#666666" }}>
                                                                    {comment.timeAgo}
                                                                </Typography>
                                                            </Box>
                                                            <Box
                                                                sx={{
                                                                    display: "flex",
                                                                    flexDirection: "column",
                                                                    alignItems: "center",
                                                                    ml: 2,
                                                                    gap: 0.3,
                                                                    justifyContent: "center",
                                                                }}
                                                            >
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleLikeComment(comment.id)}
                                                                    sx={{ color: comment.likes_count ? "#ed4337" : "#787a7a", padding: 0 }}
                                                                >
                                                                    {comment.liked_by_user ? (
                                                                        <Favorite sx={{ fontSize: "16px" }} />
                                                                    ) : (
                                                                        <FavoriteBorder sx={{ fontSize: "16px" }} />
                                                                    )}
                                                                </IconButton>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {comment.likes_count}
                                                                </Typography>
                                                            </Box>
                                                        </Box>
                                                    </Box>
                                                ))}
                                            </Box>
                                        )}

                                        {post?.comments && post?.comments?.length > 3 && !showAllComments && (
                                            <Typography
                                                variant="body2"
                                                color="primary"
                                                sx={{ mt: 1, cursor: "pointer", mb: 1, textAlign: "center" }}
                                                onClick={() => setShowAllComments(true)}
                                            >
                                                View all {post?.comments.length} comments
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>
                            </Grid>
                        </Grid>
                    </Box>
                )}
            </CardContent>

            <Dialog
                open={commentOptionsDialogOpen}
                onClose={handleCloseDialog}
                fullWidth
                maxWidth="xs"
                sx={{
                    "& .MuiDialog-paper": {
                        borderRadius: "20px",
                        backgroundColor: "rgba(32, 35, 39, 0.9)",
                        color: "white",
                        textAlign: "center",
                    },
                }}
                BackdropProps={{
                    sx: {
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                        backdropFilter: "blur(5px)",
                    },
                }}
            >
                <Button
                    fullWidth
                    onClick={() => (confirmDeleteButtonVisibile ? handleDeleteComment() : setConfirmDeleteButtonVisibile(true))}
                    disabled={deletingPostCommentLoading}
                    sx={{
                        padding: "10px",
                        color: "#ffffff",
                        fontSize: isMobile ? "0.85rem" : "0.9rem",
                        backgroundColor: confirmDeleteButtonVisibile ? "#ed4337" : "#202327",
                        textTransform: "none",
                        borderRadius: 0,
                        height: "45.85px",
                        "&:hover": { backgroundColor: confirmDeleteButtonVisibile ? "#ed4337" : "#2e3238" },
                        borderBottom: "1px solid #505050",
                    }}
                >
                    {deletingPostCommentLoading ? (
                        <CircularProgress size={24} sx={{ color: "#ffffff" }} />
                    ) : confirmDeleteButtonVisibile ? (
                        "Confirm Delete Comment"
                    ) : (
                        "Delete Comment"
                    )}
                </Button>
                <Button
                    fullWidth
                    onClick={handleCloseCommentOptionsDialog}
                    sx={{
                        padding: "10px",
                        color: "#ffffff",
                        fontSize: isMobile ? "0.85rem" : "0.9rem",
                        backgroundColor: "#202327",
                        textTransform: "none",
                        borderRadius: 0,
                        "&:hover": { backgroundColor: "#2e3238" },
                    }}
                >
                    Cancel
                </Button>
            </Dialog>
            <Dialog
                open={optionsDialogOpen}
                onClose={handleOptionsDialogClose}
                fullWidth
                maxWidth="xs"
                sx={{
                    "& .MuiDialog-paper": {
                        borderRadius: "20px",
                        backgroundColor: "rgba(32, 35, 39, 0.9)",
                        color: "white",
                        textAlign: "center",
                    },
                }}
                BackdropProps={{
                    sx: {
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                        backdropFilter: "blur(5px)",
                    },
                }}
            >
                <Button
                    fullWidth
                    onClick={() => {
                        handleEditClick();
                        handleOptionsDialogClose();
                    }}
                    sx={{
                        padding: "10px",
                        color: "#ffffff",
                        fontSize: "0.9rem",
                        backgroundColor: "#202327",
                        textTransform: "none",
                        borderRadius: 0,
                        "&:hover": { backgroundColor: "#2e3238" },
                        borderBottom: "1px solid #505050",
                    }}
                >
                    Edit Post
                </Button>

                <Button
                    fullWidth
                    onClick={() => {
                        confirmDeleteButtonVisibile ? handleDeletePost() : setConfirmDeleteButtonVisibile(true);
                    }}
                    sx={{
                        padding: "10px",
                        color: "#ffffff",
                        fontSize: "0.9rem",
                        backgroundColor: confirmDeleteButtonVisibile ? "#ed4337" : "#202327",
                        textTransform: "none",
                        borderRadius: 0,
                        "&:hover": { backgroundColor: confirmDeleteButtonVisibile ? "#ed4337" : "#2e3238" },
                        borderBottom: "1px solid #505050",
                    }}
                >
                    {confirmDeleteButtonVisibile ? "Confirm Post Delete" : "Delete Post"}
                </Button>

                <Button
                    fullWidth
                    onClick={handleOptionsDialogClose}
                    sx={{
                        padding: "10px",
                        color: "#ffffff",
                        fontSize: "0.9rem",
                        backgroundColor: "#202327",
                        textTransform: "none",
                        borderRadius: 0,
                        "&:hover": { backgroundColor: "#2e3238" },
                    }}
                >
                    Cancel
                </Button>
            </Dialog>
            <ImageDialog openDialog={openImageDialog} handleCloseDialog={handleCloseDialog} selectedImage={post?.file_url || ""} />
            <Popover
                open={Boolean(emojiAnchorEl)}
                anchorEl={emojiAnchorEl}
                onClose={() => setEmojiAnchorEl(null)}
                anchorOrigin={{
                    vertical: "top",
                    horizontal: "left",
                }}
                transformOrigin={{
                    vertical: "bottom",
                    horizontal: "left",
                }}
                PaperProps={{
                    sx: {
                        borderRadius: "20px",
                    },
                }}
            >
                <EmojiPicker theme={Theme.AUTO} onEmojiClick={handleEmojiClick} />
            </Popover>
            <Dialog
                open={isEditing}
                onClose={handleCancelEdit}
                BackdropProps={{
                    sx: {
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                        backdropFilter: "blur(5px)",
                    },
                }}
                sx={{
                    "& .MuiDialog-paper": {
                        borderRadius: "20px",
                        width: "90%",
                        maxWidth: "600px",
                        backgroundColor: "rgba(0, 0, 0)", // Slight transparency
                        overflow: "hidden",
                    },
                }}
            >
                {/* Image Section */}
                {post?.file_url && (
                    <Box sx={{ position: "relative" }}>
                        <CardMedia
                            component="img"
                            image={post.file_url}
                            alt="Post Image"
                            sx={{
                                width: "100%",
                                height: "auto",
                                borderRadius: "10px 10px 0 0",
                            }}
                        />
                        {/* Cancel Button (Cross Icon) */}
                        <IconButton
                            onClick={handleCancelEdit}
                            sx={{
                                position: "absolute",
                                top: 8,
                                right: 8,
                                color: "#ffffff",
                                padding: "6px",
                                backgroundColor: "rgba(0, 0, 0, 0.5)",
                                "&:hover": {
                                    backgroundColor: "rgba(0, 0, 0, 0.7)",
                                },
                            }}
                        >
                            <Close sx={{ fontSize: "18px" }} />
                        </IconButton>
                    </Box>
                )}

                {/* TextField and Save Button Section */}
                <Box sx={{ padding: "16px" }}>
                    <Box sx={{ display: "flex", gap: 1 }}>
                        <TextField
                            fullWidth
                            multiline
                            size="small"
                            variant="standard"
                            value={editedContent}
                            onChange={(e) => setEditedContent(e.target.value)}
                            sx={{
                                flex: 1,
                                "& .MuiInput-underline:before": {
                                    borderBottom: "none !important",
                                },
                                "& .MuiInput-underline:after": {
                                    borderBottom: "none !important",
                                },
                                "& .MuiInput-underline:hover:before": {
                                    borderBottom: "none !important",
                                },
                            }}
                        />
                        {/* Save Button */}
                        <Button
                            onClick={handleSaveEdit}
                            sx={{
                                textTransform: "none",
                                "&:hover": { backgroundColor: "#a3a3a3" },
                                padding: 0,
                                borderRadius: "12px",
                                width: "70px",
                                height: "35px",
                                backgroundColor: "#ffffff",
                                color: "#000000",
                                ":disabled": {
                                    backgroundColor: "#000000",
                                    color: "#505050",
                                },
                                animation: editedContent === post?.content ? "" : "buttonEnabledAnimation 0.6s ease-out",
                            }}
                            disabled={editedContent === post?.content || editingPostLoading}
                        >
                            {editingPostLoading ? <CircularProgress size={20} sx={{ color: "#ffffff" }} /> : "Save"}
                        </Button>
                    </Box>
                </Box>
            </Dialog>
        </Card>
    );
};

export default ModalPost;
