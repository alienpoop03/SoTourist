const axios = require("axios");

/* ------------------------------------------------------------------ */
/* ⚙️  Helpers                                                         */
/* ------------------------------------------------------------------ */

/**
 * Generic util: build a standard place object from Place Details / Text Search
 */
const buildPlaceObj = (place, key) => {
  return {
    placeId: place.place_id,
    name: place.name,
    address: place.formatted_address,
    rating: place.rating,
    photo: place.photos?.[0]
      ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1000&photoreference=${place.photos[0].photo_reference}&key=${key}`
      : null,
    latitude: place.geometry?.location?.lat,
    longitude: place.geometry?.location?.lng,
  };
};

/**
 * Fetch **one** place by **placeId** via Place Details API.
 * Returns `null` if the place is in `avoidIdSet` or already in `usedPlaceIds`.
 */
const fetchPlaceById = async (
  placeId,
  key,
  usedPlaceIds = new Set(),
  avoidIdSet = new Set(),
  setCoverPhoto = () => {}
) => {
  if (avoidIdSet.has(placeId) || usedPlaceIds.has(placeId)) return null;

  const resp = await axios.get(
    "https://maps.googleapis.com/maps/api/place/details/json",
    {
      params: {
        place_id: placeId,
        key,
        // grab only what we need to reduce quota
        fields: "place_id,name,formatted_address,geometry,photos,rating",
      },
    }
  );

  const place = resp.data?.result;
  if (!place || !place.geometry?.location) return null;

  usedPlaceIds.add(placeId);

  // set cover photo (only once)
  if (place.photos?.[0]?.photo_reference) {
    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1000&photoreference=${place.photos[0].photo_reference}&key=${key}`;
    setCoverPhoto(photoUrl);
  }

  return buildPlaceObj(place, key);
};

/**
 * Text Search wrapper (previous behaviour) – still useful for generic queries.
 */
