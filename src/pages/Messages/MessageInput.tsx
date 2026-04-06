import React, { useEffect, useRef, useState } from "react";
import {
  Box, TextField, IconButton, CircularProgress,
  useMediaQuery, useTheme, Typography, Popover,
} from "@mui/material";
import {
  InsertDriveFile as FileIcon, Close as CloseIcon,
  SentimentSatisfiedAlt as EmojiIcon, AttachFile as AttachFileIcon, Send as SendIcon,
} from "@mui/icons-material";
import EmojiPicker, { Theme } from "emoji-picker-react";

type User = {
  id: number; username: string; profile_picture: string; isOnline: boolean;
  latest_message: string; latest_message_timestamp: string; unread_count: number;
};

type Message = {
  message_id: number; sender_id: number; message_text: string; timestamp: string;
  delivered?: boolean; read?: boolean; saved?: boolean; file_url: string;
  delivered_timestamp?: string | null; read_timestamp?: string | null;
  file_name: string | null; file_size: string | null; reply_to: number | null;
  media_height: number | null; media_width: number | null; reactions: ReactionDetail[];
  post?: {
    post_id: number; file_url: string; media_width: number; media_height: number;
    content: string; owner: { user_id: number; username: string; profile_picture: string; };
  } | null;
};

interface ReactionDetail {
  user_id: string; reaction: string; username: string; profile_picture: string;
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

const MessageInput: React.FC<MessageInputProps> = ({
  selectedFile, setSelectedFile, selectedFileURL, setSelectedFileURL,
  inputMessage, handleTyping, setInputMessage, handleSendMessage,
  handleFileChange, isSendingMessage, selectedMessageForReply, selectedUser, cancelReply,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isDark = theme.palette.mode === "dark";
  const inputRef = useRef<HTMLInputElement>(null);
  const [emojiAnchorEl, setEmojiAnchorEl] = useState<null | HTMLElement>(null);

  const currentUser = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user") || "") : {};

  useEffect(() => {
    if (selectedUser && inputRef.current && !isMobile) inputRef.current.focus();
  }, [selectedUser]);

  const handleEmojiClick = (emojiObject: any) => {
    setInputMessage((prev) => prev + emojiObject.emoji);
    handleTyping();
  };

  const canSend = !!(inputMessage.trim() || selectedFile);

  // Icon button style built from theme
  const iconButtonSx = {
    color: (t: any) => t.palette.text.disabled,
    width: 34, height: 34,
    "&:hover": { color: (t: any) => t.palette.text.secondary, backgroundColor: (t: any) => t.palette.action.hover },
    "&:disabled": { color: (t: any) => t.palette.action.disabled },
  };

  const getFilePreview = () => {
    if (!selectedFile || !selectedFileURL) return null;
    const fileType = selectedFile.type;
    if (fileType.startsWith("image/"))
      return <img src={selectedFileURL} alt="Attached" style={{ maxHeight: 160, maxWidth: "100%", borderRadius: "10px", display: "block" }} />;
    if (fileType.startsWith("video/"))
      return <video src={selectedFileURL} controls style={{ maxHeight: 160, maxWidth: "100%", borderRadius: "10px", display: "block" }} />;
    if (fileType.startsWith("audio/"))
      return <audio controls src={selectedFileURL} style={{ width: "100%" }} />;
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: (t) => t.palette.text.secondary }}>
        <FileIcon sx={{ fontSize: 20 }} />
        <Typography sx={{ fontSize: "0.82rem" }}>{selectedFile.name}</Typography>
      </Box>
    );
  };

  return (
    <Box
      sx={{
        display: "flex", flexDirection: "column",
        backgroundColor: (t) => t.palette.background.paper,
        borderTop: "1px solid", borderColor: (t) => t.palette.divider,
        mb: isMobile ? "50px" : 0,
      }}
    >
      {/* Reply preview */}
      {selectedMessageForReply && (
        <Box
          sx={{
            mx: 2, mt: 1.5, px: 1.5, py: 1,
            borderLeft: "3px solid", borderColor: (t) => t.palette.primary.main,
            borderRadius: "8px",
            backgroundColor: (t) => t.palette.action.hover,
            display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1,
          }}
        >
          <Box sx={{ overflow: "hidden" }}>
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: (t) => t.palette.primary.main, mb: 0.25 }}>
              {selectedMessageForReply.sender_id === currentUser.id ? "You" : selectedUser?.username}
            </Typography>
            <Typography noWrap sx={{ fontSize: "0.8rem", color: (t) => t.palette.text.secondary }}>
              {selectedMessageForReply.message_text.length > 60
                ? selectedMessageForReply.message_text.slice(0, 60) + "…"
                : selectedMessageForReply.message_text}
            </Typography>
          </Box>
          <IconButton
            onClick={cancelReply} size="small"
            sx={{ color: (t) => t.palette.text.disabled, mt: -0.25, "&:hover": { color: (t) => t.palette.text.secondary } }}
          >
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      )}

      {/* File preview */}
      {selectedFile && selectedFileURL && (
        <Box
          sx={{
            mx: 2, mt: 1.5, p: 1.5, borderRadius: "10px",
            backgroundColor: (t) => t.palette.action.hover,
            border: "1px solid", borderColor: (t) => t.palette.divider,
            position: "relative", display: "inline-flex", alignSelf: "flex-start",
          }}
        >
          {getFilePreview()}
          <IconButton
            onClick={() => { setSelectedFile(null); setSelectedFileURL(""); }}
            size="small"
            sx={{
              position: "absolute", top: -8, right: -8,
              backgroundColor: (t) => t.palette.background.paper,
              border: "1px solid", borderColor: (t) => t.palette.divider,
              color: (t) => t.palette.text.secondary,
              width: 22, height: 22,
              "&:hover": { backgroundColor: (t) => t.palette.action.hover, color: (t) => t.palette.text.primary },
            }}
          >
            <CloseIcon sx={{ fontSize: 13 }} />
          </IconButton>
        </Box>
      )}

      {/* Input row */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, px: 1.5, py: 1.25 }}>
        {/* Attach */}
        <input
          type="file" onChange={handleFileChange} style={{ display: "none" }}
          id="upload-file" disabled={!!(selectedFile || selectedFileURL)}
        />
        <label htmlFor="upload-file">
          <IconButton component="span" disabled={!!(selectedFile || selectedFileURL)} sx={iconButtonSx}>
            <AttachFileIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </label>

        {/* Text field */}
        <Box
          sx={{
            flex: 1,
            backgroundColor: (t) => t.palette.action.hover,
            borderRadius: "22px",
            border: "1px solid", borderColor: (t) => t.palette.divider,
            px: 1.75, py: 0.75,
            display: "flex", alignItems: "flex-end", gap: 0.5,
            transition: "border-color 0.15s ease",
            "&:focus-within": { borderColor: (t) => t.palette.text.disabled },
          }}
        >
          <TextField
            fullWidth placeholder="Message..." size="small"
            value={inputMessage} variant="standard" inputRef={inputRef}
            onChange={(e) => { setInputMessage(e.target.value); handleTyping(); }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (canSend) handleSendMessage(); }
            }}
            multiline minRows={1} maxRows={4}
            InputProps={{
              disableUnderline: true,
              sx: {
                color: (t) => t.palette.text.primary,
                fontSize: isMobile ? "0.85rem" : "0.9rem",
                "& textarea::placeholder": { color: (t) => t.palette.text.disabled },
              },
            }}
            sx={{ flex: 1 }}
          />
          <IconButton onClick={(e) => setEmojiAnchorEl(e.currentTarget)} sx={{ ...iconButtonSx, mb: -0.25 }}>
            <EmojiIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>

        {/* Send */}
        <IconButton
          onClick={() => canSend && handleSendMessage()}
          disabled={isSendingMessage || !canSend}
          sx={{
            width: 36, height: 36,
            backgroundColor: canSend ? (t) => t.palette.primary.main : (t) => t.palette.action.hover,
            color: canSend ? "#fff" : (t) => t.palette.action.disabled,
            transition: "background-color 0.15s ease",
            "&:hover": { backgroundColor: canSend ? (t) => t.palette.primary.dark : (t) => t.palette.action.hover },
            "&:disabled": { backgroundColor: (t) => t.palette.action.disabledBackground, color: (t) => t.palette.action.disabled },
          }}
        >
          {isSendingMessage
            ? <CircularProgress size={16} sx={{ color: "#fff" }} />
            : <SendIcon sx={{ fontSize: 17 }} />}
        </IconButton>

        <Popover
          open={Boolean(emojiAnchorEl)} anchorEl={emojiAnchorEl}
          onClose={() => setEmojiAnchorEl(null)}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          transformOrigin={{ vertical: "bottom", horizontal: "right" }}
          PaperProps={{ sx: { borderRadius: "16px", overflow: "hidden" } }}
        >
          <EmojiPicker theme={isDark ? Theme.DARK : Theme.LIGHT} onEmojiClick={handleEmojiClick} />
        </Popover>
      </Box>
    </Box>
  );
};

export default MessageInput;