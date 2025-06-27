//const fs = require('fs');
//const path = require('path');
const generateId = require('../utils/idGenerator');
const db = require('../db/connection');
const { checkOverlap } = require('../utils/dateUtils');
const { getOrDownloadPhoto, getCityCoverPhoto } = require('../services/photoManager');


function datesOverlap(start1, end1, start2, end2) {
  return (
    new Date(start1) <= new Date(end2) &&
    new Date(end1) >= new Date(start2)
  );
}


// GET: tutti gli itinerari di un utente
exports.getItineraries = (req, res) => {
  const { userId } = req.params;
  const filter = req.query.filter || 'all';
  const today = new Date().toISOString().split('T')[0];

  db.all(`SELECT * FROM itineraries WHERE userId = ? AND deleted = 0`, [userId], (err, itineraries) => {
    if (err) return res.status(500).json({ error: 'Errore database' });

    let result = itineraries;

    switch (filter) {
      case 'current':
        result = itineraries.filter(it => it.startDate <= today && it.endDate >= today);
        break;

      case 'upcoming': {
        const upcoming = itineraries
          .filter(it => it.startDate > today)
          .sort((a, b) => a.startDate.localeCompare(b.startDate));
        result = upcoming.length > 0 ? [upcoming[0]] : [];
        break;
      }

      case 'future': {
        const sorted = itineraries
          .filter(it => it.startDate > today)
          .sort((a, b) => a.startDate.localeCompare(b.startDate));
        result = sorted.slice(1); // Rimuove l'imminente
        break;
      }

      case 'past':
        result = itineraries.filter(it => it.endDate < today);
        break;

      case 'all':
      default:
        result = itineraries;
        break;
    }

    res.json(result);
  });
};

