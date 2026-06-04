"use client";

import {
  ArrowUpRight,
  ArrowDownRight,
  Clock,
} from "lucide-react";

interface PriceHistorySectionProps {
  price: number;
  pricePerSqft: number;
  t: (key: string) => string;
  locale: string;
}

export function PriceHistorySection({ price, pricePerSqft, t, locale }: PriceHistorySectionProps) {
  return (
    <section>
      <h2 className="section-heading text-xl font-semibold mb-5">{t("priceHistory.title")}</h2>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
        <div>
          <p className="text-muted-foreground text-xs mb-0.5">{t("priceHistory.currentPrice")}</p>
          <p className="font-bold text-primary text-lg" style={{ letterSpacing: "-0.02em" }}>
            {t("common.currency")}{price.toLocaleString()}
          </p>
          {price !== 620000 && (
            <p className="text-xs text-muted-foreground line-through">
              {t("common.currency")}{(620000).toLocaleString()}
            </p>
          )}
        </div>
        <div>
          <p className="text-muted-foreground text-xs mb-0.5">{t("priceHistory.priceChange")}</p>
          <div className="flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-primary" />
            <span className="font-bold text-primary">
              +{(((price - 620000) / 620000) * 100).toFixed(1)}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("common.currency")}{(price - 620000).toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs mb-0.5">{t("priceHistory.daysOnMarket")}</p>
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="font-bold">45</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("priceHistory.pricePerSqft")}: {t("common.currency")}{Math.round(pricePerSqft).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="mb-6">
        <svg
          viewBox="0 0 600 200"
          className="w-full h-40 sm:h-48"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.15" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map((i) => {
            const y = 20 + i * 40;
            return (
              <g key={`grid-${i}`}>
                <line x1="40" y1={y} x2="580" y2={y} stroke="currentColor" strokeOpacity="0.04" strokeDasharray="4 4" />
                <text x="35" y={y + 4} textAnchor="end" className="fill-muted-foreground text-[9px]">
                  {(() => {
                    const prices = [620000, 610000, 625000, 640000, 635000, 650000, 660000, 655000, 670000, 680000, 685000, 690000];
                    const max = Math.max(...prices);
                    const min = Math.min(...prices);
                    const range = max - min;
                    const val = max - (i / 4) * range;
                    return `${(val / 1000).toFixed(0)}K`;
                  })()}
                </text>
              </g>
            );
          })}

          {/* Chart data */}
          {(() => {
            const prices = [620000, 610000, 625000, 640000, 635000, 650000, 660000, 655000, 670000, 680000, 685000, 690000];
            const max = Math.max(...prices);
            const min = Math.min(...prices);
            const range = max - min || 1;
            const padding = 20;
            const chartH = 160;

            const points = prices.map((p, i) => ({
              x: 40 + (i / (prices.length - 1)) * 540,
              y: padding + chartH - ((p - min) / range) * chartH,
            }));

            const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
            const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding + chartH} L ${points[0].x} ${padding + chartH} Z`;

            const months = locale === "ar"
              ? ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"]
              : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

            return (
              <>
                <path d={areaPath} fill="url(#priceGradient)" />
                <path d={linePath} fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

                {points.map((p, i) => (
                  <text key={`month-${i}`} x={p.x} y={195} textAnchor="middle" className="fill-muted-foreground text-[8px]">
                    {months[i]}
                  </text>
                ))}

                {points.map((p, i) => (
                  <circle key={`dot-${i}`} cx={p.x} cy={p.y} r="2.5" fill="white" stroke="var(--primary)" strokeWidth="1" className="opacity-0 hover:opacity-100 transition-opacity" />
                ))}

                <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="4" fill="var(--primary)" stroke="white" strokeWidth="1.5" />
              </>
            );
          })()}
        </svg>
      </div>

      {/* Timeline */}
      <div>
        <span className="editorial-label">{t("priceHistory.history")}</span>
        <div className="space-y-0 mt-3">
          {/* Listed */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
              <div className="w-px h-full bg-border min-h-[24px]" />
            </div>
            <div className="pb-4">
              <p className="text-sm">{t("priceHistory.listed")}</p>
              <p className="text-xs text-muted-foreground">
                {t("common.currency")}{(620000).toLocaleString()} · {locale === "ar" ? "يناير 2024" : "Jan 2024"}
              </p>
            </div>
          </div>

          {/* Decreased */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-2 h-2 rounded-full bg-muted-foreground mt-1.5" />
              <div className="w-px h-full bg-border min-h-[24px]" />
            </div>
            <div className="pb-4">
              <p className="text-sm">{t("priceHistory.priceDecreased")}</p>
              <p className="text-xs text-muted-foreground">
                {t("common.currency")}{(620000).toLocaleString()} → {t("common.currency")}{(610000).toLocaleString()} · {locale === "ar" ? "فبراير 2024" : "Feb 2024"}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <ArrowDownRight className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">-1.6%</span>
              </div>
            </div>
          </div>

          {/* Increased */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
              <div className="w-px h-full bg-border min-h-[24px]" />
            </div>
            <div className="pb-4">
              <p className="text-sm">{t("priceHistory.priceIncreased")}</p>
              <p className="text-xs text-muted-foreground">
                {t("common.currency")}{(610000).toLocaleString()} → {t("common.currency")}{(625000).toLocaleString()} · {locale === "ar" ? "مارس 2024" : "Mar 2024"}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <ArrowUpRight className="w-3 h-3 text-primary" />
                <span className="text-xs text-primary">+2.5%</span>
              </div>
            </div>
          </div>

          {/* Current */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
            </div>
            <div className="pb-2">
              <p className="text-sm font-medium text-primary">{t("priceHistory.currentPrice")}</p>
              <p className="text-xs text-muted-foreground">
                {t("common.currency")}{price.toLocaleString()} · {locale === "ar" ? "ديسمبر 2024" : "Dec 2024"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
