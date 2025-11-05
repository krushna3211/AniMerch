document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Get Token and Elements ---
    const token = localStorage.getItem('userToken');
    const dashboardSidebar = document.querySelector('.dashboard-sidebar');

    // Section: Seller Verification
    const sellersTableBody = document.querySelector('#verify-sellers .seller-table tbody');

    // Section: Manage Categories
    const categoryAddForm = document.querySelector('.category-add-form form');
    const categoryNameInput = document.getElementById('category-name');
    const categoryListUl = document.querySelector('.category-list ul');

    // --- API URLs ---
    const API_BASE = 'http://localhost:5000/api';

    // --- 2. Main function to check auth and fetch data ---
    async function initializeDashboard() {
        if (!token) {
            alert('You must be logged in to view this page.');
            window.location.href = 'login.html';
            return;
        }

        // Check if user is an admin
        try {
            const user = await fetchUserData();
            
            if (user.role !== 'admin') {
                alert('You are not authorized to view this page.');
                window.location.href = 'index.html';
                return;
            }
            
            // If they are an admin, fetch their data
            fetchPendingSellers();
            fetchCategories();

        } catch (error) {
            console.error('Auth check failed:', error);
            localStorage.clear();
            window.location.href = 'login.html';
        }
    }

    // --- 3. Fetch User Data (from /me) ---
    async function fetchUserData() {
        const response = await fetch(`${API_BASE}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch user data');
        return await response.json();
    }

    // --- 4. Fetch & Display Pending Sellers ---
    async function fetchPendingSellers() {
        try {
            const response = await fetch(`${API_BASE}/admin/pending-sellers`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch sellers');
            
            const sellers = await response.json();
            displayPendingSellers(sellers);
        } catch (error) {
            console.error('Error fetching sellers:', error);
            sellersTableBody.innerHTML = '<tr><td colspan="5">Could not load pending sellers.</td></tr>';
        }
    }

    function displayPendingSellers(sellers) {
        sellersTableBody.innerHTML = '';
        if (sellers.length === 0) {
            sellersTableBody.innerHTML = '<tr><td colspan="5">No sellers are pending verification.</td></tr>';
            return;
        }
        
        sellers.forEach(seller => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${seller.sellerDetails.shopName}</td>
                <td>${seller.email}</td>
                <td>${seller.sellerDetails.gstNumber}</td>
                <td>${seller.sellerDetails.description || 'N/A'}</td>
                <td class.action-buttons">
                    <button class="btn-accept" data-seller-id="${seller._id}">Approve</button>
                    <button class="btn-reject" data-seller-id="${seller._id}">Reject</button>
                </td>
            `;
            sellersTableBody.appendChild(row);
        });
    }

    // --- 5. Fetch & Display Categories ---
    async function fetchCategories() {
        try {
            const response = await fetch(`${API_BASE}/categories`);
            if (!response.ok) throw new Error('Failed to fetch categories');
            
            const categories = await response.json();
            displayCategories(categories);
        } catch (error) {
            console.error('Error fetching categories:', error);
            categoryListUl.innerHTML = '<li>Could not load categories.</li>';
        }
    }

    function displayCategories(categories) {
        categoryListUl.innerHTML = '';
        if (categories.length === 0) {
            categoryListUl.innerHTML = '<li>No categories created yet.</li>';
            return;
        }
        
        categories.forEach(category => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${category.name}</span>
                <button class="btn-reject" data-category-id="${category._id}">Remove</button>
            `;
            categoryListUl.appendChild(li);
        });
    }

    // --- 6. Logout Button ---
    dashboardSidebar.addEventListener('click', (e) => {
        if (e.target.textContent === 'Logout') {
            e.preventDefault();
            localStorage.clear();
            alert('You have been logged out.');
            window.location.href = 'index.html';
        }
    });

    // --- 7. == NEW: APPROVE/REJECT SELLER BUTTONS == ---
    sellersTableBody.addEventListener('click', async (e) => {
        const button = e.target;
        const sellerId = button.dataset.sellerId;
        if (!sellerId) return;

        let action = '';
        if (button.classList.contains('btn-accept')) action = 'approve';
        if (button.classList.contains('btn-reject')) action = 'reject';

        if (action) {
            try {
                const response = await fetch(`${API_BASE}/admin/${action}-seller/${sellerId}`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.message || 'Action failed');
                
                alert(`Seller has been ${action}d.`);
                fetchPendingSellers(); // Refresh the list
            
            } catch (error) {
                alert(`Error: ${error.message}`);
            }
        }
    });

    // --- 8. == NEW: ADD CATEGORY FORM == ---
    categoryAddForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = categoryNameInput.value;
        if (!name) return alert('Please enter a category name.');

        try {
            const response = await fetch(`${API_BASE}/categories`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: name })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to add category');

            alert('Category added!');
            categoryNameInput.value = ''; // Clear input
            fetchCategories(); // Refresh the list

        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    });

    // --- 9. == NEW: REMOVE CATEGORY BUTTON == ---
    categoryListUl.addEventListener('click', async (e) => {
        const button = e.target;
        const categoryId = button.dataset.categoryId;
        if (!categoryId) return;

        if (confirm('Are you sure you want to delete this category?')) {
            try {
                const response = await fetch(`${API_BASE}/categories/${categoryId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.message || 'Failed to delete');

                alert(data.message);
                fetchCategories(); // Refresh the list

            } catch (error) {
                alert(`Error: ${error.message}`);
            }
        }
    });

    // --- 10. Initial Call ---
    initializeDashboard();
});