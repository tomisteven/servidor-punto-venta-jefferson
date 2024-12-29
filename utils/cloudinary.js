const cloudinary = require("cloudinary");
const dotenv = require("dotenv");
dotenv.config();


const configureCloudinary = (req, res, next) => {
    try {
        const config = cloudinary.config({
            cloud_name: process.env.CLOUDINARY_NAME,
            api_key: process.env.API_KEY_CLOUDINARY,
            api_secret: process.env.API_SECRET_CLOUDINARY,
        });

        config ?  next() : res.status(500).json({message: "Error al configurar Cloudinary"})
    } catch (error) {
        res.status(500).json({message: "Error al configurar Cloudinary"})
    }
}




module.exports = configureCloudinary;