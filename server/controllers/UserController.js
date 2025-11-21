import userModel from "../models/userModel.js"
import transactionModel from "../models/transactionModel.js"
import razorpay from 'razorpay';
import bcrypt from 'bcryptjs'    //password protection
import jwt from 'jsonwebtoken'   //user authentication
import { createNotificationHelper } from './NotificationController.js';
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
    const { name,username ,email, password } = req.body;

    // Check missing fields
    if (!name ||!username || !email ||  !password) {
      return res.json({ success: false, message: 'Missing Details' });
    }

    // Check if email already exists
    const existingEmail = await userModel.findOne({ email });
    if (existingEmail) {
      return res.json({ success: false, message: 'Email already registered' });
    }

    // Check if username already exists
    const existingUsername = await userModel.findOne({ username });
    if (existingUsername) {
      return res.json({ success: false, message: 'Username already taken' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(5);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new userModel({
      name,
      username,
      email,
      password: hashedPassword,
      subscriptionStatus: 'trial',
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    });

    const user = await newUser.save();
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    // Send response
    // res.json({
    //   success: true,
    //   token,
    //   user: {
    //     name: user.name,
    //     username: user.username
    //   }
    // });
    const { password: _, ...userData } = user._doc;
    res.json({ success: true, token, user: userData });

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
            return res.json({success:false,message:'User DNE'})
        }
        const isMatch=await bcrypt.compare(password,user.password)

        if (isMatch) {
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
        // res.json({
        //     success: true,
        //     token,
        //     user: {
        //     name: user.name,
        //     username: user.username
        //     }
        // });
        const { password, ...userData } = user._doc;
        res.json({ success: true, token, user: userData });
        }

        else{
            return res.json({success:false,message:'Invalid credentials',password:{password:user.password}})
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
            res.json({success:true,message:"Subscription Activated"})
        }else{
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

export {registerUser, loginUser, checkUsernameAvailability,searchUsers,followUser,unfollowUser,getFriends,getUser,getUserProfile,getUserSubscription,paymentRazorpay,verifyRazorpay}
