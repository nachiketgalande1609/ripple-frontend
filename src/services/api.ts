import api from "./config";
import {
    REGISTER_ENDPOINT,
    LOGIN_ENDPOINT,
    GET_POSTS_ENDPOINT,
    GET_PROFILE_POSTS_ENDPOINT,
    GET_PROFILE_ENDPOINT,
    LIKE_POST_ENDPOINT,
    COMMENT_ENDPOINT,
    FOLLOW_ENDPOINT,
    SEARCH_ENDPOINT,
    GET_NOTIFICATIONS_ENDPOINT,
    UPDATE_POST_ENDPOINT,
    GOOGLE_LOGIN_ENDPOINT,
    GET_NOTIFICATIONS_COUNT,
    FOLLOW_RESPONSE_ENDPOINT,
    UPLOAD_PROFILE_PICTURE_ENDPOINT,
    UPDATE_PROFILE_ENDPOINT,
    SETTINGS_ENDPOINT,
    GET_ALL_MESSAGES_ENDPOINT,
    SHARE_MEDIA_ENDPOINT,
    FOLLOWING_USERS_LIST_ENDPOINT,
    GET_SAVED_POSTS_ENDPOINT,
    SAVE_POST_ENDPOINT,
    UNFOLLOW_ENDPOINT,
    UPLOAD_STORY_ENDPOINT,
    FETCH_USER_STORIES_ENDPOINT,
    DELETE_MESSAGE_ENDPOINT,
    CREATE_POST_ENDPOINT,
    DELETE_POST_ENDPOINT,
    FETCH_SEARCH_HISTORY_ENDPOINT,
    UPDATE_SEARCH_HISTORY_ENDPOINT,
    DELETE_SEARCH_HISTORY_ENDPOINT,
    DELETE_COMMENT_ENDPOINT,
    GET_ALL_MESSAGE_USERS_ENDPOINT,
    VERIFY_USER_ENDPOINT,
    GENERATE_PASSWORD_RESET_OTP_ENDPOINT,
    VERIFY_PASSWORD_RESET_OTP_ENDPOINT,
    PASSWORD_RESET_OTP_ENDPOINT,
    LIKE_COMMENT_ENDPOINT,
    GET_PROFILE_POST_DETAILS_ENDPOINT,
    CANCEL_FOLLOW_REQUEST_ENDPOINT,
    TRACK_TRAFFIC_ENDPOINT,
    GET_POST_ENDPOINT,
    REMOVE_FOLLOWER_ENDPOINT,
    SEARCH_HASHTAG_ENDPOINT,
    DELETE_HASHTAG_SEARCH_HISTORY_ENDPOINT,
    UPDATE_HASHTAG_SEARCH_HISTORY_ENDPOINT,
    FETCH_HASHTAG_SEARCH_HISTORY_ENDPOINT,
} from "./apiEndpoints";

interface UserRegisterData {
    email: string;
    username: string;
    password: string;
}

interface UserLoginData {
    email: string;
    password: string;
}

interface PostData {
    user_id: string;
    content: string;
    media?: File;
    location: string;
}

interface ProfileData {
    username?: string;
    profile_picture_url?: string;
    bio?: string;
}

interface StoryData {
    user_id: string;
    caption: string;
    media: File;
}

export interface Story {
    story_id: number;
    user_id: number;
    media_url: string;
    media_type: "image" | "video";
    caption: string;
    created_at: string;
    expires_at: string;
    media_width: number | null;
    media_height: number | null;
    username: string;
    profile_picture: string | null;
}

/////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////// AUTHENTICATION APIS ////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////

export const registerUser = async (userData: UserRegisterData) => {
    try {
        const response = await api.post(REGISTER_ENDPOINT, userData);
        return response.data;
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("Registration failed:", error.message);
        } else {
            console.error("Registration failed: Unknown error");
        }
        throw error;
    }
};

export const loginUser = async (userData: UserLoginData) => {
    try {
        const response = await api.post(LOGIN_ENDPOINT, userData);
        return response.data;
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("Login failed:", error.message);
        } else {
            console.error("Login failed: Unknown error");
        }
        throw error;
    }
};

export const googleLogin = async (data: { token: string }) => {
    try {
        const response = await api.post(`${GOOGLE_LOGIN_ENDPOINT}`, data);
        return response.data;
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("Google login failed:", error.message);
        } else {
            console.error("Google login failed: Unknown error");
        }
        throw error;
    }
};

export const trackTraffic = async (userData: { ip: string; userAgent: string; location: string; referrer: string }) => {
    try {
        const data = {
            ...userData,
            platform: "ripple",
        };

        const response = await api.post(TRACK_TRAFFIC_ENDPOINT, data);
        return response.data;
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("Tracking traffic failed:", error.message);
        } else {
            console.error("Tracking traffic failed: Unknown error");
        }
        throw error;
    }
};

