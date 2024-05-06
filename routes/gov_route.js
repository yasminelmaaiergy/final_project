const express=require('express');
const {body }=require("express-validator")
const router=express.Router();
const gove_con=require('../controller/gov_con');
const  veryfiyToken=require("../middleware/veryfiyToken")
const allowedto=require("../middleware/allowedto");
const userrolr = require('../utils/role_login');

router.route('/')
.get(veryfiyToken,gove_con.getALLgov)
.post(gove_con.addgove)
router.route('/fav')
.get(gove_con.getFavorites)
.post(gove_con.addTofav);


// .post(body('title').notEmpty().withMessage("tit is req").isLength({min:2}),body('price').notEmpty(),gove_con.addgove);

router.route("/:id").get(veryfiyToken,gove_con.getgoves)
.patch(veryfiyToken,allowedto(userrolr.ADMIN,userrolr.MANAGER),gove_con.updategove)
.delete(veryfiyToken,allowedto(userrolr.ADMIN,userrolr.MANAGER),gove_con.deletegove)


module.exports=router;