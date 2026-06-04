import {
  Waves, TreePine, Car, Wind, Smartphone, Sun,
  Shield, Flame,
} from "lucide-react";

export interface ValuationResult {
  estimatedValue: number;
  confidenceLow: number;
  confidenceHigh: number;
  marketTrend: string;
  investmentScore: number;
  positiveFactors: string[];
  negativeFactors: string[];
  scoreBreakdown: {
    locationQuality: number;
    propertyCondition: number;
    marketDemand: number;
    futurePotential: number;
  };
  valueBreakdown: {
    baseValue: number;
    featureBonus: number;
    locationAdjustment: number;
    marketAdjustment: number;
  };
  neighborhoodAvg: number;
  cityAvg: number;
}

export const featureOptions = [
  { key: "swimmingPool", icon: Waves, color: "text-cyan-500" },
  { key: "garden", icon: TreePine, color: "text-green-500" },
  { key: "garage", icon: Car, color: "text-slate-500" },
  { key: "centralAC", icon: Wind, color: "text-sky-500" },
  { key: "smartHome", icon: Smartphone, color: "text-violet-500" },
  { key: "solarPanels", icon: Sun, color: "text-amber-500" },
  { key: "security", icon: Shield, color: "text-red-500" },
  { key: "fireplace", icon: Flame, color: "text-orange-500" },
];
