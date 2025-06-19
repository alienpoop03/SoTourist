const fs = require('fs');
const path = require('path');
const axios = require('axios');

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

/**
 * Crea la cartella se non esiste
 */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function normalizeFileId(input) {
  return input
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // rimuove accenti
    .replace(/[^a-z0-9]+/g, '-')                     // non alfanumerici → trattino
    .replace(/-+/g, '-')                             // trattini doppi
    .replace(/^-|-$/g, '');                          // trattini ai bordi
}


/**
 * Scarica (se necessario) una foto da Google e la salva nella cartella uploads/[subfolder]/.
 * @param {string} fileId - Nome del file senza estensione (placeId o cityName normalizzato)
 * @param {string} photoReference - Google photo_reference
 * @param {string} subfolder - Nome sottocartella dentro `uploads/` ('places' o 'covers')
 * @returns {Promise<string>} - Ritorna `places/abc123.jpg` oppure `covers/roma.jpg`
 */
async function getOrDownloadPhoto(fileId, photoReference, subfolder = 'places') {
  console.log(`🛠️ Chiamata getOrDownloadPhoto(fileId=${fileId}, subfolder=${subfolder})`);

  const baseDir = path.join(__dirname, '..', 'uploads');
  const folderPath = path.join(baseDir, subfolder);
  const filename = `${fileId}.jpg`;
  const filepath = path.join(folderPath, filename);

  ensureDir(folderPath);

  console.log(`🔍 [PHOTO] Controllo foto per ${fileId} in ${subfolder}/`);
  if (fs.existsSync(filepath)) {
    console.log('✅ [PHOTO] Già esiste → uso cache:', `${subfolder}/${filename}`);
    return `${subfolder}/${filename}`;
  }

  try {
    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1000&photoreference=${photoReference}&key=${GOOGLE_API_KEY}`;
    console.log('🌐 [PHOTO] Scarico da Google:', photoUrl);

    const response = await axios.get(photoUrl, {
      responseType: 'stream',
      maxRedirects: 5
    });

    await new Promise((resolve, reject) => {
      const stream = fs.createWriteStream(filepath);
      response.data.pipe(stream);
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    console.log('📦 [PHOTO] Salvata in:', `${subfolder}/${filename}`);
    return `${subfolder}/${filename}`;
  } catch (err) {
    console.error('❌ [PHOTO] Errore durante il download:', err.message);
    throw err;
  }
}

/**
 * Cerca su Google una foto famosa della città e la salva come copertina.
 * @param {string} rawCity - Nome città originale (es. "Palermo PA, Italia")
 * @returns {Promise<string|null>} - Es: "covers/palermo-pa-italia.jpg" o null se fallisce
 */
async function getCityCoverPhoto(rawCity) {
  const normalizedCity = normalizeFileId(rawCity);
  console.log('🌆 CITTÀ da cercare:', rawCity);
  console.log('📛 Normalizzata:', normalizedCity);

  try {
    const resp = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
      params: {
        query: `monumenti famosi a ${rawCity}`,
        key: GOOGLE_API_KEY
      }
    });

    console.log('📦 RISULTATI ricevuti da Google:', resp.data.results.length);

    const first = resp.data.results.find(p => p.photos?.[0]);
    if (!first) return null;

    const ref = first.photos[0].photo_reference;
    console.log('🖼️ PHOTO REF trovata:', ref);

    const savedPath = await getOrDownloadPhoto(normalizedCity, ref, 'covers');
    return savedPath;
  } catch (err) {
    console.warn('⚠️ Errore download cover:', err.message);
    return null;
  }
}


module.exports = {
  getOrDownloadPhoto,
  getCityCoverPhoto
};
