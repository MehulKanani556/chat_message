import { useEffect, useState } from 'react';
import * as mammoth from 'mammoth';

const useWordThumbnail = (wordUrl) => {
  const [thumbnail, setThumbnail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const generateThumbnail = async () => {
      if (!wordUrl) {
        setError('No Word URL provided');
        return;
      }
      
      setLoading(true);
      
      try {
        // Fetch the Word file
        const response = await fetch(wordUrl);
        const arrayBuffer = await response.arrayBuffer();
        
        // Try to use mammoth to extract content
        try {
          // Convert Word to HTML using mammoth
          const result = await mammoth.convertToHtml({ arrayBuffer });
          const html = result.value;
          
          if (html) {
            // Create a thumbnail from the actual content
            const contentThumbnail = await createContentThumbnail(html);
            setThumbnail(contentThumbnail);
            setError(null);
            setLoading(false);
            return;
          }
        } catch (mammothError) {
          console.warn('Mammoth parsing failed, falling back to generic thumbnail:', mammothError);
          // Continue to fallback if mammoth fails
        }
        
        // Fallback to generic thumbnail if parsing fails
        const genericThumbnail = createGenericThumbnail();
        setThumbnail(genericThumbnail);
        setError(null);
        
      } catch (err) {
        console.error('Word thumbnail generation failed:', err);
        setError(err.message);
        
        // Still try to provide a generic thumbnail even if there's an error
        try {
          const genericThumbnail = createGenericThumbnail();
          setThumbnail(genericThumbnail);
        } catch (fallbackErr) {
          console.error('Even fallback thumbnail failed:', fallbackErr);
          setThumbnail(null);
        }
      } finally {
        setLoading(false);
      }
    };
    
    // Create a thumbnail using actual content extracted from the document
    const createContentThumbnail = async (html) => {
      return new Promise((resolve) => {
        // Create temporary element to parse HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        // Extract content
        const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
        const paragraphs = tempDiv.querySelectorAll('p');
        
        // Get document title (first heading or use default)
        const title = headings.length > 0 
          ? headings[0].textContent 
          : 'Document';
        
        // Create canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas dimensions (A4 paper ratio)
        canvas.width = 240;
        canvas.height = 320;
        
        // White background (paper)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add a slight shadow/border effect
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.strokeStyle = '#dddddd';
        ctx.strokeRect(0, 0, canvas.width, canvas.height);
        
        // Reset shadow for content
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Page margins
        const margin = 20;
        
        // Document title
        ctx.fillStyle = '#333333';
        ctx.font = 'bold 16px Arial, sans-serif';
        const displayTitle = title.length > 25 ? title.substring(0, 22) + '...' : title;
        ctx.fillText(displayTitle, margin, margin + 16);
        
        // Horizontal line under title
        ctx.strokeStyle = '#dddddd';
        ctx.beginPath();
        ctx.moveTo(margin, margin + 30);
        ctx.lineTo(canvas.width - margin, margin + 30);
        ctx.stroke();
        
        // Add text content from paragraphs
        ctx.fillStyle = '#333333';
        ctx.font = '12px Arial, sans-serif';
        
        let yPos = margin + 50;
        const maxWidth = canvas.width - (margin * 2);
        
        // Helper to draw wrapped text
        const drawWrappedText = (text, x, y, maxWidth, lineHeight) => {
          if (!text || text.trim() === '') return y;
          
          const words = text.split(' ');
          let line = '';
          let newY = y;
          
          for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            
            if (testWidth > maxWidth && i > 0) {
              ctx.fillText(line, x, newY);
              line = words[i] + ' ';
              newY += lineHeight;
              
              // Stop if we're going beyond canvas
              if (newY > canvas.height - margin) {
                return newY;
              }
            } else {
              line = testLine;
            }
          }
          
          // Draw remaining text
          if (line.trim() !== '') {
            ctx.fillText(line, x, newY);
            newY += lineHeight;
          }
          
          return newY;
        };
        
        // Draw paragraphs
        const maxParagraphs = Math.min(paragraphs.length, 10);
        
        for (let i = 0; i < maxParagraphs; i++) {
          const text = paragraphs[i].textContent;
          if (!text || text.trim() === '') continue;
          
          yPos = drawWrappedText(text, margin, yPos, maxWidth, 18);
          yPos += 8; // Space between paragraphs
          
          // Stop if we go beyond canvas height
          if (yPos > canvas.height - margin) {
            break;
          }
        }
        
        // Add Word logo indicator in bottom corner
        ctx.fillStyle = '#2B579A'; // Word blue
        ctx.fillRect(canvas.width - 35, canvas.height - 25, 25, 15);
        
        ctx.font = 'bold 10px Arial, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('DOC', canvas.width - 30, canvas.height - 13);
        
        // Convert canvas to data URL
        const dataUrl = canvas.toDataURL('image/png');
        resolve(dataUrl);
      });
    };
    
    // Create a generic Word document thumbnail
    const createGenericThumbnail = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set canvas dimensions (A4 paper ratio)
      canvas.width = 240;
      canvas.height = 320;
      
      // White background (paper)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add a slight shadow/border effect
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = 5;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.strokeStyle = '#dddddd';
      ctx.strokeRect(0, 0, canvas.width, canvas.height);
      
      // Reset shadow for content
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      
      // Page margins
      const margin = 20;
      
      // Document title
      ctx.fillStyle = '#333333';
      ctx.font = 'bold 16px Arial, sans-serif';
      ctx.fillText('Word Document', margin, margin + 16);
      
      // Horizontal line under title
      ctx.strokeStyle = '#dddddd';
      ctx.beginPath();
      ctx.moveTo(margin, margin + 30);
      ctx.lineTo(canvas.width - margin, margin + 30);
      ctx.stroke();
      
      // Generate text lines that look like paragraphs
      ctx.fillStyle = '#333333';
      
      // Text representation
      const generateTextLine = (y, width) => {
        ctx.fillRect(margin, y, width, 4);
      };
      
      // Add paragraph-like text blocks
      let yPos = margin + 50;
      for (let i = 0; i < 8; i++) {
        // Vary line lengths to look like a paragraph
        generateTextLine(yPos, canvas.width - margin * 2);
        yPos += 10;
        generateTextLine(yPos, canvas.width - margin * 2 - 30);
        yPos += 10;
        generateTextLine(yPos, canvas.width - margin * 2 - 10);
        yPos += 10;
        generateTextLine(yPos, canvas.width - margin * 2 - 50);
        yPos += 10;
        
        // Space between paragraphs
        yPos += 10;
      }
      
      // Add Word logo indicator in bottom corner
      ctx.fillStyle = '#2B579A'; // Word blue
      ctx.fillRect(canvas.width - 35, canvas.height - 25, 25, 15);
      
      ctx.font = 'bold 10px Arial, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('DOC', canvas.width - 30, canvas.height - 13);
      
      // Convert canvas to data URL
      return canvas.toDataURL('image/png');
    };

    generateThumbnail();
  }, [wordUrl]);

  return { thumbnail, loading, error };
};

export default useWordThumbnail;