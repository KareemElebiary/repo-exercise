/* =====================================================
   EduVault – Login Page Logic
   ===================================================== */

let currentTab = 'student';

function switchTab(tab) {
    currentTab = tab;
    const studentForm = document.getElementById('studentForm');
    const adminForm = document.getElementById('adminForm');
    const tabStudent = document.getElementById('tabStudent');
    const tabAdmin = document.getElementById('tabAdmin');

    if (tab === 'student') {
        studentForm.classList.remove('hidden');
        adminForm.classList.add('hidden');
        tabStudent.classList.add('active');
        tabAdmin.classList.remove('active');
    } else {
        studentForm.classList.add('hidden');
        adminForm.classList.remove('hidden');
        tabAdmin.classList.add('active');
        tabStudent.classList.remove('active');
    }

    // Clear errors
    document.getElementById('studentError').classList.remove('show');
    document.getElementById('adminError').classList.remove('show');
}

function loginStudent(e) {
    e.preventDefault();
    const id = document.getElementById('studentId').value.trim();
    const password = document.getElementById('studentPassword').value;
    const errorEl = document.getElementById('studentError');
    const btn = document.getElementById('studentLoginBtn');

    errorEl.classList.remove('show');

    if (!id || !password) {
        errorEl.textContent = 'Please fill in all fields.';
        errorEl.classList.add('show');
        return;
    }

    btn.disabled = true;
    btn.querySelector('span').textContent = 'Signing in...';

    // Simulate a brief loading for UX
    setTimeout(() => {
        const student = findStudentByLogin(id, password);

        if (!student) {
            errorEl.textContent = 'Invalid Student ID or password. Please try again.';
            errorEl.classList.add('show');
            btn.disabled = false;
            btn.querySelector('span').textContent = 'Sign In';
            return;
        }

        // Set session
        setSession({
            role: 'student',
            id: student.id,
            firstName: student.firstName,
            lastName: student.lastName,
            email: student.email,
        });

        showToast(`Welcome back, ${student.firstName}! 👋`, 'success');
        setTimeout(() => {
            window.location.href = 'upload.html';
        }, 900);
    }, 600);
}

function loginAdmin(e) {
    e.preventDefault();
    const username = document.getElementById('adminUsername').value.trim();
    const password = document.getElementById('adminPassword').value;
    const errorEl = document.getElementById('adminError');
    const btn = document.getElementById('adminLoginBtn');

    errorEl.classList.remove('show');

    if (!username || !password) {
        errorEl.textContent = 'Please fill in all fields.';
        errorEl.classList.add('show');
        return;
    }

    btn.disabled = true;
    btn.querySelector('span').textContent = 'Signing in...';

    setTimeout(() => {
        if (username === CONFIG.ADMIN_USERNAME && password === CONFIG.ADMIN_PASSWORD) {
            setSession({ role: 'admin', username });
            showToast('Admin access granted! 🔐', 'success');
            setTimeout(() => {
                window.location.href = 'admin.html';
            }, 900);
        } else {
            errorEl.textContent = 'Invalid admin credentials. Please try again.';
            errorEl.classList.add('show');
            btn.disabled = false;
            btn.querySelector('span').textContent = 'Admin Sign In';
        }
    }, 600);
}

// If already logged in, redirect
document.addEventListener('DOMContentLoaded', () => {
    const session = getSession();
    if (session) {
        if (session.role === 'admin') {
            window.location.href = 'admin.html';
        } else if (session.role === 'student') {
            window.location.href = 'upload.html';
        }
    }
});
