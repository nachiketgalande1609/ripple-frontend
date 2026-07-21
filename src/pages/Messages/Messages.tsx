import React, { useState, useEffect, useRef } from "react";
import { Box, Typography, useMediaQuery, useTheme } from "@mui/material";
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import socket from "../../services/socket";
import {
  deleteMessage,
  getAllMessageUsersData,
  getMessagesDataForSelectedUser,
  getMutedUsers,
  shareChatMedia,
  registerDeviceKey,
  getDeviceKeys,
  backupDeviceKey,
  fetchKeyBackup,
} from "../../services/api";
import {
  generateKeyPair,
  exportPublicKey,
  exportPrivateKey,
  importPublicKey,
  importPrivateKey,
  storePrivateKey,
  loadPrivateKey,
  getOrCreateDeviceId,
  encryptMessage,
  decryptMessage,
  encryptPrivateKeyWithPassword,
  decryptPrivateKeyWithPassword,
  EncryptedPayload,
} from "../../utils/crypto";
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
  encrypted_keys?: EncryptedPayload | null;
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

const Messages: React.FC<MessageProps> = ({
  onlineUsers,
  selectedUser,
  setSelectedUser,
  handleVideoCall,
}) => {
  const { userId } = useParams();
  const notifications = useAppNotifications();

  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [mutedUserIds, setMutedUserIds] = useState<Set<number>>(new Set());

  const [users, setUsers] = useState<User[]>([]);
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

  // E2E encryption state
  const [myDeviceId, setMyDeviceId] = useState(() => getOrCreateDeviceId());
  const myDeviceIdRef = useRef(myDeviceId);
  const myPrivateKeyRef = useRef<CryptoKey | null>(null);
  const myPublicKeyRef = useRef<CryptoKey | null>(null);
  const receiverKeysRef = useRef<{ deviceId: string; publicKey: CryptoKey }[]>([]);
  const [cryptoReady, setCryptoReady] = useState(false);


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

  // Fetch users and decrypt their latest_message previews inline
  const fetchUsersData = async () => {
    setLoadingUsers(true);
    try {
      const res = await getAllMessageUsersData();
      const rawUsers: any[] = res.data;

      if (!myPrivateKeyRef.current) {
        setUsers(rawUsers);
        return;
      }

      const decrypted = await Promise.all(
        rawUsers.map(async (user) => {
          if (!user.latest_message_encrypted_keys || !user.latest_message) return user;
          const myEntry = user.latest_message_encrypted_keys.keys?.find(
            (k: { deviceId: string }) => k.deviceId === myDeviceIdRef.current,
          );
          if (!myEntry) return { ...user, latest_message: "Encrypted message", latest_message_encrypted_keys: null };
          try {
            const plaintext = await decryptMessage(
              user.latest_message,
              user.latest_message_encrypted_keys.iv,
              myEntry.encryptedKey,
              myPrivateKeyRef.current!,
            );
            return { ...user, latest_message: plaintext, latest_message_encrypted_keys: null };
          } catch {
            return { ...user, latest_message: "Encrypted message", latest_message_encrypted_keys: null };
          }
        }),
      );

      setUsers(decrypted);
    } catch (error) {
      console.error("Failed to fetch users and messages:", error);
    } finally {
      setLoadingUsers(false);
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
  }, []);

  // Initialize E2E crypto: load or generate key pair, register public key with server
  useEffect(() => {
    const initCrypto = async () => {
      try {
        const deviceId = getOrCreateDeviceId();
        setMyDeviceId(deviceId);
        myDeviceIdRef.current = deviceId;

        // Password stored in sessionStorage at login time; clear it after use
        const password = sessionStorage.getItem('_kp');
        sessionStorage.removeItem('_kp');

        let privateKey = await loadPrivateKey(deviceId);

        if (!privateKey) {
          const backupRes = await fetchKeyBackup();

          if (backupRes.data && password) {
            // Restore silently using the login password
            try {
              const pkcs8 = await decryptPrivateKeyWithPassword(
                backupRes.data.encrypted_private_key,
                backupRes.data.salt,
                backupRes.data.iv,
                password,
              );
              const restoredKey = await importPrivateKey(pkcs8);
              const restoredDeviceId = backupRes.data.device_id;
              localStorage.setItem('ripple_device_id', restoredDeviceId);
              setMyDeviceId(restoredDeviceId);
              myDeviceIdRef.current = restoredDeviceId;
              await storePrivateKey(restoredDeviceId, restoredKey);
              myPrivateKeyRef.current = restoredKey;
              const existingKeys = await getDeviceKeys(currentUser.id);
              const myKeyEntry = existingKeys.find((k: any) => k.device_id === restoredDeviceId);
              if (myKeyEntry) {
                myPublicKeyRef.current = await importPublicKey(myKeyEntry.public_key);
              }
            } catch {
              // Wrong password or corrupt backup — fall through to fresh keypair
              console.warn('Key restore failed, generating fresh keypair');
              const keyPair = await generateKeyPair();
              await storePrivateKey(deviceId, keyPair.privateKey);
              const pubKeyB64 = await exportPublicKey(keyPair.publicKey);
              await registerDeviceKey(deviceId, pubKeyB64);
              myPrivateKeyRef.current = keyPair.privateKey;
              myPublicKeyRef.current = keyPair.publicKey;
            }
          } else {
            // No backup or no password available — generate fresh keypair
            const keyPair = await generateKeyPair();
            await storePrivateKey(deviceId, keyPair.privateKey);
            const pubKeyB64 = await exportPublicKey(keyPair.publicKey);
            await registerDeviceKey(deviceId, pubKeyB64);
            myPrivateKeyRef.current = keyPair.privateKey;
            myPublicKeyRef.current = keyPair.publicKey;

            // Silently back up if password is available
            if (password) {
              try {
                const pkcs8 = await exportPrivateKey(keyPair.privateKey);
                const { encryptedPrivateKey, salt, iv } = await encryptPrivateKeyWithPassword(pkcs8, password);
                await backupDeviceKey({ deviceId, encryptedPrivateKey, salt, iv });
              } catch {
                console.warn('Key backup failed silently');
              }
            }
          }
        } else {
          // Key already in IndexedDB — load it and re-register if needed
          myPrivateKeyRef.current = privateKey;
          const keys = await getDeviceKeys(currentUser.id);
          const myKeyData = keys.find((k: any) => k.device_id === deviceId);
          if (myKeyData) {
            myPublicKeyRef.current = await importPublicKey(myKeyData.public_key);
          } else {
            const keyPair = await generateKeyPair();
            await storePrivateKey(deviceId, keyPair.privateKey);
            const pubKeyB64 = await exportPublicKey(keyPair.publicKey);
            await registerDeviceKey(deviceId, pubKeyB64);
            myPrivateKeyRef.current = keyPair.privateKey;
            myPublicKeyRef.current = keyPair.publicKey;
          }
        }

        setCryptoReady(true);
      } catch (err) {
        console.error('E2E crypto init failed:', err);
        setCryptoReady(true);
      }
    };
    initCrypto();
  }, []);

  const fetchMessagesForSelectedUser = async (
    userId: number,
    offset = 0,
    limit = 20,
  ) => {
    setInitialMessageLoading(true);

    try {
      const res = await getMessagesDataForSelectedUser(userId, offset, limit);
      const rawMessages: Message[] = res.data.slice().reverse();

      // Decrypt messages that have encrypted_keys; leave legacy messages as-is
      const decrypted = await Promise.all(
        rawMessages.map(async (msg) => {
          if (!msg.encrypted_keys || !myPrivateKeyRef.current) return msg;
          const myEntry = msg.encrypted_keys.keys.find(
            (k) => k.deviceId === myDeviceIdRef.current,
          );
          if (!myEntry) return { ...msg, message_text: "[Encrypted on another device]" };
          try {
            const plaintext = await decryptMessage(
              msg.message_text,        // ciphertext is in message_text
              msg.encrypted_keys.iv,
              myEntry.encryptedKey,
              myPrivateKeyRef.current,
            );
            return { ...msg, message_text: plaintext };
          } catch {
            return { ...msg, message_text: "[Failed to decrypt]" };
          }
        }),
      );

      setMessages((prevMessages) =>
        offset === 0 ? decrypted : [...decrypted, ...prevMessages],
      );
    } catch (error) {
      console.error("Failed to fetch users and messages:", error);
    } finally {
      setInitialMessageLoading(false);
    }
  };

  // Wait for crypto to be ready before fetching users so previews can be decrypted inline
  useEffect(() => {
    if (cryptoReady) fetchUsersData();
  }, [cryptoReady]);

  // Fetch all public keys for the selected receiver so we can encrypt for all their devices
  useEffect(() => {
    if (!selectedUser) {
      receiverKeysRef.current = [];
      return;
    }
    const fetchReceiverKeys = async () => {
      try {
        const keys = await getDeviceKeys(selectedUser.id);
        receiverKeysRef.current = await Promise.all(
          keys.map(async (k) => ({
            deviceId: k.device_id,
            publicKey: await importPublicKey(k.public_key),
          }))
        );
      } catch (err) {
        console.error("Failed to fetch receiver device keys:", err);
        receiverKeysRef.current = [];
      }
    };
    fetchReceiverKeys();
  }, [selectedUser?.id]);

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
    if (
      navigatedUser &&
      navigatedUser.id &&
      !users.some((user) => user.id === navigatedUser.id)
    ) {
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
    socket.on("receiveMessage", async (data) => {
      if (data.senderId === currentUser.id) return;

      // Decrypt if the message is encrypted
      let messageText = data.message_text;
      if (data.encrypted_keys && myPrivateKeyRef.current) {
        const myEntry = data.encrypted_keys.keys.find(
          (k: { deviceId: string }) => k.deviceId === myDeviceIdRef.current,
        );
        if (myEntry) {
          try {
            messageText = await decryptMessage(
              data.message_text,        // ciphertext is in message_text
              data.encrypted_keys.iv,
              myEntry.encryptedKey,
              myPrivateKeyRef.current,
            );
          } catch {
            messageText = "[Failed to decrypt]";
          }
        } else {
          messageText = "[Encrypted on another device]";
        }
      }

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

  // Set selected user on clicking the user's chat
  const handleUserClick = (userId: number) => {
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
    const plaintext = inputMessage;

    // Encrypt the message text if we have keys for the receiver and ourselves
    let encryptedPayload: EncryptedPayload | null = null;
    let textToSend = plaintext;

    if (
      plaintext.trim() &&
      myPrivateKeyRef.current &&
      myPublicKeyRef.current &&
      receiverKeysRef.current.length > 0
    ) {
      try {
        const allRecipients = [
          ...receiverKeysRef.current,
          { deviceId: myDeviceIdRef.current, publicKey: myPublicKeyRef.current },
        ];
        encryptedPayload = await encryptMessage(plaintext, allRecipients);
        textToSend = encryptedPayload.ciphertext;
      } catch (err) {
        console.error("Encryption failed, sending plaintext:", err);
      }
    }

    const newMessage: Message = {
      message_id: tempMessageId,
      sender_id: currentUser.id,
      receiver_id: selectedUser.id,
      message_text: plaintext, // always show plaintext in own UI
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
      text: textToSend,
      encryptedKeys: encryptedPayload
        ? { iv: encryptedPayload.iv, keys: encryptedPayload.keys }
        : null,
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
          ? { ...u, latest_message: plaintext || "", latest_message_timestamp: new Date().toISOString() }
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
            prevMessages.filter((msg) => msg.message_id !== message.message_id), // Remove message from array
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
        height: isMobile ? "calc(100dvh - 60px)" : "100dvh",
      }}
    >
      {isMobile ? (
        !selectedUser ? (
          <MessagesUserList
            users={users}
            onlineUsers={onlineUsers}
            handleUserClick={handleUserClick}
            loading={loadingUsers}
          />
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
              selectedUser={selectedUser}
              chatTheme={chatTheme}
              setChatTheme={setChatTheme}
              openVideoCall={handleVideoCall}
              setMessages={setMessages}
              onMuteToggle={fetchMutedUsers}
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
            mutedUserIds={mutedUserIds}
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
            {!selectedUser ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2, color: 'text.secondary' }}>
                <ChatBubbleOutlineIcon sx={{ fontSize: 48, opacity: 0.5 }} />
                <Typography variant="body2" sx={{ opacity: 0.6 }}>Select a conversation to start chatting</Typography>
              </Box>
            ) : (
              <>
                {/* Top bar */}
                <MessagesTopBar
                  selectedUser={selectedUser}
                  chatTheme={chatTheme}
                  setChatTheme={setChatTheme}
                  openVideoCall={handleVideoCall}
                  setMessages={setMessages}
                  onMuteToggle={fetchMutedUsers}
                />

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
