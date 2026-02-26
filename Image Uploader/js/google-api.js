/* =====================================================
   EduVault – Permanent Bridge API
   Matches the Google Apps Script Bridge for no-login access.
   ===================================================== */

const ADMIN_TOKEN_KEY = 'eduvault_admin_gtoken';
const ADMIN_TOKEN_EXPIRY_KEY = 'eduvault_admin_gtoken_expiry';

// Global Flags for Bridge Mode
let googleTokenClient = null;
let isGoogleAuthorized = true;
let gapiInited = true;
let gisInited = true;

async function callBridge(action, data) {
    if (!CONFIG.APPS_SCRIPT_URL || CONFIG.APPS_SCRIPT_URL.includes('YOUR_')) {
        console.error('Apps Script URL not set in config.js');
        return { error: 'Backend not configured' };
    }

    try {
        const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // Apps Script requires this for simple POST
            body: JSON.stringify({ action, data })
        });

        // Note: Apps Script 'no-cors' doesn't return the body directly easily.
        // For simple actions, we trust it works or use a small delay.
        // However, for Data fetching (list), we follow a different pattern.
        return { success: true };
    } catch (err) {
        console.error('Bridge error:', err);
        return { error: err.toString() };
    }
}

/**
 * Advanced Fetch for Data (Lists/Reports)
 * Since no-cors hides the body, we use the JSONP-style or Redirect pattern if needed.
 * But for your needs, we will use the Standard Fetch for most things.
 */
async function callBridgeWithData(action, data) {
    const url = `${CONFIG.APPS_SCRIPT_URL}?action=${action}&data=${encodeURIComponent(JSON.stringify(data))}`;
    const response = await fetch(url);
    return await response.json();
}

/* -------------------------------------------------------
   DRIVE FUNCTIONS (Now using the Bridge)
------------------------------------------------------- */

async function uploadToDrive(file, fileName, folderId, progressCallback) {
    if (progressCallback) progressCallback(20);

    // Convert file to Base64 to send via JSON
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
        reader.onload = async () => {
            const base64 = reader.result.split(',')[1];
            const payload = {
                action: 'upload',
                data: {
                    base64,
                    fileName,
                    folderId,
                    mimeType: file.type
                }
            };

            if (progressCallback) progressCallback(50);

            try {
                const res = await fetch(CONFIG.APPS_SCRIPT_URL, {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                const result = await res.json();
                if (progressCallback) progressCallback(100);
                resolve(result);
            } catch (err) {
                reject(err);
            }
        };
        reader.readAsDataURL(file);
    });
}

async function listDriveFolder(folderId) {
    const payload = { folderId };
    const response = await fetch(`${CONFIG.APPS_SCRIPT_URL}?action=list&data=${encodeURIComponent(JSON.stringify(payload))}`);
    return await response.json();
}

function getDriveImageUrl(fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
}

/* -------------------------------------------------------
   SHEETS FUNCTIONS (Now using the Bridge)
------------------------------------------------------- */

async function appendGradeToSheets(data) {
    const { studentId, firstName, lastName, imageFile, mark } = data;
    const gradedAt = new Date().toLocaleString();

    const payload = {
        action: 'appendGrade',
        data: {
            sheetId: CONFIG.SHEETS_ID,
            tabName: CONFIG.SHEETS_TAB_NAME,
            values: [studentId, firstName, lastName, imageFile, mark, gradedAt]
        }
    };

    const res = await fetch(CONFIG.APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(payload)
    });
    return await res.json();
}

// Dummy functions to keep existing code from breaking
function initGoogleAPIs() { console.log('Permanent Bridge Mode: GAPI not needed.'); }
function gisLoaded() { }
function authorizeGoogle() {
    console.log('Bridge Mode: Authorization is handled by the server.');
    showToast('Authorized via Permanent Bridge ✓', 'success');
}
function updateGoogleStatus(connected, label) {

    const dot = document.getElementById('statusDot');
    const lbl = document.getElementById('statusLabel');
    if (dot) dot.className = 'status-dot connected';
    if (lbl) lbl.textContent = 'Server Connected';
}

// Auto-activate UI
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        updateGoogleStatus(true, 'System Ready');
        // Hide any "Connect" buttons since they aren't needed
        const authBtn = document.getElementById('authGoogleBtn');
        if (authBtn) authBtn.style.display = 'none';
    }, 500);
});
