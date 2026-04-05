import React, { useState, useEffect, useRef } from "react";
import { Box, IconButton, useMediaQuery, useTheme } from "@mui/material";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import socket from "../../services/socket";
import { useGlobalStore } from "../../store/store";
import { deleteMessage, getAllMessageUsersData, getMessagesDataForSelectedUser, shareChatMedia } from "../../services/api";
import ImageDialog from "../../component/ImageDialog";
import MessagesContainer from "./messageContainer/MessagesContainer";
import MessageInput from "./MessageInput";
import MessagesTopBar from "./MessagesTopBar";
import MessagesDrawer from "./MessagesDrawer";
import { useNotifications } from "@toolpad/core/useNotifications";
import MessagesUserList from "./mobileView/MessagesUserList";
import { ChevronLeft } from "@mui/icons-material";

type Message = {
    message_id: number;
    receiver_id: number;
    sender_id: number;
    message_text: string;
    timestamp: string;
    delivered?: boolean;
    read?: boolean;
    saved?: boolean;
    file_url: string;
    delivered_timestamp?: string | null;
    read_timestamp?: string | null;
    file_name: string | null;
    file_size: string | null;
    reply_to: number | null;
    media_height: number | null;
    media_width: number | null;
    reactions: ReactionDetail[];
    post?: {
        post_id: number;
        file_url: string;
        media_width: number;
        media_height: number;
        content: string;
        owner: {
            user_id: number;
            username: string;
            profile_picture: string;
        };
    } | null;
};

