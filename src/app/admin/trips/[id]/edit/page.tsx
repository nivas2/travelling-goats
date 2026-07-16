"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { cn, slugify, rupeesToPaise, paiseToRupees, formatCurrency, formatSaveError } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "@/components/ui/image-upload";
import { MultiImageUpload } from "@/components/ui/multi-image-upload";
import { Dropdown } from "@/components/ui/dropdown";
import { Switch } from "@/components/ui/switch";

/* ---------- Types ---------- */

interface Activity {
  time: string;
  title: string;
  description: string;
}

interface ItineraryDay {
  id?: string;
  dayNumber: number;
  title: string;
  description: string;
  activities: Activity[];
  meals: string[];
  accommodation: string;
}

interface GlobalAddOnItem {
  id: string;
  name: string;
  pricePaise: number;
  isActive: boolean;
}

interface GlobalSnackItem {
  id: string;
  name: string;
  pricePaise: number;
  isVeg: boolean;
  isActive: boolean;
}

interface FaqItem {
  id?: string;
  question: string;
  answer: string;
}

/* ---------- Constants ---------- */

const categoryOptions = [
  { label: "Adventure", value: "ADVENTURE" },
  { label: "Trek", value: "TREK" },
  { label: "Camping", value: "CAMPFIRE" },
  { label: "Cultural", value: "CULTURAL" },
  { label: "Beach", value: "BEACH" },
  { label: "Mountain", value: "MOUNTAIN" },
  { label: "Wildlife", value: "WILDLIFE" },
  { label: "City", value: "CITY" },
  { label: "Road Trip", value: "ROAD_TRIP" },
  { label: "Spiritual", value: "SPIRITUAL" },
  { label: "Food", value: "FOOD" },
  { label: "Photography", value: "PHOTOGRAPHY" },
  { label: "Weekend", value: "WEEKEND" },
  { label: "International", value: "INTERNATIONAL" },
];

const difficultyOptions = [
  { label: "Easy", value: "EASY" },
  { label: "Moderate", value: "MODERATE" },
  { label: "Challenging", value: "CHALLENGING" },
  { label: "Extreme", value: "EXTREME" },
];


const mealOptions = ["Breakfast", "Lunch", "Dinner", "Snacks"];

/* ---------- Section Wrapper ---------- */

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

/* ---------- Page ---------- */

