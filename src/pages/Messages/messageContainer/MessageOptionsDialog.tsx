import { Dialog, Box, Button } from "@mui/material";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

interface MessageOptionsDialogProps {
  open: boolean;
  onClose: () => void;
  onDelete: () => void;
  onInfo: () => void;
}

/* ─── Shared dialog styles ──────────────────────────────────────── */
const dialogBackdrop = {
  sx: { backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.6)" },
};

const dialogPaperSx = {
  borderRadius: "20px",
  background: "linear-gradient(160deg, #13131c 0%, #0e0e16 100%)",
  border: "1px solid rgba(255,255,255,0.07)",
  boxShadow: "0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(124,92,252,0.08)",
  color: "white",
  overflow: "hidden",
  padding: "6px",
};

function DialogIconWrap({
  children,
  danger = false,
  muted = false,
}: {
  children: React.ReactNode;
  danger?: boolean;
  muted?: boolean;
}) {
  return (
    <Box
      sx={{
        width: 34,
        height: 34,
        borderRadius: "10px",
        background: danger
          ? "rgba(255,59,48,0.08)"
          : muted
            ? "rgba(255,255,255,0.04)"
            : "rgba(255,255,255,0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: danger
          ? "rgba(255,100,100,0.6)"
          : muted
            ? "rgba(255,255,255,0.25)"
            : "rgba(255,255,255,0.5)",
        transition: "all 0.2s ease",
        flexShrink: 0,
      }}
    >
      {children}
    </Box>
  );
}

function DialogButton({
  icon,
  label,
  onClick,
  danger = false,
  muted = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
  muted?: boolean;
}) {
  return (
    <Button
      fullWidth
      onClick={onClick}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        px: 2,
        py: 1.4,
        borderRadius: "12px",
        textTransform: "none",
        justifyContent: "flex-start",
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 500,
        fontSize: "0.875rem",
        color: danger
          ? "rgba(255,100,100,0.85)"
          : muted
            ? "rgba(255,255,255,0.3)"
            : "rgba(255,255,255,0.8)",
        transition: "all 0.2s ease",
        "&:hover": {
          background: danger
            ? "rgba(255,59,48,0.1)"
            : muted
              ? "rgba(255,255,255,0.04)"
              : "rgba(124,92,252,0.12)",
          color: danger ? "#ff6b6b" : muted ? "rgba(255,255,255,0.55)" : "#fff",
        },
      }}
    >
      <DialogIconWrap danger={danger} muted={muted}>
        {icon}
      </DialogIconWrap>
      {label}
    </Button>
  );
}

function DialogDivider() {
  return (
    <Box
      sx={{
        height: "1px",
        background:
          "linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)",
        mx: 1,
        my: 0.5,
      }}
    />
  );
}

const MessageOptionsDialog = ({
  open,
  onClose,
  onDelete,
  onInfo,
}: MessageOptionsDialogProps) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      BackdropProps={dialogBackdrop}
      sx={{ "& .MuiDialog-paper": dialogPaperSx }}
    >
      <DialogButton
        icon={<DeleteRoundedIcon sx={{ fontSize: "1.1rem" }} />}
        label="Delete Message"
        onClick={onDelete}
        danger
      />
      <DialogButton
        icon={<InfoRoundedIcon sx={{ fontSize: "1.1rem" }} />}
        label="Message Info"
        onClick={onInfo}
      />

      <DialogDivider />

      <DialogButton
        icon={<CloseRoundedIcon sx={{ fontSize: "1.1rem" }} />}
        label="Cancel"
        onClick={onClose}
        muted
      />
    </Dialog>
  );
};

export default MessageOptionsDialog;