const {validationResult }=require("express-validator")
const gov = require('../models/governorates_mod');
const httpstatus=require("../utils/httpstatus");
const asyncfn=require("../middleware/asyncwrapper");
const apperror=require("../utils/app_error");

const getALLgov=async(req,res)=>{
    const query=req.query;
    const limit=query.limit||6;
    const page=query.page||1;
    const skip=(page - 1)*limit;

    const goves=await gov.find({},{"__v":false}).limit(limit).skip(skip);
    res.json({status:httpstatus.suc,data:{goves}});
}
const getgoves=asyncfn(
    async(req,res)=>{
        const gove=await gov.findById(req.params.id);
        if(!gove){
           const error= apperror.create("governorate not found",404,httpstatus.Fail)
            return next(error)
         }
        return res.json({status:httpstatus.suc,data:{gove}})}
)

const addgove=asyncfn(async (req,res,next)=>{
    console.log(req.body);
    const errors=validationResult(req);
    if(!errors.isEmpty()){
        const error=apperror.create(errors.array(),400,httpstatus.Fail)
        return next(error);
    }
    

    const newgove=new gov(req.body);

    await newgove.save();
    res.status(201).json({status:httpstatus.suc,data:newgove})
})
const addTofav=asyncfn(async (req,res,next)=>{
    const { id } = req.params;

    try {
        const gove= await gov.findById(id);

        if (!gove) {
            return res.status(404).json({ error: 'الموقع غير موجود' });
        }

        // تحديث حالة التفضيل للمطعم
        gove.hotels.forEach(hotels => {
            if (hotels._id == req.body.hotelsId) {
                hotels.isFavorite = !hotels.isFavorite;
            }
        });
        gove.Restaurants.forEach(restaurant => {
            if (restaurant._id == req.body.restaurantId) {
                restaurant.isFavorite = !restaurant.isFavorite;
            }
        });
        gove.museums.forEach(museums => {
            if (museums._id == req.body.museumsId) {
                museums.isFavorite = !museums.isFavorite;
            }
        });
        gove.historicalsites.forEach(historicalsites => {
            if (historicalsites._id == req.body.historicalsitesId) {
                historicalsites.isFavorite = !restaurant.isFavorite;
            }
        });

        await gove.save();

        res.status(200).json({ message: 'تم تحديث حالة التفضيل للمطعم بنجاح' });
    } catch (err) {
        res.status(500).json({ error: 'حدث خطأ أثناء تحديث حالة التفضيل للمطعم' });
    }
  
 
});
const getFavorites = async (req, res) => {
    try {
        const favorites = await gov.find({
            $or: [
                { 'Restaurants.isFavorite': true },
                { 'hotels.isFavorite': true },
                { 'museums.isFavorite': true },
                { 'historicalsites.isFavorite': true }
            ]
        }, {
            '_id': 0, // استبعاد حقل الهوية لعدم إظهاره
            'Restaurants.isFavorite': 1,
            'hotels.isFavorite': 1,
            'museums.isFavorite': 1,
            'historicalsites.isFavorite': 1
        });

        res.status(200).json(favorites);
    } catch (err) {
        res.status(500).json({ error: 'حدث خطأ أثناء جلب بيانات التفضيلات' });
    }
};

const updategove=asyncfn(async(req,res)=>{
 
        const govid=req.params.id;

         const gove=await gov.updateOne({_id:govid},{$set:{...req.body}});

        return  res.status(200).json({status:httpstatus.suc,data:gove});


})

const deletegove=asyncfn(async(req,res)=>{
   const govid=req.params.id;
    const delone=await gov.deleteOne({_id:govid})


    res.status(200).json({status:httpstatus.suc,data:null});
 } )
 module.exports={
    getALLgov,
    getgoves,
    addgove,
    updategove,
    deletegove,
    addTofav,
   getFavorites
 }