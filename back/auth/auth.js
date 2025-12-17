const user = require('../models/userModels')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer')
const twilio = require('twilio')

// Initialize Twilio client
let twilioClient;
try {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
        console.warn('Twilio credentials not found. SMS functionality will be disabled.');
    } else {
        twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    }
} catch (error) {
    console.error('Failed to initialize Twilio client:', error);
}

// ===========================Token===================================

const generateTokens = async (id) => {
    try {
        const userData = await user.findOne({ _id: id });
        if (!userData) {
            throw new Error("User not found");
        }

        const accessToken = await jwt.sign(
            {
                _id: userData._id,
            },
            process.env.SECRET_KEY,
            { expiresIn: '2h' });

        const refreshToken = await jwt.sign(
            {
                _id: userData._id,
            },
            process.env.SECRET_KEY,
            { expiresIn: '15d' }
        );

        userData.refreshToken = refreshToken;
        await userData.save({ validateBeforeSave: false });

        return {
            accessToken,
            refreshToken
        }

    } catch (error) {
        throw new Error(error.message);
    }
}

const generateNewToken = async (req, res) => {
    try {
        // ✅ FIXED: Safely get token from cookies or Authorization header
        let token = req.cookies?.refreshToken;
        
        // If not in cookies, check Authorization header
        if (!token && req.header('Authorization')) {
            const authHeader = req.header('Authorization');
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.split(' ')[1];
            }
        }

        // If still no token found
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Refresh token not available"
            });
        }

        // Verify the token
        jwt.verify(token, process.env.SECRET_KEY, async function (err, decoded) {
            try {
                if (err) {
                    console.error("Token verification error:", err.message);
                    return res.status(401).json({
                        success: false,
                        message: "Invalid or expired refresh token"
                    });
                }

                const USERS = await user.findOne({ _id: decoded._id });
                if (!USERS) {
                    return res.status(404).json({
                        success: false,
                        message: "User not found"
                    });
                }

                // Check if the refresh token matches the one stored in database
                if (USERS.refreshToken !== token) {
                    return res.status(401).json({
                        success: false,
                        message: "Invalid refresh token"
                    });
                }

                // Generate new tokens
                const { accessToken, refreshToken } = await generateTokens(decoded._id);

                const userDetails = await user.findOne({ _id: USERS._id }).select("-password -refreshToken");

                return res.status(200)
                    .cookie("accessToken", accessToken, { 
                        httpOnly: true, 
                        secure: true, 
                        maxAge: 2 * 60 * 60 * 1000, 
                        sameSite: "None" 
                    })
                    .cookie("refreshToken", refreshToken, { 
                        httpOnly: true, 
                        secure: true, 
                        maxAge: 15 * 24 * 60 * 60 * 1000, 
                        sameSite: "None" 
                    })
                    .json({ 
                        success: true, 
                        finduser: userDetails, 
                        accessToken: accessToken, 
                        refreshToken: refreshToken 
                    });

            } catch (error) {
                console.error("Error in token generation:", error);
                return res.status(500).json({
                    success: false,
                    message: "Error generating new tokens: " + error.message
                });
            }
        });
    } catch (error) {
        console.error("Error in generateNewToken:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error: " + error.message
        });
    }
}

// ==================================================================

const userLogin = async (req, res) => {
    try {
        let { email, password } = req.body

        let checkEmailIsExist = await user.findOne({ email })

        if (!checkEmailIsExist) {
            return res.status(404).json({ status: 404, message: "Email Not found" })
        }

        let comparePassword = await bcrypt.compare(password, checkEmailIsExist.password)

        if (!comparePassword) {
            return res.status(404).json({ status: 404, message: "Password Not Match" })
        }

        const { accessToken, refreshToken } = await generateTokens(checkEmailIsExist._id);

        return res.status(200)
            .cookie("accessToken", accessToken, { httpOnly: true, secure: true, maxAge: 2 * 60 * 60 * 1000, sameSite: "None" })
            .cookie("refreshToken", refreshToken, { httpOnly: true, secure: true, maxAge: 15 * 24 * 60 * 60 * 1000, sameSite: "None" })
            .json({ status: 200, message: "User Login Successfully...", user: checkEmailIsExist, token: accessToken })

    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: 500, message: error.message })
    }
}

const googleLogin = async (req, res) => {
    try {
        let { uid, userName, email, photo } = req.body;
        let checkUser = await user.findOne({ email });
        if (!checkUser) {
            checkUser = await user.create({
                uid,
                userName,
                email,
                photo
            });
        }
        checkUser = checkUser.toObject();
        const { accessToken, refreshToken } = await generateTokens(checkUser._id);
        return res.status(200)
            .cookie("accessToken", accessToken, { httpOnly: true, secure: true, maxAge: 2 * 60 * 60 * 1000, sameSite: "None" })
            .cookie("refreshToken", refreshToken, { httpOnly: true, secure: true, maxAge: 15 * 24 * 60 * 60 * 1000, sameSite: "None" })
            .json({ message: 'login successful', success: true, user: checkUser, token: accessToken });

    } catch (error) {
        throw new Error(error);
    }
};

