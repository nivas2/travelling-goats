"use client";

import React, { forwardRef, useCallback, useEffect } from "react";
import {
  AnimatePresence,
  motion,
  type PanInfo,
  useAnimation,
} from "framer-motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  /** Snap‐point heights as viewport‐height percentages (0-100). Defaults to [50, 90]. */
  snapPoints?: number[];
  /** Index into `snapPoints` to open at. Defaults to 0. */
  defaultSnap?: number;
  title?: string;
  className?: string;
  children?: React.ReactNode;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const BottomSheet = forwardRef<HTMLDivElement, BottomSheetProps>(
  (
    {
      open,
      onClose,
      snapPoints = [50, 90],
      defaultSnap = 0,
      title,
      className,
      children,
    },
    ref,
  ) => {
    const controls = useAnimation();

    const currentHeight = snapPoints[defaultSnap] ?? snapPoints[0];

    /* Animate open */
    useEffect(() => {
      if (open) {
        controls.start({ y: 0 });
        document.body.style.overflow = "hidden";
      }
      return () => {
        document.body.style.overflow = "";
      };
    }, [open, controls]);

    /* Drag end handler — snap or dismiss */
    const handleDragEnd = useCallback(
      (_: unknown, info: PanInfo) => {
        const offsetY = info.offset.y;
        const velocityY = info.velocity.y;

        // Fast swipe down — close
        if (velocityY > 500 || offsetY > 150) {
          controls.start({ y: "100%" }).then(onClose);
          return;
        }

        // Otherwise snap back
        controls.start({ y: 0 });
      },
      [controls, onClose],
    );

    return (
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50">
            {/* Overlay */}
            <motion.div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              aria-hidden
            />

            {/* Sheet */}
            <motion.div
              ref={ref}
              role="dialog"
              aria-modal="true"
              aria-label={title}
              className={cn(
                "absolute bottom-0 left-0 right-0 rounded-t-2xl bg-surface-container-lowest shadow-elevated",
                className,
              )}
              style={{ height: `${currentHeight}vh` }}
              initial={{ y: "100%" }}
              animate={controls}
              exit={{ y: "100%", transition: { duration: 0.25 } }}
              transition={{
                type: "spring",
                damping: 30,
                stiffness: 350,
              }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="h-1 w-10 rounded-full bg-outline-variant" />
              </div>

              {/* Title */}
              {title && (
                <div className="border-b border-outline-variant px-5 pb-3">
                  <h2 className="text-title-lg font-title-lg text-on-surface">
                    {title}
                  </h2>
                </div>
              )}

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  },
);

BottomSheet.displayName = "BottomSheet";

export { BottomSheet };
