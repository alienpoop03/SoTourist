// itinerarycontroller.js
const axios = require('axios');

/* ------------------------------------------------------------------ */
/* ⚙️  Funzione condivisa: interroga Google Text Search API            */
/* ------------------------------------------------------------------ */
const fetchPlaces = async (
  query,
  city,
  key,
  usedPlaceNames = new Set(),
  avoidSet = new Set(),
  count = 1,
  setCoverPhoto = () => {}
) => {
  const resp = await axios.get(
    'https://maps.googleapis.com/maps/api/place/textsearch/json',
    { params: { query: `${query} in ${city}`, key } }
  );

  const filtered = resp.data.results.filter(p =>
    p.geometry?.location &&
    !usedPlaceNames.has(p.name.toLowerCase()) &&
    !avoidSet.has(p.name.toLowerCase())
  );

  const selected = filtered.slice(0, count).map(place => {
    usedPlaceNames.add(place.name.toLowerCase());

    /* ↪️ imposta copertina se richiesto */
    if (place.photos?.[0]?.photo_reference) {
      const photoUrl =
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1000&photoreference=${place.photos[0].photo_reference}&key=${key}`;
      setCoverPhoto(photoUrl);
    }

    return {
      placeId: place.place_id,
      name: place.name,
      address: place.formatted_address,
      rating: place.rating,
      photo: place.photos?.[0]
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1000&photoreference=${place.photos[0].photo_reference}&key=${key}`
        : null,
      latitude: place.geometry.location.lat,
      longitude: place.geometry.location.lng
    };
  });

  return selected;
};

