import { useState } from "react";
import { Box, Typography, Avatar, Button, useMediaQuery, useTheme, Tooltip, IconButton, Dialog } from "@mui/material";
import { PollOutlined, MoreHoriz, DeleteOutlineRounded, CloseRounded } from "@mui/icons-material";
import { formatDateInUserTz } from "../../utils/utils";
import { votePoll, deletePoll } from "../../services/api";
import BlankProfileImage from "../../static/profile_blank.png";

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
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
}

export default function PollCard({ poll, onDeleted }: PollCardProps) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const [options, setOptions] = useState<PollOption[]>(poll.options);
    const [votedOption, setVotedOption] = useState<number | null>(poll.user_voted_option);
    const [totalVotes, setTotalVotes] = useState<number>(poll.total_votes);
    const [voting, setVoting] = useState(false);
const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const currentUser = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")!) : null;
    const isOwner = currentUser?.id && Number(currentUser.id) === Number(poll.user_id);

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

    const hasVoted = votedOption !== null;

    const handleVote = async (optionId: number) => {
        if (hasVoted || voting) return;
        setVoting(true);
        try {
            await votePoll(poll.id, optionId);
            setOptions((prev) =>
                prev.map((o) => (o.id === optionId ? { ...o, vote_count: o.vote_count + 1 } : o))
            );
            setVotedOption(optionId);
            setTotalVotes((prev) => prev + 1);
        } catch (err) {
            console.error("Vote failed:", err);
        } finally {
            setVoting(false);
        }
    };

    return (
        <>
        <Box
            sx={{
                width: "100%",
                backgroundColor: "background.paper",
                borderRadius: isMobile ? "0px" : "14px",
                overflow: "hidden",
                border: "1px solid",
                borderColor: "divider",
                mb: 2,
            }}
        >
            <Box sx={{ p: 2.5 }}>
            {/* Author row */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                <Avatar
                    src={poll.profile_picture || BlankProfileImage}
                    sx={{ width: 38, height: 38, border: "2px solid", borderColor: "divider" }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
                        <Typography sx={{ fontWeight: 700, fontSize: "0.88rem", color: "text.primary", lineHeight: 1.2 }}>
                            {poll.username}
                        </Typography>
                        <Typography sx={{ fontSize: "0.8rem", color: "text.disabled", lineHeight: 1.2 }}>
                            created a poll
                        </Typography>
                    </Box>
                    <Tooltip title={formatDateInUserTz(poll.created_at)} placement="bottom-start">
                        <Typography sx={{ fontSize: "0.72rem", color: "text.disabled", mt: 0.2, cursor: "default" }}>
                            {timeAgo(poll.created_at)}
                        </Typography>
                    </Tooltip>
                </Box>
                {isOwner ? (
                    <IconButton size="small" onClick={() => setConfirmDelete(true)} sx={{ color: "text.disabled", p: 0.5 }}>
                        <MoreHoriz sx={{ fontSize: "1.2rem" }} />
                    </IconButton>
                ) : (
                    <PollOutlined sx={{ color: "#6366f1", fontSize: "1.25rem", flexShrink: 0 }} />
                )}
            </Box>

            {/* Question */}
            <Typography
                sx={{
                    fontWeight: 700,
                    fontSize: "1rem",
                    color: "text.primary",
                    mb: 2,
                    lineHeight: 1.4,
                }}
            >
                {poll.question}
            </Typography>

            {/* Options */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                {options.map((opt) => {
                    const pct = totalVotes > 0 ? Math.round((opt.vote_count / totalVotes) * 100) : 0;
                    const isVoted = votedOption === opt.id;

                    if (!hasVoted) {
                        // Pre-vote: plain clickable button
                        return (
                            <Button
                                key={opt.id}
                                fullWidth
                                onClick={() => handleVote(opt.id)}
                                disabled={voting}
                                sx={{
                                    textTransform: "none",
                                    borderRadius: "12px",
                                    border: "none",
                                    backgroundColor: (t: any) => t.palette.action.hover,
                                    boxShadow: "none",
                                    color: "text.primary",
                                    fontWeight: 500,
                                    fontSize: "0.88rem",
                                    py: 1,
                                    justifyContent: "flex-start",
                                    px: 2,
                                    transition: "all 0.2s ease",
                                    "&:hover": {
                                        backgroundColor: "rgba(99,102,241,0.08)",
                                        color: "#6366f1",
                                    },
                                    "&:disabled": { opacity: 0.6 },
                                }}
                            >
                                {opt.option_text}
                            </Button>
                        );
                    }

                    // Post-vote: bar with percentage
                    return (
                        <Box
                            key={opt.id}
                            sx={{
                                borderRadius: "12px",
                                border: isVoted ? "1px solid #6366f1" : "none",
                                backgroundColor: (t: any) => t.palette.action.hover,
                                overflow: "hidden",
                                position: "relative",
                                px: 2,
                                py: 1,
                                minHeight: 40,
                                display: "flex",
                                alignItems: "center",
                            }}
                        >
                            {/* Fill bar */}
                            <Box
                                sx={{
                                    position: "absolute",
                                    left: 0,
                                    top: 0,
                                    bottom: 0,
                                    width: `${pct}%`,
                                    backgroundColor: isVoted ? "rgba(99,102,241,0.18)" : "rgba(100,116,139,0.1)",
                                    borderRadius: "12px",
                                    transition: "width 0.5s ease",
                                }}
                            />
                            {/* Label row */}
                            <Box sx={{ position: "relative", display: "flex", alignItems: "center", width: "100%", gap: 1 }}>
                                <Typography
                                    sx={{
                                        flex: 1,
                                        fontWeight: isVoted ? 700 : 500,
                                        fontSize: "0.88rem",
                                        color: isVoted ? "#6366f1" : "text.primary",
                                    }}
                                >
                                    {opt.option_text}
                                </Typography>
                                <Typography sx={{ fontSize: "0.78rem", color: "text.secondary", fontWeight: 600, flexShrink: 0 }}>
                                    {pct}%
                                </Typography>
                                <Typography sx={{ fontSize: "0.72rem", color: "text.disabled", flexShrink: 0 }}>
                                    ({opt.vote_count})
                                </Typography>
                            </Box>
                        </Box>
                    );
                })}
            </Box>

            {/* Footer */}
            <Typography sx={{ fontSize: "0.72rem", color: "text.disabled", mt: 1.5 }}>
                {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
                {hasVoted && (
                    <Box component="span" sx={{ ml: 1, color: "#6366f1", fontWeight: 600 }}>
                        · You voted
                    </Box>
                )}
            </Typography>
            </Box>{/* end padding box */}
        </Box>

        {/* Delete confirm dialog */}
        <Dialog
            open={confirmDelete}
            onClose={() => !deleting && setConfirmDelete(false)}
            maxWidth="xs"
            fullWidth
            sx={{ "& .MuiDialog-paper": { borderRadius: "36px", backgroundColor: "background.paper", border: "1px solid", borderColor: "divider", boxShadow: "0 24px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(100,116,139,0.08)", overflow: "hidden", padding: "6px" } }}
            BackdropProps={{ sx: { backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)" } }}
        >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.75, mb: 0.5 }}>
                <Box sx={{ width: 38, height: 38, borderRadius: "50%", backgroundColor: "rgba(211,47,47,0.10)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <DeleteOutlineRounded sx={{ fontSize: "1.2rem", color: "error.main" }} />
                </Box>
                <Box>
                    <Box sx={{ fontWeight: 600, fontSize: "0.9rem", color: "text.primary", lineHeight: 1.3 }}>
                        Delete this poll?
                    </Box>
                    <Box sx={{ fontSize: "0.75rem", color: "text.disabled" }}>
                        This action cannot be undone.
                    </Box>
                </Box>
            </Box>
            <Box sx={{ "& button": { borderRadius: "0 !important" }, "& button:first-of-type": { borderRadius: "32px 32px 0 0 !important" }, "& button:last-of-type": { borderRadius: "0 0 32px 32px !important", marginBottom: "0 !important" } }}>
                <Button fullWidth onClick={handleDelete} disabled={deleting}
                    sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.4, borderRadius: "18px", textTransform: "none", justifyContent: "flex-start", fontWeight: 500, fontSize: "0.875rem", color: "error.main", border: "none", backgroundColor: "var(--nav-bg)", boxShadow: "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)", transition: "box-shadow 0.35s cubic-bezier(0.4,0,0.2,1)", mb: 0.75, "&:hover": { backgroundColor: "var(--nav-bg)", boxShadow: "inset 3px 3px 10px var(--nav-neo-shadow1), inset -3px -3px 10px var(--nav-neo-shadow2)", color: "error.light" } }}>
                    <Box sx={{ width: 34, height: 34, borderRadius: "10px", backgroundColor: "rgba(211,47,47,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "error.main", flexShrink: 0 }}>
                        <DeleteOutlineRounded sx={{ fontSize: "1.1rem" }} />
                    </Box>
                    {deleting ? "Deleting…" : "Delete poll"}
                </Button>
                <Button fullWidth onClick={() => setConfirmDelete(false)} disabled={deleting}
                    sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.4, borderRadius: "18px", textTransform: "none", justifyContent: "flex-start", fontWeight: 500, fontSize: "0.875rem", color: "text.disabled", border: "none", backgroundColor: "var(--nav-bg)", boxShadow: "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)", transition: "box-shadow 0.35s cubic-bezier(0.4,0,0.2,1)", mb: 0.75, "&:hover": { backgroundColor: "var(--nav-bg)", boxShadow: "inset 3px 3px 10px var(--nav-neo-shadow1), inset -3px -3px 10px var(--nav-neo-shadow2)", color: "text.secondary" } }}>
                    <Box sx={{ width: 34, height: 34, borderRadius: "10px", backgroundColor: "action.hover", display: "flex", alignItems: "center", justifyContent: "center", color: "text.disabled", flexShrink: 0 }}>
                        <CloseRounded sx={{ fontSize: "1.1rem" }} />
                    </Box>
                    Cancel
                </Button>
            </Box>
        </Dialog>
        </>
    );
}
