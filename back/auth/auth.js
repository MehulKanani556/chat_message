const user = require('../models/userModels')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer')
const twilio = require('twilio')

// Initialize Twilio client
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

exports.userLogin = async (req, res) => {
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

        let token = await jwt.sign({ _id: checkEmailIsExist._id }, process.env.SECRET_KEY, { expiresIn: "1D" })

        return res.status(200).json({ status: 200, message: "User Login SuccessFully...", user: checkEmailIsExist, token: token })
        
    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: 500, message: error.message })
    }
}
exports.googleLogin = async (req, res) => {
    try {
        let { uid, userName, email,photo } = req.body;
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
        let token = await jwt.sign({ _id: checkUser._id }, process.env.SECRET_KEY, { expiresIn: "1D" })
        // checkUser.token = generateToken(checkUser._id);
        return res.status(200).json({ message: 'login successful', success: true, user: checkUser, token: token });
    } catch (error) {
        throw new Error(error);
    }
};


exports.forgotPassword = async (req, res) => {
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

exports.verifyOtp = async (req, res) => {
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

exports.changePassword = async (req, res) => {
    try {
       
        let { newPassword,email } = req.body;

        let userId = await user.findOne({ email });;

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

exports.sendOtpToMobile = async (req, res) => {
    try {
        let { mobileNumber } = req.body;

        // Generate a random OTP
        let otp = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;

        // Send OTP via SMS
        await twilioClient.messages.create({
            body: `Your OTP is: ${otp}`,
            from: process.env.TWILIO_PHONE_NUMBER, // Your Twilio phone number
            to: mobileNumber
        });

        // Optionally, save the OTP to the user's record in the database
        let checkUser = await user.findOne({ mobileNumber });
        if (!checkUser) {
            // If user not found, create that user
            checkUser = new user({ mobileNumber, otp });
        } else {
            checkUser.otp = otp;
        }
        await checkUser.save();

        return res.status(200).json({ status: 200, message: "OTP sent successfully." });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: 500, message: error.message });
    }
};

exports.verifyMobileOtp = async (req, res) => {
    try {
        const { mobileNumber, otp } = req.body;

        // Find the user by mobile number
        let userRecord = await user.findOne({ mobileNumber });
        if (!userRecord) {
            return res.status(404).json({ status: 404, message: "User not found." });
        }
        

        // Check if the OTP matches
        if (userRecord.otp != otp) {
            return res.status(400).json({ status: 400, message: "Invalid OTP." });
        }

        // Optionally, you can clear the OTP after successful verification
        userRecord.otp = null; // Clear OTP after verification
        await userRecord.save();

        // Generate a token for the user
        // const token = jwt.sign({ id: userRecord._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        let token = await jwt.sign({ _id: userRecord._id }, process.env.SECRET_KEY, { expiresIn: "1D" })

        // Prepare user information to be sent
        const userInfo = {
            id: userRecord._id,
            userName: userRecord.userName,
            mobileNumber: userRecord.mobileNumber,
            photo: userRecord.photo,
        };

        return res.status(200).json({ status: 200, message: "OTP verified successfully.", token, user: userInfo });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: 500, message: error.message });
    }
};