const fetchPlaces = async (
  query,
  city,
  key,
  usedPlaceIds = new Set(),
  avoidIdSet = new Set(),
  count = 1,
  setCoverPhoto = () => {}
) => {
  const resp = await axios.get(
    "https://maps.googleapis.com/maps/api/place/textsearch/json",
    { params: { query: `${query} in ${city}`, key } }
  );

  const filtered = resp.data.results.filter(
    (p) =>
      p.geometry?.location &&
      !usedPlaceIds.has(p.place_id) &&
      !avoidIdSet.has(p.place_id)
  );

  const selected = filtered.slice(0, count).map((place) => {
    usedPlaceIds.add(place.place_id);

    if (place.photos?.[0]?.photo_reference) {
      const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1000&photoreference=${place.photos[0].photo_reference}&key=${key}`;
      setCoverPhoto(photoUrl);
    }

    return buildPlaceObj(place, key);
  });

  return selected;
};

/* ------------------------------------------------------------------ */
/* 🚀 1) GET / POST /api/itinerary → genera un itinerario completo     */
/* ------------------------------------------------------------------ */
const getItinerary = async (req, res) => {
  /* ---------- parametri base ---------- */
  const city = req.body?.city || req.query.city || "Roma";
  const totalDays = parseInt(req.body?.totalDays || req.query.totalDays) || 1;
  const accommodation = req.body?.accommodation || req.query.accommodation || null;

  /* ---------- preferenze opzionali (ORA SOLO placeId) ---------- */
  const mustSee = Array.isArray(req.body?.mustSee) ? req.body.mustSee : [];
  const mustEat = Array.isArray(req.body?.mustEat) ? req.body.mustEat : [];
  const avoid = Array.isArray(req.body?.avoid) ? req.body.avoid : [];

  const avoidIdSet = new Set(avoid); // ⬅️  filtro principale
  const usedPlaceIds = new Set(); // evita duplicati globali

  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
  let coverPhoto = null;
  const setCoverPhoto = (url) => {
    if (!coverPhoto) coverPhoto = url;
  };

  /* ---------- cover di default (attrazione iconica) ---------- */
  try {
    const icon = await axios.get(
      "https://maps.googleapis.com/maps/api/place/textsearch/json",
      { params: { query: `attrazione più famosa di ${city}`, key: GOOGLE_API_KEY } }
    );
    const top = icon.data.results?.[0];
    if (top?.photos?.[0]?.photo_reference) {
      coverPhoto = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1000&photoreference=${top.photos[0].photo_reference}&key=${GOOGLE_API_KEY}`;
    }
  } catch {/* silenzioso */}

  /* ---------- struttura ricerche standard ---------- */
  const baseStructure = {
    morning: [
      { query: "caffè bar colazione", count: 1 },
      { query: "attrazioni turistiche", count: 1 },
    ],
    afternoon: [
      { query: "ristoranti per pranzo", count: 1 },
      { query: "parchi o musei", count: 1 },
    ],
    evening: [
      { query: "ristoranti per cena", count: 1 },
      { query: "pub cocktail bar", count: 1 },
    ],
  };

  /* ---------- helper random ---------- */
  const randomSlot = (type) =>
    type === "eat"
      ? Math.random() < 0.5
        ? "afternoon"
        : "evening"
      : ["morning", "afternoon", "evening"][Math.floor(Math.random() * 3)];

  /* ---------- Personalizzazione: assegna placeId a giorno/slot random ---------- */
  const personalization = {}; // { day: { morning:[], afternoon:[], evening:[] } }
  const assignRandomIds = (list, type) => {
    for (const id of list) {
      const day = Math.floor(Math.random() * totalDays) + 1; // 1‑based
      const sec = randomSlot(type);
      personalization[day] ??= { morning: [], afternoon: [], evening: [] };
      personalization[day][sec].push({ id, type });
    }
  };
  assignRandomIds(mustSee, "see");
  assignRandomIds(mustEat, "eat");

  /* ---------- alloggio ---------- */
  let accommodationPlace = null;
  if (accommodation) {
    try {
      const [accPlace] = await fetchPlaces(
        accommodation,
        city,
        GOOGLE_API_KEY,
        usedPlaceIds,
        avoidIdSet
      );

      if (accPlace) {
        accommodationPlace = {
          ...accPlace,
          name: "Torna all’alloggio",
          type: "accommodation",
          note: "",
        };
      }
    } catch (err) {
      console.warn("⚠️  Errore fetch alloggio:", err);
    }
  }

  /* ---------- generazione itinerario ---------- */
  const itinerary = [];

  for (let dayIdx = 1; dayIdx <= totalDays; dayIdx++) {
    const plan = { day: dayIdx, morning: [], afternoon: [], evening: [] };
    const pers = personalization[dayIdx] || plan; // default vuoto

    for (const [section, queries] of Object.entries(baseStructure)) {
      /* 1) mustEat in testa */
      for (const { id } of (pers[section] || []).filter((x) => x.type === "eat")) {
        const place = await fetchPlaceById(id, GOOGLE_API_KEY, usedPlaceIds, avoidIdSet, setCoverPhoto);
        if (place) plan[section].push(place);
      }

      /* 2) ricerche standard */
      for (const { query, count } of queries) {
        const found = await fetchPlaces(
          query,
          city,
          GOOGLE_API_KEY,
          usedPlaceIds,
          avoidIdSet,
          count,
          setCoverPhoto
        );
        plan[section].push(...found);
      }

      /* 3) mustSee in posizione random (≥1) */
      for (const { id } of (pers[section] || []).filter((x) => x.type === "see")) {
        const place = await fetchPlaceById(id, GOOGLE_API_KEY, usedPlaceIds, avoidIdSet, setCoverPhoto);
        if (!place) continue;
        if (plan[section].length === 0) {
          plan[section].push(place);
        } else {
          const idx = 1 + Math.floor(Math.random() * plan[section].length);
          plan[section].splice(idx, 0, place);
        }
      }
    }

    /* ➕ duplica l’alloggio: inizio mattina + fine sera */
    if (accommodationPlace) {
      plan.morning.unshift({ ...accommodationPlace, timeSlot: "morning" });
      plan.evening.push({ ...accommodationPlace, timeSlot: "evening" });
    }

    /* ricostruisci 'ordered' sempre */
    plan.ordered = [...plan.morning, ...plan.afternoon, ...plan.evening];
    itinerary.push(plan);
  }

  res.json({ itinerary, coverPhoto });
};

/* ------------------------------------------------------------------ */
/* 🚀 2) GET /api/itinerary/single-place                               */
/* ------------------------------------------------------------------ */
const getSinglePlace = async (req, res) => {
  const query = req.query.query;
  const city = req.query.city;
  if (!query || !city)
    return res.status(400).json({ error: "Parametri query e city obbligatori" });

  try {
    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
    const [place] = await fetchPlaces(query, city, GOOGLE_API_KEY);
    if (!place) return res.status(404).json({ error: "Luogo non trovato" });
    res.json(place);
  } catch (err) {
    console.error("❌ Errore getSinglePlace:", err);
    res.status(500).json({ error: "Errore interno" });
  }
};

/* ------------------------------------------------------------------ */
module.exports = {
  getItinerary,
  getSinglePlace,
};