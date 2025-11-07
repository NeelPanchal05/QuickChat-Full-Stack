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
  // Optimized ping configuration for better connection stability
  pingInterval: 25000, // Send ping every 25 seconds
  pingTimeout: 20000, // Wait 20 seconds for pong
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
  console.log("User Connected:", userId, "Socket ID:", socket.id);

  if (userId && userId !== "undefined") {
    userSocketMap[userId] = socket.id;

    // Emit updated online users immediately
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
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
    console.log("User Disconnected:", userId, "Reason:", reason);

    if (userId && userSocketMap[userId] === socket.id) {
      delete userSocketMap[userId];

      // Clean up typing state
      typingUsers.delete(userId);

      // Emit updated online users
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
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

// Add compression middleware for better performance
import compression from "compression";
app.use(compression());

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
