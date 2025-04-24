import React, { useState, useRef, useEffect } from 'react';

const VoiceRecorder = () => {
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState('');
  const [waveformData, setWaveformData] = useState([]);
  
  // Animation state
  const [animationPhase, setAnimationPhase] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);
  const chunksRef = useRef([]);

  // For storing cumulative data
  const cumulativeDataRef = useRef([]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Bar animation loop
  useEffect(() => {
    let barAnimationId;
    
    const animateBars = () => {
      setAnimationPhase(prev => (prev + 0.1) % 10);
      barAnimationId = requestAnimationFrame(animateBars);
    };
    
    if (recording || waveformData.length === 0) {
      barAnimationId = requestAnimationFrame(animateBars);
    }
    
    return () => {
      if (barAnimationId) {
        cancelAnimationFrame(barAnimationId);
      }
    };
  }, [recording, waveformData.length]);

  const startRecording = async () => {
    try {
      // Reset cumulative data
      cumulativeDataRef.current = [];
      setWaveformData([]);

      // Get user's audio stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Set up audio context and analyser
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048; // Larger FFT for more detailed data

      // Connect audio source to analyser
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      // Start visualization and data collection
      collectAudioData();

      // Set up media recorder
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioURL(audioUrl);
      };

      // Start recording
      mediaRecorderRef.current.start(100); // Collect chunks every 100ms
      setRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      cancelAnimationFrame(animationRef.current);
      setRecording(false);
    }
  };

  const collectAudioData = () => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    let frameCount = 0;

    const updateVisualData = () => {
      frameCount++;
      if (frameCount % 2 !== 0) {
        animationRef.current = requestAnimationFrame(updateVisualData);
        return;
      }

      analyserRef.current.getByteTimeDomainData(dataArray);

      // Calculate RMS (root mean square) value to represent volume
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        const normalized = (dataArray[i] / 128.0) - 1.0;
        sum += normalized * normalized;
      }
      const rms = Math.sqrt(sum / bufferLength);

      // Scale RMS with a quadratic function for more dynamic range
      const scaledRMS = Math.min(100, Math.max(12, rms * rms * 700));

      // Add this data point to our cumulative collection
      cumulativeDataRef.current.push(scaledRMS);

      // Keep a fixed number of data points
      if (cumulativeDataRef.current.length > 60) {
        cumulativeDataRef.current = cumulativeDataRef.current.slice(-60);
      }

      // Update state with the latest cumulative data
      setWaveformData([...cumulativeDataRef.current]);

      // Continue collecting data
      animationRef.current = requestAnimationFrame(updateVisualData);
    };

    updateVisualData();
  };

  // Generate idle animation bar heights if not recording
  const generateBarHeights = () => {
    if (waveformData.length > 0) {
      return waveformData;
    }
    
    // Generate idle animation that looks more like the reference image
    const barCount = 60;
    const idleData = [];
    
    for (let i = 0; i < barCount; i++) {
      // Create a pattern that mimics an audio waveform with varying heights
      const baseHeight = 15;
      const variation = 30;
      
      // Multiple sine waves with different frequencies and amplitudes
      const wave1 = Math.sin((i / 4) + animationPhase) * variation * 0.4;
      const wave2 = Math.sin((i / 7) + animationPhase * 1.3) * variation * 0.6;
      const wave3 = Math.sin((i / 3) + animationPhase * 0.7) * variation * 0.3;
      
      // Combine waves and ensure minimum height
      const waveHeight = baseHeight + Math.abs(wave1 + wave2 + wave3);
      idleData.push(waveHeight);
    }
    
    return idleData;
  };

  const barHeights = generateBarHeights();

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto">
      <div className="w-full h-40 rounded-lg bg-black relative overflow-hidden">
      
        
        {/* Waveform container */}
        <div className="flex items-center justify-center h-full w-full relative">
          <div className="flex items-center gap-1 h-full absolute">
            {barHeights.map((height, index) => {
              // Calculate a height that centers around the middle
              const variationFactor = recording ? 1 : 0.6;
              const barHeight = height * variationFactor;
              
              return (
                <div 
                  key={index}
                  className="flex flex-col justify-center h-full"
                >
                  <div 
                    style={{ 
                      width: '3px',
                      height: `${barHeight}%`,
                      marginTop: `-${barHeight/2}%`
                    }}
                    className="bg-white rounded-sm"
                  />
                </div>
              );
            })}
          </div>
        </div>
        
      
      </div>

      <div className="flex gap-4 mt-4">
        {!recording ? (
          <button
            onClick={startRecording}
            className="px-6 py-2 bg-white text-black font-medium rounded-full hover:bg-gray-200 focus:outline-none transition duration-300"
          >
            Start Recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="px-6 py-2 bg-red-500 text-white font-medium rounded-full hover:bg-red-600 focus:outline-none transition duration-300"
          >
            Stop Recording
          </button>
        )}
      </div>

      {audioURL && (
        <div className="mt-4 w-full">
          <audio controls src={audioURL} className="w-full" />
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;