// LazyLoadVideo.tsx
"use client";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { FaSquareCheck } from "react-icons/fa6";

interface LazyLoadVideoProps {
  src: string;
  hubName: string;
  collectionId: number;
  coverImage: string;
  selected: boolean;
  onClick: () => void;
}

const LazyLoadVideo: React.FC<LazyLoadVideoProps> = ({ src, hubName, collectionId, coverImage, selected, onClick }) => {
  const [isInView, setIsInView] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect(); // Stop observing once in view
        }
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 0.1, // Trigger when 10% of the element is visible
      }
    );

    const currentRef = containerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
      observer.disconnect();
    };
  }, []);

  const handleVideoLoad = () => {
    setIsLoading(false);
  };

  const handleVideoError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  return (
    <div
      ref={containerRef}
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`p-2 rounded-lg cursor-pointer transition-shadow ${selected ? "font-bold" : "font-light"}`}
    >
      <div className="flex items-center justify-center mt-2 space-x-1">
        {selected && <FaSquareCheck />}
        <span>
          {hubName} #{collectionId}
        </span>
      </div>

      <div className="relative w-full aspect-square bg-gray-200 rounded-lg overflow-hidden">
        {isInView ? (
          <>
            <video
              ref={videoRef}
              src={src}
              poster={coverImage}
              autoPlay
              loop
              muted
              playsInline
              className={`w-full aspect-square object-contain transition-opacity duration-300 ${
                isLoading ? "opacity-0" : "opacity-100"
              }`}
              onLoadedData={handleVideoLoad}
              onError={handleVideoError}
            />
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-600">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            )}
          </>
        ) : (
          <Image
            src={coverImage}
            alt={`${hubName} cover`}
            fill
            className="object-cover rounded-lg"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        )}
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
            <span className="text-gray-500">Couldn't load video</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default LazyLoadVideo;
