"use client";

import React, { forwardRef, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ModalSize = "sm" | "md" | "lg" | "full";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: ModalSize;
  /** Hide the default close (X) button */
  hideCloseButton?: boolean;
  /** Extra classes applied to the content panel */
  className?: string;
  children?: React.ReactNode;
}

/* ------------------------------------------------------------------ */
/*  Size map                                                           */
/* ------------------------------------------------------------------ */

const sizeClasses: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  full: "max-w-full mx-4 sm:mx-6",
};

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const panelVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring" as const, damping: 25, stiffness: 350 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.15 },
  },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const Modal = forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      open,
      onClose,
      title,
      description,
      size = "md",
      hideCloseButton = false,
      className,
      children,
    },
    ref,
  ) => {
    /* Close on Escape */
    const handleKeyDown = useCallback(
      (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      },
      [onClose],
    );

    useEffect(() => {
      if (open) {
        document.addEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "hidden";
        // Flag used by app chrome (bottom nav etc.) to hide itself while a
        // modal is open, so it can't overlap the dialog.
        document.body.classList.add("modal-open");
      }
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "";
        document.body.classList.remove("modal-open");
      };
    }, [open, handleKeyDown]);

    return (
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            {/* Overlay */}
            <motion.div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              variants={overlayVariants}
              onClick={onClose}
              aria-hidden
            />

            {/* Panel */}
            <motion.div
              ref={ref}
              role="dialog"
              aria-modal="true"
              aria-label={title}
              variants={panelVariants}
              className={cn(
                "relative z-10 w-full max-h-[90vh] overflow-y-auto rounded-2xl bg-surface-container-lowest p-6 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]",
                sizeClasses[size],
                className,
              )}
            >
              {/* Close button */}
              {!hideCloseButton && (
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high active:bg-surface-container-highest"
                  aria-label="Close dialog"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    close
                  </span>
                </button>
              )}

              {/* Header */}
              {(title || description) && (
                <div className="mb-4 pr-8">
                  {title && (
                    <h2 className="text-title-lg font-title-lg text-on-surface">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="mt-1 text-body-md font-body-md text-on-surface-variant">
                      {description}
                    </p>
                  )}
                </div>
              )}

              {/* Content */}
              {children}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  },
);

Modal.displayName = "Modal";

export { Modal };
