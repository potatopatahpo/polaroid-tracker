import Dexie from 'dexie';
import { syncToCloud, deleteFromCloud, isSyncConfigured } from './sync';

export const db = new Dexie('PolaroidTrackerDB');

db.version(1).stores({
    polaroids: '++id, idolName, groupName, eventName, eventDate, eventLocation, format, createdAt, updatedAt, syncedAt'
});

export async function generateThumbnail(imageData, maxSize = 200) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ratio = Math.min(maxSize / img.width, maxSize / img.height);
            canvas.width = img.width * ratio;
            canvas.height = img.height * ratio;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.8);
        };
        img.src = imageData;
    });
}

export async function addPolaroid(polaroidData) {
    const now = new Date().toISOString();
    const thumbnail = await generateThumbnail(polaroidData.imageData);

    const id = await db.polaroids.add({
        ...polaroidData,
        thumbnail,
        createdAt: now,
        updatedAt: now,
        syncedAt: null
    });

    if (isSyncConfigured()) {
        const polaroid = await db.polaroids.get(id);
        try {
            await syncToCloud(polaroid);
            await db.polaroids.update(id, { syncedAt: now });
        } catch (error) {
            console.error('Auto-sync failed:', error);
        }
    }

    return id;
}

export async function getAllPolaroids() {
    return db.polaroids.toArray();
}

export default db;
