// Browser-side image shrinking, shared by the profile photo and chat attachments.

/**
 * Scales an image down so its longest side is at most `maks` px and re-encodes it.
 * Returns null if the browser cannot decode it. Safari cannot encode WebP and silently returns PNG,
 * so callers must use the returned blob's own type.
 */
export async function kecilkanGambar(file: File, maks: number, tipe: "image/webp" | "image/jpeg", kualitas = 0.85): Promise<Blob | null> {
  try {
    const bmp = await createImageBitmap(file);
    const skala = Math.min(1, maks / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * skala);
    canvas.height = Math.round(bmp.height * skala);
    const ctx = canvas.getContext("2d")!;
    // JPEG has no transparency: paint white first so transparent PNGs do not turn black.
    if (tipe === "image/jpeg") {
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();
    return await new Promise<Blob | null>((ok) => canvas.toBlob(ok, tipe, kualitas));
  } catch {
    return null;
  }
}

export const keDataUrl = (b: Blob) =>
  new Promise<string>((ok, gagal) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result));
    r.onerror = () => gagal(r.error);
    r.readAsDataURL(b);
  });
