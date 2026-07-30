import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Box, Typography, useMediaQuery, useTheme, Button } from "@mui/material";
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import BlockIcon from '@mui/icons-material/Block';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import socket from "../../services/socket";
import {
  deleteMessage,
  getAllMessageUsersData,
  getMessagesDataForSelectedUser,
  getMutedUsers,
  shareChatMedia,
  getBlockedUsers,
  unblockUser,
  getGroups,
  getGroupMessages,
} from "../../services/api";
import ImageDialog from "../../component/ImageDialog";
import MessagesContainer from "./messageContainer/MessagesContainer";
import MessageInput from "./MessageInput";
import MessagesTopBar from "./MessagesTopBar";
import MessagesDrawer from "./MessagesDrawer";
import { useAppNotifications } from "../../hooks/useNotification";
import MessagesUserList from "./mobileView/MessagesUserList";

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
  last_seen?: string | null;
  latest_message: string;
  latest_message_timestamp: string;
  unread_count: number;
};

type Group = {
  id: number;
  name: string;
  profile_picture: string | null;
  member_count: number;
  latest_message: string | null;
  latest_message_sender: string | null;
  latest_message_timestamp: string | null;
};

type GroupMessage = {
  message_id: number;
  group_id: number;
  sender_id: number;
  sender_username: string;
  sender_profile_picture: string;
  message_text: string;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  timestamp: string;
  reply_to: number | null;
  media_width: number | null;
  media_height: number | null;
  reactions: ReactionDetail[];
  saved?: boolean;
};

interface MessageProps {
  onlineUsers: string[];
  selectedUser: User | null;
  setSelectedUser: (user: User | null) => void;
  handleVideoCall: () => void;
}

