import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

const QRCodeGenerator = ({ userId }) => {
  const [qrCode, setQrCode] = useState('');
  const [error, setError] = useState(null);
  const [sessionId] = useState(() => uuidv4());

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        // Create QR code data with action and sessionId
        const qrData = {
          action: 'login',
          sessionId: sessionId,
          userId: userId,
          timestamp: new Date().toISOString()
        };

        // Generate QR code
        const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData));
        setQrCode(qrCodeDataUrl);
      } catch (err) {
        setError('Failed to generate QR code');
        console.error('QR Code generation error:', err);
      }
    };

    if (userId) {
      generateQRCode();
    }
  }, [userId, sessionId]);

  return (
    <div className="flex flex-col items-center p-4">
      {error ? (
        <div className="text-red-600">{error}</div>
      ) : qrCode ? (
        <>
          <img src={qrCode} alt="Login QR Code" className="w-64 h-64" />
          <p className="mt-4 text-sm text-gray-600">
            Scan this QR code to login to your account
          </p>
          <p className="text-xs text-gray-500 mt-2">
            QR code expires in 5 minutes
          </p>
        </>
      ) : (
        <div className="text-gray-600">Generating QR code...</div>
      )}
    </div>
  );
};

export default QRCodeGenerator; 