import React, { useState, useEffect, useRef } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { GoogleLogin } from '@react-oauth/google';
import { forgotPassword, googleLogin, login, register, resetPassword, verifyOtp } from '../redux/slice/auth.slice';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { LuEye, LuEyeClosed } from 'react-icons/lu';
import { ImCross } from 'react-icons/im';
import { BiSolidErrorAlt } from "react-icons/bi";
import { motion, AnimatePresence } from 'framer-motion';

const OTPInput = ({ length = 4, onComplete, resendTimer, setResendTimer, handleVerifyOTP, handleBack, email }) => {
  const [otp, setOtp] = useState(new Array(length).fill(''));
  const [error, setError] = useState('');
  const inputRefs = useRef([]);
  const dispatch = useDispatch();

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (e, index) => {
    const value = e.target.value;
    if (isNaN(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < length - 1) {
      inputRefs.current[index + 1].focus();
    }

    const otpValue = newOtp.join('');
    if (otpValue.length === length) {
      onComplete?.(otpValue);
    }
  };

  const handleKeyDown = (e, index) => {
    // Move to previous input on backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, length);

    if (/^\d+$/.test(pastedData)) {
      const newOtp = [...otp];
      pastedData.split('').forEach((digit, index) => {
        if (index < length) {
          newOtp[index] = digit;
        }
      });
      setOtp(newOtp);

      if (pastedData.length === length) {
        onComplete?.(pastedData);
      }
      // Focus last filled input or first empty input
      const focusIndex = Math.min(pastedData.length, length - 1);
      inputRefs.current[focusIndex].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length !== length) {
      setError('Please enter the complete OTP.');
      return;
    }
    setError('');
    try {
      const response = await dispatch(verifyOtp({ email: email, otp: otpValue }));
      console.log(response);
      if (response.payload.status === 200) {
        handleVerifyOTP(otpValue);
      } else {
        setError('OTP verification failed. Please try again.');
      }
    } catch (error) {
      setError('Error verifying OTP. Please try again.');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white flex flex-col items-center justify-center px-8 md:px-10 h-full py-6 rounded-2xl shadow-xl"
    >
      <h1 className="text-2xl font-bold mb-6 text-indigo-700">Enter OTP</h1>
      <form onSubmit={handleSubmit} className="w-full space-y-4">
        <div className="flex justify-center space-x-3 pb-3">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(ref) => inputRefs.current[index] = ref}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={digit}
              onChange={(e) => handleChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onPaste={handlePaste}
              className="w-12 h-12 text-center border-2 border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg font-semibold transition-all duration-200"
              maxLength={1}
            />
          ))}
        </div>
        {error && <div className="text-red-500 text-center text-sm mt-1">{error}</div>}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg py-3 font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-md"
        >
          Verify
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={handleBack}
          className="w-full bg-gray-200 text-gray-700 rounded-lg py-3 font-semibold hover:bg-gray-300 transition-all duration-300 mt-2"
        >
          Back
        </motion.button>
      </form>
    </motion.div>
  );
};

