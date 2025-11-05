document.addEventListener('DOMContentLoaded', () => {

    const API_URL = 'http://localhost:5000/api/orders';

    // --- 1. Get user token and cart from localStorage ---
    const token = localStorage.getItem('userToken');
    const cart = JSON.parse(localStorage.getItem('animerchCart')) || {};
    const cartItems = Object.values(cart);

    // --- 2. Security Check: Is user logged in? ---
    if (!token) {
        alert('You must be logged in to check out.');
        // Save the cart (it's already saved) and send to login
        window.location.href = 'login.html';
        return;
    }

    // --- 3. Security Check: Is cart empty? ---
    if (cartItems.length === 0) {
        alert('Your cart is empty.');
        window.location.href = 'index.html';
        return;
    }

    // --- 4. Get HTML Elements ---
    const summaryBox = document.querySelector('.order-summary-box');
    const checkoutForm = document.getElementById('checkout-form');

    // --- 5. Function to display the order summary ---
    function displayOrderSummary() {
        let subtotal = 0;
        
        // Clear placeholder items
        summaryBox.innerHTML = '<h3>Your Order</h3>'; 

        cartItems.forEach(item => {
            subtotal += item.price * item.qty;
            summaryBox.innerHTML += `
                <div class="summary-item">
                    <img src="${item.image}" alt="${item.name.substring(0, 10)}">
                    <span>${item.name} (x${item.qty})</span>
                    <span class="item-price">$${(item.price * item.qty).toFixed(2)}</span>
                </div>
            `;
        });

        // Add totals
        const shipping = 10.00; // Example shipping
        const total = subtotal + shipping;
        
        summaryBox.innerHTML += `
            <div class="summary-row">
                <span>Subtotal</span>
                <span>$${subtotal.toFixed(2)}</span>
            </div>
            <div class="summary-row">
                <span>Shipping</span>
                <span>$${shipping.toFixed(2)}</span>
            </div>
            <div class="summary-row total">
                <span>Total</span>
                <span>$${total.toFixed(2)}</span>
            </div>
            <button type="submit" form="checkout-form" class="cta-button pulse-glow">Place Order</button>
        `;
    }

    // --- 6. Function to handle placing the order ---
    checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Stop the form from reloading

        // a. Get shipping details from the form
        const shippingAddress = {
            fullName: document.getElementById('full-name').value,
            address: document.getElementById('address').value,
            city: document.getElementById('city').value,
            pincode: document.getElementById('pincode').value,
            phone: document.getElementById('phone').value
        };

        // b. Format the cart items for the backend
        const orderItems = cartItems.map(item => ({
            product: item.id,
            qty: item.qty
        }));

        // c. Send the data to the backend
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Send the login token
                },
                body: JSON.stringify({
                    shippingAddress: shippingAddress,
                    orderItems: orderItems
                })
            });

            const data = await response.json();

            if (!response.ok) {
                // If the backend sends an error (e.g., "Not enough stock"), show it
                throw new Error(data.message || 'Failed to place order.');
            }

            // --- 7. Order Success! ---
            alert('Order placed successfully!');
            
            // Clear the cart
            localStorage.removeItem('animerchCart');
            
            // Send user to their dashboard
            window.location.href = 'customer-dashboard.html';

        } catch (error) {
            console.error('Checkout error:', error);
            alert(`Error: ${error.message}`);
        }
    });

    // --- 8. Initial call to fill the summary box ---
    displayOrderSummary();
});