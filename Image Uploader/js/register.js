/* =====================================================
   EduVault – Registration Page Logic
   ===================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // If already logged in, redirect
    const session = getSession();
    if (session && session.role === 'student') {
        window.location.href = 'upload.html';
        return;
    }

    // Password strength meter
    const pwInput = document.getElementById('regPassword');
    if (pwInput) {
        pwInput.addEventListener('input', () => {
            updateStrength(pwInput.value);
        });
    }
});

function updateStrength(pw) {
    const bars = [
        document.getElementById('bar1'),
        document.getElementById('bar2'),
        document.getElementById('bar3'),
        document.getElementById('bar4'),
    ];
    const label = document.getElementById('pwLabel');
    if (!bars[0] || !label) return;

    // Score
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
    if (/[0-9]/.test(pw) && /[^a-zA-Z0-9]/.test(pw)) score++;

    const levels = ['', 'weak', 'medium', 'strong', 'strong'];
    const labels = ['', 'Weak', 'Fair', 'Strong', 'Very Strong'];
    const colors = { weak: '#ef4444', medium: '#f59e0b', strong: '#22c55e' };

    bars.forEach((bar, i) => {
        bar.className = 'bar';
        if (i < score) {
            bar.classList.add(levels[score] || 'strong');
        }
    });

    label.textContent = pw.length === 0 ? 'Password strength' : (labels[score] || 'Very Strong');
    label.style.color = pw.length === 0 ? 'var(--text-muted)' : (colors[levels[score]] || '#22c55e');
}

function registerStudent(e) {
    e.preventDefault();

    const firstName = document.getElementById('regFirstName').value.trim();
    const lastName = document.getElementById('regLastName').value.trim();
    const id = document.getElementById('regStudentId').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirm = document.getElementById('regConfirmPassword').value;

    const errorEl = document.getElementById('registerError');
    const successEl = document.getElementById('registerSuccess');
    const btn = document.getElementById('registerBtn');

    errorEl.classList.remove('show');
    successEl.classList.remove('show');

    // Validations
    if (!firstName || !lastName || !id || !email || !password || !confirm) {
        errorEl.textContent = 'Please fill in all fields.';
        errorEl.classList.add('show');
        return;
    }

    if (!/^[a-zA-Z\s'-]+$/.test(firstName) || !/^[a-zA-Z\s'-]+$/.test(lastName)) {
        errorEl.textContent = 'First and last name should contain only letters.';
        errorEl.classList.add('show');
        return;
    }

    if (!/^[a-zA-Z0-9_-]{4,20}$/.test(id)) {
        errorEl.textContent = 'Student ID must be 4–20 alphanumeric characters.';
        errorEl.classList.add('show');
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errorEl.textContent = 'Please enter a valid email address.';
        errorEl.classList.add('show');
        return;
    }

    if (password.length < 6) {
        errorEl.textContent = 'Password must be at least 6 characters.';
        errorEl.classList.add('show');
        return;
    }

    if (password !== confirm) {
        errorEl.textContent = 'Passwords do not match.';
        errorEl.classList.add('show');
        return;
    }

    btn.disabled = true;
    btn.querySelector('span').textContent = 'Creating account...';

    setTimeout(() => {
        const result = registerNewStudent({ firstName, lastName, id, email, password });

        if (result.error) {
            errorEl.textContent = result.error;
            errorEl.classList.add('show');
            btn.disabled = false;
            btn.querySelector('span').textContent = 'Create Account';
            return;
        }

        successEl.textContent = `Account created successfully! Welcome, ${firstName}! Redirecting to login...`;
        successEl.classList.add('show');
        showToast(`Account created! Welcome, ${firstName} 🎉`, 'success', 4000);

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2500);
    }, 800);
}
