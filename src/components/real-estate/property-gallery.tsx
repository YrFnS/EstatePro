"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
  ZoomOut,
  Play,
  Pause,
  Maximize,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/provider";

interface PropertyGalleryProps {
  images: string[];
  title: string;
  statusLabel: string;
  statusColor: string;
}

export function PropertyGallery({
  images,
  title,
  statusLabel,
  statusColor,
}: PropertyGalleryProps) {
  const { t, locale } = useI18n();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isSlideshow, setIsSlideshow] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set([0]));
  const thumbnailScrollRef = useRef<HTMLDivElement>(null);
  const lightboxThumbRef = useRef<HTMLDivElement>(null);
  const slideshowRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<number | null>(null);

  const imageList = images.length > 0 ? images : [];
  const currentImage =
    imageList.length > 0
      ? imageList[currentIndex]
      : "https://placehold.co/1200x800/e2e8f0/64748b?text=No+Image";

  // === Callbacks (declared before effects that use them) ===

  const handleImageLoad = useCallback((index: number) => {
    setLoadedImages((prev) => new Set(prev).add(index));
  }, []);

  const navigateLightbox = useCallback(
    (direction: number) => {
      setZoomLevel((currentZoom) => {
        if (currentZoom > 1) {
          return 1;
        }
        setLightboxIndex((prev) => {
          const next = prev + direction;
          if (next < 0) return imageList.length - 1;
          if (next >= imageList.length) return 0;
          return next;
        });
        return 1;
      });
    },
    [imageList.length]
  );

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
    setZoomLevel(1);
    setIsSlideshow(false);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
    setIsSlideshow(false);
    setZoomLevel(1);
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(prev + 0.5, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(prev - 0.5, 1));
  }, []);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (zoomLevel > 1) {
        setZoomLevel(1);
      } else {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setZoomOrigin({ x, y });
        setZoomLevel(2);
      }
    },
    [zoomLevel]
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.deltaY < 0) {
        handleZoomIn();
      } else {
        handleZoomOut();
      }
    },
    [handleZoomIn, handleZoomOut]
  );

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartRef.current === null) return;
      const diff = e.changedTouches[0].clientX - touchStartRef.current;
      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          navigateLightbox(-1);
        } else {
          navigateLightbox(1);
        }
      }
      touchStartRef.current = null;
    },
    [navigateLightbox]
  );

  // === Effects ===

  // Preload adjacent images
  useEffect(() => {
    const preload = (index: number) => {
      if (index >= 0 && index < imageList.length) {
        const img = new Image();
        img.src = imageList[index];
      }
    };
    preload(currentIndex + 1);
    preload(currentIndex - 1);
  }, [currentIndex, imageList]);

  // Scroll active thumbnail into view
  useEffect(() => {
    if (thumbnailScrollRef.current) {
      const activeThumb = thumbnailScrollRef.current.children[
        currentIndex
      ] as HTMLElement;
      if (activeThumb) {
        activeThumb.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [currentIndex]);

  // Scroll lightbox thumbnail into view
  useEffect(() => {
    if (lightboxThumbRef.current) {
      const activeThumb = lightboxThumbRef.current.children[
        lightboxIndex
      ] as HTMLElement;
      if (activeThumb) {
        activeThumb.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [lightboxIndex]);

  // Slideshow auto-play
  useEffect(() => {
    if (isSlideshow && lightboxOpen && imageList.length > 1) {
      slideshowRef.current = setInterval(() => {
        setLightboxIndex((prev) =>
          prev < imageList.length - 1 ? prev + 1 : 0
        );
      }, 3000);
    }
    return () => {
      if (slideshowRef.current) {
        clearInterval(slideshowRef.current);
        slideshowRef.current = null;
      }
    };
  }, [isSlideshow, lightboxOpen, imageList.length]);

  // Lightbox keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeLightbox();
      } else if (e.key === "ArrowLeft") {
        navigateLightbox(-1);
      } else if (e.key === "ArrowRight") {
        navigateLightbox(1);
      } else if (e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        setIsSlideshow((prev) => !prev);
      } else if (e.key === "+" || e.key === "=") {
        handleZoomIn();
      } else if (e.key === "-") {
        handleZoomOut();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, closeLightbox, navigateLightbox, handleZoomIn, handleZoomOut]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (lightboxOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [lightboxOpen]);

  return (
    <>
      {/* ==================== Main Gallery ==================== */}
      <div className="mb-4">
        {/* Main Image Display */}
        <div className="relative rounded-xl overflow-hidden mb-3">
          <div
            className="relative h-64 sm:h-80 md:h-[450px] bg-muted cursor-pointer group"
            onClick={() => openLightbox(currentIndex)}
          >
            {imageList.length > 0 ? (
              <img
                src={currentImage}
                alt={title}
                className={`w-full h-full object-cover transition-all duration-500 ${
                  loadedImages.has(currentIndex)
                    ? "opacity-100 blur-0"
                    : "opacity-0 blur-sm"
                } group-hover:scale-[1.02]`}
                onLoad={() => handleImageLoad(currentIndex)}
              />
            ) : (
              <img
                src="https://placehold.co/1200x800/e2e8f0/64748b?text=No+Image"
                alt={title}
                className="w-full h-full object-cover"
              />
            )}

            {/* Blur-up placeholder */}
            {imageList.length > 0 && !loadedImages.has(currentIndex) && (
              <div className="absolute inset-0 bg-muted animate-pulse" />
            )}

            {/* Status badge */}
            <span
              className={`absolute top-4 start-4 px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}
            >
              {statusLabel}
            </span>

            {/* Zoom overlay on hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg">
                  <ZoomIn className="w-6 h-6 text-primary" />
                </div>
              </div>
            </div>

            {/* Fullscreen overlay button */}
            {imageList.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openLightbox(0);
                }}
                className="absolute bottom-4 end-4 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-black/80 transition-colors flex items-center gap-2"
              >
                <Maximize className="w-4 h-4" />
                {t("gallery.fullscreen")}
              </button>
            )}

            {/* Photo count badge */}
            {imageList.length > 0 && (
              <div className="absolute top-4 start-4 mt-10">
                <Badge
                  variant="secondary"
                  className="bg-black/60 text-white backdrop-blur-sm border-0 text-xs"
                >
                  📷 {imageList.length} {t("gallery.photos")}
                </Badge>
              </div>
            )}
          </div>

          {/* Image Navigation Arrows */}
          {imageList.length > 1 && (
            <>
              <Button
                variant="secondary"
                size="icon"
                className="absolute start-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white shadow-md"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex((prev) =>
                    prev > 0 ? prev - 1 : imageList.length - 1
                  );
                }}
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="sr-only">{t("gallery.previous")}</span>
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="absolute end-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white shadow-md"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex((prev) =>
                    prev < imageList.length - 1 ? prev + 1 : 0
                  );
                }}
              >
                <ChevronRight className="w-5 h-5" />
                <span className="sr-only">{t("gallery.next")}</span>
              </Button>

              {/* Dot indicators */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
                {imageList.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentIndex(idx);
                    }}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                      idx === currentIndex
                        ? "bg-white scale-110"
                        : "bg-white/50 hover:bg-white/70"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Thumbnail Strip */}
        {imageList.length > 1 && (
          <div
            ref={thumbnailScrollRef}
            className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin"
          >
            {imageList.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`shrink-0 h-16 w-24 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                  idx === currentIndex
                    ? "border-primary shadow-md scale-105 ring-2 ring-primary/20"
                    : "border-transparent opacity-70 hover:opacity-100 hover:border-primary/30"
                }`}
              >
                <img
                  src={img}
                  alt=""
                  className="w-full h-full object-cover"
                  loading={idx < 4 ? "eager" : "lazy"}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ==================== Full-screen Lightbox ==================== */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col"
            onClick={(e) => {
              if (e.target === e.currentTarget) closeLightbox();
            }}
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between px-4 py-3 z-50">
              {/* Image Counter */}
              <div className="bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium">
                {lightboxIndex + 1}{" "}
                {t("gallery.imageOf", { total: imageList.length })}
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                {/* Slideshow Toggle */}
                {imageList.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`rounded-full backdrop-blur-sm text-white h-10 w-10 ${
                      isSlideshow
                        ? "bg-primary/80 hover:bg-primary"
                        : "bg-white/10 hover:bg-white/20"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsSlideshow((prev) => !prev);
                    }}
                  >
                    {isSlideshow ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5" />
                    )}
                    <span className="sr-only">
                      {isSlideshow
                        ? t("gallery.pauseSlideshow")
                        : t("gallery.playSlideshow")}
                    </span>
                  </Button>
                )}

                {/* Zoom Controls */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white h-10 w-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleZoomOut();
                  }}
                  disabled={zoomLevel <= 1}
                >
                  <ZoomOut className="w-5 h-5" />
                  <span className="sr-only">{t("gallery.zoomOut")}</span>
                </Button>
                <span className="text-white/70 text-sm font-medium min-w-[3rem] text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white h-10 w-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleZoomIn();
                  }}
                  disabled={zoomLevel >= 3}
                >
                  <ZoomIn className="w-5 h-5" />
                  <span className="sr-only">{t("gallery.zoomIn")}</span>
                </Button>

                {/* Close Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white h-10 w-10 ms-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeLightbox();
                  }}
                >
                  <X className="w-5 h-5" />
                  <span className="sr-only">{t("gallery.close")}</span>
                </Button>
              </div>
            </div>

            {/* Main Image Area */}
            <div
              ref={imageRef}
              className="flex-1 relative flex items-center justify-center overflow-hidden"
              onClick={(e) => {
                if (e.target === e.currentTarget) closeLightbox();
              }}
              onDoubleClick={handleDoubleClick}
              onWheel={handleWheel}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={lightboxIndex}
                  src={
                    imageList[lightboxIndex] ||
                    "https://placehold.co/1200x800/e2e8f0/64748b?text=No+Image"
                  }
                  alt={`${title} - ${lightboxIndex + 1}`}
                  className="max-h-[85vh] object-contain transition-transform duration-200"
                  style={{
                    transform: `scale(${zoomLevel})`,
                    transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
                  }}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  draggable={false}
                />
              </AnimatePresence>

              {/* Navigation Arrows */}
              {imageList.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute start-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white h-12 w-12 shadow-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateLightbox(-1);
                    }}
                  >
                    <ChevronLeft className="w-6 h-6" />
                    <span className="sr-only">{t("gallery.previous")}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute end-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white h-12 w-12 shadow-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateLightbox(1);
                    }}
                  >
                    <ChevronRight className="w-6 h-6" />
                    <span className="sr-only">{t("gallery.next")}</span>
                  </Button>
                </>
              )}

              {/* Slideshow progress indicator */}
              {isSlideshow && (
                <motion.div
                  className="absolute bottom-0 left-0 h-1 bg-primary"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 3, ease: "linear" }}
                  key={`progress-${lightboxIndex}`}
                />
              )}
            </div>

            {/* Bottom Thumbnail Strip */}
            {imageList.length > 1 && (
              <div className="py-3 px-4 z-50">
                <div
                  ref={lightboxThumbRef}
                  className="flex items-center gap-2 overflow-x-auto max-w-[90vw] mx-auto py-2 px-1 scrollbar-thin"
                >
                  {imageList.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxIndex(idx);
                        setZoomLevel(1);
                      }}
                      className={`shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                        idx === lightboxIndex
                          ? "border-white opacity-100 scale-110 shadow-lg"
                          : "border-transparent opacity-50 hover:opacity-80"
                      }`}
                    >
                      <img
                        src={img}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
