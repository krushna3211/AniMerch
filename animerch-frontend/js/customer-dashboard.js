document.addEventListener('DOMContentLoaded', () => {
    
    const token = localStorage.getItem('userToken');
    const orderListContainer = document.querySelector('.order-history-list');
    const dashboardSidebar = document.querySelector('.dashboard-sidebar');

    // --- 1. Security Check: Is user logged in? ---
    if (!token) {
        alert('You must be logged in to view this page.');
        window.location.href = 'login.html';
        return;
    }

    // --- 2. Function to fetch orders ---
    async function fetchMyOrders() {
        const API_URL = 'http://localhost:5000/api/orders/myorders';

        try {
            const response = await fetch(API_URL, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Send the login token
                }
            });

            if (!response.ok) {
                // Handle token expiration or other auth issues
                if (response.status === 401) {
                    localStorage.clear(); // Clear bad token
                    alert('Session expired. Please log in again.');
                    window.location.href = 'login.html';
                }
                throw new Error('Failed to fetch orders.');
            }

            const orders = await response.json();
            displayOrders(orders);

        } catch (error) {
            console.error('Error fetching orders:', error);
            orderListContainer.innerHTML = '<p class="error-message">Could not load your orders.</p>';
        }
    }

    // --- 3. Function to display orders ---
    function displayOrders(orders) {
        // Clear placeholder card
        orderListContainer.innerHTML = '';

        if (orders.length === 0) {
            orderListContainer.innerHTML = '<p>You have not placed any orders yet.</p>';
            return;
        }

        orders.forEach(order => {
            const orderCard = document.createElement('div');
            orderCard.classList.add('order-card');

            // Format the date nicely
            const orderDate = new Date(order.createdAt).toLocaleDateString();

            // Get a summary of item names
            const itemNames = order.orderItems.map(item => `${item.name} (x${item.qty})`).join(', ');

            // Set a class based on order status for styling
            const statusClass = order.orderStatus.toLowerCase();

            orderCard.innerHTML = `
                <div class="order-card-header">
                    <div>
                        <h4>Order #${order._id.substring(0, 8)}...</h4>
                        <small>Placed on: ${orderDate}</small>
                    </div>
                    <div class="order-status ${statusClass}">
                        ${order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                    </div>
                </div>
                <div class="order-card-body">
                    <p><strong>Shop:</strong> ${order.seller.sellerDetails.shopName}</p>
                    <p><strong>Items:</strong> ${itemNames}</p>
                    <p><strong>Total:</strong> $${order.totalPrice.toFixed(2)}</p>
                </div>
                <div class="order-card-footer">
                    <a href="#" class="btn-secondary">View Details</a>
                    ${order.orderStatus === 'shipped' ? '<a href="#" class="btn-secondary">Track Package</a>' : ''}
                    ${order.orderStatus === 'delivered' ? '<a href="#" class="btn-secondary">Leave a Review</a>' : ''}
                </div>
            `;
            orderListContainer.appendChild(orderCard);
        });
    }

    // --- 4. Logout Button ---
    dashboardSidebar.addEventListener('click', (e) => {
        if (e.target.textContent === 'Logout') {
            e.preventDefault();
            localStorage.clear(); // Clear all user data
            alert('You have been logged out.');
            window.location.href = 'index.html';
        }
    });

    // --- 5. Initial Call ---
    fetchMyOrders();
});