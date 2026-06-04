"use client";

import { motion } from "framer-motion";

export function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0.5, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="tabular-nums"
    >
      {prefix}
      {value.toLocaleString()}
      {suffix}
    </motion.span>
  );
}
