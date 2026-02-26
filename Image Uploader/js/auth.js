/* =====================================================
   EduVault – Auth Utilities (shared across pages)
   ===================================================== */

// -------------------------------------------------------
// STUDENT DATA STORE (localStorage)
// In a real app, this would be a server/database.
// -------------------------------------------------------

const DB_KEY = 'eduvault_students';
const SESSION_KEY = 'eduvault_session';
const UPLOADS_KEY = 'eduvault_uploads';

/* -- Seed Demo Student Accounts (auto-created on first load) -- */
function seedDemoAccounts() {
    const demos = [
        { id: 'STU001', firstName: 'Ahmed', lastName: 'Hassan', email: 'ahmed@demo.com', password: 'student123' },
        { id: 'STU002', firstName: 'Sara', lastName: 'Ali', email: 'sara@demo.com', password: 'student123' },
        { id: 'STU003', firstName: 'Mohamed', lastName: 'Ibrahim', email: 'mohamed@demo.com', password: 'student123' },
    ];
    // Add each demo only if their ID doesn't already exist
    demos.forEach(d => {
        const students = getStudents();
        if (!students.find(s => s.id === d.id)) {
            students.push({
                id: d.id, firstName: d.firstName, lastName: d.lastName,
                email: d.email, password: d.password, createdAt: new Date().toISOString()
            });
            saveStudents(students);
        }
    });
}


/* -- Student DB helpers -- */
function getStudents() {
    try { return JSON.parse(localStorage.getItem(DB_KEY) || '[]'); }
    catch (e) { return []; }
}

function saveStudents(students) {
    localStorage.setItem(DB_KEY, JSON.stringify(students));
}

function findStudentById(id) {
    return getStudents().find(s => s.id === id);
}

function findStudentByLogin(id, password) {
    return getStudents().find(s => s.id === id && s.password === password);
}

function registerNewStudent(data) {
    const students = getStudents();
    if (students.find(s => s.id === data.id)) return { error: 'Student ID already registered.' };
    if (students.find(s => s.email === data.email)) return { error: 'Email already registered.' };
    const student = {
        id: data.id,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        createdAt: new Date().toISOString(),
    };
    students.push(student);
    saveStudents(students);
    return { success: true, student };
}

/* -- Session helpers -- */
function getSession() {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); }
    catch (e) { return null; }
}

function setSession(data) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
}

function requireStudentLogin() {
    const session = getSession();
    if (!session || session.role !== 'student') {
        window.location.href = 'index.html';
        return null;
    }
    return session;
}

function requireAdminLogin() {
    let session = getSession();

    // AUTO-LOGIN FEATURE: If no session, create one automatically
    if (!session || session.role !== 'admin') {
        session = { role: 'admin', username: 'admin', name: 'Administrator' };
        setSession(session);
    }

    return session;
}


/* -- Uploads DB helpers -- */
function getUploads() {
    try { return JSON.parse(localStorage.getItem(UPLOADS_KEY) || '[]'); }
    catch (e) { return []; }
}

function addUpload(upload) {
    const uploads = getUploads();
    uploads.push(upload);
    localStorage.setItem(UPLOADS_KEY, JSON.stringify(uploads));
}

function updateUploadGrade(driveFileId, grade) {
    const uploads = getUploads();
    const idx = uploads.findIndex(u => u.driveFileId === driveFileId);
    if (idx !== -1) {
        uploads[idx].grade = grade;
        uploads[idx].gradedAt = new Date().toISOString();
        localStorage.setItem(UPLOADS_KEY, JSON.stringify(uploads));
    }
}

/* -- Shared UI utilities -- */
function showToast(message, type = 'info', duration = 3500) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => { toast.className = 'toast'; }, duration);
}

function togglePw(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    // Swap icon
    btn.innerHTML = isPassword
        ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
        : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
}

function logout() {
    clearSession();
    window.location.href = 'index.html';
}

/* -- Animated Background Particles -- */
function initParticles() {
    const container = document.getElementById('bgParticles');
    if (!container) return;

    const count = 18;
    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        const size = Math.random() * 4 + 2;
        const x = Math.random() * 100;
        const duration = Math.random() * 18 + 12;
        const delay = Math.random() * 10;
        const opacity = Math.random() * 0.25 + 0.05;

        p.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${x}%;
      animation-duration: ${duration}s;
      animation-delay: ${delay}s;
      opacity: ${opacity};
    `;
        container.appendChild(p);
    }
}

// Auto-init on load
document.addEventListener('DOMContentLoaded', () => {
    seedDemoAccounts();
    initParticles();
});
