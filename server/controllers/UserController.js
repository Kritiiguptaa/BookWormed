import userModel from "../models/userModel.js"
import transactionModel from "../models/transactionModel.js"
import razorpay from 'razorpay';
import bcrypt from 'bcryptjs'    //password protection
import jwt from 'jsonwebtoken'   //user authentication
import { createNotificationHelper } from './NotificationController.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { logAuthFailure, logAuthSuccess, logAccountLockout, logPasswordReset, logPaymentAttempt } from '../utils/logger.js';
// import stripe from "stripe";
const getUser = async (req, res) => {
  try {
    // Find the user by the ID provided by the userAuth middleware
    const user = await userModel.findById(req.body.userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    // Important: Don't send the password back to the client
    const { password, ...userData } = user._doc;
    res.json({ success: true, user: userData });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error fetching user data" });
  }
};
const registerUser = async (req, res) => {
  try {
    const { name, username, email, password, verificationCode } = req.body;

    // Check missing fields
    if (!name || !username || !email || !password || !verificationCode) {
      return res.json({ success: false, message: 'Missing Details' });
    }

    // Validate name length (2-50 characters)
    if (name.length < 2 || name.length > 50) {
      return res.json({ success: false, message: 'Name must be between 2 and 50 characters' });
    }

    // Validate username length (3-30 characters)
    if (username.length < 3 || username.length > 30) {
      return res.json({ success: false, message: 'Username must be between 3 and 30 characters' });
    }

    // Password strength validation
    if (password.length < 8) {
      return res.json({ success: false, message: 'Password must be at least 8 characters long' });
    }
    
    // Check for at least one uppercase, one lowercase, and one number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
    if (!passwordRegex.test(password)) {
      return res.json({ success: false, message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' });
    }

    // Verify email code first
    const hashedCode = crypto.createHash('sha256').update(verificationCode).digest('hex');
    const tempUser = await userModel.findOne({
      email,
      verificationCode: hashedCode,
      verificationExpires: { $gt: Date.now() }
    });

    if (!tempUser) {
      return res.json({ success: false, message: 'Invalid or expired verification code' });
    }

    // Check if username already exists
    const existingUsername = await userModel.findOne({ username });
    if (existingUsername && existingUsername._id.toString() !== tempUser._id.toString()) {
      return res.json({ success: false, message: 'Username already taken' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update user with registration details (whitelist only allowed fields)
    const allowedFields = { name, username, password: hashedPassword };
    Object.assign(tempUser, allowedFields);
    tempUser.emailVerified = true;
    tempUser.verificationCode = undefined;
    tempUser.verificationExpires = undefined;
    tempUser.subscriptionStatus = 'trial';
    tempUser.trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    if (!tempUser.hasUsedTrial) {
      tempUser.subscriptionStatus = 'trial';
      tempUser.trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      tempUser.hasUsedTrial = true;
    } else {
      tempUser.subscriptionStatus = 'expired';
    }

    const user = await tempUser.save();
    // Issue access token (1 day) and refresh token (30 days)
    const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    const refreshToken = jwt.sign({ id: user._id, type: 'refresh' }, process.env.JWT_SECRET, { expiresIn: '30d' });

    // Log successful registration
    logAuthSuccess(user._id, user.email, req.ip || 'unknown');

    const { password: _, ...userData } = user._doc;
    res.json({ success: true, token: accessToken, refreshToken, user: userData });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};


const loginUser=async(req,res)=>{
    try{
        const {email,password}=req.body;
        const user=await userModel.findOne({email})
        if(!user){
            // Log failed login attempt
            logAuthFailure(email, req.ip || 'unknown', 'User not found');
            return res.json({success:false,message:'Invalid email or password'})
        }
        
        // Check if account is locked
        if (user.lockUntil && user.lockUntil > Date.now()) {
            const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
            // Log locked account access attempt
            logAccountLockout(email, req.ip || 'unknown');
            return res.json({
                success: false,
                message: `Account is locked. Try again in ${minutesLeft} minutes.`
            });
        }
        
        const isMatch=await bcrypt.compare(password,user.password)

        if (isMatch) {
        // Issue access token (1 day) and refresh token (30 days)
        const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        const refreshToken = jwt.sign({ id: user._id, type: 'refresh' }, process.env.JWT_SECRET, { expiresIn: '30d' });
        
        // Reset login attempts on successful login
        if (user.loginAttempts > 0 || user.lockUntil) {
            user.loginAttempts = 0;
            user.lockUntil = undefined;
            await user.save();
        }
        
        // Log successful login
        logAuthSuccess(user._id, user.email, req.ip || 'unknown');
        
        const { password, ...userData } = user._doc;
        res.json({ success: true, token: accessToken, refreshToken, user: userData });
        }

        else{
            // Increment failed login attempts
            user.loginAttempts += 1;
            
            // Lock account after 5 failed attempts (15 minutes lockout)
            if (user.loginAttempts >= 5) {
                user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
                await user.save();
                // Log account lockout event
                logAccountLockout(email, req.ip || 'unknown');
                return res.json({
                    success: false,
                    message: 'Account locked due to too many failed attempts. Try again in 15 minutes.'
                });
            }
            
            await user.save();
            // Log failed login attempt
            logAuthFailure(email, req.ip || 'unknown', `Invalid password - ${5 - user.loginAttempts} attempts remaining`);
            return res.json({
                success: false,
                message: `Invalid email or password. ${5 - user.loginAttempts} attempts remaining.`
            });
        }
    } 
    catch(error){
        console.log(error);
        res.json({success:false,message:error.message})        
    }
}
const checkUsernameAvailability = async (req, res) => {
  try {
    const { username } = req.params
    const existingUser = await userModel.findOne({ username })

    if (existingUser) {
      return res.json({ available: false, message: 'Username already taken' })
    } else {
      return res.json({ available: true, message: 'Username available' })
    }
  } catch (error) {
    res.json({ available: false, message: error.message })
  }
}
const searchUsers = async (req, res) => {
  try {
    const { query } = req.params;
    // Search by both username and name (case-insensitive)
    const users = await userModel.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { name: { $regex: query, $options: 'i' } }
      ]
    }).select('username name email bio profilePicture _id').limit(20);

    res.json({ success: true, users });
  } catch (error) {
    console.error('Error searching users:', error);
    res.json({ success: false, message: error.message });
  }
};

const followUser = async (req, res) => {
  try {
    // CHANGE: Get userId from auth middleware, not req.body
    const { userId } = req.body; // The auth middleware should add this
    const { followId } = req.params;

    if (userId === followId) return res.json({ success: false, message: "Can't follow yourself" });

    const user = await userModel.findById(userId);
    const followUser = await userModel.findById(followId);

    if (!user || !followUser) return res.json({ success: false, message: "User not found" });

    if (user.following.includes(followId)) return res.json({ success: false, message: "Already following" });

    user.following.push(followId);
    followUser.followers.push(userId);

    await user.save();
    await followUser.save();

    // Create notification for the followed user
    await createNotificationHelper(followId, userId, 'follow');

    res.json({ success: true, message: `You are now following ${followUser.username}` });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const unfollowUser = async (req, res) => {
  try {
    // CHANGE: Get userId from auth middleware, not req.body
    const { userId } = req.body; // The auth middleware should add this
    const { unfollowId } = req.params;

    if (userId === unfollowId) return res.json({ success: false, message: "Can't unfollow yourself" });

    const user = await userModel.findById(userId);
    const targetUser = await userModel.findById(unfollowId);

    if (!user || !targetUser) return res.json({ success: false, message: "User not found" });

    if (!user.following.includes(unfollowId)) return res.json({ success: false, message: "You are not following this user" });

    // Remove from following/followers
    user.following = user.following.filter(id => id.toString() !== unfollowId);
    targetUser.followers = targetUser.followers.filter(id => id.toString() !== userId);

    await user.save();
    await targetUser.save();

    res.json({ success: true, message: `You unfollowed ${targetUser.username}` });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const getFriends = async (req, res) => {
  try {
    const { userId } = req.body;
    console.log('getFriends called for userId:', userId);
    
    if (!userId) {
      return res.json({ success: false, message: "User ID not found" });
    }
    
    const user = await userModel.findById(userId).populate('following', 'name username email bio profilePicture _id');

    if (!user) {
      console.log('User not found:', userId);
      return res.json({ success: false, message: "User not found" });
    }

    console.log('Found following:', user.following?.length || 0);
    res.json({ success: true, friends: user.following || [] });
  } catch (error) {
    console.error('Error in getFriends:', error);
    res.json({ success: false, message: error.message });
  }
};
const getUserSubscription=async(req,res)=>{
    try{
        const userId = req.body.userId
        const user=await userModel.findById(userId)
        
        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }
        
        const hasPremium = user.hasPremiumAccess();
        const now = new Date();
        
        console.log('User subscription check:', {
            userId,
            status: user.subscriptionStatus,
            plan: user.subscriptionPlan,
            trialEndsAt: user.trialEndsAt,
            currentTime: now,
            trialEndsAtTimestamp: user.trialEndsAt?.getTime(),
            currentTimestamp: now.getTime(),
            isTrialValid: user.trialEndsAt && user.trialEndsAt > now,
            hasPremium
        });
        
        res.json({
            success:true, 
            subscription: {
                status: user.subscriptionStatus,
                plan: user.subscriptionPlan,
                hasPremium,
                trialEndsAt: user.trialEndsAt,
                subscriptionEndDate: user.subscriptionEndDate
            },
            user:{name:user.name}
        })
    }catch(error){
        console.log('Error in getUserSubscription:', error.message)
        res.json(
            {success:false, message:error.message }
        )
    }
}
const razorpayInstance=new razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

const paymentRazorpay = async(req,res)=>{
    try{

        const {userId, planId} = req.body
        const userData = await userModel.findById(userId)
        if(!userId || !planId){
            res.json({success:false,message:'Missing Details'})
        }

        let plan, amount, date, duration  //intialization

        switch(planId){
            case 'Monthly':
                plan = 'monthly'
                amount=100 // ₹100
                duration=30 // days
                break;

            case 'Quarterly':
                plan = 'quarterly'
                amount=250 // ₹250
                duration=90 // days (3 months)
                break;

            case 'Yearly':
                plan = 'yearly'
                amount=1150 // ₹1150
                duration=365 // days
                break;

            default:
                return res.json({success:false,message:"Plan not found"}) ;
        }
        date=Date.now();   //store current time stamp

        const transactionData={
            userId,plan,amount,date,duration  //store this transaction data in mongodb
        }

        const newTransaction= await transactionModel.create(transactionData)

        const options={
                amount: amount * 100,
                currency: process.env.CURRENCY,
                receipt: newTransaction._id,   //auto-generated by mongodb
                
            }

        await razorpayInstance.orders.create(options,(error,order)=>{
            if(error){
                console.log(error);
                return res.json({success:false,message:error.message})
            }
            res.json({success:true, order})
        })

    }catch(error){
        console.log(error);
        res.json({success:false,message:error.message})
        
    }
}
const verifyRazorpay=async(req,res)=>{
    try{
        const {razorpay_order_id}=req.body;
        const orderInfo=await razorpayInstance.orders.fetch(razorpay_order_id)
        if(orderInfo.status==='paid'){
            const transactionData=await transactionModel.findById(orderInfo.receipt)
            if(transactionData.payment){
                // Log duplicate payment attempt
                logPaymentAttempt(transactionData.userId, transactionData.plan, transactionData.amount, false);
                return res.json({success:false,message:"Payment Failed"})
            }
            const userData=await userModel.findById(transactionData.userId)
            
            // Calculate subscription end date based on duration
            const now = new Date();
            const endDate = new Date(now.getTime() + transactionData.duration * 24 * 60 * 60 * 1000);
            
            // Update user subscription
            await userModel.findByIdAndUpdate(userData._id,{
                subscriptionStatus: 'active',
                subscriptionPlan: transactionData.plan,
                subscriptionStartDate: now,
                subscriptionEndDate: endDate,
                trialEndsAt: null // Clear trial when paid subscription starts
            })
            await transactionModel.findByIdAndUpdate(transactionData._id,{payment:true})
            // Log successful payment
            logPaymentAttempt(userData._id, transactionData.plan, transactionData.amount, true);
            res.json({success:true,message:"Subscription Activated"})
        }else{
            // Log failed payment
            const transactionData = await transactionModel.findById(orderInfo.receipt);
            if (transactionData) {
                logPaymentAttempt(transactionData.userId, transactionData.plan, transactionData.amount, false);
            }
            res.json({success:false,message:"Payment Failed"})
        }
    }catch(error){
        console.log(error);
        res.json({success:false,message:error.message})
        
    }
}
// export {registerUser, loginUser, checkUsernameAvailability,searchUsers,followUser,unfollowUser,getFriends,getUser,userCredits,paymentRazorpay,verifyRazorpay}

const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Find user and populate followers and following, exclude password
    const user = await userModel.findById(userId)
      .select('-password')
      .populate('followers', 'name email username profilePicture bio')
      .populate('following', 'name email username profilePicture bio');
    
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error fetching user profile" });
  }
};

// Forgot Password - Send reset token via email
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.json({ success: false, message: 'Email is required' });
    }

    // Find user by email
    const user = await userModel.findOne({ email });
    if (!user) {
      // Generic message to prevent email enumeration
      return res.json({ success: true, message: 'If an account exists with this email, a reset code has been sent.' });
    }

    // Log password reset request
    logPasswordReset(email, req.ip || 'unknown');

    // Generate reset token (6-digit code for simplicity)
    const resetToken = crypto.randomInt(100000, 999999).toString();
    
    // Hash token before saving (for security)
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Save hashed token and expiry to user (expires in 15 minutes)
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    // Setup email transporter (using Gmail as example)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Your email
        pass: process.env.EMAIL_PASS  // Your email app password
      }
    });

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'BookWormed - Password Reset Request',
      html: `
        <h2>Password Reset Request</h2>
        <p>Hi ${user.name},</p>
        <p>You requested to reset your password. Use the following code to reset it:</p>
        <h1 style="color: #2563eb; letter-spacing: 5px;">${resetToken}</h1>
        <p>This code will expire in 15 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <br>
        <p>Best regards,<br>BookWormed Team</p>
      `
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.json({ 
      success: true, 
      message: 'Password reset code sent to your email' 
    });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: 'Error sending reset email. Please try again.' });
  }
};

