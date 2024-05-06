const express = require('express');
const router = express.Router();
const user_con = require('../controller/user_con');
const veryfiy = require("../middleware/veryfiyToken");
const multer = require('multer')
const { storage, filefilter, profilePhotoUploud } = require("../controller/avatar_con");
const upload = multer({ storage, filefilter });
router.route('/')
    .get(veryfiy, user_con.getAllusers)
router.route('/verifyMessage/:token')  //=>
    .get(user_con.verifyMessage)
router.route('/forgotPassword')   //=>
    .post(user_con.forgotPassword)
router.route('/resetPassword')   //=>
    .patch(user_con.resetPassword)
router.route('/register')//=>
    .post(upload.single('avatar'), user_con.register)
router.route('/login')
    .post(user_con.login)
router.route("/:id")
    .get(user_con.getuser)
    .patch(veryfiy, upload.single('avatar'), profilePhotoUploud, user_con.updateuser) //=>
    .delete(veryfiy, user_con.deleteuser)
router.route("/update-password/:id")
    .get(user_con.getuser)
    .patch(veryfiy, user_con.updatepassword)

module.exports = router;