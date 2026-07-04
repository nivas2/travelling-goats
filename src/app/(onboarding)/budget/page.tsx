"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { RadioCard } from "@/components/ui/radio-card";
import { cn } from "@/lib/utils";

interface BudgetOption {
  id: string;
  title: string;
  description: string;
  icon: string;
  price: string;
}

const budgetOptions: BudgetOption[] = [
  {
    id: "BUDGET",
    title: "Budget",
    description: "Great trips without breaking the bank",
    icon: "savings",
    price: "\u20B93K - 5K",
  },
  {
    id: "MID_RANGE",
    title: "Mid-Range",
    description: "Comfortable stays and curated experiences",
    icon: "account_balance_wallet",
    price: "\u20B95K - 10K",
  },
  {
    id: "PREMIUM",
    title: "Premium",
    description: "Handpicked luxury stays and exclusive activities",
    icon: "diamond",
    price: "\u20B910K - 20K",
  },
  {
    id: "LUXURY",
    title: "Luxury",
    description: "The finest experiences, no compromises",
    icon: "workspace_premium",
    price: "\u20B920K+",
  },
];

export default function BudgetPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleContinue() {
    if (!selected) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ budgetPreference: selected }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Failed to save preference.");
        return;
      }

      router.push("/pickup-city");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <div className="px-6 pt-safe">
        <div className="flex items-center justify-between pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-1 text-body-md text-on-surface-variant transition-colors hover:text-on-surface"
          >
            <Icon name="arrow_back" size={20} />
          </button>

          <span className="text-label-sm text-on-surface-variant">
            Step 2 of 4
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col px-6 pt-6">
        <div className="mb-6">
          <h1 className="text-headline-md font-headline-md text-on-surface">
            Your travel budget
          </h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Choose the range that fits your style. You can always change this later.
          </p>
        </div>

        {/* Budget RadioCards */}
        <div className="flex flex-col gap-3" role="radiogroup" aria-label="Budget preference">
          {budgetOptions.map((option) => (
            <RadioCard
              key={option.id}
              selected={selected === option.id}
              title={option.title}
              description={option.description}
              icon={option.icon}
              price={option.price}
              onChange={() => {
                setSelected(option.id);
                if (error) setError("");
              }}
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <p
            className="mt-4 text-center text-label-sm text-error"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>

      {/* Bottom action */}
      <div className="px-6 pb-8 pb-safe pt-4">
        <Button
          type="button"
          fullWidth
          size="lg"
          loading={loading}
          disabled={!selected}
          onClick={handleContinue}
          className="rounded-full"
        >
          Keep Trekking
        </Button>
      </div>
    </div>
  );
}
