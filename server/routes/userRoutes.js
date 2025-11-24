import express from 'express';
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
    sendVerificationCode
} from '../controllers/UserController.js';
import userAuth from '../middlewares/auth.js';
const userRouter = express.Router();

userRouter.post('/send-verification', sendVerificationCode);
userRouter.post('/register', registerUser);
userRouter.post('/login', loginUser);
userRouter.post('/forgot-password', forgotPassword);
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

export default userRouter;
