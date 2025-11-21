// Helpers to normalize book title/author keys and sanitize cover URLs
export function normalizeString(str = '') {
  if (!str) return '';
  // Remove diacritics, convert to lowercase, collapse whitespace and remove punctuation
  try {
    const noDiacritics = str.normalize ? str.normalize('NFD').replace(/\p{Diacritic}/gu, '') : str;
    return String(noDiacritics)
      .toLowerCase()
      .replace(/[\u2018\u2019\u201c\u201d]/g, "")
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  } catch (e) {
    return String(str).toLowerCase().replace(/\s+/g, ' ').trim();
  }
}

export function normalizeKey(title = '', author = '') {
  return `${normalizeString(title)}___${normalizeString(author)}`;
}

export function sanitizeImageUrl(url) {
  if (!url) return '';
  const s = String(url).trim();
  if (!s) return '';
  // Remove surrounding quotes
  const cleaned = s.replace(/^"|"$/g, '').replace(/^'|'$/g, '');
  // If protocol-relative, add https:
  if (cleaned.startsWith('//')) return 'https:' + cleaned;
  // If starts with http(s) or with a single slash (relative), accept it
  if (/^https?:\/\//i.test(cleaned) || cleaned.startsWith('/')) return cleaned;
  // Some entries may be missing protocol but include domain, try https
  if (/^[^\s]+\.[^\s]{2,}/.test(cleaned)) return 'https://' + cleaned;
  return '';
}

export function makePubDataMap(pubData = []) {
  const map = new Map();
  for (const b of pubData) {
    const key = normalizeKey(b.Book || b.title || '', b.Author || b.author || '');
    const img = sanitizeImageUrl(b.Image_URL || b.Image || b.coverImage || '');
    map.set(key, { raw: b, coverImage: img, amazonUrl: b.Amazon_URL || b.Amazon || b.AmazonURL || '' });
  }
  return map;
}

export function getCoverFromPublic(book, pubMap) {
  if (!book) return '';
  const key = normalizeKey(book.title || book.Book || '', book.author || book.Author || '');
  const entry = pubMap.get(key);
  return entry ? entry.coverImage || '' : '';
}
