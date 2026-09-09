import { supabase } from './supabase'

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxImageBytes = 2_000_000;
const maxImageDimension = 4096;

export type ValidatedImage = {
  storagePath: string;
  imageUrl: string;
  width: number;
  height: number;
};

type UploadOptions = {
  bucket: 'recipe-covers' | 'preparation-images';
  recipeId: string;
};

export async function validateImageFile(file: File, options: UploadOptions): Promise<ValidatedImage> {
  if (!allowedImageTypes.has(file.type)) {
    throw new Error("Bitte wähle ein JPG-, PNG- oder WebP-Bild aus.");
  }
  if (file.size > maxImageBytes) {
    throw new Error("Das Bild darf höchstens 2 MB gross sein.");
  }

  const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Das Bild konnte nicht gelesen werden."));
    reader.onload = () => {
      const dataUrl = String(reader.result);
      const image = new Image();
      image.onerror = () => reject(new Error("Die Bilddatei ist ungültig."));
      image.onload = () => {
        if (image.width > maxImageDimension || image.height > maxImageDimension) {
          reject(new Error("Das Bild darf höchstens 4096 Pixel breit oder hoch sein."));
          return;
        }
        resolve({ width: image.width, height: image.height });
      };
      image.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error('Bitte melde dich an, bevor du ein Bild hochlädst.');
  const extension = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1];
  const storagePath = `${userData.user.id}/${options.recipeId}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from(options.bucket).upload(storagePath, file, {
    contentType: file.type,
    upsert: false,
  });
  if (uploadError) throw uploadError;
  const { data: signedData, error: signedError } = await supabase.storage.from(options.bucket).createSignedUrl(storagePath, 3600);
  if (signedError) throw signedError;
  return { storagePath, imageUrl: signedData.signedUrl, ...dimensions };
}
