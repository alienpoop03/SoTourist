const axios = require('axios');

const getItinerary = async (req, res) => {
  const city = req.query.city || 'Roma';
  const totalDays = parseInt(req.query.totalDays) || 1;
  const accommodationAddress = req.query.accommodation || null;  // <-- Alloggio dalla query
  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

  const usedPlaceNames = new Set();
  let coverPhoto = null;

  // Funzione che chiama Places API e filtra i luoghi
  const fetchPlaces = async (query, count = 2) => {
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json`;
    const response = await axios.get(url, {
      params: {
        query: `${query} in ${city}`,
        key: GOOGLE_API_KEY
      }
    });

    const filtered = response.data.results.filter(
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

  // Calcolo distanza con formula haversine
  const getDistanceBetween = (origin, destination) => {
    const toRad = deg => deg * Math.PI / 180;
    const R = 6371; // raggio Terra km
    const dLat = toRad(destination.latitude - origin.latitude);
    const dLon = toRad(destination.longitude - origin.longitude);
    const lat1 = toRad(origin.latitude);
    const lat2 = toRad(destination.latitude);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return `${distance.toFixed(2)} km`;
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
      const dayPlan = { day, morning: [], afternoon: [], evening: [] };

      // per ogni sezione (mattina, pom, sera) fetchiamo i luoghi
      for (const [section, queries] of Object.entries(itineraryStructure)) {
        for (const { query, count } of queries) {
          const places = await fetchPlaces(query, count);
          dayPlan[section].push(...places);

          // Se non abbiamo coverPhoto, impostiamone una
          if (!coverPhoto && places[0]?.photo) {
            coverPhoto = places[0].photo;
          }
        }
      }

      // Ora uniamo i luoghi in un array ordinato
      const orderedPlaces = [
        ...dayPlan.morning,
        ...dayPlan.afternoon,
        ...dayPlan.evening
      ];

      // Calcoliamo la distanza tra le tappe
      for (let i = 0; i < orderedPlaces.length - 1; i++) {
        const distance = getDistanceBetween(orderedPlaces[i], orderedPlaces[i + 1]);
        orderedPlaces[i].distanceToNext = distance;
      }

      // Se abbiamo l'alloggio geolocalizzato, aggiungiamo tappa finale
      if (accommodationPlace) {
        if (orderedPlaces.length > 0) {
          const lastPlace = orderedPlaces[orderedPlaces.length - 1];
          const backDistance = getDistanceBetween(lastPlace, accommodationPlace);
          lastPlace.distanceToNext = backDistance;
        }
        // Aggiungiamo la tappa dell'alloggio
        orderedPlaces.push(accommodationPlace);
      }

      // Salviamo l'array finale
      dayPlan.ordered = orderedPlaces;
      itinerary.push(dayPlan);
    }

    // Rispondiamo al frontend
    res.json({ itinerary, coverPhoto });
  } catch (error) {
    console.error("Errore durante la generazione dell'itinerario:", error.message);
    res.status(500).json({ error: "Errore nella generazione dell'itinerario" });
  }
};

module.exports = { getItinerary };
