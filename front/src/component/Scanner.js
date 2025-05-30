import React, { useState, useEffect } from 'react';
// import { QrReader } from 'react-qr-reader';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

const SERVER_URL = 'http://localhost:5000';

const Scanner = () => {
  const [cameraError, setCameraError] = useState(null);
  const [scanStatus, setScanStatus] = useState('ready');
  const [socket, setSocket] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      forceNew: true
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  const validateQRData = (data) => {
    try {
      console.log('Validating QR data:', data);
      const qrData = JSON.parse(data);
      
      // Check if it's a login QR code
      if (qrData.action !== 'login') {
        return { valid: false, error: "Invalid QR code type" };
      }

      // Check if all required fields exist
      if (!qrData.sessionId || !qrData.timestamp) {
        return { valid: false, error: "QR code is missing required data" };
      }

      // Check if QR code is expired (5 minutes)
      const currentTime = new Date().getTime();
      const qrTime = new Date(qrData.timestamp).getTime();
      if (currentTime - qrTime > 5 * 60 * 1000) {
        return { valid: false, error: "QR code has expired" };
      }

      return { valid: true, data: qrData };
    } catch (err) {
      console.error('QR validation error:', err);
      return { valid: false, error: "Invalid QR code format" };
    }
  };

  const handleQRLogin = async (qrData) => {
    try {
      setScanStatus('processing');
      console.log('Making QR login request with data:', qrData);
      
      // Get current user's credentials
      const authToken = sessionStorage.getItem('token');
      if (!authToken) {
        throw new Error('You must be logged in to scan QR codes');
      }

      const response = await axios.post(`${SERVER_URL}/api/qr-login`, {
        qrData: {
          sessionId: qrData.sessionId,
          timestamp: qrData.timestamp
        }
      }, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      console.log('QR login response:', response.data);
      
      if (socket) {
        socket.emit('qr-scan-success', {
          sessionId: qrData.sessionId,
          token: response.data.token,
          userId: response.data.userId,
          username: response.data.username,
          userData: response.data.userData
        });
      }

      setScanStatus('success');
      
      // Navigate back to chat page after a brief delay
      setTimeout(() => {
        navigate('/chat');
      }, 1500);
    } catch (error) {
      console.error('QR login error:', error);
      setScanStatus('error');
      
      if (socket) {
        socket.emit('qr-scan-error', {
          sessionId: qrData.sessionId,
          message: error.response?.data?.message || 'Login failed'
        });
      }
    }
  };

  const handleScan = (result) => {
    if (result) {
      console.log('Raw QR code scanned:', result.text);
      try {
        const validation = validateQRData(result.text);
        if (validation.valid) {
          console.log('QR data validation passed:', validation.data);
          handleQRLogin(validation.data);
        } else {
          console.log('QR data validation failed:', validation.error);
          setScanStatus('error');
        }
      } catch (parseError) {
        console.error('Failed to parse QR code data:', parseError);
        setScanStatus('error');
      }
    }
  };

  const handleError = (error) => {
    console.error('Scanner error:', error);
    setCameraError("Failed to start camera: " + error.message);
  };

  const getStatusMessage = () => {
    switch (scanStatus) {
      case 'processing':
        return 'Processing login...';
      case 'success':
        return 'Login successful! Redirecting...';
      case 'error':
        return 'Login failed. Please try again.';
      default:
        return 'Connecting to server...';
    }
  };

  return (
    <div className="scanner-container">
      {cameraError ? (
        <div className="p-4 bg-red-100 rounded-lg">
          <p className="text-red-800 text-center">{cameraError}</p>
          <p className="text-sm text-red-600 text-center mt-2">
            Please check your browser settings and ensure camera access is allowed.
          </p>
        </div>
      ) : (
        <div className="relative">
          <div className="w-full max-w-md mx-auto border-4 border-blue-500 rounded-lg overflow-hidden">
            {/* <QrReader
              constraints={{
                facingMode: 'environment',
                aspectRatio: 1,
                width: { min: 360, ideal: 640, max: 1920 },
                height: { min: 360, ideal: 640, max: 1920 }
              }}
              onResult={handleScan}
              onError={handleError}
              style={{ width: '100%', height: '100%' }}
              videoStyle={{ objectFit: 'cover' }}
              videoContainerStyle={{ width: '100%', height: '100%' }}
              className="w-full h-full"
            /> */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-blue-500"></div>
              <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-blue-500"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-blue-500"></div>
              <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-blue-500"></div>
            </div>
          </div>
          <div className="mt-4 text-center text-sm text-gray-600">
            <p>Position the QR code within the frame</p>
            <p className="mt-1">Make sure the code is well-lit and clearly visible</p>
            <p className="mt-1 text-xs">Scan the QR code from the login page</p>
          </div>
          <div className={`mt-4 p-4 rounded-lg text-center ${
            scanStatus === 'processing' ? 'bg-blue-100 text-blue-800' :
            scanStatus === 'success' ? 'bg-green-100 text-green-800' :
            scanStatus === 'error' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {getStatusMessage()}
          </div>
        </div>
      )}
    </div>
  );
};

export default Scanner;
