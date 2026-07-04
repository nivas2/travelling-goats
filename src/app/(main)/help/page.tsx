"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Icon } from "@/components/ui/icon";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Dropdown } from "@/components/ui/dropdown";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  description: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  createdAt: string;
}

interface HelpData {
  faqs: FaqItem[];
  tickets: SupportTicket[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FAQ_CATEGORIES = [
  { value: "all", label: "All", icon: "apps" },
  { value: "Booking", label: "Booking", icon: "confirmation_number" },
  { value: "Payment", label: "Payment", icon: "payment" },
  { value: "Trip", label: "Trip", icon: "flight_takeoff" },
  { value: "Account", label: "Account", icon: "person" },
  { value: "Technical", label: "Technical", icon: "settings" },
];

const TICKET_CATEGORY_OPTIONS = FAQ_CATEGORIES.filter(
  (c) => c.value !== "all"
).map((c) => ({ label: c.label, value: c.value }));

const TICKET_STATUS_META: Record<
  SupportTicket["status"],
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  OPEN: { label: "Open", variant: "secondary" },
  IN_PROGRESS: { label: "In Progress", variant: "default" },
  RESOLVED: { label: "Resolved", variant: "outline" },
  CLOSED: { label: "Closed", variant: "outline" },
};

// ---------------------------------------------------------------------------
// FAQ Accordion Item
// ---------------------------------------------------------------------------

function FaqAccordion({
  faq,
  isOpen,
  onToggle,
}: {
  faq: FaqItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <Card
      variant="outlined"
      className="p-0 overflow-hidden"
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-surface-container"
      >
        <span className="flex-1 text-body-lg text-on-surface font-medium">
          {faq.question}
        </span>
        <Icon
          name={isOpen ? "expand_less" : "expand_more"}
          size={20}
          className="text-on-surface-variant shrink-0"
        />
      </button>
      {isOpen && (
        <div className="border-t border-outline-variant/50 px-4 py-3 bg-surface-container-low">
          <p className="text-body-md text-on-surface-variant leading-relaxed">
            {faq.answer}
          </p>
        </div>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function HelpPage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [data, setData] = useState<HelpData>({ faqs: [], tickets: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // FAQ state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  // Ticket modal state
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketCategory, setTicketCategory] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [submittingTicket, setSubmittingTicket] = useState(false);

  const fetchHelp = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch FAQs and tickets -- the API may combine or be separate.
      // We attempt a single endpoint first.
      const res = await fetch("/api/notifications?type=help");
      if (res.ok) {
        const json = await res.json();
        setData({
          faqs: json.data?.faqs ?? defaultFaqs,
          tickets: json.data?.tickets ?? [],
        });
      } else {
        // Fallback to built-in FAQ data
        setData({ faqs: defaultFaqs, tickets: [] });
      }
    } catch {
      // Use default FAQs on error
      setData({ faqs: defaultFaqs, tickets: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHelp();
  }, [fetchHelp]);

  const handleSubmitTicket = async () => {
    if (!ticketSubject.trim() || !ticketCategory || !ticketDescription.trim())
      return;

    try {
      setSubmittingTicket(true);
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "SUPPORT_TICKET",
          subject: ticketSubject.trim(),
          category: ticketCategory,
          description: ticketDescription.trim(),
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data?.ticket) {
          setData((prev) => ({
            ...prev,
            tickets: [json.data.ticket, ...prev.tickets],
          }));
        }
      }

      toastSuccess("Ticket submitted successfully");
      setTicketModalOpen(false);
      setTicketSubject("");
      setTicketCategory("");
      setTicketDescription("");
    } catch {
      toastError("Failed to submit ticket. Please try again.");
    } finally {
      setSubmittingTicket(false);
    }
  };

  // Filtered FAQs
  const filteredFaqs = useMemo(() => {
    let items = data.faqs;

    if (selectedCategory !== "all") {
      items = items.filter((f) => f.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (f) =>
          f.question.toLowerCase().includes(q) ||
          f.answer.toLowerCase().includes(q)
      );
    }

    return items;
  }, [data.faqs, selectedCategory, searchQuery]);

  // -- Loading ---------------------------------------------------------------

  if (loading) {
    return (
      <div className="px-5 py-6 space-y-6">
        <Skeleton variant="text" width={200} />
        <Skeleton variant="card" height={48} />
        <Skeleton variant="card" height={60} />
        <Skeleton variant="card" height={60} />
        <Skeleton variant="card" height={60} />
        <Skeleton variant="card" height={60} />
      </div>
    );
  }

  return (
    <div className="px-5 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-headline-md font-headline-md text-on-surface">
          Help Center
        </h1>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Find answers or get in touch with us
        </p>
      </div>

      {/* Search */}
      <Input
        placeholder="Search FAQs..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        iconLeft={<Icon name="search" size={20} />}
      />

      {/* Tabs: FAQ / My Tickets */}
      <Tabs defaultValue="faq">
        <TabList>
          <Tab value="faq">FAQs</Tab>
          <Tab value="tickets">My Tickets</Tab>
        </TabList>

        {/* ---- FAQ Panel ---- */}
        <TabPanel value="faq">
          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 -mx-5 px-5">
            {FAQ_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setSelectedCategory(cat.value)}
                className={cn(
                  "flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-label-sm font-medium transition-colors",
                  selectedCategory === cat.value
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                )}
              >
                <Icon name={cat.icon} size={16} />
                {cat.label}
              </button>
            ))}
          </div>

          {/* FAQ list */}
          <div className="mt-4 space-y-3">
            {filteredFaqs.length === 0 ? (
              <EmptyState
                icon="search_off"
                title="No results found"
                description="Try a different search term or category"
              />
            ) : (
              filteredFaqs.map((faq) => (
                <FaqAccordion
                  key={faq.id}
                  faq={faq}
                  isOpen={openFaqId === faq.id}
                  onToggle={() =>
                    setOpenFaqId((prev) => (prev === faq.id ? null : faq.id))
                  }
                />
              ))
            )}
          </div>
        </TabPanel>

        {/* ---- Tickets Panel ---- */}
        <TabPanel value="tickets">
          {data.tickets.length === 0 ? (
            <EmptyState
              icon="support_agent"
              title="No tickets yet"
              description="All your support tickets will appear here"
              action={{
                label: "Raise a Ticket",
                onClick: () => setTicketModalOpen(true),
              }}
            />
          ) : (
            <div className="space-y-3">
              {data.tickets.map((ticket) => {
                const statusMeta = TICKET_STATUS_META[ticket.status];
                return (
                  <Card key={ticket.id} variant="outlined" className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-body-md font-medium text-on-surface truncate">
                          {ticket.subject}
                        </p>
                        <p className="text-label-sm text-on-surface-variant mt-0.5">
                          {ticket.category} &middot;{" "}
                          {new Date(ticket.createdAt).toLocaleDateString(
                            "en-IN",
                            { day: "numeric", month: "short" }
                          )}
                        </p>
                      </div>
                      <Badge variant={statusMeta.variant}>
                        {statusMeta.label}
                      </Badge>
                    </div>
                    <p className="text-label-sm text-on-surface-variant mt-2 line-clamp-2">
                      {ticket.description}
                    </p>
                  </Card>
                );
              })}
            </div>
          )}
        </TabPanel>
      </Tabs>

      {/* Raise a Ticket CTA */}
      <Card variant="elevated" className="flex items-center gap-4 p-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-fixed">
          <Icon name="support_agent" size={24} className="text-on-primary-fixed" />
        </div>
        <div className="flex-1">
          <p className="text-title-md font-title-md text-on-surface">
            Need more help?
          </p>
          <p className="text-label-sm text-on-surface-variant">
            Raise a support ticket and we will get back to you
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setTicketModalOpen(true)}
        >
          Raise Ticket
        </Button>
      </Card>