const Messages: React.FC<MessageProps> = ({
  onlineUsers,
  selectedUser,
  setSelectedUser,
  handleVideoCall,
}) => {
  const { t } = useTranslation();
  const { userId, groupId } = useParams();
  const notifications = useAppNotifications();

  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fetchedForUserIdRef = useRef<number | null>(null);
  const [mutedUserIds, setMutedUserIds] = useState<Set<number>>(new Set());

  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([]);
  const fetchedForGroupIdRef = useRef<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [typingUser, setTypingUser] = useState<number | null>(null);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileURL, setSelectedFileURL] = useState<string>("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [selectedMessageForReply, setSelectedMessageForReply] =
    useState<Message | null>(null);
  const [chatTheme, setChatTheme] = useState(
    () => localStorage.getItem("chatTheme") || "",
  );
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [initialMessageLoading, setInitialMessageLoading] = useState(false);
  const [isBlockedUser, setIsBlockedUser] = useState(false);

  const handleReply = (msg: Message) => {
    setSelectedMessageForReply(msg);
  };

  const cancelReply = () => {
    setSelectedMessageForReply(null);
  };

  const navigatedUser = location.state || {};

  const currentUser = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user") || "null")
    : {};

  const [loadingUsers, setLoadingUsers] = useState(true);

  const fetchUsersData = async () => {
    setLoadingUsers(true);
    try {
      const res = await getAllMessageUsersData();
      setUsers(res.data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchGroupsData = async () => {
    try {
      const res = await getGroups();
      if (res.success) setGroups(res.data);
    } catch (error) {
      console.error("Failed to fetch groups:", error);
    }
  };

  const fetchGroupMessagesFor = async (gId: number, offset = 0) => {
    setInitialMessageLoading(true);
    try {
      const res = await getGroupMessages(gId, offset, 30);
      if (res.success) {
        const batch: GroupMessage[] = res.data.slice().reverse();
        setGroupMessages((prev) => offset === 0 ? batch : [...batch, ...prev]);
      }
    } catch (error) {
      console.error("Failed to fetch group messages:", error);
    } finally {
      setInitialMessageLoading(false);
    }
  };

  const fetchMutedUsers = async () => {
    try {
      const ids = await getMutedUsers();
      setMutedUserIds(new Set(ids));
    } catch (err) {
      console.error("Failed to fetch muted users:", err);
    }
  };

  useEffect(() => {
    fetchMutedUsers();
    fetchUsersData();
    fetchGroupsData();
  }, []);

  const fetchMessagesForSelectedUser = async (
    userId: number,
    offset = 0,
    limit = 20,
  ) => {
    setInitialMessageLoading(true);
    try {
      const res = await getMessagesDataForSelectedUser(userId, offset, limit);
      const messages: Message[] = res.data.slice().reverse();
      setMessages((prev) => offset === 0 ? messages : [...messages, ...prev]);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setInitialMessageLoading(false);
    }
  };

  // Handle group URL param
  useEffect(() => {
    if (!groupId) return;
    const gIdNum = parseInt(groupId);
    const group = groups.find((g) => g.id === gIdNum);
    if (group && fetchedForGroupIdRef.current !== gIdNum) {
      fetchedForGroupIdRef.current = gIdNum;
      setSelectedGroup(group);
      setGroupMessages([]);
      setSelectedUser(null);
      setMessages([]);
      fetchGroupMessagesFor(gIdNum);
    }
  }, [groupId, groups]);

  // Setting selected user
  useEffect(() => {
    if (location.pathname === "/messages") {
      setSelectedUser(null);
      setSelectedGroup(null);
      setMessages([]);
      setGroupMessages([]);
      fetchedForUserIdRef.current = null;
      fetchedForGroupIdRef.current = null;
      return;
    }

    if (groupId) return; // handled by the group effect above

    if (userId) {
      const user = users.find((user) => user.id === parseInt(userId));
      if (user && fetchedForUserIdRef.current !== user.id) {
        fetchedForUserIdRef.current = user.id;
        setSelectedUser(user);
        setSelectedGroup(null);
        setMessages([]);
        fetchMessagesForSelectedUser(parseInt(userId));
      }
    }
  }, [location.pathname, userId, groupId, users]);

  useEffect(() => {
    if (!navigatedUser?.id) return;

    setUsers((prevUsers) =>
      prevUsers.some((u) => u.id === navigatedUser.id)
        ? prevUsers
        : [...prevUsers, navigatedUser]
    );
    setSelectedUser(navigatedUser);
    setMessages([]);
    fetchMessagesForSelectedUser(navigatedUser.id);
  }, [navigatedUser.id]);

  // Socket for receiving messages
  useEffect(() => {
    socket.on("receiveMessage", async (data) => {
      if (data.senderId === currentUser.id) return;

      const messageText = data.message_text;

      // Update user list preview and unread count
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === data.senderId
            ? {
                ...user,
                latest_message: messageText,
                latest_message_timestamp: new Date().toISOString(),
                unread_count: data.senderId !== selectedUser?.id
                  ? (user.unread_count || 0) + 1
                  : user.unread_count,
              }
            : user,
        ),
      );

      if (data.senderId !== selectedUser?.id) return;

      setMessages((prevMessages: Message[]) => {
        const messageExists = prevMessages.some(
          (msg) => msg.message_id === data.messageId,
        );
        if (messageExists) return prevMessages;

        const newMessage: Message = {
          message_id: data.messageId,
          sender_id: data.senderId,
          receiver_id: data.receiverId,
          message_text: messageText,
          timestamp: new Date().toISOString(),
          saved: !!data.messageId,
          file_url: data?.fileUrl || null,
          file_name: data?.fileName || null,
          file_size: data?.fileSize || null,
          reply_to: data?.replyTo || null,
          media_width: data?.mediaWidth || null,
          media_height: data?.mediaHeight || null,
          delivered: false,
          read: false,
          reactions: [],
          post: null,
        };

        return [...prevMessages, newMessage];
      });
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, [currentUser, selectedUser]);

  // Group message socket handlers
  useEffect(() => {
    socket.on("receiveGroupMessage", (data: GroupMessage) => {
      // If this group is open, append to messages
      if (data.group_id === selectedGroup?.id) {
        setGroupMessages((prev) => {
          if (prev.some((m) => m.message_id === data.message_id)) return prev;
          return [...prev, data];
        });
      }
      // Update group preview in sidebar
      setGroups((prev) =>
        prev.map((g) =>
          g.id === data.group_id
            ? { ...g, latest_message: data.message_text, latest_message_sender: data.sender_username, latest_message_timestamp: data.timestamp }
            : g
        )
      );
    });

    socket.on("groupMessageSaved", (data: { tempId: number; messageId: number; timestamp: string }) => {
      setGroupMessages((prev) =>
        prev.map((m) => m.message_id === data.tempId ? { ...m, message_id: data.messageId, saved: true } : m)
      );
    });

    return () => {
      socket.off("receiveGroupMessage");
      socket.off("groupMessageSaved");
    };
  }, [selectedGroup]);

  // Socket for catching typing activity
  useEffect(() => {
    socket.on("typing", (data) => {
      if (
        data.receiverId === currentUser.id &&
        selectedUser?.id === data.senderId
      ) {
        setTypingUser(data.senderId);
      }
    });

    socket.on("stopTyping", (data) => {
      if (
        data.receiverId === currentUser.id &&
        selectedUser?.id === data.senderId
      ) {
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

  const handleGroupClick = (gId: number) => {
    const group = groups.find((g) => g.id === gId);
    if (!group) return;
    setSelectedGroup(group);
    setSelectedUser(null);
    setGroupMessages([]);
    setMessages([]);
    fetchedForGroupIdRef.current = gId;
    fetchGroupMessagesFor(gId);
    navigate(`/messages/group/${gId}`);
  };

  const handleGroupCreated = (group: Group) => {
    setGroups((prev) => [...prev, group]);
    handleGroupClick(group.id);
  };

  const handleSendGroupMessage = async () => {
    if ((!inputMessage.trim() && !selectedFile) || !selectedGroup) return;

    let fileUrl = null, fileName = null, fileSize = null, mediaWidth = null, mediaHeight = null;
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
        console.error("Media upload failed:", error);
        setIsSendingMessage(false);
        return;
      }
    }

    const tempId = Date.now() + Math.floor(Math.random() * 1000);
    const messageText = inputMessage;

    const optimistic: GroupMessage = {
      message_id: tempId,
      group_id: selectedGroup.id,
      sender_id: currentUser.id,
      sender_username: currentUser.username,
      sender_profile_picture: currentUser.profile_picture_url,
      message_text: messageText,
      file_url: fileUrl,
      file_name: fileName,
      file_size: fileSize,
      media_width: mediaWidth,
      media_height: mediaHeight,
      timestamp: new Date().toISOString(),
      reply_to: selectedMessageForReply?.message_id || null,
      reactions: [],
      saved: false,
    };

    setGroupMessages((prev) => [...prev, optimistic]);
    setInputMessage("");
    setSelectedFile(null);
    setSelectedFileURL("");
    setSelectedMessageForReply(null);
    setIsSendingMessage(false);

    setGroups((prev) =>
      prev.map((g) =>
        g.id === selectedGroup.id
          ? { ...g, latest_message: messageText || "", latest_message_sender: currentUser.username, latest_message_timestamp: new Date().toISOString() }
          : g
      )
    );

    socket.emit("sendGroupMessage", {
      tempId,
      groupId: selectedGroup.id,
      senderId: currentUser.id,
      text: messageText,
      fileUrl,
      fileName,
      fileSize,
      mediaWidth,
      mediaHeight,
      replyTo: selectedMessageForReply?.message_id || null,
    });
  };

  // Set selected user on clicking the user's chat
  const handleUserClick = (userId: number) => {
    setSelectedGroup(null);
    setGroupMessages([]);
    fetchedForGroupIdRef.current = null;
    setMessages([]);
    setSelectedUser(users.find((user) => user.id === userId) || null);
    fetchMessagesForSelectedUser(userId);
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === userId ? { ...user, unread_count: 0 } : user,
      ),
    );
    navigate(`/messages/${userId}`);
  };

  // Check if selected user is blocked whenever it changes
  useEffect(() => {
    if (!selectedUser) { setIsBlockedUser(false); return; }
    getBlockedUsers()
      .then((list) => setIsBlockedUser(list.some((u: any) => u.id === selectedUser.id)))
      .catch(() => setIsBlockedUser(false));
  }, [selectedUser?.id]);

  const handleUnblockFromChat = async () => {
    if (!selectedUser) return;
    try {
      await unblockUser(selectedUser.id);
      setIsBlockedUser(false);
    } catch (e) {
      console.error(e);
    }
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
    const messageText = inputMessage;

    const newMessage: Message = {
      message_id: tempMessageId,
      sender_id: currentUser.id,
      receiver_id: selectedUser.id,
      message_text: messageText,
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

    setMessages((prevMessages: Message[]) => [...prevMessages, newMessage]);

    setSelectedFile(null);
    setSelectedFileURL("");
    setSelectedMessageForReply(null);

    socket.emit("sendMessage", {
      tempId: tempMessageId,
      senderId: currentUser.id,
      receiverId: selectedUser.id,
      text: messageText,
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

    // Update the user list preview immediately without a refetch
    setUsers((prev) =>
      prev.map((u) =>
        u.id === selectedUser.id
          ? { ...u, latest_message: messageText || "", latest_message_timestamp: new Date().toISOString() }
          : u,
      ),
    );
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
          (prevMessages: Message[]) =>
            prevMessages.filter((msg) => msg.message_id !== message.message_id),
        );
      }
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  };

  useEffect(() => {
    socket.on("messageSaved", (data: { tempId: number; messageId: number }) => {
      setMessages((prevMessages: Message[]) =>
        prevMessages.map((msg) =>
          msg.message_id === data.tempId
            ? { ...msg, message_id: data.messageId, saved: true }
            : msg,
        ),
      );
    });

    return () => {
      socket.off("messageSaved");
    };
  }, []);

  useEffect(() => {
    socket.on(
      "messageDelivered",
      (data: { messageId: number; deliveredTimestamp: string | null }) => {
        setMessages((prevMessages: Message[]) =>
          prevMessages.map((msg) =>
            msg.message_id === data.messageId
              ? {
                  ...msg,
                  delivered: true,
                  delivered_timestamp: data.deliveredTimestamp,
                }
              : msg,
          ),
        );
      },
    );

    return () => {
      socket.off("messageDelivered");
    };
  }, []);

  useEffect(() => {
    if (!selectedUser || !messages.length) return;

    const hasUnread = messages.some(
      (message) => message.sender_id === selectedUser.id && !message.read,
    );

    if (hasUnread) {
      socket.emit("messageRead", {
        senderId: selectedUser.id,
        receiverId: currentUser.id,
      });

      setMessages((prevMessages) =>
        prevMessages.map((message) => ({ ...message, read: true })),
      );
    }
  }, [selectedUser, messages]);

  useEffect(() => {
    socket.on("messageRead", () => {
      setMessages((prevMessages) =>
        prevMessages.map((message) => ({
          ...message,
          read: true,
          read_timestamp: new Date().toISOString(),
        })),
      );
    });

    return () => {
      socket.off("messageRead");
    };
  }, []);

  const handleReaction = (messageId: number, reaction: string | null) => {
    if (!selectedUser) return;

    setMessages((prevMessages) =>
      prevMessages.map((message) => {
        if (message.message_id !== messageId) return message;

        const prevReactions = Array.isArray(message.reactions)
          ? message.reactions
          : [];

        const existingReaction = prevReactions.find(
          (r) => r.user_id === currentUser.id.toString(),
        );

        // If same reaction clicked again, remove it
        const isSameReaction =
          reaction !== null && existingReaction?.reaction === reaction;

        const updatedReactions =
          isSameReaction || reaction === null
            ? prevReactions.filter(
                (r) => r.user_id !== currentUser.id.toString(),
              ) // Remove
            : existingReaction
              ? prevReactions.map((r) =>
                  r.user_id === currentUser.id.toString()
                    ? { ...r, reaction }
                    : r,
                ) // Update
              : [
                  ...prevReactions,
                  {
                    user_id: currentUser.id.toString(),
                    reaction,
                    username: currentUser.username,
                    profile_picture: currentUser.profile_picture_url,
                  },
                ]; // Add

        return { ...message, reactions: updatedReactions };
      }),
    );

    const existingReaction = messages
      .find((m) => m.message_id === messageId)
      ?.reactions?.find((r) => r.user_id === currentUser.id.toString());

    const isSameReaction = existingReaction?.reaction === reaction;

    socket.emit("send-reaction", {
      messageId,
      senderUserId: currentUser.id,
      reaction: isSameReaction ? null : reaction, // Send null to remove
    });
  };

  useEffect(() => {
    socket.on("reaction-received", ({ messageId, reaction }) => {
      setMessages((prevMessages) =>
        prevMessages.map((message) => {
          if (message.message_id !== messageId) return message;

          const prevReactions = Array.isArray(message.reactions)
            ? message.reactions
            : [];

          const updatedReactions = prevReactions.filter(
            (r) => r.user_id !== reaction.user_id,
          );

          if (reaction.reaction === null) {
            return { ...message, reactions: updatedReactions };
          }

          return { ...message, reactions: [...updatedReactions, reaction] };
        }),
      );
    });

    return () => {
      socket.off("reaction-received"); // ✅ Cleanup on re-render
    };
  }, []); // setMessages is stable, so empty deps array is fine

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
    <Box
      sx={{
        display: "flex",
        height: isMobile ? "calc(100dvh - 52px - 54px)" : "100dvh",
        mt: isMobile ? "52px" : 0,
        pl: { xs: 0, sm: "68px" },
      }}
    >
      {isMobile ? (
        !selectedUser && !selectedGroup ? (
          <Box sx={{ display: "flex", justifyContent: "center", width: "100%", overflow: "hidden" }}>
            <Box
              sx={{
                width: { xs: "100%", sm: "520px", lg: "600px" },
                maxWidth: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <MessagesUserList
                users={users}
                onlineUsers={onlineUsers}
                handleUserClick={handleUserClick}
                loading={loadingUsers}
                mutedUserIds={mutedUserIds}
              />
            </Box>
          </Box>
        ) : selectedGroup ? (
          <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", color: "white", width: "100%", backgroundImage: chatTheme, backgroundSize: "cover", backgroundPosition: "center" }}>
            <MessagesTopBar
              selectedUser={null}
              selectedGroup={selectedGroup}
              chatTheme={chatTheme}
              setChatTheme={setChatTheme}
              openVideoCall={handleVideoCall}
              setMessages={setMessages}
              onMuteToggle={fetchMutedUsers}
            />
            <MessagesContainer
              selectedUser={null}
              messages={groupMessages as any}
              currentUser={currentUser}
              handleImageClick={handleImageClick}
              messagesEndRef={messagesEndRef}
              handleReply={handleReply}
              setAnchorEl={setAnchorEl}
              handleDeleteMessage={handleDeleteMessage}
              handleReaction={handleReaction}
              typingUser={null}
              initialMessageLoading={initialMessageLoading}
              isGroup
            />
            <MessageInput
              selectedFile={selectedFile}
              setSelectedFile={setSelectedFile}
              selectedFileURL={selectedFileURL}
              setSelectedFileURL={setSelectedFileURL}
              inputMessage={inputMessage}
              handleTyping={() => {}}
              setInputMessage={setInputMessage}
              handleSendMessage={handleSendGroupMessage}
              handleFileChange={handleFileChange}
              isSendingMessage={isSendingMessage}
              selectedMessageForReply={selectedMessageForReply}
              cancelReply={cancelReply}
              selectedUser={null}
            />
          </Box>
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
            <MessagesTopBar
              selectedUser={selectedUser ? { ...selectedUser, isOnline: onlineUsers.includes(selectedUser.id.toString()) } : null}
              chatTheme={chatTheme}
              setChatTheme={setChatTheme}
              openVideoCall={handleVideoCall}
              setMessages={setMessages}
              onMuteToggle={fetchMutedUsers}
            />

            {isBlockedUser && (
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1, gap: 1.5, bgcolor: (t) => t.palette.mode === "dark" ? "rgba(211,47,47,0.10)" : "rgba(211,47,47,0.07)", borderBottom: "1px solid", borderColor: "rgba(211,47,47,0.18)" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <BlockIcon sx={{ fontSize: 15, color: "error.main", flexShrink: 0 }} />
                  <Typography sx={{ fontSize: "0.78rem", color: "error.main", fontWeight: 500 }}>
                    {t("messages.blockedBanner", { username: selectedUser?.username })}
                  </Typography>
                </Box>
                <Button size="small" onClick={handleUnblockFromChat} sx={{ fontSize: "0.72rem", fontWeight: 600, textTransform: "none", color: "error.main", minWidth: 0, px: 1.25, py: 0.4, borderRadius: "8px", "&:hover": { bgcolor: "rgba(211,47,47,0.12)" } }}>
                  {t("messages.unblock")}
                </Button>
              </Box>
            )}

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

            {isBlockedUser ? (
              <Box sx={{ px: 2, py: 1.5, borderTop: "1px solid", borderColor: (t) => t.palette.divider, bgcolor: (t) => t.palette.background.paper }}>
                <Typography sx={{ fontSize: "0.78rem", color: (t) => t.palette.text.disabled, textAlign: "center" }}>
                  {t("messages.unblockToSend", { username: selectedUser?.username })}
                </Typography>
              </Box>
            ) : (
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
            )}
          </Box>
        )
      ) : (
        <>
          <MessagesDrawer
            users={users}
            groups={groups}
            onlineUsers={onlineUsers}
            selectedUser={selectedUser}
            selectedGroupId={selectedGroup?.id ?? null}
            handleUserClick={handleUserClick}
            handleGroupClick={handleGroupClick}
            anchorEl={anchorEl}
            setAnchorEl={setAnchorEl}
            mutedUserIds={mutedUserIds}
            onGroupCreated={handleGroupCreated}
          />

          {/* Messages Panel */}
          <Box
            sx={{
              flexGrow: 1,
              display: "flex",
              flexDirection: "column",
              color: "white",
              width: "100px",
              backgroundImage: (selectedUser || selectedGroup) ? chatTheme : "none",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {!selectedUser && !selectedGroup ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2, color: 'text.secondary' }}>
                <ChatBubbleOutlineIcon sx={{ fontSize: 48, opacity: 0.5 }} />
                <Typography variant="body2" sx={{ opacity: 0.6 }}>{t("messages.selectConversation")}</Typography>
              </Box>
            ) : selectedGroup ? (
              <>
                <MessagesTopBar
                  selectedUser={null}
                  selectedGroup={selectedGroup}
                  chatTheme={chatTheme}
                  setChatTheme={setChatTheme}
                  openVideoCall={handleVideoCall}
                  setMessages={setMessages}
                  onMuteToggle={fetchMutedUsers}
                />
                <MessagesContainer
                  selectedUser={null}
                  messages={groupMessages as any}
                  currentUser={currentUser}
                  handleImageClick={handleImageClick}
                  messagesEndRef={messagesEndRef}
                  handleReply={handleReply}
                  setAnchorEl={setAnchorEl}
                  handleDeleteMessage={handleDeleteMessage}
                  handleReaction={handleReaction}
                  typingUser={null}
                  initialMessageLoading={initialMessageLoading}
                  isGroup
                />
                <MessageInput
                  selectedFile={selectedFile}
                  setSelectedFile={setSelectedFile}
                  selectedFileURL={selectedFileURL}
                  setSelectedFileURL={setSelectedFileURL}
                  inputMessage={inputMessage}
                  handleTyping={() => {}}
                  setInputMessage={setInputMessage}
                  handleSendMessage={handleSendGroupMessage}
                  handleFileChange={handleFileChange}
                  isSendingMessage={isSendingMessage}
                  selectedMessageForReply={selectedMessageForReply}
                  selectedUser={null}
                  cancelReply={cancelReply}
                />
              </>
            ) : (
              <>
                {/* Top bar */}
                <MessagesTopBar
                  selectedUser={selectedUser ? { ...selectedUser, isOnline: onlineUsers.includes(selectedUser.id.toString()) } : null}
                  chatTheme={chatTheme}
                  setChatTheme={setChatTheme}
                  openVideoCall={handleVideoCall}
                  setMessages={setMessages}
                  onMuteToggle={fetchMutedUsers}
                />

                {isBlockedUser && (
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2.5, py: 1, gap: 1.5, bgcolor: (t) => t.palette.mode === "dark" ? "rgba(211,47,47,0.10)" : "rgba(211,47,47,0.07)", borderBottom: "1px solid", borderColor: "rgba(211,47,47,0.18)" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <BlockIcon sx={{ fontSize: 15, color: "error.main", flexShrink: 0 }} />
                      <Typography sx={{ fontSize: "0.78rem", color: "error.main", fontWeight: 500 }}>
                        {t("messages.blockedBanner", { username: selectedUser?.username })}
                      </Typography>
                    </Box>
                    <Button size="small" onClick={handleUnblockFromChat} sx={{ fontSize: "0.72rem", fontWeight: 600, textTransform: "none", color: "error.main", minWidth: 0, px: 1.25, py: 0.4, borderRadius: "8px", "&:hover": { bgcolor: "rgba(211,47,47,0.12)" } }}>
                      Unblock
                    </Button>
                  </Box>
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
                {isBlockedUser ? (
                  <Box sx={{ px: 2.5, py: 1.5, borderTop: "1px solid", borderColor: (t) => t.palette.divider, bgcolor: (t) => t.palette.background.paper }}>
                    <Typography sx={{ fontSize: "0.78rem", color: (t) => t.palette.text.disabled, textAlign: "center" }}>
                      {t("messages.unblockToSend", { username: selectedUser?.username })}
                    </Typography>
                  </Box>
                ) : (
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
              </>
            )}
          </Box>
          <ImageDialog
            openDialog={openDialog}
            handleCloseDialog={handleCloseDialog}
            selectedImage={selectedImage}
          />
        </>
      )}
    </Box>
  );
};

export default Messages;
