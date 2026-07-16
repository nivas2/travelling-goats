"use client";

import { Icon } from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import type { ServedCity } from "@/lib/use-starting-city";

/** Selectable list of the cities we currently depart from. */
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
    <div className="space-y-2">
      {cities.map((c) => {
        const active = selectedCity === c.name;
        const trips = c.tripCount ?? 0;
        const pickups = c.pickupPoints?.length ?? 0;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onChoose(c.name)}
            aria-pressed={active}
            className={cn(
              "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors",
              active
                ? "border-primary bg-surface-container-low ring-1 ring-primary"
                : "border-outline-variant bg-surface hover:border-outline hover:bg-surface-container-low"
            )}
          >
            <span
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors",
                active ? "bg-primary text-on-primary" : "bg-lavender text-on-surface"
              )}
            >
              <Icon name="location_on" size={20} filled={active} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-body-md font-semibold text-on-surface">
                {c.name}
              </span>
              <span className="mt-0.5 block truncate text-label-sm text-on-surface-variant">
                {trips} trip{trips === 1 ? "" : "s"}
                {pickups > 0 && (
                  <> · {pickups} pickup point{pickups === 1 ? "" : "s"}</>
                )}
              </span>
            </span>
            <Icon
              name={active ? "check_circle" : "chevron_right"}
              size={active ? 22 : 20}
              filled={active}
              className={cn("shrink-0", active ? "text-primary" : "text-on-surface-variant")}
            />
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
        {/* Detected-location context */}
        {detectedCity && (
          <div className="flex items-start gap-2.5 rounded-2xl bg-surface-container-low p-3">
            <Icon
              name="my_location"
              size={18}
              className="mt-0.5 shrink-0 text-on-surface-variant"
            />
            <p className="text-body-sm text-on-surface-variant">
              You&apos;re near{" "}
              <span className="font-semibold text-on-surface">{detectedCity}</span>, which
              we don&apos;t depart from yet. We currently run trips from{" "}
              {cityNames(cities)}.
            </p>
          </div>
        )}
        {!detectedCity && (
          <p className="text-body-md text-on-surface-variant">
            We currently depart from {cityNames(cities)}. Pick where you&apos;d like to
            travel from to continue.
          </p>
        )}

        <CityChoices cities={cities} selectedCity={selectedCity} onChoose={onChoose} />
      </div>
    </Modal>
  );
}