// Reset Password - Verify token and update password
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.json({ success: false, message: 'Token and new password are required' });
    }

    // Password strength validation
    if (newPassword.length < 8) {
      return res.json({ success: false, message: 'New password must be at least 8 characters long' });
    }
    
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
    if (!passwordRegex.test(newPassword)) {
      return res.json({ success: false, message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' });
    }

    // Hash the provided token to compare with stored hashed token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with matching token and valid expiry
    const user = await userModel.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.json({ success: false, message: 'Invalid or expired reset token' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password and clear reset token fields
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ 
      success: true, 
      message: 'Password reset successfully! You can now login with your new password.' 
    });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: 'Error resetting password. Please try again.' });
  }
};

// Send Email Verification Code
const sendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.json({ success: false, message: 'Email is required' });
    }

    // Validate Gmail only
    if (!email.toLowerCase().endsWith('@gmail.com')) {
      return res.json({ success: false, message: 'Only Gmail addresses are allowed' });
    }

    // Check if email already exists and is verified
    const existingUser = await userModel.findOne({ email, emailVerified: true });
    if (existingUser) {
      return res.json({ success: false, message: 'Email already registered' });
    }

    // Generate 6-digit verification code
    const verificationCode = crypto.randomInt(100000, 999999).toString();
    const hashedCode = crypto.createHash('sha256').update(verificationCode).digest('hex');

    // Create or update temporary user record
    let tempUser = await userModel.findOne({ email });
    if (tempUser) {
      tempUser.verificationCode = hashedCode;
      tempUser.verificationExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
      await tempUser.save();
    } else {
      tempUser = new userModel({
        email,
        verificationCode: hashedCode,
        verificationExpires: Date.now() + 15 * 60 * 1000,
        emailVerified: false,
        name: 'temp',
        username: 'temp_' + Date.now(),
        password: 'temp'
      });
      await tempUser.save();
    }

    // Setup email transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'BookWormed - Email Verification',
      html: `
        <h2>Welcome to BookWormed!</h2>
        <p>Thank you for signing up. Please use the following code to verify your email:</p>
        <h1 style="color: #2563eb; letter-spacing: 5px;">${verificationCode}</h1>
        <p>This code will expire in 15 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <br>
        <p>Best regards,<br>BookWormed Team</p>
      `
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.json({ 
      success: true, 
      message: 'Verification code sent to your email' 
    });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: 'Error sending verification email. Please try again.' });
  }
};

// Refresh Token - Generate new access token from refresh token
const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token required' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    
    // Ensure it's actually a refresh token
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ success: false, message: 'Invalid token type' });
    }

    // Check if user still exists
    const user = await userModel.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    // Issue new access token (1 day)
    const newAccessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.json({ 
      success: true, 
      token: newAccessToken,
      message: 'Access token refreshed successfully'
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }
    console.log(error);
    res.status(500).json({ success: false, message: 'Error refreshing token' });
  }
};

export {registerUser, loginUser, checkUsernameAvailability,searchUsers,followUser,unfollowUser,getFriends,getUser,getUserProfile,getUserSubscription,paymentRazorpay,verifyRazorpay,forgotPassword,resetPassword,sendVerificationCode,refreshAccessToken}
