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
    <div
      className={`flex items-end gap-2 justify-end animate-message-enter ${
        !isMyMessage && "flex-row-reverse"
      } ${msg.isPending ? "opacity-60" : ""}`}
    >
      {msg.image ? (
        <img
          src={msg.image}
          alt=""
          className="max-w-[230px] border border-gray-700 rounded-lg overflow-hidden mb-8 shadow-lg transform transition-transform duration-300 hover:scale-[1.02] cursor-pointer"
        />
      ) : (
        <p
          className={`p-3 max-w-xs md:max-w-md font-light rounded-2xl mb-8 break-words text-white shadow-md transition-all duration-200 ${
            isMyMessage
              ? "rounded-br-none bg-violet-600/90 ml-auto"
              : "rounded-bl-none bg-gray-700/80 mr-auto"
          }`}
        >
          {msg.text}
        </p>
      )}
      <div className="text-center text-xs w-fit">
        <img
          src={profilePic}
          alt=""
          className="w-7 h-7 rounded-full object-cover"
        />
        <p className="text-gray-500 mt-1">{formatMessageTime(msg.createdAt)}</p>
        {msg.isPending && (
          <span className="text-gray-500 text-[10px]">Sending...</span>
        )}
      </div>
    </div>
  );
});

MessageBubble.displayName = "MessageBubble";

// Typing indicator component
const TypingIndicator = memo(() => (
  <div className="flex items-end gap-2 mb-4 animate-message-enter">
    <div className="p-3 rounded-2xl rounded-bl-none bg-gray-700/80">
      <div className="flex gap-1">
        <div
          className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
          style={{ animationDelay: "0ms" }}
        ></div>
        <div
          className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
          style={{ animationDelay: "150ms" }}
        ></div>
        <div
          className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
          style={{ animationDelay: "300ms" }}
        ></div>
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
      await sendMessage({ text: input.trim() });
      setInput("");
      inputRef.current?.focus();
    },
    [input, sendMessage]
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
    if (!onlineUsers.includes(selectedUser._id)) {
      toast.error("User is offline");
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
      });
      if (shouldAnimateScroll) {
        setShouldAnimateScroll(false);
      }
    }
  }, [messages, shouldAnimateScroll]);

  // Connection status indicator
  const connectionIndicator = connectionStatus !== "connected" && (
    <div className="absolute top-0 left-0 right-0 bg-yellow-500/90 text-white text-center py-1 text-xs z-10 animate-slide-down">
      {connectionStatus === "reconnecting"
        ? "🔄 Reconnecting..."
        : connectionStatus === "error"
        ? "⚠️ Connection error"
        : "📡 Connecting..."}
    </div>
  );

  return selectedUser ? (
    <>
      <div className="h-full overflow-hidden relative backdrop-blur-lg flex flex-col">
        {connectionIndicator}

        {/* Header */}
        <div className="flex items-center gap-3 py-3 px-4 border-b border-stone-500 flex-shrink-0">
          <img
            src={selectedUser.profilePic || assets.avatar_icon}
            alt=""
            className="w-9 h-9 rounded-full object-cover"
          />
          <p className="flex-1 text-lg text-white flex items-center gap-2">
            {selectedUser.fullName}
            {onlineUsers.includes(selectedUser._id) && (
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
            )}
          </p>

          {/* Voice Call Button */}
          <button
            onClick={handleStartCall}
            className={`p-2 rounded-full transition-all ${
              !onlineUsers.includes(selectedUser._id)
                ? "text-gray-500 cursor-not-allowed"
                : "hover:bg-white/20 text-white"
            }`}
            title="Start Voice Call"
            disabled={!onlineUsers.includes(selectedUser._id)}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" />
            </svg>
          </button>

          <img
            onClick={() => setSelectedUser(null)}
            src={assets.arrow_icon}
            alt=""
            className="md:hidden max-w-7 cursor-pointer transform rotate-180 transition-transform hover:scale-110"
          />
          <img
            src={assets.help_icon}
            alt=""
            className="max-md:hidden max-w-5 cursor-pointer transition-transform hover:scale-110"
          />
        </div>

        {/* Chat area */}
        <div className="flex flex-col flex-1 overflow-y-auto p-3 pb-6">
          {messages.map((msg) => (
            <MessageBubble
              key={msg._id}
              msg={msg}
              authUser={authUser}
              selectedUser={selectedUser}
            />
          ))}
          {isTyping && <TypingIndicator />}
          <div ref={scrollEnd}></div>
        </div>

        {/* Bottom area */}
        <div className="flex items-center gap-3 p-3 flex-shrink-0">
          <div className="flex-1 flex items-center bg-gray-100/12 px-3 rounded-full">
            <input
              ref={inputRef}
              onChange={handleInputChange}
              value={input}
              onKeyDown={(e) =>
                e.key === "Enter" ? handleSendMessage(e) : null
              }
              type="text"
              placeholder="Send a message"
              className="p-3 text-sm border-none rounded-full outline-none text-white placeholder-gray-400 bg-transparent flex-1"
            />
            <input
              onChange={handleSendImage}
              type="file"
              id="image"
              accept="image/png, image/jpeg"
              hidden
            />
            <label htmlFor="image">
              <img
                src={assets.gallery_icon}
                alt=""
                className="w-5 mr-2 cursor-pointer transition-transform hover:scale-110"
              />
            </label>
          </div>
          <img
            onClick={handleSendMessage}
            src={assets.send_button}
            alt=""
            className="w-8 h-8 cursor-pointer transition-transform hover:scale-110 active:scale-90"
          />
        </div>
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
    <div className="flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden">
      <img src={assets.logo_icon} className="max-w-16 animate-pulse" alt="" />
      <p className="text-lg font-medium text-white">Chat anytime, anywhere</p>
      {connectionStatus !== "connected" && (
        <p className="text-sm text-yellow-400">
          {connectionStatus === "reconnecting"
            ? "Reconnecting..."
            : "Connection lost"}
        </p>
      )}
    </div>
  );
};

export default ChatContainer;
