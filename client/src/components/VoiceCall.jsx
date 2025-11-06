import React, { useEffect, useRef } from "react";
import assets from "../assets/assets";

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

  useEffect(() => {
    if (audioRef.current && remoteStream) {
      audioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (!isCallActive && !isIncomingCall) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-purple-900/50 to-violet-900/50 border-2 border-purple-500 rounded-2xl p-8 w-96 text-center text-white shadow-2xl">
        {/* User Avatar */}
        <div className="mb-6">
          <img
            src={incomingCallFrom?.profilePic || assets.avatar_icon}
            alt=""
            className="w-32 h-32 rounded-full mx-auto border-4 border-purple-500 shadow-lg"
          />
        </div>

        {/* User Name */}
        <h2 className="text-2xl font-semibold mb-2">
          {incomingCallFrom?.fullName}
        </h2>

        {/* Call Status */}
        <p className="text-gray-300 mb-6">
          {isIncomingCall
            ? "Incoming voice call..."
            : isCallActive
            ? "Voice call in progress"
            : "Calling..."}
        </p>

        {/* Audio Element */}
        <audio ref={audioRef} autoPlay className="hidden" />

        {/* Call Controls */}
        <div className="flex justify-center gap-4">
          {isIncomingCall ? (
            <>
              {/* Answer Button */}
              <button
                onClick={answerCall}
                className="bg-green-500 hover:bg-green-600 p-4 rounded-full transition-all duration-200 transform hover:scale-110 shadow-lg"
                title="Answer Call"
              >
                <svg className="w-6 h-6" fill="white" viewBox="0 0 24 24">
                  <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" />
                </svg>
              </button>

              {/* Reject Button */}
              <button
                onClick={rejectCall}
                className="bg-red-500 hover:bg-red-600 p-4 rounded-full transition-all duration-200 transform hover:scale-110 shadow-lg"
                title="Reject Call"
              >
                <svg className="w-6 h-6" fill="white" viewBox="0 0 24 24">
                  <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.68-1.36-2.66-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
                </svg>
              </button>
            </>
          ) : (
            <>
              {/* Mute Button */}
              <button
                onClick={toggleMute}
                className={`${
                  isMuted ? "bg-red-500" : "bg-gray-600"
                } hover:opacity-80 p-4 rounded-full transition-all duration-200 transform hover:scale-110 shadow-lg`}
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? (
                  <svg className="w-6 h-6" fill="white" viewBox="0 0 24 24">
                    <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="white" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                  </svg>
                )}
              </button>

              {/* End Call Button */}
              <button
                onClick={endCall}
                className="bg-red-500 hover:bg-red-600 p-4 rounded-full transition-all duration-200 transform hover:scale-110 shadow-lg"
                title="End Call"
              >
                <svg className="w-6 h-6" fill="white" viewBox="0 0 24 24">
                  <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.68-1.36-2.66-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Call Timer (Optional) */}
        {isCallActive && !isIncomingCall && (
          <div className="mt-6 text-sm text-gray-300">
            <CallTimer />
          </div>
        )}
      </div>
    </div>
  );
};

// Simple call timer component
const CallTimer = () => {
  const [seconds, setSeconds] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <div>
      {String(minutes).padStart(2, "0")}:{String(secs).padStart(2, "0")}
    </div>
  );
};

export default VoiceCall;
