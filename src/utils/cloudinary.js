import fs from "fs";

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (locationPath) => {
  try {
    if (!locationPath) return null;

    const response = await cloudinary.uploader.upload(locationPath, {
      resource_type: "auto",
    });
    console.log("file uploaded successfully", response.url);
    fs.unlinkSync(locationPath);
    return response;
  } catch (error) {
    console.error("File Upload Error", error);
    fs.unlinkSync(locationPath);
    return null;
  }
};

export { uploadOnCloudinary };
