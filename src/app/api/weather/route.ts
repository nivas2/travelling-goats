import { NextRequest, NextResponse } from "next/server";

/**
 * Current weather for a place, server-side (the browser CSP blocks external
 * calls; the server isn't subject to connect-src). Uses Open-Meteo — free and
 * keyless — for both forward geocoding and the current conditions. Returns a
 * compact, UI-ready payload (temp, feels-like, humidity, condition + misty /
 * humid flags) used by the trip detail weather module.
 */

// WMO weather-code → human label + Material Symbol + mood flags.
function describe(code: number): {
  condition: string;
  icon: string;
  misty: boolean;
} {
  if (code === 0) return { condition: "Clear sky", icon: "clear_day", misty: false };
  if (code === 1) return { condition: "Mostly clear", icon: "partly_cloudy_day", misty: false };
  if (code === 2) return { condition: "Partly cloudy", icon: "partly_cloudy_day", misty: false };
  if (code === 3) return { condition: "Overcast", icon: "cloud", misty: false };
  if (code === 45 || code === 48) return { condition: "Misty & foggy", icon: "foggy", misty: true };
  if (code >= 51 && code <= 57) return { condition: "Light drizzle", icon: "rainy", misty: true };
  if (code >= 61 && code <= 67) return { condition: "Rainy", icon: "rainy", misty: false };
  if (code >= 71 && code <= 77) return { condition: "Snowfall", icon: "weather_snowy", misty: false };
  if (code >= 80 && code <= 82) return { condition: "Rain showers", icon: "rainy", misty: false };
  if (code >= 85 && code <= 86) return { condition: "Snow showers", icon: "weather_snowy", misty: false };
  if (code >= 95) return { condition: "Thunderstorm", icon: "thunderstorm", misty: false };
  return { condition: "Fair", icon: "partly_cloudy_day", misty: false };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  let lat = searchParams.get("lat");
  let lng = searchParams.get("lng");
  const place = searchParams.get("place");

  try {
    // Forward-geocode the place name when no coordinates are supplied. Names are
    // ambiguous ("Goa" also matches Italy), so we bias toward the state/country
    // hint in the destination (e.g. "Coorg, Karnataka") and then toward India,
    // since this app's trips are India-first.
    if ((!lat || !lng) && place) {
      // Precise overrides for ambiguous / multi-city destinations where name
      // geocoding picks the wrong place (e.g. "Goa" → Italy).
      const COORDS: Record<string, [number, number]> = {
        goa: [15.4, 73.9],
        pondicherry: [11.9139, 79.8145],
        puducherry: [11.9139, 79.8145],
        "wayanad, kerala": [11.605, 76.083],
        wayanad: [11.605, 76.083],
        "jaipur - jodhpur - jaisalmer, rajasthan": [26.9124, 75.7873],
      };
      const override = COORDS[place.trim().toLowerCase()];
      if (override) {
        lat = String(override[0]);
        lng = String(override[1]);
      }

      const parts = place.split(",").map((s) => s.trim()).filter(Boolean);
      const hint = parts.slice(1).join(" ").toLowerCase();
      // A few Indian hill destinations Open-Meteo indexes under another name.
      const aliases: Record<string, string> = {
        coorg: "Madikeri",
        kodagu: "Madikeri",
        ooty: "Udagamandalam",
      };
      // Multi-city strings ("Jaipur - Jodhpur - …") → use the first city.
      const firstCity = parts[0].split(/\s[-–]\s/)[0].trim();
      const primary = aliases[firstCity.toLowerCase()] || firstCity;

      if (!lat || !lng) {
        const g = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
            primary
          )}&count=10&language=en&format=json`,
          { cache: "no-store", signal: AbortSignal.timeout(6000) }
        );
        const gj = await g.json();
        const results: Array<{
          latitude: number;
          longitude: number;
          admin1?: string;
          country?: string;
          country_code?: string;
        }> = gj?.results ?? [];

        const hit =
          (hint &&
            results.find(
              (r) =>
                (r.admin1 || "").toLowerCase().includes(hint) ||
                (r.country || "").toLowerCase().includes(hint) ||
                hint.includes((r.country || "").toLowerCase())
            )) ||
          results.find((r) => r.country_code === "IN") ||
          results[0];

        if (hit) {
          lat = String(hit.latitude);
          lng = String(hit.longitude);
        }
      }
    }

    if (!lat || !lng) return NextResponse.json({ available: false });

    const w = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(
        lat
      )}&longitude=${encodeURIComponent(
        lng
      )}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m`,
      { cache: "no-store", signal: AbortSignal.timeout(6000) }
    );
    if (!w.ok) return NextResponse.json({ available: false });
    const wj = await w.json();
    const c = wj?.current;
    if (!c) return NextResponse.json({ available: false });

    const meta = describe(Number(c.weather_code));
    const humidity = Math.round(Number(c.relative_humidity_2m));

    return NextResponse.json({
      available: true,
      tempC: Math.round(Number(c.temperature_2m)),
      feelsLikeC: Math.round(Number(c.apparent_temperature)),
      humidity,
      windKph: Math.round(Number(c.wind_speed_10m)),
      condition: meta.condition,
      icon: meta.icon,
      misty: meta.misty,
      humid: humidity >= 70,
      lat: Number(lat),
      lng: Number(lng),
    });
  } catch {
    return NextResponse.json({ available: false });
  }
}
