import { createContext, useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [authUser, setAuthUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");

  // Use ref to prevent reconnection loops
  const socketRef = useRef(null);
  const isConnectingRef = useRef(false);

  // Check authentication
  const checkAuth = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/auth/check");
      if (data.success) {
        setAuthUser(data.user);
        return data.user;
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      localStorage.removeItem("token");
      setToken(null);
      return null;
    }
  }, []);

  // Login function
  const login = useCallback(async (state, credentials) => {
    try {
      const { data } = await axios.post(`/api/auth/${state}`, credentials);
      if (data.success) {
        setAuthUser(data.userData);
        axios.defaults.headers.common["token"] = data.token;
        setToken(data.token);
        localStorage.setItem("token", data.token);
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setAuthUser(null);
    setOnlineUsers([]);
    axios.defaults.headers.common["token"] = null;

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
    }

    toast.success("Logged out successfully");
  }, []);

  // Update profile
  const updateProfile = useCallback(async (body) => {
    try {
      const { data } = await axios.put("/api/auth/update-profile", body);
      if (data.success) {
        setAuthUser(data.user);
        toast.success("Profile updated successfully");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    }
  }, []);

  // Connect socket - separate useEffect
  useEffect(() => {
    if (!authUser || isConnectingRef.current || socketRef.current?.connected) {
      return;
    }

    isConnectingRef.current = true;
    console.log("Connecting socket for user:", authUser._id);

    const newSocket = io(backendUrl, {
      query: { userId: authUser._id },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 500, // Reduced delay
      reconnectionDelayMax: 3000, // Reduced max delay
      reconnectionAttempts: 5,
      timeout: 10000,
      // VERCEL FIX: Set ping timeout to match server config (5s interval + tolerance)
      pingInterval: 5000,
      pingTimeout: 10000,
    });

    // Connection status handler
    newSocket.on("connect", () => {
      console.log("✅ Socket connected");
      setConnectionStatus("connected");
      isConnectingRef.current = false;
    });

    newSocket.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", reason);
      setConnectionStatus("disconnected");
      isConnectingRef.current = false;
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setConnectionStatus("error");
      isConnectingRef.current = false;
    });

    newSocket.on("reconnect", (attemptNumber) => {
      console.log("✅ Socket reconnected after", attemptNumber, "attempts");
      setConnectionStatus("connected");
      toast.success("Reconnected", { duration: 2000 });
    });

    newSocket.on("reconnect_attempt", () => {
      console.log("🔄 Attempting to reconnect...");
      setConnectionStatus("reconnecting");
    });

    newSocket.on("reconnect_failed", () => {
      console.error("❌ Reconnection failed");
      setConnectionStatus("failed");
      toast.error("Failed to reconnect to server");
      isConnectingRef.current = false;
    });

    // Online users handler
    newSocket.on("getOnlineUsers", (userIds) => {
      console.log("📡 Online users updated:", userIds);
      setOnlineUsers(userIds);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      console.log("Cleaning up socket connection");
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      isConnectingRef.current = false;
    };
  }, [authUser]);

  // Initialize auth check
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["token"] = token;
      checkAuth();
    }
  }, [token, checkAuth]);

  const value = {
    axios,
    authUser,
    onlineUsers,
    socket,
    connectionStatus,
    login,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
