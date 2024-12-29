/* import dotenv from "dotenv"; */

const dotenv = require('dotenv');
dotenv.config();


const jwt = require("jsonwebtoken");

 const createToken = (user) => {
    const expToken = new Date();
    expToken.setHours(expToken.getHours() + 750);
    const payload = {
        token_type: "access",
        user_id : user._id,
        iat : Date.now(),
        exp : expToken.getTime(),
    }
    console.log(payload);
    return jwt.sign(payload, process.env.JWT_SECRET);
}

const createRefreshToken = (user) => {
    const expToken = new Date();
    expToken.getMonth(expToken.getMonth() + 1);
    const payload = {
        token_type: "refresh",
        user_id : user._id,
        iat : Date.now(),
        exp : expToken.getTime(),
    }

    return jwt.sign(payload, process.env.JWT_SECRET);
};


const decodedToken = (token) => {
    return jwt.decode(token, process.env.JWT_SECRET, true);
}

module.exports = {
    createToken,
    createRefreshToken,
    decodedToken
}