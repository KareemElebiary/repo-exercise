/* =====================================================
   EduVault – Upload Page Logic
   
   Students upload to the ADMIN's Google Drive.
   No Google auth required from students — the admin
   connects Google once from the admin panel, and that
   token is reused here automatically.
   ===================================================== */

let currentSession = null;
let selectedFile = null;

document.addEventListener('DOMContentLoaded', () => {
    // Guard: must be student
    currentSession = requireStudentLogin();
    if (!currentSession) return;

    // Populate sidebar
    populateSidebar();

    // Render past uploads from localStorage
    renderPastUploads();

    // Set file info saved-as name
    updateSavedAsLabel();
});

/* -- Sidebar Population -- */
function populateSidebar() {
    const nameEl = document.getElementById('sidebarName');
    const idEl = document.getElementById('sidebarIdLabel');
    const avatarEl = document.getElementById('sidebarAvatar');

    if (nameEl) nameEl.textContent = `${currentSession.firstName} ${currentSession.lastName}`;
    if (idEl) idEl.textContent = `ID: ${currentSession.id}`;
    if (avatarEl) avatarEl.textContent = currentSession.firstName.charAt(0).toUpperCase();
}

function goProfile(e) {
    e.preventDefault();
    showToast('Profile page coming soon!', 'info');
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('open');
}

/* -------------------------------------------------------
   Google API Callbacks
   On the student upload page, we check for the admin's
   cached token — no student Google auth is ever shown.
------------------------------------------------------- */
function onGoogleAPIsReady() {
    const hasCachedToken = getCachedAdminToken();

    if (hasCachedToken) {
        // Admin has already connected — restore token silently
        gapi.client.setToken({ access_token: hasCachedToken });
        isGoogleAuthorized = true;
        updateGoogleStatus(true, 'Drive ready');
        hideDriveNotReadyBanner();
        onGoogleAuthorized();
    } else {
        // Admin hasn't connected yet — show a notice (not a connect button)
        updateGoogleStatus(false, 'Not connected');
        showDriveNotReadyBanner();
    }
}

function onGoogleAuthorized() {
    hideDriveNotReadyBanner();
    renderPastUploads();
}

/* -------------------------------------------------------
   Drive Not Ready Banner (shown when admin hasn't connected)
------------------------------------------------------- */
function showDriveNotReadyBanner() {
    const banner = document.getElementById('authBanner');
    const uploadCard = document.getElementById('uploadCard');
    if (banner) {
        banner.innerHTML = `
            <div class="auth-banner-icon" style="background: linear-gradient(135deg,#dc2626,#9f1239);">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
            </div>
            <div class="auth-banner-text">
                <h3>Upload Not Available Yet</h3>
                <p>The administrator needs to connect Google Drive first. Please contact your admin and ask them to sign in to the Admin Panel and connect their Google account.</p>
            </div>
        `;
        banner.style.display = '';
    }
    if (uploadCard) uploadCard.style.display = 'none';
}

function hideDriveNotReadyBanner() {
    const banner = document.getElementById('authBanner');
    const uploadCard = document.getElementById('uploadCard');
    if (banner) banner.style.display = 'none';
    if (uploadCard) uploadCard.style.display = '';
}

/* -------------------------------------------------------
   File Handling
------------------------------------------------------- */
function handleDragOver(e) {
    e.preventDefault();
    document.getElementById('dropZone').classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    document.getElementById('dropZone').classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    document.getElementById('dropZone').classList.remove('drag-over');
    const files = e.dataTransfer.files;
    if (files.length > 0) processFile(files[0]);
}

function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) processFile(files[0]);
}

function processFile(file) {
    if (!CONFIG.ALLOWED_TYPES.includes(file.type)) {
        showToast('Invalid file type. Please use JPG, PNG, or WEBP.', 'error');
        return;
    }
    const maxBytes = CONFIG.MAX_FILE_SIZE_MB * 1024 * 1024;
    if (file.size > maxBytes) {
        showToast(`File too large. Max size is ${CONFIG.MAX_FILE_SIZE_MB}MB.`, 'error');
        return;
    }

    selectedFile = file;

    const reader = new FileReader();
    reader.onload = (e) => {
        const preview = document.getElementById('imagePreview');
        const wrapper = document.getElementById('previewWrapper');
        const inner = document.getElementById('dropZoneInner');

        preview.src = e.target.result;
        wrapper.classList.remove('hidden');
        inner.style.display = 'none';

        const fileInfo = document.getElementById('fileInfo');
        fileInfo.classList.remove('hidden');
        document.getElementById('infoFileName').textContent = file.name;
        document.getElementById('infoFileSize').textContent = formatBytes(file.size);
        updateSavedAsLabel();

        document.getElementById('uploadBtn').disabled = false;
        document.getElementById('uploadSuccess').classList.add('hidden');
    };
    reader.readAsDataURL(file);
}

function clearImage(e) {
    e.stopPropagation();
    selectedFile = null;

    document.getElementById('imagePreview').src = '';
    document.getElementById('previewWrapper').classList.add('hidden');
    document.getElementById('dropZoneInner').style.display = '';
    document.getElementById('fileInfo').classList.add('hidden');
    document.getElementById('fileInput').value = '';
    document.getElementById('uploadBtn').disabled = true;
    document.getElementById('uploadSuccess').classList.add('hidden');
}

