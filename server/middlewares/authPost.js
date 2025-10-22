// Enhanced auth middleware for posts - includes user name
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';

const authUser = async (req, res, next) => {
  const { token } = req.headers;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not Authorized. Login again'
    });
  }

  try {
    const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);
    
    if (tokenDecode.id) {
      // Fetch user to get the name
      const user = await userModel.findById(tokenDecode.id).select('name username');
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found. Login Again'
        });
      }

      req.userId = tokenDecode.id;
      req.userName = user.name || user.username;
      next();
    } else {
      return res.status(401).json({
        success: false,
        message: 'Not Authorized. Login Again'
      });
    }
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message
    });
  }
};

export default authUser;
