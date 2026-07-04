"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { useBookingStore } from "@/stores/booking-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { BookingBottomBar } from "@/components/booking/booking-bottom-bar";
import type { AddOnData, SnackOptionData } from "@/types";

// ---------------------------------------------------------------------------
//  Demo data (would come from API in production)
// ---------------------------------------------------------------------------

const DEMO_ADDONS: AddOnData[] = [
  {
    id: "addon-1",
    name: "Photography Pack",
    description: "Professional photographer for the entire trip",
    pricePaise: 149900,
    icon: "photo_camera",
    maxQuantity: 1,
    isPopular: true,
  },
  {
    id: "addon-2",
    name: "Adventure Gear Kit",
    description: "Trekking poles, headlamp, and rain cover",
    pricePaise: 49900,
    icon: "hiking",
    maxQuantity: 5,
    isPopular: false,
  },
  {
    id: "addon-3",
    name: "Bonfire & BBQ Night",
    description: "Special bonfire setup with BBQ on Day 2",
    pricePaise: 79900,
    icon: "local_fire_department",
    maxQuantity: 1,
    isPopular: true,
  },
  {
    id: "addon-4",
    name: "First Aid Premium Kit",
    description: "Comprehensive first aid kit for the group",
    pricePaise: 29900,
    icon: "medical_services",
    maxQuantity: 2,
    isPopular: false,
  },
  {
    id: "addon-5",
    name: "Portable Charger Rental",
    description: "20000mAh power bank for the entire trip",
    pricePaise: 19900,
    icon: "battery_charging_full",
    maxQuantity: 5,
    isPopular: false,
  },
];

const DEMO_SNACKS: SnackOptionData[] = [
  {
    id: "snack-1",
    name: "Veg Sandwich Pack",
    description: "2 grilled sandwiches + juice",
    pricePaise: 14900,
    category: "meal",
    icon: "lunch_dining",
    isVeg: true,
  },
  {
    id: "snack-2",
    name: "Veg Biryani Box",
    description: "Aromatic rice with raita and salad",
    pricePaise: 19900,
    category: "meal",
    icon: "rice_bowl",
    isVeg: true,
  },
  {
    id: "snack-3",
    name: "Trail Mix & Energy Bars",
    description: "Nuts, dried fruits, and 2 protein bars",
    pricePaise: 9900,
    category: "snack",
    icon: "nutrition",
    isVeg: true,
  },
  {
    id: "snack-4",
    name: "Chicken Wrap Box",
    description: "2 chicken wraps + cold drink",
    pricePaise: 22900,
    category: "meal",
    icon: "kebab_dining",
    isVeg: false,
  },
  {
    id: "snack-5",
    name: "Egg Biryani Box",
    description: "Egg biryani with salan and onion raita",
    pricePaise: 17900,
    category: "meal",
    icon: "rice_bowl",
    isVeg: false,
  },
  {
    id: "snack-6",
    name: "Cookies & Chips Combo",
    description: "Assorted cookies and chips pack",
    pricePaise: 7900,
    category: "snack",
    icon: "cookie",
    isVeg: true,
  },
];

// ---------------------------------------------------------------------------
//  Sub-Components
// ---------------------------------------------------------------------------

function QuantitySelector({
  value,
  max,
  onChange,
}: {
  value: number;
  max: number;
  onChange: (val: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        disabled={value <= 0}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full border transition-colors",
          value <= 0
            ? "border-outline-variant/30 text-on-surface-variant/30 cursor-not-allowed"
            : "border-primary text-primary hover:bg-primary/5",
        )}
        aria-label="Decrease quantity"
      >
        <span className="material-symbols-outlined text-[16px]">remove</span>
      </button>
      <span className="min-w-[1.5ch] text-center text-label-lg font-label-lg text-on-surface">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full border transition-colors",
          value >= max
            ? "border-outline-variant/30 text-on-surface-variant/30 cursor-not-allowed"
            : "border-primary text-primary hover:bg-primary/5",
        )}
        aria-label="Increase quantity"
      >
        <span className="material-symbols-outlined text-[16px]">add</span>
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
//  Page Component
// ---------------------------------------------------------------------------

