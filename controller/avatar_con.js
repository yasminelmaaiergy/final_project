const multer = require('multer');
const path = require('path');
const httpstatus = require("../utils/httpstatus");
const apperror = require('../utils/app_error');
const asyncfn = require("../middleware/asyncwrapper");
const cloudinary = require("../utils/cloudinary");
const User = require('../models/usrer_mod');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        console.log("file", file);
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const ext = file.mimetype.split('/')[1];
        const filename = `user-${Date.now()}.${ext}`;
        cb(null, filename);
    }
});

const filefilter = (req, file, cb) => {
    const imagefilter = file.mimetype.split('/')[0];
    if (imagefilter == "image") {
        return cb(null, true);
    } else {
        return cb(apperror.create("file must be an image", 400), false);
    }
};

const profilePhotoUploud = asyncfn(async (req, res, next) => {
    // validation
    if (!req.file) {
        return next();
    }

    // get the path to the image
    const imagePath = path.join(__dirname, `../uploads/${req.file.filename}`);

    // upload to cloudinary => in folder utils
    const result = await cloudinary.CloudinaryUploudImage(imagePath);

    const user = await User.findOne({ _id: req.params.id });
    if (user.avatar[1] !== null) {
        console.log("public_id", user.avatar[1]);
        await cloudinary.CloudinaryRemoveImage(user.avatar[1]);
    }

    fs.unlinkSync(imagePath);

    // Assign avatar value to req.body["avatar"]
    req.body["avatar"] = [
        result.secure_url,
        result.public_id
    ];

    next();

});

module.exports = {
    storage,
    filefilter,
    profilePhotoUploud
};