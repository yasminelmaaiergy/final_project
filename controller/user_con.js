const asyncfn = require("../middleware/asyncwrapper");
const User = require('../models/usrer_mod');
const httpstatus = require("../utils/httpstatus");
const apperror = require("../utils/app_error");
const cloudinary = require("../utils/cloudinary");
const jwt = require('jsonwebtoken')
const sendMail = require('../utils/email');
const genratejwt = require('../utils/genrate_jwt');
const generateJWT = require('../utils/genrate_jwt');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const getAllusers = asyncfn(async (req, res) => {
    // get all user from DB using model
    const query = req.query;
    const limit = query.limit || 4;
    const page = query.page || 1;
    const skip = (page - 1) * limit;
    //hide password
    const users = await User.find({}, { "__v": false, "password": false }).limit(limit).skip(skip);
    res.json({ status: httpstatus.suc, data: { users } });
});
const getuser = asyncfn(
    async (req, res, next) => {
        const users = await User.findById(req.params.id);
        if (!users) {
            const error = apperror.create("governorate not found", 404, httpstatus.Fail)
            return next(error)
        }
        return res.json({ status: httpstatus.suc, data: { users } })
    }
)
const register = asyncfn(async (req, res, next) => {
    console.log(req.body);

    const { fullname, email, password, passwordConfirm, role, } = req.body;
    const olduser = await User.findOne({ email: email });
    if (olduser) {
        const error = apperror.create("user already founded", 404, httpstatus.Fail)
        return next(error)
    }
    /*************************save a URL photo from cloudinary***********************************************/
    const imagePath = path.join(__dirname, `../uploads/${req.file.filename}`)
    const result = await cloudinary.CloudinaryUploudImage(imagePath);
    const newUser = new User({
        fullname,
        email,
        password,
        passwordConfirm,
        role,
        avatar: [result.secure_url, result.public_id] //req.file.filename
    })
    fs.unlinkSync(imagePath); // remove an image from file uplouds

    const EMAIL_VALID = newUser.email.split('@')[1];   //=>
    if (EMAIL_VALID === "gmail.com") {
        // generate JWT ===>> require('crypto').randomBytes(32).toString('hex');
        const token = await generateJWT({ email: newUser.email, id: newUser._id, role: newUser.role });
        newUser.token = token;
        await newUser.save();
        const link = `${req.protocol}://${req.headers.host}/api/user/verifyMessage/${token}`;
        const meanMessage = `Thank you for your registration!<br/><br/>We hope that this application will help you find the best places, tourist attractions, hotels, and upscale restaurants in Egypt.<br /><br />We hope that you will visit us soon and enjoy your trip.<br/><br/>`;
        const firstName = newUser.fullname.split(' ')[0];
        try {
            await sendMail({
                email: email,
                subject: "EGYPTOUR.com",
                text: "Successfully Register with us.",
                html: `<p><h2>Welcome ${firstName}!<h2/><br/>${meanMessage}Please verify your account <a href='${link}'>open here.</a><br></br></p>`,
            })
            console.log("you should receive an email");
            return res.status(201).json({
                status: httpstatus.suc, data: { user: newUser },
                msg: "you should receive an email",
                //info: info.messageId,
                //preview: nodemailer.getTestMessageUrl(info)
            })
        } catch (error) {
            return res.status(500).json({ error });
        }
    } else {
        const error = apperror.create('You must send a valid email', 400, httpstatus.Fail);
        return next(error);
    }
});
//login ==> token >> id :)
// user == id
// user.isVerified
// isVerified == false
// send new code
// return message to front end
// isVerified == true
// return token to front end
const login = asyncfn(async (req, res, next) => {
    try {
        console.log(req.body);
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        const token = await genratejwt({ email: user.email, id: user._id, role: user.role });
        if (user.activateEmail === true) {
            const matchpassword = await bcrypt.compare(password, user.password);
            if (matchpassword) {
                res.json({ status: httpstatus.suc, data: { id: user._id, token } });
            } else {
                next(apperror.create("Unauthorized", 401, httpstatus.ERR));
            }
        } else {
            try {
                console.log(user.activateEmail, user.email)
                const link = `${req.protocol}://${req.headers.host}/api/user/verifyMessage/${token}`;
                const meanMessage = `Thank you for your registration!<br/><br/>We hope that this application will help you find the best places, tourist attractions, hotels, and upscale restaurants in Egypt.<br /><br />We hope that you will visit us soon and enjoy your trip.<br/><br/>`;
                const firstName = user.fullname.split(' ')[0];
                await sendMail({
                    email: user.email,
                    subject: "EGYPTOUR.com",
                    text: "Successfully Register with us.",
                    html: `<p><h2>Welcome ${firstName}!<h2/><br/>${meanMessage}Please verify your account <a href='${link}'>open here.</a><br></br></p>`,
                })
                return res.status(201).json({
                    status: httpstatus.suc,
                    msg: "you should receive an email again and open the URL"
                });
            } catch (error) {
                return res.status(500).json({ error });
            }
        }
    } catch (error) {
        next(apperror.create(error.message, 500, httpstatus.ERR));
    }
});

