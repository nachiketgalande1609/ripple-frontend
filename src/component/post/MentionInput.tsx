import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Box, TextField, Paper, List, ListItem, Avatar, Typography, Popper,
} from "@mui/material";
import { getSearchResults } from "../../services/api";
import BlankProfileImage from "../../static/profile_blank.png";

interface MentionUser {
  id: number;
  username: string;
  profile_picture: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  inputRef?: React.RefObject<HTMLInputElement>;
  placeholder?: string;
  InputProps?: object;
}

function getMentionQuery(text: string, cursor: number): string | null {
  const before = text.slice(0, cursor);
  const m = before.match(/@([a-zA-Z0-9_.]*)$/);
  return m ? m[1] : null;
}

function applyMention(text: string, cursor: number, username: string): { newText: string; newCursor: number } {
  const before = text.slice(0, cursor).replace(/@[a-zA-Z0-9_.]*$/, `@${username} `);
  const after = text.slice(cursor);
  return { newText: before + after, newCursor: before.length };
}

export function renderMentions(
  text: string,
  onMentionClick: (username: string) => void
): React.ReactNode {
  const parts = text.split(/(@[a-zA-Z0-9_.]+)/g);
  return parts.map((part, i) =>
    /^@[a-zA-Z0-9_.]+$/.test(part) ? (
      <Box
        key={i}
        component="span"
        onClick={(e: React.MouseEvent) => { e.stopPropagation(); onMentionClick(part.slice(1)); }}
        sx={{ color: "#64748B", fontWeight: 700, cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
      >
        {part}
      </Box>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  );
}

const MentionInput: React.FC<Props> = ({ value, onChange, onSubmit, inputRef, placeholder, InputProps }) => {
  const [users, setUsers] = useState<MentionUser[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cursorRef = useRef(0);

  const search = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length === 0) { setUsers([]); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await getSearchResults(q);
        const list: MentionUser[] = res?.data?.users ?? [];
        setUsers(list.slice(0, 5));
        setOpen(list.length > 0);
        setSelectedIdx(0);
      } catch {
        setUsers([]); setOpen(false);
      }
    }, 250);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    const cursor = e.target.selectionStart ?? newVal.length;
    cursorRef.current = cursor;
    onChange(newVal);
    const q = getMentionQuery(newVal, cursor);
    if (q !== null) { search(q); } else { setOpen(false); setUsers([]); }
  };

  const selectUser = useCallback((user: MentionUser) => {
    const { newText, newCursor } = applyMention(value, cursorRef.current, user.username);
    onChange(newText);
    setOpen(false);
    setUsers([]);
    setTimeout(() => {
      if (inputRef?.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(newCursor, newCursor);
      }
    }, 0);
  }, [value, onChange, inputRef]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (open && users.length > 0) {
      if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, users.length - 1)); return; }
      if (e.key === "ArrowUp")   { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); return; }
      if (e.key === "Enter")     { e.preventDefault(); selectUser(users[selectedIdx]); return; }
      if (e.key === "Escape")    { setOpen(false); return; }
    }
    if (e.key === "Enter" && !e.shiftKey && !open) {
      e.preventDefault();
      onSubmit?.();
    }
  };

  const handleSelect = (e: React.SyntheticEvent<HTMLInputElement>) => {
    cursorRef.current = (e.target as HTMLInputElement).selectionStart ?? 0;
  };

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  return (
    <Box ref={wrapperRef} sx={{ flex: 1 }}>
      <TextField
        fullWidth
        variant="standard"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onSelect={handleSelect}
        onClick={handleSelect as any}
        inputRef={inputRef}
        InputProps={InputProps as any}
      />

      <Popper
        open={open}
        anchorEl={wrapperRef.current}
        placement="top-start"
        style={{ zIndex: 1500, width: wrapperRef.current?.offsetWidth ?? "auto" }}
        modifiers={[{ name: "offset", options: { offset: [0, 8] } }]}
      >
        <Paper
          elevation={8}
          sx={{
            borderRadius: "14px", overflow: "hidden",
            border: "1px solid", borderColor: "divider",
          }}
        >
          <List disablePadding>
            {users.map((u, i) => (
              <ListItem
                key={u.id}
                onMouseDown={(e) => { e.preventDefault(); selectUser(u); }}
                sx={{
                  px: 1.5, py: 0.9, cursor: "pointer", gap: 1.25,
                  bgcolor: i === selectedIdx ? "action.hover" : "transparent",
                  "&:hover": { bgcolor: "action.hover" },
                  transition: "background 0.1s",
                }}
              >
                <Avatar
                  src={u.profile_picture || BlankProfileImage}
                  sx={{ width: 30, height: 30, flexShrink: 0 }}
                />
                <Typography sx={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.83rem", fontWeight: 600 }}>
                  @{u.username}
                </Typography>
              </ListItem>
            ))}
          </List>
        </Paper>
      </Popper>
    </Box>
  );
};

export default MentionInput;
