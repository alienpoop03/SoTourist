export function getCityName(rawCity: string): string {
  if (!rawCity) return '';
  const raw = rawCity.split(',')[0].trim();

  const cleaned = raw
    .replace(/\b\d{5}\b/g, '')        // rimuove CAP
    .replace(/\b[A-Z]{2}\b/g, '')     // rimuove sigle tipo RM
    .replace(/\s{2,}/g, ' ')          // rimuove spazi doppi
    .trim();

  return cleaned
    .toLowerCase()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function getAccommodationName(fullAccommodation: string): string {
  if (!fullAccommodation) return '';
  return fullAccommodation.split(',')[0];
}
