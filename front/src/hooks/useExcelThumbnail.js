import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';

const useExcelThumbnail = (excelUrl) => {
  const [thumbnail, setThumbnail] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const generateThumbnail = async () => {
      try {
        if (!excelUrl) {
          throw new Error('No Excel URL provided');
        }

        // Fetch the Excel file
        const response = await fetch(excelUrl);
        const arrayBuffer = await response.arrayBuffer();
        
        // Parse the Excel file
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        
        // Get the first sheet
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // Get the range of the sheet
        const range = XLSX.utils.decode_range(firstSheet['!ref'] || 'A1');
        const maxRows = Math.min(range.e.r + 1, 10); // Limit to first 10 rows
        const maxCols = Math.min(range.e.c + 1, 5);  // Limit to first 5 columns
        
        // Create a canvas to render the preview
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas dimensions
        canvas.width = 300;
        canvas.height = 200;
        
        // Fill background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw grid
        ctx.strokeStyle = '#dddddd';
        ctx.fillStyle = '#333333';
        ctx.font = '11px Arial, sans-serif';
        
        const cellWidth = canvas.width / (maxCols || 1);
        const cellHeight = 20;
        const startY = 10;
        
        // Draw the cells
        for (let r = 0; r < maxRows; r++) {
          for (let c = 0; c < maxCols; c++) {
            const cellRef = XLSX.utils.encode_cell({r, c});
            const cell = firstSheet[cellRef];
            const cellValue = cell ? XLSX.utils.format_cell(cell) : '';
            
            const x = c * cellWidth;
            const y = startY + r * cellHeight;
            
            // Draw cell border
            ctx.strokeRect(x, y, cellWidth, cellHeight);
            
            // Draw cell content (truncate if too long)
            const truncatedValue = cellValue.length > 12 ? cellValue.substring(0, 10) + '...' : cellValue;
            ctx.fillText(truncatedValue, x + 3, y + 14);
          }
        }
        
        // Convert canvas to data URL
        const dataUrl = canvas.toDataURL('image/png');
        setThumbnail(dataUrl);
        setError(null);
        
      } catch (err) {
        console.error('Excel thumbnail generation failed:', err);
        setError(err.message);
        setThumbnail(null);
      }
    };

    generateThumbnail();
  }, [excelUrl]);

  return { thumbnail, error };
};

export default useExcelThumbnail;