// Cloudinary serves every upload back at its original resolution unless the
// delivery URL asks for something smaller - a product photo shot at
// 3000x3000 gets sent to a 300px grid thumbnail byte-for-byte otherwise,
// which is most of why product pages feel slow to load. Cloudinary decodes
// transformation flags placed right after "/upload/" in the URL, so
// inserting them there resizes, compresses, and re-encodes (to WebP/AVIF
// when the browser supports it) at the CDN edge - no re-upload needed.
//
// Any URL that isn't a Cloudinary delivery URL (a local /uploads path from
// the dev-mode disk fallback, or an external URL an admin pasted directly)
// can't be transformed this way, so it's returned unchanged.
export function optimizedImageUrl(url: string, width: number): string {
  const marker = "/upload/";
  const markerIndex = url.indexOf(marker);
  if (!url.includes("res.cloudinary.com") || markerIndex === -1) return url;
  const insertAt = markerIndex + marker.length;
  return `${url.slice(0, insertAt)}f_auto,q_auto,w_${width}/${url.slice(insertAt)}`;
}
