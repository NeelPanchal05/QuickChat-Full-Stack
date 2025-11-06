import { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import toast from "react-hot-toast";

const iceServers = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export const useWebRTC = () => {
  const { socket } = useContext(AuthContext);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [incomingCallFrom, setIncomingCallFrom] = useState(null);
  const [isMuted, setIsMuted] = useState(false);

  const peerConnection = useRef(null);
  const localStream = useRef(null);
  const remoteStream = useRef(new MediaStream());
  const pendingIceCandidates = useRef([]);

  // Initialize peer connection
  const createPeerConnection = () => {
    const pc = new RTCPeerConnection(iceServers);

    pc.onicecandidate = (event) => {
      if (event.candidate && incomingCallFrom) {
        socket.emit("call:ice-candidate", {
          to: incomingCallFrom._id,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.current.addTrack(track);
      });
    };

    pc.oniceconnectionstatechange = () => {
      if (
        pc.iceConnectionState === "disconnected" ||
        pc.iceConnectionState === "failed" ||
        pc.iceConnectionState === "closed"
      ) {
        endCall();
      }
    };

    return pc;
  };

  // Start call
  const startCall = async (user) => {
    try {
      localStream.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      peerConnection.current = createPeerConnection();

      localStream.current.getTracks().forEach((track) => {
        peerConnection.current.addTrack(track, localStream.current);
      });

      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);

      socket.emit("call:initiate", {
        to: user._id,
        offer,
        from: user,
      });

      setIncomingCallFrom(user);
      setIsCallActive(true);
      toast.success("Calling...");
    } catch (error) {
      console.error("Error starting call:", error);
      toast.error("Failed to start call. Please check microphone permissions.");
    }
  };

  // Answer call
  const answerCall = async () => {
    try {
      localStream.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      localStream.current.getTracks().forEach((track) => {
        peerConnection.current.addTrack(track, localStream.current);
      });

      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);

      socket.emit("call:answer", {
        to: incomingCallFrom._id,
        answer,
      });

      // Add any pending ICE candidates
      pendingIceCandidates.current.forEach(async (candidate) => {
        await peerConnection.current.addIceCandidate(candidate);
      });
      pendingIceCandidates.current = [];

      setIsIncomingCall(false);
      setIsCallActive(true);
    } catch (error) {
      console.error("Error answering call:", error);
      toast.error("Failed to answer call");
    }
  };

  // Reject call
  const rejectCall = () => {
    socket.emit("call:reject", { to: incomingCallFrom._id });
    setIsIncomingCall(false);
    setIncomingCallFrom(null);
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
  };

  // End call
  const endCall = () => {
    if (incomingCallFrom) {
      socket.emit("call:end", { to: incomingCallFrom._id });
    }

    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => track.stop());
      localStream.current = null;
    }

    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    remoteStream.current = new MediaStream();
    setIsCallActive(false);
    setIsIncomingCall(false);
    setIncomingCallFrom(null);
    setIsMuted(false);
    toast.success("Call ended");
  };

  // Toggle mute
  const toggleMute = () => {
    if (localStream.current) {
      const audioTrack = localStream.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on("call:incoming", async ({ from, offer }) => {
      setIncomingCallFrom(from);
      setIsIncomingCall(true);

      peerConnection.current = createPeerConnection();
      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(offer)
      );
    });

    socket.on("call:answered", async ({ answer }) => {
      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
      toast.success("Call connected");
    });

    socket.on("call:ice-candidate", async ({ candidate }) => {
      if (peerConnection.current?.remoteDescription) {
        await peerConnection.current.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      } else {
        pendingIceCandidates.current.push(new RTCIceCandidate(candidate));
      }
    });

    socket.on("call:rejected", () => {
      toast.error("Call rejected");
      endCall();
    });

    socket.on("call:ended", () => {
      endCall();
    });

    return () => {
      socket.off("call:incoming");
      socket.off("call:answered");
      socket.off("call:ice-candidate");
      socket.off("call:rejected");
      socket.off("call:ended");
    };
  }, [socket]);

  return {
    startCall,
    answerCall,
    rejectCall,
    endCall,
    toggleMute,
    isCallActive,
    isIncomingCall,
    incomingCallFrom,
    isMuted,
    remoteStream: remoteStream.current,
  };
};
