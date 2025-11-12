"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";

interface Card3DProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  isVideo?: boolean;
  playbackSpeed?: number;
  autoPlay?: boolean;
  showDuration?: boolean;
}

export default function Card3D({
  src,
  alt,
  width = 800,
  height = 500,
  className = "",
  isVideo = false,
  playbackSpeed = 1,
  autoPlay = true,
  showDuration = false,
}: Card3DProps) {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Set playback speed whenever it changes
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  useEffect(() => {
    // Manually check video duration for non-autoplay videos
    const checkDuration = () => {
      if (videoRef.current && showDuration) {
        const video = videoRef.current;
        if (
          video.duration &&
          !isNaN(video.duration) &&
          isFinite(video.duration)
        ) {
          const adjustedDuration = video.duration / playbackSpeed;
          console.log(
            "Duration check:",
            video.duration,
            "Adjusted:",
            adjustedDuration,
          );
          setDuration(adjustedDuration);
        } else {
          // Retry after a short delay if duration isn't ready
          setTimeout(checkDuration, 100);
        }
      }
    };

    // Start checking after component mounts
    const timer = setTimeout(checkDuration, 100);

    return () => clearTimeout(timer);
  }, [showDuration, playbackSpeed]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (videoRef.current && autoPlay) {
          if (entry.isIntersecting) {
            videoRef.current.playbackRate = playbackSpeed; // Set speed before playing
            videoRef.current
              .play()
              .catch((err) => console.log("Video play error:", err));
          } else {
            videoRef.current.pause();
          }
        }
      },
      {
        threshold: 0.3, // Play when 30% of video is visible
      },
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [autoPlay]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateXValue = ((y - centerY) / centerY) * -10;
    const rotateYValue = ((x - centerX) / centerX) * 10;

    setRotateX(rotateXValue);
    setRotateY(rotateYValue);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.playbackRate = playbackSpeed; // Set speed before playing
        videoRef.current
          .play()
          .catch((err) => console.log("Video play error:", err));
        setIsPlaying(true);
      }
    }
  };

  // Check if src is a video file
  const isVideoFile =
    isVideo ||
    src.endsWith(".mp4") ||
    src.endsWith(".webm") ||
    src.endsWith(".ogg") ||
    src.endsWith(".mov") ||
    src.includes("video");

  return (
    <motion.div
      ref={containerRef}
      className={`relative ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: "1000px",
      }}
    >
      <motion.div
        className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20"
        animate={{
          rotateX,
          rotateY,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 20,
        }}
        style={{
          transformStyle: "preserve-3d",
        }}
      >
        {isVideoFile ? (
          <video
            ref={videoRef}
            loop
            muted
            playsInline
            preload="metadata"
            className="w-full h-full object-cover"
            style={{
              filter: "brightness(0.85)",
              display: "block",
            }}
            onLoadedMetadata={(e) => {
              const video = e.currentTarget;
              video.playbackRate = playbackSpeed;
              // Calculate actual duration based on playback speed
              if (
                video.duration &&
                !isNaN(video.duration) &&
                isFinite(video.duration)
              ) {
                const adjustedDuration = video.duration / playbackSpeed;
                console.log(
                  "Duration loaded:",
                  video.duration,
                  "Adjusted:",
                  adjustedDuration,
                  "Show:",
                  showDuration,
                );
                setDuration(adjustedDuration);
              }
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          >
            <source src={src} type="video/mp4" />
          </video>
        ) : (
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            className="w-full h-auto object-cover"
          />
        )}

        {/* Play Button Overlay for manual play videos */}
        {isVideoFile && !autoPlay && !isPlaying && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-all duration-300 group z-10"
            aria-label="Play video"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-2xl">
                <svg
                  className="w-10 h-10 text-gray-900 ml-1"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              {showDuration && duration > 0 && (
                <div className="px-4 py-2 rounded-full bg-black/60 backdrop-blur-sm">
                  <span className="text-white text-sm font-semibold">
                    {Math.ceil(duration)}s
                  </span>
                </div>
              )}
              {showDuration && duration === 0 && (
                <div className="px-4 py-2 rounded-full bg-black/60 backdrop-blur-sm">
                  <span className="text-white text-sm font-semibold">
                    Loading...
                  </span>
                </div>
              )}
            </div>
          </button>
        )}

        {/* Glossy overlay effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10 pointer-events-none" />
      </motion.div>
    </motion.div>
  );
}
