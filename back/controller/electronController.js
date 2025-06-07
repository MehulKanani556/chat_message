// back/controller/electronController.js

const path = require('path');
const fs = require('fs');

// Check if Electron app is installed
const checkElectronInstalled = (req, res) => {
  try {
    const platform = req.headers['user-agent'].toLowerCase();
    const isWindows = platform.includes('win');
    const isMac = platform.includes('mac');

    // Define paths based on platform
    const appPath = isWindows
      ? path.join(__dirname, '..', 'host-control-app', 'dist', 'win-unpacked', 'Host Control.exe')
      : path.join(__dirname, '..', 'host-control-app', 'dist', 'mac', 'Host Control.app');

    // Check if the file exists
    const installed = fs.existsSync(appPath);

    res.json({
      installed,
      platform: isWindows ? 'windows' : 'mac',
      message: installed ? 'Electron app is installed' : 'Electron app is not installed'
    });
  } catch (error) {
    console.error('Error checking Electron installation:', error);
    res.status(500).json({
      installed: false,
      error: 'Failed to check Electron installation'
    });
  }
};

// Download Electron app
const downloadElectronApp = (req, res) => {
  try {
    const { platform } = req.params;
    const isWindows = platform === 'win';
    
    const appPath = isWindows
      ? path.join(__dirname, '..', 'host-control-app', 'dist', 'win-unpacked', 'Host Control.exe')
      : path.join(__dirname, '..', 'host-control-app', 'dist', 'mac', 'Host Control.dmg');

    if (!fs.existsSync(appPath)) {
      return res.status(404).json({
        error: 'Electron app not found'
      });
    }

    res.download(appPath);
  } catch (error) {
    console.error('Error downloading Electron app:', error);
    res.status(500).json({
      error: 'Failed to download Electron app'
    });
  }
};

module.exports = {
  checkElectronInstalled,
  downloadElectronApp
};