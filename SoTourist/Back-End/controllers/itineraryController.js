const axios = require('axios');

const getItinerary = async (req, res) => {
  const MAX_DISTANCE_KM = 2.0; // distanza max tra i punti in km
  const city = req.query.city || 'Roma';
  const totalDays = parseInt(req.query.totalDays) || 1;
  const accommodationAddress = req.query.accommodation || null;  // <-- Alloggio dalla query
  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

  const usedPlaceNames = new Set();
  let coverPhoto = null;

  try {
    const cityRes = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
      params: {
        query: `attrazione più famosa di ${city}`,
        key: GOOGLE_API_KEY
      }
    });

    const topPlace = cityRes.data.results?.[0];
    console.log('📍 Primo risultato ricevuto:', topPlace?.name);

    if (topPlace?.photos?.[0]?.photo_reference) {
      const ref = topPlace.photos[0].photo_reference;
      coverPhoto = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1000&photoreference=${ref}&key=${GOOGLE_API_KEY}`;
    } else {
      //console.warn('❗ Errore fetch coverPhoto:', err.message);
    }
  } catch (err) {
    console.warn('⚠️ Impossibile ottenere coverPhoto iconica:', err.message);
  }

  // Funzione che chiama Places API e filtra i luoghi
  const fetchPlaces = async (query, count = 2, from = null) => {
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json`;
    const response = await axios.get(url, {
      params: {
        query: `${query} in ${city}`,
        key: GOOGLE_API_KEY
      }
    });

    let filtered = response.data.results.filter(
      place => place.geometry?.location && !usedPlaceNames.has(place.name)
    );

    const selected = filtered.slice(0, count);

    // Se non abbiamo ancora coverPhoto, usiamo la prima foto disponibile
    if (!coverPhoto && selected[0]?.photos?.[0]?.photo_reference) {
      const photoRef = selected[0].photos[0].photo_reference;
      coverPhoto = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1000&photoreference=${photoRef}&key=${GOOGLE_API_KEY}`;
    }

    return selected.map(place => {
      usedPlaceNames.add(place.name);

      const photoRef = place.photos?.[0]?.photo_reference;
      const photoUrl = photoRef
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1000&photoreference=${photoRef}&key=${GOOGLE_API_KEY}`
        : null;

      return {
        name: place.name,
        address: place.formatted_address,
        rating: place.rating,
        photo: photoUrl,
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng
      };
    });
  };

  // Struttura di base (da personalizzare come vuoi)
  const itineraryStructure = {
    morning: [
      { query: "caffè bar colazione", count: 1 },
      { query: "attrazioni turistiche", count: 1 }
    ],
    afternoon: [
      { query: "ristoranti per pranzo", count: 1 },
      { query: "parchi o musei", count: 1 }
    ],
    evening: [
      { query: "ristoranti per cena", count: 1 },
      { query: "pub, cocktail bar o discoteche", count: 1 }
    ]
  };

  try {
    // Se c'è un alloggio, cerchiamo di geolocalizzarlo (opzionale)
    let accommodationPlace = null;
    if (accommodationAddress) {
      const accRes = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
        params: {
          query: accommodationAddress,
          key: GOOGLE_API_KEY
        }
      });
      const firstAcc = accRes.data.results?.[0];
      if (firstAcc?.geometry?.location) {
        accommodationPlace = {
          name: "Torna all'alloggio",
          address: firstAcc.formatted_address,
          photo: null, // o un placeholder
          latitude: firstAcc.geometry.location.lat,
          longitude: firstAcc.geometry.location.lng
        };
      }
    }

    const itinerary = [];

    for (let day = 1; day <= totalDays; day++) {
      console.log(`\n🗓️  Giorno ${day}`);
      const dayPlan = { day, morning: [], afternoon: [], evening: [] };

      let lastPlace = null;

      for (const [section, queries] of Object.entries(itineraryStructure)) {
        console.log(`  ➤ Fase: ${section}`);
        for (const { query, count } of queries) {
          console.log(`     🔍 Query: ${query}`);
          const places = await fetchPlaces(query, count, lastPlace);

          if (places.length === 0) {
            console.log('     ⚠️ Nessun luogo trovato');
            continue;
          }

          console.log(`     ✅ Trovati ${places.length} luoghi:`);
          places.forEach(p => {
            console.log(`        - ${p.name} (${p.latitude}, ${p.longitude})`);
          });

          dayPlan[section].push(...places);
          lastPlace = places[places.length - 1];

          if (!coverPhoto && places[0]?.photo) {
            coverPhoto = places[0].photo;
          }
        }
      }

      const orderedPlaces = [...dayPlan.morning, ...dayPlan.afternoon, ...dayPlan.evening];

      if (accommodationPlace) {
        orderedPlaces.push(accommodationPlace);
        console.log(`  🏨 Aggiunta tappa finale: ${accommodationPlace.name}`);
      }

      dayPlan.ordered = orderedPlaces;
      itinerary.push(dayPlan);
      console.log('\n📦 Itinerario finale generato:');
      console.log(JSON.stringify(itinerary, null, 2));
      console.log('\n🖼️  Cover photo:', coverPhoto);
    }

    // Rispondiamo al frontend
    res.json({ itinerary, coverPhoto });
  } catch (error) {
    console.error("Errore durante la generazione dell'itinerario:", error.message);
    res.status(500).json({ error: "Errore nella generazione dell'itinerario" });
  }
};

module.exports = { getItinerary };
