document.addEventListener('DOMContentLoaded', () => {
    const sellerForm = document.getElementById('seller-signup-form');
    const SIGNUP_URL = 'http://localhost:5000/api/auth/signup/seller';

    if (sellerForm) {
        sellerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // 1. Get all form data
            const formData = {
                username: document.getElementById('seller-username').value,
                shopName: document.getElementById('seller-shop-name').value,
                email: document.getElementById('seller-email').value,
                password: document.getElementById('seller-password').value,
                gstNumber: document.getElementById('seller-gst').value,
                businessAddress: document.getElementById('seller-address').value,
                description: document.getElementById('seller-description').value
            };

            try {
                // 2. Send data to the backend
                const response = await fetch(SIGNUP_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Signup failed');
                }

                // 3. Success!
                alert('Seller application submitted! Your account is pending verification. Redirecting to homepage.');
                window.location.href = 'index.html';

            } catch (error) {
                alert(`Signup Error: ${error.message}`);
            }
        });
    }
});