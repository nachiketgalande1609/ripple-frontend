import React, { useState, useEffect } from "react";
import {
  Dialog,
  Box,
  Typography,
  TextField,
  IconButton,
  Button,
  Avatar,
  Checkbox,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  CircularProgress,
  InputAdornment,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SearchIcon from "@mui/icons-material/Search";
import GroupsIcon from "@mui/icons-material/Groups";
import { getFollowingUsers, createGroup } from "../../services/api";
import BlankProfileImage from "../../static/profile_blank.png";

interface FollowingUser {
  id: number;
  username: string;
  profile_picture: string;
}

interface CreateGroupDialogProps {
  open: boolean;
  onClose: () => void;
  onGroupCreated: (group: any) => void;
}

const dialogBackdrop = {
  sx: { backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.55)" },
};

const CreateGroupDialog: React.FC<CreateGroupDialogProps> = ({ open, onClose, onGroupCreated }) => {
  const [step, setStep] = useState<"members" | "details">("members");
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<FollowingUser[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep("members");
    setGroupName("");
    setDescription("");
    setSearch("");
    setSelected([]);
    setLoadingUsers(true);
    getFollowingUsers()
      .then((res) => setUsers(res.success ? res.data : []))
      .catch(() => setUsers([]))
      .finally(() => setLoadingUsers(false));
  }, [open]);

  const filtered = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id: number) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handleCreate = async () => {
    if (!groupName.trim()) return;
    setCreating(true);
    try {
      const res = await createGroup(groupName.trim(), description.trim(), selected);
      if (res.success) {
        onGroupCreated(res.data);
        onClose();
      }
    } catch (e) {
      console.error("Failed to create group:", e);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      BackdropProps={dialogBackdrop}
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: "28px",
          backgroundColor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
        },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2.5, pt: 2, pb: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <GroupsIcon sx={{ fontSize: 20, color: "text.secondary" }} />
          <Typography sx={{ fontWeight: 600, fontSize: "0.95rem" }}>
            {step === "members" ? "Add Members" : "Group Details"}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: "text.secondary" }}>
          <CloseRoundedIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      {step === "members" ? (
        <>
          <Box sx={{ px: 2, pb: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search people..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 17, color: "text.disabled" }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "14px",
                  fontSize: "0.85rem",
                  bgcolor: "var(--nav-bg)",
                  boxShadow: "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)",
                  "& fieldset": { border: "none" },
                },
              }}
            />
          </Box>

          <Box sx={{ height: 300, overflowY: "auto" }}>
            {loadingUsers ? (
              <Box sx={{ display: "flex", justifyContent: "center", pt: 4 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <List disablePadding>
                {filtered.map((user) => (
                  <ListItem
                    key={user.id}
                    component="button"
                    onClick={() => toggle(user.id)}
                    sx={{
                      px: 2,
                      py: 0.75,
                      border: "none",
                      cursor: "pointer",
                      bgcolor: "transparent",
                      width: "100%",
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                  >
                    <ListItemAvatar sx={{ minWidth: 44 }}>
                      <Avatar
                        src={user.profile_picture || BlankProfileImage}
                        sx={{ width: 36, height: 36 }}
                      />
                    </ListItemAvatar>
                    <ListItemText
                      primary={user.username}
                      primaryTypographyProps={{ fontSize: "0.875rem", fontWeight: 500 }}
                    />
                    <Checkbox
                      checked={selected.includes(user.id)}
                      size="small"
                      sx={{ color: "text.disabled", "&.Mui-checked": { color: "primary.main" } }}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>

          <Box sx={{ px: 2.5, py: 2, borderTop: "1px solid", borderColor: "divider" }}>
            <Button
              fullWidth
              variant="contained"
              disabled={selected.length === 0}
              onClick={() => setStep("details")}
              sx={{ borderRadius: "14px", textTransform: "none", fontWeight: 600 }}
            >
              Next ({selected.length} selected)
            </Button>
          </Box>
        </>
      ) : (
        <>
          <Box sx={{ px: 2.5, pb: 2, display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              fullWidth
              label="Group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              inputProps={{ maxLength: 100 }}
              size="small"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "14px" } }}
            />
            <TextField
              fullWidth
              label="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              inputProps={{ maxLength: 300 }}
              size="small"
              multiline
              rows={2}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "14px" } }}
            />
            <Typography sx={{ fontSize: "0.78rem", color: "text.disabled" }}>
              {selected.length + 1} member{selected.length !== 0 ? "s" : ""} (including you)
            </Typography>
          </Box>

          <Box sx={{ px: 2.5, pb: 2.5, display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              onClick={() => setStep("members")}
              sx={{ borderRadius: "14px", textTransform: "none", flex: 1 }}
            >
              Back
            </Button>
            <Button
              variant="contained"
              disabled={!groupName.trim() || creating}
              onClick={handleCreate}
              sx={{ borderRadius: "14px", textTransform: "none", fontWeight: 600, flex: 2 }}
            >
              {creating ? <CircularProgress size={18} color="inherit" /> : "Create Group"}
            </Button>
          </Box>
        </>
      )}
    </Dialog>
  );
};

export default CreateGroupDialog;
