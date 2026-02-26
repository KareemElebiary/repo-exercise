/* =====================================================
   EduVault – Admin Panel Logic
   ===================================================== */

let adminSession = null;
let allImages = [];          // Array of image objects from Drive + local uploads
let currentImageIndex = 0;
let gradesCache = {};        // { driveFileId: grade }

document.addEventListener('DOMContentLoaded', () => {
    adminSession = requireAdminLogin();
    if (!adminSession) return;

    // Keyboard navigation
    document.addEventListener('keydown', handleKeydown);
});

/* -------------------------------------------------------
   Google API Callbacks
------------------------------------------------------- */
function onGoogleAPIsReady() {
    updateGoogleStatus(false, 'Click to connect');
    const authBtn = document.getElementById('authGoogleBtn');
    if (authBtn) authBtn.style.display = '';

    const token = gapi.client.getToken();
    if (token) {
        isGoogleAuthorized = true;
        updateGoogleStatus(true, 'Connected');
        onGoogleAuthorized();
    }
}

async function onGoogleAuthorized() {
    updateGoogleStatus(true, 'Connected');
    showToast('Google Drive connected! Loading student images...', 'success');
    await loadAllImages();
}

/* -------------------------------------------------------
   Load All Images from Drive
------------------------------------------------------- */
async function loadAllImages() {
    showViewerState('loading');

    try {
        // Load grades from Sheets
        const sheetRows = await readGradesFromSheets();
        gradesCache = {};
        sheetRows.forEach(row => {
            // row: [studentId, firstName, lastName, imageFile, mark, gradedAt]
            if (row[3] && row[4]) {
                gradesCache[row[3]] = { // key: imageFile name
                    studentId: row[0],
                    firstName: row[1],
                    lastName: row[2],
                    mark: parseFloat(row[4]),
                    gradedAt: row[5],
                };
            }
        });

        // Load images from Drive folder
        const driveFiles = await listDriveFolder(CONFIG.DRIVE_MAIN_FOLDER_ID);

        // Merge with local uploads data for student info
        const localUploads = getUploads();

        allImages = driveFiles.map(file => {
            // Find matching local upload record for student info
            const localRecord = localUploads.find(u => u.driveFileId === file.id || u.driveName === file.name);

            // Parse student info from filename: FirstName_StudentID.ext
            let firstName = '', lastName = '', studentId = '';
            if (localRecord) {
                firstName = localRecord.firstName;
                lastName = localRecord.lastName;
                studentId = localRecord.studentId;
            } else {
                // Try parse from filename
                const namePart = file.name.replace(/\.[^.]+$/, ''); // remove extension
                const parts = namePart.split('_');
                if (parts.length >= 2) {
                    studentId = parts[parts.length - 1];
                    firstName = parts.slice(0, parts.length - 1).join(' ');
                }
                // Look up student DB for last name
                const student = findStudentById(studentId);
                if (student) {
                    firstName = student.firstName;
                    lastName = student.lastName;
                }
            }

            // Check if graded
            const gradeInfo = gradesCache[file.name];
            const grade = gradeInfo ? gradeInfo.mark : (localRecord ? localRecord.grade : null);

            return {
                id: file.id,
                name: file.name,
                webViewLink: file.webViewLink,
                thumbnailLink: file.thumbnailLink,
                createdTime: file.createdTime,
                firstName,
                lastName,
                studentId,
                grade: grade !== undefined ? grade : null,
            };
        });

        if (allImages.length === 0) {
            showViewerState('empty');
            return;
        }

        showViewerState('main');
        buildThumbnailStrip();
        navigateTo(0);
        updateStats();
    } catch (err) {
        console.error('Error loading images:', err);
        showViewerState('empty');
        showToast('Error loading images: ' + err.message, 'error', 6000);
    }
}

/* -------------------------------------------------------
   Image Navigation
------------------------------------------------------- */
function navigateImage(direction) {
    const newIndex = currentImageIndex + direction;
    if (newIndex < 0 || newIndex >= allImages.length) return;
    navigateTo(newIndex);
}

