import express from 'express';
import rateLimit from 'express-rate-limit';
import {
    registerUser,
    loginUser,
    checkUsernameAvailability,
    searchUsers,
    followUser,
    unfollowUser,
    getFriends,
    getUser,
    getUserProfile,
    getUserSubscription,
    paymentRazorpay,
    verifyRazorpay,
    forgotPassword,
    resetPassword,
    sendVerificationCode,
    refreshAccessToken,
    updateProfile,
    changePassword,
    deleteAccount,
    blockUser,
    unblockUser,
    getBlockedUsers
} from '../controllers/UserController.js';
import userAuth from '../middlewares/auth.js';
const userRouter = express.Router();

// Email rate limiter for forgot password and verification
const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour per IP
  message: { success: false, message: 'Too many email requests. Please try again after 1 hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

userRouter.post('/send-verification', emailLimiter, sendVerificationCode);
// Email rate limiter for forgot password and verification
// const emailLimiter = rateLimit({
//   windowMs: 60 * 60 * 1000, // 1 hour
//   max: 3, // 3 requests per hour per IP
//   message: { success: false, message: 'Too many email requests. Please try again after 1 hour.' },
//   standardHeaders: true,
//   legacyHeaders: false,
// });

userRouter.post('/send-verification', emailLimiter, sendVerificationCode);
userRouter.post('/register', registerUser);
userRouter.post('/login', loginUser);
userRouter.post('/refresh-token', refreshAccessToken);
userRouter.post('/forgot-password', emailLimiter, forgotPassword);
userRouter.post('/reset-password', resetPassword);
userRouter.get('/check-username/:username', checkUsernameAvailability);
userRouter.get('/search/:query', searchUsers);
userRouter.get('/profile/:userId', getUserProfile);
userRouter.post('/follow/:followId', userAuth, followUser);
userRouter.post('/unfollow/:unfollowId', userAuth, unfollowUser);
// userRouter.get('/friends/:userId', userAuth, getFriends);
userRouter.get('/friends/', userAuth, getFriends);
userRouter.get('/get', userAuth, getUser);
userRouter.get('/subscription', userAuth, getUserSubscription)
userRouter.post('/pay-razor', userAuth, paymentRazorpay)
userRouter.post('/verify-razor', verifyRazorpay)
userRouter.put('/profile', userAuth, updateProfile)
userRouter.put('/change-password', userAuth, changePassword)
userRouter.delete('/account', userAuth, deleteAccount)
userRouter.post('/block/:blockUserId', userAuth, blockUser)
userRouter.delete('/block/:unblockUserId', userAuth, unblockUser)
userRouter.get('/blocked-users', userAuth, getBlockedUsers)

export default userRouter;
