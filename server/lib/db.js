import mongoose from "mongoose";

// Function to connect to the mongodb database
export const connectDB = async () => {
  try {
    mongoose.connection.on("connected", () =>
      console.log("Database Connected")
    );
    // FIX: Ensure MONGODB_URI includes the database name in Vercel settings.
    await mongoose.connect(process.env.MONGODB_URI);
  } catch (error) {
    // Log the failure in Vercel's console
    console.error("CRITICAL ERROR: MongoDB connection failed:", error.message);
    // Throw an error to ensure the serverless function exits if the database is unavailable
    throw new Error("DB Connection Failed: " + error.message);
  }
};
