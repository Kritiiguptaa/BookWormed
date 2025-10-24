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
    userCredits,
    paymentRazorpay,
    verifyRazorpay
} from '../controllers/UserController.js';
import userAuth from '../middlewares/auth.js';
const userRouter = express.Router();

userRouter.post('/register', registerUser);
userRouter.post('/login', loginUser);
userRouter.get('/check-username/:username', checkUsernameAvailability);
userRouter.get('/search/:query', searchUsers);
userRouter.get('/profile/:userId', getUserProfile);
userRouter.post('/follow/:followId', userAuth, followUser);
userRouter.post('/unfollow/:unfollowId', userAuth, unfollowUser);
// userRouter.get('/friends/:userId', userAuth, getFriends);
userRouter.get('/friends/', userAuth, getFriends);
userRouter.get('/get', userAuth, getUser);
userRouter.get('/credits', userAuth, userCredits)
userRouter.post('/pay-razor', userAuth, paymentRazorpay)
userRouter.post('/verify-razor', verifyRazorpay)

export default userRouter;