function navigateTo(index) {
    if (index < 0 || index >= allImages.length) return;
    currentImageIndex = index;

    const img = allImages[index];
    const imgEl = document.getElementById('currentImage');
    const frame = document.querySelector('.image-frame');

    // Animate transition
    if (frame) {
        frame.classList.add('loading');
        frame.classList.remove('loaded');
    }

    // Load image
    const imageUrl = getDriveImageUrl(img.id);
    imgEl.src = imageUrl;
    imgEl.onload = () => {
        if (frame) {
            frame.classList.remove('loading');
            frame.classList.add('loaded');
        }
    };
    imgEl.onerror = () => {
        imgEl.src = createPlaceholderDataUrl(img.firstName || '?');
        if (frame) {
            frame.classList.remove('loading');
            frame.classList.add('loaded');
        }
    };

    // Update counter
    document.getElementById('currentIndex').textContent = index + 1;
    document.getElementById('totalImages').textContent = allImages.length;

    // Update nav buttons
    document.getElementById('prevBtn').disabled = index === 0;
    document.getElementById('nextBtn').disabled = index === allImages.length - 1;

    // Update student panel
    updateStudentPanel(img);

    // Update grade badge on image
    updateGradeBadge(img.grade);

    // Update thumbnail strip
    updateActiveThumbnail(index);

    // Scroll thumbnail into view
    const thumb = document.getElementById(`thumb-${index}`);
    if (thumb) thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
}

/* -------------------------------------------------------
   Student Info Panel
------------------------------------------------------- */
function updateStudentPanel(img) {
    document.getElementById('detailFirstName').textContent = img.firstName || '—';
    document.getElementById('detailLastName').textContent = img.lastName || '—';
    document.getElementById('detailId').textContent = img.studentId || '—';

    const dateStr = img.createdTime
        ? new Date(img.createdTime).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        : '—';
    document.getElementById('detailDate').textContent = dateStr;

    // Update avatar
    const avatarEl = document.getElementById('studentAvatar');
    if (avatarEl) {
        avatarEl.textContent = (img.firstName || '?').charAt(0).toUpperCase();
    }

    // Update grade input and display
    const gradeInput = document.getElementById('gradeInput');
    const currentGradeDisplay = document.getElementById('currentGradeDisplay');
    const currentGradeValue = document.getElementById('currentGradeValue');

    if (img.grade !== null && img.grade !== undefined) {
        gradeInput.value = img.grade;
        currentGradeDisplay.style.display = 'flex';
        currentGradeValue.textContent = `${img.grade} / 100`;

        const cls = img.grade >= 80 ? 'high' : img.grade >= 50 ? 'pass' : 'low';
        currentGradeValue.className = `grade-current ${cls}`;
    } else {
        gradeInput.value = '';
        currentGradeDisplay.style.display = 'none';
    }

    updateGradePreview();
    updateHighScoreBanner();

    // Load grade history
    renderGradeHistory();
}

/* -------------------------------------------------------
   Grade Preview & Validation
------------------------------------------------------- */
function updateGradePreview() {
    const gradeInput = document.getElementById('gradeInput');
    const gradeBarFill = document.getElementById('gradeBarFill');
    const gradePreviewLabel = document.getElementById('gradePreviewLabel');

    const val = gradeInput ? parseFloat(gradeInput.value) : NaN;

    if (isNaN(val) || gradeInput.value === '') {
        gradeBarFill.style.width = '0%';
        gradeBarFill.className = 'grade-bar-fill';
        gradePreviewLabel.textContent = 'Enter a mark above';
        document.getElementById('submitGradeBtn').disabled = false;
        updateHighScoreBanner();
        return;
    }

    const clamped = Math.max(0, Math.min(100, val));
    gradeBarFill.style.width = clamped + '%';

    if (clamped >= 80) {
        gradeBarFill.className = 'grade-bar-fill high';
        gradePreviewLabel.textContent = `🌟 Excellent! ${clamped}/100`;
    } else if (clamped >= 50) {
        gradeBarFill.className = 'grade-bar-fill medium';
        gradePreviewLabel.textContent = `✓ Pass — ${clamped}/100`;
    } else {
        gradeBarFill.className = 'grade-bar-fill low';
        gradePreviewLabel.textContent = `✗ Fail — ${clamped}/100`;
    }

    updateHighScoreBanner();
}

