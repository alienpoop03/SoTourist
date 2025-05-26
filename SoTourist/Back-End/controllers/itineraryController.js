// itinerarycontroller.js
const axios = require('axios');

/**
 * Genera un itinerario sfruttando Google Places API.
 * Ora supporta:
 *   - mustSee[] : luoghi obbligatori da visitare (non prima del blocco)
 *   - mustEat[] : ristoranti obbligatori (prima tappa del blocco)
 *   - avoid[]   : luoghi da evitare sempre
 * Tutti i parametri sono opzionali.
 */
const getItinerary = async (req, res) => {
  /* ---------- parametri base ---------- */
  const city           = req.body?.city           || req.query.city           || 'Roma';
  const totalDays      = parseInt(req.body?.totalDays || req.query.totalDays) || 1;
  const accommodation  = req.body?.accommodation  || req.query.accommodation  || null;

  /* ---------- preferenze opzionali ---------- */
  const mustSee = Array.isArray(req.body?.mustSee) ? req.body.mustSee : [];
  const mustEat = Array.isArray(req.body?.mustEat) ? req.body.mustEat : [];
  const avoid   = Array.isArray(req.body?.avoid)   ? req.body.avoid   : [];

  const avoidSet = new Set(avoid.map(n => n.toLowerCase()));

  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
  const usedPlaceNames = new Set();                       // evitiamo duplicati
  let   coverPhoto     = null;

  /* ---------- helper per Places API ---------- */
  const fetchPlaces = async (query, count = 1) => {
    const resp = await axios.get(
      'https://maps.googleapis.com/maps/api/place/textsearch/json',
      { params: { query: `${query} in ${city}`, key: GOOGLE_API_KEY } }
    );

    const filtered = resp.data.results.filter(p =>
      p.geometry?.location &&
      !usedPlaceNames.has(p.name.toLowerCase()) &&
      !avoidSet.has(p.name.toLowerCase())
    );

    const selected = filtered.slice(0, count).map(place => {
      usedPlaceNames.add(place.name.toLowerCase());

      /* set coverPhoto se ancora mancante */
      if (!coverPhoto && place.photos?.[0]?.photo_reference) {
        coverPhoto =
          `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1000&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_API_KEY}`;
      }

      return {
        name: place.name,
        address: place.formatted_address,
        rating: place.rating,
        photo: place.photos?.[0]
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1000&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_API_KEY}`
          : null,
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng
      };
    });

    return selected;
  };

  /* ---------- cover di default (attrazione iconica) ---------- */
  try {
    const iconRes = await axios.get(
      'https://maps.googleapis.com/maps/api/place/textsearch/json',
      { params: { query: `attrazione più famosa di ${city}`, key: GOOGLE_API_KEY } }
    );
    const top = iconRes.data.results?.[0];
    if (top?.photos?.[0]?.photo_reference) {
      coverPhoto =
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1000&photoreference=${top.photos[0].photo_reference}&key=${GOOGLE_API_KEY}`;
    }
  } catch { /* non blocca il flusso in caso d’errore */ }

  /* ---------- struttura ricerche standard ---------- */
  const baseStructure = {
    morning:   [ { query: 'caffè bar colazione',  count: 1 },
                 { query: 'attrazioni turistiche', count: 1 } ],
    afternoon: [ { query: 'ristoranti per pranzo', count: 1 },
                 { query: 'parchi o musei',        count: 1 } ],
    evening:   [ { query: 'ristoranti per cena',   count: 1 },
                 { query: 'pub cocktail bar',      count: 1 } ]
  };

  /* ---------- distribuzione random dei must* ---------- */
  const randomSlot = (type) => {
    if (type === 'eat') return Math.random() < 0.5 ? 'afternoon' : 'evening';
    return ['morning', 'afternoon', 'evening'][Math.floor(Math.random() * 3)];
  };

  const personalization = {}; // { day: { morning:[], afternoon:[], evening:[] } }

  const assignRandom = (list, type) => {
    for (const name of list) {
      const day     = Math.floor(Math.random() * totalDays) + 1;          // 1-based
      const section = randomSlot(type);
      personalization[day] ??= { morning: [], afternoon: [], evening: [] };
      personalization[day][section].push({ name, type });
    }
  };

  assignRandom(mustSee, 'see');
  assignRandom(mustEat, 'eat');

  /* ---------- eventuale geolocalizzazione alloggio ---------- */
  let accommodationPlace = null;
  if (accommodation) {
    try {
      const acc = await axios.get(
        'https://maps.googleapis.com/maps/api/place/textsearch/json',
        { params: { query: accommodation, key: GOOGLE_API_KEY } }
      );
      const first = acc.data.results?.[0];
      if (first?.geometry?.location) {
        accommodationPlace = {
          name: 'Torna all\'alloggio',
          address: first.formatted_address,
          photo: null,
          latitude: first.geometry.location.lat,
          longitude: first.geometry.location.lng
        };
      }
    } catch { /* non blocca il flusso */ }
  }

  /* ---------- generazione itinerario ---------- */
  const itinerary = [];

  for (let dayIdx = 1; dayIdx <= totalDays; dayIdx++) {
    const plan = { day: dayIdx, morning: [], afternoon: [], evening: [] };
    const pers = personalization[dayIdx] || plan; // default vuoto

    for (const [section, queries] of Object.entries(baseStructure)) {

      /* --- 1) mustEat → prima posizione --- */
      const eatItems = (pers[section] || []).filter(x => x.type === 'eat');
      for (const { name } of eatItems) {
        const [place] = await fetchPlaces(name, 1);
        if (place) plan[section].push(place);        // sempre all'inizio
      }

      /* --- 2) ricerche standard --- */
      for (const { query, count } of queries) {
        const found = await fetchPlaces(query, count);
        plan[section].push(...found);
      }

      /* --- 3) mustSee → posizione random, NON indice 0 se possibile --- */
      const seeItems = (pers[section] || []).filter(x => x.type === 'see');
      for (const { name } of seeItems) {
        const [place] = await fetchPlaces(name, 1);
        if (!place) continue;

        if (plan[section].length === 0) {
          plan[section].push(place);                 // unico caso in cui finisce primo
        } else {
          const idx = 1 + Math.floor(Math.random() * plan[section].length);
          plan[section].splice(idx, 0, place);       // inserisce da indice 1 in poi
        }
      }
    }

    /* ordered -> concatenazione cronologica */
    plan.ordered = [...plan.morning, ...plan.afternoon, ...plan.evening];
    if (accommodationPlace) plan.ordered.push(accommodationPlace);

    itinerary.push(plan);
  }

  /* ---------- risposta ---------- */
  res.json({ itinerary, coverPhoto });
};

module.exports = { getItinerary };
