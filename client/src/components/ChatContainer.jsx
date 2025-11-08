import React, {
  useContext,
  useEffect,
  useRef,
  useState,
  memo,
  useCallback,
} from "react";
import assets from "../assets/assets";
import { formatMessageTime } from "../lib/utils";
import { ChatContext } from "../../context/ChatContext";
import { AuthContext } from "../../context/AuthContext";
import { useWebRTC } from "../hooks/useWebRTC";
import VoiceCall from "./VoiceCall";
import toast from "react-hot-toast";

// Memoized Message component
const MessageBubble = memo(({ msg, authUser, selectedUser }) => {
  const isMyMessage = msg.senderId === authUser._id;
  const profilePic = isMyMessage
    ? authUser?.profilePic || assets.avatar_icon
    : selectedUser?.profilePic || assets.avatar_icon;

  return (
    // Message container with alignment and new drop shadow
    <div
      className={`flex items-end gap-2 animate-message-enter ${
        isMyMessage
          ? "flex-row-reverse justify-start ml-auto"
          : "justify-start mr-auto"
      } ${msg.isPending ? "opacity-60 grayscale" : ""}`}
    >
      <div className="text-center text-xs w-fit flex flex-col items-center">
        <img
          src={profilePic}
          alt="Profile"
          className="w-7 h-7 rounded-full object-cover border border-violet-500/50 shadow-md"
        />
        {/* Time below the avatar */}
        <p className="text-gray-500 mt-1 text-[10px]">
          {formatMessageTime(msg.createdAt)}
        </p>
        {msg.isPending && (
          <span className="text-violet-400 text-[10px] animate-pulse">
            Sending...
          </span>
        )}
      </div>

      {/* Content wrapper */}
      {msg.image ? (
        <img
          src={msg.image}
          alt="Shared Media"
          className={`max-w-[250px] md:max-w-sm rounded-lg overflow-hidden my-1 shadow-xl cursor-pointer transition-all duration-300 hover:scale-[1.03] ${
            isMyMessage ? "shadow-violet-900/50" : "shadow-gray-900/50"
          }`}
          onClick={() => window.open(msg.image)} // Open image on click
        />
      ) : (
        <p
          className={`p-3 max-w-xs sm:max-w-md lg:max-w-lg font-normal rounded-2xl my-1 break-words text-white shadow-lg transition-all duration-200 hover:shadow-xl ${
            isMyMessage
              ? "rounded-tr-xl rounded-bl-xl bg-violet-600 shadow-violet-900/50"
              : "rounded-tl-xl rounded-br-xl bg-[#3c3359] shadow-gray-900/50"
          }`}
        >
          {msg.text}
        </p>
      )}
    </div>
  );
});

MessageBubble.displayName = "MessageBubble";

// Typing indicator component
const TypingIndicator = memo(() => (
  <div className="flex items-end gap-2 mb-4 animate-message-enter mr-auto">
    <div className="p-3 rounded-2xl rounded-bl-none bg-[#3c3359] shadow-lg">
      <div className="flex gap-1 animate-smooth-bounce">
        <div className="w-2 h-2 rounded-full bg-violet-400"></div>
        <div className="w-2 h-2 rounded-full bg-violet-400"></div>
        <div className="w-2 h-2 rounded-full bg-violet-400"></div>
      </div>
    </div>
  </div>
));

TypingIndicator.displayName = "TypingIndicator";

