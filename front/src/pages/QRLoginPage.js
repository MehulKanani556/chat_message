// QRLoginPage.jsx
import React, { useEffect, useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import io from 'socket.io-client';
import { BASE_URL } from '../utils/baseUrl';
import { useSocket } from '../context/SocketContext';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

const SERVER_URL = BASE_URL.replace('/api', ''); // Remove /api from the URL

// Initialize FingerprintJS
const fpPromise = FingerprintJS.load();

// Function to get detailed device information
const getDetailedDeviceInfo = async () => {
  // Get visitor identifier
  const fp = await fpPromise;
  const result = await fp.get();
  const visitorId = result.visitorId;

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

    // FingerprintJS Information
    fingerprint: {
      visitorId: visitorId,
      components: result.components,
      confidence: result.confidence
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
    deviceId: visitorId,
    deviceName: getDeviceName(deviceInfo),
    deviceType: deviceInfo.deviceType.isMobile ? 'mobile' : 
                deviceInfo.deviceType.isTablet ? 'tablet' : 'desktop',
    deviceDetails: deviceInfo
  };
};

// Function to get a human-readable device name
const getDeviceName = (deviceInfo) => {
  const { browser, deviceType, hardware } = deviceInfo;
  
  // Try to extract device model and browser name from user agent
  const userAgent = browser.userAgent;
  let deviceName = '';
  let browserName = '';
  let osName = '';
  
  // Detect OS
  if (userAgent.includes('Windows')) {
    osName = 'Windows';
  } else if (userAgent.includes('Mac')) {
    osName = 'macOS';
  } else if (userAgent.includes('Linux')) {
    osName = 'Linux';
  } else if (userAgent.includes('Android')) {
    osName = 'Android';
  } else if (userAgent.includes('iOS')) {
    osName = 'iOS';
  } else {
    osName = 'Unknown OS';
  }
  
  // More accurate browser detection using multiple indicators
  if (userAgent.includes('Edg/')) {
    browserName = 'Microsoft Edge';
  } else if (userAgent.includes('Firefox/')) {
    browserName = 'Mozilla Firefox';
  } else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome')) {
    browserName = 'Apple Safari';
  } else if (userAgent.includes('OPR/') || userAgent.includes('Opera/')) {
    browserName = 'Opera Browser';
  } else if (userAgent.includes('Chrome/')) {
    browserName = 'Google Chrome';
  } else {
    browserName = 'Unknown Browser';
  }
  
  // Extract device model
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
  } 
  
  // Return both OS and browser name  
  return `${browserName} (${osName})` || 'Unknown Browser (Unknown OS)';
};

const QRLoginPage = () => {
  const [sessionId] = useState(() => uuidv4()); // Generate sessionId only once
  const [status, setStatus] = useState('waiting');
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const socketRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get device information when component mounts
    const fetchDeviceInfo = async () => {
      const info = await getDetailedDeviceInfo();
      setDeviceInfo(info);
    };
    fetchDeviceInfo();

    // Set up Socket.IO connection
    socketRef.current = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      forceNew: true
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      setIsConnected(true);
      setError(null);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
      setIsConnected(false);
      setError('Connection error. Please refresh the page.');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('qr-scan-success', (data) => {
      if (data.sessionId === sessionId) {
        // Store authentication data
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('userId', data.userId);
        sessionStorage.setItem('username', data.username);
        
        setStatus('success');
        // Navigate to chat page after successful login
        setTimeout(() => {
          navigate('/chat');
        }, 1500);
      }
    });

    socket.on('qr-scan-error', (data) => {
      if (data.sessionId === sessionId) {
        setError(data.message);
        setStatus('error');
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [sessionId, navigate]);

  const getQRCodeData = () => {
    return JSON.stringify({
      action: 'login',
      sessionId: sessionId,
      timestamp: new Date().toISOString(),
      deviceInfo: {
        deviceId: deviceInfo?.deviceId,
        deviceName: deviceInfo?.deviceName,
        deviceType: deviceInfo?.deviceType
      }
    });
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="">
        <div className="mb-6 flex justify-center">
          <div className="rounded-lg shadow">
            <QRCodeSVG
              value={getQRCodeData()}
              size={256}
              level="H"
              includeMargin={true}
            />
          </div>
        </div>

        <div className="text-center">
          {status === 'waiting' && (
            <p className="text-white/50">Waiting for scan...</p>
          )}
          {status === 'success' && (
            <p className="text-green-600">Login successful! Redirecting...</p>
          )}
          {status === 'error' && (
            <p className="text-red-600">{error || 'An error occurred'}</p>
          )}
        </div>

        <div className="mt-4 text-sm text-white/60">
          <p>1. Open App on your device</p>
          <p>2. Tap on <b>⋮</b> icon</p>
          <p>3. Tap on <b>Linked Device</b> , then <b>Link Device</b></p>
          <p>4. Scan the QR Code</p>
        </div>
      </div>
    </div>
  );
};

export default QRLoginPage;