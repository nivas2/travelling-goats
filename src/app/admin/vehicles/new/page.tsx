"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dropdown } from "@/components/ui/dropdown";
import { Switch } from "@/components/ui/switch";
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

const PRESET_LAYOUTS: Record<string, { rows: number; cols: number; label: string }> = {
  "2x2_bus": { rows: 12, cols: 4, label: "2x2 Bus (Standard)" },
  "2x1_traveller": { rows: 4, cols: 3, label: "2x1 Traveller" },
  "2x3_minibus": { rows: 10, cols: 5, label: "2x3 Mini Bus" },
  "1x2_suv": { rows: 3, cols: 3, label: "1x2 SUV" },
  "2x1_sleeper": { rows: 10, cols: 3, label: "2x1 Sleeper" },
};

function generateEmptyGrid(rows: number, cols: number): GridCellType[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => "EMPTY" as GridCellType)
  );
}

function generatePresetGrid(
  preset: string,
  rows: number,
  cols: number
): { grid: GridCellType[][]; seats: SeatData[] } {
  const grid = generateEmptyGrid(rows, cols);
  const seats: SeatData[] = [];

  // For 2x2 bus: columns 0,1 are left pair, 2 is aisle, 3,4... are right pair
  if (preset === "2x2_bus" && cols === 4) {
    // Driver at top-right
    grid[0][3] = "DRIVER";
    grid[0][0] = "EMPTY";
    grid[0][1] = "EMPTY";
    grid[0][2] = "EMPTY";

    let seatOrder = 0;
    for (let r = 1; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // columns 0,1 = left pair, 2,3 = right pair
        grid[r][c] = "SEAT";
        const seatNumber = `${r}${String.fromCharCode(65 + c)}`;
        const category = c === 0 || c === 3 ? "WINDOW" : "AISLE";
        seats.push({
          seatNumber,
          row: r,
          col: c,
          deck: "SINGLE",
          seatType: "REGULAR",
          category,
          priceDeltaPaise: 0,
          genderRestriction: "NONE",
          status: "AVAILABLE",
          isAccessible: false,
          isPremium: false,
          order: seatOrder++,
        });
      }
    }
  } else if (preset === "2x1_sleeper" && cols === 3) {
    // Sleeper: col 0 = left berth, col 1 = aisle, col 2 = right berth
    // Row 0: driver top-right
    grid[0][0] = "EMPTY";
    grid[0][1] = "EMPTY";
    grid[0][2] = "DRIVER";

    let seatOrder = 0;
    for (let r = 1; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (c === 1) {
          grid[r][c] = "AISLE";
        } else {
          grid[r][c] = "SEAT";
          const seatNumber = `${r}${String.fromCharCode(65 + c)}`;
          seats.push({
            seatNumber,
            row: r,
            col: c,
            deck: "SINGLE",
            seatType: "SLEEPER",
            category: c === 0 ? "WINDOW" : "WINDOW",
            priceDeltaPaise: 0,
            genderRestriction: "NONE",
            status: "AVAILABLE",
            isAccessible: false,
            isPremium: false,
            order: seatOrder++,
          });
        }
      }
    }
  } else {
    // Generic: fill all cells as seats
    let seatOrder = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        grid[r][c] = "SEAT";
        const seatNumber = `${r + 1}${String.fromCharCode(65 + c)}`;
        const category =
          c === 0 || c === cols - 1
            ? "WINDOW"
            : c === 1 || c === cols - 2
              ? "AISLE"
              : "MIDDLE";
        seats.push({
          seatNumber,
          row: r,
          col: c,
          deck: "SINGLE",
          seatType: "REGULAR",
          category,
          priceDeltaPaise: 0,
          genderRestriction: "NONE",
          status: "AVAILABLE",
          isAccessible: false,
          isPremium: false,
          order: seatOrder++,
        });
      }
    }
  }

  return { grid, seats };
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