const ChatContainer = () => {
  const {
    messages,
    selectedUser,
    setSelectedUser,
    sendMessage,
    getMessages,
    isTyping,
    emitTyping,
  } = useContext(ChatContext);

  const { authUser, onlineUsers, connectionStatus } = useContext(AuthContext);

  const scrollEnd = useRef();
  const [input, setInput] = useState("");
  const [shouldAnimateScroll, setShouldAnimateScroll] = useState(false);
  const inputRef = useRef(null);

  // WebRTC hook
  const {
    startCall,
    answerCall,
    rejectCall,
    endCall,
    toggleMute,
    isCallActive,
    isIncomingCall,
    incomingCallFrom,
    isMuted,
    remoteStream,
  } = useWebRTC();

  // Handle sending a message
  const handleSendMessage = useCallback(
    async (e) => {
      e.preventDefault();
      if (input.trim() === "") return;

      setShouldAnimateScroll(true);
      // Emit typing false immediately after hitting send
      emitTyping(false);
      await sendMessage({ text: input.trim() });
      setInput("");
      inputRef.current?.focus();
    },
    [input, sendMessage, emitTyping]
  );

  // Handle sending an image
  const handleSendImage = useCallback(
    async (e) => {
      const file = e.target.files[0];
      if (!file || !file.type.startsWith("image/")) {
        toast.error("Select an image file");
        return;
      }

      setShouldAnimateScroll(true);

      const reader = new FileReader();
      reader.onloadend = async () => {
        await sendMessage({ image: reader.result });
        e.target.value = "";
      };
      reader.readAsDataURL(file);
    },
    [sendMessage]
  );

  // Handle typing indicator
  const handleInputChange = useCallback(
    (e) => {
      setInput(e.target.value);
      if (e.target.value.length > 0) {
        emitTyping(true);
      } else {
        emitTyping(false);
      }
    },
    [emitTyping]
  );

  // Handle starting a call
  const handleStartCall = useCallback(() => {
    // FIX: Check online status using .toString()
    if (!onlineUsers.includes(selectedUser._id.toString())) {
      toast.error("User is offline or not reachable");
      return;
    }
    startCall(selectedUser);
  }, [onlineUsers, selectedUser, startCall]);

  // Load messages when user is selected
  useEffect(() => {
    if (selectedUser) {
      setShouldAnimateScroll(false);
      getMessages(selectedUser._id);
    }
  }, [selectedUser, getMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollEnd.current && messages) {
      scrollEnd.current.scrollIntoView({
        behavior: shouldAnimateScroll ? "smooth" : "auto",
        block: "end",
      });
      if (shouldAnimateScroll) {
        setShouldAnimateScroll(false);
      }
    }
  }, [messages, shouldAnimateScroll]);

  // Connection status indicator
  const connectionIndicator = connectionStatus !== "connected" && (
    <div className="absolute top-0 left-0 right-0 bg-red-600/90 text-white text-center py-1 text-xs z-10 animate-slide-down shadow-lg">
      {connectionStatus === "reconnecting"
        ? "🔄 Reconnecting..."
        : connectionStatus === "error" || connectionStatus === "failed"
        ? "⚠️ Connection error or failed to connect"
        : "📡 Connecting..."}
    </div>
  );

  return selectedUser ? (
    <>
      <div className="h-full overflow-hidden relative bg-white/5 flex flex-col transition-all duration-300">
        {connectionIndicator}

        {/* Header */}
        <div className="flex items-center gap-3 py-4 px-6 border-b border-violet-800/50 flex-shrink-0 bg-[#282142] shadow-xl">
          <img
            src={selectedUser.profilePic || assets.avatar_icon}
            alt="Profile"
            className="w-10 h-10 rounded-full object-cover border border-violet-500/50"
          />
          <p className="flex-1 text-xl font-medium text-white flex items-center gap-2">
            {selectedUser.fullName}
            {onlineUsers.includes(selectedUser._id.toString()) && (
              <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse-soft"></span>
            )}
          </p>

          {/* Voice Call Button (Enhanced Icon) */}
          <button
            onClick={handleStartCall}
            className={`p-3 rounded-full transition-all text-white shadow-md transform hover:scale-[1.05] active:scale-95 ${
              !onlineUsers.includes(selectedUser._id.toString())
                ? "bg-gray-700/50 text-gray-400 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600 hover:shadow-green-500/50"
            }`}
            title="Start Voice Call"
            disabled={!onlineUsers.includes(selectedUser._id.toString())}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" />
            </svg>
          </button>

          <img
            onClick={() => setSelectedUser(null)}
            src={assets.arrow_icon}
            alt="Back"
            className="md:hidden w-6 cursor-pointer transform rotate-180 transition-transform hover:scale-110 opacity-70 hover:opacity-100"
          />
          <img
            src={assets.help_icon}
            alt="Info"
            className="max-md:hidden w-6 cursor-pointer transition-transform hover:scale-110 opacity-70 hover:opacity-100"
          />
        </div>

        {/* Chat area */}
        <div className="flex flex-col flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => (
            <MessageBubble
              key={msg._id}
              msg={msg}
              authUser={authUser}
              selectedUser={selectedUser}
            />
          ))}
          {isTyping && <TypingIndicator />}
          <div ref={scrollEnd} className="h-0"></div>
        </div>

        {/* Bottom area (Input bar) */}
        <form
          onSubmit={handleSendMessage}
          className="flex items-center gap-3 p-4 sm:p-6 flex-shrink-0 bg-[#282142] border-t border-violet-800/50 shadow-inner"
        >
          <div className="flex-1 flex items-center bg-white/10 px-4 rounded-3xl border border-white/5">
            <input
              ref={inputRef}
              onChange={handleInputChange}
              value={input}
              type="text"
              placeholder="Send a message..."
              className="p-3 text-base border-none rounded-3xl outline-none text-white placeholder-gray-400 bg-transparent flex-1"
            />
            <input
              onChange={handleSendImage}
              type="file"
              id="image-upload"
              accept="image/png, image/jpeg"
              hidden
            />
            <label htmlFor="image-upload">
              {/* Gallery icon (SVG) */}
              <svg
                className="w-6 h-6 mr-2 cursor-pointer text-violet-400 opacity-80 hover:opacity-100 transition-opacity transform hover:scale-110"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-8-4h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                ></path>
              </svg>
            </label>
          </div>
          <button
            type="submit"
            className="p-3 rounded-full bg-violet-600 hover:bg-violet-700 shadow-lg hover:shadow-violet-500/50 transform hover:scale-110 active:scale-95 transition-all duration-300"
          >
            {/* Send button (SVG for better quality) */}
            <svg className="w-5 h-5" fill="white" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </form>
      </div>

      {/* Voice Call Component */}
      <VoiceCall
        isCallActive={isCallActive}
        isIncomingCall={isIncomingCall}
        incomingCallFrom={incomingCallFrom}
        isMuted={isMuted}
        answerCall={answerCall}
        rejectCall={rejectCall}
        endCall={endCall}
        toggleMute={toggleMute}
        remoteStream={remoteStream}
      />
    </>
  ) : (
    // Default chat container (When no user is selected)
    <div className="flex flex-col items-center justify-center gap-4 text-gray-500 bg-white/10 max-md:hidden border-l border-violet-800/20">
      <img src={assets.logo} className="max-w-40 animate-fade-in" alt="Logo" />
      <p className="text-xl font-medium text-white animate-slide-up">
        Select a chat to begin messaging
      </p>
      {connectionStatus !== "connected" && (
        <p className="text-sm text-red-400 animate-pulse">
          {connectionStatus === "reconnecting"
            ? "Reconnecting to server..."
            : "Connection lost."}
        </p>
      )}
    </div>
  );
};

export default ChatContainer;
