const BACKEND_URL = 'http://localhost:3000';

export function getPhotoUrl(photoPath?: string | null): string {
  if (!photoPath) {
    return 'assets/images/PaletoBay.jpeg';
  }

  if (photoPath.startsWith('http')) {
    return photoPath;
  }

  // Aggiungiamo 'covers/' se manca
  const relativePath = photoPath.includes('/') ? photoPath : `covers/${photoPath}`;

  return `${BACKEND_URL}/uploads/${relativePath}`;
}
