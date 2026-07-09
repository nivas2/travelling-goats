"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ContentPage } from "@/components/layout/content-page";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

function ContactForm() {
  const params = useSearchParams();
  const router = useRouter();
  const toast = useToast();

  const isPartner = params.get("type") === "partner";
  const type = isPartner ? "PARTNER" : "GENERAL";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, name, email, phone, company, message }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? "Something went wrong. Please try again.");
        return;
      }
      setDone(true);
      toast.success("Thanks! We've received your message.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="space-y-4">
        <p>
          Thanks for reaching out{name ? `, ${name.split(" ")[0]}` : ""}! Our team has received
          your {isPartner ? "partnership enquiry" : "message"} and will get back to you at{" "}
          <strong>{email}</strong> soon.
        </p>
        <Button variant="secondary" onClick={() => router.push("/")}>
          Back to Home
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p>
        {isPartner
          ? "Want to partner with Travelling Goats — as a stay, transport, activity or corporate partner? Tell us about you and we'll be in touch."
          : "Have a question or feedback? Send us a message and our team will get back to you."}
      </p>

      <Input
        label="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        fullWidth
        placeholder="Jane Goat"
      />
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        fullWidth
        placeholder="you@example.com"
      />
      <Input
        label="Phone (optional)"
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        fullWidth
        placeholder="+91 98765 43210"
      />
      {isPartner && (
        <Input
          label="Company / organisation (optional)"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          fullWidth
          placeholder="Acme Adventures"
        />
      )}

      <div className="flex flex-col">
        <label
          htmlFor="contact-message"
          className="mb-1.5 text-label-md text-on-surface-variant"
        >
          Message
        </label>
        <textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={5}
          placeholder={
            isPartner
              ? "Tell us about your business and how you'd like to partner…"
              : "How can we help?"
          }
          className="resize-y rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-body-md text-on-surface outline-none focus:border-primary"
        />
      </div>

      <Button type="submit" loading={submitting} disabled={submitting} fullWidth>
        Send message
      </Button>
    </form>
  );
}

export default function ContactPage() {
  return (
    <Suspense fallback={null}>
      <Wrapper />
    </Suspense>
  );
}

function Wrapper() {
  const params = useSearchParams();
  const isPartner = params.get("type") === "partner";
  return (
    <ContentPage
      title={isPartner ? "Partner with Us" : "Contact Us"}
      subtitle={isPartner ? "Grow with Travelling Goats" : "We'd love to hear from you"}
    >
      <ContactForm />
    </ContentPage>
  );
}
