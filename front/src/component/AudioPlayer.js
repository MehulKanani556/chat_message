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
  const playbackRates = [0.2, 0.5, 0.7, 1, 1.2, 1.5, 1.7, 2]; // Array of playback rates
  const [currentRateIndex, setCurrentRateIndex] = useState(3); // Start at 1x (index 3)

  useEffect(() => {
    // Initialize WaveSurfer
    wavesurferRef.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: "text-gray-500 dark:text-gray-200", // Gray color for light mode, and lighter gray for dark mode
      progressColor: "text-gray-900 dark:text-white", // Black color for light mode, and white for dark mode
      cursorColor: "transparent",
      barWidth: 3,
      barGap: 2,
      height: 30,
      responsive: true,
    });

    // Load audio file
    wavesurferRef.current.load(audioUrl);

    // Update time display
    wavesurferRef.current.on("audioprocess", () => {
      const minutes = Math.floor(wavesurferRef.current.getCurrentTime() / 60);
      const seconds = Math.floor(wavesurferRef.current.getCurrentTime() % 60)
        .toString()
        .padStart(2, "0");
      setCurrentTime(`${minutes}:${seconds}`);
    });

    // playback finished
    wavesurferRef.current.on("finish", () => {
      setIsPlaying(false);
    });

    return () => {
      wavesurferRef.current.destroy();
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
          className="flex-shrink-0 w-6 h-6 sm:w-7 border border-[#1A1A1A] sm:h-7 flex items-center justify-center bg-white text-black rounded-full hover:bg-blue-600 transition-colors"
          onClick={togglePlayPause}
        >
          {isPlaying ? (
            <IoIosPause size={20} />
          ) : (
            <IoPlay size={12} className="ml-1" />
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
