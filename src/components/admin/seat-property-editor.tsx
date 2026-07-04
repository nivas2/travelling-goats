"use client";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Dropdown } from "@/components/ui/dropdown";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export interface SeatProperties {
  seatNumber: string;
  seatType: string;
  category: string;
  priceDeltaPaise: number;
  genderRestriction: string;
  isPremium: boolean;
  isAccessible: boolean;
}

interface SeatPropertyEditorProps {
  seat: SeatProperties;
  onChange: (updated: SeatProperties) => void;
  onClose: () => void;
}

const SEAT_TYPE_OPTIONS = [
  { label: "Regular", value: "REGULAR" },
  { label: "Push Back", value: "PUSH_BACK" },
  { label: "Semi-Sleeper", value: "SEMI_SLEEPER" },
  { label: "Sleeper", value: "SLEEPER" },
  { label: "Berth", value: "BERTH" },
];

const CATEGORY_OPTIONS = [
  { label: "Window", value: "WINDOW" },
  { label: "Aisle", value: "AISLE" },
  { label: "Middle", value: "MIDDLE" },
];

const GENDER_OPTIONS = [
  { label: "None", value: "NONE" },
  { label: "Male Only", value: "MALE_ONLY" },
  { label: "Female Only", value: "FEMALE_ONLY" },
];

export function SeatPropertyEditor({ seat, onChange, onClose }: SeatPropertyEditorProps) {
  const update = (field: keyof SeatProperties, value: unknown) => {
    onChange({ ...seat, [field]: value });
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-elevated">
      <div className="flex items-center justify-between">
        <h4 className="text-title-md font-title-md text-on-surface">
          Seat Properties
        </h4>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-container"
        >
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
            close
          </span>
        </button>
      </div>

      <Input
        label="Seat Number"
        value={seat.seatNumber}
        onChange={(e) => update("seatNumber", e.target.value)}
      />

      <div className="grid grid-cols-2 gap-3">
        <Dropdown
          label="Seat Type"
          options={SEAT_TYPE_OPTIONS}
          value={seat.seatType}
          onChange={(v) => update("seatType", v)}
        />
        <Dropdown
          label="Category"
          options={CATEGORY_OPTIONS}
          value={seat.category}
          onChange={(v) => update("category", v)}
        />
      </div>

      <Input
        label="Price Delta (Rs.)"
        type="number"
        value={String(seat.priceDeltaPaise / 100)}
        onChange={(e) => update("priceDeltaPaise", Math.round(Number(e.target.value) * 100))}
      />

      <Dropdown
        label="Gender Restriction"
        options={GENDER_OPTIONS}
        value={seat.genderRestriction}
        onChange={(v) => update("genderRestriction", v)}
      />

      <div className="flex items-center justify-between">
        <span className="text-body-md text-on-surface">Premium Seat</span>
        <Switch checked={seat.isPremium} onChange={(v) => update("isPremium", v)} />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-body-md text-on-surface">Accessible</span>
        <Switch checked={seat.isAccessible} onChange={(v) => update("isAccessible", v)} />
      </div>

      <Button variant="secondary" size="sm" onClick={onClose}>
        Done
      </Button>
    </div>
  );
}
