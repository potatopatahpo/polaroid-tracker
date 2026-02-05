import Dexie from 'dexie';
import { syncToCloud, deleteFromCloud, isSyncConfigured } from './sync';

export const db = new Dexie('PolaroidTrackerDB');

db.version(1).stores({
  polaroids: '++id, idolName, groupName, eventName, eventDate, eventLocation, repo, createdAt, updatedAt, syncedAt'
});

// Generate a thumbnail from image data
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
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.7);
    };
    img.src = imageData;
  });
}

// Add a new polaroid
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

  // Auto-sync to cloud if configured
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

// Update a polaroid
export async function updatePolaroid(id, updates) {
  const now = new Date().toISOString();
  await db.polaroids.update(id, {
    ...updates,
    updatedAt: now
  });

  // Auto-sync to cloud if configured
  if (isSyncConfigured()) {
    const polaroid = await db.polaroids.get(id);
    try {
      await syncToCloud(polaroid);
      await db.polaroids.update(id, { syncedAt: now });
    } catch (error) {
      console.error('Auto-sync failed:', error);
    }
  }
}

// Delete a polaroid
export async function deletePolaroid(id) {
  await db.polaroids.delete(id);

  // Auto-sync deletion to cloud if configured
  if (isSyncConfigured()) {
    try {
      await deleteFromCloud(id);
    } catch (error) {
      console.error('Auto-sync delete failed:', error);
    }
  }
}

// Get all polaroids
export async function getAllPolaroids() {
  return db.polaroids.toArray();
}

// Get polaroids by month (YYYY-MM format)
export async function getPolaroidsByMonth(yearMonth) {
  const [year, month] = yearMonth.split('-').map(Number);
  const startDate = new Date(year, month - 1, 1).toISOString();
  const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

  return db.polaroids
    .where('eventDate')
    .between(startDate, endDate)
    .toArray();
}

// Get statistics
export async function getStats(period = 'all') {
  const polaroids = await getAllPolaroids();
  const now = new Date();

  let filtered = polaroids;

  if (period === 'month') {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    filtered = polaroids.filter(p => new Date(p.eventDate) >= startOfMonth);
  } else if (period === 'year') {
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    filtered = polaroids.filter(p => new Date(p.eventDate) >= startOfYear);
  }

  // Group by idol
  const byIdol = {};
  const byGroup = {};
  const byMonth = {};

  filtered.forEach(p => {
    // By idol
    if (!byIdol[p.idolName]) {
      byIdol[p.idolName] = { count: 0, group: p.groupName };
    }
    byIdol[p.idolName].count++;

    // By group
    if (!byGroup[p.groupName]) {
      byGroup[p.groupName] = 0;
    }
    byGroup[p.groupName]++;

    // By month
    const month = p.eventDate.substring(0, 7);
    if (!byMonth[month]) {
      byMonth[month] = 0;
    }
    byMonth[month]++;
  });

  return {
    total: filtered.length,
    byIdol,
    byGroup,
    byMonth
  };
}

export default db;
