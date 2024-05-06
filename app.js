
require('dotenv').config()
const express=require("express");
const app=express();
const cors=require('cors');
const httpser=require("./utils/httpstatus")
const mongoose=require('mongoose');
const path=require('path');
const url=process.env.mongo_url;
const gov_router=require("./routes/gov_route");
const user_router=require('./routes/user_routes');
mongoose.connect(url).then(()=>{
    console.log("data base okkk");
})
app.use('/uploads',express.static(path.join(__dirname,'uploads')))

app.use(cors())
app.use(express.json())


app.use('/api/gove',gov_router);
app.use('/api/user',user_router);
app.all("*",(req,res)=>{
    return res.status(404).json({status:httpser.ERR,data:null,Message:"this resourse not avalible",code:404});
})
//global error handler
app.use((error,req,res,next)=>{
    res.status(error.statusCode||500).json({status:error.statusText||httpser.ERR,message:error.message,code:error.statusCode||500,data:null });
})
app.listen(process.env.port||4000,()=>{
    console.log("ser is ok");
     
    })