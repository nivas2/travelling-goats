import { ContentPage } from "@/components/layout/content-page";

export const metadata = { title: "About Travelling Goats" };

export default function AboutPage() {
  return (
    <ContentPage title="About Travelling Goats" subtitle="Version 1.0.0">
      <p>
        Travelling Goats makes group travel effortless, safe, and unforgettable.
        We host curated group trips across India — every itinerary is handpicked,
        every captain is verified, and every price is transparent, so you can
        focus on the adventure and the friends you&apos;ll make along the way.
      </p>

      <h2>Why we exist</h2>
      <p>
        Great trips shouldn&apos;t require endless planning or travelling alone.
        We bring together like-minded travelers — solo adventurers, couples, and
        friends — into small, women-friendly groups led by trusted shepherds.
      </p>

      <h2>What you get</h2>
      <ul>
        <li>Fully planned itineraries — just pack your bags and show up</li>
        <li>Verified captains and women-safe groups</li>
        <li>Transparent pricing with clear inclusions and no hidden charges</li>
        <li>A community of travelers to share the journey with</li>
      </ul>

      <h2>Get in touch</h2>
      <p>
        Questions, feedback, or partnership ideas? Reach us at{" "}
        <a href="mailto:hello@travellinggoats.in" className="text-primary underline">
          hello@travellinggoats.in
        </a>
        .
      </p>

      <p className="pt-4 text-label-sm text-on-surface-variant">
        &copy; {new Date().getFullYear()} Travelling Goats. All rights reserved.
      </p>
    </ContentPage>
  );
}
