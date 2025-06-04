import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BASE_URL } from '../utils/baseUrl';
import DeviceList from '../component/DeviceList';
import { FaArrowLeft } from 'react-icons/fa';

const DeviceListPage = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const token = sessionStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get(`${BASE_URL}/devices`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        console.log('Fetched devices:', response.data);
        if (response.data.status === 200) {
          setDevices(response.data.devices);
        }
      } catch (error) {
        console.error('Error fetching devices:', error);
        setError('Failed to load devices. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, [navigate]);

  const handleRemoveDevice = async (deviceId) => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      const currentDeviceId = localStorage.getItem('deviceId');
      
      console.log('Removing device:', {
        deviceId,
        currentDeviceId,
        allDevices: devices
      });

      // Call the logout endpoint to remove the device
      const response = await axios.post(`${BASE_URL}/logout-device`, {
        deviceId: deviceId
      }, {                            
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Logout device response:', response.data);

      if (response.data.status === 200) {
        // If removing current device
        if (deviceId === currentDeviceId) {
          console.log('Removing current device and logging out');
          // Clean up socket connection if it exists
          if (window.socketRef?.current) {
            window.socketRef.current.disconnect();
            window.socketRef.current = null;
          }
          // Clear all storage
          sessionStorage.clear();
          localStorage.removeItem('deviceId');
          // Redirect to login
          navigate('/login');
        } else {
          console.log('Removing other device');
          // Update the device list to remove the deleted device
          setDevices(prevDevices => prevDevices.filter(device => device.deviceId !== deviceId));
        }
      }
    } catch (error) {
      console.error('Error in handleRemoveDevice:', error);
      setError('Failed to remove device. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <FaArrowLeft className="mr-2" />
            Back
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Your Devices</h1>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading devices...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          ) : (
            <DeviceList
              devices={devices}
              onRemoveDevice={handleRemoveDevice}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DeviceListPage; 