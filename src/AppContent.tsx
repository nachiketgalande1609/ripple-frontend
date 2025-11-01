import { useState, useEffect, useRef } from "react";
import { Routes, Route } from "react-router-dom";
import { Box, Button, LinearProgress, Modal, Stack, Typography } from "@mui/material";

import { useGlobalStore } from "./store/store";

import socket from "./services/socket";

import PrivateRoute from "./component/PrivateRoute";
import PublicRoute from "./component/PublicRoute";

import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/profile/ProfilePage";
import NotFoundPage from "./pages/NotFoundPage";
import SearchPage from "./pages/SearchPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Notifications from "./pages/notifications/Notifications";
import SettingsPage from "./pages/SettingsPage";
import { getNotificationsCount } from "./services/api";
import NavDrawer from "./component/navbar/NavDrawer";
import SavedPage from "./pages/SavedPage";
import VideoCallModal from "./component/VideoCallModal";
import Ringtone from "./static/ringtone.mp3";
import HangUpTone from "./static/hangup.mp3";
import VerifyAccount from "./pages/VerifyAccount";
import ResetPassword from "./pages/ResetPassword";
import { useNotifications } from "@toolpad/core/useNotifications";
import Messages from "./pages/Messages/Messages";

const currentUser = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") || "") : {};

if (currentUser && currentUser.id) {
    socket.emit("registerUser", currentUser.id);
}

type User = {
    id: number;
    username: string;
    profile_picture: string;
    isOnline: boolean;
    latest_message: string;
    latest_message_timestamp: string;
    unread_count: number;
};

