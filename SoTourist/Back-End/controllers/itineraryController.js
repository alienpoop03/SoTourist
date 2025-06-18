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
  rating: place.rating ?? null,
  priceLevel: place.price_level ?? null,
  website: place.website ?? null,
  openingHours: place.opening_hours?.weekday_text ?? null,
  photo: place.photos?.[0]
    ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1000&photoreference=${place.photos[0].photo_reference}&key=${key}`
    : null,
  photoReference: place.photos?.[0]?.photo_reference || null,
  latitude: place.geometry?.location?.lat,
  longitude: place.geometry?.location?.lng,
});



/* --- text-search helper (supporta min & max radius) ---------------- */
const fetchPlaces = async (
  query, city, key, used = new Set(), avoid = new Set(), count = 1,
  anchor = null, fixedRadius = null, minR = null, maxR = null
) => {
  const baseParams = { query: `${query} in ${city}`, key };
  const doTextSearch = params =>
    axios.get("https://maps.googleapis.com/maps/api/place/textsearch/json", { params });

  const params = { ...baseParams };
  if (anchor && fixedRadius) {
    params.location = `${anchor.lat},${anchor.lng}`;
    params.radius = fixedRadius;
  }

  try {
    const resp = await doTextSearch(params);
    if (resp.data.status === "OK" && resp.data.results.length) {
      const results = resp.data.results.filter(p => {
        if (!p.geometry?.location) return false;
        if (used.has(p.place_id) || avoid.has(p.place_id)) return false;

        const placeCoords = {
          lat: p.geometry.location.lat,
          lng: p.geometry.location.lng
        };

        if (anchor) {
          const dist = haversine(anchor, placeCoords);
          if (minR !== null && dist < minR) return false;
          if (maxR !== null && dist > maxR) return false;
          // DEBUG DISTANZA
          console.log(`📍 [${query}] distanza = ${Math.round(dist)}m`);
        }

        return true;
      });

      if (results.length) {
        return results.slice(0, count); // restituisce i luoghi originali di Google

      }
    }
  } catch (e) {
    console.warn("⚠️ textsearch failed:", e.message);
  }

  // ❌ Fallback: placeholder
  console.error(`❌ Nessun risultato reale per "${query}", uso placeholder.`);
  const fake = {
    place_id: `placeholder_${query.replace(/\s+/g, "_")}_${Date.now()}`,
    name: `Luogo generico per "${query}"`,
    formatted_address: city,
    rating: 0,
    photos: [],
    geometry: { location: anchor || { lat: 0, lng: 0 } },
  };
  return [buildPlaceObj(fake, key)];
};




const fetchPlaceById = async (id, key, used, avoid) => {

  if (avoid.has(id) || used.has(id)) return null;

  const { data } = await axios.get(
    "https://maps.googleapis.com/maps/api/place/details/json",
    {
      params: {
        place_id: id, key, fields: "place_id,name,formatted_address,geometry,photos,rating,price_level,website,opening_hours"
      }
    }
  );

  const p = data?.result;
  if (!p?.geometry?.location) return null;

  used.add(id);

  return buildPlaceObj(p, key);
};


// ===============
// === FUNZIONE MIA PER FARE STO CHAINING DINAMICO CORRETTAMENTE
// ===============

const generateNextPlace = async ({
  def, city, key, used, avoidSet, anchor,
  minR = null, maxR = null, mustSee = [], mustEat = []
}) => {
  let nextPlace = null;

  // 1️⃣ Se possibile, usa MUST user
  if (def.type === "see" && mustSee.length) {
    const id = mustSee.shift();
    nextPlace = await fetchPlaceById(id, key, used, avoidSet);
  } else if (def.type === "eat" && mustEat.length) {
    const id = mustEat.shift();
    nextPlace = await fetchPlaceById(id, key, used, avoidSet);
  }

  // 2️⃣ Altrimenti, cerca normalmente
  if (!nextPlace) {
  const [generated] = await fetchPlaces(
    def.q, city, key, used, avoidSet, 1, anchor, null, minR, maxR
  );

  if (generated?.place_id) {
  nextPlace = await fetchPlaceById(generated.place_id, key, used, avoidSet);
} else {
    nextPlace = generated || null;
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

  // 🔍 Cerca una cover smart per la città
  try {
    const coverResp = await axios.get(
      'https://maps.googleapis.com/maps/api/place/textsearch/json',
      {
        params: {
          //   query da cambiare se vogliamo mettere un altro criterio
          query: `monumenti famosi a ${city}`,
          key: KEY
        }
      }
    );

    const first = coverResp.data.results.find(p => p.photos?.[0]);
    if (first) {
      const ref = first.photos[0].photo_reference;
      coverPhoto = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1000&photoreference=${ref}&key=${KEY}`;
      console.log('✅ Cover generata da monumenti:', coverPhoto);
    } else {
      console.warn('⚠️ Nessuna cover trovata con monumenti.');
    }
  } catch (err) {
    console.error('❌ Errore richiesta cover smart:', err.message);
  }

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
  const WITHIN_SLOT = 1000;
  const INTER_RULES = {
    walk: { min: 0, max: 1000 },
    car: { min: 500, max: 10000 },
    bike: { min: 200, max: 5000 },
    bus: { min: 1000, max: 10000 }  // bus mattina + pomeriggio; sera custom
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
      accommodation, city, KEY, used, avoidSet, 1,
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
        let remaining = def.c;

        while (remaining > 0) {
          let minR = null, maxR = null;

          if (slot === "morning" && def.q.includes("colazione")) {
            maxR = WITHIN_SLOT;
            def.type = "see"; // forza a non usarli, evita `generateNextPlace` di pescarli

          } else if (
            slot === "morning" &&
            transport === "bus" &&
            def.q.includes("attrazioni")
          ) {
            maxR = 5000;
          } else if (
            slot === "evening" &&
            transport === "bus" &&
            def.q.includes("ristoranti per cena") &&
            accPlace
          ) {
            anchor = { lat: accPlace.latitude, lng: accPlace.longitude };
            minR = 0;
            maxR = 2000;
          } else if (plan[slot].length === 0) {
            minR = R.min;
            maxR = R.max;
          } else {
            maxR = WITHIN_SLOT;
          }

          const nextPlace = await generateNextPlace({
            def,
            city,
            key: KEY,
            used,
            avoidSet,
            anchor,
            minR,
            maxR,
            mustSee: [],
            mustEat
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
// 🚨 Inserisci i mustSee ciclicamente nei giorni, negli slot con minore distanza
let mustSeeIndex = 0;
const totalMustSee = mustSee.length;

while (mustSeeIndex < totalMustSee) {
  for (let i = 0; i < itinerary.length && mustSeeIndex < totalMustSee; i++) {
    const plan = itinerary[i];

    // Calcola la distanza media tra le tappe di ciascuno slot
    const distances = {};
    for (const slot of ["morning", "afternoon", "evening"]) {
      const places = plan[slot];
      let totalDist = 0;
      for (let j = 1; j < places.length; j++) {
        const dist = haversine(
          { lat: places[j - 1].latitude, lng: places[j - 1].longitude },
          { lat: places[j].latitude, lng: places[j].longitude }
        );
        totalDist += dist;
      }
      distances[slot] = totalDist / Math.max(places.length - 1, 1); // media
    }

    // Ordina gli slot per distanza crescente e cerca un punto dove inserirlo
    const sortedSlots = Object.entries(distances)
  .filter(([slot]) => {
    // esclude gli slot dove tutti i luoghi sono di tipo "eat"
    const allEat = plan[slot].length > 0 && plan[slot].every(p => p.type === "eat");
    return !allEat;
  })
  .sort((a, b) => a[1] - b[1])
  .map(([slot]) => slot);


    let inserted = false;
    const id = mustSee[mustSeeIndex];

    for (const slot of sortedSlots) {
      const p = await fetchPlaceById(id, KEY, used, avoidSet);
      if (!p) continue;

      // Inserisci a metà dello slot (non all’inizio)
      const pos = Math.floor(plan[slot].length / 2);
      plan[slot].splice(pos, 0, p);
      plan.ordered = [...plan.morning, ...plan.afternoon, ...plan.evening];
      mustSeeIndex++;
      inserted = true;
      break;
    }

if (!inserted) {
  console.warn(`⚠️ mustSee "${id}" non inserito in alcuno slot valido. Skippato.`);
  mustSeeIndex++; // forza l'avanzamento
  break;
}
  }
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