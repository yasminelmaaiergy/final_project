const app_error = require("../utils/app_error");

module.exports=(...roles)=>{
    console.log("roles",roles);
    return (req,res,next)=>{
       if(!roles.includes( req.currentUser.role)){
        return next(app_error.create("this role is not authurized",401))
       }
        next();
    }
}