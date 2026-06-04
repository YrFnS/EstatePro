"use client";

import {
  Footprints,
  Train,
  Bike,
  UtensilsCrossed,
  GraduationCap,
  TreePine,
  ShoppingBasket,
  Hospital,
  Coffee,
} from "lucide-react";

interface WalkScoreSectionProps {
  t: (key: string) => string;
}

export function WalkScoreSection({ t }: WalkScoreSectionProps) {
  return (
    <section>
      <h2 className="section-heading text-xl font-semibold mb-5">{t("walkScore.title")}</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
        {[
          { icon: Footprints, label: t("walkScore.title"), score: 82, color: "bg-primary" },
          { icon: Train, label: t("walkScore.transit"), score: 65, color: "bg-secondary" },
          { icon: Bike, label: t("walkScore.bike"), score: 71, color: "bg-muted-foreground/40" },
        ].map(({ icon: Icon, label, score, color }) => (
          <div key={label}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{label}</span>
              </div>
              <span className="text-sm font-bold">{score}/100</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${color} transition-all duration-700`}
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Nearby Amenities — simple text list */}
      <div>
        <span className="editorial-label">{t("walkScore.nearbyAmenities")}</span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1.5 mt-3">
          {[
            { icon: UtensilsCrossed, label: t("walkScore.restaurants"), count: "12+" },
            { icon: GraduationCap, label: t("walkScore.schools"), count: "5" },
            { icon: TreePine, label: t("walkScore.parks"), count: "3" },
            { icon: ShoppingBasket, label: t("walkScore.groceries"), count: "4" },
            { icon: Hospital, label: t("walkScore.hospitals"), count: "2" },
            { icon: Coffee, label: t("walkScore.coffee"), count: "8+" },
          ].map(({ icon: Icon, label, count }) => (
            <div key={label} className="flex items-center gap-2 py-1 text-sm">
              <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">{label}</span>
              <span className="font-semibold ms-auto">{count}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground/60 mt-2">
          {t("walkScore.walkingDistance")}
        </p>
      </div>
    </section>
  );
}
