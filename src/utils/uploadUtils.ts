/**
 * Converts a File object to a base64 Data URL.
 */
export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Generic upload utility that currently falls back to base64 Data URLs.
 * In a production environment, this would upload to Firebase Storage or similar.
 */
export async function uploadFile(file: File, path?: string): Promise<string> {
  // For now, we use Data URLs for persistence in Firestore (as strings)
  // Note: Large images might exceed Firestore document size limits (1MB), 
  // so real apps should use Firebase Storage.
  return await fileToDataUrl(file);
}
