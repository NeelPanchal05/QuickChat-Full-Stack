import { createContext, useEffect, useState, useCallback } from "react";
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
  const [connectionStatus, setConnectionStatus] = useState("connecting");

  // Check authentication
  const checkAuth = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/auth/check");
      if (data.success) {
        setAuthUser(data.user);
        connectSocket(data.user);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      localStorage.removeItem("token");
      setToken(null);
    }
  }, []);

  // Login function
  const login = useCallback(async (state, credentials) => {
    try {
      const { data } = await axios.post(`/api/auth/${state}`, credentials);
      if (data.success) {
        setAuthUser(data.userData);
        connectSocket(data.userData);
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
    toast.success("Logged out successfully");
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  }, [socket]);

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

  // Connect socket with optimized configuration
  const connectSocket = useCallback(
    (userData) => {
      if (!userData || socket?.connected) return;

      const newSocket = io(backendUrl, {
        query: { userId: userData._id },
        transports: ["websocket", "polling"], // Prefer websocket
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        timeout: 10000,
      });

      // Connection status handlers
      newSocket.on("connect", () => {
        console.log("Socket connected");
        setConnectionStatus("connected");
      });

      newSocket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
        setConnectionStatus("disconnected");
        if (reason === "io server disconnect") {
          // Server disconnected, try to reconnect
          newSocket.connect();
        }
      });

      newSocket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        setConnectionStatus("error");
      });

      newSocket.on("reconnect", (attemptNumber) => {
        console.log("Socket reconnected after", attemptNumber, "attempts");
        setConnectionStatus("connected");
        toast.success("Reconnected to server", { duration: 2000 });
      });

      newSocket.on("reconnect_attempt", () => {
        setConnectionStatus("reconnecting");
      });

      newSocket.on("reconnect_failed", () => {
        setConnectionStatus("failed");
        toast.error("Failed to reconnect to server");
      });

      // Online users handler
      newSocket.on("getOnlineUsers", (userIds) => {
        setOnlineUsers(userIds);
      });

      setSocket(newSocket);
    },
    [socket, backendUrl]
  );

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
