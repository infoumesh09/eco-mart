const API_URL = 'http://localhost:3000/api';

// Password validation requirements
const passwordRequirements = {
    length: /.{8,}/,
    uppercase: /[A-Z]/,
    lowercase: /[a-z]/,
    number: /\d/,
    special: /[!@#$%^&*(),.?":{}|<>]/
};

// Function to toggle password visibility
function togglePassword(inputId) {
    const passwordInput = document.getElementById(inputId);
    const eyeIcon = passwordInput.nextElementSibling;
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.classList.remove('fa-eye');
        eyeIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        eyeIcon.classList.remove('fa-eye-slash');
        eyeIcon.classList.add('fa-eye');
    }
}

// Function to validate password requirements
function validatePassword(password) {
    const requirements = document.querySelectorAll('.password-requirements p');
    let isValid = true;

    requirements.forEach(req => {
        const type = req.id;
        const icon = req.querySelector('i');
        
        if (passwordRequirements[type].test(password)) {
            req.classList.add('requirement-met');
            req.classList.remove('requirement-not-met');
            icon.classList.remove('fa-circle');
            icon.classList.add('fa-check-circle');
        } else {
            req.classList.remove('requirement-met');
            req.classList.add('requirement-not-met');
            icon.classList.remove('fa-check-circle');
            icon.classList.add('fa-circle');
            isValid = false;
        }
    });

    return isValid;
}

// Function to show error message
function showError(message) {
    const errorMessage = document.getElementById('error-message');
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

// Function to clear error message
function clearError() {
    const errorMessage = document.getElementById('error-message');
    errorMessage.style.display = 'none';
}

// Handle form submission
document.getElementById('signup-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    clearError();

    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const termsCheckbox = document.getElementById('terms');

    // Basic validation
    if (!username || !email || !password || !confirmPassword) {
        showError('All fields are required');
        return;
    }

    // Username validation
    if (username.length < 3) {
        showError('Username must be at least 3 characters long');
        return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError('Please enter a valid email address');
        return;
    }

    // Password validation
    if (!validatePassword(password)) {
        showError('Please meet all password requirements');
        return;
    }

    if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }

    // Terms validation
    if (!termsCheckbox.checked) {
        showError('Please accept the Terms of Service and Privacy Policy');
        return;
    }

    try {
        console.log('Attempting to register with:', { username, email }); // Debug log

        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                username,
                email,
                password
            })
        });

        console.log('Registration response status:', response.status); // Debug log

        const data = await response.json();
        console.log('Registration response data:', data); // Debug log

        if (response.ok) {
            // Show success message
            alert('Registration successful! Please login to continue.');
            // Redirect to login page
            window.location.href = 'login.html';
        } else {
            showError(data.message || 'Registration failed. Please try again.');
        }
    } catch (error) {
        console.error('Registration error details:', error); // Detailed error log
        showError('Unable to connect to the server. Please check your internet connection and try again.');
    }
});

// Add password validation on input
document.getElementById('password').addEventListener('input', (e) => {
    validatePassword(e.target.value);
});
