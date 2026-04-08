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

const ACCENT = "#7c5cfc";

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

  const iconBtnSx = {
    width: 32,
    height: 32,
    borderRadius: "9px",
    color: (t: any) => t.palette.text.disabled,
    flexShrink: 0,
    "&:hover": {
      color: (t: any) => t.palette.text.secondary,
      backgroundColor: (t: any) => t.palette.action.hover,
    },
    "&:disabled": { color: (t: any) => t.palette.action.disabled },
  };

  const getFilePreview = () => {
    if (!selectedFile || !selectedFileURL) return null;
    const type = selectedFile.type;
    if (type.startsWith("image/"))
      return (
        <img
          src={selectedFileURL}
          alt="Attached"
          style={{ maxHeight: 140, maxWidth: "100%", borderRadius: "10px", display: "block" }}
        />
      );
    if (type.startsWith("video/"))
      return (
        <video
          src={selectedFileURL}
          controls
          style={{ maxHeight: 140, maxWidth: "100%", borderRadius: "10px", display: "block" }}
        />
      );
    if (type.startsWith("audio/"))
      return <audio controls src={selectedFileURL} style={{ width: "100%" }} />;
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: (t) => t.palette.text.secondary }}>
        <FileIcon sx={{ fontSize: 18 }} />
        <Typography sx={{ fontSize: "0.8rem" }}>{selectedFile.name}</Typography>
      </Box>
    );
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        backgroundColor: (t) => t.palette.background.paper,
        borderTop: "1px solid",
        borderColor: (t) => t.palette.divider,
        mb: isMobile ? "60px" : 0,
      }}
    >
      {/* ── Reply preview ── */}
      {selectedMessageForReply && (
        <Box
          sx={{
            mx: 1.5,
            mt: 1.25,
            px: 1.25,
            py: 0.875,
            borderLeft: "3px solid",
            borderColor: ACCENT,
            borderRadius: "8px",
            backgroundColor: isDark ? "rgba(124,92,252,0.1)" : "rgba(124,92,252,0.07)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 1,
          }}
        >
          <Box sx={{ overflow: "hidden" }}>
            <Typography sx={{ fontSize: "0.7rem", fontWeight: 600, color: ACCENT, mb: "2px" }}>
              {selectedMessageForReply.sender_id === currentUser.id ? "You" : selectedUser?.username}
            </Typography>
            <Typography noWrap sx={{ fontSize: "0.78rem", color: (t) => t.palette.text.secondary }}>
              {selectedMessageForReply.message_text.length > 65
                ? selectedMessageForReply.message_text.slice(0, 65) + "…"
                : selectedMessageForReply.message_text}
            </Typography>
          </Box>
          <IconButton
            onClick={cancelReply}
            size="small"
            sx={{
              width: 22,
              height: 22,
              color: (t) => t.palette.text.disabled,
              flexShrink: 0,
              "&:hover": { color: (t) => t.palette.text.secondary, backgroundColor: "transparent" },
            }}
          >
            <CloseIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Box>
      )}

      {/* ── File preview ── */}
      {selectedFile && selectedFileURL && (
        <Box
          sx={{
            mx: 1.5,
            mt: 1.25,
            p: 1.25,
            borderRadius: "12px",
            backgroundColor: (t) => t.palette.action.hover,
            border: "1px solid",
            borderColor: (t) => t.palette.divider,
            position: "relative",
            display: "inline-flex",
            alignSelf: "flex-start",
          }}
        >
          {getFilePreview()}
          <IconButton
            onClick={() => { setSelectedFile(null); setSelectedFileURL(""); }}
            size="small"
            sx={{
              position: "absolute",
              top: -8,
              right: -8,
              width: 20,
              height: 20,
              backgroundColor: (t) => t.palette.background.paper,
              border: "1px solid",
              borderColor: (t) => t.palette.divider,
              color: (t) => t.palette.text.secondary,
              "&:hover": {
                backgroundColor: (t) => t.palette.action.hover,
                color: (t) => t.palette.text.primary,
              },
            }}
          >
            <CloseIcon sx={{ fontSize: 12 }} />
          </IconButton>
        </Box>
      )}

      {/* ── Input row ── */}
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-end",
          gap: "6px",
          px: 1.25,
          py: 1,
        }}
      >
        {/* Attach button */}
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
            sx={{ ...iconBtnSx, mb: "8px" }}
          >
            <AttachFileIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </label>

        {/* Text input pill */}
        <Box
          sx={{
            flex: 1,
            backgroundColor: (t) => t.palette.action.hover,
            borderRadius: "14px",
            border: "1px solid",
            borderColor: (t) => t.palette.divider,
            px: 1.5,
            py: "8px",
            display: "flex",
            alignItems: "flex-end",
            gap: "4px",
            transition: "border-color 0.15s",
          }}
        >
          <TextField
            fullWidth
            placeholder="Message…"
            size="small"
            value={inputMessage}
            variant="standard"
            inputRef={inputRef}
            onChange={(e) => { setInputMessage(e.target.value); handleTyping(); }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (canSend) handleSendMessage();
              }
            }}
            multiline
            minRows={1}
            maxRows={5}
            InputProps={{
              disableUnderline: true,
              sx: {
                color: (t) => t.palette.text.primary,
                fontSize: isMobile ? "0.85rem" : "0.88rem",
                lineHeight: 1.5,
                "& textarea::placeholder": {
                  color: (t) => t.palette.text.disabled,
                  opacity: 1,
                },
              },
            }}
            sx={{ flex: 1 }}
          />
          {/* Emoji inside pill */}
          <IconButton
            onClick={(e) => setEmojiAnchorEl(e.currentTarget)}
            sx={{
              ...iconBtnSx,
              mb: "-2px",
              "&:hover": {
                color: ACCENT,
                backgroundColor: "transparent",
              },
            }}
          >
            <EmojiIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        {/* Send button */}
        <IconButton
          onClick={() => canSend && handleSendMessage()}
          disabled={isSendingMessage || !canSend}
          sx={{
            width: 36,
            height: 36,
            borderRadius: "11px",
            flexShrink: 0,
            mb: "6px",
            backgroundColor: canSend ? ACCENT : (t) => t.palette.action.hover,
            color: canSend ? "#fff" : (t) => t.palette.action.disabled,
            transition: "background-color 0.15s, transform 0.1s",
            "&:hover": {
              backgroundColor: canSend ? "#6b4de0" : (t) => t.palette.action.hover,
            },
            "&:active": { transform: canSend ? "scale(0.93)" : "none" },
            "&:disabled": {
              backgroundColor: (t) => t.palette.action.hover,
              color: (t) => t.palette.action.disabled,
            },
          }}
        >
          {isSendingMessage
            ? <CircularProgress size={15} sx={{ color: "#fff" }} />
            : <SendIcon sx={{ fontSize: 16 }} />}
        </IconButton>
      </Box>

      {/* Emoji popover */}
      <Popover
        open={Boolean(emojiAnchorEl)}
        anchorEl={emojiAnchorEl}
        onClose={() => setEmojiAnchorEl(null)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "bottom", horizontal: "right" }}
        PaperProps={{ sx: { borderRadius: "16px", overflow: "hidden" } }}
      >
        <EmojiPicker theme={isDark ? Theme.DARK : Theme.LIGHT} onEmojiClick={handleEmojiClick} />
      </Popover>
    </Box>
  );
};

export default MessageInput;