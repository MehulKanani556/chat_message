import React, { useState, useEffect, useRef } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

import { BASE_URL } from '../utils/baseUrl';

const SERVER_URL = BASE_URL.replace('/api', '');

// Initialize FingerprintJS
const fpPromise = FingerprintJS.load();

// Function to create a new device ID
const createNewDeviceId = async () => {
  const fp = await fpPromise;
  const result = await fp.get();
  const visitorId = result.visitorId;
  
  // Store the new device ID
  localStorage.setItem('deviceId', visitorId);
  localStorage.setItem('deviceCreatedAt', new Date().toISOString());
  
  return visitorId;
};

// Function to get or create device ID
const getDeviceId = async () => {
  let deviceId = localStorage.getItem('deviceId');
  const deviceCreatedAt = localStorage.getItem('deviceCreatedAt');
  
  // If no device ID exists or it's older than 30 days, create a new one
  if (!deviceId || (deviceCreatedAt && (new Date() - new Date(deviceCreatedAt)) > 30 * 24 * 60 * 60 * 1000)) {
    deviceId = await createNewDeviceId();
  }
  
  return deviceId;
};

const getDeviceName = (deviceInfo) => {
  const { browser, deviceType, hardware } = deviceInfo;
  
  // Try to extract device model from user agent
  const userAgent = browser.userAgent;
  let deviceName = '';
  
  if (deviceType.isMobile) {
    if (userAgent.includes('iPhone')) {
      deviceName = 'iPhone';
    } else if (userAgent.includes('Android')) {
      const match = userAgent.match(/Android.*?;\s([^;)]+)/);
      deviceName = match ? match[1] : 'Android Device';
    }
  } else if (deviceType.isTablet) {
    if (userAgent.includes('iPad')) {
      deviceName = 'iPad';
    } else {
      deviceName = 'Android Tablet';
    }
  } else {
    // For desktop, include CPU and GPU information
    const cpuInfo = `${hardware.cpu.cores} cores, ${hardware.cpu.memory}GB RAM`;
    const gpuInfo = hardware.webgl?.renderer ? `, ${hardware.webgl.renderer.split('/')[0]}` : '';
    deviceName = `${browser.platform} Desktop (${cpuInfo}${gpuInfo})`;
  }
  
  return deviceName || 'Unknown Device';
};

// Function to get detailed device information
const getDetailedDeviceInfo = async () => {
  // Get or create device ID
  const deviceId = await getDeviceId();

  const deviceInfo = {
    // Hardware Information
    hardware: {
      // CPU Information
      cpu: {
        cores: navigator.hardwareConcurrency,
        memory: navigator.deviceMemory,
        architecture: navigator.platform,
      },
      // Screen Information
      display: {
        width: window.screen.width,
        height: window.screen.height,
        colorDepth: window.screen.colorDepth,
        pixelDepth: window.screen.pixelDepth,
        orientation: window.screen.orientation?.type,
        devicePixelRatio: window.devicePixelRatio,
      },
      // Input Information
      input: {
        maxTouchPoints: navigator.maxTouchPoints,
        hasTouch: 'ontouchstart' in window,
        hasPointer: 'onpointerdown' in window,
      },
      // Battery Information (if available)
      battery: null,
      // WebGL Information (for GPU details)
      webgl: null,
    },
    
    // Browser Information
    browser: {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      vendor: navigator.vendor,
      appVersion: navigator.appVersion,
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack,
    },
    
    // Network Information
    network: {
      connection: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType,
        rtt: navigator.connection.rtt,
        downlink: navigator.connection.downlink,
        saveData: navigator.connection.saveData,
      } : null,
      online: navigator.onLine,
    },
    
    // Time and Location
    timezone: {
      offset: new Date().getTimezoneOffset(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    
    // Device Type Detection
    deviceType: {
      isMobile: /Mobile|Android|iPhone/i.test(navigator.userAgent),
      isTablet: /iPad|Android/i.test(navigator.userAgent) && !/Mobile/i.test(navigator.userAgent),
      isDesktop: !/Mobile|Android|iPhone|iPad/i.test(navigator.userAgent),
    },

    // Device ID Information
    deviceId: {
      id: deviceId,
      createdAt: localStorage.getItem('deviceCreatedAt'),
      isNew: !localStorage.getItem('deviceId')
    }
  };

  // Get WebGL information
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      deviceInfo.hardware.webgl = {
        vendor: gl.getParameter(gl.VENDOR),
        renderer: gl.getParameter(gl.RENDERER),
        version: gl.getParameter(gl.VERSION),
      };
    }
  } catch (e) {
    console.warn('WebGL not available');
  }

  // Get battery information if available
  if (navigator.getBattery) {
    navigator.getBattery().then(battery => {
      deviceInfo.hardware.battery = {
        charging: battery.charging,
        chargingTime: battery.chargingTime,
        dischargingTime: battery.dischargingTime,
        level: battery.level,
      };
    }).catch(() => {
      console.warn('Battery information not available');
    });
  }

  return {
    deviceId: deviceInfo.deviceId.id,
    deviceName: getDeviceName(deviceInfo),
    deviceType: deviceInfo.deviceType.isMobile ? 'mobile' : 
                deviceInfo.deviceType.isTablet ? 'tablet' : 'desktop',
    deviceDetails: deviceInfo
  };
};

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
      const deviceInfo = await getDetailedDeviceInfo();

      const response = await axios.post(`${SERVER_URL}/api/qr-login`, {
        qrData: {
          sessionId: qrData.sessionId,
          timestamp: qrData.timestamp
        },
        deviceInfo
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