function updateSavedAsLabel() {
    const savedAsEl = document.getElementById('infoSavedAs');
    if (!savedAsEl || !currentSession) return;
    const ext = selectedFile ? selectedFile.name.split('.').pop().toLowerCase() : 'jpg';
    const safeName = currentSession.firstName.replace(/\s+/g, '_');
    savedAsEl.textContent = `${safeName}_${currentSession.id}.${ext}`;
}

/* -------------------------------------------------------
   Upload Logic
------------------------------------------------------- */
async function uploadImage() {
    if (!selectedFile) {
        showToast('Please select an image first.', 'error');
        return;
    }

    // Check admin's cached token (students never connect themselves)
    const adminToken = getCachedAdminToken();
    if (!adminToken && !gapi.client.getToken()) {
        showToast('Upload not available — admin must connect Google Drive first.', 'error', 5000);
        return;
    }

    // Ensure gapi has the token
    if (!gapi.client.getToken() && adminToken) {
        gapi.client.setToken({ access_token: adminToken });
    }

    const uploadBtn = document.getElementById('uploadBtn');
    const progressContainer = document.getElementById('progressContainer');
    const uploadSuccess = document.getElementById('uploadSuccess');
    const progressBarFill = document.getElementById('progressBarFill');
    const progressPercent = document.getElementById('progressPercent');
    const progressLabel = document.getElementById('progressLabel');

    uploadBtn.disabled = true;
    document.getElementById('uploadBtnText').textContent = 'Uploading...';
    progressContainer.classList.remove('hidden');
    uploadSuccess.classList.add('hidden');
    progressBarFill.style.width = '0%';

    // Filename: FirstName_StudentID.ext  →  goes to admin's Drive
    const ext = selectedFile.name.split('.').pop().toLowerCase();
    const safeName = currentSession.firstName.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${safeName}_${currentSession.id}.${ext}`;

    try {
        progressLabel.textContent = 'Uploading to Google Drive...';

        const driveFile = await uploadToDrive(
            selectedFile,
            fileName,
            CONFIG.DRIVE_MAIN_FOLDER_ID,
            (percent) => {
                progressBarFill.style.width = percent + '%';
                progressPercent.textContent = percent + '%';
            }
        );

        progressLabel.textContent = 'Saving record...';

        // Save upload record locally
        addUpload({
            driveFileId: driveFile.id,
            driveName: driveFile.name,
            driveViewLink: driveFile.webViewLink,
            studentId: currentSession.id,
            firstName: currentSession.firstName,
            lastName: currentSession.lastName,
            uploadedAt: new Date().toISOString(),
            grade: null,
        });

        await sleep(400);

        progressContainer.classList.add('hidden');
        uploadSuccess.classList.remove('hidden');
        document.getElementById('successMsg').textContent =
            `"${fileName}" saved to Google Drive successfully!`;

        showToast('Image uploaded successfully! 🎉', 'success', 4000);
        renderPastUploads();
        clearImage({ stopPropagation: () => { } });

    } catch (err) {
        console.error('Upload error:', err);
        progressContainer.classList.add('hidden');

        // If token expired, clear cache and show specific message
        if (err.message.includes('expired') || err.message.includes('401')) {
            clearCachedAdminToken();
            showDriveNotReadyBanner();
            showToast('Session expired. Please ask admin to reconnect Google from the admin panel.', 'error', 6000);
        } else {
            showToast('Upload failed: ' + err.message, 'error', 5000);
        }
    } finally {
        uploadBtn.disabled = false;
        document.getElementById('uploadBtnText').textContent = 'Upload to Google Drive';
    }
}

/* -------------------------------------------------------
   Past Uploads
------------------------------------------------------- */
function renderPastUploads() {
    const container = document.getElementById('pastUploadsList');
    if (!container || !currentSession) return;

    const allUploads = getUploads();
    const mine = allUploads.filter(u => u.studentId === currentSession.id);

    if (mine.length === 0) {
        container.innerHTML = `<div class="empty-state"><p>No uploads yet. Upload your first image above!</p></div>`;
        return;
    }

    container.innerHTML = mine.slice().reverse().map(u => {
        const date = new Date(u.uploadedAt).toLocaleDateString();
        const imgSrc = u.driveFileId ? getDriveImageUrl(u.driveFileId) : '';
        const gradeTag = u.grade !== null && u.grade !== undefined
            ? `<div class="upload-thumb-grade ${u.grade >= 80 ? 'gold' : u.grade >= 50 ? 'ok' : 'low'}">${u.grade}%</div>`
            : '';
        return `
      <div class="upload-thumb" onclick="window.open('${u.driveViewLink || '#'}', '_blank')" title="View on Google Drive">
        ${imgSrc ? `<img src="${imgSrc}" alt="${u.driveName}" onerror="this.style.display='none'" />` : ''}
        ${gradeTag}
        <div class="upload-thumb-info">
          <div class="upload-thumb-name">${u.driveName}</div>
          <div class="upload-thumb-date">${date}</div>
        </div>
      </div>
    `;
    }).join('');
}

/* -------------------------------------------------------
   Utilities
------------------------------------------------------- */
function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
