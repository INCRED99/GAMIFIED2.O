import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Users from "../models/User.js";
import Friend from "../models/Friend.js";

import UserModel from "../models/User.js";

const updateProfileImage = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!req.file || !req.file.filename) {
      return res.status(400).json({ message: "No image uploaded or file invalid" });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    const BASE_URL = process.env.BASE_URL || "https://gamified2-o.onrender.com";
    const fullUrl = `${BASE_URL}${imageUrl}`;

    const user = await UserModel.findByIdAndUpdate(
      userId,
      { picture: imageUrl },
      { new: true, lean: true }
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({
      message: "Profile image updated successfully",
      imageUrl: fullUrl,
      user,
    });
  } catch (error) {
    console.error("Error updating profile image:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


// ----------- REGISTER -----------
 const registerUser = async (req, res) => {
  try {
    const { name, email, password, userType, schoolCode, studentId, teacherId, adminId, EcoPoints } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: "Email & password required" });

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await Users.findOne({ email: normalizedEmail });
    if (existingUser) return res.status(400).json({ success: false, message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new Users({
      name, email: normalizedEmail, password: hashedPassword, userType,
      schoolCode, studentId, teacherId, adminId, EcoPoints: EcoPoints || 1
    });
    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: "30d" });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: { id: newUser._id, name: newUser.name, email: newUser.email, userType: newUser.userType, token }
    });

  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// ----------- LOGIN -----------
const loginUser = async (req, res) => {
  try {
    const { email, password, schoolCode, studentId } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: "Email & password required" });

    const user = await Users.findOne({ email: email.trim().toLowerCase(), schoolCode, studentId });
    if (!user) return res.status(401).json({ success: false, message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: "Invalid credentials" });

    // ✅ Update lastLogin & streak
    const today = new Date();
    const lastLoginDate = user.lastLogin ? new Date(user.lastLogin) : null;

    if (!lastLoginDate || lastLoginDate.toDateString() !== today.toDateString()) {
      user.streak = (user.streak || 1) + 1;
    }
    user.lastLogin = today;
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: { id: user._id, name: user.name, email: user.email, userType: user.userType, token }
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


 



// Accept Friend Request
 const acceptFriendRequest = async (req, res) => {
  try {
    const friendId = req.params.id; // This is the Friend document _id
    const currentUserId = req.user._id;

    // Find the friend request
    const friendRequest = await Friend.findById(friendId);
    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    if (friendRequest.recipient.toString() !== currentUserId.toString()) {
      return res.status(403).json({ message: "Not authorized to accept this request" });
    }

    // Update status
    friendRequest.status = "accepted";
    await friendRequest.save();

    // Add each other as friends
    const currentUser = await Users.findById(currentUserId);
    const requesterUser = await Users.findById(friendRequest.requester);

    if (!currentUser.friends.includes(requesterUser._id)) {
      currentUser.friends.push(requesterUser._id);
    }
    if (!requesterUser.friends.includes(currentUser._id)) {
      requesterUser.friends.push(currentUser._id);
    }

    await currentUser.save();
    await requesterUser.save();

    res.status(200).json({ message: "Friend request accepted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Decline Friend Request
 const declineFriendRequest = async (req, res) => {
  try {
    const friendId = req.params.id; // Friend document _id
    const currentUserId = req.user._id;

    const friendRequest = await Friend.findById(friendId);
    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    if (friendRequest.recipient.toString() !== currentUserId.toString()) {
      return res.status(403).json({ message: "Not authorized to decline this request" });
    }

    // Remove Friend document
    await Friend.findByIdAndDelete(friendId);

    res.status(200).json({ message: "Friend request declined" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ================== REGISTER user ==================

export {
  registerUser,
  loginUser,
  // keep other exports as before...
};

// PUT /api/user/profile/image

 

// ================== GET all users ==================
const getUser = async (req, res) => {
  try {
    const allUsers = await Users.find().select("-password"); // hide password
    if (!allUsers || allUsers.length === 0) {
      return res.status(404).json({ success: false, message: "No users found" });
    }
    res.status(200).json({ success: true, users: allUsers });
  } catch (err) {
    console.error("GetUser error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// ================== UPDATE user ==================
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedUser = await Users.findByIdAndUpdate(id, req.body, { new: true }).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, user: updatedUser });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// ================== DELETE user ==================
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedUser = await Users.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, message: "User deleted successfully", user: deletedUser });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// ================== PROFILE ==================
// ================== PROFILE ==================
const getProfile = async (req, res) => {
  try {
    const user = req.user; // populated by auth middleware
    if (!user) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }

    res.status(200).json({
      username: user.name,   // instead of "name"
      email: user.email,     // add email if available
      role: user.userType,
      school: user.schoolCode || "",
      ecoPoints: user.EcoPoints || 0,
    });
  } catch (err) {
    console.error("Profile error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


// ================== DISPLAY ALL USERS (except current) ==================
const displayUsers = async (req, res) => {
  try {
    const currentUserId = req.user._id; // comes from protect middleware

    const users = await Users.find({ _id: { $ne: currentUserId } }).select("-password");

    const formatted = users.map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      ecoPoints: u.EcoPoints || 0,
      school: u.schoolCode || "",
    }));

    res.status(200).json({ success: true, users: formatted });
  } catch (err) {
    console.error("DisplayUsers error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// ================== GET FRIENDS ==================

const getFriends = async (req, res) => {
  try {
    const userId = req.user._id;

    // Accepted friends (User model)
    const user = await Users.findById(userId).populate("friends", "name email EcoPoints schoolCode");
    let friends = user?.friends || [];

    // Pending requests (Friend model)
    let requests = await Friend.find({ recipient: userId, status: "pending" })
      .populate("requester", "name email EcoPoints schoolCode");

    // Exclude self
    friends = friends.filter((f) => f._id.toString() !== userId.toString());

    res.json({
      success: true,
      friends,
      friendRequests: requests.map((r) => ({
        id: r._id,
        requesterId: r.requester._id,
        name: r.requester.name,
        email: r.requester.email,
        ecoPoints: r.requester.EcoPoints,
        school: r.requester.schoolCode,
        status: r.status,
      })),
    });
  } catch (err) {
    console.error("Error fetching friends:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ================== SEND FRIEND REQUEST ==================
const sendFriendRequest = async (req, res) => {
  try {
    const recipientId = req.params.id; // ✅ from URL param
    const requesterId = req.user._id;

    if (recipientId === requesterId.toString()) {
      return res.status(400).json({ success: false, message: "You cannot add yourself" });
    }

    // Check if request already exists
    const existing = await Friend.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId },
      ],
    });

    if (existing) {
      return res.status(400).json({ success: false, message: "Request already exists" });
    }

    const friendReq = await Friend.create({
      requester: requesterId,
      recipient: recipientId,
      status: "pending",
    });

    res.json({ success: true, message: "Friend request sent", request: friendReq });
  } catch (err) {
    console.error("Error sending request:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};



export {
  getUser,
  updateUser,
  deleteUser,
  getProfile,
  getFriends,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  displayUsers, 
  updateProfileImage,
};