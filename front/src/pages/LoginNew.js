import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import OtpModal from "../component/OtpModal";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import CountryList from '../component/CountryList';
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from "react-redux";
import { mobileOtp, verifyMobileOtp } from "../redux/slice/auth.slice";
import QRLoginPage from "./QRLoginPage";

const LoginNew = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [completePhoneNumber, setCompletePhoneNumber] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState({
    name: 'India',
    code: 'IN',
    dialCode: '+91',
    flag: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600">
        <rect width="900" height="600" fill="#f8f9fa" />
        <rect width="900" height="200" fill="#FF9933" />
        <rect width="900" height="200" y="400" fill="#138808" />
        <circle cx="450" cy="300" r="60" fill="#000080" />
        <circle cx="450" cy="300" r="50" fill="#f8f9fa" />
        <circle cx="450" cy="300" r="8.5" fill="#000080" />
        <circle cx="450" cy="300" r="60" fill="none" stroke="#000080" strokeWidth="1" />
        <g transform="translate(450,300)">
          {[...Array(24)].map((_, i) => (
            <line
              key={i}
              x1="0"
              y1="0"
              x2="0"
              y2="-45"
              stroke="#000080"
              strokeWidth="1"
              transform={`rotate(${i * 15})`}
            />
          ))}
        </g>
      </svg>
    )
  });

  const selectCountry = (country) => {
    setSelectedCountry(country);
    setShowCountryDropdown(false);
  };

  const validationSchema = Yup.object({
    mobileNumber: Yup.string()
      .required('Mobile number is required')
      .min(10, 'Mobile number must be at least 10 characters')
      .max(15, 'Mobile number must not exceed 15 characters'),
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    setSubmitting(true);
    // Create the complete phone number with country code
    const fullPhoneNumber = `${selectedCountry.dialCode}${values.mobileNumber}`;
    setCompletePhoneNumber(fullPhoneNumber);

    try {
      dispatch(mobileOtp({ mobileNumber: fullPhoneNumber }))
        .then((response) => {
          console.log(response)
          if (response.payload.status == 200) {
            setShowOtpModal(true);
          }
        })
    } catch (error) {
      console.error("Error sending OTP:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOtpVerification = async (otp) => {
    try {
      dispatch(verifyMobileOtp({
        mobileNumber: completePhoneNumber,
        otp
      }))
        .then((response) => {
          console.log(response)
          if (response.payload.status == 200) {
          navigate('/chat')
          }
        })
    } catch (error) {
      console.error("Error verifying OTP:", error);
    }
  };

  return (
    <div className="min-h-screen bg-primary-dark dark:bg-primary-dark flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 rounded-sm bg-[#1a1a1a] p-4 md:p-10">
        {/* Left side - Phone Login */}
        <div className="p-4 md:p-8 rounded-sm">
          <div className="mb-8 ">
            <img src="/logo.png" alt="Logo" className="h-8 mx-auto md:mx-0" />
          </div>
          <h2 className="text-2xl text-white font-semibold mb-2">
            Welcome Back to Chat App!
          </h2>
          <p className="text-gray-400 mb-6 text-sm">
            Message privately with friends and family using Chat App.
          </p>

          <Formik
            initialValues={{ mobileNumber: '' }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, values }) => (
              <Form>
                {/* Country Select */}
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">Country</label>
                    <div className="relative">
                      <div
                        className="w-full bg-[#2c2c2c] rounded p-2 px-3 text-white flex items-center justify-between"
                        onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-4 overflow-hidden">
                            {selectedCountry.flag}
                          </div>
                          <span>{selectedCountry.name}</span>
                        </div>
                        {showCountryDropdown ?
                          <FaChevronUp size={16} className="text-gray-400" />
                          : <FaChevronDown size={16} className="text-gray-400" />
                        }
                      </div>

                      {showCountryDropdown && (
                        <div className="absolute mt-1 w-full bg-gray-800 rounded-md shadow-lg z-10 max-h-56 overflow-auto">
                          <CountryList onSelectCountry={selectCountry} />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">Mobile No.</label>
                    <div className="flex">
                      <div className="bg-[#2c2c2c] rounded-l p-2 px-3 text-white">
                        {selectedCountry.dialCode}
                      </div>
                      <Field
                        type="number"
                        name="mobileNumber"
                        placeholder="Your Mobile No."
                        className="w-full bg-[#2c2c2c] rounded-r p-2 px-3 text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <ErrorMessage name="mobileNumber" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary text-white rounded py-3 font-medium hover:bg-primary/80 transition-colors mt-6"
                >
                  {isSubmitting ? 'Sending...' : 'Next'}
                </button>
              </Form>
            )}
          </Formik>
        </div>

        {/* Right side - QR Code */}
        <div className="bg-primary/50 p-8 rounded-lg flex flex-col items-center justify-center">
          <h3 className="text-xl text-white font-semibold mb-6">
            Scan to Login with Chat App
          </h3>
          <div className="bg-white p-4 rounded-lg mb-6">
           <QRLoginPage />
          </div>
          <div className="text-center">
            <a href="#" className="text-white/80 text-sm hover:text-white">
              Terms & Conditions
            </a>
            <span className="text-white/80 mx-2">&</span>
            <a href="#" className="text-white/80 text-sm hover:text-white">
              Privacy Policy
            </a>
          </div>
        </div>
      </div>

      {/* OTP Modal */}
      {showOtpModal && (
        <OtpModal
          phoneNumber={completePhoneNumber}
          onVerify={handleOtpVerification}
          onClose={() => setShowOtpModal(false)}
        />
      )}
    </div>
  );
};

export default LoginNew;