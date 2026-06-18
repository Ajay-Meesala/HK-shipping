import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const NB_KEY = process.env.NEXTBILLION_API_KEY;
const NB_BASE = 'https://api.nextbillion.io';

/**
 * Get directions / route between two points using NextBillion.
 * @param {string} origin      - "lat,lng"
 * @param {string} destination - "lat,lng"
 * @param {string} mode        - car | truck | motorcycle (default: truck)
 */
export async function getRoute(origin, destination, mode = 'truck') {
  const url = `${NB_BASE}/directions/json?origin=${origin}&destination=${destination}&mode=${mode}&key=${NB_KEY}`;

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`NextBillion directions error ${res.status}: ${text}`);
  }

  const data = await res.json();
  if (data.status !== 'Ok') {
    throw new Error(`NextBillion route failed: ${data.status}`);
  }

  const route = data.routes?.[0];
  return {
    distance_m: route?.distance,
    duration_s: route?.duration,
    polyline:   route?.geometry,
    legs:       route?.legs ?? [],
  };
}

/**
 * Geocode a place name or address to lat/lng using NextBillion.
 * @param {string} address
 */
export async function geocode(address) {
  const url = `${NB_BASE}/geocoding/v1/forward?q=${encodeURIComponent(address)}&key=${NB_KEY}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`NextBillion geocode error ${res.status}`);

  const data = await res.json();
  const feature = data.features?.[0];
  if (!feature) throw new Error(`No geocode result for: ${address}`);

  const [lng, lat] = feature.geometry.coordinates;
  return { lat, lng, display_name: feature.properties?.label };
}

/**
 * Get estimated travel time between two addresses (string or "lat,lng").
 * Returns { distance_km, duration_min, polyline }
 */
export async function estimateTrip(pickupAddress, dropAddress) {
  // Try to geocode if not already coordinates
  const toCoord = async (addr) => {
    if (/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(addr)) return addr;
    const g = await geocode(addr);
    return `${g.lat},${g.lng}`;
  };

  const [origin, destination] = await Promise.all([
    toCoord(pickupAddress),
    toCoord(dropAddress),
  ]);

  const route = await getRoute(origin, destination);
  return {
    distance_km:  +(route.distance_m / 1000).toFixed(2),
    duration_min: Math.round(route.duration_s / 60),
    polyline:     route.polyline,
  };
}
