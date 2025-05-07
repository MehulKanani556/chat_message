import React, { useState, useRef, useEffect } from "react";
import { IoIosPause } from "react-icons/io";
import { IoPlay } from "react-icons/io5";
import WaveSurfer from "wavesurfer.js";

const AudioPlayer = ({ audioUrl }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState("0:00");
  const audioRef = useRef(null);
  const waveformRef = useRef(null);
  const wavesurferRef = useRef(null);
  const playbackRates = [0.2, 0.5, 0.7, 1, 1.2, 1.5, 1.7, 2]; 
  const [currentRateIndex, setCurrentRateIndex] = useState(3); 

  useEffect(() => {
    let wavesurfer = null;
    
    const initWaveSurfer = async () => {
      wavesurfer = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: "#484848", 
        progressColor: "#808080", 
        cursorColor: "transparent",
        barWidth: 3,
        barGap: 2,
        height: 30,
        responsive: true,
      });

      await wavesurfer.load(audioUrl);
      wavesurferRef.current = wavesurfer;

      // Update time display
      wavesurfer.on("audioprocess", () => {
        const minutes = Math.floor(wavesurfer.getCurrentTime() / 60);
        const seconds = Math.floor(wavesurfer.getCurrentTime() % 60)
          .toString()
          .padStart(2, "0");
        setCurrentTime(`${minutes}:${seconds}`);
      });

      // playback finished
      wavesurfer.on("finish", () => {
        setIsPlaying(false);
      });
    };

    initWaveSurfer();

    return () => {
      const cleanup = async () => {
        if (wavesurferRef.current) {
          try {
            // Stop any ongoing playback
            wavesurferRef.current.stop();
            // Unregister all event listeners
            wavesurferRef.current.unAll();
            // Wait a bit before destroying
            await new Promise(resolve => setTimeout(resolve, 100));
            // Destroy the instance
            await wavesurferRef.current.destroy();
            wavesurferRef.current = null;
          } catch (error) {
            console.warn('Error during WaveSurfer cleanup:', error);
          }
        }
      };
      
      cleanup();
    };
  }, [audioUrl]);

  const togglePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
      setIsPlaying(!isPlaying);
    }
  };

  // Function to change playback rate
  const togglePlaybackRate = () => {
    const newIndex = (currentRateIndex + 1) % playbackRates.length; // Cycle through the array
    setCurrentRateIndex(newIndex);
    const newRate = playbackRates[newIndex];
    if (wavesurferRef.current) {
      wavesurferRef.current.setPlaybackRate(newRate); // Set the new playback rate
    }
  };

  return (
    <div className="w-full min-w-[250px] max-w-full bg-white dark:bg-[#1A1A1A] rounded-lg shadow-sm p-2 py-1">
      <div className="flex items-center gap-2 sm:gap-3 w-full">
        <button
          className="flex-shrink-0 w-6 h-6 sm:w-7 border border-[#1A1A1A] sm:h-7 flex items-center justify-center bg-white text-black rounded-full hover:bg-primary/70 transition-colors"
          onClick={togglePlayPause}
        >
          {isPlaying ? (
            <IoIosPause size={18} className="" />
          ) : (
            <IoPlay size={16} className="ml-[1px]" />
          )}
        </button>

        <div className="flex-1"> <div className="flex-1 min-w-0" ref={waveformRef} />

          <span className="flex-shrink-0 text-[10px] text-gray-500 min-w-[32px]">
            {currentTime} Sec
          </span></div>

        <div onClick={togglePlaybackRate} className="cursor-pointer text-xs rounded-full bg-gray-700 text-white dark:bg-white/50 dark:text-black w-7 h-7 flex items-center justify-center">
          <span className=""> x{playbackRates[currentRateIndex]}</span>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
