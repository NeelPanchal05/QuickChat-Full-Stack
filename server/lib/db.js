import mongoose from "mongoose";

// Function to connect to the mongodb database
export const connectDB = async () => {
  try {
    mongoose.connection.on("connected", () =>
      console.log("Database Connected")
    );
    // FIX: Remove manual database name appending. The name 'chat-app' should be in the MONGODB_URI environment variable or is implied.
    await mongoose.connect(process.env.MONGODB_URI);
  } catch (error) {
    // Log the error to Vercel console for debugging
    console.error("MongoDB connection failed:", error.message);
    // You might want to exit the process or handle the failure gracefully here
  }
};
