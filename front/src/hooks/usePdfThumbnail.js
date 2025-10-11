import { useEffect, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';

// Set worker path
pdfjsLib.GlobalWorkerOptions.workerSrc = require('pdfjs-dist/legacy/build/pdf.worker.entry');

const usePdfThumbnail = (pdfUrl) => {
  const [thumbnail, setThumbnail] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const generateThumbnail = async () => {
      try {
        if (!pdfUrl) {
          throw new Error('No PDF URL provided');
        }

        const loadingTask = pdfjsLib.getDocument(pdfUrl);

        const pdf = await loadingTask.promise;

        const page = await pdf.getPage(1);

        const viewport = page.getViewport({ scale: 1.5 });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: context, viewport }).promise;

        const dataUrl = canvas.toDataURL();

        setThumbnail(dataUrl);
        setError(null);
      } catch (error) {
        console.error('PDF thumbnail generation failed:', error);
        setError(error.message);
        setThumbnail(null);
      }
    };

    generateThumbnail();
  }, [pdfUrl]);

  return { thumbnail, error };
};

export default usePdfThumbnail;