// POST: aggiunge un itinerario
exports.addItinerary = async (req, res) => {
  const { userId } = req.params;
  const newItinerary = req.body;

  if (!newItinerary.city || !newItinerary.startDate || !newItinerary.endDate) {
    return res.status(400).json({ error: 'Dati insufficienti per creare un itinerario' });
  }

  db.all(`SELECT * FROM itineraries WHERE userId = ? AND deleted = 0`, [userId], async (err, existingItineraries) => {
    if (err) return res.status(500).json({ error: 'Errore database' });

    const overlap = existingItineraries.some(it =>
      new Date(newItinerary.startDate) <= new Date(it.endDate) &&
      new Date(newItinerary.endDate) >= new Date(it.startDate)
    );

    if (overlap) {
      return res.status(400).json({ error: 'Le date si sovrappongono a un altro itinerario' });
    }

    // 📸 Cover dinamica (con funzione pulita)
    let coverPhoto = '';
    try {
      const coverPath = await getCityCoverPhoto(newItinerary.city);
      if (coverPath) {
        coverPhoto = coverPath?.split('/').pop(); // salva solo "palermo.jpg"
      }
    } catch (errCover) {
      console.warn('⚠️ Errore download cover:', errCover.message);
    }


    const itineraryId = generateId('trip_');
    console.log('🧾 CAMPI che sto salvando nel DB:');
    console.log({
      itineraryId,
      userId,
      city: newItinerary.city,
      accommodation: newItinerary.accommodation || '',
      startDate: newItinerary.startDate,
      endDate: newItinerary.endDate,
      style: newItinerary.style || '',
      coverPhoto  // ⬅️ VERIFICA COSA CONTIENE QUI
    });

    db.run(
      `INSERT INTO itineraries 
       (itineraryId, userId, city, accommodation, startDate, endDate, style, coverPhoto, deleted)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        itineraryId,
        userId,
        newItinerary.city,
        newItinerary.accommodation || '',
        newItinerary.startDate,
        newItinerary.endDate,
        newItinerary.style || '',
        coverPhoto
      ],
      function (err2) {
        if (err2) return res.status(500).json({ error: 'Errore salvataggio itinerario' });

        res.status(201).json({
          itineraryId,
          city: newItinerary.city,
          accommodation: newItinerary.accommodation || '',
          startDate: newItinerary.startDate,
          endDate: newItinerary.endDate,
          style: newItinerary.style || '',
          coverPhoto
        });
      }
    );
  });
};



// DELETE: elimina un itinerario
exports.deleteItinerary = (req, res) => {
  const { userId, itineraryId } = req.params;

  db.run(
    `UPDATE itineraries SET deleted = 1 WHERE userId = ? AND itineraryId = ?`,
    [userId, itineraryId],
    function (err) {
      if (err) return res.status(500).json({ error: 'Errore database' });
      if (this.changes === 0) return res.status(404).json({ error: 'Itinerario non trovato' });
      res.status(204).end();
    }
  );
};

// cerca Itinerari pubblici filtrati per città
exports.getItinerariesByCity = (req, res) => {
  const city = req.query.city?.toLowerCase();
  if (!city) return res.status(400).json({ error: 'Parametro city mancante' });

  db.all(
    `SELECT * FROM itineraries WHERE LOWER(city) = ? AND deleted = 0`,
    [city],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Errore database' });
      res.json(rows);
    }
  );
};

// cerca Itinerario pubblico per ID
exports.getItineraryById = (req, res) => {
  const { itineraryId } = req.params;

  db.get(
    `SELECT * FROM itineraries WHERE itineraryId = ? AND deleted = 0`,
    [itineraryId],
    (err, itinerary) => {
      if (err) return res.status(500).json({ error: 'Errore database' });
      if (!itinerary) return res.status(404).json({ error: 'Itinerario non trovato' });

      db.all(
        `SELECT * FROM places WHERE itineraryId = ? ORDER BY day ASC, 
         CASE timeSlot
           WHEN 'morning' THEN 1
           WHEN 'afternoon' THEN 2
           WHEN 'evening' THEN 3
           ELSE 4
         END`,
        [itineraryId],
        (err2, places) => {
          if (err2) return res.status(500).json({ error: 'Errore nel recupero tappe' });

          const grouped = [];

          for (const place of places) {
            const dayIndex = place.day - 1;

            if (!grouped[dayIndex]) {
              grouped[dayIndex] = {
                day: place.day,
                morning: [],
                afternoon: [],
                evening: [],
                ordered: []
              };
            }

            const converted = {
              placeId: place.placeId,
              name: place.name,
              address: place.address,
              day: place.day,
              timeSlot: place.timeSlot,
              latitude: place.lat,
              longitude: place.lng,
              photoFilename: place.photoFilename,
              type: place.type,
              note: place.note,

              // ⬇️ Nuovi campi
              rating: place.rating ?? undefined,
              priceLevel: place.priceLevel ?? undefined,
              website: place.website ?? undefined,
              openingHours: place.openingHours ? JSON.parse(place.openingHours) : undefined
            };


            grouped[dayIndex][place.timeSlot]?.push(converted);
            grouped[dayIndex].ordered.push(converted);
          }


          res.json({
            ...itinerary,
            itinerary: grouped
          });
        }
      );
    }
  );
};

//modifica itinerario
exports.updateItinerary = (req, res) => {
  const { userId, itineraryId } = req.params;
  const updatedData = req.body;

  db.get(
    `SELECT * FROM itineraries WHERE itineraryId = ? AND userId = ? AND deleted = 0`,
    [itineraryId, userId],
    (err, itinerary) => {
      if (err) return res.status(500).json({ error: 'Errore database' });
      if (!itinerary) return res.status(404).json({ error: 'Itinerario non trovato' });

      if (updatedData.startDate && updatedData.endDate) {
        db.all(
          `SELECT * FROM itineraries WHERE userId = ? AND itineraryId != ? AND deleted = 0`,
          [userId, itineraryId],
          (err2, others) => {
            if (err2) return res.status(500).json({ error: 'Errore validazione date' });

            const overlap = checkOverlap(updatedStart, updatedEnd, others);

            if (overlap) {
              return res.status(400).json({ error: 'Le date si sovrappongono a un altro itinerario' });
            }

            applyUpdate();
          }
        );
      } else {
        applyUpdate();
      }

      function applyUpdate() {
        const updatedFields = {
          city: updatedData.city || itinerary.city,
          accommodation: updatedData.accommodation || itinerary.accommodation,
          startDate: updatedData.startDate || itinerary.startDate,
          endDate: updatedData.endDate || itinerary.endDate,
          style: updatedData.style || itinerary.style,
          coverPhoto: updatedData.coverPhoto || itinerary.coverPhoto
        };

        db.run(
          `UPDATE itineraries SET city = ?, accommodation = ?, startDate = ?, endDate = ?, style = ?, coverPhoto = ? WHERE itineraryId = ? AND userId = ?`,
          [
            updatedFields.city,
            updatedFields.accommodation,
            updatedFields.startDate,
            updatedFields.endDate,
            updatedFields.style,
            updatedFields.coverPhoto,
            itineraryId,
            userId
          ],
          (err3) => {
            if (err3) return res.status(500).json({ error: 'Errore aggiornamento' });
            res.status(200).json({ itineraryId, ...updatedFields });
          }
        );
      }
    }
  );
};

// aggiunta tappe
exports.addPlacesToItinerary = (req, res) => {
  const { userId, itineraryId } = req.params;
  let places = req.body;

  // QUI VUOI IL PRIMO LOG:
  //console.log("🔥 PAYLOAD CHE RICEVO DAL FRONTEND:");
  //console.log(JSON.stringify(places, null, 2));
  //console.log('🔥 RICEVUTE TAPPE:', places);

  if (!Array.isArray(places)) {
    if (typeof places === 'object' && places !== null) {
      places = [places];
    } else {
      return res.status(400).json({ error: 'Formato tappa non valido' });
    }
  }

  db.get(`SELECT * FROM itineraries WHERE itineraryId = ? AND userId = ? AND deleted = 0`, [itineraryId, userId], (err, itinerary) => {
    if (err) return res.status(500).json({ error: 'Errore database' });
    if (!itinerary) return res.status(404).json({ error: 'Itinerario non trovato' });

    const inserted = [];

    const insertNext = async () => {
      if (places.length === 0) {
        return res.status(201).json(inserted);
      }

      const place = places.shift();
      const placeId = generateId('place_');

      let photoFilename = '';

      try {
        //console.log("🔬 STO PROCESSANDO PLACE:");
        //console.log(place);

        // ⬇⬇⬇ QUI facciamo il download automatico solo se c'è il photoReference
        if (place.photoReference) {
          photoFilename = await getOrDownloadPhoto(place.placeId, place.photoReference);
          if (place.photoReference) {
            console.log("📸 HO IL PHOTOREFERENCE:"/*, place.photoReference*/);
          }

        }
      } catch (errPhoto) {
        console.error('Errore scaricamento immagine:', errPhoto);
        // anche se fallisce il download, continuiamo a salvare il place senza foto
      }

      const lat = place.latitude ?? place.lat;
      const lng = place.longitude ?? place.lng;

      db.run(
        `INSERT INTO places (
  placeId, itineraryId, name, day, timeSlot,
  lat, lng, address, photoFilename,
  type, note, rating, priceLevel, website, openingHours, photoUrl   -- 16 colonne
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`,
        [
          placeId,
          itineraryId,
          place.name,
          place.day,
          place.timeSlot,
          lat,
          lng,
          place.address || '',
          photoFilename,
          place.type || '',
          place.note || '',
          place.rating ?? null,
          place.priceLevel ?? null,
          place.website ?? null,
          place.openingHours ? JSON.stringify(place.openingHours) : null
        ],

        (err2) => {
          if (err2) {
            console.error('❌ Errore INSERT:', err2.message);
            console.error('🔎 Place che ha fallito:', place);
          } else {
            inserted.push({ placeId, ...place, photoFilename });
          }
          insertNext();


        }
      );

    };

    insertNext();
  });
};

//vede se ledate inserite si sovrappongono con altre
//serve per evitare sovrapposizioni
exports.checkDateOverlap = (req, res) => {
  const { userId } = req.params;
  const { startDate, endDate, excludeId } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate e endDate sono obbligatori' });
  }

  db.all(
    `SELECT * FROM itineraries WHERE userId = ? AND deleted = 0`,
    [userId],
    (err, itineraries) => {
      if (err) return res.status(500).json({ error: 'Errore database' });

      const overlapping = checkOverlap(startDate, endDate, itineraries, excludeId);

      res.json({ overlap: overlapping });
    }
  );
};

//SOVRASCRIVE TUTTE LE TAPPE
// SOVRASCRIVE TUTTE LE TAPPE
exports.updateItineraryPlaces = (req, res) => {
  const { userId, itineraryId } = req.params;
  const { places } = req.body;

  if (!Array.isArray(places)) {
    return res.status(400).json({ error: 'Formato tappe non valido' });
  }

  db.serialize(() => {
    db.run('DELETE FROM places WHERE itineraryId = ?', [itineraryId], function (err) {
      if (err) return res.status(500).json({ error: 'Errore durante la cancellazione delle tappe' });

      const stmt = db.prepare(`
        INSERT INTO places (
          placeId, itineraryId, name, day, timeSlot,
          lat, lng, address, photoUrl, photoFilename,
          type, note, rating, priceLevel, website, openingHours
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const p of places) {
        const placeId = p.placeId || generateId('place_');

        stmt.run([
          placeId,
          itineraryId,
          p.name || '',
          p.day,
          p.timeSlot,
          p.lat ?? null,
          p.lng ?? null,
          p.address || '',
          p.photoUrl || '',
          p.photoFilename || '',
          p.type || '',
          p.note || '',
          p.rating ?? null,
          p.priceLevel ?? null,
          p.website ?? null,
          p.openingHours ? JSON.stringify(p.openingHours) : null
        ]);
      }

      stmt.finalize((err2) => {
        if (err2) return res.status(500).json({ error: 'Errore inserimento tappe' });
        res.status(200).json({ success: true });
      });
    });
  });
};



