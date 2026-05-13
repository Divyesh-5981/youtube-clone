import jwt from "jsonwebtoken";

import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const verifyJWT = asyncHandler(async (req, _res, next) => {
  try {
    // Extract Token: Get the access token from the request cookies or the Authorization header.
    const token =
      req.cookies?.accessToken ||
      req.headers["Authorization"]?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized request: No token provided");
    }

    // Verify JWT: Validate the token. If it is expired or tampered with, return an "Invalid access token" error.
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Fetch User: Use the ID stored in the token payload to look up the user in your database.
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    // Validate User: If the user does not exist in the database, return an "User not found" error.
    if (!user) {
      throw new ApiError(400, "Invalid access token: User not found");
    }

    // Inject User: Attach the user data to the req object and call next() to proceed.
    req.user = user;
    next();
  } catch (error) {
    // Catching specific JWT errors (like TokenExpiredError)
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});
