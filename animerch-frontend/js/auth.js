document.addEventListener('DOMContentLoaded', () => {
    // --- FORM TOGGLING LOGIC (from before) ---
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const showSignupLink = document.getElementById('show-signup');
    const showLoginLink = document.getElementById('show-login');

    if (showSignupLink) {
        showSignupLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginForm.classList.remove('active-form');
            signupForm.classList.add('active-form');
        });
    }
    
    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            signupForm.classList.remove('active-form');
            loginForm.classList.add('active-form');
        });
    }
    
    // --- API URLS ---
    const LOGIN_URL = 'http://localhost:5000/api/auth/login';
    const SIGNUP_URL = 'http://localhost:5000/api/auth/signup/customer';

    // --- LOGIN FORM SUBMIT ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Stop the form from reloading the page
            
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            try {
                const response = await fetch(LOGIN_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (!response.ok) {
                    // If response is not 2xx, throw an error
                    throw new Error(data.message || 'Login failed');
                }

                // --- LOGIN SUCCESS ---
                console.log('Login successful:', data);
                
                // 1. Store the token
                localStorage.setItem('userToken', data.token);

                // 2. We need to get the user's role to redirect
                // A good way is to decode the token (simple way)
                // or fetch the /api/auth/me route
                
                // Let's fetch the /me route to get user data
                await fetchUserData(data.token);

            } catch (error) {
                alert(`Login Error: ${error.message}`);
            }
        });
    }

    // --- CUSTOMER SIGNUP FORM SUBMIT ---
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('signup-username').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;

            try {
                const response = await fetch(SIGNUP_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, email, password })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Signup failed');
                }

                // --- SIGNUP SUCCESS ---
                alert('Signup successful! Please log in to continue.');
                
                // Show the login form
                signupForm.classList.remove('active-form');
                loginForm.classList.add('active-form');

            } catch (error) {
                alert(`Signup Error: ${error.message}`);
            }
        });
    }

    // --- Helper function to get user data after login ---
    async function fetchUserData(token) {
        try {
            const response = await fetch('http://localhost:5000/api/auth/me', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to get user data');
            }
            
            const user = await response.json();

            // Store user info (optional, but useful)
            localStorage.setItem('userInfo', JSON.stringify(user));

            // 3. Redirect based on role
            if (user.role === 'admin') {
                window.location.href = 'admin-dashboard.html';
            } else if (user.role === 'seller') {
                window.location.href = 'seller-dashboard.html';
            } else {
                window.location.href = 'customer-dashboard.html';
            }

        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    }
});