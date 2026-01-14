import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI?.trim();

    if (!uri || !uri.startsWith("mongodb")) {
      throw new Error("Invalid MongoDB URI");
    }

    await mongoose.connect(uri);
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("MongoDB Error:", error.message);
    process.exit(1);
  }
};

export default connectDB;
