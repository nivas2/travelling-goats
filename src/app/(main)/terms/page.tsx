import { ContentPage } from "@/components/layout/content-page";

export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <ContentPage title="Terms of Service" subtitle="Last updated: July 2026">
      <p>
        Welcome to Travelling Goats. By creating an account or booking a trip,
        you agree to these terms. Please read them carefully.
      </p>

      <h2>1. Bookings & Payments</h2>
      <p>
        All bookings are subject to availability and confirmation. Prices are
        shown in Indian Rupees and include the inclusions listed on each trip
        page. A platform fee may apply and is shown at checkout.
      </p>

      <h2>2. Traveler Responsibilities</h2>
      <ul>
        <li>Provide accurate personal and contact information</li>
        <li>Arrive at the meeting point on time</li>
        <li>Follow the guidance of your trip captain and respect fellow travelers</li>
      </ul>

      <h2>3. Cancellations</h2>
      <p>
        Cancellations follow the policy shown on each trip and at checkout.
        Refunds, where applicable, are processed to your original payment method
        or wallet. See our Refund Policy for details.
      </p>

      <h2>4. Conduct</h2>
      <p>
        We may suspend or remove accounts that violate these terms, harass other
        travelers, or compromise group safety.
      </p>

      <h2>5. Changes</h2>
      <p>
        We may update these terms from time to time. Continued use of the app
        after changes constitutes acceptance of the revised terms.
      </p>
    </ContentPage>
  );
}
