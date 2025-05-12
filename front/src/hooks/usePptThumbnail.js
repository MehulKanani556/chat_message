import { useEffect, useState } from 'react';

const usePptThumbnail = (pptUrl) => {
  const [thumbnail, setThumbnail] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const generateThumbnail = async () => {
      try {
        if (!pptUrl) {
          throw new Error('No PowerPoint URL provided');
        }

        // Create a canvas for drawing the thumbnail
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set dimensions - 16:9 aspect ratio typical for slides
        canvas.width = 300;
        canvas.height = 169;
        
        // Draw PowerPoint-like background with gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#ED6C47'); // PowerPoint orange
        gradient.addColorStop(1, '#D35230');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw generic slide elements
        
        // Slide title area
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(30, 20, canvas.width - 60, 40);
        
        // Title text placeholder
        ctx.fillStyle = '#333333';
        ctx.font = 'bold 16px Arial, sans-serif';
        ctx.fillText('Slide Title', 40, 45);
        
        // Content area with bullet points
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillRect(30, 80, canvas.width - 60, 70);
        
        // Bullet points
        ctx.fillStyle = '#333333';
        ctx.font = '12px Arial, sans-serif';
        
        // Draw bullet points
        const bulletPoints = [
          'First bullet point',
          'Second bullet point',
          'Third bullet point'
        ];
        
        bulletPoints.forEach((point, index) => {
          // Draw bullet
          ctx.beginPath();
          ctx.arc(40, 95 + (index * 20), 3, 0, 2 * Math.PI);
          ctx.fill();
          
          // Draw text
          ctx.fillText(point, 50, 100 + (index * 20));
        });
        
        // Add PowerPoint logo-like icon in corner
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(canvas.width - 20, canvas.height - 20);
        ctx.lineTo(canvas.width - 20, canvas.height - 10);
        ctx.lineTo(canvas.width - 10, canvas.height - 10);
        ctx.lineTo(canvas.width - 10, canvas.height - 20);
        ctx.closePath();
        ctx.fill();
        
        // File extension
        ctx.font = 'bold 10px Arial, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillText('PPT', canvas.width - 30, canvas.height - 5);
        
        // Convert canvas to data URL
        const dataUrl = canvas.toDataURL('image/png');
        setThumbnail(dataUrl);
        setError(null);
        
      } catch (err) {
        console.error('PowerPoint thumbnail generation failed:', err);
        setError(err.message);
        setThumbnail(null);
      }
    };

    generateThumbnail();
  }, [pptUrl]);

  return { thumbnail, error };
};

export default usePptThumbnail;