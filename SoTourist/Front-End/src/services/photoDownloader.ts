import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

export async function downloadPlacePhoto(photoReference: string, filename: string): Promise<string> {
const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1000&photoreference=${photoReference}&key=${process.env['GOOGLE_API_KEY']}`;

  const response = await axios.get(photoUrl, { responseType: 'stream' });

  const dataStream = response.data as Readable;

  const uploadsDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
  }

  const filepath = path.join(uploadsDir, filename);
  const writer = fs.createWriteStream(filepath);

  return new Promise((resolve, reject) => {
    dataStream.pipe(writer);
    writer.on('finish', () => resolve(filepath));
    writer.on('error', reject);
  });
}

// npm install --save-dev @types/axios	