const AppContent = () => {
    const { user, unreadNotificationsCount, setUnreadNotificationsCount, unreadMessagesCount, setUnreadMessagesCount, postUploading } =
        useGlobalStore();
    const [notificationAlert, setNotificationAlert] = useState<string | null>(null);
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
    const notifications = useNotifications();

    const [isVideoModalOpen, setIsVideoModalOpen] = useState<boolean>(false);
    const [pc, setPc] = useState<RTCPeerConnection | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);

    const [callParticipantId, setCallParticipantId] = useState<number | null>(null);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const hangUpAudioRef = useRef<HTMLAudioElement | null>(null);

    const [audioAllowed, setAudioAllowed] = useState(false);

    const iceServers = {
        iceServers: [
            {
                urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
            },
            {
                urls: "turn:relay1.expressturn.com:3478",
                username: "efBWO11LZUDOHPDC84",
                credential: "y0Da1Uz9asLPxFpC",
            },
        ],
        iceCandidatePoolSize: 10,
    };

    // Add this effect to handle initial user interaction
    useEffect(() => {
        const handleFirstUserInteraction = () => {
            setAudioAllowed(true);
            // Play/pause the hidden video to warm up the audio context
            const video = document.createElement("video");
            video.muted = true;
            video.play().then(() => video.pause());
            window.removeEventListener("click", handleFirstUserInteraction);
        };

        window.addEventListener("click", handleFirstUserInteraction);

        return () => {
            window.removeEventListener("click", handleFirstUserInteraction);
        };
    }, []);

    const [incomingCall, setIncomingCall] = useState<{
        from: number;
        signal: RTCSessionDescriptionInit;
        callerUsername: string;
        callerProfilePicture: string;
    } | null>(null);

    useEffect(() => {
        if (incomingCall && audioAllowed) {
            const playAudio = async () => {
                try {
                    if (audioRef.current) {
                        await audioRef.current.play();
                    }
                } catch (error) {
                    console.error("Audio play failed:", error);
                    notifications.show("Audio play failed. Please try again later.", {
                        severity: "error",
                        autoHideDuration: 3000,
                    });
                }
            };

            playAudio();
        } else if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    }, [incomingCall, audioAllowed]);

    useEffect(() => {
        socket.on("onlineUsers", (data) => {
            setOnlineUsers(data);
        });

        return () => {
            socket.off("onlineUsers");
        };
    }, []);

    // Windows Notifications Permission
    useEffect(() => {
        if (typeof Notification !== "undefined" && Notification.permission !== "granted") {
            Notification.requestPermission();
        }
    }, []);

    useEffect(() => {
        if (!user) return;

        const fetchNotificationCount = async () => {
            try {
                const response = await getNotificationsCount();
                if (response?.success) {
                    setUnreadNotificationsCount(response?.data?.unread_notifications);
                    setUnreadMessagesCount(response?.data?.unread_messages);
                }
            } catch (error) {
                console.error("Error fetching notification count:", error);
                notifications.show("Error fetching notification count. Please try again later.", {
                    severity: "error",
                    autoHideDuration: 3000,
                });
            }
        };

        fetchNotificationCount();
    }, [user]);

    useEffect(() => {
        if (!user) return;

        const handleUnreadCountResponse = (data: { targetUserId: string; unreadCount: number }) => {
            const { targetUserId, unreadCount } = data;
            if (targetUserId === user.id) {
                setUnreadNotificationsCount(unreadCount);
            }
        };

        socket.on("unreadCountResponse", handleUnreadCountResponse);

        return () => {
            socket.off("unreadCountResponse", handleUnreadCountResponse);
        };
    }, [user, setUnreadNotificationsCount]);

    useEffect(() => {
        if (!user) return;

        const handleNotificationAlertResponse = (data: { targetUserId: string; notificationMessage: string }) => {
            if (typeof Notification !== "undefined" && Notification.permission === "granted") {
                new Notification("Link", {
                    body: data.notificationMessage,
                    icon: "https://t4.ftcdn.net/jpg/01/33/48/03/360_F_133480376_PWlsZ1Bdr2SVnTRpb8jCtY59CyEBdoUt.jpg",
                });
            } else {
                console.log("Notification API not supported or permission not granted.");
                // Optional fallback: play a sound, show a modal, light a candle, etc.
            }
        };

        socket.on("notificationAlert", handleNotificationAlertResponse);
        console.log(notificationAlert);

        return () => {
            socket.off("notificationAlert", handleNotificationAlertResponse);
        };
    }, [user, setNotificationAlert]);

    useEffect(() => {
        const handleCallReceived = (data: {
            signal: RTCSessionDescriptionInit;
            from: number;
            callerUsername: string;
            callerProfilePicture: string;
        }) => {
            setIncomingCall(data);
        };

        socket.on("callReceived", handleCallReceived);

        return () => {
            socket.off("callReceived", handleCallReceived);
        };
    }, []);

    useEffect(() => {
        const handleIceCandidate = (data: { candidate: RTCIceCandidateInit }) => {
            if (pc?.remoteDescription) {
                pc.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(console.error);
            } else {
                pendingCandidates.current.push(data.candidate); // Queue for later
            }
        };

        socket.on("iceCandidateReceived", handleIceCandidate);

        return () => {
            socket.off("iceCandidateReceived", handleIceCandidate);
        };
    }, [pc]);

    useEffect(() => {
        socket.on("callAnswered", async (data: { signal: RTCSessionDescriptionInit }) => {
            if (pc) {
                try {
                    await pc.setRemoteDescription(new RTCSessionDescription(data.signal));

                    // Flush pending ICE candidates after setting remote description
                    pendingCandidates.current.forEach((candidate) => {
                        pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.error);
                    });
                    pendingCandidates.current = [];
                } catch (error) {
                    console.error("Failed to set remote description:", error);
                }
            }
        });

        return () => {
            socket.off("callAnswered");
        };
    }, [pc]);

    const handleTrackEvent = (event: RTCTrackEvent) => {
        if (event.streams && event.streams[0]) {
            const newRemoteStream = new MediaStream();
            event.streams[0].getTracks().forEach((track) => {
                newRemoteStream.addTrack(track);
            });
            setRemoteStream(newRemoteStream);
        }
    };

    const handleAcceptCall = async () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        if (incomingCall) {
            setCallParticipantId(incomingCall.from);

            setIsVideoModalOpen(true);
            const newPc = new RTCPeerConnection(iceServers);
            setPc(newPc);

            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                console.log("Callee got media stream:", stream.getTracks());

                setLocalStream(stream); // setState is async; localStream won't update immediately

                stream.getTracks().forEach((track) => {
                    newPc.addTrack(track, stream);
                });
            } catch (err) {
                console.error("Error getting user media on callee:", err);
            }

            newPc.ontrack = handleTrackEvent;

            newPc.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit("iceCandidate", { to: incomingCall.from, candidate: event.candidate });
                }
            };

            newPc
                .setRemoteDescription(new RTCSessionDescription(incomingCall.signal))
                .then(() => newPc.createAnswer())
                .then((answer) => newPc.setLocalDescription(answer))
                .then(() => {
                    socket.emit("answerCall", { to: incomingCall.from, signal: newPc.localDescription });
                })
                .catch(console.error);

            setIncomingCall(null);
        }
    };

    const handleRejectCall = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        if (incomingCall) {
            socket.emit("endCall", { to: incomingCall.from });
        }
        setIncomingCall(null);
    };

    const handleVideoCall = async () => {
        if (!selectedUser) return;

        setCallParticipantId(selectedUser.id);
        setIsVideoModalOpen(true);

        const newPc = new RTCPeerConnection(iceServers);
        setPc(newPc);

        // Debug logs
        newPc.oniceconnectionstatechange = () => console.log("ICE Connection State:", newPc.iceConnectionState);
        newPc.onsignalingstatechange = () => console.log("Signaling State:", newPc.signalingState);
        newPc.onicegatheringstatechange = () => console.log("ICE Gathering State:", newPc.iceGatheringState);

        // Track remote stream
        newPc.ontrack = (event) => {
            setRemoteStream(event.streams[0]);
        };

        // ICE candidate handler
        newPc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit("iceCandidate", {
                    to: selectedUser.id,
                    candidate: event.candidate,
                });
            }
        };

        try {
            // 🔑 Wait for media before proceeding
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

            setLocalStream(stream);
            stream.getTracks().forEach((track) => newPc.addTrack(track, stream));

            // Now safely create offer
            const offer = await newPc.createOffer();

            await newPc.setLocalDescription(offer);

            // Send offer to the callee
            socket.emit("callUser", {
                from: currentUser.id,
                to: selectedUser.id,
                signal: newPc.localDescription,
                callerUsername: currentUser.username,
                callerProfilePicture: currentUser.profile_picture_url,
            });
        } catch (err) {
            console.error("Error in handleVideoCall:", err);
        }
    };

    const handleEndCall = () => {
        if (hangUpAudioRef.current) {
            hangUpAudioRef.current.play().catch(console.error);
        }
        if (callParticipantId) {
            socket.emit("endCall", { to: callParticipantId });
            // Reset all media tracks
            if (localStream) {
                localStream.getTracks().forEach((track) => {
                    track.stop();
                    localStream.removeTrack(track);
                });
            }
            if (remoteStream) {
                remoteStream.getTracks().forEach((track) => {
                    track.stop();
                    remoteStream.removeTrack(track);
                });
            }

            if (pc) pc.close();
            setPc(null);
            setLocalStream(null);
            setRemoteStream(null);
            setCallParticipantId(null);
        }
        setIsVideoModalOpen(false);
    };

    // Add this useEffect to listen for the endCall event
    useEffect(() => {
        const handleEndCallReceived = () => {
            if (hangUpAudioRef.current) {
                hangUpAudioRef.current.play().catch(console.error);
            }

            setIsVideoModalOpen(false);
            setCallParticipantId(null);

            if (pc) {
                pc.close();
                setPc(null);
            }
            if (localStream) {
                localStream.getTracks().forEach((track) => track.stop());
                setLocalStream(null);
            }
            setRemoteStream(null);
        };

        socket.on("endCall", handleEndCallReceived);

        return () => {
            socket.off("endCall", handleEndCallReceived);
        };
    }, [pc, localStream]);

    return (
        <Box sx={{ display: "flex" }}>
            <NavDrawer
                unreadMessagesCount={unreadMessagesCount}
                unreadNotificationsCount={unreadNotificationsCount}
                setUnreadMessagesCount={setUnreadMessagesCount}
            />
            {/* Main content */}
            <Box component="main" sx={{ flexGrow: 1, padding: 0, margin: 0, width: "100%" }}>
                <Routes>
                    <Route
                        path="/"
                        element={
                            <PrivateRoute>
                                <HomePage />
                            </PrivateRoute>
                        }
                    />
                    <Route path="/profile/:userId" element={<ProfilePage />} />
                    <Route
                        path="/messages/:userId?"
                        element={
                            <PrivateRoute>
                                <Messages
                                    onlineUsers={onlineUsers}
                                    selectedUser={selectedUser}
                                    setSelectedUser={setSelectedUser}
                                    handleVideoCall={handleVideoCall}
                                />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/notifications"
                        element={
                            <PrivateRoute>
                                <Notifications />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/search"
                        element={
                            <PrivateRoute>
                                <SearchPage />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/saved"
                        element={
                            <PrivateRoute>
                                <SavedPage />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/login"
                        element={
                            <PublicRoute>
                                <LoginPage />
                            </PublicRoute>
                        }
                    />
                    <Route
                        path="/register"
                        element={
                            <PublicRoute>
                                <RegisterPage />
                            </PublicRoute>
                        }
                    />
                    <Route
                        path="/settings"
                        element={
                            <PrivateRoute>
                                <SettingsPage />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/verify-account"
                        element={
                            <PublicRoute>
                                <VerifyAccount />
                            </PublicRoute>
                        }
                    />
                    <Route
                        path="/reset-password"
                        element={
                            <PublicRoute>
                                <ResetPassword />
                            </PublicRoute>
                        }
                    />
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </Box>
            {postUploading && (
                <Box
                    sx={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100vw",
                        zIndex: 1000,
                    }}
                >
                    <LinearProgress
                        sx={{
                            width: "100%",
                            height: "3px",
                            background: "linear-gradient(90deg, #7a60ff, #ff8800)",
                            "& .MuiLinearProgress-bar": {
                                background: "linear-gradient(90deg, #7a60ff, #ff8800)",
                            },
                        }}
                    />
                </Box>
            )}

            {/* Incoming Call Modal */}
            <Modal
                open={!!incomingCall}
                onClose={handleRejectCall}
                BackdropProps={{
                    sx: {
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                        backdropFilter: "blur(5px)",
                    },
                }}
            >
                <Box
                    sx={{
                        position: "fixed",
                        bottom: 16,
                        right: 16,
                        backgroundColor: "#ffffff",
                        boxShadow: 24,
                        p: 4,
                        textAlign: "center",
                        borderRadius: "20px",
                        outline: "none",
                    }}
                >
                    <img
                        src={incomingCall?.callerProfilePicture || "https://static-00.iconduck.com/assets.00/profile-major-icon-512x512-xosjbbdq.png"}
                        alt="Caller Profile"
                        style={{
                            width: 100,
                            height: 100,
                            borderRadius: "50%",
                            objectFit: "cover",
                            marginBottom: "16px",
                        }}
                    />
                    <Typography sx={{ color: "#000000" }}>{incomingCall?.callerUsername}</Typography>
                    <Typography sx={{ fontSize: "0.9rem", color: "#555555" }}>is calling you</Typography>
                    <Stack direction="row" spacing={1.5} justifyContent="center" sx={{ marginTop: 2 }}>
                        <Button variant="contained" sx={{ borderRadius: "15px", width: "150px" }} color="success" onClick={handleAcceptCall}>
                            Accept
                        </Button>
                        <Button variant="contained" sx={{ borderRadius: "15px", width: "150px" }} color="error" onClick={handleRejectCall}>
                            Reject
                        </Button>
                    </Stack>
                </Box>
            </Modal>

            <VideoCallModal
                open={isVideoModalOpen}
                onClose={() => setIsVideoModalOpen(false)}
                callerId={currentUser.id}
                receiverId={callParticipantId || 0}
                localStream={localStream}
                remoteStream={remoteStream}
                pc={pc}
                handleEndCall={handleEndCall}
            />

            <audio ref={audioRef} loop onError={(e) => console.error("Audio error:", e)}>
                <source src={Ringtone} type="audio/mpeg" />
            </audio>
            <audio ref={hangUpAudioRef}>
                <source src={HangUpTone} type="audio/mpeg" />
            </audio>
            <video muted style={{ display: "none" }} />
        </Box>
    );
};

export default AppContent;
