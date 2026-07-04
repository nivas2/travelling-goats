"use client";

import { create } from "zustand";

interface WishlistState {
  /** Set of saved trip IDs. Replaced (not mutated) on every change so selectors re-run. */
  ids: Set<string>;
  loaded: boolean;
  loading: boolean;
  /** Fetch the user's wishlist once per session. */
  ensureLoaded: () => Promise<void>;
  setSaved: (tripId: string, saved: boolean) => void;
  /** Optimistically toggle, then reconcile with the server. */
  toggle: (tripId: string) => Promise<void>;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  ids: new Set<string>(),
  loaded: false,
  loading: false,

  ensureLoaded: async () => {
    if (get().loaded || get().loading) return;
    set({ loading: true });
    try {
      const res = await fetch("/api/users/wishlist");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        set({
          ids: new Set(json.data.map((t: { id: string }) => t.id)),
          loaded: true,
        });
      } else {
        set({ loaded: true });
      }
    } catch {
      set({ loaded: true });
    } finally {
      set({ loading: false });
    }
  },

  setSaved: (tripId, saved) =>
    set((s) => {
      const ids = new Set(s.ids);
      if (saved) ids.add(tripId);
      else ids.delete(tripId);
      return { ids };
    }),

  toggle: async (tripId) => {
    const wasSaved = get().ids.has(tripId);
    get().setSaved(tripId, !wasSaved); // optimistic
    try {
      const res = await fetch("/api/users/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId }),
      });
      const json = await res.json();
      if (!json.success) throw new Error("toggle failed");
      get().setSaved(tripId, !!json.data?.wishlisted); // server truth
    } catch {
      get().setSaved(tripId, wasSaved); // revert on failure
    }
  },
}));
