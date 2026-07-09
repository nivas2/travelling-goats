import { ContentPage } from "@/components/layout/content-page";

export const metadata = { title: "Safety" };

export default function SafetyPage() {
  return (
    <ContentPage title="Safety" subtitle="How we help keep you safe on every trip">
      <p>
        Your safety is at the heart of every Travelling Goats trip. From vetted
        trip captains to in-app emergency tools, we build safeguards into each
        step of your journey so you can travel with confidence.
      </p>

      <h2>Before the Trip</h2>
      <ul>
        <li>Every trip captain is verified and trained in group safety</li>
        <li>Detailed itineraries, meeting points and packing guidance are shared in advance</li>
        <li>Add emergency contacts to your profile so we know who to reach</li>
      </ul>

      <h2>During the Trip</h2>
      <ul>
        <li>Optional location sharing keeps your captain and group aware of your whereabouts</li>
        <li>An in-app SOS button connects you to your trip captain and emergency services</li>
        <li>Live weather and trip updates help the group make safe decisions</li>
      </ul>

      <h2>Emergency Help</h2>
      <p>
        If you are on a trip and need urgent help, open the in-app Emergency
        screen to trigger an SOS alert, view your emergency contacts and reach
        your trip captain. In any life-threatening situation, always contact
        local emergency services first.
      </p>

      <h2>Safety Tips</h2>
      <ul>
        <li>Stay calm and assess your situation before acting</li>
        <li>Keep your phone charged and share your live location when travelling</li>
        <li>Stay with your group and follow your trip captain&apos;s guidance</li>
        <li>Keep copies of important documents and know the local emergency number</li>
      </ul>

      <h2>Report a Concern</h2>
      <p>
        If you ever feel unsafe or want to report inappropriate behaviour,
        contact us through the Help Center. We take every report seriously and
        respond promptly.
      </p>
    </ContentPage>
  );
}
