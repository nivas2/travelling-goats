import { ContentPage } from "@/components/layout/content-page";

export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <ContentPage title="Privacy Policy" subtitle="Last updated: July 2026">
      <p>
        Your privacy matters to us. This policy explains what we collect, why,
        and how we protect it.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li>Account details you provide (name, phone, email, city)</li>
        <li>Booking and payment information needed to process your trips</li>
        <li>Usage data that helps us improve the app</li>
      </ul>

      <h2>How we use it</h2>
      <p>
        We use your information to confirm bookings, keep you and your group
        safe, provide support, and send trip-related updates. We do not sell your
        personal data.
      </p>

      <h2>Sharing</h2>
      <p>
        We share only what&apos;s necessary — for example, your name with your
        trip captain and group, or payment details with our secure payment
        provider. Your profile visibility can be controlled in Settings.
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>Update your profile any time from Edit Profile</li>
        <li>Manage notification preferences in Settings</li>
        <li>Delete your account, which anonymizes your personal data</li>
      </ul>

      <h2>Contact</h2>
      <p>
        For privacy questions, email{" "}
        <a href="mailto:privacy@travellinggoats.in" className="text-primary underline">
          privacy@travellinggoats.in
        </a>
        .
      </p>
    </ContentPage>
  );
}
