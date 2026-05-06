import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${process.env.DB_NAME}`
    );
    console.log(
      `MongoDB connected. Host: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.error("Error occurs", error);
    process.exit(1);
  }
};

export default connectDB;
