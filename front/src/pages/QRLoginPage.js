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
  console.log(deviceInfo,"deviceInfo")
  const userAgent = browser.userAgent;
  let deviceName = '';
  let browserName = '';
  
  // Extract browser name
  if (userAgent.includes('Chrome')) {
    browserName = 'Chrome';
  } else if (userAgent.includes('Firefox')) {
    browserName = 'Firefox';
  } else if (userAgent.includes('Safari')) {
    browserName = 'Safari';
  } else if (userAgent.includes('Edge')) {
    browserName = 'Edge';
  } else if (userAgent.includes('Opera')) {
    browserName = 'Opera';
  } else {
    browserName = 'Unknown Browser';
  }
  console.log(browserName,"browserName")
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
  } else {
    // For desktop, include CPU and GPU information
    const cpuInfo = `${hardware.cpu.cores} cores, ${hardware.cpu.memory}GB RAM`;
    const gpuInfo = hardware.webgl?.renderer ? `, ${hardware.webgl.renderer.split('/')[0]}` : '';
    deviceName = `${browser.platform} Desktop (${cpuInfo}${gpuInfo})`;
  }
  
  // Combine device name and browser name
  return `${deviceName} with ${browserName}` || 'Unknown Device with Unknown Browser';
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
      console.log('Socket.IO connected');
      setIsConnected(true);
      setError(null);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
      setIsConnected(false);
      setError('Connection error. Please refresh the page.');
    });

    socket.on('disconnect', () => {
      console.log('Socket.IO disconnected');
      setIsConnected(false);
    });

    socket.on('qr-scan-success', (data) => {
      console.log('Received QR scan success:', data);
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
      console.log('Received QR scan error:', data);
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

// native code

// // App.js - Main Application Entry Point
// import React from 'react';
// import { NavigationContainer } from '@react-navigation/native';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { GestureHandlerRootView } from 'react-native-gesture-handler';

// import LoginScreen from './screens/LoginScreen';
// import QRScannerScreen from './screens/QRScannerScreen';
// import ChatScreen from './screens/ChatScreen';
// import SplashScreen from './screens/SplashScreen';

// const Stack = createNativeStackNavigator();

// const App = () => {
//   return (
//     <GestureHandlerRootView style={{ flex: 1 }}>
//       <NavigationContainer>
//         <Stack.Navigator initialRouteName="Splash">
//           <Stack.Screen 
//             name="Splash" 
//             component={SplashScreen} 
//             options={{ headerShown: false }}
//           />
//           <Stack.Screen 
//             name="Login" 
//             component={LoginScreen} 
//             options={{ headerShown: false }}
//           />
//           <Stack.Screen 
//             name="QRScanner" 
//             component={QRScannerScreen} 
//             options={{ title: 'Scan QR Code' }}
//           />
//           <Stack.Screen 
//             name="Chat" 
//             component={ChatScreen} 
//             options={{ title: 'Chat' }}
//           />
//         </Stack.Navigator>
//       </NavigationContainer>
//     </GestureHandlerRootView>
//   );
// };

// export default App;

// // screens/SplashScreen.js - Initial loading screen
// import React, { useEffect } from 'react';
// import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const SplashScreen = ({ navigation }) => {
//   useEffect(() => {
//     checkAuthState();
//   }, []);

//   const checkAuthState = async () => {
//     try {
//       // Check if user is logged in
//       const userId = await AsyncStorage.getItem('userId');
//       const username = await AsyncStorage.getItem('username');
      
//       // Wait a moment to show splash screen
//       setTimeout(() => {
//         if (userId && username) {
//           // User is logged in, go to QR scanner
//           navigation.replace('QRScanner');
//         } else {
//           // User is not logged in, go to login
//           navigation.replace('Login');
//         }
//       }, 1000);
//     } catch (error) {
//       console.error('Error checking auth state:', error);
//       navigation.replace('Login');
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Chat App</Text>
//       <ActivityIndicator size="large" color="#2196F3" style={styles.loader} />
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#FFFFFF',
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginBottom: 20,
//   },
//   loader: {
//     marginTop: 20,
//   },
// });

// export default SplashScreen;

// // screens/LoginScreen.js - App login screen
// import React, { useState } from 'react';
// import { 
//   View, 
//   Text, 
//   TextInput, 
//   TouchableOpacity, 
//   StyleSheet, 
//   Alert,
//   KeyboardAvoidingView,
//   Platform 
// } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const LoginScreen = ({ navigation }) => {
//   const [username, setUsername] = useState('');
//   const [password, setPassword] = useState('');
//   const [loading, setLoading] = useState(false);
  
//   // In a real app, this would connect to your backend auth system
//   // This is simplified for demo purposes
//   const handleLogin = async () => {
//     if (!username || !password) {
//       Alert.alert('Error', 'Please enter both username and password');
//       return;
//     }
    
//     setLoading(true);
    
//     try {
//       // Simulating API call with timeout
//       await new Promise(resolve => setTimeout(resolve, 1000));
      
//       // In a real app, you would validate credentials with your backend
//       // and get a real user ID
//       const mockUserId = 'user_' + Math.random().toString(36).substring(2, 9);
      
//       // Store user data in AsyncStorage
//       await AsyncStorage.setItem('userId', mockUserId);
//       await AsyncStorage.setItem('username', username);
      
//       // Navigate to QR Scanner
//       navigation.replace('QRScanner');
//     } catch (error) {
//       console.error('Login error:', error);
//       Alert.alert('Error', 'Failed to login. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };
  
//   return (
//     <KeyboardAvoidingView
//       style={styles.container}
//       behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//     >
//       <View style={styles.loginForm}>
//         <Text style={styles.title}>Chat App</Text>
//         <Text style={styles.subtitle}>Sign in to your account</Text>
        
//         <TextInput
//           style={styles.input}
//           placeholder="Username"
//           value={username}
//           onChangeText={setUsername}
//           autoCapitalize="none"
//         />
        
//         <TextInput
//           style={styles.input}
//           placeholder="Password"
//           value={password}
//           onChangeText={setPassword}
//           secureTextEntry
//         />
        
//         <TouchableOpacity 
//           style={styles.loginButton}
//           onPress={handleLogin}
//           disabled={loading}
//         >
//           <Text style={styles.loginButtonText}>
//             {loading ? 'Signing In...' : 'Sign In'}
//           </Text>
//         </TouchableOpacity>
//       </View>
//     </KeyboardAvoidingView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F5F5F5',
//   },
//   loginForm: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     marginBottom: 8,
//   },
//   subtitle: {
//     fontSize: 16,
//     color: '#666',
//     marginBottom: 32,
//   },
//   input: {
//     width: '100%',
//     height: 50,
//     backgroundColor: '#FFFFFF',
//     borderRadius: 8,
//     paddingHorizontal: 16,
//     marginBottom: 16,
//     borderWidth: 1,
//     borderColor: '#E0E0E0',
//   },
//   loginButton: {
//     width: '100%',
//     height: 50,
//     backgroundColor: '#2196F3',
//     borderRadius: 8,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginTop: 16,
//   },
//   loginButtonText: {
//     color: '#FFFFFF',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
// });

// export default LoginScreen;

// // screens/QRScannerScreen.js - QR Code Scanner
// import React, { useState, useEffect } from 'react';
// import { 
//   View, 
//   Text, 
//   StyleSheet, 
//   TouchableOpacity, 
//   Alert 
// } from 'react-native';
// import { Camera } from 'expo-camera';
// import { BarCodeScanner } from 'expo-barcode-scanner';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import io from 'socket.io-client';

// const SERVER_URL = 'http://your-server-url.com:3000'; // Change to your server URL

// const QRScannerScreen = ({ navigation }) => {
//   const [hasPermission, setHasPermission] = useState(null);
//   const [scanned, setScanned] = useState(false);
//   const [username, setUsername] = useState('');
//   const [status, setStatus] = useState('Ready to scan');
//   const [socket, setSocket] = useState(null);
  
//   // Request camera permission and setup socket
//   useEffect(() => {
//     (async () => {
//       // Get camera permission
//       const { status } = await Camera.requestCameraPermissionsAsync();
//       setHasPermission(status === 'granted');
      
//       // Get username from storage
//       const storedUsername = await AsyncStorage.getItem('username');
//       if (storedUsername) {
//         setUsername(storedUsername);
//       }
      
//       // Setup socket connection
//       const socketConnection = io(SERVER_URL);
//       setSocket(socketConnection);
      
//       return () => {
//         if (socketConnection) {
//           socketConnection.disconnect();
//         }
//       };
//     })();
//   }, []);
  
//   // Handle QR code scan
//   const handleBarCodeScanned = async ({ type, data }) => {
//     try {
//       // Prevent multiple scans
//       if (scanned) return;
//       setScanned(true);
      
//       // Parse QR data
//       const qrData = JSON.parse(data);
      
//       // Verify it's a login QR code
//       if (qrData.action !== 'login' || !qrData.sessionId) {
//         setStatus('Invalid QR code');
//         setTimeout(() => {
//           setScanned(false);
//           setStatus('Ready to scan');
//         }, 2000);
//         return;
//       }
      
//       setStatus('Authenticating...');
      
//       // Get user data from storage
//       const userId = await AsyncStorage.getItem('userId');
//       if (!userId || !username) {
//         Alert.alert('Error', 'User data not found. Please log in again.');
//         navigation.replace('Login');
//         return;
//       }
      
//       // Send authentication data to server
//       if (socket) {
//         socket.emit('authenticate', {
//           sessionId: qrData.sessionId,
//           userId,
//           username
//         });
        
//         setStatus('Authentication successful!');
        
//         // Reset after 3 seconds
//         setTimeout(() => {
//           setScanned(false);
//           setStatus('Ready to scan');
//         }, 3000);
//       } else {
//         setStatus('Connection error');
//         setTimeout(() => {
//           setScanned(false);
//           setStatus('Ready to scan');
//         }, 2000);
//       }
//     } catch (error) {
//       console.error('QR scan error:', error);
//       setStatus('Error processing QR code');
//       setTimeout(() => {
//         setScanned(false);
//         setStatus('Ready to scan');
//       }, 2000);
//     }
//   };
  
//   // Handle logout
//   const handleLogout = async () => {
//     try {
//       await AsyncStorage.removeItem('userId');
//       await AsyncStorage.removeItem('username');
//       navigation.replace('Login');
//     } catch (error) {
//       console.error('Logout error:', error);
//       Alert.alert('Error', 'Failed to log out. Please try again.');
//     }
//   };
  
//   // Show screen based on permission status
//   if (hasPermission === null) {
//     return (
//       <View style={styles.permissionContainer}>
//         <Text>Requesting camera permission...</Text>
//       </View>
//     );
//   }
  
//   if (hasPermission === false) {
//     return (
//       <View style={styles.permissionContainer}>
//         <Text>No access to camera</Text>
//         <TouchableOpacity style={styles.permissionButton} onPress={() => navigation.goBack()}>
//           <Text style={styles.permissionButtonText}>Go Back</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }
  
//   return (
//     <View style={styles.container}>
//       <View style={styles.header}>
//         <Text style={styles.headerText}>Logged in as: {username}</Text>
//         <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
//           <Text style={styles.logoutButtonText}>Logout</Text>
//         </TouchableOpacity>
//       </View>
      
//       <View style={styles.cameraContainer}>
//         <BarCodeScanner
//           onBarCodeScanned={handleBarCodeScanned}
//           style={StyleSheet.absoluteFillObject}
//         />
        
//         <View style={styles.overlay}>
//           <View style={styles.transparentBox} />
//         </View>
        
//         <View style={styles.statusContainer}>
//           <Text style={styles.statusText}>{status}</Text>
//         </View>
        
//         {scanned && (
//           <TouchableOpacity
//             style={styles.scanAgainButton}
//             onPress={() => setScanned(false)}
//           >
//             <Text style={styles.scanAgainButtonText}>Scan Again</Text>
//           </TouchableOpacity>
//         )}
//       </View>
      
//       <View style={styles.instructions}>
//         <Text style={styles.instructionText}>
//           Point your camera at the QR code displayed on the login page
//         </Text>
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F5F5F5',
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: 16,
//     backgroundColor: '#FFFFFF',
//     borderBottomWidth: 1,
//     borderBottomColor: '#E0E0E0',
//   },
//   headerText: {
//     fontSize: 16,
//   },
//   logoutButton: {
//     padding: 8,
//   },
//   logoutButtonText: {
//     color: '#2196F3',
//     fontWeight: 'bold',
//   },
//   cameraContainer: {
//     flex: 1,
//     position: 'relative',
//   },
//   overlay: {
//     ...StyleSheet.absoluteFillObject,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0,0,0,0.5)',
//   },
//   transparentBox: {
//     width: 250,
//     height: 250,
//     borderWidth: 2,
//     borderColor: '#FFFFFF',
//     borderRadius: 12,
//     backgroundColor: 'transparent',
//   },
//   statusContainer: {
//     position: 'absolute',
//     bottom: 50,
//     left: 0,
//     right: 0,
//     alignItems: 'center',
//   },
//   statusText: {
//     backgroundColor: 'rgba(0,0,0,0.7)',
//     color: '#FFFFFF',
//     fontSize: 16,
//     padding: 12,
//     borderRadius: 8,
//     overflow: 'hidden',
//   },
//   scanAgainButton: {
//     position: 'absolute',
//     bottom: 100,
//     alignSelf: 'center',
//     backgroundColor: '#2196F3',
//     paddingVertical: 12,
//     paddingHorizontal: 24,
//     borderRadius: 8,
//   },
//   scanAgainButtonText: {
//     color: '#FFFFFF',
//     fontWeight: 'bold',
//   },
//   instructions: {
//     padding: 16,
//     backgroundColor: '#FFFFFF',
//     borderTopWidth: 1,
//     borderTopColor: '#E0E0E0',
//   },
//   instructionText: {
//     textAlign: 'center',
//     color: '#666666',
//   },
//   permissionContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   permissionButton: {
//     marginTop: 20,
//     backgroundColor: '#2196F3',
//     paddingVertical: 12,
//     paddingHorizontal: 24,
//     borderRadius: 8,
//   },
//   permissionButtonText: {
//     color: '#FFFFFF',
//     fontWeight: 'bold',
//   },
// });

// export default QRScannerScreen;

// // screens/ChatScreen.js - Placeholder Chat Screen
// import React from 'react';
// import { View, Text, StyleSheet } from 'react-native';

// const ChatScreen = () => {
//   return (
//     <View style={styles.container}>
//       <Text style={styles.text}>Chat Screen</Text>
//       <Text style={styles.subtext}>
//         This is a placeholder for your chat interface.{'\n'}
//         Implement your chat UI here.
//       </Text>
//     </View>
//   );
// };

