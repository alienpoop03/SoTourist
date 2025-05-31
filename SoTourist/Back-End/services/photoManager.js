const fs = require('fs');
const path = require('path');
const axios = require('axios');

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const uploadsDir = path.join(__dirname, '../uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

async function getOrDownloadPhoto(placeId, photoReference) {
  const filename = `${placeId}.jpg`;
  const filepath = path.join(uploadsDir, filename);

  if (fs.existsSync(filepath)) {
    return filename;
  }

  try {
    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1000&photoreference=${photoReference}&key=${GOOGLE_API_KEY}`;
    
    const response = await axios.get(photoUrl, { 
      responseType: 'stream', 
      maxRedirects: 5    // <-- QUI LA CHIAVE
    });

    await new Promise((resolve, reject) => {
      const stream = fs.createWriteStream(filepath);
      response.data.pipe(stream);
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    return filename;
  } catch (err) {
    console.error('Errore download immagine:', err);
    throw err;
  }
}

module.exports = { getOrDownloadPhoto };
