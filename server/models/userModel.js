import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    username: { type: String, unique: true, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }],
    
    // Subscription fields
    subscriptionStatus: { 
      type: String, 
      enum: ['trial', 'active', 'expired', 'cancelled'], 
      default: 'trial' 
    },
    subscriptionPlan: { 
      type: String, 
      enum: ['free', 'monthly', 'quarterly', 'yearly'], 
      default: 'free' 
    },
    subscriptionStartDate: { type: Date },
    subscriptionEndDate: { type: Date },
    trialEndsAt: { type: Date },
    
    // Password reset fields
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    
    // Email verification fields
    emailVerified: { type: Boolean, default: false },
    verificationCode: { type: String },
    verificationExpires: { type: Date }
}, { timestamps: true 
    
});

// Method to check if user has active premium access
userSchema.methods.hasPremiumAccess = function() {
  const now = new Date();
  
  // Check if in trial period
  if (this.subscriptionStatus === 'trial' && this.trialEndsAt && this.trialEndsAt > now) {
    return true;
  }
  
  // Check if has active subscription
  if (this.subscriptionStatus === 'active' && this.subscriptionEndDate && this.subscriptionEndDate > now) {
    return true;
  }
  
  return false;
};


const userModel = mongoose.models.user || mongoose.model("user", userSchema)

export default userModel;