      {/* Contact Info */}
      <Card variant="outlined" className="p-4">
        <h3 className="text-title-md font-title-md text-on-surface mb-3">
          Contact Us
        </h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Icon
              name="email"
              size={20}
              className="text-on-surface-variant"
            />
            <a
              href="mailto:support@travellinggoats.in" /* TODO: Update email domain */
              className="text-body-md text-primary"
            >
              support@travellinggoats.in
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Icon
              name="phone"
              size={20}
              className="text-on-surface-variant"
            />
            <a href="tel:+911234567890" className="text-body-md text-primary">
              +91 12345 67890
            </a>
          </div>
        </div>
      </Card>

      {/* Raise Ticket Modal */}
      <Modal
        open={ticketModalOpen}
        onClose={() => setTicketModalOpen(false)}
        title="Raise a Ticket"
        description="Describe your issue and we will help you out"
      >
        <div className="space-y-4">
          <Input
            label="Subject"
            placeholder="Brief summary of your issue"
            value={ticketSubject}
            onChange={(e) => setTicketSubject(e.target.value)}
          />

          <Dropdown
            label="Category"
            options={TICKET_CATEGORY_OPTIONS}
            value={ticketCategory}
            onChange={setTicketCategory}
            placeholder="Select a category"
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-label-lg font-semibold text-on-surface">
              Description
            </label>
            <textarea
              placeholder="Describe your issue in detail..."
              rows={4}
              value={ticketDescription}
              onChange={(e) => setTicketDescription(e.target.value)}
              className={cn(
                "w-full rounded-xl bg-surface-container-low text-on-surface",
                "border border-outline-variant px-4 py-3 text-body-lg",
                "placeholder:text-on-surface-variant/50",
                "transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
                "resize-none"
              )}
            />
          </div>

