import { useState } from "react";
import { useNavigate } from "react-router-dom";
import QRCode from "qrcode.react";
import OtpModal from "../component/OtpModal";

const Login = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [showOtpModal, setShowOtpModal] = useState(false);
  const navigate = useNavigate();

  const countries = [
    { code: "+91", flag: "🇮🇳", name: "India" },
    // Add more countries as needed
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // API call to send OTP
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: `${countryCode}${phoneNumber}`,
        }),
      });

      if (response.ok) {
        setShowOtpModal(true);
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
    }
  };

  const handleOtpVerification = async (otp) => {
    try {
      // API call to verify OTP
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: `${countryCode}${phoneNumber}`,
          otp,
        }),
      });

      if (response.ok) {
        navigate("/chat");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left side - Phone Login */}
        <div className="bg-gray-800 p-8 rounded-lg">
          <div className="mb-8">
            <img src="/logo.png" alt="Logo" className="h-8" />
          </div>
          <h2 className="text-2xl text-white font-semibold mb-2">
            Welcome Back to Chat App!
          </h2>
          <p className="text-gray-400 mb-6">
            Message privately with friends and family using Chat App.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-400 mb-2">Country</label>
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {countries.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.flag} {country.name} ({country.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-gray-400 mb-2">Mobile No.</label>
              <div className="flex">
                <span className="bg-gray-700 text-white px-4 py-3 rounded-l-md">
                  {countryCode}
                </span>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Your Mobile No."
                  className="flex-1 bg-gray-700 text-white rounded-r-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white rounded-md py-3 font-medium hover:bg-blue-700 transition-colors"
            >
              Next
            </button>
          </form>
        </div>

        {/* Right side - QR Code */}
        <div className="bg-[#3F51B5] p-8 rounded-lg flex flex-col items-center justify-center">
          <h3 className="text-xl text-white font-semibold mb-6">
            Scan to Login with Chat App
          </h3>
          <div className="bg-white p-4 rounded-lg mb-6">
            <QRCode
              value="https://chat-app.com/qr-login"
              size={200}
              level="H"
            />
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
          phoneNumber={`${countryCode}${phoneNumber}`}
          onVerify={handleOtpVerification}
          onClose={() => setShowOtpModal(false)}
        />
      )}
    </div>
  );
};

export default Login;
