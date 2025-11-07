import React, { useEffect, useRef, useState } from "react";
import assets from "../assets/assets";

// Reusable Call Button Component
const CallButton = ({ onClick, iconPath, color, title }) => (
  <button
    onClick={onClick}
    className={`${color} p-4 rounded-full transition-all duration-200 transform hover:scale-110 active:scale-95 shadow-lg flex items-center justify-center`}
    title={title}
  >
    <svg className="w-6 h-6" fill="white" viewBox="0 0 24 24">
      <path d={iconPath} />
    </svg>
  </button>
);

// Simple Call Timer Component
const CallTimer = () => {
  const [seconds, setSeconds] = React.useState(0);

  React.useEffect(() => {
    // Simple state flag to reset timer on mount for a new call
    if (!CallTimer.shouldStart) {
      CallTimer.shouldStart = true;
      setSeconds(0);
    }

    const interval = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);

    return () => {
      clearInterval(interval);
      CallTimer.shouldStart = false;
    };
  }, []);

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <div className="text-xl font-mono text-white/90">
      {String(minutes).padStart(2, "0")}:{String(secs).padStart(2, "0")}
    </div>
  );
};

const VoiceCall = ({
  isCallActive,
  isIncomingCall,
  incomingCallFrom,
  isMuted,
  answerCall,
  rejectCall,
  endCall,
  toggleMute,
  remoteStream,
}) => {
  const audioRef = useRef(null);
  // Added local video state for better UX, even if video is currently disabled in useWebRTC
  const [isVideoOn, setIsVideoOn] = useState(false);

  // Connect the remote stream to the audio element
  useEffect(() => {
    if (audioRef.current && remoteStream) {
      // CRITICAL FIX: Set the audio element's srcObject to the remote stream
      audioRef.current.srcObject = remoteStream;
      audioRef.current
        .play()
        .catch((e) => console.error("Audio play failed:", e));
    }
  }, [remoteStream]);

  // Reset video state when call ends
  useEffect(() => {
    if (!isCallActive && !isIncomingCall) {
      setIsVideoOn(false);
    }
  }, [isCallActive, isIncomingCall]);

  if (!isCallActive && !isIncomingCall) return null;

  // Dynamic call status message
  const statusMessage = isIncomingCall
    ? "Incoming voice call..."
    : isCallActive
    ? `Talking to ${incomingCallFrom?.fullName}`
    : "Calling...";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      {/* Updated stylish container */}
      <div className="bg-[#1e1a30] border border-violet-700/50 rounded-2xl p-8 w-full max-w-sm text-center text-white shadow-2xl transition-all duration-500 ease-out transform scale-100 hover:scale-[1.01]">
        {/* Call Indicator / Speaker */}
        <div className="flex justify-center items-center mb-6">
          <div
            className={`w-36 h-36 rounded-full mx-auto border-4 transition-all duration-500 shadow-xl relative overflow-hidden ${
              isCallActive
                ? "border-green-500/80 ring-8 ring-green-500/10"
                : "border-violet-500/80 ring-8 ring-violet-500/10 animate-pulse-slow"
            }`}
          >
            <img
              src={incomingCallFrom?.profilePic || assets.avatar_icon}
              alt="User"
              className="w-full h-full object-cover transition-opacity duration-500"
            />
          </div>
          {/* Speaker Icon for Active Call (Visual confirmation of audio path) */}
          {isCallActive && (
            <svg
              className="w-10 h-10 absolute text-white/90 translate-x-12 translate-y-12 bg-violet-600 rounded-full p-1.5 shadow-lg"
              fill="currentColor"
              viewBox="0 0 24 24"
              title="Audio Active"
            >
              <path d="M12 11c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v3c0 1.66 1.34 3 3 3zm5.41-3h-1.04c-.4.55-.78 1.12-1.12 1.74l1.6 1.6C17.3 11.04 18 10.02 18 9c0-1.29-.46-2.47-1.21-3.41zM11.99 16.9c-2.4 0-4.63-.99-6.2-2.61l1.43-1.43c1.29 1.29 3 2.05 4.77 2.05 1.54 0 2.97-.56 4.12-1.55l1.45 1.45c-1.85 1.76-4.39 2.89-7.57 2.89zM12 14c-1.66 0-3-1.34-3-3H7c0 2.76 2.24 5 5 5v3c0 .55.45 1 1 1s1-.45 1-1v-3c2.76 0 5-2.24 5-5h-2c0 1.66-1.34 3-3 3z" />
            </svg>
          )}
        </div>

        {/* User Name */}
        <h2 className="text-3xl font-bold text-violet-400 mb-1 animate-fadeIn">
          {incomingCallFrom?.fullName}
        </h2>

        {/* Call Status */}
        <p
          className={`mb-8 text-sm transition-colors duration-500 ${
            isIncomingCall
              ? "text-yellow-400"
              : isCallActive
              ? "text-green-400"
              : "text-gray-400"
          }`}
        >
          {statusMessage}
        </p>

        {/* Audio Element (Hidden) */}
        <audio ref={audioRef} autoPlay className="hidden" />

        {/* Call Controls */}
        <div className="flex justify-center gap-3">
          {isIncomingCall ? (
            <>
              {/* Answer Button */}
              <CallButton
                onClick={answerCall}
                iconPath="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"
                color="bg-green-500 hover:bg-green-600"
                title="Answer Call"
              />

              {/* Reject Button */}
              <CallButton
                onClick={rejectCall}
                iconPath="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.68-1.36-2.66-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"
                color="bg-red-500 hover:bg-red-600"
                title="Reject Call"
              />
            </>
          ) : (
            <>
              {/* Mute Button */}
              <CallButton
                onClick={toggleMute}
                iconPath={
                  isMuted
                    ? "M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"
                    : "M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zM17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"
                }
                color={
                  isMuted
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-gray-700 hover:bg-gray-600"
                }
                title={isMuted ? "Unmute" : "Mute"}
              />

              {/* Video Button (Placeholder/Future Feature - fulfills UX request) */}
              <CallButton
                onClick={() => setIsVideoOn((prev) => !prev)}
                iconPath={
                  isVideoOn
                    ? "M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4zM15 16H5V8h10v8z"
                    : "M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4zM15 16H5V8h10v8zm-2-6.5l-3 3.4V10c0-.55-.45-1-1-1s-1 .45-1 1v5c0 .55.45 1 1 1s1-.45 1-1v-1.9l3 3.4c.54.59 1.49.17 1.49-.66V11.16c0-.83-.95-1.25-1.49-.66z"
                }
                color={
                  isVideoOn
                    ? "bg-violet-600 hover:bg-violet-700"
                    : "bg-gray-700 hover:bg-gray-600"
                }
                title={isVideoOn ? "Video On" : "Video Off"}
              />

              {/* End Call Button */}
              <CallButton
                onClick={endCall}
                iconPath="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.68-1.36-2.66-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"
                color="bg-red-500 hover:bg-red-600"
                title="End Call"
              />
            </>
          )}
        </div>

        {/* Call Timer (Active) */}
        {isCallActive && !isIncomingCall && (
          <div className="mt-6 text-base font-mono text-gray-300">
            <CallTimer />
          </div>
        )}
      </div>

      {/* Inject global styles for animations */}
      <style>{`
          @keyframes pulse-slow {
            0%, 100% {
              box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4);
            }
            50% {
              box-shadow: 0 0 0 10px rgba(139, 92, 246, 0);
            }
          }
          .animate-pulse-slow {
            animation: pulse-slow 2s infinite cubic-bezier(0.4, 0, 0.6, 1);
          }
          .animate-fadeIn {
              animation: fadeIn 0.5s ease-out;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-5px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
    </div>
  );
};

export default VoiceCall;
