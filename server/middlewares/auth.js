// Finding user id using Json Web Token
import jwt from 'jsonwebtoken'

const userAuth=async(req,res,next)=>{
    const {token}=req.headers;

    if(!token){
        return res.status(401).json({
            success: false, message:'Not Authorized. Login again'
        })
    }
    try{
        const tokenDecode=jwt.verify(token,process.env.JWT_SECRET)
        if(tokenDecode.id){
            req.body.userId=tokenDecode.id;
        }else{
            return res.status(401).json({success:false,message:'Not Authorized. Login Again'})
        }
        next();
    }
    catch(error){
        return res.status(401).json({success:false,message:'Invalid or expired token'});
    }
};
export default userAuth