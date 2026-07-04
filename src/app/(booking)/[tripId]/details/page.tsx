"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, useFieldArray, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import { useBookingStore } from "@/stores/booking-store";
import { Input } from "@/components/ui/input";
import { RadioCard } from "@/components/ui/radio-card";
import { BookingBottomBar } from "@/components/booking/booking-bottom-bar";

// ---------------------------------------------------------------------------
//  Zod Schema
// ---------------------------------------------------------------------------

const travelerSchema = z.object({
  name: z
    .string()
    .min(2, "Name is required")
    .max(50, "Name must be under 50 characters"),
  age: z
    .number({ error: "Required" })
    .int()
    .min(5, "Min 5")
    .max(100, "Max 100"),
  gender: z.string().min(1, "Required"),
});

const formSchema = z.object({
  travelers: z.array(travelerSchema).min(1),
  contactEmail: z
    .string()
    .email("Enter a valid email")
    .optional()
    .or(z.literal("")),
  contactPhone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit number"),
  specialRequests: z.string().max(500).optional(),
  pickupPoint: z.string().min(1, "Please select a pickup point"),
});

type FormValues = z.infer<typeof formSchema>;

// ---------------------------------------------------------------------------
//  Constants
// ---------------------------------------------------------------------------

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
    specialRequests: storedRequests,
    pickupPoint: storedPickup,
    travelers: storedTravelers,
    contactPhone: storedContactPhone,
    contactEmail: storedEmail,
    setTravelers,
    setSpecialRequests,
    setPickupPoint,
    setContactPhone,
    setContactEmail,
    setStep,
  } = useBookingStore();

  const [submitting, setSubmitting] = useState(false);

  const defaultTravelers = useMemo(() => {
    const defaults = [];
    for (let i = 0; i < travelerCount; i++) {
      defaults.push(
        storedTravelers[i]
          ? { name: storedTravelers[i].name, age: storedTravelers[i].age, gender: storedTravelers[i].gender }
          : { name: "", age: "" as unknown as number, gender: "" },
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
      contactEmail: storedEmail ?? "",
      contactPhone: storedContactPhone ?? storedTravelers[0]?.phone ?? "",
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
      setTravelers(
        data.travelers.map((t) => ({
          name: t.name,
          age: Number(t.age),
          gender: t.gender,
          phone: data.contactPhone,
        })),
      );
      setContactPhone(data.contactPhone || null);
      setContactEmail(data.contactEmail || null);
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
      className="flex flex-col gap-5 p-5 pb-32"
      noValidate
    >
      {/* Traveller Details */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-title-lg font-title-lg text-on-surface">
            Traveller Details
          </h2>
          <span className="text-label-sm text-primary">
            {travelerCount} {travelerCount === 1 ? "Seat" : "Seats"}
          </span>
        </div>
        <p className="mt-0.5 text-label-sm text-on-surface-variant">
          Fill passenger details for the seats
        </p>
      </div>

      {/* Compact traveler rows */}
      <div className="flex flex-col gap-3">
        {fields.map((field, index) => {
          const gender = watch(`travelers.${index}.gender`);
          return (
            <div
              key={field.id}
              className="rounded-xl border border-outline-variant p-3"
            >
              {/* Row label */}
              {travelerCount > 1 && (
                <p className="mb-2 text-label-sm text-on-surface-variant">
                  Passenger {index + 1}
                </p>
              )}

              {/* Inline: Name | Age | Gender toggles */}
              <div className="flex items-start gap-2">
                {/* Name */}
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="FULL NAME"
                    className={cn(
                      "w-full rounded-lg border bg-surface-container-low px-3 py-2.5",
                      "text-body-md text-on-surface placeholder:text-on-surface-variant/50",
                      "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
                      errors.travelers?.[index]?.name
                        ? "border-error"
                        : "border-outline-variant",
                    )}
                    {...register(`travelers.${index}.name`)}
                  />
                  {errors.travelers?.[index]?.name && (
                    <p className="mt-0.5 text-[11px] text-error">
                      {errors.travelers[index].name.message}
                    </p>
                  )}
                </div>

                {/* Age */}
                <div className="w-16">
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="AGE"
                    className={cn(
                      "w-full rounded-lg border bg-surface-container-low px-2 py-2.5 text-center",
                      "text-body-md text-on-surface placeholder:text-on-surface-variant/50",
                      "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
                      errors.travelers?.[index]?.age
                        ? "border-error"
                        : "border-outline-variant",
                    )}
                    {...register(`travelers.${index}.age`, { valueAsNumber: true })}
                  />
                </div>

                {/* Gender toggle buttons */}
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      setValue(`travelers.${index}.gender`, "male", { shouldValidate: true })
                    }
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg border transition-all",
                      gender === "male"
                        ? "border-primary bg-primary/10"
                        : "border-outline-variant bg-surface-container-low",
                    )}
                    title="Male"
                  >
                    <span
                      className={cn(
                        "material-symbols-outlined filled text-[22px]",
                        gender === "male" ? "text-primary" : "text-on-surface-variant",
                      )}
                    >
                      man
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setValue(`travelers.${index}.gender`, "female", { shouldValidate: true })
                    }
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg border transition-all",
                      gender === "female"
                        ? "border-primary bg-primary/10"
                        : "border-outline-variant bg-surface-container-low",
                    )}
                    title="Female"
                  >
                    <span
                      className={cn(
                        "material-symbols-outlined filled text-[22px]",
                        gender === "female" ? "text-primary" : "text-on-surface-variant",
                      )}
                    >
                      woman
                    </span>
                  </button>
                </div>
              </div>
              {errors.travelers?.[index]?.gender && (
                <p className="mt-1 text-[11px] text-error">Select gender</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Contact Details */}
      <div>
        <h3 className="text-title-lg font-title-lg text-on-surface">
          Contact Details
        </h3>
        <p className="mt-0.5 text-label-sm text-on-surface-variant">
          We'll send your ticket here
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Input
          label="Email Address"
          type="email"
          placeholder="EMAIL ADDRESS"
          error={errors.contactEmail?.message}
          {...register("contactEmail")}
        />
        <Input
          label="Phone Number"
          type="tel"
          placeholder="PHONE NUMBER"
          countryCode="+91"
          inputMode="numeric"
          maxLength={10}
          error={errors.contactPhone?.message}
          {...register("contactPhone")}
        />
      </div>

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
          rows={2}
          placeholder="Dietary restrictions, medical conditions..."
          className={cn(
            "w-full rounded-xl bg-surface-container-low text-on-surface",
            "border border-outline-variant p-3 text-body-md",
            "placeholder:text-on-surface-variant/50",
            "transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
            "resize-none",
          )}
          {...register("specialRequests")}
        />
      </div>

      {/* Pickup Point */}
      <div className="flex flex-col gap-3">
        <div>
          <h3 className="text-title-lg font-title-lg text-on-surface">
            Pickup Point
          </h3>
          <p className="mt-0.5 text-label-sm text-on-surface-variant">
            Select your boarding location
          </p>
        </div>

        <div
          className="flex flex-col gap-2"
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

      {/* Bottom bar */}
      <BookingBottomBar
        step={2}
        totalSteps={6}
        onNext={handleSubmit(onSubmit)}
        onBack={() => router.push(`/${tripId}/travelers`)}
        isLoading={submitting}
      />
    </form>
  );
}
