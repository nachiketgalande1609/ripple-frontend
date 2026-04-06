import { Dialog, Box, Button, useTheme } from "@mui/material";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

interface MessageOptionsDialogProps {
    open: boolean;
    onClose: () => void;
    onDelete: () => void;
    onInfo: () => void;
}

const dialogBackdrop = {
    sx: { backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.6)" },
};

function DialogIconWrap({ children, danger = false, muted = false }: { children: React.ReactNode; danger?: boolean; muted?: boolean }) {
    const theme = useTheme();
    return (
        <Box
            sx={{
                width: 34,
                height: 34,
                borderRadius: "10px",
                backgroundColor: danger ? `${theme.palette.error.main}14` : theme.palette.action.hover,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: danger ? theme.palette.error.light : muted ? theme.palette.text.disabled : theme.palette.text.secondary,
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
    const theme = useTheme();
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
                color: danger ? theme.palette.error.light : muted ? theme.palette.text.disabled : theme.palette.text.secondary,
                transition: "all 0.2s ease",
                "&:hover": {
                    backgroundColor: danger ? `${theme.palette.error.main}1a` : muted ? theme.palette.action.hover : "rgba(124,92,252,0.12)",
                    color: danger ? theme.palette.error.light : muted ? theme.palette.text.secondary : theme.palette.text.primary,
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
    return <Box sx={{ height: "1px", backgroundColor: (t) => t.palette.divider, mx: 1, my: 0.5 }} />;
}

const MessageOptionsDialog = ({ open, onClose, onDelete, onInfo }: MessageOptionsDialogProps) => {
    const theme = useTheme();

    const dialogPaperSx = {
        borderRadius: "20px",
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
        color: theme.palette.text.primary,
        overflow: "hidden",
        padding: "6px",
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" BackdropProps={dialogBackdrop} sx={{ "& .MuiDialog-paper": dialogPaperSx }}>
            <DialogButton icon={<DeleteRoundedIcon sx={{ fontSize: "1.1rem" }} />} label="Delete Message" onClick={onDelete} danger />
            <DialogButton icon={<InfoRoundedIcon sx={{ fontSize: "1.1rem" }} />} label="Message Info" onClick={onInfo} />
            <DialogDivider />
            <DialogButton icon={<CloseRoundedIcon sx={{ fontSize: "1.1rem" }} />} label="Cancel" onClick={onClose} muted />
        </Dialog>
    );
};

export default MessageOptionsDialog;