export default function AddonsPage() {
  const params = useParams<{ tripId: string }>();
  const router = useRouter();
  const tripId = params.tripId;

  const {
    selectedAddOns,
    selectedSnacks,
    toggleAddOn,
    toggleSnack,
    setStep,
  } = useBookingStore();

  const [addons, setAddons] = useState<AddOnData[]>([]);
  const [snacks, setSnacks] = useState<SnackOptionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackTab, setSnackTab] = useState("veg");

  useEffect(() => {
    setStep(4);

    // Simulate API fetch
    async function fetchData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/trips/${tripId}`);
        if (res.ok) {
          const json = await res.json();
          const trip = json.data ?? json;
          setAddons(trip.addOns?.length ? trip.addOns : DEMO_ADDONS);
          setSnacks(trip.snackOptions?.length ? trip.snackOptions : DEMO_SNACKS);
        } else {
          // Fallback to demo data
          setAddons(DEMO_ADDONS);
          setSnacks(DEMO_SNACKS);
        }
      } catch {
        setAddons(DEMO_ADDONS);
        setSnacks(DEMO_SNACKS);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [tripId, setStep]);

  // Calculate running total
  const addonsTotal = addons.reduce((sum, addon) => {
    const qty = selectedAddOns[addon.id] ?? 0;
    return sum + addon.pricePaise * qty;
  }, 0);

  const snacksTotal = snacks.reduce((sum, snack) => {
    const qty = selectedSnacks[snack.id] ?? 0;
    return sum + snack.pricePaise * qty;
  }, 0);

  const runningTotal = addonsTotal + snacksTotal;

  const vegSnacks = snacks.filter((s) => s.isVeg);
  const nonVegSnacks = snacks.filter((s) => !s.isVeg);

  const handleContinue = () => {
    router.push(`/${tripId}/payment`);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-5">
        <Skeleton variant="text" lines={2} />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} height={80} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-5 pb-36">
      {/* Heading */}
      <div>
        <h2 className="text-headline-md font-headline-md text-on-surface">
          Add-ons & Snacks
        </h2>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Enhance your trip with extras (all optional)
        </p>
      </div>

      {/* Add-ons section */}
      <div className="flex flex-col gap-3">
        <h3 className="text-title-lg font-title-lg text-on-surface">
          Add-ons
        </h3>

        {addons.map((addon, index) => {
          const qty = selectedAddOns[addon.id] ?? 0;
          return (
            <motion.div
              key={addon.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                variant="outlined"
                className={cn(
                  "flex items-start gap-3 transition-colors",
                  qty > 0 && "border-primary bg-primary-fixed/10",
                )}
              >
                {/* Icon */}
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                    qty > 0
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container text-on-surface-variant",
                  )}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {addon.icon ?? "add_circle"}
                  </span>
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-title-md font-title-md text-on-surface">
                      {addon.name}
                    </span>
                    {addon.isPopular && (
                      <Badge variant="default" className="text-[10px] px-1.5 py-0.5">
                        Popular
                      </Badge>
                    )}
                  </div>
                  {addon.description && (
                    <p className="mt-0.5 text-body-md text-on-surface-variant">
                      {addon.description}
                    </p>
                  )}
                  <p className="mt-1 text-label-lg font-label-lg text-primary">
                    {formatCurrency(addon.pricePaise)}
                  </p>
                </div>

                {/* Quantity selector */}
                <QuantitySelector
                  value={qty}
                  max={addon.maxQuantity}
                  onChange={(val) => toggleAddOn(addon.id, val)}
                />
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Snacks section */}
      <div className="flex flex-col gap-3">
        <h3 className="text-title-lg font-title-lg text-on-surface">
          Snacks & Meals
        </h3>

        <Tabs value={snackTab} onValueChange={setSnackTab}>
          <TabList>
            <Tab value="veg">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-sm border-2 border-success" />
                Veg ({vegSnacks.length})
              </span>
            </Tab>
            <Tab value="nonveg">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-sm border-2 border-error" />
                Non-Veg ({nonVegSnacks.length})
              </span>
            </Tab>
          </TabList>

          <TabPanel value="veg">
            <div className="flex flex-col gap-2.5">
              {vegSnacks.map((snack) => (
                <SnackItem
                  key={snack.id}
                  snack={snack}
                  quantity={selectedSnacks[snack.id] ?? 0}
                  onQuantityChange={(val) => toggleSnack(snack.id, val)}
                />
              ))}
            </div>
          </TabPanel>

          <TabPanel value="nonveg">
            <div className="flex flex-col gap-2.5">
              {nonVegSnacks.map((snack) => (
                <SnackItem
                  key={snack.id}
                  snack={snack}
                  quantity={selectedSnacks[snack.id] ?? 0}
                  onQuantityChange={(val) => toggleSnack(snack.id, val)}
                />
              ))}
            </div>
          </TabPanel>
        </Tabs>
      </div>

      {/* Bottom bar */}
      <BookingBottomBar
        step={4}
        totalSteps={6}
        onNext={handleContinue}
        onBack={() => router.push(`/${tripId}/seats`)}
        priceSummary={
          runningTotal > 0
            ? { label: "Add-ons total", amountPaise: runningTotal }
            : undefined
        }
        leftAction={
          <Button variant="ghost" size="lg" onClick={handleContinue}>
            Skip
          </Button>
        }
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
//  Snack Item
// ---------------------------------------------------------------------------

function SnackItem({
  snack,
  quantity,
  onQuantityChange,
}: {
  snack: SnackOptionData;
  quantity: number;
  onQuantityChange: (val: number) => void;
}) {
  return (
    <Card
      variant="outlined"
      className={cn(
        "flex items-center gap-3 transition-colors",
        quantity > 0 && "border-primary bg-primary-fixed/10",
      )}
    >
      {/* Veg/Non-veg indicator + icon */}
      <div className="flex flex-col items-center gap-1">
        <span
          className={cn(
            "inline-block h-3.5 w-3.5 rounded-sm border-2",
            snack.isVeg ? "border-success" : "border-error",
          )}
        >
          <span
            className={cn(
              "block h-full w-full rounded-[1px]",
              snack.isVeg ? "bg-success" : "bg-error",
            )}
            style={{ transform: "scale(0.5)" }}
          />
        </span>
        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
          {snack.icon ?? "restaurant"}
        </span>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-title-md font-title-md text-on-surface">
          {snack.name}
        </p>
        {snack.description && (
          <p className="text-body-md text-on-surface-variant">
            {snack.description}
          </p>
        )}
        <p className="mt-0.5 text-label-lg font-label-lg text-primary">
          {formatCurrency(snack.pricePaise)}
        </p>
      </div>

      {/* Quantity */}
      <QuantitySelector
        value={quantity}
        max={10}
        onChange={onQuantityChange}
      />
    </Card>
  );
}
