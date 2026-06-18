const user = require('../models/userModels')
const jwt = require('jsonwebtoken')
 
exports.auth = async (req, res, next) => {
    try {
      
        const authHeader = req.header('Authorization') || req.cookies.accessToken ;

            if (!authHeader) {
                return res.status(401).json({ status: 401, message: "Token Is Required" })
            }

            let token = authHeader;
            if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }

            jwt.verify(token, process.env.SECRET_KEY, async function (err, decoded) {
                if (err) {
                    return res.status(401).json({
                        success: false,
                        message: "Token invalid"
                    });
                }

                const USERS = await user.findOne({ _id: decoded._id });
                if (!USERS) {
                    return res.status(404).json({
                        success: false,
                        message: "User not found..!!"
                    });
                }
                req.user = USERS;
                next();
            });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: 500, message: error.message })
    }
}