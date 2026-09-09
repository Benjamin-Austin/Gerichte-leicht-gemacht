const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxImageBytes = 2_000_000;
const maxImageDimension = 4096;

export type ValidatedImage = {
  dataUrl: string;
  width: number;
  height: number;
};

export function validateImageFile(file: File): Promise<ValidatedImage> {
  if (!allowedImageTypes.has(file.type)) {
    return Promise.reject(new Error("Bitte wähle ein JPG-, PNG- oder WebP-Bild aus."));
  }
  if (file.size > maxImageBytes) {
    return Promise.reject(new Error("Das Bild darf höchstens 2 MB gross sein."));
  }

  return new Promise((resolve, reject) => {
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
        resolve({ dataUrl, width: image.width, height: image.height });
      };
      image.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}