const forgotPassword = async (req, res) => {
    try {
        let { email } = req.body;

        let checkEmail = await user.findOne({ email })

        if (!checkEmail) {
            return res.status(404).json({ status: 404, message: "Email Not Found" })
        }

        const transport = nodemailer.createTransport({
            service: "Gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        let otp = Math.floor(1000 + Math.random() * 9000);

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Reset Password",
            text: `Your code is: ${otp} `
        }

        checkEmail.otp = otp

        await checkEmail.save()

        transport.sendMail(mailOptions, (error) => {
            if (error) {
                console.log(error);
                return res.status(500).json({ status: 500, success: false, message: error.message })
            }
            return res.status(200).json({ status: 200, success: true, message: "Email Sent Successfully..." });
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: 500, message: error.message })
    }
}

const verifyOtp = async (req, res) => {
    try {
        let { email, otp } = req.body

        let chekcEmail = await user.findOne({ email })

        if (!chekcEmail) {
            return res.status(404).json({ status: 404, message: "Email Not Found" })
        }

        if (chekcEmail.otp != otp) {
            return res.status(404).json({ status: 404, message: "Invalid Otp" })
        }

        chekcEmail.otp = undefined

        await chekcEmail.save();

        return res.status(200).json({ status: 200, message: "Otp Verify Successfully...", user: chekcEmail })

    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: 500, message: error.message })
    }
}

const changePassword = async (req, res) => {
    try {
        let { newPassword, email } = req.body;

        let userId = await user.findOne({ email });

        if (!userId) {
            return res.status(404).json({ status: 404, message: "User Not Found" })
        }

        let salt = await bcrypt.genSalt(10);
        let hashPassword = await bcrypt.hash(newPassword, salt);

        let updatePassword = await user.findByIdAndUpdate(userId._id, { password: hashPassword }, { new: true })

        return res.json({ status: 200, message: "Password Changed Successfully..." })

    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: 500, message: error.message })
    }
}

const sendOtpToMobile = async (req, res) => {
    try {
        let { mobileNumber } = req.body;

        let otp = 123456;
        // Save the OTP to the user's record
        let checkUser = await user.findOne({ mobileNumber });
        if (!checkUser) {
            checkUser = new user({ mobileNumber, otp });
        } else {
            checkUser.otp = otp;
        }
        await checkUser.save();

        return res.status(200).json({ status: 200, message: "OTP sent successfully." });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: 500,
            message: error.message || "Failed to send OTP. Please try again later."
        });
    }
};

const verifyMobileOtp = async (req, res) => {
    try {
        const { mobileNumber, otp, isMobile } = req.body;

        let userRecord = await user.findOne({ mobileNumber });
        if (!userRecord) {
            return res.status(404).json({ status: 404, message: "User not found." });
        }

        if (userRecord.otp != otp) {
            return res.status(400).json({ status: 400, message: "Invalid OTP." });
        }

        // Clear OTP after successful verification
        userRecord.otp = undefined;
        userRecord.devices = []

        await userRecord.save();

        const { accessToken, refreshToken } = await generateTokens(userRecord._id);

        return res.status(200)
            .cookie("accessToken", accessToken, { httpOnly: true, secure: true, maxAge: 2 * 60 * 60 * 1000, sameSite: "None" })
            .cookie("refreshToken", refreshToken, { httpOnly: true, secure: true, maxAge: 15 * 24 * 60 * 60 * 1000, sameSite: "None" })
            .json({
                status: 200,
                message: "OTP verified successfully.",
                user: userRecord,
                token: accessToken,
                refreshToken: refreshToken
            });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: 500, message: error.message });
    }
};

const profileInfo = async (req, res) => {
    try {
        let { userName, bio } = req.body;
        var { _id } = req.user;

        let userdata = await user.findOne({ _id });
        if (!userdata) {
            return res.status(404).json({ status: 404, message: "User not found." });
        }

        userdata.userName = userName;
        userdata.bio = bio;

        // Only update photo if a new photo is sent
        if (req.file && req.file.location) {
            userdata.photo = req.file.location;
        }

        await userdata.save();

        return res.status(200).json({ status: 200, message: "Profile info fetched successfully.", user: userdata });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: 500, message: error.message });
    }
}

const logoutUser = async (req, res) => {
    try {
        const userData = await user.findByIdAndUpdate(
            req.body._id,
            {
                $unset: {
                    refreshToken: 1
                }
            },
            {
                new: true
            }
        );

        return res.status(200)
            .clearCookie("accessToken")
            .clearCookie("refreshToken")
            .json({
                success: true,
                data: userData,
                message: 'user logout successfully'
            })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "user logout not complete" + error.message
        })
    }
}

module.exports = {
    userLogin,
    googleLogin,
    forgotPassword,
    verifyOtp,
    changePassword,
    sendOtpToMobile,
    verifyMobileOtp,
    profileInfo,
    generateNewToken,
    logoutUser
};