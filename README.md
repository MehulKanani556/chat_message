# Chat App with Phone Authentication

A modern chat application with phone number authentication and QR code login functionality.

## Features

- Phone number authentication with OTP verification
- QR code login support
- Country code selection
- Modern UI with Tailwind CSS
- Responsive design

## Setup Instructions

1. Install dependencies:

```bash
cd front
npm install
```

2. Start the development server:

```bash
npm start
```

The application will be available at http://localhost:3000

## Project Structure

- `front/src/pages/Login.jsx` - Main login page component
- `front/src/components/OtpModal.jsx` - OTP verification modal
- `front/tailwind.config.js` - Tailwind CSS configuration
- `front/package.json` - Project dependencies

## API Endpoints Required

The frontend expects the following API endpoints to be available:

- `POST /api/auth/send-otp` - Send OTP to phone number
- `POST /api/auth/verify-otp` - Verify OTP
- `GET /api/auth/qr-login` - QR code login verification

## Environment Variables

Create a `.env` file in the frontend directory with the following variables:

```env
REACT_APP_API_URL=http://localhost:3001
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request
