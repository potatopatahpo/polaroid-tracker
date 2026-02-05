/**
 * Polaroid Tracker - Google Apps Script
 * 
 * 這個腳本處理 Polaroid Tracker App 的雲端同步功能。
 * 
 * 設定步驟：
 * 1. 建立一個新的 Google Spreadsheet
 * 2. 點擊 Extensions → Apps Script
 * 3. 刪除所有預設代碼
 * 4. 複製並貼上這個腳本
 * 5. 保存 (Ctrl+S)
 * 6. 點擊 Deploy → New deployment
 * 7. 選擇 "Web app"
 * 8. 設定：
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 9. 點擊 Deploy
 * 10. 複製 Web app URL 到 App 的設定頁面
 */

const SHEET_NAME = 'Polaroids';

function doGet(e) {
    const action = e.parameter.action;

    if (action === 'getAll') {
        return getAllData();
    }

    return ContentService.createTextOutput(JSON.stringify({ error: 'Invalid action' }))
        .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
    try {
        const data = JSON.parse(e.postData.contents);
        const action = data.action;

        if (action === 'upsert') {
            return upsertData(data.data);
        } else if (action === 'delete') {
            return deleteData(data.id);
        }

        return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Invalid action' }))
            .setMimeType(ContentService.MimeType.JSON);
    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.message }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

function getOrCreateSheet() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
        sheet = ss.insertSheet(SHEET_NAME);
        // Add headers
        sheet.getRange(1, 1, 1, 12).setValues([[
            'id', 'imageData', 'thumbnail', 'idolName', 'groupName',
            'eventName', 'eventDate', 'eventLocation', 'repo',
            'createdAt', 'updatedAt', 'syncedAt'
        ]]);
    }

    return sheet;
}

function getAllData() {
    const sheet = getOrCreateSheet();
    const data = sheet.getDataRange().getValues();

    if (data.length <= 1) {
        return ContentService.createTextOutput(JSON.stringify([]))
            .setMimeType(ContentService.MimeType.JSON);
    }

    const headers = data[0];
    const rows = data.slice(1);

    const result = rows.map(row => {
        const obj = {};
        headers.forEach((header, i) => {
            obj[header] = row[i];
        });
        return obj;
    });

    return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
}

function upsertData(polaroid) {
    const sheet = getOrCreateSheet();
    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    // Find existing row
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
        if (data[i][0] === polaroid.id) {
            rowIndex = i + 1; // 1-indexed
            break;
        }
    }

    const rowData = [
        polaroid.id,
        polaroid.imageData,
        polaroid.thumbnail,
        polaroid.idolName,
        polaroid.groupName,
        polaroid.eventName || '',
        polaroid.eventDate,
        polaroid.eventLocation || '',
        polaroid.repo || '',
        polaroid.createdAt,
        polaroid.updatedAt,
        new Date().toISOString()
    ];

    if (rowIndex > 0) {
        // Update existing row
        sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
    } else {
        // Append new row
        sheet.appendRow(rowData);
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
}

function deleteData(id) {
    const sheet = getOrCreateSheet();
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
        if (data[i][0] === id) {
            sheet.deleteRow(i + 1);
            break;
        }
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
}