function updateHighScoreBanner() {
    const gradeInput = document.getElementById('gradeInput');
    const banner = document.getElementById('highScoreBanner');
    if (!gradeInput || !banner) return;

    const val = parseFloat(gradeInput.value);
    if (!isNaN(val) && val >= CONFIG.HIGH_SCORE_THRESHOLD) {
        banner.classList.remove('hidden');
    } else {
        banner.classList.add('hidden');
    }
}

function updateGradeBadge(grade) {
    const badge = document.getElementById('gradeBadge');
    const badgeText = document.getElementById('gradeBadgeText');
    if (!badge) return;

    if (grade !== null && grade !== undefined) {
        badge.style.display = 'flex';
        badgeText.textContent = `${grade}%`;
        badge.className = 'image-overlay-badge ' + (grade >= 80 ? 'high' : grade >= 50 ? 'pass' : 'low');
    } else {
        badge.style.display = 'none';
    }
}

/* -------------------------------------------------------
   Submit Grade
------------------------------------------------------- */
async function submitGrade() {
    const gradeInput = document.getElementById('gradeInput');
    const submitBtn = document.getElementById('submitGradeBtn');
    const val = parseFloat(gradeInput.value);

    if (isNaN(val) || val < 0 || val > 100) {
        showToast('Please enter a valid mark between 0 and 100.', 'error');
        gradeInput.focus();
        return;
    }

    if (!isGoogleAuthorized) {
        showToast('Please connect Google Drive/Sheets first.', 'error');
        authorizeGoogle();
        return;
    }

    // Make sure gapi.client.sheets is loaded
    if (!gapi.client.sheets) {
        showToast('Sheets API not loaded yet. Please wait a moment and try again.', 'warning', 4000);
        return;
    }

    const img = allImages[currentImageIndex];
    if (!img) return;

    submitBtn.disabled = true;
    submitBtn.querySelector('span').textContent = 'Saving...';

    try {
        // 1. Save grade to Google Sheets
        await appendGradeToSheets({
            studentId: img.studentId,
            firstName: img.firstName,
            lastName: img.lastName,
            imageFile: img.name,
            mark: val,
        });

        // 2. If ≥80%, copy image to High Achievers folder
        let copiedToHighAchievers = false;
        if (val >= CONFIG.HIGH_SCORE_THRESHOLD) {
            try {
                await copyDriveFile(img.id, CONFIG.DRIVE_HIGH_ACHIEVERS_FOLDER_ID);
                copiedToHighAchievers = true;
            } catch (copyErr) {
                console.warn('High achievers copy failed:', copyErr);
            }
        }

        // 3. Update local record
        img.grade = val;
        allImages[currentImageIndex] = img;
        updateUploadGrade(img.id, val);

        // 4. Update UI
        updateGradeBadge(val);
        updateStudentPanel(img);
        updateStats();
        renderGradeHistory();

        const message = copiedToHighAchievers
            ? `Grade ${val}% saved! ⭐ Image copied to High Achievers folder.`
            : `Grade ${val}% saved to Google Sheets!`;

        showToast(message, 'success', 4500);
        gradeInput.value = '';
        updateGradePreview();

    } catch (err) {
        console.error('Grade submission error:', err);

        // Diagnose the error type and show a clear message
        const errStr = JSON.stringify(err) + (err.message || '') + (err.result ? JSON.stringify(err.result) : '');
        let userMsg = '';

        if (errStr.includes('401') || errStr.includes('invalid_grant') || errStr.includes('Invalid Credentials')) {
            userMsg = 'Your Google session expired. Click "Connect Google" in the top bar to reconnect.';
            clearCachedAdminToken();
            isGoogleAuthorized = false;
            updateGoogleStatus(false, 'Session expired – reconnect');
        } else if (errStr.includes('403') || errStr.includes('PERMISSION_DENIED') || errStr.includes('forbidden')) {
            userMsg = 'Permission denied. Make sure your Google Sheet is accessible to your signed-in account.';
        } else if (errStr.includes('404') || errStr.includes('notFound')) {
            userMsg = 'Google Sheet not found. Check that the SHEETS_ID in config.js is correct.';
        } else if (errStr.includes('SHEETS_ID') || CONFIG.SHEETS_ID.includes('YOUR_')) {
            userMsg = 'Google Sheets ID not configured. Please update SHEETS_ID in js/config.js.';
        } else {
            userMsg = 'Failed to save grade: ' + (err.result?.error?.message || err.message || 'Unknown error');
        }

        showToast(userMsg, 'error', 7000);
    } finally {
        submitBtn.disabled = false;
        submitBtn.querySelector('span').textContent = 'Submit Grade';
    }
}