interface ReactionDetail {
    user_id: string;
    reaction: string;
    username: string;
    profile_picture: string;
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

interface MessageProps {
    onlineUsers: string[];
    selectedUser: User | null;
    setSelectedUser: (user: User | null) => void;
    handleVideoCall: () => void;
}

const Messages: React.FC<MessageProps> = ({ onlineUsers, selectedUser, setSelectedUser, handleVideoCall }) => {
    const { userId } = useParams();
    const notifications = useNotifications();
    const { unreadMessagesCount, setUnreadMessagesCount } = useGlobalStore();

    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const [users, setUsers] = useState<User[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState("");
    const [typingUser, setTypingUser] = useState<number | null>(null);
    const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedFileURL, setSelectedFileURL] = useState<string>("");
    const [isSendingMessage, setIsSendingMessage] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string>("");
    const [selectedMessageForReply, setSelectedMessageForReply] = useState<Message | null>(null);
    const [chatTheme, setChatTheme] = useState(() => localStorage.getItem("chatTheme") || "");
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [initialMessageLoading, setInitialMessageLoading] = useState(false);

    const handleReply = (msg: Message) => {
        setSelectedMessageForReply(msg);
    };

    const cancelReply = () => {
        setSelectedMessageForReply(null);
    };

    const navigatedUser = location.state || {};

    const currentUser = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") || "") : {};

    // Fetch messages initially
    const fetchUsersData = async () => {
        try {
            const res = await getAllMessageUsersData();
            const users = res.data;
            setUsers(users);
        } catch (error) {
            console.error("Failed to fetch users and messages:", error);
        }
    };

    const fetchMessagesForSelectedUser = async (userId: number, offset = 0, limit = 20) => {
        setInitialMessageLoading(true);

        try {
            const res = await getMessagesDataForSelectedUser(userId, offset, limit);
            const reversedData = res.data.slice().reverse();

            setMessages((prevMessages) => (offset === 0 ? reversedData : [...reversedData, ...prevMessages]));
        } catch (error) {
            console.error("Failed to fetch users and messages:", error);
        } finally {
            setInitialMessageLoading(false);
        }
    };

    useEffect(() => {
        fetchUsersData();
    }, []);

    // Setting selected user
    useEffect(() => {
        if (location.pathname === "/messages") {
            setSelectedUser(null);
            setMessages([]);
            return;
        }

        if (userId) {
            const user = users.find((user) => user.id === parseInt(userId));
            // Only update if user actually changed
            if (user && (!selectedUser || user.id !== selectedUser.id)) {
                setSelectedUser(user);
                setMessages([]);
                fetchMessagesForSelectedUser(parseInt(userId));
            }
        }
    }, [location.pathname, userId]);

    useEffect(() => {
        if (navigatedUser && navigatedUser.id && !users.some((user) => user.id === navigatedUser.id)) {
            setUsers((prevUsers) => [...prevUsers, navigatedUser]);
        }

        if (navigatedUser && navigatedUser.id) {
            setSelectedUser(navigatedUser);
            setMessages([]);
            fetchMessagesForSelectedUser(navigatedUser.id);
        }
    }, [navigatedUser.id, users.length]);

    // Socket for receiving messages
    useEffect(() => {
        socket.on("receiveMessage", (data) => {
            setMessages((prevMessages: Message[]) => {
                // Check if the message already exists (avoid duplicates)
                const messageExists = prevMessages.some((msg) => msg.message_id === data.messageId);
                if (messageExists) {
                    return prevMessages;
                }

                // Create a new message object
                const newMessage: Message = {
                    message_id: data.messageId,
                    sender_id: data.senderId,
                    receiver_id: data.receiverId, // Ensure this exists in the received data
                    message_text: data.message_text,
                    timestamp: new Date().toISOString(),
                    saved: !!data.messageId,
                    file_url: data?.fileUrl || null,
                    file_name: data?.fileName || null,
                    file_size: data?.fileSize || null,
                    reply_to: data?.replyTo || null,
                    media_width: data?.mediaWidth || null,
                    media_height: data?.mediaHeight || null,
                    delivered: false, // Assuming the new message isn't delivered yet
                    read: false, // Assuming it's unread
                    reactions: [],
                    post: null,
                };

                // Append the new message to the existing array
                return [...prevMessages, newMessage];
            });
        });

        return () => {
            socket.off("receiveMessage");
        };
    }, [currentUser]);

    // Socket for catching typing activity
    useEffect(() => {
        socket.on("typing", (data) => {
            if (data.receiverId === currentUser.id && selectedUser?.id === data.senderId) {
                setTypingUser(data.senderId);
            }
        });

        socket.on("stopTyping", (data) => {
            if (data.receiverId === currentUser.id && selectedUser?.id === data.senderId) {
                setTypingUser(null);
            }
        });

        return () => {
            socket.off("typing");
            socket.off("stopTyping");
        };
    }, [currentUser, selectedUser]);

    // Socket for emitting typing activity
    const handleTyping = () => {
        if (inputMessage.trim()) {
            socket.emit("typing", {
                senderId: currentUser.id,
                receiverId: selectedUser?.id,
            });

            if (typingTimeout) {
                clearTimeout(typingTimeout);
            }

            const timeout = setTimeout(() => {
                socket.emit("stopTyping", {
                    senderId: currentUser.id,
                    receiverId: selectedUser?.id,
                });
            }, 3000);

            setTypingTimeout(timeout);
        }
    };

    // Set selected user on clicking the user's chat
    const handleUserClick = (userId: number) => {
        setMessages([]);
        setDrawerOpen(false);
        setSelectedUser(users.find((user) => user.id === userId) || null);
        fetchMessagesForSelectedUser(userId);
        setUsers((prevUsers) => prevUsers.map((user) => (user.id === userId ? { ...user, unread_count: 0 } : user)));
        navigate(`/messages/${userId}`);
    };

    // Socket to send messages and emit stop typing
    const handleSendMessage = async () => {
        if ((!inputMessage.trim() && !selectedFile) || !selectedUser) return;

        let fileUrl = null;
        let fileName = null;
        let fileSize = null;
        let mediaWidth = null;
        let mediaHeight = null;

        if (selectedFile) {
            const formData = new FormData();
            formData.append("image", selectedFile);

            try {
                setIsSendingMessage(true);
                const response = await shareChatMedia(formData);
                fileUrl = response?.data?.fileUrl;
                fileName = response?.data?.fileName;
                fileSize = response?.data?.fileSize;
                mediaWidth = response?.data?.mediaWidth;
                mediaHeight = response?.data?.mediaHeight;
            } catch (error) {
                console.error("Image upload failed:", error);
                setIsSendingMessage(false);
                return;
            }
        }

        const tempMessageId = Date.now() + Math.floor(Math.random() * 1000);

        const newMessage: Message = {
            message_id: tempMessageId,
            sender_id: currentUser.id,
            receiver_id: selectedUser.id, // Ensure receiver_id is included
            message_text: inputMessage,
            file_url: fileUrl,
            file_name: fileName,
            file_size: fileSize,
            media_width: mediaWidth,
            media_height: mediaHeight,
            timestamp: new Date().toISOString(),
            saved: false,
            delivered: false,
            read: false,
            delivered_timestamp: null,
            read_timestamp: null,
            reply_to: selectedMessageForReply?.message_id || null,
            reactions: [],
            post: null,
        };

        // Update the messages array
        setMessages((prevMessages: Message[]) => [...prevMessages, newMessage]);

        setSelectedFile(null);
        setSelectedFileURL("");
        setSelectedMessageForReply(null);

        socket.emit("sendMessage", {
            tempId: tempMessageId,
            senderId: currentUser.id,
            receiverId: selectedUser.id,
            text: inputMessage,
            fileUrl,
            fileName,
            fileSize,
            mediaWidth,
            mediaHeight,
            replyTo: selectedMessageForReply?.message_id || null,
        });

        socket.emit("stopTyping", {
            senderId: currentUser.id,
            receiverId: selectedUser?.id,
        });

        setInputMessage("");
        setIsSendingMessage(false);
    };

    const handleDeleteMessage = async (message: Message | null) => {
        if (!message) {
            console.error("No message to delete.");
            return;
        }

        try {
            const response = await deleteMessage(message.message_id);
            if (response?.success) {
                setMessages(
                    (prevMessages: Message[]) => prevMessages.filter((msg) => msg.message_id !== message.message_id) // Remove message from array
                );

                notifications.show(`Message deleted successfully!`, {
                    severity: "success",
                    autoHideDuration: 3000,
                });
            }
        } catch (error) {
            console.error("Failed to delete message:", error);
        }
    };

    useEffect(() => {
        socket.on("messageSaved", (data: { tempId: number; messageId: number }) => {
            setMessages((prevMessages: Message[]) =>
                prevMessages.map((msg) => (msg.message_id === data.tempId ? { ...msg, message_id: data.messageId, saved: true } : msg))
            );
        });

        return () => {
            socket.off("messageSaved");
        };
    }, []);

    useEffect(() => {
        socket.on("messageDelivered", (data: { messageId: number; deliveredTimestamp: string | null }) => {
            setMessages((prevMessages: Message[]) =>
                prevMessages.map((msg) =>
                    msg.message_id === data.messageId ? { ...msg, delivered: true, delivered_timestamp: data.deliveredTimestamp } : msg
                )
            );
        });

        return () => {
            socket.off("messageDelivered");
        };
    }, []);

    useEffect(() => {
        if (!selectedUser || !messages.length) return;

        const unreadMessages = messages.filter((message) => message.sender_id === selectedUser.id && !message.read);

        if (unreadMessages.length > 0) {
            const messageIds = unreadMessages.map((message) => message.message_id);
            socket.emit("messageRead", {
                senderId: selectedUser.id,
                receiverId: currentUser.id,
                messageIds, // Send all unread message IDs at once
            });

            // Mark all unread messages as read in the state
            setMessages((prevMessages) =>
                prevMessages.map((message) =>
                    unreadMessages.some((unread) => unread.message_id === message.message_id) ? { ...message, read: true } : message
                )
            );

            // Update the unread messages count
            setUnreadMessagesCount(Math.max((unreadMessagesCount ?? 0) - unreadMessages.length, 0));
        }
    }, [selectedUser, messages]);

    useEffect(() => {
        socket.on("messageRead", (data: { receiverId: number; messageIds: { messageId: number; readTimestamp: string }[] }) => {
            setMessages((prevMessages) =>
                prevMessages.map((message) => {
                    const readMessage = data.messageIds.find((m) => m.messageId === message.message_id);

                    if (readMessage && message.receiver_id === data.receiverId) {
                        return {
                            ...message,
                            read: true,
                            read_timestamp: readMessage.readTimestamp,
                        };
                    }

                    return message;
                })
            );
        });

        return () => {
            socket.off("messageRead");
        };
    }, []);

    const handleReaction = (messageId: number, reaction: string) => {
        if (!selectedUser) return;

        setMessages((prevMessages) => {
            const updatedMessages = prevMessages.map((message) => {
                if (message.message_id === messageId) {
                    const updatedReactions =
                        Array.isArray(message.reactions) && message.reactions.length > 0
                            ? message.reactions.map((r) => {
                                  if (r.user_id === currentUser.id.toString()) {
                                      return { ...r, reaction };
                                  }
                                  return r;
                              })
                            : [
                                  {
                                      user_id: currentUser.id.toString(),
                                      reaction,
                                      username: currentUser.username,
                                      profile_picture: currentUser.profile_picture_url,
                                  },
                              ];

                    return {
                        ...message,
                        reactions: updatedReactions,
                    };
                }

                return message;
            });

            return updatedMessages;
        });

        // Emit the reaction to the server
        socket.emit("send-reaction", { messageId, senderUserId: currentUser.id, reaction });
    };

    socket.on("reaction-received", ({ messageId, reaction }) => {
        setMessages((prevMessages) =>
            prevMessages.map((message) => {
                if (message.message_id !== messageId) return message;

                const prevReactions = Array.isArray(message.reactions) ? message.reactions : [];

                // Remove any previous reaction by this user
                const updatedReactions = prevReactions.filter((r) => r.user_id !== reaction.user_id);

                // If reaction is null, just return filtered list
                if (reaction.reaction === null) {
                    return {
                        ...message,
                        reactions: updatedReactions,
                    };
                }

                // Otherwise, add the new/updated reaction object
                return {
                    ...message,
                    reactions: [...updatedReactions, reaction],
                };
            })
        );
    });

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            setSelectedFile(file);

            const fileUrl = URL.createObjectURL(file);
            setSelectedFileURL(fileUrl);
        }
    };

    const handleImageClick = (fileUrl: string | undefined) => {
        setSelectedImage(fileUrl || "");
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedImage("");
    };

    return (
        <Box sx={{ display: "flex", height: "98.5dvh" }}>
            {isMobile ? (
                !selectedUser ? (
                    <MessagesUserList users={users} onlineUsers={onlineUsers} handleUserClick={handleUserClick} />
                ) : (
                    <Box
                        sx={{
                            flexGrow: 1,
                            display: "flex",
                            flexDirection: "column",
                            color: "white",
                            width: "100%",
                            backgroundImage: selectedUser ? chatTheme : "none",
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                        }}
                    >
                        {isMobile && (
                            <IconButton
                                onClick={() => {
                                    navigate("/messages");
                                    setMessages([]);
                                    setSelectedUser(null);
                                }}
                                sx={{
                                    position: "absolute",
                                    left: 5,
                                    top: 21,
                                    zIndex: 2000,
                                    visibility: drawerOpen ? "hidden" : "visible",
                                }}
                            >
                                <ChevronLeft />
                            </IconButton>
                        )}
                        <MessagesTopBar
                            selectedUser={selectedUser}
                            chatTheme={chatTheme}
                            setChatTheme={setChatTheme}
                            openVideoCall={handleVideoCall}
                            setMessages={setMessages}
                        />

                        <MessagesContainer
                            selectedUser={selectedUser}
                            messages={messages}
                            currentUser={currentUser}
                            handleImageClick={handleImageClick}
                            messagesEndRef={messagesEndRef}
                            handleReply={handleReply}
                            setAnchorEl={setAnchorEl}
                            handleDeleteMessage={handleDeleteMessage}
                            handleReaction={handleReaction}
                            typingUser={typingUser}
                            initialMessageLoading={initialMessageLoading}
                        />

                        <MessageInput
                            selectedFile={selectedFile}
                            setSelectedFile={setSelectedFile}
                            selectedFileURL={selectedFileURL}
                            setSelectedFileURL={setSelectedFileURL}
                            inputMessage={inputMessage}
                            handleTyping={handleTyping}
                            setInputMessage={setInputMessage}
                            handleSendMessage={handleSendMessage}
                            handleFileChange={handleFileChange}
                            isSendingMessage={isSendingMessage}
                            selectedMessageForReply={selectedMessageForReply}
                            cancelReply={cancelReply}
                            selectedUser={selectedUser}
                        />
                    </Box>
                )
            ) : (
                <>
                    <MessagesDrawer
                        users={users}
                        onlineUsers={onlineUsers}
                        selectedUser={selectedUser}
                        handleUserClick={handleUserClick}
                        anchorEl={anchorEl}
                        setAnchorEl={setAnchorEl}
                    />

                    {/* Messages Panel */}
                    <Box
                        sx={{
                            flexGrow: 1,
                            display: "flex",
                            flexDirection: "column",
                            color: "white",
                            width: "100px",
                            backgroundImage: selectedUser ? chatTheme : "none",
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                        }}
                    >
                        {/* Top bar */}
                        {selectedUser && (
                            <MessagesTopBar
                                selectedUser={selectedUser}
                                chatTheme={chatTheme}
                                setChatTheme={setChatTheme}
                                openVideoCall={handleVideoCall}
                                setMessages={setMessages}
                            />
                        )}

                        {/* Messages Container */}
                        <MessagesContainer
                            selectedUser={selectedUser}
                            messages={messages}
                            currentUser={currentUser}
                            handleImageClick={handleImageClick}
                            messagesEndRef={messagesEndRef}
                            handleReply={handleReply}
                            setAnchorEl={setAnchorEl}
                            handleDeleteMessage={handleDeleteMessage}
                            handleReaction={handleReaction}
                            typingUser={typingUser}
                            initialMessageLoading={initialMessageLoading}
                        />

                        {/* Message Input Box*/}
                        {selectedUser && (
                            <MessageInput
                                selectedFile={selectedFile}
                                setSelectedFile={setSelectedFile}
                                selectedFileURL={selectedFileURL}
                                setSelectedFileURL={setSelectedFileURL}
                                inputMessage={inputMessage}
                                handleTyping={handleTyping}
                                setInputMessage={setInputMessage}
                                handleSendMessage={handleSendMessage}
                                handleFileChange={handleFileChange}
                                isSendingMessage={isSendingMessage}
                                selectedMessageForReply={selectedMessageForReply}
                                selectedUser={selectedUser}
                                cancelReply={cancelReply}
                            />
                        )}
                    </Box>
                    <ImageDialog openDialog={openDialog} handleCloseDialog={handleCloseDialog} selectedImage={selectedImage} />
                </>
            )}
        </Box>
    );
};

export default Messages;
