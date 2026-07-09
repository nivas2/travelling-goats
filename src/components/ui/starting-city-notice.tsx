"use client";

import { Icon } from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";
import type { ServedCity } from "@/lib/use-starting-city";

/** Clickable list of the cities we currently depart from. */
function CityChoices({
  cities,
  selectedCity,
  onChoose,
}: {
  cities: ServedCity[];
  selectedCity: string | null;
  onChoose: (name: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {cities.map((c) => {
        const active = selectedCity === c.name;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onChoose(c.name)}
            className={
              "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-label-md font-medium transition-colors " +
              (active
                ? "border-primary bg-primary text-on-primary"
                : "border-outline-variant bg-surface-container-low text-on-surface hover:border-primary/40")
            }
          >
            <Icon name="location_on" size={16} filled={active} />
            {c.name}
            {typeof c.tripCount === "number" && c.tripCount > 0 && (
              <span className={active ? "opacity-80" : "text-on-surface-variant"}>
                · {c.tripCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function cityNames(cities: ServedCity[]): string {
  const names = cities.map((c) => c.name);
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`;
}

/**
 * Modal prompting the user to pick a starting city we actually run trips from.
 * Used both as a hard gate on the home screen (dismissible=false) and when a
 * user from an unserved location tries to book.
 */
export function StartingCityGate({
  open,
  onClose,
  cities,
  selectedCity,
  detectedCity,
  onChoose,
  dismissible = true,
}: {
  open: boolean;
  onClose: () => void;
  cities: ServedCity[];
  selectedCity: string | null;
  detectedCity: string | null;
  onChoose: (name: string) => void;
  /** When false the modal can't be dismissed — the user must pick a city. */
  dismissible?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={dismissible ? onClose : () => {}}
      hideCloseButton={!dismissible}
      title="Choose your starting city"
      size="md"
    >
      <div className="space-y-4">
        <p className="text-body-md text-on-surface-variant">
          {detectedCity
            ? `It looks like you're in ${detectedCity}, which we don't start trips from yet. `
            : ""}
          We currently depart from {cityNames(cities)}. Select the city you&apos;d
          like to travel from to continue.
        </p>
        <CityChoices
          cities={cities}
          selectedCity={selectedCity}
          onChoose={onChoose}
        />
      </div>
    </Modal>
  );
}
