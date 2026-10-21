import type { PresentationPhoto } from '../Interfaces/supplier';
import { fotografiaSchema } from '../schemas/presentaciones';

export async function readPresentationPhoto(file: File): Promise<PresentationPhoto> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension || !['png', 'jpg', 'jpeg', 'webp'].includes(extension)) {
    throw new Error('Usa una imagen PNG, JPG, JPEG o WebP.');
  }
  const expectedMime = extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg' : `image/${extension}`;
  if (file.type && file.type !== expectedMime) throw new Error('El tipo del archivo no coincide con su extensión.');
  if (file.size === 0 || file.size > 204800) throw new Error('La imagen debe tener contenido y pesar máximo 200 KiB.');
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    reader.onload = () => typeof reader.result === 'string'
      ? resolve(reader.result)
      : reject(new Error('No se pudo leer la imagen.'));
    reader.readAsDataURL(file);
  });
  return fotografiaSchema.parse({ nombre: file.name, extension, filepart: data.slice(data.indexOf(',') + 1) });
}

export function presentationPhotoSrc(photo: PresentationPhoto): string {
  const mime = photo.extension === 'jpg' || photo.extension === 'jpeg' ? 'jpeg' : photo.extension;
  return `data:image/${mime};base64,${photo.filepart}`;
}
