import { useState, useEffect, useRef } from "react";

const OtpModal = ({ phoneNumber, onVerify, onClose }) => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef([]);

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index, value) => {
    if (value.length > 1) return; // Prevent multiple digits

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move to next input if value is entered
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Move to previous input on backspace
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const otpString = otp.join("");
    if (otpString.length === 6) {
      onVerify(otpString);
    }
  };

  const handleResend = () => {
    // Implement resend OTP logic here
    console.log("Resending OTP...");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          ✕
        </button>

        <h3 className="text-xl text-white font-semibold mb-2">Verify OTP</h3>
        <p className="text-gray-400 mb-6">We've sent a code to {phoneNumber}</p>

        <form onSubmit={handleSubmit}>
          <div className="flex gap-2 mb-6 justify-center">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-12 text-center text-xl font-semibold text-white bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ))}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white rounded-md py-3 font-medium hover:bg-blue-700 transition-colors mb-4"
          >
            Verify OTP
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={handleResend}
            className="text-blue-400 hover:text-blue-300"
          >
            Didn't receive code? Resend
          </button>
        </div>
      </div>
    </div>
  );
};

export default OtpModal;
