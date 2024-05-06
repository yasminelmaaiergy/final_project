const jwt=require('jsonwebtoken')



module.exports=async(payload)=>{
   const token= jwt.sign(payload,process.env.jwt_secret_key,{expiresIn:"24h"});
   return token;
}

