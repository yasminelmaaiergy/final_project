const mongoose = require('mongoose');
const validator = require('validator');
const userrolr = require('../utils/role_login');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { type } = require('os');
const resetToken = crypto.randomBytes(4).toString('hex'); //=>

const userschema = new mongoose.Schema({
    fullname: {
        type: String,
        required: [true, 'Please provide your full name'],
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        validate: [validator.isEmail, 'filed must be a valid email address']
    },
    password: {
        type: String,
        required: [true, 'please provide a password'], //=>
        minlength: 8,
    },
    passwordConfirm: {  //=>
        type: String,
        required: [false, 'please confirm your password'],
        //this only works on creat and save!!
        validate: [{
            validator: function (el) {
                return el === this.password;
            },
            message: "Passwords are not the same!"
        }]
    },
    avatar: [{
        type: String,
        default:'uploads/profile.jpeg',
        public_id : String,
        default: null
    }],
    PasswordResetToken: String,  //=>
    PasswordResetExpires: String,  //=>
    code: {
        type: String,
        required: [false, 'please enter the code where sent to your email'],
        validate: [{
            validator: function (el) {
                return el === resetToken;
            },
            message: "the code is not correct!"
        }]
    },
    passwordChangeAt: Date,
    token: {
        type: String
    },
    role: {
        type: String,
        enum: [userrolr.ADMIN, userrolr.MANAGER, userrolr.USER],
        default: userrolr.USER
    },
    activateEmail: {
        type: Boolean,
        default: false
    },
    gender: {
        type: String
    },
    location: {
        type: String
    },
    phonenumber: {
        type: String
    },
    nationality: {
        type: String
    },
    dateofbirth: {
        type: String
    },
    websiteurl: {
        type: String
    },
    company: {
        type: String
    },
    otherwebsite: {
        type: String
    },
    token: {
        type: String
    }
});
userschema.pre('save', async function (next) {   //=>
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10); // password hashing
    this.passwordConfirm = undefined; //delete passwordConfirm field
    next();
});
//code field
userschema.pre('save', function (next) {   //=>
    if (!this.isModified('code')) return next();
    this.code = undefined;
    next();
});
//3)update passwordChangeAt properly for the user
userschema.pre('save', function (next) {   //=>
    if (!this.isModified('password') || this.isNew) return next();
    this.passwordChangeAt = Date.now() - 1000; // password بعد تغير  token لضمان انشاء 
    next();
});
userschema.methods.createPasswordResetToken = function () {    //=>
    this.PasswordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    //console.log({ resetToken }, this.PasswordResetToken);
    this.PasswordResetExpires = Date.now() + 10 * 60 * 1000;
    return resetToken;
}
module.exports = mongoose.model("user", userschema)