/* -------------------------------------------------------
   Grade History (from local uploads store)
------------------------------------------------------- */
function renderGradeHistory() {
    const historyList = document.getElementById('historyList');
    const historyEmpty = document.getElementById('historyEmpty');
    if (!historyList || !historyEmpty) return;

    const uploads = getUploads();
    const graded = uploads.filter(u => u.grade !== null && u.grade !== undefined);

    if (graded.length === 0) {
        historyEmpty.style.display = '';
        historyList.innerHTML = '';
        return;
    }

    historyEmpty.style.display = 'none';
    historyList.innerHTML = graded.slice(-8).reverse().map(u => {
        const cls = u.grade >= 80 ? 'high' : u.grade >= 50 ? 'medium' : 'low';
        return `
      <div class="history-item">
        <span class="history-name">${u.firstName} ${u.lastName} · <code>${u.studentId}</code></span>
        <span class="history-score ${cls}">${u.grade}%</span>
      </div>
    `;
    }).join('');
}

/* -------------------------------------------------------
   Thumbnail Strip
------------------------------------------------------- */
function buildThumbnailStrip() {
    const strip = document.getElementById('thumbnailStrip');
    if (!strip) return;

    strip.innerHTML = allImages.map((img, i) => `
    <div class="thumb-item ${i === 0 ? 'active' : ''}" id="thumb-${i}" onclick="navigateTo(${i})">
      <img
        src="${getDriveImageUrl(img.id)}"
        alt="${img.name}"
        onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2244%22 height=%2238%22><rect width=%2244%22 height=%2238%22 fill=%22%231a1f35%22/></svg>'"
      />
    </div>
  `).join('');
}

function updateActiveThumbnail(index) {
    document.querySelectorAll('.thumb-item').forEach((el, i) => {
        el.classList.toggle('active', i === index);
    });
}

/* -------------------------------------------------------
   Stats
------------------------------------------------------- */
function updateStats() {
    document.getElementById('totalStudents').textContent = allImages.length;

    const graded = allImages.filter(img => img.grade !== null && img.grade !== undefined);
    document.getElementById('gradedCount').textContent = graded.length;

    const highScore = graded.filter(img => img.grade >= CONFIG.HIGH_SCORE_THRESHOLD);
    document.getElementById('highScoreCount').textContent = highScore.length;
}

/* -------------------------------------------------------
   Viewer State (loading / empty / main)
------------------------------------------------------- */
function showViewerState(state) {
    const loading = document.getElementById('viewerLoading');
    const empty = document.getElementById('viewerEmpty');
    const main = document.getElementById('viewerMain');

    if (loading) loading.style.display = state === 'loading' ? '' : 'none';
    if (empty) empty.classList.toggle('hidden', state !== 'empty');
    if (main) main.classList.toggle('hidden', state !== 'main');
}

/* -------------------------------------------------------
   Keyboard Shortcuts
------------------------------------------------------- */
function handleKeydown(e) {
    if (e.target.tagName === 'INPUT') return; // Don't intercept input fields
    if (e.key === 'ArrowRight') { e.preventDefault(); navigateImage(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); navigateImage(-1); }
}

function handleGradeKeydown(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        submitGrade();
    }
}

/* -------------------------------------------------------
   Placeholder image for failed loads
------------------------------------------------------- */
function createPlaceholderDataUrl(letter) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
    <rect width="200" height="200" fill="#1a1f35"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
          font-family="Inter,sans-serif" font-size="72" font-weight="bold" fill="#6366f1">${letter}</text>
  </svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
