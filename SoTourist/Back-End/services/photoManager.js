const fs = require('fs');
const path = require('path');
const axios = require('axios');

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// Crea la cartella se non esiste
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Scarica una foto da Google e la salva nella cartella uploads/[subfolder]/
async function getOrDownloadPhoto(fileId, photoReference, subfolder = 'places') {
  console.log(`getOrDownloadPhoto(fileId=${fileId}, subfolder=${subfolder})`);

  const baseDir = path.join(__dirname, '..', 'uploads');
  const folderPath = path.join(baseDir, subfolder);
  const filename = `${fileId}.jpg`;
  const filepath = path.join(folderPath, filename);

  ensureDir(folderPath);

  console.log(`[PHOTO] Verifico presenza foto per ${fileId} in ${subfolder}/`);
  if (fs.existsSync(filepath)) {
    console.log('[PHOTO] Presente in cache:', `${subfolder}/${filename}`);
    return `${subfolder}/${filename}`;
  }

  try {
    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1000&photoreference=${photoReference}&key=${GOOGLE_API_KEY}`;
    console.log('[PHOTO] Download da Google...');

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

    console.log('[PHOTO] Salvata in:', `${subfolder}/${filename}`);
    return `${subfolder}/${filename}`;
  } catch (err) {
    console.error('[PHOTO] Errore download:', err.message);
    throw err;
  }
}

// Cerca una foto della città e la salva come copertina
async function getCityCoverPhoto(rawCity) {
  console.log('Ricerca cover per città:', rawCity);

  try {
    const resp = await axios.get(
      'https://maps.googleapis.com/maps/api/place/textsearch/json',
      {
        params: {
          query: `Monumenti famosi a ${rawCity}`,
          key: GOOGLE_API_KEY
        }
      }
    );

    console.log('Risultati trovati:', resp.data.results.length);

    const first = resp.data.results.find(p => p.photos?.[0]);
    if (!first) return null;

    const placeId = first.place_id;
    const ref = first.photos[0].photo_reference;

    console.log('placeId:', placeId);
    console.log('photoReference:', ref);

    const savedPath = await getOrDownloadPhoto(placeId, ref, 'covers');
    return savedPath;
  } catch (err) {
    console.warn('Errore download cover:', err.message);
    return null;
  }
}

module.exports = {
  getOrDownloadPhoto,
  getCityCoverPhoto
};