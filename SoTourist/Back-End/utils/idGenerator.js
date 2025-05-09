function generateId(prefix = '') {
  const randomPart = Math.floor(Math.random() * 100000);
  const timestampPart = Date.now(); // garantisce un valore unico
  return `${prefix}${timestampPart}${randomPart}`;
}

module.exports = generateId;