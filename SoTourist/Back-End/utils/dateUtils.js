// utils/dateUtils.js
function datesOverlap(start1, end1, start2, end2) {
  return (
    new Date(start1) <= new Date(end2) &&
    new Date(end1) >= new Date(start2)
  );
}

function checkOverlap(startDate, endDate, itineraries, excludeId = null) {
  return itineraries.some(it => {
    if (excludeId && it.itineraryId === excludeId) return false;
    return datesOverlap(startDate, endDate, it.startDate, it.endDate);
  });
}

module.exports = { datesOverlap, checkOverlap };
