import mongoose from 'mongoose';
import userModel from '../models/userModel.js';
import dotenv from 'dotenv';

dotenv.config();

const updateExistingUsersWithTrial = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all users who have trial status but no trialEndsAt date
    const usersToUpdate = await userModel.find({
      $or: [
        { trialEndsAt: { $exists: false } },
        { trialEndsAt: null }
      ]
    });

    console.log(`Found ${usersToUpdate.length} users without trial end dates`);

    // Update each user
    for (const user of usersToUpdate) {
      const trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
      
      await userModel.findByIdAndUpdate(user._id, {
        subscriptionStatus: 'trial',
        subscriptionPlan: 'free',
        trialEndsAt: trialEndsAt
      });

      console.log(`Updated user ${user.email} - Trial ends at: ${trialEndsAt}`);
    }

    console.log('Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

updateExistingUsersWithTrial();
