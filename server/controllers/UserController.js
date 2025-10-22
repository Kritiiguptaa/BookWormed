import userModel from "../models/userModel.js"
// import transactionModel from "../models/transactionModel.js"
// import razorpay from 'razorpay';
import bcrypt from 'bcryptjs'    //password protection
import jwt from 'jsonwebtoken'   //user authentication
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
      password: hashedPassword
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
    const users = await userModel.find({
      username: { $regex: query, $options: 'i' } // case-insensitive search
    }).select('username name _id'); // only send username, name, id

    res.json({ success: true, users });
  } catch (error) {
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
    const { userId } = req.body; // userAuth adds this from the token
    const user = await userModel.findById(userId).populate('following', 'name username _id');

    if (!user) return res.json({ success: false, message: "User not found" });

    res.json({ success: true, friends: user.following });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export {registerUser, loginUser, checkUsernameAvailability,searchUsers,followUser,unfollowUser,getFriends,getUser}