const Login = () => {
  const [activeTab, setActiveTab] = useState('signin'); // 'signin' or 'signup'
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [forgotPasswordStep, setForgotPasswordStep] = useState(0);
  const [resendTimer, setResendTimer] = useState(60);
  const [email, setEmail] = useState('');
  const { message, error } = useSelector((state) => state.auth);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (message && error != null) {
      setModalVisible(true)
    }
    else {
      setModalVisible(false)
    }
  }, [message])
  
  useEffect(() => {
    if (modalVisible) {
      const timer = setTimeout(() => {
        setModalVisible(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [modalVisible]);

  const signUpSchema = Yup.object().shape({
    userName: Yup.string().required("Name is required"),
    email: Yup.string().email("Invalid email").required("Email is required"),
    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
  });

  const signInSchema = Yup.object().shape({
    email: Yup.string().email("Invalid email").required("Email is required"),
    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
  });

  const handleForgotPassword = () => {
    setForgotPasswordStep(1);
  };

  const handleSendOTP = () => {
    // Logic to send OTP
    setForgotPasswordStep(2);
  };

  const handleVerifyOTP = () => {
    setForgotPasswordStep(3);
  };

  const handleChangePassword = (values) => {
    console.log(values);
    const { newPassword } = values; // Extract newPassword from values
    dispatch(resetPassword({ newPassword, email })).then((response) => {
      console.log(response)
      if (response.payload.status == 200) {
        setForgotPasswordStep(0);
      }
    });
  };

  const handleBack = () => {
    setForgotPasswordStep(forgotPasswordStep - 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl overflow-hidden w-full max-w-md shadow-2xl"
      >
        {/* Tabs */}
        <div className="flex border-b">
          <button 
            className={`flex-1 py-4 text-center font-medium transition-colors ${activeTab === 'signin' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('signin')}
          >
            Sign In
          </button>
          <button 
            className={`flex-1 py-4 text-center font-medium transition-colors ${activeTab === 'signup' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('signup')}
          >
            Sign Up
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {forgotPasswordStep === 0 && activeTab === 'signin' && (
            <Formik
              initialValues={{ email: '', password: '', showPassword: false }}
              validationSchema={signInSchema}
              onSubmit={(values) => {
                dispatch(login(values)).then((response) => {
                  if (response.payload.status == 200) navigate('/chat');
                });
              }}
            >
              {({ values, errors, touched, handleChange, setFieldValue }) => (
                <Form className="space-y-4">
                  <motion.h1 
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-2xl font-bold mb-6 text-indigo-700 text-center"
                  >
                    Welcome Back
                  </motion.h1>
                  
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Field
                      type="email"
                      name="email"
                      placeholder="Email"
                      value={values.email}
                      onChange={handleChange}
                      className="bg-gray-50 border border-gray-200 px-4 py-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                    />
                    <ErrorMessage name="email" component="div" className="text-red-500 text-sm mt-1" />
                  </motion.div>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="relative"
                  >
                    <Field
                      type={values.showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Password"
                      value={values.password}
                      onChange={handleChange}
                      className="bg-gray-50 border border-gray-200 px-4 py-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                    />
                    <div
                      className="absolute right-3 top-3 cursor-pointer select-none text-indigo-500"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setFieldValue('showPassword', !values.showPassword);
                      }}
                    >
                      {values.showPassword ? <LuEye /> : <LuEyeClosed />}
                    </div>
                    <ErrorMessage name="password" component="div" className="text-red-500 text-sm mt-1" />
                  </motion.div>

                  <div className="flex justify-end">
                    <a href="#" onClick={handleForgotPassword} className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors">Forgot password?</a>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg py-3 font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-md"
                  >
                    Sign In
                  </motion.button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">Or continue with</span>
                    </div>
                  </div>

                  <GoogleLogin
                    onSuccess={response => {
                      const { name, email, sub: uid, picture: photo } = jwtDecode(response.credential);
                      console.log(jwtDecode(response.credential))
                      dispatch(googleLogin({ uid, userName: name, email })).then((response) => {
                        if (response.payload) navigate('/chat');
                      });
                    }}
                    onFailure={console.error}
                    render={renderProps => (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={renderProps.onClick}
                        disabled={renderProps.disabled}
                        className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-all duration-300"
                      >
                        <img src={require('../assets/google-logo.png')} alt="Google" className="w-5 h-5" />
                        <span>Continue with Google</span>
                      </motion.button>
                    )}
                  />
                </Form>
              )}
            </Formik>
          )}

          {forgotPasswordStep === 0 && activeTab === 'signup' && (
            <Formik
              initialValues={{ userName: '', email: '', password: '' }}
              validationSchema={signUpSchema}
              onSubmit={(values) => {
                dispatch(register(values)).then((response) => {
                  if (response.payload) navigate('/chat');
                });
              }}
            >
              {({ values, errors, touched, handleChange }) => (
                <Form className="space-y-4">
                  <motion.h1 
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-2xl font-bold mb-6 text-indigo-700 text-center"
                  >
                    Create Account
                  </motion.h1>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Field
                      type="text"
                      name="userName"
                      placeholder="User Name"
                      value={values.userName}
                      onChange={handleChange}
                      className="bg-gray-50 border border-gray-200 px-4 py-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                    />
                    <ErrorMessage name="userName" component="div" className="text-red-500 text-sm mt-1" />
                  </motion.div>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Field
                      type="email"
                      name="email"
                      placeholder="Email"
                      value={values.email}
                      onChange={handleChange}
                      className="bg-gray-50 border border-gray-200 px-4 py-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                    />
                    <ErrorMessage name="email" component="div" className="text-red-500 text-sm mt-1" />
                  </motion.div>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Field
                      type="password"
                      name="password"
                      placeholder="Password"
                      value={values.password}
                      onChange={handleChange}
                      className="bg-gray-50 border border-gray-200 px-4 py-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                    />
                    <ErrorMessage name="password" component="div" className="text-red-500 text-sm mt-1" />
                  </motion.div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg py-3 font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-md"
                  >
                    Sign Up
                  </motion.button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">Or continue with</span>
                    </div>
                  </div>

                  <GoogleLogin
                    onSuccess={response => {
                      const { name, email, sub: uid } = jwtDecode(response.credential);
                      dispatch(googleLogin({ uid, userName: name, email })).then((response) => {
                        if (response.payload) navigate('/chat');
                      });
                    }}
                    onFailure={console.error}
                    render={renderProps => (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={renderProps.onClick}
                        disabled={renderProps.disabled}
                        className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-all duration-300"
                      >
                        <img src={require('../assets/google-logo.png')} alt="Google" className="w-5 h-5" />
                        <span>Continue with Google</span>
                      </motion.button>
                    )}
                  />
                </Form>
              )}
            </Formik>
          )}

          {forgotPasswordStep === 1 && (
            <Formik
              initialValues={{ email: '' }}
              validationSchema={Yup.object({
                email: Yup.string().email('Invalid email').required('Email is required'),
              })}
              onSubmit={(values, { resetForm }) => {
                // Logic to handle form submission
                console.log(values.email);
                setEmail(values.email);
                dispatch(forgotPassword(values.email)).then((response) => {
                  console.log(response);
                  if (response.payload.success) {
                    handleSendOTP();
                    resetForm(); // Clear the form on success
                  }
                });
              }}
            >
              {({ handleChange, handleSubmit }) => (
                <motion.form 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  onSubmit={handleSubmit} 
                  className="space-y-4"
                >
                  <h1 className="text-2xl font-bold mb-6 text-indigo-700 text-center">Forgot Password</h1>
                  <div className="space-y-4">
                    <div>
                      <input
                        type="email"
                        name="email"
                        placeholder="Enter your email"
                        onChange={handleChange}
                        className="bg-gray-50 border border-gray-200 px-4 py-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                        ref={(input) => input && input.focus()}
                      />
                      <ErrorMessage name="email" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg py-3 font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-md"
                    >
                      Send OTP
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleBack}
                      className="w-full bg-gray-200 text-gray-700 rounded-lg py-3 font-semibold hover:bg-gray-300 transition-all duration-300 mt-2"
                    >
                      Back
                    </motion.button>
                  </div>
                </motion.form>
              )}
            </Formik>
          )}

          {forgotPasswordStep === 2 && (
            <OTPInput
              length={4}
              onComplete={(otpValue) => {

              }}
              resendTimer={resendTimer}
              setResendTimer={setResendTimer}
              handleVerifyOTP={handleVerifyOTP}
              handleBack={handleBack}
              email={email}
            />
          )}

          {forgotPasswordStep === 3 && (
            <Formik
              initialValues={{
                newPassword: '',
                confirmPassword: '',
                showNewPassword: false,
                showConfirmPassword: false
              }}
              validationSchema={Yup.object({
                newPassword: Yup.string()
                  .min(6, 'Password must be at least 6 characters')
                  .required('New Password is required'),
                confirmPassword: Yup.string()
                  .oneOf([Yup.ref('newPassword'), null], 'Passwords must match')
                  .required('Confirm Password is required'),
              })}
              onSubmit={(values) => {
                const { newPassword, confirmPassword } = values;
                handleChangePassword({ newPassword, confirmPassword });
              }}
            >
              {({ values, setFieldValue, handleChange, handleSubmit, errors, touched }) => (
                <motion.form 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  onSubmit={handleSubmit} 
                  className="space-y-4"
                >
                  <h1 className="text-2xl font-bold mb-6 text-indigo-700 text-center">Change Password</h1>
                  <div className="space-y-4">
                    <div className="relative">
                      <input
                        type={values.showNewPassword ? "text" : "password"}
                        name="newPassword"
                        placeholder="New Password"
                        value={values.newPassword}
                        onChange={handleChange}
                        className="bg-gray-50 border border-gray-200 px-4 py-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                      />
                      <div
                        className="absolute right-3 top-3 cursor-pointer select-none text-indigo-500"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setFieldValue('showNewPassword', !values.showNewPassword);
                        }}
                      >
                        {values.showNewPassword ? <LuEye /> : <LuEyeClosed />}
                      </div>
                      {errors.newPassword && touched.newPassword && (
                        <div className="text-red-500 text-sm mt-1">{errors.newPassword}</div>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={values.showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        placeholder="Confirm Password"
                        value={values.confirmPassword}
                        onChange={handleChange}
                        className="bg-gray-50 border border-gray-200 px-4 py-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                      />
                      <div
                        className="absolute right-3 top-3 cursor-pointer select-none text-indigo-500"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setFieldValue('showConfirmPassword', !values.showConfirmPassword);
                        }}
                      >
                        {values.showConfirmPassword ? <LuEye /> : <LuEyeClosed />}
                      </div>
                      {errors.confirmPassword && touched.confirmPassword && (
                        <div className="text-red-500 text-sm mt-1">{errors.confirmPassword}</div>
                      )}
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg py-3 font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-md"
                    >
                      Change Password
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={handleBack}
                      className="w-full bg-gray-200 text-gray-700 rounded-lg py-3 font-semibold hover:bg-gray-300 transition-all duration-300 mt-2"
                    >
                      Back
                    </motion.button>
                  </div>
                </motion.form>
              )}
            </Formik>
          )}
        </div>
      </motion.div>
      
      {/* Error Message Modal */}
      <AnimatePresence>
        {modalVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setModalVisible(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl w-96 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-end items-center pb-2 p-4">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setModalVisible(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <ImCross />
                </motion.button>
              </div>
              <div className='text-xl p-5 text-red-500 py-8 pt-6 text-center flex flex-col justify-center items-center'>
                <motion.p 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className='text-center text-6xl mb-3'
                >
                  <BiSolidErrorAlt />
                </motion.p>
                <p>
                  {typeof message === 'object' ? message.message : message}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Login;