///////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////// USER APIS ////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////

export const getProfile = async (userId: string) => {
    try {
        const response = await api.get(GET_PROFILE_ENDPOINT, {
            params: {
                userId,
            },
        });
        return response.data;
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(error.message);
        } else {
            console.error("Unknown Error");
        }
        throw error;
    }
};

export const uploadProfilePicture = async (userId: string, profilePic: File) => {
    try {
        const formData = new FormData();
        formData.append("user_id", userId);
        formData.append("profile_pic", profilePic);

        const response = await api.post(UPLOAD_PROFILE_PICTURE_ENDPOINT, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });

        return response.data;
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(error.message);
        } else {
            console.error("Unknown error occurred");
        }
        throw error;
    }
};

export const updateProfileDetails = async (updatedProfile: ProfileData) => {
    try {
        const response = await api.put(UPDATE_PROFILE_ENDPOINT, { updatedProfile });
        return response.data;
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("Failed to update profile:", error.message);
        } else {
            console.error("Failed to update profile: Unknown error");
        }
        throw error;
    }
};

export const verifyUser = async (token: string) => {
    try {
        const response = await api.get(`${VERIFY_USER_ENDPOINT}?token=${encodeURIComponent(token)}`);
        return response.data;
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(error.message);
        } else {
            console.error("Unknown Error");
        }
        throw error;
    }
};

export const generatePasswordResetOTP = async (email: string) => {
    try {
        const response = await api.post(GENERATE_PASSWORD_RESET_OTP_ENDPOINT, { email });
        return response.data;
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("Failed to reset password:", error.message);
        } else {
            console.error("Failed to reset password: Unknown error");
        }
        throw error;
    }
};

export const verifyPasswordResetOTP = async (email: string, otp: string) => {
    try {
        const response = await api.post(VERIFY_PASSWORD_RESET_OTP_ENDPOINT, { email, otp });
        return response.data;
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("Failed to reset password:", error.message);
        } else {
            console.error("Failed to reset password: Unknown error");
        }
        throw error;
    }
};

export const ResetPassword = async (email: string, otp: string, password: string) => {
    try {
        const response = await api.post(PASSWORD_RESET_OTP_ENDPOINT, { email, otp, password });
        return response.data;
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("Failed to reset password:", error.message);
        } else {
            console.error("Failed to reset password: Unknown error");
        }
        throw error;
    }
};

/////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////// FOLLOW APIS ////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////

export const followUser = async (followerId: string, followingId: string) => {
    try {
        const response = await api.post(FOLLOW_ENDPOINT, { followerId, followingId });
        return response.data;
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("Failed to send follow request:", error.message);
        } else {
            console.error("Failed to send follow request: Unknown error");
        }
        throw error;
    }
};

export const cancelFollowRequest = async (followerId: string, followingId: string) => {
    try {
        const response = await api.delete(CANCEL_FOLLOW_REQUEST_ENDPOINT, {
            data: { followerId, followingId },
        });
        return response.data;
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("Failed to cancel follow request:", error.message);
        } else {
            console.error("Failed to cancel follow request: Unknown error");
        }
        throw error;
    }
};

export const unfollowUser = async (followerId: string, followingId: string) => {
    try {
        const response = await api.delete(UNFOLLOW_ENDPOINT, {
            data: { followerId, followingId },
        });
        return response.data;
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("Failed to send follow request:", error.message);
        } else {
            console.error("Failed to send follow request: Unknown error");
        }
        throw error;
    }
};

export const removeFollower = async (followerId: string, followingId: string) => {
    try {
        const response = await api.delete(REMOVE_FOLLOWER_ENDPOINT, {
            data: { followerId, followingId },
        });
        return response.data;
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("Failed to remove follower:", error.message);
        } else {
            console.error("Failed to remove follower: Unknown error");
        }
        throw error;
    }
};

export const respondToFollowRequest = async (requestId: number, status: string) => {
    try {
        const res = await api.post(FOLLOW_RESPONSE_ENDPOINT, { requestId, status });
        return res.data;
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("Failed to send follow request:", error.message);
        } else {
            console.error("Failed to send follow request: Unknown error");
        }
        throw error;
    }
};

export const getFollowingUsers = async () => {
    try {
        const response = await api.get(FOLLOWING_USERS_LIST_ENDPOINT);
        return response.data;
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("Failed to fetch following users:", error.message);
        } else {
            console.error("Failed to fetch following users: Unknown error");
        }
        throw error;
    }
};

export const getFollowers = async (userId: string) => {
    try {
        const response = await api.get(`${FOLLOW_ENDPOINT}/${userId}/followers`);
        return response.data;
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("Failed to fetch followers:", error.message);
        } else {
            console.error("Failed to fetch followers: Unknown error");
        }
        throw error;
    }
};