const updateuser = async (req, res, next) => {
    const userid = req.params.id;
    const updateFields = {};
    // Loop through req.body and add fields with values to the updateFields object
    for (const [key, value] of Object.entries(req.body)) {
        if (value !== null && value !== undefined) {
            updateFields[key] = value;
        }
    }

    delete updateFields.email;
    const user = await User.findOneAndUpdate({ _id: userid }, { $set: updateFields }, { new: true });
    const { password, __v, ...userWithoutPassword } = user.toObject();
    userWithoutPassword.id = userWithoutPassword._id;
    delete userWithoutPassword._id;
    return res.status(200).json({ status: httpstatus.suc, data: { user: userWithoutPassword } });
}

const updatepassword = asyncfn(async (req, res, next) => {
    const userid = req.params.id;
    const { oldpassword, newpassword } = req.body;
    const user = await User.findById(userid);
    const matchpassword = await bcrypt.compare(oldpassword, user.password);
    if (!matchpassword) {
        const error = apperror.create("passowrd does not match", 500, httpstatus.ERR)
        return next(error)
    }
    const hashpass = await bcrypt.hash(newpassword, 10);
    const users = await User.updateOne({ _id: userid }, { $set: { password: hashpass } });
    const updatedToken = await genratejwt({ email: user.email, id: user._id, role: user.role });
    return res.status(200).json({ status: httpstatus.suc, data: { users, token: updatedToken } });
});
const deleteuser = asyncfn(async (req, res) => {
    const userid = req.params.id;
    const delone = await User.deleteOne({ _id: userid })
    res.status(200).json({ status: httpstatus.suc, data: null });
});
const verifyMessage = asyncfn(async (req, res, next) => {   //=>
    try {
        const { token } = req.params;
        const decoder = jwt.verify(token, process.env.jwt_secret_key);
        if (!decoder) {
            res.status(401).json(apperror.create('invalid token', 401, httpstatus.ERR));
        } else {
            let user = "";
            if (decoder.role === "USER") {
                user = await User.findOneAndUpdate(
                    { id: decoder._id, activateEmail: false },
                    { activateEmail: true }
                );
            }
            if (!user) {
                res.status(400).json(apperror.create('email already confirmed or invalid token', 400, httpstatus.ERR));
            } else {
                res.status(201).json({ status: httpstatus.suc, msg: "confirmed succeed" });
            }
        }
    } catch (error) {
        const err = apperror.create('invalid token', 401, httpstatus.ERR)
        return next(err);
    }
});
const forgotPassword = asyncfn(async (req, res, next) => {    //=>
    //1)get user based on your email
    const user = await User.findOne({ email: req.body.email })
    if (!user) {
        const error = apperror.create('user not found', 404, httpstatus.Fail);
        return next(error);
    }
    //2)generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    //3)send it to user's email
    const message = `<p><h2>Password reset!<h2/><br/>Someone requested that the password be reset for the following account:<br/>
    to reset your password, use this code:  ${resetToken} <br/><br/>Your email: ${user.email}.<br/><br/>If this is a mistake, just ignore this email and nothing will happen!<p\>`;
    try {
        await sendMail({
            email: user.email,
            subject: 'Your password reset (valid for 10 min)',
            text: "Successfully",
            html: `${message}`
        })
        res.status(200).json({ status: httpstatus.suc, msg: "Token sent to email!" });
    } catch {
        user.PasswordResetToken = undefined;
        user.PasswordResetExpires = undefined;
        const err = apperror.create('there was an error sending the email. try again later!', 500, httpstatus.ERR)
        return next(err);
    }
});
const resetPassword = asyncfn(async (req, res, next) => {    //=>

    const email = req.body.email;
    const user = await User.findOne({ email });
    if (!user) {
        const error = apperror.create('user not found', 404, httpstatus.Fail);
        return next(error);
    }

    const resetToken = req.body.code;
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    if (user.PasswordResetToken !== hashedToken || user.PasswordResetExpires < Date.now()) {
        const error = apperror.create('the code is invalid or has expired', 404, httpstatus.Fail);
        return next(error);
    }

    user.code = req.body.code;
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.PasswordResetToken = undefined;
    user.PasswordResetExpires = undefined;
    await user.save();
    const token = await generateJWT({ id: user._id });
    return res.status(201).json({ status: httpstatus.suc, data: { token } });
});
module.exports = {
    getAllusers,
    getuser,
    register,
    login,
    updateuser,
    deleteuser,
    updatepassword,
    verifyMessage,
    forgotPassword,
    resetPassword,
}