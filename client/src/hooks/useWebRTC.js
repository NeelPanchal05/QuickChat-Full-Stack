import { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { ChatContext } from "../../context/ChatContext";

const iceServers = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" }, // Added more STUN servers for reliability
  ],
};

export const useWebRTC = () => {
  const { socket, authUser } = useContext(AuthContext);
  const { selectedUser } = useContext(ChatContext);

  const [isCallActive, setIsCallActive] = useState(false);
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [incomingCallFrom, setIncomingCallFrom] = useState(null);
  const [isMuted, setIsMuted] = useState(false);

  const peerConnection = useRef(null);
  const localStream = useRef(null);
  const remoteStream = useRef(new MediaStream());
  const pendingIceCandidates = useRef([]);

  // CRITICAL IMPROVEMENT: Ref to store the ID of the remote user for signaling ICE candidates
  const remoteId = useRef(null);

  // Function to clean up the call state
  const resetCallState = () => {
    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => track.stop());
      localStream.current = null;
    }

    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    // Create a new stream object to force re-render in VoiceCall component
    remoteStream.current = new MediaStream();
    setIsCallActive(false);
    setIsIncomingCall(false);
    setIncomingCallFrom(null);
    remoteId.current = null; // Reset remote ID
    setIsMuted(false);
  };

  // Initialize peer connection
  const createPeerConnection = (peerId) => {
    // Takes the remote peer's ID
    const pc = new RTCPeerConnection(iceServers);
    remoteId.current = peerId; // Store the peer ID immediately

    pc.onicecandidate = (event) => {
      // Use the stored remoteId for signaling
      if (event.candidate && remoteId.current) {
        socket.emit("call:ice-candidate", {
          to: remoteId.current,
          candidate: event.candidate,
        });
      }
    };

    // CRITICAL FIX: The event.track will already have the stream attached (event.streams[0])
    pc.ontrack = (event) => {
      // Add only new tracks to the remote stream
      if (event.track.kind === "audio") {
        // Only handle audio tracks for voice call
        remoteStream.current.addTrack(event.track);
      }
    };

    // This listener helps automate SDP negotiation changes after initial connection
    pc.onnegotiationneeded = async () => {
      if (pc.signalingState !== "stable" || !isCallActive) return;

      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit("call:initiate", {
          to: remoteId.current,
          offer,
          from: authUser, // Correctly send the local user data
        });
      } catch (error) {
        console.error("Error creating offer on negotiation needed:", error);
      }
    };

    pc.oniceconnectionstatechange = () => {
      // Use this state to handle unexpected drops more reliably
      if (
        pc.iceConnectionState === "disconnected" ||
        pc.iceConnectionState === "failed" ||
        pc.iceConnectionState === "closed"
      ) {
        toast.error("Call connection lost.");
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
        video: false, // Voice call only
      });

      // Pass the remote user's ID
      peerConnection.current = createPeerConnection(user._id);

      // Add local track to trigger ICE candidate and negotiation
      localStream.current.getTracks().forEach((track) => {
        peerConnection.current.addTrack(track, localStream.current);
      });

      // Manually create the initial offer
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);

      socket.emit("call:initiate", {
        to: user._id,
        offer,
        from: authUser, // CRITICAL FIX: Send the currently logged in user as the caller
      });

      // Set state to manage UI flow
      setIncomingCallFrom(user); // Set the remote user details for display
      setIsCallActive(true);
      toast.success("Calling...");
    } catch (error) {
      console.error("Error starting call:", error);
      toast.error(
        "Failed to start call. Please check microphone permissions and try again."
      );
      resetCallState();
    }
  };

  // Answer call
  const answerCall = async () => {
    try {
      if (!peerConnection.current)
        return toast.error("No active call to answer.");

      localStream.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      // Add local track immediately
      localStream.current.getTracks().forEach((track) => {
        peerConnection.current.addTrack(track, localStream.current);
      });

      // Generate answer
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);

      // Send answer to caller
      socket.emit("call:answer", {
        to: incomingCallFrom._id, // Send to the caller
        answer,
      });

      // Process pending ICE candidates now that local and remote descriptions are set
      pendingIceCandidates.current.forEach(async (candidate) => {
        await peerConnection.current.addIceCandidate(candidate);
      });
      pendingIceCandidates.current = [];

      setIsIncomingCall(false);
      setIsCallActive(true);
      toast.success("Call connected");
    } catch (error) {
      console.error("Error answering call:", error);
      toast.error("Failed to answer call");
      resetCallState();
    }
  };

  // Reject call
  const rejectCall = () => {
    if (incomingCallFrom) {
      socket.emit("call:reject", { to: incomingCallFrom._id });
    }
    toast.error("Call rejected");
    resetCallState();
  };

  // End call
  const endCall = () => {
    // Determine who to notify based on who the peer is
    const peerToNotify = isCallActive
      ? remoteId.current
      : incomingCallFrom?._id;

    if (peerToNotify) {
      socket.emit("call:end", { to: peerToNotify });
    }
    toast.success("Call ended");
    resetCallState();
  };

  // Toggle mute
  const toggleMute = () => {
    if (localStream.current) {
      const audioTrack = localStream.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
        toast.success(audioTrack.enabled ? "Unmuted" : "Muted");
      }
    }
  };

  // Socket event listeners
  useEffect(() => {
    if (!socket || !authUser) return;

    // Listener for incoming call
    socket.on("call:incoming", async ({ from, offer }) => {
      // Prevent answering if already in an active call
      if (isCallActive || isIncomingCall) {
        socket.emit("call:reject", { to: from._id });
        return;
      }

      setIncomingCallFrom(from);
      setIsIncomingCall(true);

      // CRITICAL FIX: Create peer connection and set remote ID BEFORE setting remote description
      peerConnection.current = createPeerConnection(from._id);

      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(offer)
      );
    });

    // Listener for call answered
    socket.on("call:answered", async ({ answer }) => {
      if (!peerConnection.current) return;
      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(answer)
      );

      // Process pending ICE candidates for the caller now that remote description is set
      pendingIceCandidates.current.forEach(async (candidate) => {
        await peerConnection.current.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      });
      pendingIceCandidates.current = [];

      // Only mark active here if it was previously in 'calling' state
      if (!isCallActive) {
        setIsCallActive(true);
        toast.success("Call connected");
      }
    });

    // Listener for ICE candidates
    socket.on("call:ice-candidate", async ({ candidate }) => {
      if (peerConnection.current) {
        // Wait for remote description to be set before adding candidate
        if (peerConnection.current.remoteDescription) {
          try {
            await peerConnection.current.addIceCandidate(
              new RTCIceCandidate(candidate)
            );
          } catch (e) {
            console.warn("Error adding received ICE candidate:", e);
          }
        } else {
          pendingIceCandidates.current.push(new RTCIceCandidate(candidate));
        }
      }
    });

    // Listener for call rejected
    socket.on("call:rejected", () => {
      toast.error("Call rejected");
      resetCallState();
    });

    // Listener for call ended
    socket.on("call:ended", () => {
      toast.success("Call ended by peer"); // Clear message
      resetCallState();
    });

    // Clean up
    return () => {
      socket.off("call:incoming");
      socket.off("call:answered");
      socket.off("call:ice-candidate");
      socket.off("call:rejected");
      socket.off("call:ended");
    };
  }, [socket, authUser, isCallActive, isIncomingCall]);

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
    resetCallState,
  };
};
