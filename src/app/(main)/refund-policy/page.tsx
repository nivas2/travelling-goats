import { ContentPage } from "@/components/layout/content-page";

export const metadata = { title: "Refund Policy" };

export default function RefundPolicyPage() {
  return (
    <ContentPage title="Refund Policy" subtitle="Last updated: July 2026">
      <p>
        We want you to book with confidence. Refunds depend on how far ahead of
        the trip start date you cancel. The exact policy for each trip is shown
        on its page and again at checkout.
      </p>

      <h2>Standard cancellation tiers</h2>
      <ul>
        <li>More than 7 days before departure: full refund minus platform fee</li>
        <li>3–7 days before departure: 50% refund</li>
        <li>Less than 3 days before departure: non-refundable</li>
      </ul>

      <h2>How refunds are issued</h2>
      <p>
        Approved refunds are credited to your Travelling Goats wallet instantly,
        or to your original payment method within 5–7 business days.
      </p>

      <h2>Trip changes or cancellations by us</h2>
      <p>
        If we cancel or materially change a trip, you&apos;ll be offered a full
        refund or the option to move to another departure at no extra cost.
      </p>

      <h2>Questions</h2>
      <p>
        Contact{" "}
        <a href="mailto:support@travellinggoats.in" className="text-primary underline">
          support@travellinggoats.in
        </a>{" "}
        for help with a specific booking.
      </p>
    </ContentPage>
  );
}
