const jwt = require("jsonwebtoken");
const httpstatus = require("../utils/httpstatus");
const apperror = require("../utils/app_error");
const veryfiy = (req, res, next) => {
    const authheaders = req.headers['Authorization'] || req.headers['authorization'];
    if (!authheaders) {
        const error = apperror.create("token is required", 401, httpstatus.ERR)
        return next(error)
    }
    const token = authheaders.split(' ')[1];
    try {
        const currentUser = jwt.verify(token, process.env.jwt_secret_key);
        req.currentUser = currentUser
        next();
    } catch (err) {
        const error = apperror.create("invalid token", 401, httpstatus.ERR)
        return next(error)
    }
}
module.exports = veryfiy;