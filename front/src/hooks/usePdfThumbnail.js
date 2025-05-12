// usePdfThumbnail.js
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
          //console.log('No PDF URL provided');
          throw new Error('No PDF URL provided');
        }

        //console.log('Starting PDF load with URL:', pdfUrl);
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        //console.log('Loading task created');
        
        const pdf = await loadingTask.promise;
        //console.log('PDF loaded successfully');
        
        const page = await pdf.getPage(1);
        //console.log('First page loaded');

        const viewport = page.getViewport({ scale: 1.5 });
        //console.log('Viewport created with dimensions:', viewport.width, 'x', viewport.height);
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        //console.log('Canvas created with dimensions:', canvas.width, 'x', canvas.height);

        await page.render({ canvasContext: context, viewport }).promise;
        //console.log('Page rendered to canvas');
        
        const dataUrl = canvas.toDataURL();
        //console.log('Canvas converted to data URL');
        setThumbnail(dataUrl);
        setError(null);
      } catch (error) {
        console.error('PDF thumbnail generation failed:', error);
        setError(error.message);
        setThumbnail(null);
      }
    };

    //console.log('Effect triggered with pdfUrl:', pdfUrl);
    generateThumbnail();
  }, [pdfUrl]);

  //console.log('Current thumbnail state:', thumbnail ? 'has thumbnail' : 'no thumbnail');
  //console.log('Current error state:', error);

  return { thumbnail, error };
};

export default usePdfThumbnail;
