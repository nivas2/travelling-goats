"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { formatDateRange, formatCategory } from "@/lib/utils";

interface CaptainTrip {
  id: string;
  title: string;
  destination: string;
  coverImage: string;
  startDate: string;
  endDate: string;
  status: string;
  confirmedBookings: number;
  travellers: number;
  checkedIn: number;
}

export default function CaptainDashboardPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<CaptainTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/captain/trips");
        if (res.status === 403) {
          setForbidden(true);
          return;
        }
        const json = await res.json();
        if (json.success) setTrips(json.data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (forbidden) {
    return (
      <div className="mx-auto max-w-md px-5 py-16 text-center">
        <Icon name="lock" size={40} className="mx-auto text-on-surface-variant" />
        <p className="mt-3 text-title-md text-on-surface">Captains only</p>
        <p className="mt-1 text-body-md text-on-surface-variant">
          This area is for trip captains.
        </p>
        <Button className="mt-4" onClick={() => router.push("/home")}>Go home</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-6">
      <div className="flex items-center gap-2">
        <Icon name="hiking" size={24} className="text-primary" filled />
        <h1 className="text-headline-md font-headline-md text-on-surface">Captain Dashboard</h1>
      </div>
      <p className="mt-1 text-body-md text-on-surface-variant">
        The trips you&apos;re handling. Verify tickets and track who&apos;s boarded.
      </p>

      {loading ? (
        <div className="mt-5 space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-surface-container-low" />
          ))}
        </div>
      ) : trips.length === 0 ? (
        <div className="mt-10 text-center">
          <Icon name="luggage" size={40} className="mx-auto text-on-surface-variant" />
          <p className="mt-3 text-title-md text-on-surface">No trips assigned yet</p>
          <p className="mt-1 text-body-md text-on-surface-variant">
            When an admin assigns you as captain of a trip, it&apos;ll show up here.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {trips.map((t) => (
            <Card key={t.id} variant="elevated" className="overflow-hidden p-0">
              <div className="flex gap-3 p-4">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-surface-container">
                  {t.coverImage && (
                    <Image src={t.coverImage} alt={t.title} fill className="object-cover" sizes="80px" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-title-md font-semibold text-on-surface">{t.title}</h3>
                    <span className="shrink-0 rounded-full bg-surface-container px-2 py-0.5 text-[11px] font-semibold text-on-surface-variant">
                      {formatCategory(t.status)}
                    </span>
                  </div>
                  <p className="mt-0.5 flex items-center gap-1 text-label-md text-on-surface-variant">
                    <Icon name="location_on" size={14} className="text-primary" /> {t.destination}
                  </p>
                  <p className="mt-0.5 text-label-md text-on-surface-variant">
                    {formatDateRange(t.startDate, t.endDate)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-outline-variant/40 bg-surface-container-lowest px-4 py-2.5">
                <div className="flex items-center gap-4 text-label-md">
                  <span className="flex items-center gap-1 text-on-surface">
                    <Icon name="group" size={16} className="text-primary" /> {t.travellers} travellers
                  </span>
                  <span className="flex items-center gap-1 text-success">
                    <Icon name="how_to_reg" size={16} /> {t.checkedIn}/{t.travellers} in
                  </span>
                </div>
              </div>

              <div className="flex gap-2 p-3">
                <Button size="md" className="flex-1" onClick={() => router.push("/verify")}>
                  <Icon name="qr_code_scanner" size={16} /> Verify Tickets
                </Button>
                <Button
                  size="md"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => router.push(`/captain/trips/${t.id}`)}
                >
                  <Icon name="list_alt" size={16} /> Roster
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
