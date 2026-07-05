"use client";

import { useCallback } from "react";

const STORAGE_KEY = "travellinggoats_sound_enabled";

function getEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const val = localStorage.getItem(STORAGE_KEY);
  return val === null ? true : val === "true";
}

// Module-level singleton so the Audio object survives re-renders and
// navigation. Once unlocked by any user gesture it stays unlocked.
let sharedAudio: HTMLAudioElement | null = null;
let unlocked = false;

function getAudio(): HTMLAudioElement {
  if (!sharedAudio && typeof window !== "undefined") {
    sharedAudio = new Audio("/sounds/goat-success.mp3");
    sharedAudio.preload = "auto";
  }
  return sharedAudio!;
}

/**
 * Call once from any click/touch handler to permanently unlock audio
 * playback for the session. Safe to call multiple times.
 */
function unlock() {
  if (unlocked || typeof window === "undefined") return;
  const audio = getAudio();
  const prev = audio.volume;
  audio.volume = 0;
  audio.play().then(() => {
    audio.pause();
    audio.currentTime = 0;
    audio.volume = prev;
    unlocked = true;
  }).catch(() => {});
}

export function useGoatSound() {
  /** Call during a click handler (before any await) to unlock audio. */
  const prime = useCallback(() => {
    if (!getEnabled()) return;
    unlock();
  }, []);

  const play = useCallback(() => {
    if (!getEnabled()) return;
    const audio = getAudio();
    audio.currentTime = 0;
    audio.play().catch(() => {
      // autoplay blocked — ignore
    });
  }, []);

  const isEnabled = useCallback((): boolean => getEnabled(), []);

  const setEnabled = useCallback((enabled: boolean) => {
    localStorage.setItem(STORAGE_KEY, String(enabled));
  }, []);

  return { play, prime, isEnabled, setEnabled };
}
