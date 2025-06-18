// front/src/component/ElectronStatus.js

import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';

const ElectronStatus = () => {
  const { socket } = useSocket();
  const [isElectronConnected, setIsElectronConnected] = useState(false);

  useEffect(() => {
    if (!socket) return;

    socket.on('electron-connected', () => {
      setIsElectronConnected(true);
    });

    socket.on('electron-disconnected', () => {
      setIsElectronConnected(false);
    });

    return () => {
      socket.off('electron-connected');
      socket.off('electron-disconnected');
    };
  }, [socket]);

  return (
    <div className="electron-status">
      <div className={`status-indicator ${isElectronConnected ? 'connected' : 'disconnected'}`}>
        {isElectronConnected ? 'Control App Connected' : 'Control App Disconnected'}
      </div>
    </div>
  );
};

export default ElectronStatus;