export const getFollowing = async (userId: string) => {
    try {
        const response = await api.get(`${FOLLOW_ENDPOINT}/${userId}/following`);
        return response.data;
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("Failed to fetch following:", error.message);
        } else {
            console.error("Failed to fetch following: Unknown error");
        }
        throw error;
    }
};

///////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////// POST APIS ////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////

export const getPost = async (postId: string) => {
    try {
        const response = await api.get(`${GET_POST_ENDPOINT}/${postId}`);

        return response.data;
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("Error fetching post:", error.message);
        } else {
            console.error("Unknown Error");
        }
        throw error;
    }
};

export const getPosts = async () => {
    try {
        const response = await api.get(GET_POSTS_ENDPOINT);

        return response.data;
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(error.message);
        } else {
            console.error("Unknown Error");
        }
        throw error;
    }
};

export const updatePost = async (postId: string, editContent: string) => {
    try {
        const response = await api.post(UPDATE_POST_ENDPOINT, {
            postId,
            content: editContent,
        });
        return response.data;
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(error.message);
        } else {
            console.error("unknown Error");
        }
        throw error;
    }
};

export const likePost = async (postId: string) => {
    try {
        const response = await api.post(LIKE_POST_ENDPOINT, { postId });
        return response.data;
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("Error liking the post:", error.message);
        } else {
            console.error("Unknown error while liking the post");
        }
        throw error;
    }
};

export const addComment = async (postId: string, comment: string) => {
    try {
        const response = await api.post(COMMENT_ENDPOINT, { postId, comment });
        return response.data;
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("Error adding the comment:", error.message);
        } else {
            console.error("Unknown error while adding the comment");
        }
        throw error;
    }
};

export const deleteComment = async (commentId: number) => {
    try {
        const response = await api.delete(DELETE_COMMENT_ENDPOINT, { data: { commentId } });
        return response.data;
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("Error deleting the comment:", error.message);
        } else {
            console.error("Unknown error while deleting the comment");
        }
        throw error;
    }
};

export const toggleLikeComment = async (commentId: number) => {
    try {
        const response = await api.post(LIKE_COMMENT_ENDPOINT, {
            commentId,
        });
        return response.data;
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(`Error trying to like/unlike the comment:`, error.message);
        } else {
            console.error("Unknown error while toggling like on comment");
        }
        throw error;
    }
};

export const getSavedPosts = async () => {
    try {
        const response = await api.get(GET_SAVED_POSTS_ENDPOINT);

        return response.data;
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(error.message);
        } else {
            console.error("Unknown Error");
        }
        throw error;
    }
};

export const savePost = async (postId: string) => {
    try {
        const response = await api.post(SAVE_POST_ENDPOINT, { postId });

        return response.data;
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(error.message);
        } else {
            console.error("Unknown Error");
        }
        throw error;
    }
};

export const getUserPosts = async (userId: string) => {
    try {
        const response = await api.get(GET_PROFILE_POSTS_ENDPOINT, { params: { userId } });
        return response.data;
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(error.message);
        } else {
            console.error("Unknown Error");
        }
        throw error;
    }
};

export const getUserPostDetails = async (userId: string, postId: string) => {
    try {
        const response = await api.get(GET_PROFILE_POST_DETAILS_ENDPOINT, { params: { userId, postId } });
        return response.data;
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(error.message);
        } else {
            console.error("Unknown Error");
        }
        throw error;
    }
};

export const createPost = async (postData: PostData) => {
    try {
        const formData = new FormData();
        formData.append("user_id", postData.user_id);
        formData.append("content", postData.content);
        formData.append("location", postData.location);
        if (postData.media) {
            formData.append("image", postData.media); // keep "image" as the field name multer expects
        }

        const response = await api.post(CREATE_POST_ENDPOINT, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });

        return response.data;
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(error.message);
        } else {
            console.error("Unknown error occurred");
        }
        throw error;
    }
};

export const deletePost = async (postId: string) => {
    try {
        const response = await api.delete(DELETE_POST_ENDPOINT, { params: { postId } });
        return response.data;
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(error.message);
        } else {
            console.error("Unknown Error");
        }
        throw error;
    }
};

////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////// NOTIFICATIONS APIS ////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////

export const getNotifications = async () => {
    try {
        const response = await api.get(GET_NOTIFICATIONS_ENDPOINT);

        return response.data;
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(error.message);
        } else {
            console.error("Unknown Error");
        }
        throw error;
    }
};

export const getNotificationsCount = async () => {
    try {
        const response = await api.get(GET_NOTIFICATIONS_COUNT);

        return response.data;
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(error.message);
        } else {
            console.error("Unknown Error");
        }
        throw error;
    }
};

/////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////// SEARCH APIS ////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////

