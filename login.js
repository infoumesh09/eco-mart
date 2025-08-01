const API_URL = 'http://localhost:3000/api'; // Updated API URL

// Handle Login Form Submission
const loginForm = document.getElementById('login-form');
const errorMessage = document.getElementById('error-message');

if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // Clear previous error messages
        errorMessage.textContent = '';
        errorMessage.style.display = 'none';

        // Validate input
        if (!email || !password) {
            errorMessage.textContent = 'Email and password are required';
            errorMessage.style.display = 'block';
            return;
        }

        try {
            console.log('Attempting to login with email:', email); // Debug log

            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            console.log('Login response status:', response.status); // Debug log

            const data = await response.json();
            console.log('Login response data:', data); // Debug log

            if (response.ok) {
                // Store the token
                localStorage.setItem('token', data.token);
                // Store user data if available
                if (data.user) {
                    localStorage.setItem('user', JSON.stringify(data.user));
                }
                
                // Set syncCart flag if there are items in local cart
                const localCart = JSON.parse(localStorage.getItem('cartItems') || '[]');
                if (localCart.length > 0) {
                    localStorage.setItem('syncCart', 'true');
                }
                
                // Check if there are backed up wishlist items from previous session
                const wishlistBackup = localStorage.getItem('wishlistItemsBackup');
                if (wishlistBackup) {
                    console.log('Found backed up wishlist items, restoring them');
                    localStorage.setItem('wishlistItems', wishlistBackup);
                    localStorage.setItem('syncWishlist', 'true');
                    localStorage.removeItem('wishlistItemsBackup');
                } else {
                    // Set syncWishlist flag if there are items in local wishlist
                    const localWishlist = JSON.parse(localStorage.getItem('wishlistItems') || '[]');
                    if (localWishlist.length > 0) {
                        console.log('Found local wishlist items, setting syncWishlist flag for later sync');
                        localStorage.setItem('syncWishlist', 'true');
                    }
                }
                
                // Check for redirect
                const urlParams = new URLSearchParams(window.location.search);
                const redirect = urlParams.get('redirect');
                
                if (redirect === 'checkout') {
                    window.location.href = 'checkout.html';
                } else {
                    // Redirect to home page
                    window.location.href = 'newhome.html';
                }
            } else {
                errorMessage.textContent = data.message || 'Login failed. Please check your credentials.';
                errorMessage.style.display = 'block';
            }
        } catch (error) {
            console.error('Login error details:', error); // Detailed error log
            errorMessage.textContent = 'Unable to connect to the server. Please check your internet connection and try again.';
            errorMessage.style.display = 'block';
        }
    });
}

// Toggle password visibility
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.nextElementSibling;
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Update profile info if user is logged in
async function updateProfileInfo() {
    try {
        const response = await fetch(`${API_URL}/auth/profile`, {
            credentials: 'include' // Important for cookies
        });

        if (response.ok) {
            const data = await response.json();
            const userInfo = {
                id: data.id,
                name: data.name,
                email: data.email
            };
            sessionStorage.setItem('user', JSON.stringify(userInfo));
        } else {
            // If profile fetch fails, clear session
            sessionStorage.removeItem('user');
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Error fetching profile:', error);
    }
}

// Handle logout
function handleLogout() {
    // Backup wishlist items before logout if they exist
    const wishlistItems = localStorage.getItem('wishlistItems');
    if (wishlistItems) {
        console.log('Backing up wishlist items before logout');
        localStorage.setItem('wishlistItemsBackup', wishlistItems);
    }
    
    sessionStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Clear wishlist items to prevent them from persisting between users
    localStorage.removeItem('wishlistItems');
    console.log('Cleared wishlist items on logout');
    
    // Clear cart items as well
    localStorage.removeItem('cartItems');
    console.log('Cleared cart items on logout');
    
    fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
    }).finally(() => {
        window.location.href = 'login.html';
    });
}
