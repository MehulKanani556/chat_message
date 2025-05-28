import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import axios from 'axios';

const SERVER_URL = 'https://chat-message-0fml.onrender.com';

const Scanner = ({ onScanSuccess, onScanError }) => {
  const [cameraError, setCameraError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef(null);

  const validateQRData = (data) => {
    try {
      console.log('Validating QR data:', data);
      const qrData = JSON.parse(data);
      
      // Check if it's a login QR code
      if (qrData.action !== 'login') {
        console.log('Invalid QR code type:', qrData.action);
        return { valid: false, error: "Invalid QR code type" };
      }

      // Check if session ID exists
      if (!qrData.sessionId) {
        console.log('Missing session ID');
        return { valid: false, error: "QR code is missing session ID" };
      }

      // Check if QR code is expired (5 minutes)
      const currentTime = new Date().getTime();
      const qrTime = new Date(qrData.timestamp).getTime();
      if (currentTime - qrTime > 5 * 60 * 1000) {
        console.log('QR code expired');
        return { valid: false, error: "QR code has expired" };
      }

      console.log('Valid QR code data:', qrData);
      return { valid: true, data: qrData };
    } catch (err) {
      console.error('QR validation error:', err);
      return { valid: false, error: "Invalid QR code format" };
    }
  };

  const handleQRLogin = async (qrData) => {
    try {
      console.log('Making QR login request with data:', qrData);
      const response = await axios.post(`${SERVER_URL}/api/auth/qr-login`, {
        qrData: {
          userId: qrData.userId,
          timestamp: qrData.timestamp
        }
      });

      console.log('QR login response:', response.data);
      if (onScanSuccess) {
        onScanSuccess(response.data);
      }
    } catch (error) {
      console.error('QR login error:', error);
      if (onScanError) {
        onScanError(error.response?.data?.message || 'Login failed');
      }
    }
  };

  useEffect(() => {
    const startScanner = async () => {
      try {
        // Create new instance if not exists
        if (!scannerRef.current) {
          scannerRef.current = new Html5Qrcode("qr-reader");
        }
        
        // Get available cameras
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length) {
          // Start with the first camera
          const cameraId = devices[0].id;
          console.log('Starting scanner with camera:', cameraId);
          
          // Only start if not already scanning
          if (!isScanning) {
            await scannerRef.current.start(
              cameraId,
              {
                fps: 10,
                qrbox: { width: 300, height: 300 },
                aspectRatio: 1.0,
                disableFlip: false,
                experimentalFeatures: {
                  useBarCodeDetectorIfSupported: true
                }
              },
              async (decodedText) => {
                console.log('QR code scanned:', decodedText);
                const validation = validateQRData(decodedText);
                if (validation.valid) {
                  await handleQRLogin(validation.data);
                } else {
                  console.log('Invalid QR code:', validation.error);
                  if (onScanError) {
                    onScanError(validation.error);
                  }
                }
              },
              (errorMessage) => {
                // Only show errors that aren't "No MultiFormat Readers" errors
                if (!errorMessage.includes("No MultiFormat Readers")) {
                  console.error('Scanner error:', errorMessage);
                  if (onScanError) {
                    onScanError(errorMessage);
                  }
                }
              }
            );
            
            setIsScanning(true);
            setCameraError(null);
          }
        } else {
          console.error('No cameras found');
          setCameraError("No cameras found");
        }
      } catch (err) {
        console.error("Scanner error:", err);
        setCameraError("Failed to start camera: " + err.message);
        setIsScanning(false);
      }
    };

    startScanner();

    // Cleanup function
    return () => {
      console.log('Cleaning up scanner...');
      const stopScanner = async () => {
        if (scannerRef.current && isScanning) {
          try {
            await scannerRef.current.stop();
            setIsScanning(false);
          } catch (err) {
            console.error("Failed to stop scanner:", err);
          }
        }
      };
      
      stopScanner();
    };
  }, [onScanSuccess, onScanError, isScanning]);

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
          <div id="qr-reader" className="w-full max-w-md mx-auto"></div>
          <div className="mt-4 text-center text-sm text-gray-600">
            <p>Position the QR code within the frame</p>
            <p className="mt-1">Make sure the code is well-lit and clearly visible</p>
            <p className="mt-1 text-xs">Scan the QR code from the login page</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Scanner;
