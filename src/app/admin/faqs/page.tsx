"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  isActive: boolean;
}

type Draft = Omit<Faq, "id"> & { id?: string };

const EMPTY: Draft = {
  question: "",
  answer: "",
  category: "General",
  order: 0,
  isActive: true,
};

const inputCls =
  "w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-body-md text-on-surface outline-none transition-colors focus:border-primary";

export default function AdminFaqsPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Faq | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/admin/faqs");
      const json = await res.json();
      if (json.success) setFaqs(json.data ?? []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/admin/faqs");
        const json = await res.json();
        if (active && json.success) setFaqs(json.data ?? []);
      } catch {
        /* ignore */
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function save() {
    if (!draft || !draft.question.trim() || !draft.answer.trim()) return;
    setSaving(true);
    try {
      const editing = !!draft.id;
      const res = await fetch(
        editing ? `/api/admin/faqs/${draft.id}` : "/api/admin/faqs",
        {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft),
        }
      );
      const json = await res.json();
      if (json.success) {
        setDraft(null);
        await load();
      }
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(faq: Faq) {
    setFaqs((prev) =>
      prev.map((f) => (f.id === faq.id ? { ...f, isActive: !f.isActive } : f))
    );
    await fetch(`/api/admin/faqs/${faq.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !faq.isActive }),
    });
  }

  async function remove() {
    if (!deleteTarget) return;
    await fetch(`/api/admin/faqs/${deleteTarget.id}`, { method: "DELETE" });
    setFaqs((prev) => prev.filter((f) => f.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-headline-md font-headline-md text-on-surface">FAQ Management</h1>
          <p className="text-body-md text-on-surface-variant">
            Questions shown in the landing page FAQ section.
          </p>
        </div>
        <Button size="sm" onClick={() => setDraft({ ...EMPTY, order: faqs.length })}>
          + Add FAQ
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-container-low" />
          ))}
        </div>
      ) : faqs.length === 0 ? (
        <Card variant="elevated" className="p-12 text-center text-on-surface-variant">
          No FAQs yet. Add your first one.
        </Card>
      ) : (
        <div className="space-y-3">
          {faqs.map((faq) => (
            <Card key={faq.id} variant="elevated" className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-label-sm text-primary">
                      {faq.category}
                    </span>
                    {!faq.isActive && (
                      <span className="rounded-full bg-surface-container px-2 py-0.5 text-label-sm text-on-surface-variant">
                        Hidden
                      </span>
                    )}
                  </div>
                  <h3 className="mt-1.5 text-title-md font-title-md text-on-surface">
                    {faq.question}
                  </h3>
                  <p className="mt-0.5 text-body-md text-on-surface-variant line-clamp-2">
                    {faq.answer}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => toggleActive(faq)}
                    className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-surface-container"
                    title={faq.isActive ? "Hide" : "Show"}
                  >
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                      {faq.isActive ? "visibility" : "visibility_off"}
                    </span>
                  </button>
                  <button
                    onClick={() => setDraft(faq)}
                    className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-surface-container"
                    title="Edit"
                  >
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">edit</span>
                  </button>
                  <button
                    onClick={() => setDeleteTarget(faq)}
                    className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-error/10"
                    title="Delete"
                  >
                    <span className="material-symbols-outlined text-[18px] text-error">delete</span>
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit modal */}
      <Modal
        open={!!draft}
        onClose={() => setDraft(null)}
        title={draft?.id ? "Edit FAQ" : "Add FAQ"}
        size="md"
      >
        {draft && (
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-label-sm font-label-sm text-on-surface-variant">Question</span>
              <input
                className={inputCls}
                value={draft.question}
                onChange={(e) => setDraft({ ...draft, question: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-label-sm font-label-sm text-on-surface-variant">Answer</span>
              <textarea
                className={inputCls + " resize-y"}
                rows={4}
                value={draft.answer}
                onChange={(e) => setDraft({ ...draft, answer: e.target.value })}
              />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="mb-1 block text-label-sm font-label-sm text-on-surface-variant">Category</span>
                <input
                  className={inputCls}
                  value={draft.category}
                  onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-label-sm font-label-sm text-on-surface-variant">Order</span>
                <input
                  type="number"
                  className={inputCls}
                  value={draft.order}
                  onChange={(e) => setDraft({ ...draft, order: Number(e.target.value) })}
                />
              </label>
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={draft.isActive}
                onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
              />
              <span className="text-body-md text-on-surface">Visible on site</span>
            </label>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setDraft(null)}>Cancel</Button>
              <Button
                size="sm"
                loading={saving}
                onClick={save}
                disabled={!draft.question.trim() || !draft.answer.trim()}
              >
                Save
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete FAQ"
        description="This action cannot be undone."
        size="sm"
      >
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="destructive" size="sm" onClick={remove}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
