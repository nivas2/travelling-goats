// Iconic landmark photos for pickup/starting cities, keyed by normalized city
// name. Sourced from Unsplash (the only remote image host our CSP allows, see
// next.config.ts img-src) and verified to show the correct monument.
// Cities without an entry fall back to their generic icon/pin.
const LANDMARK_PHOTO_IDS: Record<string, string> = {
  bengaluru: "1698332137428-3c4296198e8f", // Vidhana Soudha (golden dome, centred)
  bangalore: "1698332137428-3c4296198e8f",
  hyderabad: "1741545979534-02f59c742730", // Charminar
};

const normalize = (name: string) => name.trim().toLowerCase().replace(/\s+/g, "");

/**
 * Square, smart-cropped landmark image for a city (or null if we don't have
 * one). The `crop=entropy` square crop keeps the monument centred and legible
 * even in a small rounded thumbnail.
 */
export function cityLandmark(name: string, size = 96): string | null {
  const id = LANDMARK_PHOTO_IDS[normalize(name)];
  return id
    ? `https://images.unsplash.com/photo-${id}?w=${size}&h=${size}&fit=crop&crop=entropy&q=75&auto=format`
    : null;
}
