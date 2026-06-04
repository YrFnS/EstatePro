"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { staggerContainer, staggerItem } from "@/components/real-estate/types/animations";
import type { StatItem } from "./dashboard-types";

interface ActivityStatsProps {
  stats: StatItem[];
}

export function ActivityStats({ stats }: ActivityStatsProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
    >
      {stats.map((stat) => (
        <motion.div key={stat.label} variants={staggerItem}>
          <Card className="relative overflow-hidden hover:shadow-lg transition-shadow duration-300">
            {/* Gradient accent at top */}
            <div className={`absolute top-0 inset-x-0 h-1 ${stat.gradient}`} />
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${stat.bgLight}`}>
                  <stat.icon className={`w-5 h-5 ${stat.textColor}`} />
                </div>
                <span className={`text-3xl font-bold ${stat.textColor}`}>{stat.value}</span>
              </div>
              <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}
