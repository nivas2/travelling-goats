"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, useFieldArray, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useBookingStore } from "@/stores/booking-store";
import { Input } from "@/components/ui/input";
import { Dropdown } from "@/components/ui/dropdown";
import { RadioCard } from "@/components/ui/radio-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// ---------------------------------------------------------------------------
//  Zod Schema
// ---------------------------------------------------------------------------

const travelerSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be under 50 characters"),
  age: z
    .number()
    .int("Age must be a whole number")
    .min(5, "Minimum age is 5")
    .max(100, "Maximum age is 100"),
  gender: z.string().min(1, "Please select a gender"),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
});

const formSchema = z.object({
  travelers: z.array(travelerSchema).min(1, "At least one traveler is required"),
  specialRequests: z.string().max(500).optional(),
  pickupPoint: z.string().min(1, "Please select a pickup point"),
});

type FormValues = z.infer<typeof formSchema>;

// ---------------------------------------------------------------------------
//  Constants
// ---------------------------------------------------------------------------

const GENDER_OPTIONS = [
  { label: "Male", value: "male", icon: "male" },
  { label: "Female", value: "female", icon: "female" },
  { label: "Other", value: "other", icon: "transgender" },
];

interface PickupPointOption {
  id: string;
  name: string;
  address: string;
  icon: string;
}

const DEFAULT_PICKUP_POINTS: PickupPointOption[] = [
  {
    id: "majestic",
    name: "Majestic Bus Stand",
    address: "Kempegowda Bus Station, Bangalore",
    icon: "directions_bus",
  },
  {
    id: "silk-board",
    name: "Silk Board Junction",
    address: "Silk Board, Hosur Road, Bangalore",
    icon: "location_on",
  },
  {
    id: "electronic-city",
    name: "Electronic City",
    address: "Phase 1 Toll Gate, Bangalore",
    icon: "apartment",
  },
  {
    id: "whitefield",
    name: "Whitefield",
    address: "Forum Value Mall, Whitefield, Bangalore",
    icon: "storefront",
  },
];

// ---------------------------------------------------------------------------
//  Page Component
// ---------------------------------------------------------------------------

export default function DetailsPage() {
  const params = useParams<{ tripId: string }>();
  const router = useRouter();
  const tripId = params.tripId;

  const {
    travelerCount,
    bookingType,
    specialRequests: storedRequests,
    pickupPoint: storedPickup,
    travelers: storedTravelers,
    setTravelers,
    setSpecialRequests,
    setPickupPoint,
    setStep,
  } = useBookingStore();

  const [submitting, setSubmitting] = useState(false);

  // Build default values from store
  const defaultTravelers = useMemo(() => {
    const defaults = [];
    for (let i = 0; i < travelerCount; i++) {
      defaults.push(
        storedTravelers[i] ?? { name: "", age: 0 as number, gender: "", phone: "" },
      );
    }
    return defaults;
  }, [travelerCount, storedTravelers]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      travelers: defaultTravelers,
      specialRequests: storedRequests ?? "",
      pickupPoint: storedPickup ?? "",
    },
  });

  const { fields } = useFieldArray({ control, name: "travelers" });
  const selectedPickup = watch("pickupPoint");

  useEffect(() => {
    setStep(2);
  }, [setStep]);

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setSubmitting(true);
    try {
      // Persist into the booking store
      setTravelers(
        data.travelers.map((t) => ({
          name: t.name,
          age: Number(t.age),
          gender: t.gender,
          phone: t.phone,
        })),
      );
      setSpecialRequests(data.specialRequests || null);
      setPickupPoint(data.pickupPoint);

      router.push(`/${tripId}/seats`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-6 p-5 pb-32"
      noValidate
    >
      {/* Heading */}
      <div>
        <h2 className="text-headline-md font-headline-md text-on-surface">
          Traveler Details
        </h2>
        <p className="mt-1 text-body-md font-body-md text-on-surface-variant">
          Fill in details for {travelerCount}{" "}
          {travelerCount === 1 ? "traveler" : "travelers"}
        </p>
      </div>

      {/* Traveler forms */}
      {fields.map((field, index) => (
        <motion.div
          key={field.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.06 }}
        >
          <Card variant="outlined" className="flex flex-col gap-4">
            {/* Traveler header */}
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-on-primary text-label-lg font-label-lg">
                {index + 1}
              </div>
              <span className="text-title-md font-title-md text-on-surface">
                {index === 0 && bookingType !== "GROUP"
                  ? "Primary Traveler"
                  : `Traveler ${index + 1}`}
              </span>
            </div>

            {/* Name */}
            <Input
              label="Full Name"
              placeholder="As per govt. ID"
              error={errors.travelers?.[index]?.name?.message}
              {...register(`travelers.${index}.name`)}
            />

            {/* Age & Gender row */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Age"
                type="number"
                placeholder="e.g. 24"
                inputMode="numeric"
                error={errors.travelers?.[index]?.age?.message}
                {...register(`travelers.${index}.age`)}
              />
              <Dropdown
                label="Gender"
                placeholder="Select"
                options={GENDER_OPTIONS}
                value={watch(`travelers.${index}.gender`)}
                onChange={(v) => setValue(`travelers.${index}.gender`, v, { shouldValidate: true })}
                error={errors.travelers?.[index]?.gender?.message}
              />
            </div>

            {/* Phone */}
            <Input
              label="Phone Number"
              type="tel"
              placeholder="10-digit mobile"
              countryCode="+91"
              inputMode="numeric"
              maxLength={10}
              error={errors.travelers?.[index]?.phone?.message}
              {...register(`travelers.${index}.phone`)}
            />
          </Card>
        </motion.div>
      ))}

      {/* Special Requests */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="special-requests"
          className="text-label-lg font-semibold text-on-surface"
        >
          Special Requests{" "}
          <span className="text-on-surface-variant font-normal">(optional)</span>
        </label>
        <textarea
          id="special-requests"
          rows={3}
          placeholder="Dietary restrictions, medical conditions, accessibility needs..."
          className={cn(
            "w-full rounded-xl bg-surface-container-low text-on-surface",
            "border border-outline-variant p-4 text-body-lg",
            "placeholder:text-on-surface-variant/50",
            "transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
            "resize-none",
          )}
          {...register("specialRequests")}
        />
        {errors.specialRequests && (
          <p className="text-label-sm text-error">{errors.specialRequests.message}</p>
        )}
      </div>

      {/* Pickup Point */}
      <div className="flex flex-col gap-3">
        <div>
          <h3 className="text-title-lg font-title-lg text-on-surface">
            Pickup Point
          </h3>
          <p className="mt-0.5 text-body-md font-body-md text-on-surface-variant">
            Select your boarding location
          </p>
        </div>

        <div
          className="flex flex-col gap-2.5"
          role="radiogroup"
          aria-label="Pickup point"
        >
          {DEFAULT_PICKUP_POINTS.map((pp) => (
            <RadioCard
              key={pp.id}
              selected={selectedPickup === pp.id}
              icon={pp.icon}
              title={pp.name}
              description={pp.address}
              onChange={() =>
                setValue("pickupPoint", pp.id, { shouldValidate: true })
              }
            />
          ))}
        </div>
        {errors.pickupPoint && (
          <p className="text-label-sm text-error">{errors.pickupPoint.message}</p>
        )}
      </div>

      {/* Sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 border-t border-outline-variant/10 bg-surface/95 backdrop-blur-md p-4 pb-safe">
        <Button fullWidth size="lg" type="submit" loading={submitting}>
          Continue
        </Button>
      </div>
    </form>
  );
}
