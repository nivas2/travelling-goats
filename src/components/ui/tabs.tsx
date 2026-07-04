"use client";

import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (value: string) => void;
  baseId: string;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("Tab* components must be used within <Tabs>");
  return ctx;
}

/* ------------------------------------------------------------------ */
/*  Tabs (root)                                                        */
/* ------------------------------------------------------------------ */

export interface TabsProps {
  /** The controlled active tab value. */
  value?: string;
  /** Default active tab for uncontrolled usage. */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children?: React.ReactNode;
}

const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  ({ value, defaultValue = "", onValueChange, className, children }, ref) => {
    const [internalValue, setInternalValue] = useState(defaultValue);
    const activeTab = value ?? internalValue;
    const baseId = useId();

    const setActiveTab = useCallback(
      (v: string) => {
        if (value === undefined) setInternalValue(v);
        onValueChange?.(v);
      },
      [value, onValueChange],
    );

    return (
      <TabsContext.Provider value={{ activeTab, setActiveTab, baseId }}>
        <div ref={ref} className={cn("w-full", className)}>
          {children}
        </div>
      </TabsContext.Provider>
    );
  },
);

Tabs.displayName = "Tabs";

/* ------------------------------------------------------------------ */
/*  TabList                                                            */
/* ------------------------------------------------------------------ */

export interface TabListProps {
  className?: string;
  children?: React.ReactNode;
}

const TabList = forwardRef<HTMLDivElement, TabListProps>(
  ({ className, children }, ref) => {
    const { activeTab, baseId } = useTabsContext();
    const containerRef = useRef<HTMLDivElement>(null);
    const [indicator, setIndicator] = useState({ left: 0, width: 0 });

    useLayoutEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const activeEl = container.querySelector<HTMLElement>(
        `[data-tab-value="${activeTab}"]`,
      );
      if (!activeEl) return;

      setIndicator({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
      });
    }, [activeTab, baseId]);

    return (
      <div
        ref={(node) => {
          (containerRef as React.MutableRefObject<HTMLDivElement | null>).current =
            node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        role="tablist"
        className={cn(
          "relative flex gap-1 border-b border-outline-variant overflow-x-auto hide-scrollbar",
          className,
        )}
      >
        {children}

        {/* Animated underline */}
        <motion.div
          className="absolute bottom-0 h-[3px] rounded-full bg-primary"
          animate={{ left: indicator.left, width: indicator.width }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      </div>
    );
  },
);

TabList.displayName = "TabList";

/* ------------------------------------------------------------------ */
/*  Tab (trigger)                                                      */
/* ------------------------------------------------------------------ */

export interface TabProps {
  value: string;
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
}

const Tab = forwardRef<HTMLButtonElement, TabProps>(
  ({ value, className, children, disabled }, ref) => {
    const { activeTab, setActiveTab, baseId } = useTabsContext();
    const isActive = activeTab === value;

    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        id={`${baseId}-tab-${value}`}
        aria-selected={isActive}
        aria-controls={`${baseId}-panel-${value}`}
        aria-disabled={disabled}
        disabled={disabled}
        data-tab-value={value}
        onClick={() => setActiveTab(value)}
        className={cn(
          "relative shrink-0 whitespace-nowrap rounded-lg px-4 py-3 text-label-lg font-label-lg transition-colors",
          isActive
            ? "text-primary"
            : "text-on-surface-variant hover:bg-surface-container/50 hover:text-on-surface",
          disabled && "pointer-events-none opacity-50",
          className,
        )}
      >
        {children}
      </button>
    );
  },
);

Tab.displayName = "Tab";

/* ------------------------------------------------------------------ */
/*  TabPanel                                                           */
/* ------------------------------------------------------------------ */

export interface TabPanelProps {
  value: string;
  className?: string;
  children?: React.ReactNode;
}

const TabPanel = forwardRef<HTMLDivElement, TabPanelProps>(
  ({ value, className, children }, ref) => {
    const { activeTab, baseId } = useTabsContext();
    if (activeTab !== value) return null;

    return (
      <div
        ref={ref}
        role="tabpanel"
        id={`${baseId}-panel-${value}`}
        aria-labelledby={`${baseId}-tab-${value}`}
        className={cn("pt-4", className)}
      >
        {children}
      </div>
    );
  },
);

TabPanel.displayName = "TabPanel";

export { Tabs, TabList, Tab, TabPanel };