          <Button
            fullWidth
            loading={submittingTicket}
            onClick={handleSubmitTicket}
            disabled={
              !ticketSubject.trim() ||
              !ticketCategory ||
              !ticketDescription.trim()
            }
          >
            Submit Ticket
          </Button>
        </div>
      </Modal>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Default FAQs (fallback)
// ---------------------------------------------------------------------------

const defaultFaqs: FaqItem[] = [
  {
    id: "1",
    question: "How do I book a trip?",
    answer:
      "Browse trips from the home page, select your preferred trip, choose your booking type (Solo, Couple, or Group), add travelers, select add-ons, and proceed to payment.",
    category: "Booking",
  },
  {
    id: "2",
    question: "Can I cancel my booking?",
    answer:
      "Yes, you can cancel your booking from the My Trips section. Cancellation charges may apply based on how close the trip date is. Check our refund policy for details.",
    category: "Booking",
  },
  {
    id: "3",
    question: "What payment methods are accepted?",
    answer:
      "We accept UPI, credit/debit cards, net banking, and wallet payments through Razorpay. You can also use your Travelling Goats wallet balance.",
    category: "Payment",
  },
  {
    id: "4",
    question: "How do I get a refund?",
    answer:
      "Refunds are processed within 5-7 business days to your original payment method. Wallet refunds are instant. Check the refund policy for cancellation charges.",
    category: "Payment",
  },
  {
    id: "5",
    question: "What should I pack for a trek?",
    answer:
      "Essentials include comfortable trekking shoes, layered clothing, rain jacket, sunscreen, water bottle, personal medication, and a small backpack. Detailed packing lists are shared before each trip.",
    category: "Trip",
  },
  {
    id: "6",
    question: "Is there an age limit for trips?",
    answer:
      "Most trips are open to travelers aged 18-45. Some family-friendly trips allow younger travelers with a guardian. Check individual trip details for specific age requirements.",
    category: "Trip",
  },
  {
    id: "7",
    question: "How do I update my profile?",
    answer:
      "Go to Profile > Edit Profile to update your name, photo, bio, interests, and other details. Identity verification can be done from Profile > Settings.",
    category: "Account",
  },
  {
    id: "8",
    question: "How do reward points work?",
    answer:
      "Earn points by booking trips, writing reviews, referring friends, and more. Points can be redeemed for discounts on future bookings. Higher tiers unlock bonus multipliers.",
    category: "Account",
  },
  {
    id: "9",
    question: "The app is not loading properly",
    answer:
      "Try clearing your browser cache, updating the app to the latest version, or checking your internet connection. If the issue persists, raise a support ticket.",
    category: "Technical",
  },
  {
    id: "10",
    question: "How do I report a bug?",
    answer:
      "Use the Raise a Ticket option in the Help Center with the category set to Technical. Include screenshots and steps to reproduce the issue for faster resolution.",
    category: "Technical",
  },
];
