import { useState } from "react";
import { Box, Typography, Avatar, Tooltip, IconButton, Dialog, Button } from "@mui/material";
import { MoreHoriz, DeleteOutlineRounded, CloseRounded, CheckRounded } from "@mui/icons-material";
import { formatDateInUserTz } from "../../utils/utils";
import { votePoll, deletePoll } from "../../services/api";
import BlankProfileImage from "../../static/profile_blank.png";
import { useNavigate } from "react-router-dom";

interface PollOption {
    id: number;
    option_text: string;
    vote_count: number;
}

interface Poll {
    id: number;
    question: string;
    username: string;
    profile_picture: string;
    created_at: string;
    user_id: number;
    options: PollOption[];
    user_voted_option: number | null;
    total_votes: number;
}

interface PollCardProps {
    poll: Poll;
    onDeleted?: (pollId: number) => void;
    borderRadius?: string;
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
}

export default function PollCard({ poll, onDeleted, borderRadius = "14px" }: PollCardProps) {
    const navigate = useNavigate();
    const [options, setOptions] = useState<PollOption[]>(poll.options);
    const [votedOption, setVotedOption] = useState<number | null>(poll.user_voted_option);
    const [totalVotes, setTotalVotes] = useState<number>(poll.total_votes);
    const [voting, setVoting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const currentUser = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")!) : null;
    const isOwner = currentUser?.id && Number(currentUser.id) === Number(poll.user_id);
    const hasVoted = votedOption !== null;

    const handleVote = async (optionId: number) => {
        if (hasVoted || voting) return;
        setVoting(true);
        try {
            await votePoll(poll.id, optionId);
            setOptions((prev) => prev.map((o) => o.id === optionId ? { ...o, vote_count: o.vote_count + 1 } : o));
            setVotedOption(optionId);
            setTotalVotes((prev) => prev + 1);
        } catch (err) {
            console.error("Vote failed:", err);
        } finally {
            setVoting(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await deletePoll(poll.id);
            onDeleted?.(poll.id);
        } catch {
            setDeleting(false);
            setConfirmDelete(false);
        }
    };

    return (
        <>
        <Box
            sx={{
                width: "100%",
                backgroundColor: "background.paper",
                borderRadius,
                overflow: "hidden",
                border: "1px solid",
                borderColor: "divider",
            }}
        >
            {/* ── Header ── */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, pt: 1.75, pb: 0 }}>
                <Box
                    sx={{ display: "flex", alignItems: "center", gap: 1.25, cursor: "pointer", minWidth: 0 }}
                    onClick={() => navigate(`/profile/${poll.user_id}`)}
                >
                    <Avatar
                        src={poll.profile_picture || BlankProfileImage}
                        sx={{ width: 34, height: 34, flexShrink: 0 }}
                        onError={(e) => { (e.target as HTMLImageElement).src = BlankProfileImage; }}
                    />
                    <Box sx={{ minWidth: 0 }}>
                        <Typography noWrap sx={{ fontWeight: 600, fontSize: "0.875rem", color: "text.primary", lineHeight: 1.2 }}>
                            {poll.username}
                        </Typography>
                        <Tooltip title={formatDateInUserTz(poll.created_at)} placement="bottom-start">
                            <Typography sx={{ fontSize: "0.72rem", color: "text.disabled", lineHeight: 1.3, cursor: "default" }}>
                                {timeAgo(poll.created_at)}
                            </Typography>
                        </Tooltip>
                    </Box>
                </Box>

                {isOwner && (
                    <Tooltip title="More options">
                        <IconButton
                            onClick={() => setConfirmDelete(true)}
                            size="small"
                            sx={{ color: "text.disabled", borderRadius: "8px", "&:hover": { color: "text.primary", backgroundColor: "action.hover" } }}
                        >
                            <MoreHoriz sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>
                )}
            </Box>

            {/* ── Question ── */}
            <Box sx={{ px: 2, pt: 1.5, pb: 1.25 }}>
                <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", color: "text.primary", lineHeight: 1.45, letterSpacing: "-0.01em" }}>
                    {poll.question}
                </Typography>
            </Box>

            {/* ── Options ── */}
            <Box sx={{ px: 2, pb: 1.75, display: "flex", flexDirection: "column", gap: 0.875 }}>
                {options.map((opt) => {
                    const pct = totalVotes > 0 ? Math.round((opt.vote_count / totalVotes) * 100) : 0;
                    const isVoted = votedOption === opt.id;
                    const isWinning = hasVoted && opt.vote_count === Math.max(...options.map((o) => o.vote_count));

                    if (!hasVoted) {
                        return (
                            <Box
                                key={opt.id}
                                onClick={() => !voting && handleVote(opt.id)}
                                sx={{
                                    px: 1.75, py: 1,
                                    borderRadius: "10px",
                                    border: "1.5px solid",
                                    borderColor: "divider",
                                    cursor: voting ? "default" : "pointer",
                                    display: "flex", alignItems: "center",
                                    transition: "border-color 0.18s, background 0.18s",
                                    userSelect: "none",
                                    "&:hover": {
                                        borderColor: "#6366f1",
                                        backgroundColor: "rgba(99,102,241,0.04)",
                                    },
                                    opacity: voting ? 0.6 : 1,
                                }}
                            >
                                <Typography sx={{ fontSize: "0.875rem", fontWeight: 500, color: "text.primary" }}>
                                    {opt.option_text}
                                </Typography>
                            </Box>
                        );
                    }

                    return (
                        <Box key={opt.id} sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                            {/* Label row */}
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                                {isVoted && (
                                    <Box sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: "#6366f1", flexShrink: 0 }} />
                                )}
                                <Typography sx={{ flex: 1, fontSize: "0.875rem", fontWeight: isVoted ? 600 : 400, color: isVoted ? "text.primary" : "text.secondary" }}>
                                    {opt.option_text}
                                </Typography>
                                <Typography sx={{ fontSize: "0.8rem", fontWeight: isWinning ? 700 : 500, color: isWinning ? "text.primary" : "text.disabled", flexShrink: 0 }}>
                                    {pct}%
                                </Typography>
                            </Box>
                            {/* Track */}
                            <Box sx={{ height: 4, borderRadius: "99px", backgroundColor: "action.hover", overflow: "hidden" }}>
                                <Box
                                    sx={{
                                        height: "100%",
                                        width: `${pct}%`,
                                        borderRadius: "99px",
                                        backgroundColor: isVoted ? "#6366f1" : (t: any) => t.palette.text.disabled,
                                        opacity: isVoted ? 1 : 0.35,
                                        transition: "width 0.55s cubic-bezier(0.4,0,0.2,1)",
                                    }}
                                />
                            </Box>
                        </Box>
                    );
                })}

                {/* Footer */}
                <Typography sx={{ fontSize: "0.72rem", color: "text.disabled", mt: 0.25 }}>
                    {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
                    {hasVoted && (
                        <Box component="span" sx={{ ml: 0.75, color: "#6366f1", fontWeight: 600 }}>· voted</Box>
                    )}
                </Typography>
            </Box>
        </Box>

        {/* Delete confirm dialog */}
        <Dialog
            open={confirmDelete}
            onClose={() => !deleting && setConfirmDelete(false)}
            maxWidth="xs"
            fullWidth
            sx={{ "& .MuiDialog-paper": { borderRadius: "36px", backgroundColor: "background.paper", border: "1px solid", borderColor: "divider", boxShadow: "0 24px 60px rgba(0,0,0,0.4)", overflow: "hidden", padding: "6px" } }}
            BackdropProps={{ sx: { backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)" } }}
        >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.75, mb: 0.5 }}>
                <Box sx={{ width: 38, height: 38, borderRadius: "50%", backgroundColor: "rgba(211,47,47,0.10)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <DeleteOutlineRounded sx={{ fontSize: "1.2rem", color: "error.main" }} />
                </Box>
                <Box>
                    <Typography sx={{ fontWeight: 600, fontSize: "0.9rem", color: "text.primary", lineHeight: 1.3 }}>Delete this poll?</Typography>
                    <Typography sx={{ fontSize: "0.75rem", color: "text.disabled" }}>This action cannot be undone.</Typography>
                </Box>
            </Box>
            <Box sx={{ "& button": { borderRadius: "0 !important" }, "& button:first-of-type": { borderRadius: "32px 32px 0 0 !important" }, "& button:last-of-type": { borderRadius: "0 0 32px 32px !important", marginBottom: "0 !important" } }}>
                <Button fullWidth onClick={handleDelete} disabled={deleting}
                    sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.4, mb: 0.75, textTransform: "none", justifyContent: "flex-start", fontWeight: 500, fontSize: "0.875rem", color: "error.main", border: "none", backgroundColor: "var(--nav-bg)", boxShadow: "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)", "&:hover": { backgroundColor: "var(--nav-bg)", boxShadow: "inset 3px 3px 10px var(--nav-neo-shadow1), inset -3px -3px 10px var(--nav-neo-shadow2)" } }}>
                    <Box sx={{ width: 34, height: 34, borderRadius: "10px", backgroundColor: "rgba(211,47,47,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <DeleteOutlineRounded sx={{ fontSize: "1.1rem", color: "error.main" }} />
                    </Box>
                    {deleting ? "Deleting…" : "Delete poll"}
                </Button>
                <Button fullWidth onClick={() => setConfirmDelete(false)} disabled={deleting}
                    sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.4, textTransform: "none", justifyContent: "flex-start", fontWeight: 500, fontSize: "0.875rem", color: "text.disabled", border: "none", backgroundColor: "var(--nav-bg)", boxShadow: "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)", "&:hover": { backgroundColor: "var(--nav-bg)", boxShadow: "inset 3px 3px 10px var(--nav-neo-shadow1), inset -3px -3px 10px var(--nav-neo-shadow2)", color: "text.secondary" } }}>
                    <Box sx={{ width: 34, height: 34, borderRadius: "10px", backgroundColor: "action.hover", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <CloseRounded sx={{ fontSize: "1.1rem", color: "text.disabled" }} />
                    </Box>
                    Cancel
                </Button>
            </Box>
        </Dialog>
        </>
    );
}
