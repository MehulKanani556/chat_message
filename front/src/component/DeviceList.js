import React from 'react';
import { FaMobile, FaDesktop, FaTablet } from 'react-icons/fa';

const DeviceList = ({ devices, onRemoveDevice }) => {
  const getDeviceIcon = (deviceType) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return <FaMobile className="text-gray-600" />;
      case 'desktop':
        return <FaDesktop className="text-gray-600" />;
      case 'tablet':
        return <FaTablet className="text-gray-600" />;
      default:
        return <FaDesktop className="text-gray-600" />;
    }
  };

  const formatLastLogin = (date) => {
    const now = new Date();
    const lastLogin = new Date(date);
    const diffInSeconds = Math.floor((now - lastLogin) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInMinutes > 0) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Devices</h3>
      {devices && devices.length > 0 ? (
        <div className="space-y-3">
          {devices.map((device, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="text-xl">
                  {getDeviceIcon(device.deviceType)}
                </div>
                <div>
                  <p className="font-medium text-gray-800">{device.deviceName}</p>
                  <p className="text-sm text-gray-500">
                    Last login: {formatLastLogin(device.lastLogin)}
                  </p>
                </div>
              </div>
              {onRemoveDevice && (
                <button
                  onClick={() => onRemoveDevice(device.deviceId)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-4">No devices found</p>
      )}
    </div>
  );
};

export default DeviceList; 