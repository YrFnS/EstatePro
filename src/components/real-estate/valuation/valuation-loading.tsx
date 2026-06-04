"use client";

import { DollarSign, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface ValuationLoadingProps {
  calculatingText: string;
}

export function ValuationLoading({ calculatingText }: ValuationLoadingProps) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md mx-auto px-4"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary flex items-center justify-center shadow-xl "
        >
          <DollarSign className="w-10 h-10 text-primary-foreground" />
        </motion.div>
        <h3 className="text-xl font-bold mb-2">{calculatingText}</h3>
        <div className="flex items-center justify-center gap-2 mt-4">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="text-muted-foreground text-sm">AI is analyzing market data...</span>
        </div>
      </motion.div>
    </div>
  );
}
