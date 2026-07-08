import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import LandingPage from "@/components/landing/landing-page";
import { formatCurrency } from "@/lib/utils";
import {
  getContentMap,
  getFeaturedTestimonials,
  getActiveFaqs,
  getUpcomingTrips,
} from "@/lib/content/server";
import { asList, asObject } from "@/lib/content/registry";

export default async function RootPage() {
  const session = await auth();

  if (session) {
    redirect("/home");
  }

  const [content, testimonials, faqs, upcomingTrips] = await Promise.all([
    getContentMap(false),
    getFeaturedTestimonials(3),
    getActiveFaqs(),
    getUpcomingTrips(4),
  ]);

  const hero = asObject(content["landing.hero"]);

  return (
    <LandingPage
      hero={{
        titleLine1: hero.titleLine1 ?? "",
        titleLine2: hero.titleLine2 ?? "",
        subtitle: hero.subtitle ?? "",
        imageUrl: hero.imageUrl ?? "",
        primaryCta: hero.primaryCta ?? "",
        secondaryCta: hero.secondaryCta ?? "",
      }}
      steps={asList(content["landing.steps"]).map((s) => ({
        title: s.title,
        desc: s.desc,
      }))}
      trustBadges={asList(content["landing.trustBadges"]).map((b) => ({
        icon: b.icon,
        label: b.label,
      }))}
      stats={asList(content["landing.stats"]).map((s) => ({
        value: s.value,
        label: s.label,
      }))}
      navLinks={asList(content["landing.nav"]).map((n) => n.label)}
      buttons={asObject(content["landing.buttons"])}
      sections={asObject(content["landing.sections"])}
      footer={asObject(content["landing.footer"])}
      trips={upcomingTrips.map((t) => ({
        title: t.title,
        description: (t.description ?? "").slice(0, 150) + ((t.description ?? "").length > 150 ? "..." : ""),
        duration: `${t.duration}D/${Math.max(t.duration - 1, 0)}N`,
        pickup: t.origin || "TBD",
        seats: `${Math.max(t.maxGroupSize - t.currentBookings, 0)} Left`,
        price: formatCurrency(t.basePricePaise),
        rating: t.rating.toFixed(1),
        image: t.coverImage || "/placeholder-trip.jpg",
      }))}
      testimonials={testimonials
        .filter((t) => t.comment)
        .map((t) => ({
          quote: t.comment as string,
          name: t.user?.name ?? "Traveler",
          trip: t.trip?.title ?? "",
        }))}
      faqs={faqs.map((f) => ({ question: f.question, answer: f.answer }))}
    />
  );
}
