import React, { useState, useEffect } from 'react';
import Scanner from '../component/Scanner';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

const SERVER_URL = 'https://chat-message-0fml.onrender.com';

const ScannerPage = () => {
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [retry, setRetry] = useState(0);
  const [socketConnected, setSocketConnected] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already logged in
    const token = localStorage.getItem('authToken');
    if (token) {
      navigate('/chat');
      return;
    }
  }, [navigate]);

  const handleScanSuccess = (data) => {
    try {
      console.log('Handling scan success:', data);
      setLoading(true);
      setError(null);
      
      // Store authentication data
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('username', data.username);
      
      // Show success message
      setScanResult('Login successful! Redirecting...');
      
      // Redirect to chat page after successful login
      setTimeout(() => {
        navigate('/chat');
      }, 1500);
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed: ' + (err.message || 'Unknown error'));
      setScanResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleScanError = (error) => {
    console.error('Scan error:', error);
    setError(error);
  };

  const handleRetry = () => {
    setError(null);
    setScanResult(null);
    setRetry(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <h2 className="text-2xl font-bold mb-8 text-center">QR Code Login</h2>
                <p className="text-center text-gray-600 mb-4">
                  Scan the QR code from the login page to sign in
                </p>
                {!socketConnected && (
                  <div className="mb-4 p-4 bg-yellow-100 rounded-lg">
                    <p className="text-yellow-800 text-center">
                      Connecting to server...
                    </p>
                  </div>
                )}
                <Scanner 
                  key={retry}
                  onScanSuccess={handleScanSuccess}
                  onScanError={handleScanError}
                />
                {loading && (
                  <div className="mt-4 p-4 bg-blue-100 rounded-lg">
                    <p className="text-blue-800 text-center">Processing login...</p>
                  </div>
                )}
                {scanResult && (
                  <div className="mt-4 p-4 bg-green-100 rounded-lg">
                    <p className="text-green-800 text-center">{scanResult}</p>
                  </div>
                )}
                {error && (
                  <div className="mt-4 p-4 bg-red-100 rounded-lg">
                    <p className="text-red-800 text-center">{error}</p>
                    <button
                      onClick={handleRetry}
                      className="mt-2 w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScannerPage;