export default function NewVehiclePage() {
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();

  // Vehicle types
  const [vehicleTypes, setVehicleTypes] = useState<VehicleTypeOption[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);

  // Form state
  const [vehicleTypeId, setVehicleTypeId] = useState("");
  const [name, setName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);

  // Grid state
  const [totalRows, setTotalRows] = useState(12);
  const [totalColumns, setTotalColumns] = useState(4);
  const [hasUpperDeck, setHasUpperDeck] = useState(false);
  const [upperDeckRows, setUpperDeckRows] = useState(10);
  const [upperDeckColumns, setUpperDeckColumns] = useState(4);
  const [gridLayout, setGridLayout] = useState<GridCellType[][]>(() =>
    generateEmptyGrid(12, 4)
  );
  const [upperGridLayout, setUpperGridLayout] = useState<GridCellType[][]>(() =>
    generateEmptyGrid(10, 4)
  );
  const [seats, setSeats] = useState<SeatData[]>([]);

  const [saving, setSaving] = useState(false);

  // Inline vehicle type creation
  const [showNewType, setShowNewType] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeIcon, setNewTypeIcon] = useState("");
  const [savingType, setSavingType] = useState(false);

  const handleCreateType = async () => {
    if (!newTypeName.trim()) return;
    setSavingType(true);
    try {
      const res = await fetch("/api/admin/vehicle-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTypeName.trim(),
          icon: newTypeIcon.trim() || null,
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to create vehicle type");
      }
      const json = await res.json();
      const created = json.data;
      setVehicleTypes((prev) => [...prev, { id: created.id, name: created.name, icon: created.icon }]);
      setVehicleTypeId(created.id);
      setNewTypeName("");
      setNewTypeIcon("");
      setShowNewType(false);
      toastSuccess("Vehicle type created");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to create vehicle type");
    } finally {
      setSavingType(false);
    }
  };

  useEffect(() => {
    async function fetchTypes() {
      try {
        const res = await fetch("/api/admin/vehicle-types");
        if (res.ok) {
          const json = await res.json();
          setVehicleTypes(
            (json.data ?? []).map((t: VehicleTypeOption) => ({
              id: t.id,
              name: t.name,
              icon: t.icon,
            }))
          );
        }
      } catch {
        // Non-critical
      } finally {
        setLoadingTypes(false);
      }
    }
    fetchTypes();
  }, []);

  const handleDimensionChange = (rows: number, cols: number, isUpper = false) => {
    if (isUpper) {
      setUpperDeckRows(rows);
      setUpperDeckColumns(cols);
      setUpperGridLayout(generateEmptyGrid(rows, cols));
      // Remove upper deck seats
      setSeats((prev) => prev.filter((s) => s.deck !== "UPPER"));
    } else {
      setTotalRows(rows);
      setTotalColumns(cols);
      setGridLayout(generateEmptyGrid(rows, cols));
      // Remove lower/single deck seats
      setSeats((prev) => prev.filter((s) => s.deck === "UPPER"));
    }
  };

  const handleApplyPreset = (presetKey: string) => {
    const preset = PRESET_LAYOUTS[presetKey];
    if (!preset) return;

    setTotalRows(preset.rows);
    setTotalColumns(preset.cols);

    const { grid, seats: presetSeats } = generatePresetGrid(
      presetKey,
      preset.rows,
      preset.cols
    );
    setGridLayout(grid);
    setSeats((prev) => [
      ...prev.filter((s) => s.deck === "UPPER"),
      ...presetSeats,
    ]);
  };

  const toggleAmenity = (amenity: string) => {
    setAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    );
  };

  const handleSubmit = async () => {
    if (!vehicleTypeId) {
      toastError("Please select a vehicle type");
      return;
    }
    if (!name.trim()) {
      toastError("Please enter a vehicle name");
      return;
    }

    const seatCount = seats.length;
    if (seatCount === 0) {
      toastError("Please add at least one seat to the layout");
      return;
    }

    setSaving(true);
    try {
      const body = {
        vehicleTypeId,
        name: name.trim(),
        registrationNumber: registrationNumber.trim() || undefined,
        totalRows,
        totalColumns,
        hasUpperDeck,
        upperDeckRows: hasUpperDeck ? upperDeckRows : undefined,
        upperDeckColumns: hasUpperDeck ? upperDeckColumns : undefined,
        amenities,
        gridLayout,
        upperGridLayout: hasUpperDeck ? upperGridLayout : undefined,
        seats,
      };

      const res = await fetch("/api/admin/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to create vehicle template");
      }

      toastSuccess("Vehicle template created successfully");
      router.push("/admin/vehicles");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to create vehicle template");
    } finally {
      setSaving(false);
    }
  };

  const vehicleTypeOptions = vehicleTypes.map((t) => ({
    label: t.name,
    value: t.id,
    icon: t.icon ?? undefined,
  }));

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-md font-headline-md text-on-surface">
            Create Vehicle Template
          </h1>
          <p className="text-body-md text-on-surface-variant mt-1">
            Define the seat layout and properties for a new vehicle
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

      {/* Basic Info */}
      <FormSection title="Basic Information">
        <div>
          <Dropdown
            label="Vehicle Type"
            placeholder="Select type..."
            options={vehicleTypeOptions}
            value={vehicleTypeId}
            onChange={setVehicleTypeId}
          />
          {!showNewType ? (
            <button
              type="button"
              onClick={() => setShowNewType(true)}
              className="mt-2 flex items-center gap-1 text-label-md font-label-md text-primary hover:underline"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              Add New Type
            </button>
          ) : (
            <div className="mt-3 flex items-end gap-2 rounded-lg border border-outline-variant/30 bg-surface-container-lowest p-3">
              <Input
                label="Type Name"
                placeholder="e.g. Luxury Bus"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                className="flex-1"
              />
              <Input
                label="Icon (optional)"
                placeholder="e.g. directions_bus"
                value={newTypeIcon}
                onChange={(e) => setNewTypeIcon(e.target.value)}
                className="flex-1"
              />
              <Button
                size="sm"
                onClick={handleCreateType}
                loading={savingType}
                disabled={!newTypeName.trim()}
              >
                Save
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setShowNewType(false); setNewTypeName(""); setNewTypeIcon(""); }}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
        <Input
          label="Vehicle Name"
          placeholder="e.g. Volvo 9600 AC Sleeper"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          label="Registration Number (optional)"
          placeholder="e.g. KA01AB1234"
          value={registrationNumber}
          onChange={(e) => setRegistrationNumber(e.target.value)}
        />
      </FormSection>

      {/* Amenities */}
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

      {/* Seat Layout */}
      <FormSection title="Seat Layout">
        {/* Dimension controls */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Rows"
            type="number"
            value={String(totalRows)}
            onChange={(e) => handleDimensionChange(Number(e.target.value) || 1, totalColumns)}
          />
          <Input
            label="Columns"
            type="number"
            value={String(totalColumns)}
            onChange={(e) => handleDimensionChange(totalRows, Number(e.target.value) || 1)}
          />
        </div>

        {/* Preset buttons */}
        <div>
          <p className="text-label-lg font-label-lg text-on-surface mb-2">
            Quick Presets
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(PRESET_LAYOUTS).map(([key, preset]) => (
              <Button
                key={key}
                variant="secondary"
                size="sm"
                onClick={() => handleApplyPreset(key)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Grid builder */}
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

        {/* Upper deck toggle */}
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

        {/* Upper deck layout */}
        {hasUpperDeck && (
          <div className="border-t border-outline-variant/10 pt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Upper Deck Rows"
                type="number"
                value={String(upperDeckRows)}
                onChange={(e) =>
                  handleDimensionChange(Number(e.target.value) || 1, upperDeckColumns, true)
                }
              />
              <Input
                label="Upper Deck Columns"
                type="number"
                value={String(upperDeckColumns)}
                onChange={(e) =>
                  handleDimensionChange(upperDeckRows, Number(e.target.value) || 1, true)
                }
              />
            </div>
            <p className="text-label-lg font-label-lg text-on-surface">
              Upper Deck
            </p>
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

      {/* Summary */}
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
          Create Vehicle
        </Button>
      </Card>
    </div>
  );
}