export default function EditTripPage() {
  const router = useRouter();
  const params = useParams();
  const tripId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);

  // Basic Info
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");

  // Location
  const [destination, setDestination] = useState("");
  const [origin, setOrigin] = useState("Bengaluru");

  // Media
  const [coverImage, setCoverImage] = useState("");
  const [galleryImages, setGalleryImages] = useState<string[]>([]);

  // Pricing (rupees for display)
  const [basePrice, setBasePrice] = useState("");
  const [couplePrice, setCouplePrice] = useState("");
  const [groupPrice, setGroupPrice] = useState("");
  const [platformFee, setPlatformFee] = useState("99");

  // Schedule
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Capacity
  const [maxGroupSize, setMaxGroupSize] = useState("20");
  const [minGroupSize, setMinGroupSize] = useState("4");

  // Category & Tags
  const [category, setCategory] = useState("ADVENTURE");
  const [difficulty, setDifficulty] = useState("MODERATE");
  const [tags, setTags] = useState("");

  // Vehicle assignment
  const [vehicleTemplateId, setVehicleTemplateId] = useState("");
  const [vehicleTemplates, setVehicleTemplates] = useState<Array<{ id: string; name: string; totalSeats: number; vehicleType: { name: string } }>>([]);

  // Trip captain (shepherd) assignment
  const [captainId, setCaptainId] = useState("");
  const [captains, setCaptains] = useState<Array<{ id: string; name: string | null; role: string }>>([]);

  // Settings
  const [isFeatured, setIsFeatured] = useState(false);
  const [isTrending, setIsTrending] = useState(false);
  const [currentStatus, setCurrentStatus] = useState("DRAFT");

  // Itinerary
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);

  // Global catalog
  const [globalAddOns, setGlobalAddOns] = useState<GlobalAddOnItem[]>([]);
  const [globalSnacks, setGlobalSnacks] = useState<GlobalSnackItem[]>([]);
  const [selectedAddOns, setSelectedAddOns] = useState<Map<string, number | null>>(new Map());
  const [selectedSnacks, setSelectedSnacks] = useState<Map<string, number | null>>(new Map());

  // Pickup points
  interface PickupPointItem {
    id: string;
    name: string;
    city?: { id: string; name: string };
  }
  const [globalPickupPoints, setGlobalPickupPoints] = useState<PickupPointItem[]>([]);
  const [selectedPickupPoints, setSelectedPickupPoints] = useState<Map<string, string | null>>(new Map());

  // FAQs
  const [faqs, setFaqs] = useState<FaqItem[]>([]);

  const duration =
    startDate && endDate
      ? Math.ceil(
          (new Date(endDate).getTime() - new Date(startDate).getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1
      : 0;

  /* ---------- Load Trip Data ---------- */

  useEffect(() => {
    async function loadTrip() {
      try {
        const res = await fetch(`/api/admin/trips/${tripId}`);
        const json = await res.json();
        if (!json.success) return;
        const t = json.data;

        setTitle(t.title);
        setSlug(t.slug);
        setDescription(t.description);
        setShortDescription(t.shortDescription ?? "");
        setDestination(t.destination);
        setOrigin(t.origin);
        setCoverImage(t.coverImage);
        setGalleryImages(t.images ?? []);
        setBasePrice(String(paiseToRupees(t.basePricePaise)));
        setCouplePrice(t.couplePricePaise ? String(paiseToRupees(t.couplePricePaise)) : "");
        setGroupPrice(t.groupPricePaise ? String(paiseToRupees(t.groupPricePaise)) : "");
        setPlatformFee(String(paiseToRupees(t.platformFeePaise)));
        setStartDate(t.startDate?.slice(0, 10) ?? "");
        setEndDate(t.endDate?.slice(0, 10) ?? "");
        setMaxGroupSize(String(t.maxGroupSize));
        setMinGroupSize(String(t.minGroupSize));
        setCategory(t.category);
        setDifficulty(t.difficulty);
        setTags((t.tags ?? []).join(", "));
        setIsFeatured(t.isFeatured);
        setIsTrending(t.isTrending);
        setCurrentStatus(t.status);
        setVehicleTemplateId(t.vehicleTemplateId ?? "");
        setCaptainId(t.tripCaptainId ?? "");

        // Itinerary
        setItinerary(
          (t.itineraryDays ?? []).map((d: any) => ({
            id: d.id,
            dayNumber: d.dayNumber,
            title: d.title,
            description: d.description ?? "",
            activities: Array.isArray(d.activities) ? d.activities : [],
            meals: d.meals ?? [],
            accommodation: d.accommodation ?? "",
          }))
        );

        // Add-on selections
        const addOnMap = new Map<string, number | null>();
        for (const sel of (t.addOnSelections ?? [])) {
          addOnMap.set(sel.globalAddOnId ?? sel.globalAddOn?.id, sel.priceOverridePaise ?? null);
        }
        setSelectedAddOns(addOnMap);

        // Snack selections
        const snackMap = new Map<string, number | null>();
        for (const sel of (t.snackSelections ?? [])) {
          snackMap.set(sel.globalSnackId ?? sel.globalSnack?.id, sel.priceOverridePaise ?? null);
        }
        setSelectedSnacks(snackMap);

        // Pickup point selections (with times)
        const ppMap = new Map<string, string | null>();
        for (const sel of (t.pickupPointSelections ?? [])) {
          ppMap.set(sel.pickupPointId ?? sel.pickupPoint?.id, sel.pickupTime ?? null);
        }
        setSelectedPickupPoints(ppMap);

        // FAQs
        setFaqs(
          (t.faqs ?? []).map((f: any) => ({
            id: f.id,
            question: f.question,
            answer: f.answer,
          }))
        );
      } catch (err) {
        console.error("Failed to load trip", err);
      } finally {
        setLoading(false);
      }
    }
    loadTrip();

    // Fetch vehicle templates
    async function fetchVehicles() {
      try {
        const res = await fetch("/api/admin/vehicles?status=ACTIVE");
        if (res.ok) {
          const json = await res.json();
          setVehicleTemplates(json.data?.templates ?? []);
        }
      } catch {
        // Non-critical
      }
    }
    fetchVehicles();

    // Fetch trip-captain candidates (captains + admins).
    async function fetchCaptains() {
      try {
        const res = await fetch("/api/admin/users");
        if (res.ok) {
          const json = await res.json();
          const list = (json.data ?? []).filter(
            (u: { role: string }) => u.role === "TRIP_CAPTAIN" || u.role === "ADMIN"
          );
          setCaptains(list);
        }
      } catch {
        // Non-critical
      }
    }
    fetchCaptains();

    async function fetchCatalog() {
      try {
        const res = await fetch("/api/admin/addons");
        if (res.ok) {
          const json = await res.json();
          setGlobalAddOns(json.data?.addOns ?? []);
          setGlobalSnacks(json.data?.snacks ?? []);
        }
      } catch {
        // Non-critical
      }
    }
    fetchCatalog();

    async function fetchPickupPoints() {
      try {
        const res = await fetch("/api/admin/pickup-points");
        if (res.ok) {
          const json = await res.json();
          setGlobalPickupPoints(json.data?.points ?? []);
        }
      } catch {
        // Non-critical
      }
    }
    fetchPickupPoints();
  }, [tripId]);

  /* ---------- Itinerary Helpers ---------- */

  function addItineraryDay() {
    setItinerary((prev) => [
      ...prev,
      {
        dayNumber: prev.length + 1,
        title: "",
        description: "",
        activities: [],
        meals: [],
        accommodation: "",
      },
    ]);
  }

  function updateItineraryDay(index: number, field: string, value: unknown) {
    setItinerary((prev) =>
      prev.map((day, i) => (i === index ? { ...day, [field]: value } : day))
    );
  }

  function removeItineraryDay(index: number) {
    setItinerary((prev) =>
      prev.filter((_, i) => i !== index).map((day, i) => ({ ...day, dayNumber: i + 1 }))
    );
  }

  function addActivity(dayIndex: number) {
    setItinerary((prev) =>
      prev.map((day, i) =>
        i === dayIndex
          ? { ...day, activities: [...day.activities, { time: "", title: "", description: "" }] }
          : day
      )
    );
  }

  function updateActivity(dayIndex: number, actIndex: number, field: string, value: string) {
    setItinerary((prev) =>
      prev.map((day, i) =>
        i === dayIndex
          ? {
              ...day,
              activities: day.activities.map((act, j) =>
                j === actIndex ? { ...act, [field]: value } : act
              ),
            }
          : day
      )
    );
  }

  function removeActivity(dayIndex: number, actIndex: number) {
    setItinerary((prev) =>
      prev.map((day, i) =>
        i === dayIndex
          ? { ...day, activities: day.activities.filter((_, j) => j !== actIndex) }
          : day
      )
    );
  }

  function toggleMeal(dayIndex: number, meal: string) {
    setItinerary((prev) =>
      prev.map((day, i) =>
        i === dayIndex
          ? {
              ...day,
              meals: day.meals.includes(meal)
                ? day.meals.filter((m) => m !== meal)
                : [...day.meals, meal],
            }
          : day
      )
    );
  }

  /* ---------- Add-on / Snack Selection Helpers ---------- */

  function toggleAddOnSelection(id: string) {
    setSelectedAddOns((prev) => {
      const next = new Map(prev);
      if (next.has(id)) next.delete(id);
      else next.set(id, null);
      return next;
    });
  }

  function setAddOnOverride(id: string, paise: number | null) {
    setSelectedAddOns((prev) => {
      const next = new Map(prev);
      next.set(id, paise);
      return next;
    });
  }

  function toggleSnackSelection(id: string) {
    setSelectedSnacks((prev) => {
      const next = new Map(prev);
      if (next.has(id)) next.delete(id);
      else next.set(id, null);
      return next;
    });
  }

  function setSnackOverride(id: string, paise: number | null) {
    setSelectedSnacks((prev) => {
      const next = new Map(prev);
      next.set(id, paise);
      return next;
    });
  }

  /* ---------- Pickup Point Selection Helpers ---------- */

  function togglePickupPointSelection(id: string) {
    setSelectedPickupPoints((prev) => {
      const next = new Map(prev);
      if (next.has(id)) next.delete(id);
      else next.set(id, null);
      return next;
    });
  }

  function setPickupPointTime(id: string, time: string) {
    setSelectedPickupPoints((prev) => {
      const next = new Map(prev);
      next.set(id, time || null);
      return next;
    });
  }

  /* ---------- FAQ Helpers ---------- */

  function addFaq() {
    setFaqs((prev) => [...prev, { question: "", answer: "" }]);
  }

  function updateFaq(index: number, field: string, value: string) {
    setFaqs((prev) =>
      prev.map((f, i) => (i === index ? { ...f, [field]: value } : f))
    );
  }

  function removeFaq(index: number) {
    setFaqs((prev) => prev.filter((_, i) => i !== index));
  }

  function moveFaq(index: number, direction: "up" | "down") {
    setFaqs((prev) => {
      const copy = [...prev];
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= copy.length) return copy;
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  }

  /* ---------- Submit ---------- */

  function buildPayload(status: string) {
    return {
      title,
      slug,
      description,
      shortDescription,
      destination,
      origin,
      coverImage,
      images: galleryImages,
      basePricePaise: rupeesToPaise(Number(basePrice) || 0),
      couplePricePaise: couplePrice ? rupeesToPaise(Number(couplePrice)) : null,
      groupPricePaise: groupPrice ? rupeesToPaise(Number(groupPrice)) : null,
      platformFeePaise: rupeesToPaise(Number(platformFee) || 99),
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      duration,
      maxGroupSize: Number(maxGroupSize),
      minGroupSize: Number(minGroupSize),
      category,
      difficulty,
      tags: tags.split(",").map((s) => s.trim()).filter(Boolean),
      isFeatured,
      isTrending,
      vehicleTemplateId: vehicleTemplateId || null,
      tripCaptainId: captainId || null,
      status,
      itineraryDays: itinerary.map((day) => ({
        dayNumber: day.dayNumber,
        title: day.title,
        description: day.description,
        activities: day.activities,
        meals: day.meals,
        accommodation: day.accommodation,
      })),
      addOnSelections: Array.from(selectedAddOns.entries()).map(([globalAddOnId, override]) => ({
        globalAddOnId,
        priceOverridePaise: override,
      })),
      snackSelections: Array.from(selectedSnacks.entries()).map(([globalSnackId, override]) => ({
        globalSnackId,
        priceOverridePaise: override,
      })),
      faqs: faqs.map((f, i) => ({
        question: f.question,
        answer: f.answer,
        order: i,
      })),
      pickupPointSelections: Array.from(selectedPickupPoints.entries()).map(([pickupPointId, pickupTime]) => ({
        pickupPointId,
        pickupTime,
      })),
    };
  }

  async function handleSubmit(status: string) {
    const setLoadingFn = status === "DRAFT" ? setSaving : setPublishLoading;
    setLoadingFn(true);
    try {
      const res = await fetch(`/api/admin/trips/${tripId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(status)),
      });
      const json = await res.json();
      if (json.success) {
        router.push("/admin/trips");
      } else {
        alert(formatSaveError(json));
      }
    } catch (err) {
      console.error("Failed to update trip", err);
      alert("Something went wrong. Check that dates and prices are filled in.");
    } finally {
      setLoadingFn(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <h1 className="text-headline-md font-headline-md text-on-surface">Edit Trip</h1>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card
              key={i}
              variant="elevated"
              className="h-40 animate-pulse bg-surface-container-low"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-headline-md font-headline-md text-on-surface">Edit Trip</h1>
          <p className="text-body-md text-on-surface-variant">
            Update trip details and publish changes
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="sm"
            loading={saving}
            onClick={() => handleSubmit(currentStatus === "PUBLISHED" ? "PUBLISHED" : "DRAFT")}
          >
            Save Changes
          </Button>
          <Button
            size="sm"
            loading={publishLoading}
            onClick={() =>
              handleSubmit(currentStatus === "PUBLISHED" ? "DRAFT" : "PUBLISHED")
            }
          >
            {currentStatus === "PUBLISHED" ? "Unpublish" : "Publish"}
          </Button>
        </div>
      </div>

      {/* Basic Info */}
      <FormSection title="Basic Info">
        <Input
          label="Title"
          required
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setSlug(slugify(e.target.value));
          }}
          fullWidth
        />
        <Input label="Slug" required value={slug} onChange={(e) => setSlug(e.target.value)} fullWidth />
        <div>
          <label className="text-label-lg font-semibold text-on-surface mb-1.5 block">
            Description <span className="text-error">*</span>
          </label>
          <textarea
            className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary min-h-[120px] resize-y"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <Input
          label="Short Description"
          value={shortDescription}
          onChange={(e) => setShortDescription(e.target.value)}
          fullWidth
        />
      </FormSection>

      {/* Location */}
      <FormSection title="Location">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Destination" required value={destination} onChange={(e) => setDestination(e.target.value)} fullWidth />
          <Input label="Origin" value={origin} onChange={(e) => setOrigin(e.target.value)} fullWidth />
        </div>
      </FormSection>

      {/* Media */}
      <FormSection title="Media">
        <ImageUpload label="Cover Image" required value={coverImage} onChange={setCoverImage} recommend="Trip cover ~1200×800px (landscape), JPG" minWidth={800} minHeight={500} aspect="3/2" />
        <Input
          label="…or paste an image URL"
          value={coverImage}
          onChange={(e) => setCoverImage(e.target.value)}
          placeholder="https://…"
          fullWidth
        />
        <MultiImageUpload
          label="Gallery Photos"
          value={galleryImages}
          onChange={setGalleryImages}
          max={6}
          recommend="Landscape ~1200×800px — these show in the card's hover gallery"
        />
      </FormSection>

      {/* Pricing */}
      <FormSection title="Pricing">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Input label="Base Price (₹)" required type="number" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} fullWidth />
          <Input label="Couple Price (₹)" type="number" value={couplePrice} onChange={(e) => setCouplePrice(e.target.value)} fullWidth />
          <Input label="Group Price (₹)" type="number" value={groupPrice} onChange={(e) => setGroupPrice(e.target.value)} fullWidth />
          <Input label="Platform Fee (₹)" type="number" value={platformFee} onChange={(e) => setPlatformFee(e.target.value)} fullWidth />
        </div>
      </FormSection>

      {/* Schedule */}
      <FormSection title="Schedule">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input label="Start Date" required type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} fullWidth />
          <Input label="End Date" required type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} fullWidth />
          <div>
            <label className="text-label-lg font-semibold text-on-surface mb-1.5 block">Duration</label>
            <div className="flex h-12 items-center rounded-xl border border-outline-variant bg-surface-container-low px-4 text-on-surface-variant">
              {duration > 0 ? `${duration} day${duration > 1 ? "s" : ""}` : "Auto-calculated"}
            </div>
          </div>
        </div>
      </FormSection>

      {/* Capacity */}
      <FormSection title="Capacity">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Max Group Size" type="number" value={maxGroupSize} onChange={(e) => setMaxGroupSize(e.target.value)} fullWidth />
          <Input label="Min Group Size" type="number" value={minGroupSize} onChange={(e) => setMinGroupSize(e.target.value)} fullWidth />
        </div>
      </FormSection>

      {/* Captain & Vehicle */}
      <FormSection title="Captain & Vehicle">
        <Dropdown
          label="Trip Captain / Trip Captain"
          placeholder="No captain assigned"
          options={[
            { label: "No captain", value: "" },
            ...captains.map((c) => ({
              label: `${c.name ?? "Unnamed"}${c.role === "ADMIN" ? " (Admin)" : ""}`,
              value: c.id,
            })),
          ]}
          value={captainId}
          onChange={setCaptainId}
        />
        <Dropdown
          label="Assign Vehicle (optional)"
          placeholder="No vehicle assigned"
          options={[
            { label: "No vehicle", value: "" },
            ...vehicleTemplates.map((v) => ({
              label: `${v.name} (${v.vehicleType.name} - ${v.totalSeats} seats)`,
              value: v.id,
            })),
          ]}
          value={vehicleTemplateId}
          onChange={setVehicleTemplateId}
        />
        <p className="text-body-sm text-on-surface-variant">
          Assigning a vehicle enables dynamic seat selection in the booking flow.
        </p>
      </FormSection>

      {/* Category & Tags */}
      <FormSection title="Category & Tags">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Dropdown label="Category" required options={categoryOptions} value={category} onChange={setCategory} />
          <Dropdown label="Difficulty" options={difficultyOptions} value={difficulty} onChange={setDifficulty} />
        </div>
        <Input label="Tags" value={tags} onChange={(e) => setTags(e.target.value)} fullWidth />
      </FormSection>

      {/* Settings */}
      <FormSection title="Settings">
        <div className="flex flex-wrap gap-6">
          <Switch label="Featured" checked={isFeatured} onChange={setIsFeatured} />
          <Switch label="Trending" checked={isTrending} onChange={setIsTrending} />
        </div>
      </FormSection>

      {/* Itinerary Builder */}
      <FormSection title="Itinerary Builder">
        {itinerary.map((day, dayIdx) => (
          <Card key={dayIdx} variant="outlined" className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-on-surface">Day {day.dayNumber}</h3>
              <button onClick={() => removeItineraryDay(dayIdx)} className="text-error hover:text-error/80">
                <span className="material-symbols-outlined text-[20px]">delete</span>
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input label="Day Title" value={day.title} onChange={(e) => updateItineraryDay(dayIdx, "title", e.target.value)} fullWidth />
              <Input label="Accommodation" value={day.accommodation} onChange={(e) => updateItineraryDay(dayIdx, "accommodation", e.target.value)} fullWidth />
            </div>
            <div>
              <label className="text-label-lg font-semibold text-on-surface mb-1.5 block">Description</label>
              <textarea className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary min-h-[60px] resize-y text-body-md" value={day.description} onChange={(e) => updateItineraryDay(dayIdx, "description", e.target.value)} />
            </div>
            <div>
              <label className="text-label-lg font-semibold text-on-surface mb-2 block">Meals Included</label>
              <div className="flex flex-wrap gap-2">
                {mealOptions.map((meal) => (
                  <button key={meal} type="button" onClick={() => toggleMeal(dayIdx, meal.toLowerCase())} className={cn("rounded-full px-3 py-1.5 text-label-sm font-label-sm border transition-colors", day.meals.includes(meal.toLowerCase()) ? "bg-primary text-on-primary border-primary" : "bg-transparent text-on-surface-variant border-outline-variant hover:border-primary")}>
                    {meal}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-label-lg font-semibold text-on-surface">Activities</label>
                <button type="button" onClick={() => addActivity(dayIdx)} className="text-body-md text-primary font-label-lg hover:underline">+ Add Activity</button>
              </div>
              {day.activities.map((act, actIdx) => (
                <div key={actIdx} className="flex items-start gap-2 mb-2 p-3 rounded-lg bg-surface-container">
                  <Input placeholder="Time" value={act.time} onChange={(e) => updateActivity(dayIdx, actIdx, "time", e.target.value)} inputSize="sm" className="w-24" />
                  <Input placeholder="Title" value={act.title} onChange={(e) => updateActivity(dayIdx, actIdx, "title", e.target.value)} inputSize="sm" className="flex-1" />
                  <Input placeholder="Description" value={act.description} onChange={(e) => updateActivity(dayIdx, actIdx, "description", e.target.value)} inputSize="sm" className="flex-1" />
                  <button onClick={() => removeActivity(dayIdx, actIdx)} className="mt-1 text-error/70 hover:text-error shrink-0">
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
              ))}
            </div>
          </Card>
        ))}
        <Button variant="secondary" size="sm" onClick={addItineraryDay} icon={<span className="material-symbols-outlined text-[18px]">add</span>}>
          Add Day
        </Button>
      </FormSection>

      {/* Add-ons (from global catalog) */}
      <FormSection title="Add-ons">
        <p className="text-body-sm text-on-surface-variant mb-2">
          Select from global catalog. Manage catalog at <a href="/admin/addons" className="text-primary underline">Add-ons & Snacks</a>.
        </p>
        {globalAddOns.filter((a) => a.isActive).map((addon) => {
          const selected = selectedAddOns.has(addon.id);
          const override = selectedAddOns.get(addon.id);
          return (
            <div key={addon.id} className="flex items-center gap-3 p-3 rounded-lg bg-surface-container">
              <input
                type="checkbox"
                checked={selected}
                onChange={() => toggleAddOnSelection(addon.id)}
                className="h-4 w-4 accent-primary shrink-0"
              />
              <span className="flex-1 text-body-md text-on-surface">{addon.name}</span>
              <span className="text-body-sm text-on-surface-variant">{formatCurrency(addon.pricePaise)}</span>
              {selected && (
                <Input
                  placeholder="Override (₹)"
                  type="number"
                  value={override != null ? paiseToRupees(override) : ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setAddOnOverride(addon.id, v ? rupeesToPaise(Number(v)) : null);
                  }}
                  inputSize="sm"
                  className="w-32"
                />
              )}
            </div>
          );
        })}
        {globalAddOns.filter((a) => a.isActive).length === 0 && (
          <p className="text-body-sm text-on-surface-variant">No add-ons in catalog yet. Create them in <a href="/admin/addons" className="text-primary underline">Add-ons & Snacks</a>.</p>
        )}
      </FormSection>

      {/* Snack Options (from global catalog) */}
      <FormSection title="Snack Options">
        <p className="text-body-sm text-on-surface-variant mb-2">
          Select from global catalog. Manage catalog at <a href="/admin/addons" className="text-primary underline">Add-ons & Snacks</a>.
        </p>
        {globalSnacks.filter((s) => s.isActive).map((snack) => {
          const selected = selectedSnacks.has(snack.id);
          const override = selectedSnacks.get(snack.id);
          return (
            <div key={snack.id} className="flex items-center gap-3 p-3 rounded-lg bg-surface-container">
              <input
                type="checkbox"
                checked={selected}
                onChange={() => toggleSnackSelection(snack.id)}
                className="h-4 w-4 accent-primary shrink-0"
              />
              <span className="flex-1 text-body-md text-on-surface">
                {snack.name}
                <span className={cn("ml-1.5 inline-block h-2.5 w-2.5 rounded-sm border", snack.isVeg ? "border-success bg-success/20" : "border-error bg-error/20")} />
              </span>
              <span className="text-body-sm text-on-surface-variant">{formatCurrency(snack.pricePaise)}</span>
              {selected && (
                <Input
                  placeholder="Override (₹)"
                  type="number"
                  value={override != null ? paiseToRupees(override) : ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSnackOverride(snack.id, v ? rupeesToPaise(Number(v)) : null);
                  }}
                  inputSize="sm"
                  className="w-32"
                />
              )}
            </div>
          );
        })}
        {globalSnacks.filter((s) => s.isActive).length === 0 && (
          <p className="text-body-sm text-on-surface-variant">No snacks in catalog yet. Create them in <a href="/admin/addons" className="text-primary underline">Add-ons & Snacks</a>.</p>
        )}
      </FormSection>

      {/* Pickup Points */}
      <FormSection title="Pickup Points">
        <p className="text-body-sm text-on-surface-variant mb-2">
          Select pickup points for this trip. Manage catalog at <a href="/admin/pickup-points" className="text-primary underline">Pickup Points</a>.
        </p>
        {(() => {
          const activePoints = globalPickupPoints.filter((p) => (p as PickupPointItem & { isActive?: boolean }).isActive !== false);
          const grouped = new Map<string, PickupPointItem[]>();
          for (const point of activePoints) {
            const cityName = point.city?.name ?? "Unknown";
            if (!grouped.has(cityName)) grouped.set(cityName, []);
            grouped.get(cityName)!.push(point);
          }
          if (grouped.size === 0) {
            return <p className="text-body-sm text-on-surface-variant">No pickup points in catalog yet. Create them in <a href="/admin/pickup-points" className="text-primary underline">Pickup Points</a>.</p>;
          }
          return Array.from(grouped.entries()).map(([cityName, pts]) => (
            <div key={cityName} className="space-y-2">
              <h4 className="text-label-lg font-semibold text-on-surface-variant">{cityName}</h4>
              {pts.map((point) => {
                const selected = selectedPickupPoints.has(point.id);
                return (
                  <div key={point.id} className="flex items-center gap-3 p-3 rounded-lg bg-surface-container">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => togglePickupPointSelection(point.id)}
                      className="h-4 w-4 accent-primary shrink-0"
                    />
                    <span className="flex-1 text-body-md text-on-surface">{point.name}</span>
                    {selected && (
                      <Input
                        placeholder="e.g. 6:00 AM"
                        value={selectedPickupPoints.get(point.id) ?? ""}
                        onChange={(e) => setPickupPointTime(point.id, e.target.value)}
                        inputSize="sm"
                        className="w-32"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ));
        })()}
      </FormSection>

      {/* FAQs */}
      <FormSection title="FAQs">
        {faqs.map((faq, idx) => (
          <div key={idx} className="p-3 rounded-lg bg-surface-container space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-label-sm font-label-lg text-on-surface-variant">FAQ #{idx + 1}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => moveFaq(idx, "up")} disabled={idx === 0} className="h-7 w-7 flex items-center justify-center rounded hover:bg-surface-container-high disabled:opacity-30"><span className="material-symbols-outlined text-[16px]">arrow_upward</span></button>
                <button onClick={() => moveFaq(idx, "down")} disabled={idx === faqs.length - 1} className="h-7 w-7 flex items-center justify-center rounded hover:bg-surface-container-high disabled:opacity-30"><span className="material-symbols-outlined text-[16px]">arrow_downward</span></button>
                <button onClick={() => removeFaq(idx)} className="h-7 w-7 flex items-center justify-center rounded text-error/70 hover:text-error hover:bg-error/10"><span className="material-symbols-outlined text-[16px]">delete</span></button>
              </div>
            </div>
            <Input placeholder="Question" value={faq.question} onChange={(e) => updateFaq(idx, "question", e.target.value)} inputSize="sm" fullWidth />
            <textarea className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2.5 text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary min-h-[60px] resize-y" placeholder="Answer" value={faq.answer} onChange={(e) => updateFaq(idx, "answer", e.target.value)} />
          </div>
        ))}
        <Button variant="secondary" size="sm" onClick={addFaq} icon={<span className="material-symbols-outlined text-[18px]">add</span>}>Add FAQ</Button>
      </FormSection>

      {/* Bottom Actions */}
      <div className="flex justify-end gap-3 pb-8">
        <Button variant="ghost" size="sm" onClick={() => router.push("/admin/trips")}>Cancel</Button>
        <Button variant="secondary" size="sm" loading={saving} onClick={() => handleSubmit(currentStatus === "PUBLISHED" ? "PUBLISHED" : "DRAFT")}>Save Changes</Button>
        <Button size="sm" loading={publishLoading} onClick={() => handleSubmit(currentStatus === "PUBLISHED" ? "DRAFT" : "PUBLISHED")}>
          {currentStatus === "PUBLISHED" ? "Unpublish" : "Publish"}
        </Button>
      </div>
    </div>
  );
}
