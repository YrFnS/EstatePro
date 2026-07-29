"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  Move,
  Pause,
  Play,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";

interface PanoramicViewerProps {
  images: string[];
  autoRotate?: boolean;
  roomLabels?: string[];
  className?: string;
  onOpenFullTour?: () => void;
  activeIndex?: number;
  startIndex?: number;
  onIndexChange?: (index: number) => void;
}

function clampIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  return Math.max(0, Math.min(length - 1, index));
}

export function PanoramicViewer({
  images,
  autoRotate = true,
  roomLabels = [],
  className = "",
  onOpenFullTour,
  activeIndex,
  startIndex = 0,
  onIndexChange,
}: PanoramicViewerProps) {
  const { t, locale } = useI18n();
  const [internalIndex, setInternalIndex] = useState(() =>
    clampIndex(startIndex, images.length)
  );
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [rotating, setRotating] = useState(autoRotate);
  const [fullscreen, setFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastPointer = useRef({ x: 0, y: 0 });
  const animationFrame = useRef<number | null>(null);
  const lastAnimationTime = useRef<number | null>(null);

  const currentIndex = useMemo(
    () => clampIndex(activeIndex ?? internalIndex, images.length),
    [activeIndex, images.length, internalIndex]
  );
  const currentImage = images[currentIndex] || "";
  const roomLabel =
    roomLabels[currentIndex] ||
    `${locale === "ar" ? "الغرفة" : "Room"} ${currentIndex + 1}`;

  const changeIndex = useCallback(
    (nextIndex: number) => {
      if (!images.length) return;
      const normalized = ((nextIndex % images.length) + images.length) % images.length;
      setInternalIndex(normalized);
      setRotation({ x: 0, y: 0 });
      setZoom(1);
      onIndexChange?.(normalized);
    },
    [images.length, onIndexChange]
  );

  useEffect(() => {
    if (!rotating || dragging || !images.length) {
      if (animationFrame.current != null) {
        cancelAnimationFrame(animationFrame.current);
        animationFrame.current = null;
      }
      lastAnimationTime.current = null;
      return;
    }

    const animate = (time: number) => {
      const previous = lastAnimationTime.current ?? time;
      const delta = Math.min(50, time - previous);
      lastAnimationTime.current = time;
      setRotation((current) => ({
        ...current,
        y: current.y + delta * 0.012,
      }));
      animationFrame.current = requestAnimationFrame(animate);
    };

    animationFrame.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrame.current != null) {
        cancelAnimationFrame(animationFrame.current);
      }
      animationFrame.current = null;
      lastAnimationTime.current = null;
    };
  }, [dragging, images.length, rotating]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreen(document.fullscreenElement === containerRef.current);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement) && !fullscreen) return;
      if (event.key === "ArrowLeft") changeIndex(currentIndex - 1);
      if (event.key === "ArrowRight") changeIndex(currentIndex + 1);
      if (event.key.toLowerCase() === "r") {
        setRotation({ x: 0, y: 0 });
        setZoom(1);
      }
      if (event.key === " ") {
        event.preventDefault();
        setRotating((current) => !current);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [changeIndex, currentIndex, fullscreen]);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await containerRef.current.requestFullscreen();
    } catch {
      onOpenFullTour?.();
    }
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    setDragging(true);
    setRotating(false);
    lastPointer.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const deltaX = event.clientX - lastPointer.current.x;
    const deltaY = event.clientY - lastPointer.current.y;
    lastPointer.current = { x: event.clientX, y: event.clientY };
    setRotation((current) => ({
      x: Math.max(-35, Math.min(35, current.x - deltaY * 0.2)),
      y: current.y + deltaX * 0.25,
    }));
  };

  const stopDragging = (event: React.PointerEvent<HTMLDivElement>) => {
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  if (!images.length) {
    return (
      <div
        className={`flex h-72 items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground ${className}`}
      >
        {locale === "ar" ? "لا توجد صور بانورامية" : "No panoramic images available"}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className={`group relative h-72 w-full overflow-hidden rounded-xl bg-black outline-none focus-visible:ring-2 focus-visible:ring-primary sm:h-96 ${
        fullscreen ? "!h-screen !rounded-none" : ""
      } ${className}`}
      aria-label={roomLabel}
    >
      <div
        role="img"
        aria-label={roomLabel}
        className={`h-full w-full touch-none select-none bg-no-repeat ${
          dragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{
          backgroundImage: `url("${currentImage.replace(/"/g, "%22")}")`,
          backgroundSize: `${Math.max(200, 200 * zoom)}% 100%`,
          backgroundPosition: `${50 + (rotation.y % 360) * 0.25}% ${
            50 + rotation.x * 0.35
          }%`,
          transition: dragging ? "none" : "background-position 80ms linear",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
        onDoubleClick={() => {
          setRotation({ x: 0, y: 0 });
          setZoom(1);
        }}
        onWheel={(event) => {
          event.preventDefault();
          setZoom((current) =>
            Math.max(1, Math.min(3, current - event.deltaY * 0.0015))
          );
        }}
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />

      <div className="absolute start-4 top-4 rounded-full bg-black/55 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
        {roomLabel}
      </div>

      <div className="absolute end-3 top-3 flex gap-1 rounded-xl bg-black/45 p-1 backdrop-blur-sm">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-white hover:bg-white/15 hover:text-white"
          onClick={() => setZoom((current) => Math.min(3, current + 0.25))}
          aria-label={locale === "ar" ? "تكبير" : "Zoom in"}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-white hover:bg-white/15 hover:text-white"
          onClick={() => setZoom((current) => Math.max(1, current - 0.25))}
          aria-label={locale === "ar" ? "تصغير" : "Zoom out"}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-white hover:bg-white/15 hover:text-white"
          onClick={() => {
            setRotation({ x: 0, y: 0 });
            setZoom(1);
          }}
          aria-label={locale === "ar" ? "إعادة الضبط" : "Reset view"}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-white hover:bg-white/15 hover:text-white"
          onClick={() => setRotating((current) => !current)}
          aria-label={
            rotating
              ? locale === "ar" ? "إيقاف الدوران" : "Pause rotation"
              : locale === "ar" ? "تشغيل الدوران" : "Start rotation"
          }
        >
          {rotating ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-white hover:bg-white/15 hover:text-white"
          onClick={toggleFullscreen}
          aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {fullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </Button>
      </div>

      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2">
        {images.length > 1 ? (
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="h-9 w-9 rounded-full bg-black/55 text-white hover:bg-black/75"
            onClick={() => changeIndex(currentIndex - 1)}
            aria-label={t("common.previous")}
          >
            <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
          </Button>
        ) : null}
        <div className="flex items-center gap-2 rounded-full bg-black/55 px-3 py-2 text-xs text-white backdrop-blur-sm">
          <Move className="h-3.5 w-3.5" />
          {currentIndex + 1} / {images.length}
        </div>
        {images.length > 1 ? (
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="h-9 w-9 rounded-full bg-black/55 text-white hover:bg-black/75"
            onClick={() => changeIndex(currentIndex + 1)}
            aria-label={t("common.next")}
          >
            <ChevronRight className="h-4 w-4 rtl:rotate-180" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
