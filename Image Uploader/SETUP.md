# EduVault – Setup Guide

## Overview
EduVault is a student image upload portal that saves student photos to **Google Drive** and grades to **Google Sheets**. Images scored ≥80% are automatically copied to a separate "High Achievers" folder.

---

## 🚀 Quick Setup (5 Steps)

### Step 1: Create a Google Cloud Project

1. Go to [https://console.cloud.google.com/](https://console.cloud.google.com/)
2. Click **"New Project"** → Name it `EduVault` → Click **Create**
3. Select your new project from the dropdown

### Step 2: Enable the Required APIs

1. In your project, go to **APIs & Services → Library**
2. Search for and **Enable** both:
   - ✅ **Google Drive API**
   - ✅ **Google Sheets API**

### Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services → Credentials**
2. Click **"+ CREATE CREDENTIALS"** → Choose **"OAuth client ID"**
3. If prompted, configure the consent screen first:
   - User type: **External**
   - Fill in App name, support email, developer email → Save
4. Back at Create Credentials → OAuth client ID:
   - Application type: **Web application**
   - Name: `EduVault Web`
   - **Authorized JavaScript origins** — add your serving URL, e.g.:
     - `http://localhost` (for local testing)
     - `http://127.0.0.1:5500` (if using VS Code Live Server)
     - `https://yourdomain.com` (for production)
   - Click **Create**
5. Copy the **Client ID** (looks like `123456-abc.apps.googleusercontent.com`)

### Step 4: Create an API Key

1. Go to **APIs & Services → Credentials**
2. Click **"+ CREATE CREDENTIALS"** → Choose **"API key"**
3. (Optional but recommended) Restrict the key to your domain
4. Copy the **API Key**

### Step 5: Set Up Google Drive Folders & Google Sheet

#### Google Drive Folders
1. Go to [https://drive.google.com/](https://drive.google.com/)
2. Create a folder named **"Student Images"**
3. Right-click it → **Share** → Change to "Anyone with the link can view"
4. Copy the folder ID from the URL:
   `https://drive.google.com/drive/folders/FOLDER_ID_IS_HERE`
5. Create another folder named **"High Achievers"** and do the same
6. Copy both folder IDs

#### Google Sheet
1. Go to [https://sheets.google.com/](https://sheets.google.com/)
2. Create a new spreadsheet named **"EduVault Grades"**
3. Rename the first tab to **`Grades`**
4. Copy the Sheet ID from the URL:
   `https://docs.google.com/spreadsheets/d/SHEET_ID_IS_HERE/edit`

---

## ⚙️ Configure the App

Open `js/config.js` and replace the placeholder values:

```javascript
GOOGLE_CLIENT_ID: 'YOUR_CLIENT_ID.apps.googleusercontent.com',
GOOGLE_API_KEY: 'YOUR_API_KEY',
DRIVE_MAIN_FOLDER_ID: 'your_student_images_folder_id',
DRIVE_HIGH_ACHIEVERS_FOLDER_ID: 'your_high_achievers_folder_id',
SHEETS_ID: 'your_google_sheets_id',
```

You can also change the admin credentials:
```javascript
ADMIN_USERNAME: 'admin',
ADMIN_PASSWORD: 'admin123',   // CHANGE THIS!
```

---

## 🌐 Running the App

> **Important:** Google APIs require the app to be served over HTTP/HTTPS — you cannot open the HTML files directly with `file://`.

### Option A: VS Code Live Server (Recommended)
1. Install the **Live Server** extension in VS Code
2. Right-click `index.html` → **"Open with Live Server"**
3. The app opens at `http://127.0.0.1:5500`
4. Add `http://127.0.0.1:5500` to your OAuth Authorized Origins

### Option B: Python HTTP Server
```bash
# In the project folder:
python -m http.server 8080
# Then open: http://localhost:8080
```

### Option C: Node.js `serve`
```bash
npx serve .
# Then open the URL shown in terminal
```

---

## 📋 How to Use

### Student Flow
1. Go to `index.html` → Click **Student** tab
2. If new: click **"Register here"** → fill out the form with:
   - First Name, Last Name, Student ID, Email, Password
3. Log in with Student ID + Password
4. On the upload page, **drag & drop** or click to select your image
5. Click **"Upload to Google Drive"** and authorize Google if prompted
6. Your image is saved as `FirstName_StudentID.jpg` in the Drive folder

### Admin Flow
1. Go to `index.html` → Click **Admin** tab
2. Log in with admin credentials (default: `admin` / `admin123`)
3. Click **"Connect Google"** → authorize Google
4. All student images load automatically
5. Use **← →** arrow buttons (or keyboard arrows) to navigate between images
6. The right panel shows:
   - Student **First Name**, **Last Name**, **Student ID**
   - Upload date
   - Grade input field
7. Enter a mark (0–100) → Click **"Submit Grade"** or press **Enter**
8. Grade is saved to Google Sheets automatically
9. If grade ≥ 80%: image is **copied** to the High Achievers folder

---

## 📊 Google Sheets Format

The **Grades** sheet is automatically populated with headers:

| Student ID | First Name | Last Name | Image File | Mark | Graded At |
|------------|------------|-----------|------------|------|-----------|
| 20231234   | Ahmed      | Hassan    | Ahmed_20231234.jpg | 85 | 2/26/2026 |

---

## 🔒 Security Notes

- Admin credentials are stored in `js/config.js` (client-side). For production, use a real backend with server-side authentication.
- Student passwords are stored in `localStorage` (browser). This is suitable for demos/internal tools, not production.
- For a production-grade app, consider using Firebase Authentication or a proper backend.

---

## 📁 File Structure

```
Image Uploader/
├── index.html          # Login page (Student + Admin tabs)
├── register.html       # Student registration
├── upload.html         # Student image upload dashboard
├── admin.html          # Admin review & grading panel
├── css/
│   ├── style.css       # Main design system & shared styles
│   ├── dashboard.css   # Upload page styles
│   └── admin.css       # Admin panel styles
├── js/
│   ├── config.js       # ← EDIT THIS with your credentials!
│   ├── auth.js         # Shared auth utilities
│   ├── login.js        # Login page logic
│   ├── register.js     # Registration page logic
│   ├── google-api.js   # Google Drive & Sheets API layer
│   ├── upload.js       # Upload page logic
│   └── admin.js        # Admin panel logic
└── SETUP.md            # This file
```
