document.addEventListener("DOMContentLoaded", () => {
    
    console.log("AniMerch frontend loaded! Fetching products...");

    const productGrid = document.getElementById("product-grid");
    
    // --- API URLs ---
    const API_URL = 'http://localhost:5000/api/products';
    const API_BASE_URL = 'http://localhost:5000'; // <-- 1. ADD THIS

    // Function to fetch products from the backend
    async function fetchProducts() {
        try {
            const response = await fetch(API_URL);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const products = await response.json();
            displayProducts(products);

        } catch (error) {
            console.error('Failed to fetch products:', error);
            productGrid.innerHTML = '<p class="error-message">Failed to load products. Is the backend server running?</p>';
        }
    }

    // Function to display products on the page
    function displayProducts(products) {
        productGrid.innerHTML = ""; // Clear any loading message

        if (products.length === 0) {
            productGrid.innerHTML = '<p>No products found.</p>';
            return;
        }

        products.forEach((product, index) => {
            const productCard = document.createElement("div");
            productCard.classList.add("product-card");

            // --- 2. UPDATE THIS LOGIC ---
            // Use placeholder if no image is provided, otherwise build the full URL
            const imageUrl = product.images && product.images.length > 0 
                ? `${API_BASE_URL}${product.images[0]}` // Prepend the base URL
                : 'https://via.placeholder.com/250x220.png?text=No+Image';

            productCard.innerHTML = `
                <img src="${imageUrl}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p class="product-price">$${product.price.toFixed(2)}</p>
                
                <!-- We add data-product-id to store the ID -->
                <button class="view-details-btn" data-product-id="${product._id}">View Details</button>
            `;
            
            // Set up staggered fade-in animation
            productCard.style.animation = `fadeIn 0.5s ease-out forwards`;
            productCard.style.animationDelay = `${index * 0.1}s`;
            
            productGrid.appendChild(productCard);
        });
    }

    // --- Add click listener for "View Details" ---
    productGrid.addEventListener('click', (e) => {
        if (e.target.classList.contains('view-details-btn')) {
            const productId = e.target.dataset.productId;
            localStorage.setItem('selectedProductId', productId);
            window.location.href = 'product-detail.html';
        }
    });

    // Call the function to get products when the page loads
    fetchProducts();
});