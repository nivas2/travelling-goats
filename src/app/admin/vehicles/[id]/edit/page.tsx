"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dropdown } from "@/components/ui/dropdown";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { SeatLayoutBuilder, type SeatData } from "@/components/admin/seat-layout-builder";

type GridCellType = "SEAT" | "AISLE" | "EMPTY" | "DRIVER" | "DOOR" | "STAIRS";

interface VehicleTypeOption {
  id: string;
  name: string;
  icon: string | null;
}

const AMENITY_OPTIONS = [
  "GPS Tracking",
  "AC",
  "Charging Ports",
  "Entertainment System",
  "Emergency Kit",
  "Fire Extinguisher",
  "WiFi",
  "Blankets",
  "Water Bottles",
  "Reading Lights",
];

const STATUS_OPTIONS = [
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
  { label: "Maintenance", value: "MAINTENANCE" },
];

function generateEmptyGrid(rows: number, cols: number): GridCellType[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => "EMPTY" as GridCellType)
  );
}

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card variant="elevated" className="p-6">
      <h2 className="text-title-md font-title-md text-on-surface mb-5">{title}</h2>
      <div className="space-y-4">{children}</div>
    </Card>
  );
}

export default function EditVehiclePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();
  const templateId = params.id;

  const [vehicleTypes, setVehicleTypes] = useState<VehicleTypeOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [vehicleTypeId, setVehicleTypeId] = useState("");
  const [name, setName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [totalRows, setTotalRows] = useState(12);
  const [totalColumns, setTotalColumns] = useState(4);
  const [hasUpperDeck, setHasUpperDeck] = useState(false);
  const [upperDeckRows, setUpperDeckRows] = useState(10);
  const [upperDeckColumns, setUpperDeckColumns] = useState(4);
  const [gridLayout, setGridLayout] = useState<GridCellType[][]>([]);
  const [upperGridLayout, setUpperGridLayout] = useState<GridCellType[][]>([]);
  const [seats, setSeats] = useState<SeatData[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [templateRes, typesRes] = await Promise.all([
          fetch(`/api/admin/vehicles/${templateId}`),
          fetch("/api/admin/vehicle-types"),
        ]);

        if (!templateRes.ok) throw new Error("Failed to load template");

        const templateJson = await templateRes.json();
        const template = templateJson.data;

        setVehicleTypeId(template.vehicleTypeId);
        setName(template.name);
        setRegistrationNumber(template.registrationNumber ?? "");
        setStatus(template.status);
        setAmenities(template.amenities ?? []);
        setTotalRows(template.totalRows);
        setTotalColumns(template.totalColumns);
        setHasUpperDeck(template.hasUpperDeck);
        setUpperDeckRows(template.upperDeckRows ?? 10);
        setUpperDeckColumns(template.upperDeckColumns ?? 4);
        setGridLayout(template.gridLayout as GridCellType[][]);
        setUpperGridLayout(
          (template.upperGridLayout as GridCellType[][] | null) ??
            generateEmptyGrid(template.upperDeckRows ?? 10, template.upperDeckColumns ?? 4)
        );

        // Map seats from API
        setSeats(
          (template.seats ?? []).map(
            (s: {
              seatNumber: string;
              row: number;
              col: number;
              deck: string;
              seatType: string;
              category: string;
              priceDeltaPaise: number;
              genderRestriction: string;
              status: string;
              isAccessible: boolean;
              isPremium: boolean;
              order: number;
            }) => ({
              seatNumber: s.seatNumber,
              row: s.row,
              col: s.col,
              deck: s.deck as "SINGLE" | "LOWER" | "UPPER",
              seatType: s.seatType,
              category: s.category,
              priceDeltaPaise: s.priceDeltaPaise,
              genderRestriction: s.genderRestriction,
              status: s.status,
              isAccessible: s.isAccessible,
              isPremium: s.isPremium,
              order: s.order,
            })
          )
        );

        if (typesRes.ok) {
          const typesJson = await typesRes.json();
          setVehicleTypes(
            (typesJson.data ?? []).map((t: VehicleTypeOption) => ({
              id: t.id,
              name: t.name,
              icon: t.icon,
            }))
          );
        }
      } catch {
        toastError("Failed to load vehicle template");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [templateId, toastError]);

  const toggleAmenity = (amenity: string) => {
    setAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    );
  };

  const handleSubmit = async () => {
    if (!vehicleTypeId || !name.trim()) {
      toastError("Vehicle type and name are required");
      return;
    }
    if (seats.length === 0) {
      toastError("Please add at least one seat");
      return;
    }

    setSaving(true);
    try {
      const body = {
        vehicleTypeId,
        name: name.trim(),
        registrationNumber: registrationNumber.trim() || null,
        status,
        totalRows,
        totalColumns,
        hasUpperDeck,
        upperDeckRows: hasUpperDeck ? upperDeckRows : null,
        upperDeckColumns: hasUpperDeck ? upperDeckColumns : null,
        amenities,
        gridLayout,
        upperGridLayout: hasUpperDeck ? upperGridLayout : null,
        seats,
      };

      const res = await fetch(`/api/admin/vehicles/${templateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to update");
      }

      toastSuccess("Vehicle template updated successfully");
      router.push("/admin/vehicles");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4 max-w-4xl">
        <Skeleton height={48} />
        <Skeleton height={200} />
        <Skeleton height={400} />
      </div>
    );
  }

  const vehicleTypeOptions = vehicleTypes.map((t) => ({
    label: t.name,
    value: t.id,
    icon: t.icon ?? undefined,
  }));

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-md font-headline-md text-on-surface">
            Edit Vehicle Template
          </h1>
          <p className="text-body-md text-on-surface-variant mt-1">
            Modify seat layout and properties
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/admin/vehicles")}
        >
          Cancel
        </Button>
      </div>

      <FormSection title="Basic Information">
        <Dropdown
          label="Vehicle Type"
          options={vehicleTypeOptions}
          value={vehicleTypeId}
          onChange={setVehicleTypeId}
        />
        <Input
          label="Vehicle Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Registration Number"
            value={registrationNumber}
            onChange={(e) => setRegistrationNumber(e.target.value)}
          />
          <Dropdown
            label="Status"
            options={STATUS_OPTIONS}
            value={status}
            onChange={setStatus}
          />
        </div>
      </FormSection>

      <FormSection title="Amenities">
        <div className="flex flex-wrap gap-2">
          {AMENITY_OPTIONS.map((amenity) => (
            <button
              key={amenity}
              type="button"
              onClick={() => toggleAmenity(amenity)}
              className={cn(
                "rounded-full px-3 py-1.5 text-label-md font-label-md border transition-colors",
                amenities.includes(amenity)
                  ? "bg-primary text-on-primary border-primary"
                  : "bg-surface-container text-on-surface-variant border-outline-variant hover:border-primary"
              )}
            >
              {amenity}
            </button>
          ))}
        </div>
      </FormSection>

      <FormSection title="Seat Layout">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Rows"
            type="number"
            value={String(totalRows)}
            onChange={(e) => {
              const r = Number(e.target.value) || 1;
              setTotalRows(r);
              setGridLayout(generateEmptyGrid(r, totalColumns));
              setSeats((prev) => prev.filter((s) => s.deck === "UPPER"));
            }}
          />
          <Input
            label="Columns"
            type="number"
            value={String(totalColumns)}
            onChange={(e) => {
              const c = Number(e.target.value) || 1;
              setTotalColumns(c);
              setGridLayout(generateEmptyGrid(totalRows, c));
              setSeats((prev) => prev.filter((s) => s.deck === "UPPER"));
            }}
          />
        </div>

        <div>
          <p className="text-label-lg font-label-lg text-on-surface mb-2">
            {hasUpperDeck ? "Lower Deck" : "Layout"}
          </p>
          <SeatLayoutBuilder
            rows={totalRows}
            cols={totalColumns}
            gridLayout={gridLayout}
            seats={seats}
            deck={hasUpperDeck ? "LOWER" : "SINGLE"}
            onGridChange={setGridLayout}
            onSeatsChange={setSeats}
          />
        </div>

        <div className="flex items-center justify-between border-t border-outline-variant/10 pt-4">
          <div>
            <p className="text-title-md font-title-md text-on-surface">
              Has Upper Deck
            </p>
            <p className="text-body-sm text-on-surface-variant">
              For sleeper buses with two decks
            </p>
          </div>
          <Switch checked={hasUpperDeck} onChange={setHasUpperDeck} />
        </div>

        {hasUpperDeck && (
          <div className="border-t border-outline-variant/10 pt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Upper Deck Rows"
                type="number"
                value={String(upperDeckRows)}
                onChange={(e) => {
                  const r = Number(e.target.value) || 1;
                  setUpperDeckRows(r);
                  setUpperGridLayout(generateEmptyGrid(r, upperDeckColumns));
                  setSeats((prev) => prev.filter((s) => s.deck !== "UPPER"));
                }}
              />
              <Input
                label="Upper Deck Columns"
                type="number"
                value={String(upperDeckColumns)}
                onChange={(e) => {
                  const c = Number(e.target.value) || 1;
                  setUpperDeckColumns(c);
                  setUpperGridLayout(generateEmptyGrid(upperDeckRows, c));
                  setSeats((prev) => prev.filter((s) => s.deck !== "UPPER"));
                }}
              />
            </div>
            <p className="text-label-lg font-label-lg text-on-surface">Upper Deck</p>
            <SeatLayoutBuilder
              rows={upperDeckRows}
              cols={upperDeckColumns}
              gridLayout={upperGridLayout}
              seats={seats}
              deck="UPPER"
              onGridChange={setUpperGridLayout}
              onSeatsChange={setSeats}
            />
          </div>
        )}
      </FormSection>

      <Card variant="outlined" className="p-4 flex items-center justify-between">
        <div>
          <p className="text-title-md font-title-md text-on-surface">
            Total Seats: {seats.length}
          </p>
          <p className="text-body-sm text-on-surface-variant">
            {seats.filter((s) => s.deck !== "UPPER").length} lower
            {hasUpperDeck && ` + ${seats.filter((s) => s.deck === "UPPER").length} upper`}
          </p>
        </div>
        <Button size="lg" onClick={handleSubmit} loading={saving}>
          Update Vehicle
        </Button>
      </Card>
    </div>
  );
}
