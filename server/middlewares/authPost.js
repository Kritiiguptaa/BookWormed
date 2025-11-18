// Enhanced auth middleware for posts - includes user name
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';

const authUser = async (req, res, next) => {
<<<<<<< HEAD
  const { token } = req.headers;
=======
  // Accept token either as `token` header or `Authorization: Bearer <token>`
  let token = req.headers.token;
  if (!token && req.headers.authorization) {
    const parts = String(req.headers.authorization).split(' ');
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      token = parts[1];
    }
  }
>>>>>>> origin/master

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not Authorized. Login again'
    });
  }

  try {
    const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);
<<<<<<< HEAD
    
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
=======
    if (tokenDecode && tokenDecode.id) {
      if (process.env.NODE_ENV !== 'production') {
        try {
          console.log('[authUser] token decoded id=', tokenDecode.id);
        } catch (e) {
          /* ignore */
        }
      }
      // Fetch user to get the username
      const user = await userModel.findById(tokenDecode.id).select('username');
      if (!user) {
        return res.status(401).json({ success: false, message: 'User not found. Login Again' });
      }

      req.userId = tokenDecode.id;
      req.userName = user.username;
      next();
    } else {
      return res.status(401).json({ success: false, message: 'Not Authorized. Login Again' });
    }
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
>>>>>>> origin/master
  }
};

export default authUser;
