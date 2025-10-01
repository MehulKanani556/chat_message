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
    // console.log("id", id);
    try {
        const userData = await user.findOne({ _id: id });
        // console.log("user", userData);
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

    const token = req.cookies.refreshToken || req.header('Authorization').split(' ')[1];

    // console.log("TOKENS---------------", token);

    if (!token) {
        return res.status(401)
            .json({
                success: false,
                message: "Token not available"
            })
    }

    jwt.verify(token, process.env.SECRET_KEY, async function (err, decoded) {
        try {
            // console.log(err);

            if (err) {
                return res.status(400)
                    .json({
                        success: false,
                        message: "Token invalid"
                    })
            }

            const USERS = await user.findOne({ _id: decoded._id });
            // console.log("USERSss", USERS)

            if (!USERS) {
                return res.status(404)
                    .json({
                        success: false,
                        message: "User not found..!!"
                    })
            }
            const { accessToken, refreshToken } = await generateTokens(decoded._id);

            const userDetails = await user.findOne({ _id: USERS._id }).select("-password -refreshToken");
            // console.log("userDetailsss", userDetails);

            return res.status(200)
                .cookie("accessToken", accessToken, { httpOnly: true, secure: true, maxAge: 2 * 60 * 60 * 1000, sameSite: "None" })
                .cookie("refreshToken", refreshToken, { httpOnly: true, secure: true, maxAge: 15 * 24 * 60 * 60 * 1000, sameSite: "None" })
                .json({ success: true, finduser: userDetails, accessToken: accessToken, refreshToken: refreshToken });

        } catch (error) {
            return res.status(500).json({
                success: false,
                data: [],
                error: "Error in register user: " + error.message
            })
        }
    });
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

        // let token = await jwt.sign({ _id: checkEmailIsExist._id }, process.env.SECRET_KEY, { expiresIn: "1D" })
        const { accessToken, refreshToken } = await generateTokens(checkEmailIsExist._id);

        return res.status(200)
            .cookie("accessToken", accessToken, { httpOnly: true, secure: true, maxAge: 2 * 60 * 60 * 1000, sameSite: "None" })
            .cookie("refreshToken", refreshToken, { httpOnly: true, secure: false, maxAge: 15 * 24 * 60 * 60 * 1000, sameSite: "None" })
            .json({ status: 200, message: "User Login SuccessFully...", user: checkEmailIsExist, token: assesToken })

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
        // let token = await jwt.sign({ _id: checkUser._id }, process.env.SECRET_KEY, { expiresIn: "1D" })
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
            return res.status(200).json({ status: 200, success: true, message: "Email Sent SuccessFully..." });
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

        return res.status(200).json({ status: 200, message: "Otp Verify SuccessFully...", user: chekcEmail })

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

        return res.json({ status: 200, message: "Password Changed SuccessFully..." })

    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: 500, message: error.message })
    }
}

const sendOtpToMobile = async (req, res) => {
    try {
        let { mobileNumber } = req.body;

        // Generate a random OTP
        // let otp = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
        let otp = 123456;
        // Check if Twilio is configured
        // if (!twilioClient) {
        //     return res.status(503).json({ 
        //         status: 503, 
        //         message: "SMS service is not configured. Please contact the administrator." 
        //     });
        // }

        // Send OTP via SMS
        // await twilioClient.messages.create({
        //     body: `Your OTP is: ${otp}`,
        //     from: process.env.TWILIO_PHONE_NUMBER,
        //     to: mobileNumber
        // });

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


        // Generate token for the user
        // const token = jwt.sign(
        //     { _id: userRecord._id },
        //     process.env.SECRET_KEY,
        //     { expiresIn: "1D" }
        // );
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