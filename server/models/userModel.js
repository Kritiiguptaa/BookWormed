import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    username: { type: String, unique: true, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }]
}, { timestamps: true 
    
});


const userModel = mongoose.models.user || mongoose.model("user", userSchema)

export default userModel;

