document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Get Token and Elements ---
    const token = localStorage.getItem('userToken');
    const dashboardSidebar = document.querySelector('.dashboard-sidebar');
    
    // Section: Orders
    const ordersTableBody = document.querySelector('#orders .seller-table tbody');
    
    // Section: My Products
    const productsTableBody = document.querySelector('#products .seller-table tbody');

    // Section: Add Product Form
    const addProductForm = document.getElementById('add-product-form');
    const formTitle = document.getElementById('form-title');
    const categorySelect = document.getElementById('product-category');
    const formSubmitBtn = document.getElementById('form-submit-btn');
    const formCancelBtn = document.getElementById('form-cancel-btn');
    const hiddenProductId = document.getElementById('product-id');
    const currentImagesBlock = document.getElementById('current-images-block');
    const currentImagesList = document.getElementById('current-images-list');
    const newImagesInput = document.getElementById('product-images');

    // --- API URLs ---
    const API_BASE = 'http://localhost:5000/api';
    const API_BASE_URL = 'http://localhost:5000'; // For image paths

    // Global state for editing
    let currentEditId = null;
    
    // --- 2. Main function to check auth and fetch data ---
    async function initializeDashboard() {
        if (!token) {
            alert('You must be logged in to view this page.');
            window.location.href = 'login.html';
            return;
        }

        // Check if user is an approved seller
        try {
            const user = await fetchUserData();
            
            if (user.role !== 'seller') {
                alert('You are not authorized to view this page.');
                window.location.href = 'index.html';
                return;
            }

            if (user.sellerDetails.verificationStatus !== 'approved') {
                alert('Your seller account is still pending approval.');
                document.querySelector('.dashboard-main').innerHTML = 
                    '<h2>Your account is pending verification.</h2><p>An admin will review your application soon. <a href="index.html">Back to Home</a></p>';
                return;
            }
            
            // If they are an approved seller, fetch all their data
            fetchSellerOrders();
            fetchSellerProducts();
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

    // --- 4. Fetch & Display Seller's Orders ---
    async function fetchSellerOrders() {
        try {
            const response = await fetch(`${API_BASE}/orders/sellerorders`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch orders');
            
            const orders = await response.json();
            displayOrders(orders);
        } catch (error) {
            console.error('Error fetching orders:', error);
            ordersTableBody.innerHTML = '<tr><td colspan="5">Could not load orders.</td></tr>';
        }
    }

    function displayOrders(orders) {
        ordersTableBody.innerHTML = '';
        if (orders.length === 0) {
            ordersTableBody.innerHTML = '<tr><td colspan="5">You have no incoming orders.</td></tr>';
            return;
        }
        
        orders.forEach(order => {
            const itemNames = order.orderItems.map(item => `${item.name} (x${item.qty})`).join(', ');
            const row = document.createElement('tr');
            row.dataset.orderId = order._id;

            // Generate buttons based on status
            let actionButtons = '';
            switch (order.orderStatus) {
                case 'pending':
                    actionButtons = `
                        <button class="btn-accept" data-order-id="${order._id}">Confirm</button>
                        <button class="btn-reject" data-order-id="${order._id}">Reject</button>
                    `;
                    break;
                case 'confirmed':
                    actionButtons = `<button class="btn-pack" data-order-id="${order._id}">Mark as Packed</button>`;
                    break;
                case 'packing':
                    actionButtons = `<button class="btn-ship" data-order-id="${order._id}">Mark as Shipped</button>`;
                    break;
                case 'shipped':
                    actionButtons = `<span class="status-shipped">Shipped</span>`;
                    break;
                case 'delivered':
                    actionButtons = `<span class="status-delivered">Delivered</span>`;
                    break;
                case 'rejected':
                    actionButtons = `<span class="status-rejected">Rejected</span>`;
                    break;
                default:
                    actionButtons = `<span class="status-unlisted">${order.orderStatus}</span>`;
            }

            row.innerHTML = `
                <td>#${order._id.substring(0, 6)}...</td>
                <td>${order.customer.username}</td>
                <td>${itemNames}</td>
                <td>$${order.totalPrice.toFixed(2)}</td>
                <td class="action-buttons" data-status="${order.orderStatus}">
                    ${actionButtons}
                </td>
            `;
            ordersTableBody.appendChild(row);
        });
    }

    // --- 5. Fetch & Display Seller's Products ---
    async function fetchSellerProducts() {
        // We'll just fetch ALL products and filter, or you could create a new backend route
        // For simplicity, let's just create a new route
        // (Note: We'll assume a new route GET /api/products/myproducts exists)
        // Let's stick to existing routes: we'll fetch /api/products and filter
        
        // This is a bit inefficient, but works for now.
        // A better solution is a dedicated `GET /api/products/sellerproducts` route.
        // Let's assume we made that. We'll stick to our plan.
        
        try {
            // Re-fetch user data to get ID (or store it)
            const user = await fetchUserData();
            const response = await fetch(`${API_BASE}/products`);
            if (!response.ok) throw new Error('Failed to fetch products');
            
            const allProducts = await response.json();
            
            // Filter products that belong to this seller
            const myProducts = allProducts.filter(product => product.seller._id === user._id);
            displayProducts(myProducts);
        } catch (error) {
            console.error('Error fetching products:', error);
            productsTableBody.innerHTML = '<tr><td colspan="5">Could not load products.</td></tr>';
        }
    }

    function displayProducts(products) {
        productsTableBody.innerHTML = '';
        if (products.length === 0) {
            productsTableBody.innerHTML = '<tr><td colspan="5">You have not listed any products.</td></tr>';
            return;
        }

        products.forEach(product => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class.cart-product-info">
                    <img src="${product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/50x50.png?text=No+Img'}" alt="">
                    <div><a href="#">${product.name}</a></div>
                </td>
                <td>$${product.price.toFixed(2)}</td>
                <td>${product.stock}</td>
                <td>
                    ${product.isListed ? '<span class="status-listed">Listed</span>' : '<span class="status-unlisted">Unlisted</span>'}
                </td>
                <td class="action-buttons">
                    <button class="btn-secondary" data-product-id="${product._id}">Edit</button>
                    ${product.isListed ? 
                        `<button class="btn-reject" data-product-id="${product._id}" data-action="unlist">Unlist</button>` : 
                        `<button class="btn-accept" data-product-id="${product._id}" data-action="list">List</button>`
                    }
                </td>
            `;
            productsTableBody.appendChild(row);
        });
    }

    // --- 6. Fetch & Display Categories ---
    async function fetchCategories() {
        try {
            const response = await fetch(`${API_BASE}/categories`);
            if (!response.ok) throw new Error('Failed to fetch categories');
            const categories = await response.json();
            displayCategories(categories);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    }

    function displayCategories(categories) {
        categorySelect.innerHTML = '<option value="">Select a Category</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category._id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });
    }
    
    // --- 7. Logout Button ---
    dashboardSidebar.addEventListener('click', (e) => {
        if (e.target.textContent === 'Logout') {
            e.preventDefault();
            localStorage.clear();
            alert('You have been logged out.');
            window.location.href = 'index.html';
        }
    });



   // --- 8. == NEW: FORM SUBMISSION (HANDLES BOTH ADD & EDIT) == ---
    addProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Create a FormData object
        const formData = new FormData();
        formData.append('name', document.getElementById('product-name').value);
        formData.append('description', document.getElementById('product-desc').value);
        formData.append('price', document.getElementById('product-price').value);
        formData.append('stock', document.getElementById('product-stock').value);
        formData.append('category', document.getElementById('product-category').value);

        let url = `${API_BASE}/products`;
        let method = 'POST';

        // --- Check if we are in EDIT MODE ---
        if (currentEditId) {
            url = `${API_BASE}/products/${currentEditId}`;
            method = 'PUT';

            // Get the list of existing images to KEEP
            const keptImages = [];
            currentImagesList.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                if (!checkbox.checked) { // If it's NOT checked for removal
                    keptImages.push(checkbox.value); // Add its path to the list
                }
            });
            keptImages.forEach(img => formData.append('existingImages', img));
        }

        // Add NEWLY uploaded files
        const files = newImagesInput.files;
        for (let i = 0; i < files.length; i++) {
            formData.append('images', files[i]);
        }

        // Send the request
        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || `Failed to ${method === 'POST' ? 'add' : 'update'} product`);
            }

            alert(`Product ${method === 'POST' ? 'added' : 'updated'} successfully!`);
            resetForm(); // Reset the form
            fetchSellerProducts(); // Refresh the product list

        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    });

// ... (The rest of your file: Order buttons, Product buttons, Initial call)

    // --- 9. == NEW: ORDER BUTTON CLICKS (ACCEPT/REJECT) == ---
   ordersTableBody.addEventListener('click', async (e) => {
        const button = e.target;
        const orderId = button.dataset.orderId;
        if (!orderId) return;
        
        let newStatus = '';
        let body = {}; // To hold extra data

        // Check which button was clicked and set the new status
        if (button.classList.contains('btn-accept')) {
            newStatus = 'confirmed';
            // We'll just set a default delivery date for this example
            let estDelivery = new Date();
            estDelivery.setDate(estDelivery.getDate() + 7); // 7 days from now
            body = { orderStatus: newStatus, estimatedDelivery: estDelivery.toISOString() };
        }
        else if (button.classList.contains('btn-reject')) {
            newStatus = 'rejected';
            const reason = prompt("Please enter a reason for rejection:");
            if (!reason) return; // Don't reject if they cancel the prompt
            body = { orderStatus: newStatus, rejectionReason: reason };
        }
        else if (button.classList.contains('btn-pack')) {
            newStatus = 'packing';
            body = { orderStatus: newStatus };
        }
        else if (button.classList.contains('btn-ship')) {
            newStatus = 'shipped';
            body = { orderStatus: newStatus };
        }

        if (newStatus) {
            try {
                await updateOrderStatus(orderId, body);
                fetchSellerOrders(); // Refresh just the orders
            } catch (error) {
                alert(`Error: ${error.message}`);
            }
        }
    });
    async function updateOrderStatus(orderId, body) {
        const response = await fetch(`${API_BASE}/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(body) // Send the whole body
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to update order');
        
        alert(`Order marked as ${body.orderStatus}.`);
    }
    // --- 10. == NEW: MY PRODUCTS BUTTON CLICKS (LIST/UNLIST) == ---
    productsTableBody.addEventListener('click', async (e) => {
        const button = e.target;
        const productId = button.dataset.productId;
        const action = button.dataset.action;

        if (button.classList.contains('btn-secondary')) { // --- EDIT ---
            // Fetch product data and populate the form
            await populateFormForEdit(productId);

        } else if (action === 'list' || action === 'unlist') { // --- LIST/UNLIST ---
            const isListed = (action === 'list');
            try {
                const response = await fetch(`${API_BASE}/products/${productId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ isListed: isListed })
                });
                if (!response.ok) throw new Error('Failed to update status');
                alert(`Product has been ${isListed ? 'Listed' : 'Unlisted'}.`);
                fetchSellerProducts(); // Refresh the list
            } catch (error) {
                alert(`Error: ${error.message}`);
            }
        }
    });

    async function populateFormForEdit(productId) {
        try {
            // Fetch the full product data
            const res = await fetch(`${API_BASE}/products/${productId}`);
            if (!res.ok) throw new Error('Failed to fetch product details');
            const product = await res.json();

            // Populate text fields
            currentEditId = product._id;
            hiddenProductId.value = product._id;
            document.getElementById('product-name').value = product.name;
            document.getElementById('product-desc').value = product.description;
            document.getElementById('product-price').value = product.price;
            document.getElementById('product-stock').value = product.stock;
            document.getElementById('product-category').value = product.category._id;

            // Populate current images
            currentImagesList.innerHTML = ''; // Clear old
            if (product.images && product.images.length > 0) {
                product.images.forEach((imagePath, index) => {
                    const item = document.createElement('div');
                    item.classList.add('current-image-item');
                    item.innerHTML = `
                        <img src="${API_BASE_URL}${imagePath}" alt="Current image ${index + 1}">
                        <label>
                            <input type="checkbox" value="${imagePath}"> Remove
                        </label>
                    `;
                    currentImagesList.appendChild(item);
                });
                currentImagesBlock.style.display = 'block';
            } else {
                currentImagesBlock.style.display = 'none';
            }

            // Update form state
            formTitle.textContent = 'Edit Product';
            formSubmitBtn.textContent = 'Update Product';
            formCancelBtn.style.display = 'inline-block';
            
            // Scroll to the form
            addProductForm.scrollIntoView({ behavior: 'smooth' });

        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    }
    
    // --- 11. == NEW: Reset form function ---
    function resetForm() {
        addProductForm.reset();
        currentEditId = null;
        hiddenProductId.value = '';
        currentImagesBlock.style.display = 'none';
        currentImagesList.innerHTML = '';
        formTitle.textContent = 'Add New Product';
        formSubmitBtn.textContent = 'Add Product';
        formCancelBtn.style.display = 'none';
    }


    // --- 11. Initial Call ---
    initializeDashboard();
});