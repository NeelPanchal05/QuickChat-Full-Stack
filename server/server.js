import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Initialize socket.io server with optimized configuration
export const io = new Server(server, {
  cors: {
    origin: "*",
    credentials: true,
  },
  // VERCEL FIX: Reduced ping interval/timeout to prevent serverless function idle timeout
  pingInterval: 5000, // Send ping every 5 seconds (was 25000)
  pingTimeout: 10000, // Wait 10 seconds for pong (was 20000)
  // Use websocket for better performance
  transports: ["websocket", "polling"],
  // Compression for better performance
  perMessageDeflate: {
    threshold: 1024, // Compress messages > 1KB
  },
  // Allow reconnection
  allowEIO3: true,
  // Connection timeout
  connectTimeout: 45000,
});

// Store online users
export const userSocketMap = {}; // { userId: socketId }

// Track typing states
const typingUsers = new Map(); // Map<userId, Set<typingToUserId>>

// Socket.io connection handler
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;

  console.log("🔵 User Connected:", userId, "Socket ID:", socket.id);

  if (userId && userId !== "undefined" && userId !== "null") {
    // Remove old socket if exists
    const oldSocketId = userSocketMap[userId];
    if (oldSocketId && oldSocketId !== socket.id) {
      console.log("Removing old socket for user:", userId);
      io.sockets.sockets.get(oldSocketId)?.disconnect(true);
    }

    userSocketMap[userId] = socket.id;

    // Emit updated online users immediately
    const onlineUserIds = Object.keys(userSocketMap);
    console.log("📡 Broadcasting online users:", onlineUserIds);
    io.emit("getOnlineUsers", onlineUserIds);
  } else {
    console.warn("⚠️ Invalid userId in connection:", userId);
  }

  // Handle typing events with debounce
  socket.on("user:typing", ({ to, isTyping }) => {
    const receiverSocketId = userSocketMap[to];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("user:typing", {
        userId,
        isTyping,
      });
    }
  });

  // WebRTC Signaling Events
  socket.on("call:initiate", ({ to, offer, from }) => {
    const receiverSocketId = userSocketMap[to];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("call:incoming", { from, offer });
    }
  });

  socket.on("call:answer", ({ to, answer }) => {
    const callerSocketId = userSocketMap[to];
    if (callerSocketId) {
      io.to(callerSocketId).emit("call:answered", { answer });
    }
  });

  socket.on("call:ice-candidate", ({ to, candidate }) => {
    const receiverSocketId = userSocketMap[to];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("call:ice-candidate", { candidate });
    }
  });

  socket.on("call:reject", ({ to }) => {
    const callerSocketId = userSocketMap[to];
    if (callerSocketId) {
      io.to(callerSocketId).emit("call:rejected");
    }
  });

  socket.on("call:end", ({ to }) => {
    const receiverSocketId = userSocketMap[to];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("call:ended");
    }
  });

  // Handle disconnection with proper cleanup
  socket.on("disconnect", (reason) => {
    console.log("🔴 User Disconnected:", userId, "Reason:", reason);

    if (userId && userId !== "undefined" && userId !== "null") {
      // Only delete if this socket belongs to this user
      if (userSocketMap[userId] === socket.id) {
        delete userSocketMap[userId];

        // Clean up typing state
        typingUsers.delete(userId);

        // Emit updated online users
        const onlineUserIds = Object.keys(userSocketMap);
        console.log(
          "📡 Broadcasting online users after disconnect:",
          onlineUserIds
        );
        io.emit("getOnlineUsers", onlineUserIds);
      }
    }
  });

  // Handle errors
  socket.on("error", (error) => {
    console.error("Socket error for user", userId, ":", error);
  });
});

// Middleware setup with optimized limits
app.use(express.json({ limit: "4mb" }));
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

// Routes setup
app.use("/api/status", (req, res) => res.send("Server is live"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

// Connect to MongoDB
await connectDB();

// Start server
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log("Server is running on PORT:", PORT);
    console.log("Socket.IO configured with optimized settings");
  });
}

// Export server for Vercel
export default server;
