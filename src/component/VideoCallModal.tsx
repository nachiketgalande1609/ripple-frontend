import React, { useEffect, useRef, useState } from "react";
import { Box, Modal, IconButton, Button, Stack, styled } from "@mui/material";
import { CallEnd, Mic, MicOff, Videocam, VideocamOff } from "@mui/icons-material";

// Dark theme styling
const darkTheme = {
    background: "#121212",
    text: "#ffffff",
    primary: "#90caf9",
    secondary: "#f48fb1",
};

// Styled components
const VideoContainer = styled(Box)({
    position: "relative",
    width: "100%",
    height: "100%",
    backgroundColor: darkTheme.background,
    borderRadius: "8px",
    overflow: "hidden",
});

const PiPContainer = styled(Box)({
    position: "absolute",
    bottom: "20px",
    right: "20px",
    width: "200px",
    height: "150px",
    backgroundColor: darkTheme.background,
    borderRadius: "8px",
    overflow: "hidden",
    border: `2px solid ${darkTheme.primary}`,
    cursor: "pointer",
});

const ControlBar = styled(Stack)({
    position: "absolute",
    bottom: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: "24px",
    padding: "8px",
});

const StyledIconButton = styled(IconButton)({
    color: darkTheme.text,
    "&:hover": {
        backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
});

const EndCallButton = styled(Button)({
    backgroundColor: "#ff4444",
    color: darkTheme.text,
    borderRadius: "24px",
    padding: "8px 24px",
    "&:hover": {
        backgroundColor: "#cc0000",
    },
});

interface VideoCallModalProps {
    open: boolean;
    onClose: () => void;
    callerId: number;
    receiverId: number;
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    pc: RTCPeerConnection | null;
    handleEndCall: () => void; // Add this line
}

const VideoCallModal: React.FC<VideoCallModalProps> = ({ open, onClose, localStream, remoteStream, handleEndCall }) => {
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOn, setIsVideoOn] = useState(true);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    // Handle local stream
    useEffect(() => {
        if (localStream && localVideoRef.current) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream, open]);

    // Handle remote stream
    useEffect(() => {
        if (remoteStream && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream, open]);

    const toggleMute = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach((track) => {
                track.enabled = !track.enabled;
            });
            setIsMuted((prev) => !prev);
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach((track) => {
                track.enabled = !track.enabled;
            });
            setIsVideoOn((prev) => !prev);
        }
    };

    return (
        <Modal open={open} onClose={onClose}>
            <VideoContainer>
                {/* Remote Video (Main Feed) */}
                <Box
                    sx={{
                        width: "100%",
                        height: "100%",
                        backgroundColor: darkTheme.background,
                    }}
                >
                    <video
                        ref={remoteVideoRef}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            transform: "scaleX(-1)", // Mirror the video if needed
                        }}
                        autoPlay
                        playsInline
                    />
                </Box>

                {/* Local Video (Picture-in-Picture) */}
                <PiPContainer>
                    <video
                        ref={localVideoRef}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            transform: "scaleX(-1)", // Mirror the video if needed
                        }}
                        autoPlay
                        muted
                        playsInline
                    />
                </PiPContainer>

                {/* Control Bar */}
                <ControlBar direction="row" spacing={2}>
                    <StyledIconButton onClick={toggleMute}>{isMuted ? <MicOff /> : <Mic />}</StyledIconButton>
                    <StyledIconButton onClick={toggleVideo}>{isVideoOn ? <Videocam /> : <VideocamOff />}</StyledIconButton>
                    <EndCallButton onClick={handleEndCall}>
                        <CallEnd />
                    </EndCallButton>
                </ControlBar>
            </VideoContainer>
        </Modal>
    );
};

export default VideoCallModal;