//copia un itinerario
exports.copyItinerary = (req, res) => {
  const { itineraryId, userId } = req.params;
  const { startDate, endDate } = req.body;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate ed endDate sono obbligatori' });
  }

  const newStart = new Date(startDate);
  const newEnd = new Date(endDate);

  if (newEnd < newStart) {
    return res.status(400).json({ error: 'endDate non può essere prima di startDate' });
  }

  const requestedDuration = Math.ceil((newEnd - newStart) / (1000 * 60 * 60 * 24)) + 1;

  db.get(
    `SELECT * FROM itineraries WHERE itineraryId = ? AND deleted = 0`,
    [itineraryId],
    (err, originalItinerary) => {
      if (err) return res.status(500).json({ error: 'Errore database' });
      if (!originalItinerary) return res.status(404).json({ error: 'Itinerario non trovato' });

      const originalStart = new Date(originalItinerary.startDate);
      const originalEnd = new Date(originalItinerary.endDate);
      const originalDuration = Math.ceil((originalEnd - originalStart) / (1000 * 60 * 60 * 24)) + 1;

      if (requestedDuration > originalDuration) {
        return res.status(400).json({ error: `La durata scelta (${requestedDuration} giorni) supera quella dell'itinerario originale (${originalDuration} giorni)` });
      }

      const newItineraryId = generateId('trip_');

      db.run(
        `INSERT INTO itineraries 
         (itineraryId, userId, city, accommodation, startDate, endDate, style, coverPhoto, deleted)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [
          newItineraryId,
          userId,
          originalItinerary.city,
          originalItinerary.accommodation,
          newStart.toISOString().split('T')[0],
          newEnd.toISOString().split('T')[0],
          originalItinerary.style,
          originalItinerary.coverPhoto
        ],
        function (err2) {
          if (err2) return res.status(500).json({ error: 'Errore nel duplicare itinerario' });

          // Recupera solo le tappe dei primi "requestedDuration" giorni
          db.all(
            `SELECT * FROM places WHERE itineraryId = ? AND day <= ?`,
            [itineraryId, requestedDuration],
            (err3, places) => {
              if (err3) return res.status(500).json({ error: 'Errore nel recupero tappe' });

              const insertPlace = db.prepare(
                `INSERT INTO places 
                 (itineraryId, name, address, lat, lng, day, timeSlot, photoFilename, type, note, rating, priceLevel, website, openingHours)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
              );

              for (const place of places) {
                insertPlace.run(
                  newItineraryId,
                  place.name,
                  place.address,
                  place.lat,
                  place.lng,
                  place.day,
                  place.timeSlot,
                  place.photoFilename,
                  place.type,
                  place.note,
                  place.rating,
                  place.priceLevel,
                  place.website,
                  place.openingHours
                );
              }

              insertPlace.finalize();

              res.json({ newItineraryId });
            }
          );
        }
      );
    }
  );
};