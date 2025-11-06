document.addEventListener("DOMContentLoaded", () => {
    
    console.log("AniMerch frontend loaded! Fetching products...");

    const productGrid = document.getElementById("product-grid");
    const categoryGrid = document.querySelector('.category-grid'); 
    const viewAllProductsBtn = document.getElementById('view-all-products'); 
    
    // --- API URLs ---
    const API_PRODUCTS_URL = 'http://localhost:5000/api/products';
    const API_CATEGORIES_URL = 'http://localhost:5000/api/categories'; 
    const API_BASE_URL = 'http://localhost:5000'; 

   // --- 1. UPDATED: fetchProducts function ---
    // Now accepts an optional categoryId
    async function fetchProducts(categoryId = null) {
        let url = API_PRODUCTS_URL;
        
        if (categoryId) {
            url += `?category=${categoryId}`; // Add the filter query
        }

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const products = await response.json();
            displayProducts(products);

        } catch (error) {
            console.error('Failed to fetch products:', error);
            productGrid.innerHTML = '<p class="error-message">Failed to load products. Is the backend server running?</p>';
        }
    }

    // --- 3. NEW: Fetch and Display Categories ---
    async function fetchAndDisplayCategories() {
        try {
            const response = await fetch(API_CATEGORIES_URL);
            if (!response.ok) throw new Error('Failed to fetch categories');
            
            const categories = await response.json();

            // Clear the placeholder grid
            categoryGrid.innerHTML = ''; 
            
            categories.forEach(category => {
                const categoryCard = document.createElement('div');
                categoryCard.classList.add('category-card');
                // We'll just use the name for now, not the placeholder image
                categoryCard.innerHTML = `<h3>${category.name}</h3>`;
                
                // Add the category ID as a data-attribute for clicking
                categoryCard.dataset.categoryId = category._id;
                
                categoryGrid.appendChild(categoryCard);
            });

        } catch (error) {
            console.error('Failed to fetch categories:', error);
            categoryGrid.innerHTML = '<p>Failed to load categories.</p>';
        }
    }

    // --- 4. NEW: Category Click Handler ---
    categoryGrid.addEventListener('click', (e) => {
        // Find the category card, even if user clicks the <h3>
        const card = e.target.closest('.category-card'); 
        
        if (card && card.dataset.categoryId) {
            const categoryId = card.dataset.categoryId;
            // Fetch products for *only* this category
            fetchProducts(categoryId);
        }
    });

    // --- 5. NEW: "View All" Click Handler ---
    viewAllProductsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // Fetch products with no filter
        fetchProducts(null);
    });

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

    fetchProducts();
    fetchAndDisplayCategories();
});
