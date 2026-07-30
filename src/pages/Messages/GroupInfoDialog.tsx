import React, { useState, useEffect, useRef } from "react";
import {
  Dialog, Box, Typography, Avatar, IconButton, TextField,
  CircularProgress, Button, InputAdornment,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";
import PersonAddRoundedIcon from "@mui/icons-material/PersonAddRounded";
import PersonRemoveRoundedIcon from "@mui/icons-material/PersonRemoveRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import AddAPhotoRoundedIcon from "@mui/icons-material/AddAPhotoRounded";
import SearchIcon from "@mui/icons-material/Search";
import {
  getGroupMembers, getSearchResults, updateGroup,
  addGroupMember, removeGroupMember, leaveGroup, shareChatMedia,
} from "../../services/api";

const GROUP_AVATAR_COLORS = [
  { bg: "#E8F5E9", color: "#2E7D32" },
  { bg: "#EDE7F6", color: "#4527A0" },
  { bg: "#FFF3E0", color: "#E65100" },
  { bg: "#E3F2FD", color: "#1565C0" },
];
const getGroupAvatarColor = (name: string) => {
  const idx = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % GROUP_AVATAR_COLORS.length;
  return GROUP_AVATAR_COLORS[idx];
};
import BlankProfileImage from "../../static/profile_blank.png";
import { useAppNotifications } from "../../hooks/useNotification";

type Group = {
  id: number;
  name: string;
  profile_picture: string | null;
  member_count: number;
  latest_message?: string | null;
  latest_message_sender?: string | null;
  latest_message_timestamp?: string | null;
};

type GroupMember = {
  id: number;
  username: string;
  profile_picture: string | null;
  joined_at: string;
};

type FollowingUser = {
  id: number;
  username: string;
  profile_picture: string;
};

interface GroupInfoDialogProps {
  open: boolean;
  onClose: () => void;
  group: Group;
  currentUserId: number;
  onGroupUpdated: (updatedGroup: Group) => void;
  onGroupLeft: () => void;
}

const backdropProps = {
  sx: { backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.6)" },
};

const neoInput = {
  bgcolor: "var(--nav-bg)",
  boxShadow: "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)",
  "& fieldset": { border: "none" },
  borderRadius: "14px",
  fontSize: "0.85rem",
};

const GroupInfoDialog: React.FC<GroupInfoDialogProps> = ({
  open, onClose, group, currentUserId, onGroupUpdated, onGroupLeft,
}) => {
  const notifications = useAppNotifications();
  const picInputRef = useRef<HTMLInputElement>(null);

  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(group.name);
  const [savingName, setSavingName] = useState(false);

  const [uploadingPic, setUploadingPic] = useState(false);

  const [addSearch, setAddSearch] = useState("");
  const [searchResults, setSearchResults] = useState<FollowingUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingUserId, setAddingUserId] = useState<number | null>(null);
  const [showAddSection, setShowAddSection] = useState(false);

  const [removingUserId, setRemovingUserId] = useState<number | null>(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [leaving, setLeaving] = useState(false);

  const memberIds = new Set(members.map((m) => m.id));

  useEffect(() => {
    if (!open) return;
    setNameValue(group.name);
    setEditingName(false);
    setShowAddSection(false);
    setAddSearch("");
    setMemberSearch("");
    loadMembers();
  }, [open, group.id]);

  const loadMembers = async () => {
    setLoadingMembers(true);
    try {
      const res = await getGroupMembers(group.id);
      if (res.success) setMembers(res.data);
    } catch { /* silent */ }
    finally { setLoadingMembers(false); }
  };

  useEffect(() => {
    if (!showAddSection) return;
    if (!addSearch.trim()) { setSearchResults([]); return; }
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await getSearchResults(addSearch.trim());
        setSearchResults(res.success ? res.data.users ?? [] : []);
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [addSearch, showAddSection]);

  const toggleAddSection = () => {
    setShowAddSection((v) => !v);
    setAddSearch("");
    setSearchResults([]);
  };

  const handleSaveName = async () => {
    if (!nameValue.trim() || nameValue === group.name) { setEditingName(false); return; }
    setSavingName(true);
    try {
      const res = await updateGroup(group.id, { name: nameValue.trim() });
      if (res.success) {
        onGroupUpdated({ ...group, ...res.data });
        notifications.show("Group name updated", { severity: "success", autoHideDuration: 2500 });
      }
    } catch { notifications.show("Failed to update name", { severity: "error", autoHideDuration: 2500 }); }
    finally { setSavingName(false); setEditingName(false); }
  };

  const handlePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPic(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const uploadRes = await shareChatMedia(formData);
      const url = uploadRes?.data?.fileUrl;
      if (!url) throw new Error("No URL");
      const res = await updateGroup(group.id, { profile_picture: url });
      if (res.success) {
        onGroupUpdated({ ...group, ...res.data });
        notifications.show("Group photo updated", { severity: "success", autoHideDuration: 2500 });
      }
    } catch { notifications.show("Failed to update photo", { severity: "error", autoHideDuration: 2500 }); }
    finally { setUploadingPic(false); if (picInputRef.current) picInputRef.current.value = ""; }
  };

  const handleAddMember = async (userId: number) => {
    setAddingUserId(userId);
    try {
      const res = await addGroupMember(group.id, userId);
      if (res.success) {
        setMembers((prev) => [...prev, res.data]);
        onGroupUpdated({ ...group, member_count: group.member_count + 1 });
        notifications.show("Member added", { severity: "success", autoHideDuration: 2000 });
      }
    } catch { notifications.show("Failed to add member", { severity: "error", autoHideDuration: 2500 }); }
    finally { setAddingUserId(null); }
  };

  const handleRemoveMember = async (userId: number) => {
    setRemovingUserId(userId);
    try {
      const res = await removeGroupMember(group.id, userId);
      if (res.success) {
        setMembers((prev) => prev.filter((m) => m.id !== userId));
        onGroupUpdated({ ...group, member_count: Math.max(0, group.member_count - 1) });
        notifications.show("Member removed", { severity: "success", autoHideDuration: 2000 });
      }
    } catch { notifications.show("Failed to remove member", { severity: "error", autoHideDuration: 2500 }); }
    finally { setRemovingUserId(null); }
  };

  const handleLeave = async () => {
    setLeaving(true);
    try {
      await leaveGroup(group.id);
      notifications.show("You left the group", { severity: "info", autoHideDuration: 2500 });
      onClose();
      onGroupLeft();
    } catch { notifications.show("Failed to leave group", { severity: "error", autoHideDuration: 2500 }); }
    finally { setLeaving(false); }
  };

  const filteredMembers = memberSearch.trim()
    ? members.filter((m) => m.username.toLowerCase().includes(memberSearch.toLowerCase()))
    : members;

  const addablePeople = searchResults.filter((u) => !memberIds.has(u.id));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      BackdropProps={backdropProps}
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: "36px",
          backgroundColor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          boxShadow: "0 24px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(100,116,139,0.08)",
          overflow: "hidden",
          maxHeight: "88vh",
          padding: "6px",
        },
      }}
    >
      {/* Close button */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", px: 1.5, pt: 1.5, pb: 0 }}>
        <IconButton
          size="small"
          onClick={onClose}
          sx={{
            width: 32, height: 32, borderRadius: "10px",
            backgroundColor: "var(--nav-bg)",
            boxShadow: "inset 2px 2px 6px var(--nav-neo-shadow1), inset -2px -2px 6px var(--nav-neo-shadow2)",
            color: "text.secondary",
            "&:hover": { color: "text.primary" },
          }}
        >
          <CloseRoundedIcon sx={{ fontSize: 15 }} />
        </IconButton>
      </Box>

      <Box sx={{ overflowY: "auto", px: 2.5, pt: 0.5, pb: 2.5, display: "flex", flexDirection: "column", gap: 2 }}>

        {/* ── Avatar + name ─────────────────────────────── */}
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.25 }}>
          <Box sx={{ position: "relative", cursor: "pointer" }} onClick={() => picInputRef.current?.click()}>
            <Avatar
              src={group.profile_picture || undefined}
              sx={{
                width: 76, height: 76, border: "3px solid", borderColor: "divider",
                bgcolor: group.profile_picture ? undefined : getGroupAvatarColor(group.name).bg,
              }}
            >
              {!group.profile_picture && <GroupsRoundedIcon sx={{ fontSize: 36, color: getGroupAvatarColor(group.name).color }} />}
            </Avatar>
            <Box
              sx={{
                position: "absolute", inset: 0, borderRadius: "50%",
                bgcolor: "rgba(0,0,0,0.38)", display: "flex", alignItems: "center",
                justifyContent: "center", opacity: uploadingPic ? 1 : 0,
                transition: "opacity 0.18s",
                "&:hover": { opacity: 1 },
              }}
            >
              {uploadingPic
                ? <CircularProgress size={18} sx={{ color: "#fff" }} />
                : <AddAPhotoRoundedIcon sx={{ fontSize: 18, color: "#fff" }} />}
            </Box>
          </Box>
          <input ref={picInputRef} type="file" accept="image/*" hidden onChange={handlePicChange} />

          {/* Name row */}
          {editingName ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, width: "100%" }}>
              <TextField
                autoFocus
                fullWidth
                size="small"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") setEditingName(false); }}
                inputProps={{ maxLength: 100 }}
                sx={{ "& .MuiOutlinedInput-root": { ...neoInput, fontSize: "0.9rem", fontWeight: 600 } }}
              />
              <IconButton
                size="small"
                onClick={handleSaveName}
                disabled={savingName}
                sx={{
                  width: 30, height: 30, borderRadius: "9px",
                  backgroundColor: "var(--nav-bg)",
                  boxShadow: "inset 2px 2px 6px var(--nav-neo-shadow1), inset -2px -2px 6px var(--nav-neo-shadow2)",
                  color: "primary.main",
                }}
              >
                {savingName ? <CircularProgress size={14} /> : <CheckRoundedIcon sx={{ fontSize: 16 }} />}
              </IconButton>
              <IconButton
                size="small"
                onClick={() => { setEditingName(false); setNameValue(group.name); }}
                sx={{
                  width: 30, height: 30, borderRadius: "9px",
                  backgroundColor: "var(--nav-bg)",
                  boxShadow: "inset 2px 2px 6px var(--nav-neo-shadow1), inset -2px -2px 6px var(--nav-neo-shadow2)",
                  color: "text.disabled",
                }}
              >
                <ClearRoundedIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          ) : (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Typography sx={{ fontWeight: 700, fontSize: "1.05rem", color: "text.primary" }}>
                {group.name}
              </Typography>
              <IconButton
                size="small"
                onClick={() => setEditingName(true)}
                sx={{
                  width: 26, height: 26, borderRadius: "8px",
                  color: "text.disabled",
                  "&:hover": { color: "text.primary", backgroundColor: "action.hover" },
                }}
              >
                <EditRoundedIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Box>
          )}

          <Typography sx={{ fontSize: "0.72rem", color: "text.disabled", fontWeight: 500 }}>
            {group.member_count} member{group.member_count !== 1 ? "s" : ""}
          </Typography>
        </Box>

        {/* ── Members ───────────────────────────────────── */}
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1, px: 0.25 }}>
            <Typography sx={{ fontSize: "0.7rem", fontWeight: 600, color: "text.disabled", textTransform: "uppercase", letterSpacing: "0.07em" }}>
              Members
            </Typography>
            <IconButton
              size="small"
              onClick={toggleAddSection}
              sx={{
                width: 28, height: 28, borderRadius: "9px",
                backgroundColor: "var(--nav-bg)",
                boxShadow: "inset 2px 2px 6px var(--nav-neo-shadow1), inset -2px -2px 6px var(--nav-neo-shadow2)",
                color: showAddSection ? "primary.main" : "text.secondary",
                transition: "color 0.2s",
              }}
            >
              <PersonAddRoundedIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Box>

          {/* Add people panel */}
          {showAddSection && (
            <Box
              sx={{
                mb: 1.5, px: 1.5, py: 1.25, borderRadius: "18px",
                backgroundColor: "var(--nav-bg)",
                boxShadow: "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)",
              }}
            >
              <TextField
                fullWidth
                size="small"
                placeholder="Search people to add…"
                value={addSearch}
                onChange={(e) => setAddSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 15, color: "text.disabled" }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 1,
                  "& .MuiOutlinedInput-root": { ...neoInput },
                }}
              />
              <Box sx={{ maxHeight: 150, overflowY: "auto" }}>
                {searching ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                    <CircularProgress size={18} />
                  </Box>
                ) : !addSearch.trim() ? (
                  <Typography sx={{ fontSize: "0.78rem", color: "text.disabled", textAlign: "center", py: 1.25 }}>
                    Type to search people…
                  </Typography>
                ) : addablePeople.length === 0 ? (
                  <Typography sx={{ fontSize: "0.78rem", color: "text.disabled", textAlign: "center", py: 1.25 }}>
                    No results
                  </Typography>
                ) : (
                  addablePeople.map((u) => (
                    <Box
                      key={u.id}
                      sx={{
                        display: "flex", alignItems: "center", gap: 1.25,
                        py: 0.6, px: 0.75, borderRadius: "12px",
                        "&:hover": { bgcolor: "background.paper" },
                      }}
                    >
                      <Avatar src={u.profile_picture || BlankProfileImage} sx={{ width: 30, height: 30 }} />
                      <Typography sx={{ flex: 1, fontSize: "0.83rem", fontWeight: 500, color: "text.primary" }}>
                        {u.username}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleAddMember(u.id)}
                        disabled={addingUserId === u.id}
                        sx={{
                          width: 28, height: 28, borderRadius: "9px",
                          backgroundColor: "var(--nav-bg)",
                          boxShadow: "inset 2px 2px 6px var(--nav-neo-shadow1), inset -2px -2px 6px var(--nav-neo-shadow2)",
                          color: "primary.main",
                        }}
                      >
                        {addingUserId === u.id
                          ? <CircularProgress size={12} />
                          : <PersonAddRoundedIcon sx={{ fontSize: 14 }} />}
                      </IconButton>
                    </Box>
                  ))
                )}
              </Box>
            </Box>
          )}

          {/* Member search (shown when 5+ members) */}
          {members.length > 4 && (
            <Box sx={{ mb: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search members…"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 15, color: "text.disabled" }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ "& .MuiOutlinedInput-root": { ...neoInput } }}
              />
            </Box>
          )}

          {/* Member list */}
          {loadingMembers ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress size={20} />
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              {filteredMembers.map((member) => {
                const isSelf = member.id === currentUserId;
                return (
                  <Box
                    key={member.id}
                    sx={{
                      display: "flex", alignItems: "center", gap: 1.25,
                      px: 1.5, height: 52, borderRadius: "28px",
                      backgroundColor: "var(--nav-bg)",
                      boxShadow: "inset 1px 1px 5px var(--nav-neo-shadow1), inset -1px -1px 5px var(--nav-neo-shadow2)",
                      transition: "box-shadow 0.2s ease",
                    }}
                  >
                    <Avatar
                      src={member.profile_picture || BlankProfileImage}
                      sx={{ width: 34, height: 34, flexShrink: 0 }}
                    />
                    <Typography sx={{ flex: 1, fontSize: "0.855rem", fontWeight: 500, color: "text.primary", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {member.username}
                      {isSelf && (
                        <Box component="span" sx={{ color: "text.disabled", fontWeight: 400, fontSize: "0.78rem" }}>
                          {" "}(you)
                        </Box>
                      )}
                    </Typography>
                    {!isSelf && (
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveMember(member.id)}
                        disabled={removingUserId === member.id}
                        sx={{
                          width: 28, height: 28, borderRadius: "9px", flexShrink: 0,
                          color: "text.disabled",
                          "&:hover": { color: "error.main", backgroundColor: "rgba(211,47,47,0.08)" },
                        }}
                      >
                        {removingUserId === member.id
                          ? <CircularProgress size={12} />
                          : <PersonRemoveRoundedIcon sx={{ fontSize: 15 }} />}
                      </IconButton>
                    )}
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>

        {/* ── Leave group ───────────────────────────────── */}
        <Button
          fullWidth
          onClick={handleLeave}
          disabled={leaving}
          startIcon={leaving ? <CircularProgress size={15} color="inherit" /> : <LogoutRoundedIcon sx={{ fontSize: 16 }} />}
          sx={{
            textTransform: "none", fontWeight: 600, fontSize: "0.875rem",
            color: "error.main", borderRadius: "18px", py: 1.25, mt: 0.5,
            backgroundColor: "var(--nav-bg)",
            boxShadow: "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)",
            border: "none",
            "&:hover": {
              backgroundColor: "var(--nav-bg)",
              boxShadow: "inset 3px 3px 10px var(--nav-neo-shadow1), inset -3px -3px 10px var(--nav-neo-shadow2)",
            },
          }}
        >
          Leave Group
        </Button>
      </Box>
    </Dialog>
  );
};

export default GroupInfoDialog;
