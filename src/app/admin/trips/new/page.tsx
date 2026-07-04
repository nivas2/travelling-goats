"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn, slugify, formatCurrency, paiseToRupees, rupeesToPaise } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dropdown } from "@/components/ui/dropdown";
import { Switch } from "@/components/ui/switch";

/* ---------- Types ---------- */

interface Activity {
  time: string;
  title: string;
  description: string;
}

interface ItineraryDay {
  dayNumber: number;
  title: string;
  description: string;
  activities: Activity[];
  meals: string[];
  accommodation: string;
}

interface AddOn {
  name: string;
  description: string;
  price: number; // rupees for form, convert to paise on submit
  icon: string;
  maxQuantity: number;
}

interface SnackItem {
  name: string;
  price: number;
  category: string;
  icon: string;
}

interface FaqItem {
  question: string;
  answer: string;
}

/* ---------- Constants ---------- */

const categoryOptions = [
  { label: "Adventure", value: "ADVENTURE" },
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

const cancellationOptions = [
  { label: "Flexible", value: "FLEXIBLE" },
  { label: "Moderate", value: "MODERATE" },
  { label: "Strict", value: "STRICT" },
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

export default function CreateTripPage() {
  const router = useRouter();
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
  const [meetingPoint, setMeetingPoint] = useState("");
  const [meetingTime, setMeetingTime] = useState("");

  // Media
  const [coverImage, setCoverImage] = useState("");
  const [additionalImages, setAdditionalImages] = useState("");

  // Pricing (rupees for form display)
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

  // Settings
  const [isFeatured, setIsFeatured] = useState(false);
  const [isTrending, setIsTrending] = useState(false);
  const [cancellationPolicy, setCancellationPolicy] = useState("MODERATE");

  // Itinerary
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);

  // Add-ons
  const [addOns, setAddOns] = useState<AddOn[]>([]);

  // Snack options
  const [snacks, setSnacks] = useState<SnackItem[]>([]);

  // FAQs
  const [faqs, setFaqs] = useState<FaqItem[]>([]);

  // Calculate duration
  const duration =
    startDate && endDate
      ? Math.ceil(
          (new Date(endDate).getTime() - new Date(startDate).getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1
      : 0;

  // Fetch vehicle templates on mount
  useEffect(() => {
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
  }, []);

  const handleTitleChange = useCallback((val: string) => {
    setTitle(val);
    setSlug(slugify(val));
  }, []);

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

  /* ---------- Add-ons Helpers ---------- */

  function addAddOn() {
    setAddOns((prev) => [
      ...prev,
      { name: "", description: "", price: 0, icon: "add_circle", maxQuantity: 1 },
    ]);
  }

  function updateAddOn(index: number, field: string, value: unknown) {
    setAddOns((prev) =>
      prev.map((a, i) => (i === index ? { ...a, [field]: value } : a))
    );
  }

  function removeAddOn(index: number) {
    setAddOns((prev) => prev.filter((_, i) => i !== index));
  }

  /* ---------- Snacks Helpers ---------- */

  function addSnack() {
    setSnacks((prev) => [
      ...prev,
      { name: "", price: 0, category: "veg", icon: "restaurant" },
    ]);
  }

  function updateSnack(index: number, field: string, value: unknown) {
    setSnacks((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  }

  function removeSnack(index: number) {
    setSnacks((prev) => prev.filter((_, i) => i !== index));
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
      meetingPoint,
      meetingTime,
      coverImage,
      images: additionalImages
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
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
      tags: tags
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      isFeatured,
      isTrending,
      cancellationPolicy,
      vehicleTemplateId: vehicleTemplateId || undefined,
      status,
      itineraryDays: itinerary.map((day) => ({
        dayNumber: day.dayNumber,
        title: day.title,
        description: day.description,
        activities: day.activities,
        meals: day.meals,
        accommodation: day.accommodation,
      })),
      addOns: addOns.map((a) => ({
        name: a.name,
        description: a.description,
        pricePaise: rupeesToPaise(a.price),
        icon: a.icon,
        maxQuantity: a.maxQuantity,
      })),
      snackOptions: snacks.map((s) => ({
        name: s.name,
        pricePaise: rupeesToPaise(s.price),
        category: s.category,
        icon: s.icon,
        isVeg: s.category === "veg",
      })),
      faqs: faqs.map((f, i) => ({
        question: f.question,
        answer: f.answer,
        order: i,
      })),
    };
  }

  async function handleSubmit(status: string) {
    const setLoading = status === "DRAFT" ? setSaving : setPublishLoading;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(status)),
      });
      const json = await res.json();
      if (json.success) {
        router.push("/admin/trips");
      } else {
        alert(json.error ?? "Failed to save trip");
      }
    } catch (err) {
      console.error("Failed to save trip", err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-headline-md font-headline-md text-on-surface">Create Trip</h1>
          <p className="text-body-md text-on-surface-variant">
            Fill in the details to create a new trip
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="sm"
            loading={saving}
            onClick={() => handleSubmit("DRAFT")}
          >
            Save as Draft
          </Button>
          <Button
            size="sm"
            loading={publishLoading}
            onClick={() => handleSubmit("PUBLISHED")}
          >
            Publish
          </Button>
        </div>
      </div>

      {/* Basic Info */}
      <FormSection title="Basic Info">
        <Input
          label="Title"
          placeholder="e.g. Manali Winter Wonderland"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          fullWidth
        />
        <Input
          label="Slug"
          placeholder="auto-generated-slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          fullWidth
          helperText="URL-friendly identifier, auto-generated from title"
        />
        <div>
          <label className="text-label-lg font-semibold text-on-surface mb-1.5 block">
            Description
          </label>
          <textarea
            className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary min-h-[120px] resize-y"
            placeholder="Full trip description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <Input
          label="Short Description"
          placeholder="Brief summary for cards"
          value={shortDescription}
          onChange={(e) => setShortDescription(e.target.value)}
          fullWidth
        />
      </FormSection>

      {/* Location */}
      <FormSection title="Location">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Destination"
            placeholder="e.g. Manali, Himachal Pradesh"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            fullWidth
          />
          <Input
            label="Origin"
            placeholder="e.g. Bengaluru"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            fullWidth
          />
          <Input
            label="Meeting Point"
            placeholder="e.g. Majestic Bus Stand"
            value={meetingPoint}
            onChange={(e) => setMeetingPoint(e.target.value)}
            fullWidth
          />
          <Input
            label="Meeting Time"
            placeholder="e.g. 6:00 AM"
            value={meetingTime}
            onChange={(e) => setMeetingTime(e.target.value)}
            fullWidth
          />
        </div>
      </FormSection>

      {/* Media */}
      <FormSection title="Media">
        <Input
          label="Cover Image URL"
          placeholder="https://example.com/image.jpg"
          value={coverImage}
          onChange={(e) => setCoverImage(e.target.value)}
          fullWidth
        />
        <div>
          <label className="text-label-lg font-semibold text-on-surface mb-1.5 block">
            Additional Image URLs
          </label>
          <textarea
            className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary min-h-[80px] resize-y"
            placeholder="One URL per line"
            value={additionalImages}
            onChange={(e) => setAdditionalImages(e.target.value)}
          />
        </div>
        {coverImage && (
          <div className="h-40 w-60 overflow-hidden rounded-xl bg-surface-container-low">
            <img
              src={coverImage}
              alt="Cover preview"
              className="h-full w-full object-cover"
            />
          </div>
        )}
      </FormSection>

      {/* Pricing */}
      <FormSection title="Pricing">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            label="Base Price (₹)"
            type="number"
            placeholder="4999"
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value)}
            fullWidth
          />
          <Input
            label="Couple Price (₹)"
            type="number"
            placeholder="Optional"
            value={couplePrice}
            onChange={(e) => setCouplePrice(e.target.value)}
            fullWidth
          />
          <Input
            label="Group Price (₹)"
            type="number"
            placeholder="Optional"
            value={groupPrice}
            onChange={(e) => setGroupPrice(e.target.value)}
            fullWidth
          />
          <Input
            label="Platform Fee (₹)"
            type="number"
            placeholder="99"
            value={platformFee}
            onChange={(e) => setPlatformFee(e.target.value)}
            fullWidth
          />
        </div>
      </FormSection>

      {/* Schedule */}
      <FormSection title="Schedule">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            fullWidth
          />
          <Input
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            fullWidth
          />
          <div>
            <label className="text-label-lg font-semibold text-on-surface mb-1.5 block">
              Duration
            </label>
            <div className="flex h-12 items-center rounded-xl border border-outline-variant bg-surface-container-low px-4 text-on-surface-variant">
              {duration > 0 ? `${duration} day${duration > 1 ? "s" : ""}` : "Auto-calculated"}
            </div>
          </div>
        </div>
      </FormSection>

      {/* Capacity */}
      <FormSection title="Capacity">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Max Group Size"
            type="number"
            value={maxGroupSize}
            onChange={(e) => setMaxGroupSize(e.target.value)}
            fullWidth
          />
          <Input
            label="Min Group Size"
            type="number"
            value={minGroupSize}
            onChange={(e) => setMinGroupSize(e.target.value)}
            fullWidth
          />
        </div>
      </FormSection>

      {/* Vehicle Assignment */}
      <FormSection title="Vehicle Assignment">
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
          <Dropdown
            label="Category"
            options={categoryOptions}
            value={category}
            onChange={setCategory}
          />
          <Dropdown
            label="Difficulty"
            options={difficultyOptions}
            value={difficulty}
            onChange={setDifficulty}
          />
        </div>
        <Input
          label="Tags"
          placeholder="Comma separated, e.g. snow, trekking, camping"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          fullWidth
        />
      </FormSection>

      {/* Settings */}
      <FormSection title="Settings">
        <div className="flex flex-wrap gap-6">
          <Switch
            label="Featured"
            checked={isFeatured}
            onChange={setIsFeatured}
          />
          <Switch
            label="Trending"
            checked={isTrending}
            onChange={setIsTrending}
          />
        </div>
        <Dropdown
          label="Cancellation Policy"
          options={cancellationOptions}
          value={cancellationPolicy}
          onChange={setCancellationPolicy}
        />
      </FormSection>

      {/* Itinerary Builder */}
      <FormSection title="Itinerary Builder">
        {itinerary.map((day, dayIdx) => (
          <Card key={dayIdx} variant="outlined" className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-on-surface">
                Day {day.dayNumber}
              </h3>
              <button
                onClick={() => removeItineraryDay(dayIdx)}
                className="text-error hover:text-error/80 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">
                  delete
                </span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label="Day Title"
                placeholder="e.g. Arrival & Exploration"
                value={day.title}
                onChange={(e) =>
                  updateItineraryDay(dayIdx, "title", e.target.value)
                }
                fullWidth
              />
              <Input
                label="Accommodation"
                placeholder="e.g. Mountain View Resort"
                value={day.accommodation}
                onChange={(e) =>
                  updateItineraryDay(dayIdx, "accommodation", e.target.value)
                }
                fullWidth
              />
            </div>

            <div>
              <label className="text-label-lg font-semibold text-on-surface mb-1.5 block">
                Description
              </label>
              <textarea
                className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary min-h-[60px] resize-y text-body-md"
                placeholder="Day description..."
                value={day.description}
                onChange={(e) =>
                  updateItineraryDay(dayIdx, "description", e.target.value)
                }
              />
            </div>

            {/* Meals */}
            <div>
              <label className="text-label-lg font-semibold text-on-surface mb-2 block">
                Meals Included
              </label>
              <div className="flex flex-wrap gap-2">
                {mealOptions.map((meal) => (
                  <button
                    key={meal}
                    type="button"
                    onClick={() => toggleMeal(dayIdx, meal.toLowerCase())}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-label-sm font-label-sm border transition-colors",
                      day.meals.includes(meal.toLowerCase())
                        ? "bg-primary text-white border-primary"
                        : "bg-transparent text-on-surface-variant border-outline-variant hover:border-primary"
                    )}
                  >
                    {meal}
                  </button>
                ))}
              </div>
            </div>

            {/* Activities */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-label-lg font-semibold text-on-surface">
                  Activities
                </label>
                <button
                  type="button"
                  onClick={() => addActivity(dayIdx)}
                  className="text-body-md text-primary font-label-lg hover:underline"
                >
                  + Add Activity
                </button>
              </div>
              {day.activities.map((act, actIdx) => (
                <div
                  key={actIdx}
                  className="flex items-start gap-2 mb-2 p-3 rounded-lg bg-surface-container"
                >
                  <Input
                    placeholder="Time"
                    value={act.time}
                    onChange={(e) =>
                      updateActivity(dayIdx, actIdx, "time", e.target.value)
                    }
                    inputSize="sm"
                    className="w-24"
                  />
                  <Input
                    placeholder="Activity title"
                    value={act.title}
                    onChange={(e) =>
                      updateActivity(dayIdx, actIdx, "title", e.target.value)
                    }
                    inputSize="sm"
                    className="flex-1"
                  />
                  <Input
                    placeholder="Description"
                    value={act.description}
                    onChange={(e) =>
                      updateActivity(
                        dayIdx,
                        actIdx,
                        "description",
                        e.target.value
                      )
                    }
                    inputSize="sm"
                    className="flex-1"
                  />
                  <button
                    onClick={() => removeActivity(dayIdx, actIdx)}
                    className="mt-1 text-error/70 hover:text-error transition-colors shrink-0"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      close
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </Card>
        ))}

        <Button
          variant="secondary"
          size="sm"
          onClick={addItineraryDay}
          icon={
            <span className="material-symbols-outlined text-[18px]">add</span>
          }
        >
          Add Day
        </Button>
      </FormSection>

      {/* Add-ons */}
      <FormSection title="Add-ons">
        {addOns.map((addon, idx) => (
          <div
            key={idx}
            className="flex items-start gap-3 p-3 rounded-lg bg-surface-container"
          >
            <Input
              placeholder="Name"
              value={addon.name}
              onChange={(e) => updateAddOn(idx, "name", e.target.value)}
              inputSize="sm"
              className="flex-1"
            />
            <Input
              placeholder="Description"
              value={addon.description}
              onChange={(e) => updateAddOn(idx, "description", e.target.value)}
              inputSize="sm"
              className="flex-1"
            />
            <Input
              placeholder="Price (₹)"
              type="number"
              value={addon.price || ""}
              onChange={(e) => updateAddOn(idx, "price", Number(e.target.value))}
              inputSize="sm"
              className="w-28"
            />
            <Input
              placeholder="Icon"
              value={addon.icon}
              onChange={(e) => updateAddOn(idx, "icon", e.target.value)}
              inputSize="sm"
              className="w-28"
            />
            <Input
              placeholder="Max Qty"
              type="number"
              value={addon.maxQuantity || ""}
              onChange={(e) =>
                updateAddOn(idx, "maxQuantity", Number(e.target.value))
              }
              inputSize="sm"
              className="w-20"
            />
            <button
              onClick={() => removeAddOn(idx)}
              className="mt-1 text-error/70 hover:text-error transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">
                close
              </span>
            </button>
          </div>
        ))}
        <Button
          variant="secondary"
          size="sm"
          onClick={addAddOn}
          icon={
            <span className="material-symbols-outlined text-[18px]">add</span>
          }
        >
          Add Add-on
        </Button>
      </FormSection>

      {/* Snack Options */}
      <FormSection title="Snack Options">
        {snacks.map((snack, idx) => (
          <div
            key={idx}
            className="flex items-start gap-3 p-3 rounded-lg bg-surface-container"
          >
            <Input
              placeholder="Name"
              value={snack.name}
              onChange={(e) => updateSnack(idx, "name", e.target.value)}
              inputSize="sm"
              className="flex-1"
            />
            <Input
              placeholder="Price (₹)"
              type="number"
              value={snack.price || ""}
              onChange={(e) => updateSnack(idx, "price", Number(e.target.value))}
              inputSize="sm"
              className="w-28"
            />
            <div className="w-32">
              <Dropdown
                options={[
                  { label: "Veg", value: "veg" },
                  { label: "Non-Veg", value: "non-veg" },
                ]}
                value={snack.category}
                onChange={(v) => updateSnack(idx, "category", v)}
              />
            </div>
            <Input
              placeholder="Icon"
              value={snack.icon}
              onChange={(e) => updateSnack(idx, "icon", e.target.value)}
              inputSize="sm"
              className="w-28"
            />
            <button
              onClick={() => removeSnack(idx)}
              className="mt-1 text-error/70 hover:text-error transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">
                close
              </span>
            </button>
          </div>
        ))}
        <Button
          variant="secondary"
          size="sm"
          onClick={addSnack}
          icon={
            <span className="material-symbols-outlined text-[18px]">add</span>
          }
        >
          Add Snack Option
        </Button>
      </FormSection>

      {/* FAQs */}
      <FormSection title="FAQs">
        {faqs.map((faq, idx) => (
          <div
            key={idx}
            className="p-3 rounded-lg bg-surface-container space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-label-sm font-label-lg text-on-surface-variant">
                FAQ #{idx + 1}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => moveFaq(idx, "up")}
                  disabled={idx === 0}
                  className="h-7 w-7 flex items-center justify-center rounded hover:bg-surface-container-high disabled:opacity-30 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    arrow_upward
                  </span>
                </button>
                <button
                  onClick={() => moveFaq(idx, "down")}
                  disabled={idx === faqs.length - 1}
                  className="h-7 w-7 flex items-center justify-center rounded hover:bg-surface-container-high disabled:opacity-30 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    arrow_downward
                  </span>
                </button>
                <button
                  onClick={() => removeFaq(idx)}
                  className="h-7 w-7 flex items-center justify-center rounded text-error/70 hover:text-error hover:bg-red-50 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    delete
                  </span>
                </button>
              </div>
            </div>
            <Input
              placeholder="Question"
              value={faq.question}
              onChange={(e) => updateFaq(idx, "question", e.target.value)}
              inputSize="sm"
              fullWidth
            />
            <textarea
              className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2.5 text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary min-h-[60px] resize-y"
              placeholder="Answer"
              value={faq.answer}
              onChange={(e) => updateFaq(idx, "answer", e.target.value)}
            />
          </div>
        ))}
        <Button
          variant="secondary"
          size="sm"
          onClick={addFaq}
          icon={
            <span className="material-symbols-outlined text-[18px]">add</span>
          }
        >
          Add FAQ
        </Button>
      </FormSection>

      {/* Bottom Actions */}
      <div className="flex justify-end gap-3 pb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/admin/trips")}
        >
          Cancel
        </Button>
        <Button
          variant="secondary"
          size="sm"
          loading={saving}
          onClick={() => handleSubmit("DRAFT")}
        >
          Save as Draft
        </Button>
        <Button
          size="sm"
          loading={publishLoading}
          onClick={() => handleSubmit("PUBLISHED")}
        >
          Publish
        </Button>
      </div>
    </div>
  );
}