export const getSearchResults = async (searchQuery: string) => {
    try {
        const response = await api.get(`${SEARCH_ENDPOINT}?searchString=${searchQuery}`);

        return response.data;
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(error.message);
        } else {
            console.error("Unknown Error");
        }
        throw error;
    }
};

export const getSearchHistory = async () => {
    try {
        const response = await api.get(FETCH_SEARCH_HISTORY_ENDPOINT);

        return response.data;
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(error.message);
        } else {
            console.error("Unknown Error");
        }
        throw error;
    }
};

export const addToSearchHistory = async (targetUserId: number) => {
    try {
        const response = await api.post(UPDATE_SEARCH_HISTORY_ENDPOINT, { target_user_id: targetUserId });

        return response.data;
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(error.message);
        } else {
            console.error("Unknown Error");
        }
        throw error;
    }
};

export const deleteSearchHistoryItem = async (historyId: number) => {
    try {
        const response = await api.delete(DELETE_SEARCH_HISTORY_ENDPOINT, {
            params: { historyId: historyId },
        });

        return response.data;
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(error.message);
        } else {
            console.error("Unknown Error");
        }
        throw error;
    }
};

export const searchByHashtag = async (tag: string) => {
    try {
        const response = await api.get(`${SEARCH_HASHTAG_ENDPOINT}?tag=${encodeURIComponent(tag)}`);
        return response.data;
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(error.message);
        } else {
            console.error("Unknown Error");
        }
        throw error;
    }
};

export const getHashtagSearchHistory = async () => {
    try {
        const response = await api.get(FETCH_HASHTAG_SEARCH_HISTORY_ENDPOINT);
        return response.data;
    } catch (error: unknown) {
        if (error instanceof Error) console.error(error.message);
        else console.error("Unknown Error");
        throw error;
    }
};

export const addToHashtagSearchHistory = async (tag: string) => {
    try {
        const response = await api.post(UPDATE_HASHTAG_SEARCH_HISTORY_ENDPOINT, { tag });
        return response.data;
    } catch (error: unknown) {
        if (error instanceof Error) console.error(error.message);
        else console.error("Unknown Error");
        throw error;
    }
};

export const deleteHashtagSearchHistoryItem = async (historyId: number) => {
    try {
        const response = await api.delete(DELETE_HASHTAG_SEARCH_HISTORY_ENDPOINT, {
            params: { historyId },
        });
        return response.data;
    } catch (error: unknown) {
        if (error instanceof Error) console.error(error.message);
        else console.error("Unknown Error");
        throw error;
    }
};

/////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////// SETTINGS APIS //////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////

export const updatePrivacy = async (isPrivate: boolean) => {
    try {
        const response = await api.patch(`${SETTINGS_ENDPOINT}/update-account-privacy`, { isPrivate });
        return response.data;
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(error.message);
        } else {
            console.error("unknown Error");
        }
        throw error;
    }
};

/////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////// MESSAGES APIS //////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////

export const getAllMessageUsersData = async () => {
    try {
        const response = await api.get(GET_ALL_MESSAGE_USERS_ENDPOINT);

        return response.data;
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(error.message);
        } else {
            console.error("Unknown Error");
        }
        throw error;
    }
};

export const getMessagesDataForSelectedUser = async (selectedUserId: number | undefined, offset: number = 0, limit: number = 20) => {
    try {
        const response = await api.get(GET_ALL_MESSAGES_ENDPOINT, {
            params: {
                selectedUserId,
                offset,
                limit,
            },
        });

        return response.data;
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(error.message);
        } else {
            console.error("Unknown Error");
        }
        throw error;
    }
};

export const deleteMessage = async (messageId: number) => {
    try {
        const response = await api.delete(DELETE_MESSAGE_ENDPOINT, {
            params: { messageId },
        });

        return response.data;
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(error.message);
        } else {
            console.error("Unknown Error");
        }
        throw error;
    }
};

export const shareChatMedia = async (mediaMessageData: FormData): Promise<any> => {
    try {
        const response = await api.post(SHARE_MEDIA_ENDPOINT, mediaMessageData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });

        return response.data;
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(error.message);
        } else {
            console.error("Unknown error occurred");
        }
        throw error;
    }
};

////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////// STORIES APIS //////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

export const uploadStory = async (storyData: StoryData) => {
    try {
        const formData = new FormData();
        formData.append("user_id", storyData.user_id);
        formData.append("caption", storyData.caption);
        formData.append("media", storyData.media);

        const response = await api.post(UPLOAD_STORY_ENDPOINT, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });

        return response.data;
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(error.message);
        } else {
            console.error("Unknown error occurred");
        }
        throw error;
    }
};

export const getStories = async () => {
    try {
        const response = await api.get(FETCH_USER_STORIES_ENDPOINT);
        return response;
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(error.message);
        } else {
            console.error("Unknown error occurred");
        }
        throw error;
    }
};
