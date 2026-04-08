// Auth Endpoints
export const REGISTER_ENDPOINT: string = "/api/auth/register";
export const LOGIN_ENDPOINT: string = "/api/auth/login";
export const GOOGLE_LOGIN_ENDPOINT: string = "/api/auth/google-login";
export const VERIFY_USER_ENDPOINT: string = "/api/auth/verify";
export const GENERATE_PASSWORD_RESET_OTP_ENDPOINT: string = "/api/auth/generate-otp";
export const VERIFY_PASSWORD_RESET_OTP_ENDPOINT: string = "/api/auth/verify-otp";
export const PASSWORD_RESET_OTP_ENDPOINT: string = "/api/auth/reset-password";
export const TRACK_TRAFFIC_ENDPOINT: string = "/api/auth/log";

// User Endpoints
export const GET_PROFILE_ENDPOINT: string = "/api/users/fetch-profile-details";
export const UPLOAD_PROFILE_PICTURE_ENDPOINT: string = "/api/users/update-profile-picture";
export const UPDATE_PROFILE_ENDPOINT: string = "/api/users/profile/update-profile-details";

// Follow Endpoints
export const FOLLOW_ENDPOINT: string = "/api/follow";
export const CANCEL_FOLLOW_REQUEST_ENDPOINT: string = "/api/follow/cancel-request";
export const UNFOLLOW_ENDPOINT: string = "/api/follow/unfollow";
export const REMOVE_FOLLOWER_ENDPOINT = "api/follow/remove-follower";
export const FOLLOW_RESPONSE_ENDPOINT: string = "/api/follow/response";
export const FOLLOWING_USERS_LIST_ENDPOINT: string = "/api/follow/fetch-following-list";

// Post Endpoints
export const GET_POST_ENDPOINT: string = "/api/posts";
export const GET_POSTS_ENDPOINT: string = "/api/posts/fetch-posts";
export const GET_PROFILE_POSTS_ENDPOINT: string = "/api/posts/fetch-profile-posts";
export const GET_PROFILE_POST_DETAILS_ENDPOINT: string = "/api/posts/fetch-post-details";
export const CREATE_POST_ENDPOINT: string = "/api/posts/create-post";
export const DELETE_POST_ENDPOINT: string = "/api/posts/delete-post";
export const UPDATE_POST_ENDPOINT: string = "/api/posts/update-post";
export const LIKE_POST_ENDPOINT: string = "/api/posts/like-post";
export const LIKE_COMMENT_ENDPOINT: string = "/api/posts/like-comment";

export const COMMENT_ENDPOINT: string = "/api/posts/submit-post-comment";
export const DELETE_COMMENT_ENDPOINT: string = "/api/posts/delete-comment";

export const GET_SAVED_POSTS_ENDPOINT: string = "/api/posts/fetch-saved-posts";
export const SAVE_POST_ENDPOINT: string = "/api/posts/save-post";

// Notifications Endpoints
export const GET_NOTIFICATIONS_ENDPOINT: string = "/api/notifications/fetch-notifications";
export const GET_NOTIFICATIONS_COUNT: string = "/api/notifications/fetch-notifications-count";
export const MUTED_USERS_ENDPOINT = "/api/notifications/muted-users";
export const MUTE_USER_ENDPOINT = "/api/notifications/mute-user";

// Search Endpoints
export const SEARCH_ENDPOINT: string = "/api/search/search-users";
export const FETCH_SEARCH_HISTORY_ENDPOINT: string = "/api/search/fetch-search-history";
export const UPDATE_SEARCH_HISTORY_ENDPOINT: string = "/api/search/update-search-history";
export const DELETE_SEARCH_HISTORY_ENDPOINT: string = "/api/search/delete-search-history";
export const SEARCH_HASHTAG_ENDPOINT = "api/search/search-hashtag";
export const FETCH_HASHTAG_SEARCH_HISTORY_ENDPOINT  = "api/search/fetch-hashtag-search-history";
export const UPDATE_HASHTAG_SEARCH_HISTORY_ENDPOINT = "api/search/update-hashtag-search-history";
export const DELETE_HASHTAG_SEARCH_HISTORY_ENDPOINT = "api/search/delete-hashtag-search-history";

// Settings Endpoints
export const SETTINGS_ENDPOINT: string = "/api/settings";

// Messages Endpoints
export const GET_ALL_MESSAGE_USERS_ENDPOINT: string = "/api/messages/fetch-users";
export const GET_ALL_MESSAGES_ENDPOINT: string = "/api/messages/fetch-messages";
export const DELETE_MESSAGE_ENDPOINT: string = "/api/messages/delete-message";
export const SHARE_MEDIA_ENDPOINT: string = "/api/messages/send-media";

// Stories Endpoints
export const UPLOAD_STORY_ENDPOINT: string = "/api/stories/upload-story";
export const FETCH_USER_STORIES_ENDPOINT: string = "/api/stories/fetch-user-stories";