/* ------------------------------------------------------------------ */
/* 🚀 1) GET / POST /api/itinerary → genera un itinerario completo     */
/* ------------------------------------------------------------------ */
const getItinerary = async (req, res) => {
  /* ---------- parametri base ---------- */
  const city          = req.body?.city          || req.query.city          || 'Roma';
  const totalDays     = parseInt(req.body?.totalDays || req.query.totalDays) || 1;
  const accommodation = req.body?.accommodation || req.query.accommodation || null;

  /* ---------- preferenze opzionali ---------- */
  const mustSee = Array.isArray(req.body?.mustSee) ? req.body.mustSee : [];
  const mustEat = Array.isArray(req.body?.mustEat) ? req.body.mustEat : [];
  const avoid   = Array.isArray(req.body?.avoid)   ? req.body.avoid   : [];

  const avoidSet       = new Set(avoid.map(n => n.toLowerCase()));
  const usedPlaceNames = new Set();                       // evita duplicati
  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
  let   coverPhoto     = null;

  const setCoverPhoto = url => { if (!coverPhoto) coverPhoto = url; };

  /* ---------- cover di default (attrazione iconica) ---------- */
  try {
    const icon = await axios.get(
      'https://maps.googleapis.com/maps/api/place/textsearch/json',
      { params: { query: `attrazione più famosa di ${city}`, key: GOOGLE_API_KEY } }
    );
    const top = icon.data.results?.[0];
    if (top?.photos?.[0]?.photo_reference) {
      coverPhoto =
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1000&photoreference=${top.photos[0].photo_reference}&key=${GOOGLE_API_KEY}`;
    }
  } catch {/* silenzioso */}

  /* ---------- struttura ricerche standard ---------- */
  const baseStructure = {
    morning:   [{ query: 'caffè bar colazione',  count: 1 },
                { query: 'attrazioni turistiche', count: 1 }],
    afternoon: [{ query: 'ristoranti per pranzo', count: 1 },
                { query: 'parchi o musei',        count: 1 }],
    evening:   [{ query: 'ristoranti per cena',   count: 1 },
                { query: 'pub cocktail bar',      count: 1 }]
  };

  /* ---------- helper random ---------- */
  const randomSlot = type =>
    type === 'eat'
      ? (Math.random() < 0.5 ? 'afternoon' : 'evening')
      : ['morning', 'afternoon', 'evening'][Math.floor(Math.random() * 3)];

  const personalization = {}; // { day: { morning:[], afternoon:[], evening:[] } }
  const assignRandom = (list, type) => {
    for (const name of list) {
      const day = Math.floor(Math.random() * totalDays) + 1; // 1-based
      const sec = randomSlot(type);
      personalization[day] ??= { morning: [], afternoon: [], evening: [] };
      personalization[day][sec].push({ name, type });
    }
  };
  assignRandom(mustSee, 'see');
  assignRandom(mustEat, 'eat');

  /* ---------- alloggio ---------- */
 /* ---------- alloggio (via fetchPlaces) ---------- */
let accommodationPlace = null;
if (accommodation) {
  try {
    // usa la stessa funzione di tutti gli altri luoghi
    const [accPlace] = await fetchPlaces(
      accommodation,      // query
      city,               // città
      GOOGLE_API_KEY,
      usedPlaceNames,     // evita duplicati
      avoidSet,
      1                   // conta 1
    );

    if (accPlace) {
      accommodationPlace = {
        ...accPlace,                 // placeId, lat, lng, photo, address…
        name: 'Torna all’alloggio',  // label personalizzata
        type: 'accommodation',
        note: ''
      };
    }
  } catch (err) {
    console.warn('⚠️  Errore fetch alloggio:', err);
  }
}


  /* ---------- generazione itinerario ---------- */
  const itinerary = [];

  for (let dayIdx = 1; dayIdx <= totalDays; dayIdx++) {
    const plan = { day: dayIdx, morning: [], afternoon: [], evening: [] };
    const pers = personalization[dayIdx] || plan; // default vuoto

    for (const [section, queries] of Object.entries(baseStructure)) {
      /* 1) mustEat in testa */
      for (const { name } of (pers[section] || []).filter(x => x.type === 'eat')) {
        const [place] = await fetchPlaces(name, city, GOOGLE_API_KEY,
                                          usedPlaceNames, avoidSet, 1, setCoverPhoto);
        if (place) plan[section].push(place);
      }

      /* 2) ricerche standard */
      for (const { query, count } of queries) {
        const found = await fetchPlaces(query, city, GOOGLE_API_KEY,
                                        usedPlaceNames, avoidSet, count, setCoverPhoto);
        plan[section].push(...found);
      }

      /* 3) mustSee in posizione random (≥1) */
      for (const { name } of (pers[section] || []).filter(x => x.type === 'see')) {
        const [place] = await fetchPlaces(name, city, GOOGLE_API_KEY,
                                          usedPlaceNames, avoidSet, 1, setCoverPhoto);
        if (!place) continue;
        if (plan[section].length === 0) {
          plan[section].push(place);
        } else {
          const idx = 1 + Math.floor(Math.random() * plan[section].length);
          plan[section].splice(idx, 0, place);
        }
      }
    }

    // ➕ duplica l’alloggio: inizio mattina + fine sera
if (accommodationPlace) {
  const accMorning = { ...accommodationPlace, timeSlot: 'morning' };
  const accEvening = { ...accommodationPlace, timeSlot: 'evening' };

  // prima tappa della mattina
  plan.morning.unshift(accMorning);
  // ultima tappa della sera
  plan.evening.push(accEvening);
}

// ricostruisci 'ordered' sempre
plan.ordered = [...plan.morning, ...plan.afternoon, ...plan.evening];
itinerary.push(plan);

  }

  res.json({ itinerary, coverPhoto });
};

/* ------------------------------------------------------------------ */
/* 🚀 2) GET /api/itinerary/single-place → un solo luogo               */
/* ------------------------------------------------------------------ */
const getSinglePlace = async (req, res) => {
  const query = req.query.query;
  const city  = req.query.city;
  if (!query || !city)
    return res.status(400).json({ error: 'Parametri query e city obbligatori' });

  try {
    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
    const [place] = await fetchPlaces(query, city, GOOGLE_API_KEY);
    if (!place) return res.status(404).json({ error: 'Luogo non trovato' });
    res.json(place);
  } catch (err) {
    console.error('❌ Errore getSinglePlace:', err);
    res.status(500).json({ error: 'Errore interno' });
  }
};

/* ------------------------------------------------------------------ */
module.exports = {
  getItinerary,
  getSinglePlace
};
