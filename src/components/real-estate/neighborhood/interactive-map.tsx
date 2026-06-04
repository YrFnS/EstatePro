"use client";

import { neighborhoods } from "./neighborhood-data";

interface InteractiveMapProps {
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  t: (key: string) => string;
}

export function InteractiveMap({ hoveredId, onHover, t }: InteractiveMapProps) {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-auto max-h-[400px]" preserveAspectRatio="xMidYMid meet">
      {/* Background */}
      <rect x="0" y="0" width="100" height="100" fill="currentColor" className="text-muted/20" rx="4" />

      {/* Grid lines */}
      {[20, 40, 60, 80].map((v) => (
        <g key={v}>
          <line x1={v} y1="5" x2={v} y2="95" stroke="currentColor" className="text-border" strokeWidth="0.15" strokeDasharray="1 1" />
          <line x1="5" y1={v} x2="95" y2={v} stroke="currentColor" className="text-border" strokeWidth="0.15" strokeDasharray="1 1" />
        </g>
      ))}

      {/* Main roads */}
      <line x1="5" y1="50" x2="95" y2="50" stroke="currentColor" className="text-border" strokeWidth="0.5" />
      <line x1="50" y1="5" x2="50" y2="95" stroke="currentColor" className="text-border" strokeWidth="0.5" />
      <line x1="25" y1="5" x2="75" y2="95" stroke="currentColor" className="text-border" strokeWidth="0.2" strokeDasharray="2 1" />

      {/* River/water */}
      <path
        d="M 75 5 Q 70 25 78 45 Q 85 65 72 95"
        fill="none"
        stroke="#14b8a6"
        strokeWidth="1.5"
        opacity="0.3"
      />

      {/* Neighborhood zones */}
      {neighborhoods.map((nb) => {
        const isHovered = hoveredId === nb.id;
        return (
          <g
            key={nb.id}
            onMouseEnter={() => onHover(nb.id)}
            onMouseLeave={() => onHover(null)}
            className="cursor-pointer transition-all duration-300"
          >
            <rect
              x={nb.mapX}
              y={nb.mapY}
              width={nb.mapWidth}
              height={nb.mapHeight}
              rx="2"
              fill={isHovered ? "#059669" : "#10b981"}
              fillOpacity={isHovered ? 0.45 : 0.2}
              stroke={isHovered ? "#059669" : "#14b8a6"}
              strokeWidth={isHovered ? 0.6 : 0.3}
              className="transition-all duration-300"
            />
            <text
              x={nb.mapX + nb.mapWidth / 2}
              y={nb.mapY + nb.mapHeight / 2 + 1}
              textAnchor="middle"
              className="fill-foreground"
              fontSize={isHovered ? "2.2" : "1.8"}
              fontWeight={isHovered ? "bold" : "normal"}
            >
              {t(nb.nameKey)}
            </text>
            {isHovered && (
              <text
                x={nb.mapX + nb.mapWidth / 2}
                y={nb.mapY + nb.mapHeight / 2 + 4}
                textAnchor="middle"
                className="fill-muted-foreground"
                fontSize="1.3"
              >
                {nb.avgPrice}
              </text>
            )}
          </g>
        );
      })}

      {/* Legend */}
      <text x="5" y="98" className="fill-muted-foreground" fontSize="1.5">
        {t("neighborhoodGuide.hoverToExplore")}
      </text>
    </svg>
  );
}
