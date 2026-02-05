// Google Sheets Sync Configuration
const DEFAULT_URL = 'https://script.google.com/macros/s/AKfycbadA3GXT-fa-J6-k7SPSphwFXXDwbEIIAOENYIUq9gCr81qGGNAYX4zAFyEdGz-Qv7/exec';

export function setGoogleScriptUrl(url) {
    localStorage.setItem('googleScriptUrl', url);
}

export function getGoogleScriptUrl() {
    return localStorage.getItem('googleScriptUrl') || DEFAULT_URL;
}

export function isSyncConfigured() {
    return !!getGoogleScriptUrl();
}

export async function syncToCloud(polaroid) {
    const url = getGoogleScriptUrl();
    if (!url) return false;

    try {
        // Construct payload to match Google Sheet columns:
        // ID, IdolName, Groups, EventName, Date, Location, Format, ImageData
        const payload = {
            id: polaroid.id,
            idolName: polaroid.idolName || '',
            groups: polaroid.groupName || '',
            eventName: polaroid.eventName || '',
            date: polaroid.eventDate || '',
            location: polaroid.eventLocation || '',
            format: polaroid.format || 'mini',
            imageData: polaroid.imageData // Base64 string
        };

        const response = await fetch(url, {
            method: 'POST',
            mode: 'no-cors', // Essential for Google Apps Script
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        return true;
    } catch (error) {
        console.error('Sync failed:', error);
        return false;
    }
}

export async function deleteFromCloud(id) {
    // Current simple implementation only appends new rows
    return true;
}

export async function fetchFromCloud() {
    // Current simple implementation is write-only
    return [];
}

export async function syncAllToCloud(polaroids) {
    for (const p of polaroids) {
        await syncToCloud(p);
    }
    return true;
}
