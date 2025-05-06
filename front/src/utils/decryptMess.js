export const decryptMessage = (encrypted) => {
    const key = 'chat';
    if (typeof encrypted === 'string' && encrypted.startsWith('data:')) {
      // strip the "data:" prefix and base64‐decode
      const raw = atob(encrypted.split('data:')[1]);
      let out = '';
      for (let i = 0; i < raw.length; i++) {
        out += String.fromCharCode(
          raw.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        );
      }
      return out;
    }
    return encrypted;
  };