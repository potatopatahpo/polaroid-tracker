// Google Sheets Sync Configuration
// You need to set up a Google Apps Script web app to handle the sync

const GOOGLE_SCRIPT_URL = localStorage.getItem('googleScriptUrl') || '';

// Save the Google Script URL
export function setGoogleScriptUrl(url) {
    localStorage.setItem('googleScriptUrl', url);
}

export function getGoogleScriptUrl() {
    return localStorage.getItem('googleScriptUrl') || '';
}

// Check if sync is configured
export function isSyncConfigured() {
    return !!getGoogleScriptUrl();
}

// Convert blob to base64
async function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        if (!blob) {
            resolve(null);
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// Convert base64 to blob
function base64ToBlob(base64) {
    if (!base64) return null;
    try {
        const parts = base64.split(',');
        const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
        const bstr = atob(parts[1]);
        const u8arr = new Uint8Array(bstr.length);
        for (let i = 0; i < bstr.length; i++) {
            u8arr[i] = bstr.charCodeAt(i);
        }
        return new Blob([u8arr], { type: mime });
    } catch (e) {
        console.error('Failed to convert base64 to blob:', e);
        return null;
    }
}

// Sync polaroid to Google Sheets
export async function syncToCloud(polaroid) {
    const url = getGoogleScriptUrl();
    if (!url) {
        console.warn('Google Script URL not configured');
        return false;
    }

    try {
        // Prepare data for sync (convert blobs to base64)
        const syncData = {
            action: 'upsert',
            data: {
                id: polaroid.id,
                imageData: polaroid.imageData, // Already base64 string
                thumbnail: await blobToBase64(polaroid.thumbnail),
                idolName: polaroid.idolName,
                groupName: polaroid.groupName,
                eventName: polaroid.eventName || '',
                eventDate: polaroid.eventDate,
                eventLocation: polaroid.eventLocation || '',
                repo: polaroid.repo || '',
                createdAt: polaroid.createdAt,
                updatedAt: polaroid.updatedAt
            }
        };

        const response = await fetch(url, {
            method: 'POST',
            mode: 'no-cors', // Google Apps Script requires this
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(syncData)
        });

        console.log('Synced to cloud:', polaroid.id);
        return true;
    } catch (error) {
        console.error('Failed to sync to cloud:', error);
        return false;
    }
}

// Delete from cloud
export async function deleteFromCloud(id) {
    const url = getGoogleScriptUrl();
    if (!url) return false;

    try {
        await fetch(url, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: 'delete', id })
        });
        return true;
    } catch (error) {
        console.error('Failed to delete from cloud:', error);
        return false;
    }
}

// Fetch all data from cloud
export async function fetchFromCloud() {
    const url = getGoogleScriptUrl();
    if (!url) {
        console.warn('Google Script URL not configured');
        return [];
    }

    try {
        // Use a GET request with a callback for JSONP-style response
        const response = await fetch(`${url}?action=getAll`, {
            method: 'GET',
        });

        const data = await response.json();

        // Convert base64 back to blobs
        return data.map(item => ({
            ...item,
            thumbnail: base64ToBlob(item.thumbnail)
        }));
    } catch (error) {
        console.error('Failed to fetch from cloud:', error);
        return [];
    }
}

// Sync all local data to cloud
export async function syncAllToCloud(polaroids) {
    const url = getGoogleScriptUrl();
    if (!url) return false;

    try {
        for (const polaroid of polaroids) {
            await syncToCloud(polaroid);
        }
        return true;
    } catch (error) {
        console.error('Failed to sync all to cloud:', error);
        return false;
    }
}

// Merge cloud data with local data
export async function mergeWithCloud(localPolaroids, db) {
    const cloudData = await fetchFromCloud();
    if (cloudData.length === 0) return localPolaroids;

    const localMap = new Map(localPolaroids.map(p => [p.id, p]));
    const merged = [...localPolaroids];

    for (const cloudItem of cloudData) {
        const localItem = localMap.get(cloudItem.id);

        if (!localItem) {
            // Cloud item doesn't exist locally, add it
            await db.polaroids.add(cloudItem);
            merged.push(cloudItem);
        } else if (new Date(cloudItem.updatedAt) > new Date(localItem.updatedAt)) {
            // Cloud item is newer, update local
            await db.polaroids.update(cloudItem.id, cloudItem);
            const index = merged.findIndex(p => p.id === cloudItem.id);
            if (index !== -1) merged[index] = cloudItem;
        }
    }

    return merged;
}
