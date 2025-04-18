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

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    
    // Only proceed if the pasted content appears to be a valid OTP
    if (!pastedData.match(/^\d+$/) || pastedData.length !== 6) return;
    
    // Fill the OTP fields with the pasted digits
    const digits = pastedData.split("");
    const newOtp = [...otp];
    
    digits.forEach((digit, index) => {
      if (index < 6) newOtp[index] = digit;
    });
    
    setOtp(newOtp);
    
    // Focus on the last field after paste
    if (inputRefs.current[5]) {
      inputRefs.current[5].focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const otpString = otp.join("");
    if (otpString.length === 6) {
      console.log(otpString);
      onVerify(otpString);
    }
  };

  const handleResend = () => {
    // Implement resend OTP logic here
    console.log("Resending OTP...");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-primary-dark rounded-lg p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          ✕
        </button>
        <div className="text-center">
          <h3 className="text-xl text-white font-semibold mb-2">Verify OTP</h3>
          <p className="text-gray-400 mb-0">We've sent a code to <span className="underline underline-offset-2 text-white">{phoneNumber}</span></p>
          <p className="text-gray-400 mb-6">Please enter it to verify your Mobile No.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="flex gap-3 mb-6 justify-center">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                placeholder=" - "
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : null}
                className="w-10 h-10 text-center text-lg font-semibold text-white bg-[#2c2c2c] rounded-md focus:outline-none focus:ring-2 focus:ring-transparent"
              />
            ))}
          </div>  

          <button
            type="submit"
            className="w-full bg-primary text-white rounded-md py-3 font-medium hover:bg-primary/80 transition-colors mb-4"
          >
            Verify OTP
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={handleResend}
            className="text-gray-400"
          >
            Didn't receive code? <span className="underline underline-offset-2 text-white">Resend</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OtpModal;