import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import OtpModal from "../component/OtpModal";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

const LoginNew = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedCountry, setSelectedCountry] = useState({
    code: "IN",
    name: "India",
    flag: "🇮🇳",
    dialCode: "+91",
  });
  const [showOtpModal, setShowOtpModal] = useState(false);
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');

  const countries = [
    { code: "IN", name: "India", flag: "https://www.countryflags.io/in/flat/64.png", dialCode: "+91" },
    { code: "US", name: "United States", flag: "https://www.countryflags.io/us/flat/64.png", dialCode: "+1" },
    { code: "GB", name: "United Kingdom", flag: "https://www.countryflags.io/gb/flat/64.png", dialCode: "+44" },
    { code: "CA", name: "Canada", flag: "https://www.countryflags.io/ca/flat/64.png", dialCode: "+1" },
    { code: "AU", name: "Australia", flag: "https://www.countryflags.io/au/flat/64.png", dialCode: "+61" },
    { code: "DE", name: "Germany", flag: "https://www.countryflags.io/de/flat/64.png", dialCode: "+49" },
    { code: "FR", name: "France", flag: "https://www.countryflags.io/fr/flat/64.png", dialCode: "+33" },
    { code: "IN", name: "India", flag: "🇮🇳", dialCode: "+91" },
    { code: "US", name: "United States", flag: "🇺🇸", dialCode: "+1" },
    { code: "GB", name: "United Kingdom", flag: "🇬🇧", dialCode: "+44" },
    { code: "CA", name: "Canada", flag: "🇨🇦", dialCode: "+1" },
    { code: "AU", name: "Australia", flag: "🇦🇺", dialCode: "+61" },
    { code: "DE", name: "Germany", flag: "🇩🇪", dialCode: "+49" },
    { code: "FR", name: "France", flag: "🇫🇷", dialCode: "+33" },
    { code: "IT", name: "Italy", flag: "🇮🇹", dialCode: "+39" },
    { code: "ES", name: "Spain", flag: "🇪🇸", dialCode: "+34" },
    { code: "CN", name: "China", flag: "🇨🇳", dialCode: "+86" },
    { code: "JP", name: "Japan", flag: "🇯🇵", dialCode: "+81" },
    { code: "BR", name: "Brazil", flag: "🇧🇷", dialCode: "+55" },
    { code: "RU", name: "Russia", flag: "🇷🇺", dialCode: "+7" },
    { code: "MX", name: "Mexico", flag: "🇲🇽", dialCode: "+52" },
    { code: "SA", name: "Saudi Arabia", flag: "🇸🇦", dialCode: "+966" },
    { code: "EG", name: "Egypt", flag: "🇪🇬", dialCode: "+20" },
    { code: "NG", name: "Nigeria", flag: "🇳🇬", dialCode: "+234" },
    { code: "PK", name: "Pakistan", flag: "🇵🇰", dialCode: "+92" },
    { code: "BD", name: "Bangladesh", flag: "🇧🇩", dialCode: "+880" },
    { code: "ID", name: "Indonesia", flag: "🇮🇩", dialCode: "+62" },
    { code: "TH", name: "Thailand", flag: "🇹🇭", dialCode: "+66" },
    { code: "VN", name: "Vietnam", flag: "🇻🇳", dialCode: "+84" },
    { code: "TR", name: "Turkey", flag: "🇹🇷", dialCode: "+90" },
    { code: "IR", name: "Iran", flag: "🇮🇷", dialCode: "+98" },
    { code: "ZA", name: "South Africa", flag: "🇿🇦", dialCode: "+27" },
    { code: "KR", name: "South Korea", flag: "🇰🇷", dialCode: "+82" },
    { code: "AR", name: "Argentina", flag: "🇦🇷", dialCode: "+54" },
    { code: "CO", name: "Colombia", flag: "🇨🇴", dialCode: "+57" },
    { code: "PL", name: "Poland", flag: "🇵🇱", dialCode: "+48" },
    { code: "CH", name: "Switzerland", flag: "🇨🇭", dialCode: "+41" },
    { code: "AT", name: "Austria", flag: "🇦🇹", dialCode: "+43" },
    { code: "BE", name: "Belgium", flag: "🇧🇪", dialCode: "+32" },
    { code: "NL", name: "Netherlands", flag: "🇳🇱", dialCode: "+31" },
    { code: "SE", name: "Sweden", flag: "🇸🇪", dialCode: "+46" },
    { code: "NO", name: "Norway", flag: "🇳🇴", dialCode: "+47" },
    { code: "DK", name: "Denmark", flag: "🇩🇰", dialCode: "+45" },
    { code: "FI", name: "Finland", flag: "🇫🇮", dialCode: "+358" },
    { code: "GR", name: "Greece", flag: "🇬🇷", dialCode: "+30" },
    { code: "PT", name: "Portugal", flag: "🇵🇹", dialCode: "+351" },
    { code: "IE", name: "Ireland", flag: "🇮🇪", dialCode: "+353" },
    { code: "IS", name: "Iceland", flag: "🇮🇸", dialCode: "+354" },
    { code: "LU", name: "Luxembourg", flag: "🇱🇺", dialCode: "+352" },
    { code: "MT", name: "Malta", flag: "🇲🇹", dialCode: "+356" },
    { code: "CY", name: "Cyprus", flag: "🇨🇾", dialCode: "+357" },
    { code: "LT", name: "Lithuania", flag: "🇱🇹", dialCode: "+370" },
    { code: "LV", name: "Latvia", flag: "🇱🇻", dialCode: "+371" },
    { code: "EE", name: "Estonia", flag: "🇪🇪", dialCode: "+372" },
    { code: "HR", name: "Croatia", flag: "🇭🇷", dialCode: "+385" },
    { code: "HU", name: "Hungary", flag: "🇭🇺", dialCode: "+36" },
    { code: "RO", name: "Romania", flag: "🇷🇴", dialCode: "+40" },
    { code: "BG", name: "Bulgaria", flag: "🇧🇬", dialCode: "+359" },
    { code: "SK", name: "Slovakia", flag: "🇸🇰", dialCode: "+421" },
    { code: "SI", name: "Slovenia", flag: "🇸🇮", dialCode: "+386" },
    { code: "CZ", name: "Czech Republic", flag: "🇨🇿", dialCode: "+420" },
    { code: "UA", name: "Ukraine", flag: "🇺🇦", dialCode: "+380" },
    { code: "BY", name: "Belarus", flag: "🇧🇾", dialCode: "+375" },
    { code: "MD", name: "Moldova", flag: "🇲🇩", dialCode: "+373" },
    { code: "AL", name: "Albania", flag: "🇦🇱", dialCode: "+355" },
    { code: "AM", name: "Armenia", flag: "🇦🇲", dialCode: "+374" },
    { code: "AZ", name: "Azerbaijan", flag: "🇦🇿", dialCode: "+994" },
    { code: "BA", name: "Bosnia and Herzegovina", flag: "🇧🇦", dialCode: "+387" },
    { code: "GE", name: "Georgia", flag: "🇬🇪", dialCode: "+995" },
    { code: "KZ", name: "Kazakhstan", flag: "🇰🇿", dialCode: "+7" },
    { code: "KG", name: "Kyrgyzstan", flag: "🇰🇬", dialCode: "+996" },
    { code: "TJ", name: "Tajikistan", flag: "🇹🇯", dialCode: "+992" },
    { code: "TM", name: "Turkmenistan", flag: "🇹🇲", dialCode: "+993" },
    { code: "UZ", name: "Uzbekistan", flag: "🇺🇿", dialCode: "+998" },
    { code: "AE", name: "United Arab Emirates", flag: "🇦🇪", dialCode: "+971" },
    { code: "BH", name: "Bahrain", flag: "🇧🇭", dialCode: "+973" },
    { code: "KW", name: "Kuwait", flag: "🇰🇼", dialCode: "+965" },
    { code: "OM", name: "Oman", flag: "🇴🇲", dialCode: "+968" },
    { code: "QA", name: "Qatar", flag: "🇶🇦", dialCode: "+974" },
    { code: "YE", name: "Yemen", flag: "🇾🇪", dialCode: "+967" },
    { code: "JO", name: "Jordan", flag: "🇯🇴", dialCode: "+962" },
    { code: "LB", name: "Lebanon", flag: "🇱🇧", dialCode: "+961" },
    { code: "SY", name: "Syria", flag: "🇸🇾", dialCode: "+963" },
    { code: "IQ", name: "Iraq", flag: "🇮🇶", dialCode: "+964" },
    { code: "IL", name: "Israel", flag: "🇮🇱", dialCode: "+972" },
    { code: "PS", name: "Palestine", flag: "🇵🇸", dialCode: "+970" },
    { code: "PK", name: "Pakistan", flag: "🇵🇰", dialCode: "+92" },
    { code: "AF", name: "Afghanistan", flag: "🇦🇫", dialCode: "+93" },
    { code: "BD", name: "Bangladesh", flag: "🇧🇩", dialCode: "+880" },
    { code: "BT", name: "Bhutan", flag: "🇧🇹", dialCode: "+975" },
    { code: "NP", name: "Nepal", flag: "🇳🇵", dialCode: "+977" },
    { code: "LK", name: "Sri Lanka", flag: "🇱🇰", dialCode: "+94" },
    { code: "MM", name: "Myanmar", flag: "🇲🇲", dialCode: "+95" },
    { code: "KH", name: "Cambodia", flag: "🇰🇭", dialCode: "+855" },
    { code: "LA", name: "Laos", flag: "🇱🇦", dialCode: "+856" },
    { code: "MO", name: "Macau", flag: "🇲🇴", dialCode: "+853" },
    { code: "MN", name: "Mongolia", flag: "🇲🇳", dialCode: "+976" },
    { code: "PH", name: "Philippines", flag: "🇵🇭", dialCode: "+63" },
    { code: "SG", name: "Singapore", flag: "🇸🇬", dialCode: "+65" },
    { code: "TW", name: "Taiwan", flag: "🇹🇼", dialCode: "+886" },
    { code: "TH", name: "Thailand", flag: "🇹🇭", dialCode: "+66" },
    { code: "VN", name: "Vietnam", flag: "🇻🇳", dialCode: "+84" },
    { code: "HK", name: "Hong Kong", flag: "🇭🇰", dialCode: "+852" },
    { code: "JP", name: "Japan", flag: "🇯🇵", dialCode: "+81" },
    { code: "KR", name: "South Korea", flag: "🇰🇷", dialCode: "+82" },
    { code: "CN", name: "China", flag: "🇨🇳", dialCode: "+86" },
    { code: "IN", name: "India", flag: "🇮🇳", dialCode: "+91" },
    { code: "ID", name: "Indonesia", flag: "🇮🇩", dialCode: "+62" },
    { code: "MY", name: "Malaysia", flag: "🇲🇾", dialCode: "+60" },
    { code: "NZ", name: "New Zealand", flag: "🇳🇿", dialCode: "+64" },
    { code: "PK", name: "Pakistan", flag: "🇵🇰", dialCode: "+92" },
    { code: "SG", name: "Singapore", flag: "🇸🇬", dialCode: "+65" },
    { code: "TH", name: "Thailand", flag: "🇹🇭", dialCode: "+66" },
    { code: "VN", name: "Vietnam", flag: "🇻🇳", dialCode: "+84" },
    { code: "ZA", name: "South Africa", flag: "🇿🇦", dialCode: "+27" },
    { code: "EG", name: "Egypt", flag: "🇪🇬", dialCode: "+20" },
    { code: "NG", name: "Nigeria", flag: "🇳🇬", dialCode: "+234" },
    { code: "DZ", name: "Algeria", flag: "🇩🇿", dialCode: "+213" },
    { code: "AO", name: "Angola", flag: "🇦🇴", dialCode: "+244" },
    { code: "BJ", name: "Benin", flag: "🇧🇯", dialCode: "+229" },
    { code: "BW", name: "Botswana", flag: "🇧🇼", dialCode: "+267" },
    { code: "BF", name: "Burkina Faso", flag: "🇧🇫", dialCode: "+226" },
    { code: "BI", name: "Burundi", flag: "🇧🇮", dialCode: "+257" },
    { code: "CM", name: "Cameroon", flag: "🇨🇲", dialCode: "+237" },
    { code: "CV", name: "Cape Verde", flag: "🇨🇻", dialCode: "+238" },
    { code: "CF", name: "Central African Republic", flag: "🇨🇫", dialCode: "+236" },
    { code: "TD", name: "Chad", flag: "🇹🇩", dialCode: "+235" },
    { code: "KM", name: "Comoros", flag: "🇰🇲", dialCode: "+269" },
    { code: "CG", name: "Congo", flag: "🇨🇬", dialCode: "+242" },
    { code: "CD", name: "Democratic Republic of the Congo", flag: "🇨🇩", dialCode: "+243" },
    { code: "DJ", name: "Djibouti", flag: "🇩🇯", dialCode: "+253" },
    { code: "ER", name: "Eritrea", flag: "🇪🇷", dialCode: "+291" },
    { code: "ET", name: "Ethiopia", flag: "🇪🇹", dialCode: "+251" },
    { code: "GA", name: "Gabon", flag: "🇬🇦", dialCode: "+241" },
    { code: "GM", name: "Gambia", flag: "🇬🇲", dialCode: "+220" },
    { code: "GH", name: "Ghana", flag: "🇬🇭", dialCode: "+233" },
    { code: "GN", name: "Guinea", flag: "🇬🇳", dialCode: "+224" },
    { code: "GW", name: "Guinea-Bissau", flag: "🇬🇼", dialCode: "+245" },
    { code: "KE", name: "Kenya", flag: "🇰🇪", dialCode: "+254" },
    { code: "LS", name: "Lesotho", flag: "🇱🇸", dialCode: "+266" },
    { code: "LR", name: "Liberia", flag: "🇱🇷", dialCode: "+231" },
    { code: "LY", name: "Libya", flag: "🇱🇾", dialCode: "+218" },
    { code: "MW", name: "Malawi", flag: "🇲🇼", dialCode: "+265" },
    { code: "ML", name: "Mali", flag: "🇲🇱", dialCode: "+223" },
    { code: "MR", name: "Mauritania", flag: "🇲🇷", dialCode: "+222" },
    { code: "MU", name: "Mauritius", flag: "🇲🇺", dialCode: "+230" },
    { code: "YT", name: "Mayotte", flag: "🇾🇹", dialCode: "+262" },
    { code: "MA", name: "Morocco", flag: "🇲🇦", dialCode: "+212" },
    { code: "MZ", name: "Mozambique", flag: "🇲🇿", dialCode: "+258" },
    { code: "NA", name: "Namibia", flag: "🇳🇦", dialCode: "+264" },
    { code: "NE", name: "Niger", flag: "🇳🇪", dialCode: "+227" },
    { code: "NG", name: "Nigeria", flag: "🇳🇬", dialCode: "+234" },
    { code: "RW", name: "Rwanda", flag: "🇷🇼", dialCode: "+250" },
    { code: "RE", name: "Réunion", flag: "🇷🇪", dialCode: "+262" },
    { code: "ST", name: "São Tomé and Principe", flag: "🇸🇹", dialCode: "+239" },
    { code: "SN", name: "Senegal", flag: "🇸🇳", dialCode: "+221" },
    { code: "SC", name: "Seychelles", flag: "🇸🇨", dialCode: "+248" },
    { code: "SL", name: "Sierra Leone", flag: "🇸🇱", dialCode: "+232" },
    { code: "SO", name: "Somalia", flag: "🇸🇴", dialCode: "+252" },
    { code: "ZA", name: "South Africa", flag: "🇿🇦", dialCode: "+27" },
    { code: "SS", name: "South Sudan", flag: "🇸🇸", dialCode: "+211" },
    { code: "SD", name: "Sudan", flag: "🇸🇩", dialCode: "+249" },
    { code: "SZ", name: "Swaziland", flag: "🇸🇿", dialCode: "+268" },
    { code: "TZ", name: "Tanzania", flag: "🇹🇿", dialCode: "+255" },
    { code: "TG", name: "Togo", flag: "🇹🇬", dialCode: "+228" },
    { code: "TN", name: "Tunisia", flag: "🇹🇳", dialCode: "+216" },
    { code: "UG", name: "Uganda", flag: "🇺🇬", dialCode: "+256" },
    { code: "EH", name: "Western Sahara", flag: "🇪🇭", dialCode: "+212" },
    { code: "ZM", name: "Zambia", flag: "🇿🇲", dialCode: "+260" },
    { code: "ZW", name: "Zimbabwe", flag: "🇿🇼", dialCode: "+263" },
  ];

  const [dialCode, setDialCode] = useState('91');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: `${selectedCountry.dialCode}${phoneNumber}`,
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
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: `${selectedCountry.dialCode}${phoneNumber}`,
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
    <div className="min-h-screen bg-primary-dark dark:bg-primary-dark flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 rounded-sm bg-primary-light/10 p-10">
        {/* Left side - Phone Login */}
        <div className="p-8 rounded-sm">
          <div className="mb-8">
            <img src="/logo.png" alt="Logo" className="h-8" />
          </div>
          <h2 className="text-2xl text-white font-semibold mb-2">
            Welcome Back to Chat App!
          </h2>
          <p className="text-gray-400 mb-6 text-sm">
            Message privately with friends and family using Chat App.
          </p>

          <form onSubmit={handleSubmit}>
           {/* Country Select */}
           <div>
      <label className="block text-sm mb-1 text-white">Country</label>
      <PhoneInput
        country={'in'}
        value={phone}
        onChange={(value, data) => {
          setPhone(value);
          setDialCode(data.dialCode); // you can use data.name for full name
          console.log(data);
        }}
        inputProps={{
          readOnly: true, // makes it act more like a selector
        }}
        disableDropdown={false}
        disableCountryCode={true}
        countryCodeEditable={false}
        enableSearch={true}
        onlyCountries={['in', 'us', 'gb', 'au', 'ca', 'fr', 'de', 'cn']} // optional
        containerClass="!w-full"
        inputClass="!w-full !bg-white !text-red-500 !h-12 !pl-14 !cursor-pointer"
        buttonClass="!bg-black !border-none !w-full !cursor-pointer"
        dropdownClass="!text-black"
        searchClass="!bg-white !text-red-500"
        className="w-[500px] h-12 "
      />
    </div>

      {/* Mobile No */}
      {/* <div>
        <label className="block text-sm mb-1">Mobile No.</label>
        <div className="flex items-center bg-black border border-gray-600 rounded-md h-12 px-4">
          <span className="mr-2 text-white">+{dialCode.dialCode}</span>
          <input
            type="text"
            className="flex-1 bg-black text-white outline-none"
            placeholder="Your Mobile No."
            value={phone.trim()}
            onChange={(e) =>
              setPhone(`${e.target.value.replace(/\D/g, '')}`)
            }
          />
        </div>
      </div> */}

              {/* Phone Number Input */}
              <div>
                <label className="block text-gray-400 mb-2">Mobile No.</label>
                <div className="flex">
                  <span className="inline-flex items-center px-4 bg-[#1f1f1f] text-white rounded-l-md">
                    +{dialCode.dialCode}
                  </span>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Your Mobile No."
                    className="flex-1 bg-[#1f1f1f] text-white rounded-r-md p-3 focus:outline-none"
                  />
                </div>
              </div>
   

            <button
              type="submit"
              className="w-full bg-primary text-white rounded-md py-3 font-medium hover:bg-primary/80 transition-colors mt-6"
            >
              Next
            </button>
          </form>
        </div>

        {/* Right side - QR Code */}
        <div className="bg-primary/50 p-8 rounded-lg flex flex-col items-center justify-center">
          <h3 className="text-xl text-white font-semibold mb-6">
            Scan to Login with Chat App
          </h3>
          <div className="bg-white p-4 rounded-lg mb-6">
            <QRCodeSVG
              value={Math.random().toString(36).substring(2, 15)}
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
          phoneNumber={`${selectedCountry.dialCode}${phoneNumber}`}
          onVerify={handleOtpVerification}
          onClose={() => setShowOtpModal(false)}
        />
      )}
    </div>
  );
};

export default LoginNew;
