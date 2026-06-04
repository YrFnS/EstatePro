"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Maximize,
  Minimize,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Move,
  ZoomIn,
  Pause,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n/provider";

interface PanoramicViewerProps {
  images: string[];
  autoRotate?: boolean;
  roomLabels?: string[];
  className?: string;
  onOpenFullTour?: () => void;
  /** When provided, viewer switches to this image index */
  activeIndex?: number;
  /** Callback when the user navigates to a different image */
  onIndexChange?: (index: number) => void;
}

export function PanoramicViewer({
  images,
  autoRotate = true,
  roomLabels,
  className = "",
  onOpenFullTour,
  activeIndex,
  onIndexChange,
}: PanoramicViewerProps) {
  const { t } = useI18n();
  const [internalIndex, setInternalIndex] = useState(0);
  const currentIndex = activeIndex ?? internalIndex;
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [autoRotating, setAutoRotating] = useState(autoRotate);
  const [showHint, setShowHint] = useState(true);
  const lastPos = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const autoRotateSpeed = useRef(0.15);

  // Auto-rotation animation
  useEffect(() => {
    if (!autoRotating || isDragging || isFullscreen) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    let lastTime = performance.now();
    const animate = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;
      setRotation((prev) => ({
        x: prev.x,
        y: prev.y + autoRotateSpeed.current * (delta / 16),
      }));
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [autoRotating, isDragging, isFullscreen]);

  // Hide hint after 4 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 4000);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  // Handle image load - use ref to avoid setState in effect
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageLoadRef = useRef(false);

  useEffect(() => {
    imageLoadRef.current = false;
    const img = new Image();
    img.onload = () => {
      imageLoadRef.current = true;
      setImageLoaded(true);
    };
    img.src = images[currentIndex];
    return () => {
      imageLoadRef.current = false;
    };
  }, [currentIndex, images]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Mouse handlers
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      setIsDragging(true);
      lastPos.current = { x: e.clientX, y: e.clientY };
      setAutoRotating(false);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - lastPos.current.x;
      const deltaY = e.clientY - lastPos.current.y;
      lastPos.current = { x: e.clientX, y: e.clientY };

      setRotation((prev) => ({
        x: Math.max(-30, Math.min(30, prev.x - deltaY * 0.3)),
        y: prev.y + deltaX * 0.3,
      }));
    },
    [isDragging]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Scroll to zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((prev) => Math.max(1, Math.min(3, prev - e.deltaY * 0.002)));
  }, []);

  // Double-click to reset
  const handleDoubleClick = useCallback(() => {
    setRotation({ x: 0, y: 0 });
    setZoom(1);
  }, []);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  // Navigation
  const goToImage = useCallback(
    (index: number) => {
      if (index < 0 || index >= images.length) return;
      setInternalIndex(index);
      setRotation({ x: 0, y: 0 });
      setZoom(1);
      onIndexChange?.(index);
    },
    [images.length, onIndexChange]
  );

  const prevImage = useCallback(() => {
    goToImage(currentIndex > 0 ? currentIndex - 1 : images.length - 1);
  }, [currentIndex, images.length, goToImage]);

  const nextImage = useCallback(() => {
    goToImage(currentIndex < images.length - 1 ? currentIndex + 1 : 0);
  }, [currentIndex, images.length, goToImage]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prevImage();
      else if (e.key === "ArrowRight") nextImage();
      else if (e.key === "Escape" && isFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (e.key === "f") {
        toggleFullscreen();
      } else if (e.key === "r") {
        setRotation({ x: 0, y: 0 });
        setZoom(1);
      } else if (e.key === " ") {
        e.preventDefault();
        setAutoRotating((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prevImage, nextImage, isFullscreen, toggleFullscreen]);

  // Touch gesture support - pinch to zoom
  const lastTouchDistance = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDistance.current = Math.sqrt(dx * dx + dy * dy);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouchDistance.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const delta = distance - lastTouchDistance.current;
      lastTouchDistance.current = distance;
      setZoom((prev) => Math.max(1, Math.min(3, prev + delta * 0.005)));
    }
  }, []);

  if (images.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden rounded-xl bg-black select-none ${
        isFullscreen ? "h-screen cursor-grab active:cursor-grabbing" : "h-64 sm:h-80 cursor-grab active:cursor-grabbing"
      } ${className}`}
      onWheel={handleWheel}
    >
      {/* Panoramic Image Display */}
      {!imageLoaded && (
        <Skeleton className="absolute inset-0 w-full h-full" />
      )}
      <div
        className="w-full h-full"
        style={{
          backgroundImage: `url(${images[currentIndex]})`,
          backgroundSize: `${200 * zoom}% 100%`,
          backgroundPosition: `${50 + (rotation.y % 360) * 0.1}% ${50 + rotation.x * 0.1}%`,
          backgroundRepeat: "no-repeat",
          transition: isDragging ? "none" : "background-position 0.05s ease-out",
          opacity: imageLoaded ? 1 : 0,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      />

      {/* Gradient Overlays */}
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

      {/* Top Controls */}
      <div className="absolute top-3 left-3 right-3 flex items-start justify-between z-10">
        {/* Room label */}
        <div className="flex items-center gap-2">
          {roomLabels && roomLabels[currentIndex] && (
            <span className="bg-black/50 backdrop-blur-sm text-white text-sm px-3 py-1.5 rounded-lg border border-white/10">
              {t("virtualTour.room")} {currentIndex + 1}: {roomLabels[currentIndex]}
            </span>
          )}
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 hover:text-white border border-white/10"
            onClick={() => setAutoRotating((prev) => !prev)}
            title={autoRotating ? t("virtualTour.pauseRotation") : t("virtualTour.autoRotate")}
          >
            {autoRotating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 hover:text-white border border-white/10"
            onClick={() => {
              setRotation({ x: 0, y: 0 });
              setZoom(1);
            }}
            title={t("virtualTour.resetView")}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 hover:text-white border border-white/10"
            onClick={toggleFullscreen}
            title={isFullscreen ? t("virtualTour.exitFullscreen") : t("virtualTour.fullscreen")}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Drag Hint */}
      {showHint && !isDragging && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-lg border border-white/10 animate-pulse flex items-center gap-2">
            <Move className="w-4 h-4" />
            <span className="text-sm">{t("virtualTour.dragToLook")}</span>
          </div>
        </div>
      )}

      {/* Zoom Indicator */}
      {zoom > 1 && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
          <span className="bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded border border-white/10 flex items-center gap-1">
            <ZoomIn className="w-3 h-3" />
            {Math.round(zoom * 100)}%
          </span>
        </div>
      )}

      {/* Bottom Controls */}
      <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between z-10">
        {/* Navigation Arrows (multiple images) */}
        {images.length > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 hover:text-white border border-white/10"
              onClick={prevImage}
              title={t("virtualTour.previousRoom")}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 hover:text-white border border-white/10"
              onClick={nextImage}
              title={t("virtualTour.nextRoom")}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Navigation Dots */}
        {images.length > 1 && (
          <div className="flex items-center gap-1.5 mx-auto">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToImage(idx)}
                className={`transition-all duration-200 rounded-full ${
                  idx === currentIndex
                    ? "w-6 h-2 bg-white"
                    : "w-2 h-2 bg-white/50 hover:bg-white/70"
                }`}
                title={
                  roomLabels
                    ? roomLabels[idx]
                    : `${t("virtualTour.room")} ${idx + 1}`
                }
              />
            ))}
          </div>
        )}

        {/* Open Full Tour Button */}
        {onOpenFullTour && !isFullscreen && (
          <Button
            variant="ghost"
            size="sm"
            className="bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 hover:text-white border border-white/10 text-xs"
            onClick={onOpenFullTour}
          >
            <Maximize className="w-3.5 h-3.5 me-1" />
            {t("virtualTour.openFullTour")}
          </Button>
        )}
      </div>
    </div>
  );
}
