import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [unseenMessages, setUnseenMessages] = useState({});
  const [isTyping, setIsTyping] = useState(false);

  const { socket, axios } = useContext(AuthContext);

  // Use refs to avoid stale closure issues
  const selectedUserRef = useRef(selectedUser);
  const messagesRef = useRef(messages);

  useEffect(() => {
    selectedUserRef.current = selectedUser;
    messagesRef.current = messages;
  }, [selectedUser, messages]);

  // Optimized getUsers with useCallback
  const getUsers = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/messages/users");
      if (data.success) {
        setUsers(data.users);
        setUnseenMessages(data.unseenMessages);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }, [axios]);

  // Optimized getMessages with useCallback
  const getMessages = useCallback(
    async (userId) => {
      try {
        const { data } = await axios.get(`/api/messages/${userId}`);
        if (data.success) {
          setMessages(data.messages);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    },
    [axios]
  );

  // Optimistic UI update for sending messages
  const sendMessage = useCallback(
    async (messageData) => {
      const tempId = `temp-${Date.now()}`;
      const optimisticMessage = {
        _id: tempId,
        ...messageData,
        senderId: selectedUserRef.current?._id,
        createdAt: new Date().toISOString(),
        seen: false,
        isPending: true, // Flag for styling
      };

      // Immediately add to UI
      setMessages((prev) => [...prev, optimisticMessage]);

      try {
        const { data } = await axios.post(
          `/api/messages/send/${selectedUserRef.current._id}`,
          messageData
        );

        if (data.success) {
          // Replace temporary message with real one
          setMessages((prev) =>
            prev.map((msg) => (msg._id === tempId ? data.newMessage : msg))
          );
        } else {
          // Remove failed message
          setMessages((prev) => prev.filter((msg) => msg._id !== tempId));
          toast.error(data.message || "Failed to send message");
        }
      } catch (error) {
        // Remove failed message
        setMessages((prev) => prev.filter((msg) => msg._id !== tempId));
        toast.error("Failed to send message");
        console.error("Error sending message:", error);
      }
    },
    [axios]
  );

  // Optimized socket event handlers
  const subscribeToMessages = useCallback(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      const currentSelectedUser = selectedUserRef.current;

      if (
        currentSelectedUser &&
        newMessage.senderId === currentSelectedUser._id
      ) {
        newMessage.seen = true;
        setMessages((prevMessages) => [...prevMessages, newMessage]);

        // Mark as seen without blocking
        axios.put(`/api/messages/mark/${newMessage._id}`).catch(console.error);
      } else {
        setUnseenMessages((prev) => ({
          ...prev,
          [newMessage.senderId]: (prev[newMessage.senderId] || 0) + 1,
        }));

        // Show toast notification for new message
        if (currentSelectedUser?._id !== newMessage.senderId) {
          toast.success("New message received", {
            duration: 2000,
            position: "top-right",
          });
        }
      }
    };

    const handleTyping = ({ userId, isTyping: typing }) => {
      if (selectedUserRef.current?._id === userId) {
        setIsTyping(typing);
      }
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("user:typing", handleTyping);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("user:typing", handleTyping);
    };
  }, [socket, axios]);

  useEffect(() => {
    const unsubscribe = subscribeToMessages();
    return () => unsubscribe?.();
  }, [subscribeToMessages]);

  // Typing indicator with debounce
  const typingTimeoutRef = useRef(null);
  const emitTyping = useCallback(
    (typing) => {
      if (!socket || !selectedUser) return;

      socket.emit("user:typing", {
        to: selectedUser._id,
        isTyping: typing,
      });

      if (typing) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          socket.emit("user:typing", {
            to: selectedUser._id,
            isTyping: false,
          });
        }, 2000);
      }
    },
    [socket, selectedUser]
  );

  const value = {
    messages,
    users,
    selectedUser,
    getUsers,
    getMessages,
    sendMessage,
    setSelectedUser,
    unseenMessages,
    setUnseenMessages,
    isTyping,
    emitTyping,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
