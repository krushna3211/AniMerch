document.addEventListener('DOMContentLoaded', () => {
    
    const cartTableBody = document.querySelector('.cart-table tbody');
    const cartSummaryContainer = document.querySelector('.cart-summary');
    const cartItemsContainer = document.querySelector('.cart-items-container');
    
    // Get the cart from localStorage
    const cart = JSON.parse(localStorage.getItem('animerchCart')) || {};
    
    // Convert cart object to an array
    const cartItems = Object.values(cart);

    if (cartItems.length === 0) {
        cartItemsContainer.innerHTML = '<h2>Your cart is empty.</h2>';
        cartSummaryContainer.style.display = 'none'; // Hide summary box
        return;
    }

    let subtotal = 0;

    // Clear placeholder rows
    cartTableBody.innerHTML = '';

    // Loop through items and build the table
    cartItems.forEach(item => {
        const itemTotal = item.price * item.qty;
        subtotal += itemTotal;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="cart-product-info">
                <img src="${item.image}" alt="${item.name}">
                <div>
                    <a href="#">${item.name}</a>
                </div>
            </td>
            <td>$${item.price.toFixed(2)}</td>
            <td>
                ${item.qty}
            </td>
            <td>$${itemTotal.toFixed(2)}</td>
            <td>
                <button class="cart-remove-btn" data-id="${item.id}">×</button>
            </td>
        `;
        cartTableBody.appendChild(row);
    });

    // --- Update the Summary Box ---
    // A simple 10$ shipping fee for example
    const shipping = 10.00; 
    const total = subtotal + shipping;

    document.querySelector('.cart-summary').innerHTML = `
        <h3>Order Summary</h3>
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
        <button id="checkout-btn" class="cta-button pulse-glow">Proceed to Checkout</button>
    `;

    // --- Add Event Listeners ---
    
    // 1. For Remove Buttons
    cartTableBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('cart-remove-btn')) {
            const productId = e.target.dataset.id;
            
            // Remove from cart object
            delete cart[productId];
            
            // Save back to localStorage
            localStorage.setItem('animerchCart', JSON.stringify(cart));
            
            // Refresh the page to show the change
            alert('Item removed.');
            window.location.reload();
        }
    });

    // 2. For Checkout Button
    document.getElementById('checkout-btn').addEventListener('click', () => {
        window.location.href = 'checkout.html';
    });
});