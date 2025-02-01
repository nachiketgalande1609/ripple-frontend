import React, { useState, useRef } from "react";
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
    Menu,
    MenuItem,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Button,
} from "@mui/material";
import { FavoriteBorder, Favorite, ChatBubbleOutline, MoreVert } from "@mui/icons-material";
import { deletePost, likePost, addComment } from "../../services/api";

interface PostProps {
    username: string;
    content: string;
    likes: number;
    comments: number;
    avatarUrl?: string;
    imageUrl?: string;
    timeAgo: string;
    postId: string;
    userId: string;
    fetchPosts: () => Promise<void>;
    hasUserLikedPost: boolean;
    initialComments: Array<{
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
    }>;
    borderRadius: string;
}

const Post: React.FC<PostProps> = ({
    username,
    content,
    likes,
    comments,
    avatarUrl,
    imageUrl,
    timeAgo,
    postId,
    userId,
    fetchPosts,
    hasUserLikedPost,
    initialComments,
    borderRadius,
}) => {
    const [commentText, setCommentText] = useState("");
    const [commentCount, setCommentCount] = useState(comments);
    const [postComments, setPostComments] = useState(initialComments);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [isLiked, setIsLiked] = useState(hasUserLikedPost);

    const currentUser = JSON.parse(localStorage.getItem("user") || "");

    const [showAllComments, setShowAllComments] = useState(false);

    const visibleComments = showAllComments ? postComments : postComments.slice(0, 2);

    const commentInputRef = useRef<HTMLInputElement>(null);

    const handleFocusCommentField = () => {
        if (commentInputRef.current) {
            commentInputRef.current.focus();
        }
    };

    const handleLike = async () => {
        try {
            await likePost(currentUser.id, postId);
            setIsLiked(!isLiked);
            fetchPosts();
        } catch (error) {
            console.log(error);
        }
    };

    const handleComment = async () => {
        if (commentText) {
            try {
                const response = await addComment(currentUser.id, postId, commentText);
                if (response?.success) {
                    const newComment = {
                        id: Date.now(),
                        post_id: postId,
                        user_id: currentUser.id,
                        content: commentText,
                        parent_comment_id: null,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        commenter_username: currentUser.username,
                        commenter_profile_picture: currentUser.profile_picture_url,
                        timeAgo: "Just now",
                    };
                    setPostComments([newComment, ...postComments]);
                    setCommentText("");
                    setCommentCount(commentCount + 1);
                    fetchPosts();
                }
            } catch (error) {
                console.error("Error adding comment:", error);
            }
        }
    };

    const handleDelete = async () => {
        try {
            const res = await deletePost(userId, postId);
            if (res?.success) {
                fetchPosts();
            }
            setDialogOpen(false);
        } catch (error) {}
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    // Open the confirmation dialog
    const handleDeleteClick = () => {
        setDialogOpen(true);
        handleMenuClose(); // Close the menu
    };

    // Close the confirmation dialog without deleting
    const handleCancel = () => {
        setDialogOpen(false);
    };

    return (
        <Card sx={{ borderRadius: borderRadius }}>
            <CardContent sx={{ padding: 0 }}>
                <Box sx={{ padding: "16px" }}>
                    <Grid container spacing={2}>
                        <Grid item>
                            <Avatar src={avatarUrl || "https://via.placeholder.com/40"} alt={username} sx={{ width: 52, height: 52 }} />
                        </Grid>
                        <Grid item xs>
                            <Typography sx={{ fontSize: "16px", fontWeight: "bold" }}>{username}</Typography>
                            <Typography variant="caption" sx={{ color: "#666666" }}>
                                {timeAgo}
                            </Typography>
                        </Grid>
                        <Grid item>
                            <IconButton onClick={handleMenuOpen}>
                                <MoreVert />
                            </IconButton>
                            <Menu
                                anchorEl={anchorEl}
                                open={Boolean(anchorEl)}
                                onClose={handleMenuClose}
                                sx={{
                                    "& .MuiPaper-root": {
                                        width: "150px",
                                        padding: "3px 10px",
                                        borderRadius: "20px",
                                    },
                                }}
                            >
                                <MenuItem sx={{ height: "40px", borderRadius: "15px" }}>Edit</MenuItem>
                                <MenuItem sx={{ height: "40px", borderRadius: "15px" }} onClick={handleDeleteClick}>
                                    Delete
                                </MenuItem>
                            </Menu>
                        </Grid>
                    </Grid>
                </Box>

                {imageUrl && (
                    <Box sx={{ position: "relative", width: "100%", paddingTop: "100%" }}>
                        <CardMedia
                            component="img"
                            image={imageUrl}
                            alt="Post Image"
                            sx={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                            }}
                        />
                    </Box>
                )}

                <Typography variant="body1" sx={{ mt: 2, padding: "16px 16px 0 16px", margin: 0 }}>
                    <span style={{ fontWeight: "bold", marginRight: "8px" }}>{username}</span>
                    {content}
                </Typography>
            </CardContent>

            <CardActions sx={{ justifyContent: "space-between", height: "60px", padding: "0px 8px" }}>
                <Box>
                    <IconButton onClick={handleLike} sx={{ color: isLiked ? "red" : "white" }}>
                        {isLiked ? <Favorite sx={{ fontSize: "30px" }} /> : <FavoriteBorder sx={{ fontSize: "30px" }} />}
                    </IconButton>
                    <Typography variant="body2" component="span" sx={{ mr: 1 }}>
                        {likes}
                    </Typography>
                    <IconButton sx={{ color: "#ffffff" }} onClick={handleFocusCommentField}>
                        <ChatBubbleOutline sx={{ fontSize: "30px" }} />
                    </IconButton>
                    <Typography variant="body2" component="span" sx={{ mr: 1 }}>
                        {commentCount}
                    </Typography>
                </Box>
            </CardActions>

            <Box sx={{ padding: "0 16px 16px 16px" }}>
                <TextField
                    fullWidth
                    label="Add a comment..."
                    variant="outlined"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleComment()}
                    sx={{
                        mb: "16px",
                        "& .MuiOutlinedInput-root": {
                            borderRadius: "8px",
                        },
                    }}
                    inputRef={commentInputRef}
                />
                <Box
                    sx={{
                        maxHeight: "200px",
                        overflowY: "auto",
                        paddingRight: 2,
                        "&::-webkit-scrollbar": {
                            width: "4px",
                        },
                        "&::-webkit-scrollbar-thumb": {
                            backgroundColor: "#ffffff",
                            borderRadius: "10px",
                        },
                        "&::-webkit-scrollbar-track": {
                            backgroundColor: "#1E1E1E",
                        },
                    }}
                >
                    {visibleComments.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                            No comments yet
                        </Typography>
                    ) : (
                        visibleComments.map((comment) => (
                            <Box key={comment.id} sx={{ mb: 2 }}>
                                <Box sx={{ display: "flex", alignItems: "center" }}>
                                    <Avatar src={comment.commenter_profile_picture} alt={comment.commenter_username} sx={{ width: 40, height: 40 }} />
                                    <Box sx={{ ml: 2, display: "flex", justifyContent: "space-between", width: "100%" }}>
                                        <Typography variant="body2" color="text.primary">
                                            <strong style={{ fontWeight: "bold", marginRight: "4px" }}>{comment.commenter_username}</strong>
                                            {comment.content}
                                        </Typography>
                                        <Typography variant="caption" sx={{ ml: 2, color: "#666666" }}>
                                            {comment.timeAgo}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        ))
                    )}
                    {postComments.length > 3 && !showAllComments && (
                        <Typography variant="body2" color="primary" sx={{ mt: 2, cursor: "pointer", mb: 1 }} onClick={() => setShowAllComments(true)}>
                            View all {postComments.length} comments
                        </Typography>
                    )}
                </Box>
            </Box>

            {/* Confirmation Dialog */}
            <Dialog
                open={dialogOpen}
                onClose={handleCancel}
                sx={{
                    "& .MuiDialog-paper": {
                        borderRadius: "20px",
                    },
                }}
            >
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                    <Typography variant="body2">Are you sure you want to delete this post? This action cannot be undone.</Typography>
                </DialogContent>
                <DialogActions sx={{ padding: "16px" }}>
                    <Button onClick={handleCancel} size="large" sx={{ color: "#ffffff" }}>
                        Cancel
                    </Button>
                    <Button onClick={handleDelete} size="large" variant="contained" color="error" sx={{ borderRadius: "12px" }}>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Card>
    );
};

export default Post;
