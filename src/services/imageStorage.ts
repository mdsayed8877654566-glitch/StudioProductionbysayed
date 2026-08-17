export const imageStorage = {
  dbPromise: null as Promise<IDBDatabase> | null,

  init() {
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open('ImageStore', 1);
        request.onupgradeneeded = (e: any) => {
          e.target.result.createObjectStore('images');
        };
        request.onsuccess = (e: any) => resolve(e.target.result);
        request.onerror = () => reject(request.error);
      });
    }
    return this.dbPromise;
  },

  async saveImage(id: string, file: File): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('images', 'readwrite');
      const store = tx.objectStore('images');
      const request = store.put({ file, type: file.type }, id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async uploadAvatar(userId: string, file: File): Promise<string | null> {
    try {
      const id = `avatar-${userId}-${Date.now()}`;
      await this.saveImage(id, file);
      return `/local-image/${id}`;
    } catch (e) {
      console.error('Failed to upload avatar to local storage:', e);
      return null;
    }
  },

  async uploadPaymentProof(orderNumber: string, file: File): Promise<string | null> {
    try {
      const id = `proof-${orderNumber}-${Date.now()}`;
      await this.saveImage(id, file);
      return `/local-image/${id}`;
    } catch (e) {
      console.error('Failed to upload payment proof to local storage:', e);
      return null;
    }
  }
};
