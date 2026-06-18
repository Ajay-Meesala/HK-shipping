import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const OPENROUTER_KEY  = process.env.GEMINI_API_KEY;
const OPENROUTER_BASE = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const MODEL           = 'google/gemini-flash-1.5';

async function chat(systemPrompt, userPrompt) {
  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${OPENROUTER_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt },
      ],
      max_tokens: 512,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini/OpenRouter error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() ?? '';
}

/**
 * Generate a short trip summary from trip metadata.
 */
export async function generateTripSummary(trip) {
  const system = 'You are a logistics AI assistant for HK Shipping Fleet Management. Be concise.';
  const user   = `Summarise this trip in 2-3 sentences for a dispatcher:
Pickup: ${trip.pickup_location}
Drop: ${trip.drop_location}
Goods: ${trip.goods_type} (${trip.weight})
Driver: ${trip.driver_name}
Vehicle: ${trip.vehicle_number} (${trip.vehicle_type})
Status: ${trip.status}
Duration: ${trip.start_time ? `started ${trip.start_time}` : 'not started'}${trip.end_time ? `, ended ${trip.end_time}` : ''}`;

  return chat(system, user);
}

/**
 * Detect anomalies or risks from a list of active trips.
 */
export async function detectAnomalies(trips) {
  if (!trips.length) return 'No active trips to analyse.';

  const system = 'You are a fleet risk analyst for HK Shipping. Identify any risks or anomalies concisely.';
  const tripLines = trips.map(t =>
    `- Trip #${t.id}: ${t.pickup_location} → ${t.drop_location}, status: ${t.status}, driver: ${t.driver_name}, vehicle: ${t.vehicle_number}`
  ).join('\n');

  return chat(system, `Analyse these active trips for risks or delays:\n${tripLines}`);
}
