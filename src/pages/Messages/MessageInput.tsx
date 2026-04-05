import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  TextField,
  IconButton,
  CircularProgress,
  useMediaQuery,
  useTheme,
  Typography,
  Popover,
} from "@mui/material";
import {
  InsertDriveFile as FileIcon,
  Close as CloseIcon,
  SentimentSatisfiedAlt as EmojiIcon,
  AttachFile as AttachFileIcon,
  Send as SendIcon,
} from "@mui/icons-material";
import EmojiPicker, { Theme } from "emoji-picker-react";

type User = {
  id: number;
  username: string;
  profile_picture: string;
  isOnline: boolean;
  latest_message: string;
  latest_message_timestamp: string;
  unread_count: number;
};

type Message = {
  message_id: number;
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

type MessageInputProps = {
  selectedFile: File | null;
  setSelectedFile: React.Dispatch<React.SetStateAction<File | null>>;
  selectedFileURL: string;
  setSelectedFileURL: React.Dispatch<React.SetStateAction<string>>;
  inputMessage: string;
  setInputMessage: React.Dispatch<React.SetStateAction<string>>;
  handleTyping: () => void;
  handleSendMessage: () => Promise<void>;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isSendingMessage: boolean;
  selectedMessageForReply: Message | null;
  cancelReply: () => void;
  selectedUser: User | null;
};

const iconButtonSx = {
  color: "#5f6368",
  width: 34,
  height: 34,
  "&:hover": {
    color: "#9aa0a6",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  "&:disabled": {
    color: "#3a3d42",
  },
};

const MessageInput: React.FC<MessageInputProps> = ({
  selectedFile,
  setSelectedFile,
  selectedFileURL,
  setSelectedFileURL,
  inputMessage,
  handleTyping,
  setInputMessage,
  handleSendMessage,
  handleFileChange,
  isSendingMessage,
  selectedMessageForReply,
  selectedUser,
  cancelReply,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const inputRef = useRef<HTMLInputElement>(null);
  const [emojiAnchorEl, setEmojiAnchorEl] = useState<null | HTMLElement>(null);

  const currentUser = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user") || "")
    : {};

  useEffect(() => {
    if (selectedUser && inputRef.current && !isMobile) inputRef.current.focus();
  }, [selectedUser]);

  const handleEmojiClick = (emojiObject: any) => {
    setInputMessage((prev) => prev + emojiObject.emoji);
    handleTyping();
  };

  const canSend = !!(inputMessage.trim() || selectedFile);

  const getFilePreview = () => {
    if (!selectedFile || !selectedFileURL) return null;
    const fileType = selectedFile.type;
    if (fileType.startsWith("image/"))
      return (
        <img
          src={selectedFileURL}
          alt="Attached"
          style={{
            maxHeight: 160,
            maxWidth: "100%",
            borderRadius: "10px",
            display: "block",
          }}
        />
      );
    if (fileType.startsWith("video/"))
      return (
        <video
          src={selectedFileURL}
          controls
          style={{
            maxHeight: 160,
            maxWidth: "100%",
            borderRadius: "10px",
            display: "block",
          }}
        />
      );
    if (fileType.startsWith("audio/"))
      return <audio controls src={selectedFileURL} style={{ width: "100%" }} />;
    return (
      <Box
        sx={{ display: "flex", alignItems: "center", gap: 1, color: "#9aa0a6" }}
      >
        <FileIcon sx={{ fontSize: 20 }} />
        <Typography sx={{ fontSize: "0.82rem" }}>
          {selectedFile.name}
        </Typography>
      </Box>
    );
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        backgroundColor: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(8px)",
        borderTop: "1px solid rgba(255,255,255,0.07)",
        mb: isMobile ? "50px" : 0,
      }}
    >
      {/* Reply preview */}
      {selectedMessageForReply && (
        <Box
          sx={{
            mx: 2,
            mt: 1.5,
            px: 1.5,
            py: 1,
            borderLeft: "3px solid #1976D2",
            borderRadius: "8px",
            backgroundColor: "rgba(255,255,255,0.05)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 1,
          }}
        >
          <Box sx={{ overflow: "hidden" }}>
            <Typography
              sx={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "#1976D2",
                mb: 0.25,
              }}
            >
              {selectedMessageForReply.sender_id === currentUser.id
                ? "You"
                : selectedUser?.username}
            </Typography>
            <Typography noWrap sx={{ fontSize: "0.8rem", color: "#9aa0a6" }}>
              {selectedMessageForReply.message_text.length > 60
                ? selectedMessageForReply.message_text.slice(0, 60) + "…"
                : selectedMessageForReply.message_text}
            </Typography>
          </Box>
          <IconButton
            onClick={cancelReply}
            size="small"
            sx={{
              color: "#5f6368",
              mt: -0.25,
              "&:hover": { color: "#9aa0a6" },
            }}
          >
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      )}

      {/* File preview */}
      {selectedFile && selectedFileURL && (
        <Box
          sx={{
            mx: 2,
            mt: 1.5,
            p: 1.5,
            borderRadius: "10px",
            backgroundColor: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            position: "relative",
            display: "inline-flex",
            alignSelf: "flex-start",
          }}
        >
          {getFilePreview()}
          <IconButton
            onClick={() => {
              setSelectedFile(null);
              setSelectedFileURL("");
            }}
            size="small"
            sx={{
              position: "absolute",
              top: -8,
              right: -8,
              backgroundColor: "#1a1d21",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#9aa0a6",
              width: 22,
              height: 22,
              "&:hover": { backgroundColor: "#2a2d31", color: "#e8eaed" },
            }}
          >
            <CloseIcon sx={{ fontSize: 13 }} />
          </IconButton>
        </Box>
      )}

      {/* Input row */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          px: 1.5,
          py: 1.25,
        }}
      >
        {/* Attach */}
        <input
          type="file"
          onChange={handleFileChange}
          style={{ display: "none" }}
          id="upload-file"
          disabled={!!(selectedFile || selectedFileURL)}
        />
        <label htmlFor="upload-file">
          <IconButton
            component="span"
            disabled={!!(selectedFile || selectedFileURL)}
            sx={iconButtonSx}
          >
            <AttachFileIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </label>

        {/* Text field */}
        <Box
          sx={{
            flex: 1,
            backgroundColor: "rgba(255,255,255,0.05)",
            borderRadius: "22px",
            border: "1px solid rgba(255,255,255,0.08)",
            px: 1.75,
            py: 0.75,
            display: "flex",
            alignItems: "flex-end",
            gap: 0.5,
            transition: "border-color 0.15s ease",
            "&:focus-within": {
              borderColor: "rgba(255,255,255,0.18)",
            },
          }}
        >
          <TextField
            fullWidth
            placeholder="Message..."
            size="small"
            value={inputMessage}
            variant="standard"
            inputRef={inputRef}
            onChange={(e) => {
              setInputMessage(e.target.value);
              handleTyping();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (canSend) handleSendMessage();
              }
            }}
            multiline
            minRows={1}
            maxRows={4}
            InputProps={{
              disableUnderline: true,
              sx: {
                color: "#e8eaed",
                fontSize: isMobile ? "0.85rem" : "0.9rem",
                "& textarea::placeholder": { color: "#5f6368" },
              },
            }}
            sx={{ flex: 1 }}
          />

          {/* Emoji */}
          <IconButton
            onClick={(e) => setEmojiAnchorEl(e.currentTarget)}
            sx={{ ...iconButtonSx, mb: -0.25 }}
          >
            <EmojiIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>

        {/* Send */}
        <IconButton
          onClick={() => canSend && handleSendMessage()}
          disabled={isSendingMessage || !canSend}
          sx={{
            width: 36,
            height: 36,
            backgroundColor: canSend ? "#1976D2" : "rgba(255,255,255,0.05)",
            color: canSend ? "#fff" : "#3a3d42",
            transition: "background-color 0.15s ease",
            "&:hover": {
              backgroundColor: canSend ? "#1565C0" : "rgba(255,255,255,0.05)",
            },
            "&:disabled": {
              backgroundColor: "rgba(255,255,255,0.04)",
              color: "#3a3d42",
            },
          }}
        >
          {isSendingMessage ? (
            <CircularProgress size={16} sx={{ color: "#fff" }} />
          ) : (
            <SendIcon sx={{ fontSize: 17 }} />
          )}
        </IconButton>

        <Popover
          open={Boolean(emojiAnchorEl)}
          anchorEl={emojiAnchorEl}
          onClose={() => setEmojiAnchorEl(null)}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          transformOrigin={{ vertical: "bottom", horizontal: "right" }}
          PaperProps={{ sx: { borderRadius: "16px", overflow: "hidden" } }}
        >
          <EmojiPicker theme={Theme.DARK} onEmojiClick={handleEmojiClick} />
        </Popover>
      </Box>
    </Box>
  );
};

export default MessageInput;
