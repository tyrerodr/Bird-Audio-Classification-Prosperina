import React, { useRef, useState, useEffect } from "react";
import { FaPlay, FaPause } from "react-icons/fa"; // Importa los iconos de play y pause
import { IconContext } from "react-icons";

const AudioPlayer = ({ audioUrl, startTime, endTime }) => {
  const audioRef = useRef(null);
  const progressBarRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(startTime);

  useEffect(() => {
    const updateProgressBar = () => {
      if (audioRef.current && progressBarRef.current) {
        const percent = (audioRef.current.currentTime / endTime) * 100;
        progressBarRef.current.style.width = `${percent}%`;

        if (audioRef.current.currentTime >= endTime) {
          setIsPlaying(false);
          audioRef.current.pause();
        }
      }
    };

    if (audioRef.current) {
      audioRef.current.addEventListener("timeupdate", updateProgressBar);
    }

    return () => {
      if (audioRef.current) {
        // eslint-disable-next-line
        audioRef.current.removeEventListener("timeupdate", updateProgressBar);
      }
    };
  }, [endTime]);

  const playSegment = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = currentTime;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseSegment = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      pauseSegment();
    } else {
      playSegment();
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(startTime); // Reset currentTime when audio ends
  };

  return (
    <div style={{ textAlign: "center" }}>
      <audio ref={audioRef} controls={false} onEnded={handleEnded}>
        <source src={audioUrl} type="audio/wav" />
        Su navegador no soporta el elemento audio.
      </audio>
      <div style={{ marginTop: "0px" }}>
        <IconContext.Provider value={{ color: "black", size: "0.9em" }}>
          <button
            onClick={togglePlayPause}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "5px 10px", // Ajuste de padding
            }}
          >
            {isPlaying ? <FaPause /> : <FaPlay />}
            <span style={{ marginLeft: "5px" }}>
              {isPlaying ? "Pausar" : "Escuchar"}
            </span>
          </button>
        </IconContext.Provider>
      </div>
      <div
        style={{
          width: "100%",
          height: "5px",
          backgroundColor: "lightgray",
          marginTop: "5px",
          position: "relative",
          display: isPlaying ? "block" : "none",
        }}
      >
        <div
          ref={progressBarRef}
          style={{
            height: "100%",
            backgroundColor: "green",
            position: "absolute",
            top: 0,
            left: 0,
            width: "0%",
          }}
        />
      </div>
    </div>
  );
};

export default AudioPlayer;
