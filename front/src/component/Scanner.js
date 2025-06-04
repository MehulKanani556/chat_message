import React, { useState, useEffect, useRef } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

import { BASE_URL } from '../utils/baseUrl';

const SERVER_URL = BASE_URL.replace('/api', '');



const ScannerComponent = () => {
  const [cameraError, setCameraError] = useState(null);
  const [scanResult, setScanResult] = useState(null);
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

    newSocket.on('connect', () => {
      console.log('Socket.IO connected');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket.IO disconnected');
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
      setScanResult('Processing login...');
      console.log('Making QR login request with data:', qrData);
      
      // Get current user's credentials
      const authToken = sessionStorage.getItem('token');
      if (!authToken) {
        throw new Error('You must be logged in to scan QR codes');
      }

      // Get device information with fingerprint
    

      const response = await axios.post(`${SERVER_URL}/api/qr-login`, {
        qrData: {
          sessionId: qrData.sessionId,
          timestamp: qrData.timestamp
        },
        deviceInfo:qrData.deviceInfo
      }, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      console.log('QR login response:', response.data);
      
      if (socket) {
        socket.emit('qr-scan-success', {
          sessionId: qrData.sessionId,
          token: authToken,
          userId: response.data.userId,
          username: response.data.username,
          userData: response.data.userData
        });
      }

      setScanResult('Login successful! Redirecting...');
      
      // Navigate back to chat page after a brief delay
      setTimeout(() => {
        navigate('/chat');
      }, 1500);
    } catch (error) {
      console.error('QR login error:', error);
      
      // Handle device limit error
      if (error.response?.status === 403) {
        setScanResult('Device limit reached. You can only log in from 5 devices. Please log out from another device first.');
      } else {
        setScanResult('Login failed. Please try again.');
      }
      
      if (socket) {
        socket.emit('qr-scan-error', {
          sessionId: qrData.sessionId,
          message: error.response?.data?.message || 'Login failed'
        });
      }
    }
  };

  const handleScan = (result) => {
    if (result && result.length > 0) {
      const qrData = result[0].rawValue;
      console.log('Raw QR code scanned:', qrData);
      try {
        const validation = validateQRData(qrData);
        if (validation.valid) {
          console.log('QR data validation passed:', validation.data);
          handleQRLogin(validation.data);
        } else {
          console.log('QR data validation failed:', validation.error);
          setScanResult('Scan failed: ' + validation.error);
        }
      } catch (parseError) {
        console.error('Failed to parse QR code data:', parseError);
        setScanResult('Scan failed: Invalid QR code format');
      }
    }
  };

  const handleError = (error) => {
    console.error('Scanner error:', error);
    setCameraError("Failed to start camera: " + error.message);
  };

  const getStatusMessage = () => {
    return '';
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
            <Scanner
              constraints={{
                video: {
                  facingMode: 'environment'
                }
              }}
              onScan={handleScan}
              onError={handleError}
            />
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-blue-500"></div>
              <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-blue-500"></div>
              <div className="absolute bottom_0 left-0 w-16 h-16 border-b-4 border-l-4 border-blue-500"></div>
              <div className="absolute bottom_0 right-0 w-16 h-16 border-b-4 border-r-4 border-blue-500"></div>
            </div>
          </div>
          {scanResult && (
            <div className={`mt-4 p-4 rounded-lg text-center ${scanResult.startsWith('Scan failed') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
              <p>{scanResult}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ScannerComponent;
