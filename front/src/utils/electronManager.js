// front/src/utils/electronManager.js

import { BASE_URL } from './baseUrl';

export const checkElectronInstalled = async () => {
  try {
    const response = await fetch(`${BASE_URL}/check-electron-installed`, {
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to check Electron installation');
    }
    
    const data = await response.json();
    return data.installed;
  } catch (error) {
    console.error('Error checking Electron installation:', error);
    return false;
  }
};

export const downloadAndLaunchElectron = async () => {
  try {
    // First check if already installed
    const isInstalled = await checkElectronInstalled();
    if (isInstalled) {
      return true;
    }

    // Determine platform
    const platform = navigator.platform.toLowerCase();
    const isWindows = platform.includes('win');
    const isMac = platform.includes('mac');

    // Get the appropriate download URL
    const downloadUrl = `${BASE_URL}/download/host-control-${isWindows ? 'win' : 'mac'}`;
    
    // Download the application
    const response = await fetch(downloadUrl, {
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to download Electron app');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    
    // Create download link
    const a = document.createElement('a');
    a.href = url;
    a.download = isWindows ? 'Host Control.exe' : 'Host Control.dmg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    // Show installation instructions
    if (isWindows) {
      alert('Please install the downloaded application and run it to enable remote control.');
    } else {
      alert('Please install the downloaded application from the DMG file and run it to enable remote control.');
    }

    return true;
  } catch (error) {
    console.error('Error downloading Electron app:', error);
    return false;
  }
};