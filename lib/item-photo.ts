const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
export function validatePhoto(file: Pick<File, 'type' | 'size'>) {
  if (!allowedTypes.includes(file.type)) throw new Error('Choose a JPG, PNG, or WebP photo. For HEIC photos, export a JPG first.');
  if (file.size > 15 * 1024 * 1024) throw new Error('This photo is too large. Choose one under 15 MB.');
  if (!file.size) throw new Error('This photo is empty. Please choose another.');
}
export function photoDimensions(width: number, height: number) {
  if (!(width > 0 && height > 0) || !Number.isFinite(width * height)) throw new Error('This photo could not be read. Please choose another.');
  const scale = Math.min(1, 1000 / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}
export async function preparePhoto(file: File): Promise<string> {
  validatePhoto(file);
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    try { await image.decode(); } catch { throw new Error('This photo could not be read. Try another JPG, PNG, or WebP.'); }
    const size = photoDimensions(image.naturalWidth, image.naturalHeight);
    const canvas = document.createElement('canvas');
    canvas.width = size.width; canvas.height = size.height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Photos aren’t supported in this browser. Try a different browser.');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, size.width, size.height);
    context.drawImage(image, 0, 0, size.width, size.height);
    const photo = canvas.toDataURL('image/jpeg', 0.78);
    if (!photo.startsWith('data:image/jpeg;base64,')) throw new Error('Could not prepare this photo. Please try another.');
    return photo;
  } finally { URL.revokeObjectURL(url); }
}
