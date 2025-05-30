/* ------------------------------------------------------------------ */
/*  SoTourist – Itinerary Controller (v. “slot chaining 2.0”)          */
/*  ▸ Inter-slot dinamico con raggio MIN–MAX per mezzo                 */
/*  ▸ Intra-slot sempre raggio compatto                                */
/*  ▸ Logica speciale BUS (mattina lunga, sera rientro)                */
/* ------------------------------------------------------------------ */
require("dotenv").config();
const axios = require("axios");

/* ------------------------------------------------------------------ */
/* ⚙️  Helpers                                                         */
/* ------------------------------------------------------------------ */
const haversine = (a, b) => {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

const buildPlaceObj = (place, key) => ({
  placeId: place.place_id,
  name: place.name,
  address: place.formatted_address,
  rating: place.rating,
  photo: place.photos?.[0]
    ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1000&photoreference=${place.photos[0].photo_reference}&key=${key}`
    : null,
  latitude: place.geometry?.location?.lat,
  longitude: place.geometry?.location?.lng,
});

/* --- text-search helper (supporta min & max radius) ---------------- */
const fetchPlaces = async (
  query,
  city,
  key,
  used = new Set(),
  avoid = new Set(),
  count = 1,
  setCover = () => { },
  anchor = null,
  initialRadius = null
) => {
  const baseParams = { query: `${query} in ${city}`, key };
  const doTextSearch = params =>
    axios.get("https://maps.googleapis.com/maps/api/place/textsearch/json", { params });
  let radius = initialRadius;

  // 1) PROVA RIPETUTA: raggio crescente (se ne hai uno passato)
  for (let attempt = 0; attempt < 4; attempt++) {
    const params = { ...baseParams };
    if (anchor && radius) {
      params.location = `${anchor.lat},${anchor.lng}`;
      params.radius = radius;
    }
    const resp = await doTextSearch(params);
    if (resp.data.status === "OK" && resp.data.results.length) {
      const results = resp.data.results.filter(p => {
        if (!p.geometry?.location) return false;
        if (used.has(p.place_id) || avoid.has(p.place_id)) return false;
        return true;
      });
      if (results.length) {
        // shuffle per variare la scelta, ma la commentiamo per ora perchè non vogliamo cose random
        /*
        for (let i = results.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [results[i], results[j]] = [results[j], results[i]];
        } */
        return results.slice(0, count).map(p => {
          used.add(p.place_id);
          if (p.photos?.[0]?.photo_reference) {
            setCover(
              `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1000&photoreference=${p.photos[0].photo_reference}&key=${key}`
            );
          }
          return buildPlaceObj(p, key);
        });
      }
    }
    // aumenta il raggio per il prossimo tentativo
    radius = radius ? radius * 2 : 5000;
  }

  // 2) FALLBACK su Find Place From Text  
  try {
    const fp = await axios.get(
      "https://maps.googleapis.com/maps/api/place/findplacefromtext/json",
      {
        params: {
          input: `${query} in ${city}`,
          inputtype: "textquery",
          fields: "place_id,name,formatted_address,geometry,photos,rating",
          key,
        },
      }
    );
    const cand = fp.data.candidates?.[0];
    if (cand && cand.geometry?.location) {
      used.add(cand.place_id);
      if (cand.photos?.[0]?.photo_reference) {
        setCover(
          `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1000&photoreference=${cand.photos[0].photo_reference}&key=${key}`
        );
      }
      return [buildPlaceObj(cand, key)];
    }
  } catch (e) {
    console.warn("⚠️ findplacefromtext fallback failed:", e.message);
  }

  // 3) FALLBACK ASSOLUTO placeholder
  console.error(`❌ Nessun risultato reale per "${query}", uso placeholder.`);
  const fake = {
    place_id: `placeholder_${query.replace(/\s+/g, "_")}_${Date.now()}`,
    name: `Luogo generico per "${query}"`,
    formatted_address: city,
    rating: 0,
    photos: [],
    geometry: { location: anchor || { lat: 0, lng: 0 } }
  };
  return [buildPlaceObj(fake, key)];
};


const fetchPlaceById = async (
  id,
  key,
  used,
  avoid,
  setCover = () => { }
) => {
  if (avoid.has(id) || used.has(id)) return null;

  const { data } = await axios.get(
    "https://maps.googleapis.com/maps/api/place/details/json",
    { params: { place_id: id, key, fields: "place_id,name,formatted_address,geometry,photos,rating" } }
  );

  const p = data?.result;
  if (!p?.geometry?.location) return null;

  used.add(id);

  if (p.photos?.[0]?.photo_reference)
    setCover(
      `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1000&photoreference=${p.photos[0].photo_reference}&key=${key}`
    );

  return buildPlaceObj(p, key);
};

/* ------------------------------------------------------------------ */
/* 🚀  GET|POST /api/itinerary                                         */
/* ------------------------------------------------------------------ */
const getItinerary = async (req, res) => {
  const city = req.body?.city || req.query.city || "Roma";
  const totalDays = parseInt(req.body?.totalDays || req.query.totalDays) || 1;
  const accommodation = req.body?.accommodation || req.query.accommodation || null;
  const transport = (req.body?.transport || req.query.transport || "walk").toLowerCase();
  console.log("🚗 Mezzo ricevuto:", transport);
  const style = req.body?.style || req.query.style || "Standard";
  console.log("🎯 Stile scelto:", style);

  /* --- preferenze opzionali --------------------------------------- */
  const mustSee = Array.isArray(req.body?.mustSee) ? req.body.mustSee : [];
  const mustEat = Array.isArray(req.body?.mustEat) ? req.body.mustEat : [];
  const avoid = Array.isArray(req.body?.avoid) ? req.body.avoid : [];

  const used = new Set();
  const avoidSet = new Set(avoid);

  const KEY = process.env.GOOGLE_API_KEY;
  let coverPhoto = null;
  const setCover = (u) => { if (!coverPhoto) coverPhoto = u; };

  /* --- coordinate centro città ------------------------------------ */
  let cityCenter = null;
  try {
    const geo = await axios.get(
      "https://maps.googleapis.com/maps/api/geocode/json",
      { params: { address: city, key: KEY } }
    );
    cityCenter = geo.data.results[0]?.geometry?.location || null;
  } catch {/* ignore */ }

  /* --- radius rule-set -------------------------------------------- */
  const WITHIN_SLOT = 700;
  const INTER_RULES = {
    walk: { min: 0, max: 700 },
    car: { min: 2000, max: 10000 },
    bike: { min: 1000, max: 5000 },
    bus: { min: 2000, max: 10000 }  // bus mattina + pomeriggio; sera custom
  };
  const R = INTER_RULES[transport] || INTER_RULES.walk;
  const stylePresets = {
    "Standard": {
      morning: [
        { q: "caffè bar colazione", c: 1 },
        { q: "attrazioni turistiche", c: 1, type: "see" }
      ],
      afternoon: [
        { q: "ristoranti per pranzo", c: 1, type: "eat" },
        { q: "parchi o musei", c: 1, type: "see" }
      ],
      evening: [
        { q: "ristoranti per cena", c: 1, type: "eat" },
        { q: "pub cocktail bar", c: 1, type: "eat" }
      ]
    },

    "Giornata nei musei": {
      morning: [
        { q: "caffè bar colazione", c: 1 },
        { q: "musei famosi", c: 2, type: "see" }
      ],
      afternoon: [
        { q: "ristoranti per pranzo", c: 1, type: "eat" },
        { q: "mostre d'arte", c: 2, type: "see" }
      ],
      evening: [
        { q: "ristoranti per cena", c: 1, type: "eat" },
        { q: "teatri o spettacoli", c: 1 }
      ]
    },

    "Shopping": {
      morning: [
        { q: "caffè bar colazione", c: 1 },
        { q: "zone commerciali e boutique", c: 2, type: "see" }
      ],
      afternoon: [
        { q: "ristoranti per pranzo", c: 1, type: "eat" },
        { q: "centri commerciali", c: 2, type: "see" }
      ],
      evening: [
        { q: "ristoranti per cena", c: 1, type: "eat" },
        { q: "locali di tendenza", c: 1, type: "eat" }
      ]
    },

    "Avventura": {
      morning: [
        { q: "caffè bar colazione", c: 1 },
        { q: "escursioni e percorsi naturalistici", c: 2, type: "see" }
      ],
      afternoon: [
        { q: "ristoranti per pranzo", c: 1, type: "eat" },
        { q: "sport outdoor", c: 2, type: "see" }
      ],
      evening: [
        { q: "ristoranti per cena", c: 1, type: "eat" },
        { q: "pub locali", c: 1, type: "eat" }
      ]
    },

    "Food Tour": {
      morning: [
        { q: "pasticcerie famose", c: 1, type: "eat" },
        { q: "mercati alimentari", c: 1, type: "eat" }
      ],
      afternoon: [
        { q: "ristoranti tipici", c: 2, type: "eat" }
      ],
      evening: [
        { q: "degustazioni vino e formaggi", c: 1, type: "eat" },
        { q: "ristoranti gourmet", c: 1, type: "eat" }
      ]
    },

    "Relax": {
      morning: [
        { q: "spa e centri benessere", c: 1, type: "see" },
        { q: "parchi tranquilli", c: 1, type: "see" }
      ],
      afternoon: [
        { q: "ristoranti per pranzo", c: 1, type: "eat" },
        { q: "passeggiate panoramiche", c: 1, type: "see" }
      ],
      evening: [
        { q: "ristoranti per cena", c: 1, type: "eat" },
        { q: "bar panoramici", c: 1, type: "eat" }
      ]
    }
  };




  /* --- eventuale alloggio ----------------------------------------- */
  let accPlace = null;
  if (accommodation) {
    const [acc] = await fetchPlaces(
      accommodation, city, KEY, used, avoidSet, 1, setCover,
      cityCenter, WITHIN_SLOT
    );
    if (acc) accPlace = { ...acc, name: "Torna all’alloggio", type: "accommodation" };
  }

  /* ---------------------------------------------------------------- */
  /* 🧠 loop giorni – slot chaining dinamico con gestione must/avoid   */
  /* ---------------------------------------------------------------- */
  const itinerary = [];

  const slots = ["morning", "afternoon", "evening"];
  const base = stylePresets[style] || stylePresets["Standard"];


  for (let d = 1; d <= totalDays; d++) {
    const plan = { day: d, morning: [], afternoon: [], evening: [] };

    // anchor iniziale: alloggio o centro città
    let anchor = accPlace
      ? { lat: accPlace.latitude, lng: accPlace.longitude }
      : cityCenter;

    for (const slot of slots) {
      for (const def of base[slot]) {
        let minR = null, maxR = null;
        const customPlaces = [];

        if (def.type === "see") {
          while (mustSee.length && customPlaces.length < def.c) {
            const placeId = mustSee.shift();
            const place = await fetchPlaceById(placeId, KEY, used, avoidSet, setCover);
            if (place) customPlaces.push(place);
          }
        } else if (def.type === "eat") {
          while (mustEat.length && customPlaces.length < def.c) {
            const placeId = mustEat.shift();
            const place = await fetchPlaceById(placeId, KEY, used, avoidSet, setCover);
            if (place) customPlaces.push(place);
          }
        }

        if (customPlaces.length < def.c) {
          const remaining = def.c - customPlaces.length;
          const places = await fetchPlaces(
            def.q, city, KEY, used, avoidSet, remaining, setCover,
            anchor, maxR, minR
          );
          customPlaces.push(...places);
        }

        for (const p of customPlaces) {
          plan[slot].push(p);
          anchor = { lat: p.latitude, lng: p.longitude };
        }
      }

    }

    // rientro serale all’alloggio
    if (accPlace) {
      plan.evening.push({ ...accPlace, timeSlot: "evening" });
    }

    // array ordinato (opzionale)
    plan.ordered = [
      ...plan.morning,
      ...plan.afternoon,
      ...plan.evening
    ];

    itinerary.push(plan);
  }




  res.json({ itinerary, coverPhoto });
};

/* ------------------------------------------------------------------ */
/* 🚀  GET /api/itinerary/single-place (invariato)                     */
/* ------------------------------------------------------------------ */
const getSinglePlace = async (req, res) => {
  const { query, city } = req.query;
  if (!query || !city) return res.status(400).json({ error: "query & city obbligatori" });

  try {
    const KEY = process.env.GOOGLE_API_KEY;
    const [p] = await fetchPlaces(query, city, KEY);
    if (!p) return res.status(404).json({ error: "Luogo non trovato" });
    res.json(p);
  } catch (err) {
    console.error("❌ getSinglePlace:", err);
    res.status(500).json({ error: "Errore interno" });
  }
};

module.exports = { getItinerary, getSinglePlace };