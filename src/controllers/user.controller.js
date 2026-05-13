import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    // find the user by userId
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    // If it's already an ApiError, preserve the original status and message
    if (error instanceof ApiError) {
      throw error;
    }
    // Only wrap truly unexpected errors
    console.error("Internal server error during token generation", error);
    throw new ApiError(500, "Internal server error during token generation");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { userName, fullName, email, password } = req.body;

  // Validate all required fields are present and non-empty
  if ([userName, fullName, email, password].some((field) => !field?.trim())) {
    throw new ApiError(400, "All fields are required");
  }

  // Check for duplicate userName or email
  const existedUser = await User.findOne({
    $or: [{ userName: userName.toLowerCase() }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or userName already exists");
  }

  // Safely extract file paths — coverImage is optional
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = coverImageLocalPath
    ? await uploadOnCloudinary(coverImageLocalPath)
    : null;

  if (!avatar) {
    throw new ApiError(500, "Avatar upload failed, please try again");
  }

  const user = await User.create({
    userName,
    fullName,
    email,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering user");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // Take the user information from request body
  const { userName, email, password } = req.body;

  // Validate the user by email or userName or password
  if (!password || (!userName && !email)) {
    throw new ApiError(400, "Username/Email and password are required");
  }

  // Find the user in the database
  const user = await User.findOne({
    $or: [{ email: email.toLowerCase() }, { userName }],
  });

  if (!user) {
    throw new ApiError(401, "Invalid user credentials");
  }

  // Check if the password is correct
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  // Generate access and refresh tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = user.toObject();
  delete loggedInUser.password;
  delete loggedInUser.refreshToken;

  const cookieOptions = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

// Secure routes
const logoutUser = asyncHandler(async (req, res) => {
  // 1. Defensive Check
  // Even though verifyJWT should provide req.user,
  // checking it here prevents crashes if the middleware is ever changed.
  if (!req.user?._id) {
    throw new ApiError(401, "Unauthorized: User information missing");
  }

  const user = req.user;

  // 2. Precise Database Update
  // We use $unset to completely remove the field or $set to null.
  // This invalidates the refresh token on the server side.
  await User.findByIdAndUpdate(
    user._id,
    {
      $set: { refreshToken: null },
    },
    { new: true }
  );

  // 3. Secure Cookie Clearing
  const cookieOptions = {
    httpOnly: true,
    secure: true,
  };

  // 4. Guaranteed Response
  // We clear the cookies and send a JSON confirmation back to the client.
  res
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

export { registerUser, loginUser, logoutUser };
