/* ------------------------------------------------------------------ */
/*  SoTourist – Itinerary Controller  (v. “nearby search 1.0”)         */
/*  ▸ Tutte le ricerche ora via Nearby Search                          */
/*  ▸ Inter-slot dinamico con raggio MIN–MAX per mezzo                */
/*  ▸ Intra-slot sempre raggio compatto                               */
/*  ▸ Logica speciale BUS (mattina lunga, sera rientro)               */
/* ------------------------------------------------------------------ */
const fs = require("fs");
const path = require("path");

require("dotenv").config();
const axios = require("axios");
const { getOrDownloadPhoto } = require("../services/photoManager"); // path corretto

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

const buildPlaceObj = (place, key) => {
  const localPath = `/uploads/places/${place.place_id}.jpg`;
  const absolutePath = path.join(__dirname, '../uploads/places', `${place.place_id}.jpg`);

  let finalPhoto = null;
  if (fs.existsSync(absolutePath)) {
    finalPhoto = localPath;
    console.log(`✅ Foto locale trovata per "${place.name}" (${place.place_id}), uso ${localPath}`);

  } else if (place.photos?.[0]) {
    console.log(`🌐 Foto NON presente per "${place.name}" (${place.place_id}), uso link Google`);

    finalPhoto = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1000&photoreference=${place.photos[0].photo_reference}&key=${key}`;
  }

  return {
    placeId: place.place_id,
    name: place.name,
    address: place.vicinity || place.formatted_address,
    rating: place.rating ?? null,
    priceLevel: place.price_level ?? null,
    website: place.website ?? null,
    openingHours: place.opening_hours?.weekday_text ?? null,
    photo: finalPhoto,
    photoReference: place.photos?.[0]?.photo_reference || null,
    latitude: place.geometry?.location?.lat,
    longitude: place.geometry?.location?.lng,
    type: place.types?.[0] || null,
  };
};


/* ------------------------------------------------------------------ */
/*  🔍 Nearby-Search helper                                            */
/*     - keyword & type obbligatori                                   */
/*     - anchor = {lat,lng}, radius (m)                               */
/* ------------------------------------------------------------------ */
const fetchNearbyPlaces = async (
  { keyword, type },
  anchor,
  radius,
  key,
  used = new Set(),
  avoid = new Set(),
  count = 1,
  minR = null,
  maxR = null
) => {
  if (!anchor) return [];

  const params = {
    key,
    location: `${anchor.lat},${anchor.lng}`,
    radius: Math.min(radius, 50000), // limite API
  };
  if (keyword) params.keyword = keyword;
  if (type) params.type = type;

  const doNearby = () =>
    axios.get(
      "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
      { params }
    );

  try {
    const resp = await doNearby();

    console.log(`\n==============================`);
    console.log(`🔎 Nearby: keyword="${keyword}" type=${type}`);
    console.log(`📍 Anchor: ${anchor.lat},${anchor.lng}, r=${params.radius}`);
    console.log(`📦 Risultati: ${resp.data.results.length}`);
    console.log(`==============================\n`);

    if (resp.data.status === "OK" && resp.data.results.length) {
      const results = resp.data.results.filter((p) => {
        if (!p.geometry?.location) return false;
        if (used.has(p.place_id) || avoid.has(p.place_id)) return false;

        const placeCoords = {
          lat: p.geometry.location.lat,
          lng: p.geometry.location.lng,
        };

        const dist = haversine(anchor, placeCoords);
        if (minR !== null && dist < minR) return false;
        if (maxR !== null && dist > maxR) return false;

        return true;
      });

      if (results.length) {
        return results.slice(0, count); // risultati grezzi Google
      }
    }
  } catch (e) {
    console.warn("⚠️ nearbySearch failed:", e.message);
  }

  // ❌ Fallback placeholder
  console.error(
    `❌ Nessun risultato per "${keyword || type}", uso placeholder.`
  );
  const fake = {
    place_id: `placeholder_${(keyword || type).replace(/\s+/g, "_")}_${Date.now()}`,
    name: `Luogo generico (${keyword || type})`,
    formatted_address: "",
    rating: 0,
    geometry: { location: anchor },
    photos: [],
    types: [type],
  };
  return [fake];
};

const fetchAccommodation = async (address, key) => {
  try {
    const { data } = await axios.get(
      "https://maps.googleapis.com/maps/api/place/findplacefromtext/json",
      {
        params: {
          input: address,
          inputtype: "textquery",
          fields: "place_id",
          key,
        },
      }
    );

    if (data.status === "OK" && data.candidates.length) {
      const placeId = data.candidates[0].place_id;

      const place = await fetchPlaceById(placeId, key, new Set(), new Set());
      return place;
    }
  } catch (e) {
    console.warn("⚠️ fetchAccommodation fallita:", e.message);
  }
  return null;
};

/* Dettaglio singolo place tramite Places Details */
const fetchPlaceById = async (id, key, used, avoid) => {
  if (avoid.has(id) || used.has(id)) return null;

  const { data } = await axios.get(
    "https://maps.googleapis.com/maps/api/place/details/json",
    {
      params: {
        place_id: id,
        key,
        fields:
          "place_id,name,formatted_address,vicinity,geometry,photos,rating,price_level,website,opening_hours,types",
      },
    }
  );

  const p = data?.result;
  if (!p?.geometry?.location) return null;

  used.add(id);
  return buildPlaceObj(p, key);
};

/* ------------------------------------------------------------------ */
/* 🌐  Style Presets 2.0  (keyword + type)                             */
/* ------------------------------------------------------------------ */
const STYLE_PRESETS = {
  Standard: {
    morning: [
      { keyword: "café", type: "cafe", c: 1, slotType: "eat" },
      { keyword: "", type: "tourist_attraction", c: 1, slotType: "see" },
    ],
    afternoon: [
      { keyword: "lunch", type: "restaurant", c: 1, slotType: "eat" },
      { keyword: "", type: "park", c: 1, slotType: "see" },
    ],
    evening: [
      { keyword: "dinner", type: "restaurant", c: 1, slotType: "eat" },
      { keyword: "cocktail", type: "bar", c: 1, slotType: "eat" },
    ],
  },

  Museums: {
    morning: [
      { keyword: "breakfast", type: "cafe", c: 1, slotType: "eat" },
      { keyword: "", type: "museum", c: 2, slotType: "see" },
    ],
    afternoon: [
      { keyword: "lunch", type: "restaurant", c: 1, slotType: "eat" },
      { keyword: "art exhibitions", type: "art_gallery", c: 1, slotType: "see" },
    ],
    evening: [
      { keyword: "dinner", type: "restaurant", c: 1, slotType: "eat" },
      { keyword: "theatre", type: "movie_theater", c: 1 },
    ],
  },

  Shopping: {
    morning: [
      { keyword: "coffee", type: "cafe", c: 1, slotType: "eat" },
      { keyword: "", type: "shopping_mall", c: 2, slotType: "see" },
    ],
    afternoon: [
      { keyword: "lunch", type: "restaurant", c: 1, slotType: "eat" },
      { keyword: "", type: "department_store", c: 1, slotType: "see" },
    ],
    evening: [
      { keyword: "dinner", type: "restaurant", c: 1, slotType: "eat" },
      { keyword: "trendy bar", type: "bar", c: 1, slotType: "eat" },
    ],
  },

  FoodTour: {
    morning: [
      { keyword: "pasticceria", type: "bakery", c: 1, slotType: "eat" },
      { keyword: "food market", type: "market", c: 1, slotType: "eat" },
    ],
    afternoon: [
      { keyword: "typical restaurant", type: "restaurant", c: 2, slotType: "eat" },
    ],
    evening: [
      { keyword: "wine tasting", type: "bar", c: 1, slotType: "eat" },
      { keyword: "gourmet", type: "restaurant", c: 1, slotType: "eat" },
    ],
  },
};

/* ------------------------------------------------------------------ */
/* 🔗  Place Generator (slot chaining)                                 */
/* ------------------------------------------------------------------ */
const generateNextPlace = async ({
  def,
  city,
  key,
  used,
  avoidSet,
  anchor,
  withinSlot,
  interRules,
  mustSee = [],
  mustEat = [],
}) => {
  let nextPlace = null;
  /* 👉 must-eat: usa i ristoranti obbligatori
       – funziona solo se lo slot è di tipo "eat"
       – lo usiamo negli slot pranzo e cena (non mattina)          */
  if (def.slotType === "eat" && mustEat.length) {
    const id = mustEat.shift();                       // preleva il primo
    nextPlace = await fetchPlaceById(id, key, used, avoidSet);
  }


  // 2️⃣ Nearby search normale
  if (!nextPlace) {
    const radius = def.forceRadius ?? interRules.max;
    const [raw] = await fetchNearbyPlaces(
      { keyword: def.keyword, type: def.type },
      anchor,
      radius,
      key,
      used,
      avoidSet,
      1,
      interRules.min,
      interRules.max
    );

    if (raw?.place_id) {
      nextPlace = await fetchPlaceById(raw.place_id, key, used, avoidSet);
    } else {
      nextPlace = buildPlaceObj(raw, key);
    }
  }

  return nextPlace;
};

/* ------------------------------------------------------------------ */
/* 🚀  GET|POST /api/itinerary                                         */
/* ------------------------------------------------------------------ */
const getItinerary = async (req, res) => {
  const city = req.body?.city || req.query.city || "Roma";
  const totalDays = parseInt(req.body?.totalDays || req.query.totalDays) || 1;
  const accommodation = req.body?.accommodation || req.query.accommodation || null;
  const transport = (req.body?.transport || req.query.transport || "walk").toLowerCase();
  const styleName = req.body?.style || req.query.style || "Standard";
  console.log("🎨 Stile ricevuto dal frontend:", req.body?.style || req.query.style);
  console.log("🚗 Mezzo ricevuto dal frontend:", req.body?.transport || req.query.transport);
  console.log("🎨 Stile effettivo usato:", styleName);
  console.log("🚗 Mezzo effettivo usato:", transport);

  /* preferenze utente */
  const mustSee = Array.isArray(req.body?.mustSee) ? req.body.mustSee : [];
  const mustEat = Array.isArray(req.body?.mustEat) ? req.body.mustEat : [];
  const avoid = Array.isArray(req.body?.avoid) ? req.body.avoid : [];
  const used = new Set();
  const avoidSet = new Set(avoid);

  const KEY = process.env.GOOGLE_API_KEY;
  const { getCityCoverPhoto } = require("../services/photoManager");

  /* cover dinamica */
  let coverPhoto = null;
  try {
    const filename = await getCityCoverPhoto(city);
    if (filename) coverPhoto = `/uploads/${filename}`;
  } catch (_) { }

  /* centro città (geocode) */
  let cityCenter = null;
  try {
    const geo = await axios.get(
      "https://maps.googleapis.com/maps/api/geocode/json",
      { params: { address: city, key: KEY } }
    );
    cityCenter = geo.data.results[0]?.geometry?.location || null;
  } catch (_) { }

  /* regole raggio */
  const WITHIN_SLOT = 1000;
  const INTER_RULES = {
    walk: { min: 0, max: 1000 },
    car: { min: 2000, max: 10000 },
    bike: { min: 200, max: 5000 },
    bus: { min: 1000, max: 10000 },
  };
  const R = INTER_RULES[transport] || INTER_RULES.walk;

  /* alloggio */
  /* alloggio */
  let accPlace = null;
  if (accommodation) {
    accPlace = await fetchAccommodation(accommodation, KEY);

    if (accPlace) {
      accPlace = {
        ...accPlace,
        name: "Torna all’alloggio",
        slotType: "accommodation",
      };
      used.add(accPlace.placeId);
      console.log(`🏨 Alloggio trovato: ${accPlace.name} (${accPlace.latitude}, ${accPlace.longitude})`);
    } else {
      console.warn("⚠️ Alloggio non trovato, proseguo senza.");
    }
  }



  /* ---------------- itinerario per giorni ---------------- */
  const itinerary = [];
  const slots = ["morning", "afternoon", "evening"];
  const baseStyle = STYLE_PRESETS[styleName] || STYLE_PRESETS.Standard;

  for (let d = 1; d <= totalDays; d++) {
    const plan = { day: d, morning: [], afternoon: [], evening: [] };

    /* anchor iniziale */
    let anchor = accPlace
      ? { lat: accPlace.latitude, lng: accPlace.longitude }
      : cityCenter;

    for (const slot of slots) {
      for (const defTemplate of baseStyle[slot]) {
        let remaining = defTemplate.c;

        while (remaining > 0) {
          /* regole raggio dinamiche */
          // Regole raggio per questo singolo luogo
          let inter = { ...R };

          // Caso caffè mattina: sempre compatto
          if (slot === "morning" && defTemplate.keyword.includes("coffee")) {
            inter.min = 0;
            inter.max = WITHIN_SLOT;
          }

          // Caso rientro bus sera: ancora prima
          else if (
            slot === "evening" &&
            transport === "bus" &&
            defTemplate.slotType === "eat" &&
            accPlace
          ) {
            anchor = {
              lat: accPlace.latitude,
              lng: accPlace.longitude,
            };
            inter.min = 0;
            inter.max = 2000;
          }

          // Primo luogo della fascia: usa i raggi del mezzo
          else if (plan[slot].length === 0) {
            inter = { ...R };
          }

          // Luoghi successivi nella fascia: compatto
          else {
            inter.min = 0;
            inter.max = WITHIN_SLOT;
          }


          const nextPlace = await generateNextPlace({
            def: defTemplate,
            city,
            key: KEY,
            used,
            avoidSet,
            anchor,
            withinSlot: WITHIN_SLOT,
            interRules: inter,
            mustSee: [],                                 //  ← non consumiamo nulla qui
            mustEat: slot === "morning" ? [] : mustEat,
          });

          if (nextPlace) {
            plan[slot].push(nextPlace);
            anchor = { lat: nextPlace.latitude, lng: nextPlace.longitude };
            remaining--;
          } else {
            break;
          }
        }
      }
    }

    /* rientro serale */
    if (accPlace) plan.evening.push({ ...accPlace, timeSlot: "evening" });

    plan.ordered = [...plan.morning, ...plan.afternoon, ...plan.evening];
    itinerary.push(plan);
  }

  /* inserimento ciclico mustSee */
  /* ------------------------------------------------- */
  /* 🔗 Inserimento ottimo dei must-see                 */
  /*     criterio: minimizza delta-distanza            */
  /* ------------------------------------------------- */
  while (mustSee.length) {
    const id = mustSee.shift();
    const p = await fetchPlaceById(id, KEY, used, avoidSet);
    if (!p) continue;

    let bestScore = Infinity;
    let bestSlot = null;
    let bestPos = 0;

    itinerary.forEach(plan => {
      ["morning", "afternoon", "evening"].forEach(slot => {
        const arr = plan[slot];
        if (!arr.length) return;                  // slot vuoto? salta

        for (let i = 0; i <= arr.length; i++) {
          const prev = i === 0 ? null : arr[i - 1];
          const next = i === arr.length ? null : arr[i];

          const dPrev = prev ? haversine(
            { lat: prev.latitude, lng: prev.longitude },
            { lat: p.latitude, lng: p.longitude }) : 0;

          const dNext = next ? haversine(
            { lat: p.latitude, lng: p.longitude },
            { lat: next.latitude, lng: next.longitude }) : 0;

          const dOrig = prev && next ? haversine(
            { lat: prev.latitude, lng: prev.longitude },
            { lat: next.latitude, lng: next.longitude }) : 0;

          const delta = dPrev + dNext - dOrig;

          if (delta < bestScore) {
            bestScore = delta;
            bestSlot = { plan, slot };
            bestPos = i;
          }
        }
      });
    });

    if (bestSlot) {
      bestSlot.plan[bestSlot.slot].splice(bestPos, 0, p);
      bestSlot.plan.ordered = [
        ...bestSlot.plan.morning,
        ...bestSlot.plan.afternoon,
        ...bestSlot.plan.evening,
      ];
    } else {
      console.warn(`⚠️ mustSee ${id} non inserito: nessun punto idoneo`);
    }
  }


  res.json({ itinerary, coverPhoto });
};

/* ------------------------------------------------------------------ */
/* 🚀  GET /api/itinerary/single-place                                 */
/* ------------------------------------------------------------------ */
const getSinglePlace = async (req, res) => {
  const { query, city, lat, lng } = req.query;
  if (!query || !city)
    return res.status(400).json({ error: "query & city obbligatori" });

  const KEY = process.env.GOOGLE_API_KEY;

  /* 1️⃣ Anchor da frontend */
  let anchor = null;
  if (lat && lng) {
    anchor = { lat: parseFloat(lat), lng: parseFloat(lng) };
  }

  /* 2️⃣ Se anchor mancante, usa Geocode della città */
  if (!anchor) {
    try {
      const geo = await axios.get(
        "https://maps.googleapis.com/maps/api/geocode/json",
        { params: { address: city, key: KEY } }
      );
      anchor = geo.data.results[0]?.geometry?.location || null;
    } catch (e) {
      console.warn("⚠️ Geocode fallita:", e.message);
    }
  }

  /* 3️⃣ Fallback Text Search se ancora senza anchor */
  if (!anchor) {
    try {
      const { data } = await axios.get(
        "https://maps.googleapis.com/maps/api/place/textsearch/json",
        { params: { query: `${query} in ${city}`, key: KEY } }
      );
      if (data.status === "OK" && data.results.length) {
        return res.json(buildPlaceObj(data.results[0], KEY));
      }
      return res.status(404).json({ error: "Luogo non trovato" });
    } catch (err) {
      console.error("❌ getSinglePlace fallback:", err);
      return res.status(500).json({ error: "Errore interno" });
    }
  }

  /* 4️⃣ Nearby Search con anchor corretto */
  /* 4️⃣ Nearby Search con anchor corretto */
  try {
    const [raw] = await fetchNearbyPlaces(
      { keyword: query, type: "" },
      anchor,
      5000,
      KEY
    );
    if (!raw) return res.status(404).json({ error: "Luogo non trovato" });

    const detailed = await fetchPlaceById(raw.place_id, KEY, new Set(), new Set());
    if (!detailed) return res.status(404).json({ error: "Dettagli non trovati" });

    // 🔽 Scarica la foto come negli altri posti
    if (detailed.photoReference) {
      try {
        const filename = await getOrDownloadPhoto(detailed.placeId, detailed.photoReference);
        detailed.photo = `/uploads/places/${filename}`;
        detailed.photoFilename = filename;
      } catch (errPhoto) {
        console.warn('⚠️ Errore download foto:', errPhoto.message);
        // Se fallisce il download, lasci il link Google già presente in detailed.photo
        detailed.photoFilename = '';
      }
    } else {
      detailed.photoFilename = '';
    }

    return res.json(detailed);

  } catch (err) {
    console.error("❌ getSinglePlace:", err);
    return res.status(500).json({ error: "Errore interno" });
  }



};


module.exports = { getItinerary, getSinglePlace };
