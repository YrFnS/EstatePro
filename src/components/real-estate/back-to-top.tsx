"use client";

import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n/provider";

export function BackToTopButton() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 400);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed bottom-6 end-6 z-50"
        >
          <Button
            onClick={scrollToTop}
            size="icon"
            className="h-12 w-12 rounded-full shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground"
            title={t("common.backToTop")}
          >
            <ArrowUp className="w-5 h-5" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
