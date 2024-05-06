const cloudinary = require('cloudinary');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})
//cloudinary uploud an image
const CloudinaryUploudImage = async (fileToUploud) => {
    try {
        const data = await cloudinary.uploader.upload(fileToUploud, {  
            resource_type: 'auto'
        });
        return data;
    } catch (err) {
        return err;
    }
}
//remove an image from cloudinary
const CloudinaryRemoveImage = async (imagePublicID) => {
    try {
        const result = await cloudinary.uploader.destroy(imagePublicID);
        return result;
    } catch (err) {
        return err;
    }
}

module.exports = {
    CloudinaryUploudImage,
    CloudinaryRemoveImage
}