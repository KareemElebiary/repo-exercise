/* =====================================================
   EduVault – Configuration
   Replace these values with your actual Google API credentials
   ===================================================== */

const CONFIG = {
  // -------------------------------------------------------
  // GOOGLE API CONFIGURATION
  //
  // Step 1: Go to https://console.cloud.google.com/
  // Step 2: Create a new project (e.g. "EduVault")
  // Step 3: Enable APIs:
  //   - Google Drive API
  //   - Google Sheets API
  // Step 4: Create OAuth 2.0 Client ID (Web Application)
  //   - Add your site URL to "Authorized JavaScript Origins"
  //   - For local testing add: http://localhost and http://127.0.0.1:XXXX
  // Step 5: Copy Client ID below
  // Step 6: Create an API Key and copy it below
  // Step 7: Create a Google Sheet and copy its ID from the URL:
  //   https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit
  // Step 8: Create a Google Drive folder for student images,
  //   share it so anyone with link can view, copy its ID from the URL
  // -------------------------------------------------------

  GOOGLE_CLIENT_ID: '339330359436-3isvrgr3tkp1donf9canp0sbsjsjgs5o.apps.googleusercontent.com',
  GOOGLE_API_KEY: 'AIzaSyBdLIt05KrZipY1ZPMqReb0G_z-K1EoeHc',

  // Google Drive folder IDs
  DRIVE_MAIN_FOLDER_ID: '10X8N1JB6V99f1zMJibT_407gZcQGdgHY',         // Main student images folder
  DRIVE_HIGH_ACHIEVERS_FOLDER_ID: '1Q8mE7R75nE9jTaAbjvhUi4Wgq8TI_Evl', // ≥80% images folder

  // Google Sheets ID (the spreadsheet where grades are saved)
  SHEETS_ID: '1OnbaIhAEjqjfUA0xEcfJDfCoR5Iot3vhjr5w0F5fsRM',
  SHEETS_TAB_NAME: 'Grades',   // Sheet tab name (default first sheet)

  // --- NEW PERMANENT BRIDGE ---
  // Paste the Web App URL you got from Google Apps Script here
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbztfb_lztg7ttt10yOccRKAlnZILSa29AdRSY_4PCTKNWvr8UZqUocdXXKqZC-09VvK/exec',


  // Admin Credentials (simple client-side check – for production use a real backend)
  ADMIN_USERNAME: 'admin',
  ADMIN_PASSWORD: 'admin123',

  // Google API Scopes
  SCOPES: [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/spreadsheets',
  ].join(' '),

  // Discovery docs
  DISCOVERY_DOCS: [
    'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
    'https://www.googleapis.com/discovery/v1/apis/sheets/v4/rest',
  ],

  // App Settings
  HIGH_SCORE_THRESHOLD: 80,   // % threshold for high achievers folder
  MAX_FILE_SIZE_MB: 10,        // Max upload file size
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
};
