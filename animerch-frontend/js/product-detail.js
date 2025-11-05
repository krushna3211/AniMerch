document.addEventListener('DOMContentLoaded', () => {
    
    // Get the product ID from localStorage
    const productId = localStorage.getItem('selectedProductId');
    
    if (!productId) {
        // If no ID is found, send the user back to the homepage
        alert('No product selected. Redirecting to homepage.');
        window.location.href = 'index.html';
        return;
    }

    const API_URL = `http://localhost:5000/api/products/${productId}`;
    const API_BASE_URL = 'http://localhost:5000'; // For image paths

    // Get all the HTML elements we need to fill
    const mainImage = document.querySelector('.gallery-main-image img');
    const thumbnailGallery = document.querySelector('.gallery-thumbnails');
    const productTitle = document.querySelector('.product-info h1');
    const productPrice = document.querySelector('.product-info-price');
    const productStock = document.querySelector('.product-info-stock');
    const productDescription = document.querySelector('.product-description');
    const productReviews = document.querySelector('.product-reviews');
    const prevButton = document.getElementById('gallery-prev');
    const nextButton = document.getElementById('gallery-next');
    let currentImageIndex = 0;
    let productImages = []; // To store the image paths

    async function fetchProductDetails() {
        try {
            const response = await fetch(API_URL);
            
            if (!response.ok) {
                if (response.status === 404) {
                    alert('Product not found. Redirecting to homepage.');
                    window.location.href = 'index.html';
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const product = await response.json();
            displayProduct(product);

        } catch (error) {
            console.error('Failed to fetch product details:', error);
            document.querySelector('.product-detail-main').innerHTML = 
                '<p class="error-message">Failed to load product. Please try again.</p>';
        }
    }

    function displayProduct(product) {
        // --- 1. Fill Text Info ---
        productTitle.textContent = product.name;
        productPrice.textContent = `$${product.price.toFixed(2)}`;
        
        if (product.stock > 0) {
            productStock.textContent = `In Stock (${product.stock} available)`;
            productStock.classList.add('in-stock');
        } else {
            productStock.textContent = 'Out of Stock';
            productStock.classList.add('out-of-stock');
            // Disable 'Add to Cart' if out of stock
            document.querySelector('.product-actions .cta-button').disabled = true;
            document.querySelector('.product-actions .cta-button').textContent = 'Out of Stock';
        }

        // --- 2. Fill Description ---
        // Clear placeholder
        productDescription.innerHTML = '<h3>Description</h3>'; 
        const descriptionParagraph = document.createElement('p');
        descriptionParagraph.textContent = product.description;
        productDescription.appendChild(descriptionParagraph);

        // --- 3. NEW: Fill Image Gallery ---
        productImages = product.images && product.images.length > 0 
            ? product.images.map(img => `${API_BASE_URL}${img}`) // Add base URL to image paths
            : ['https://via.placeholder.com/500x500.png?text=No+Image']; // Placeholder
        
        thumbnailGallery.innerHTML = ''; // Clear placeholder thumbnails
        
        productImages.forEach((imageUrl, index) => {
            // Set the first image as the main image
            if (index === 0) {
                mainImage.src = imageUrl;
                mainImage.alt = product.name;
            }
            
            // Create thumbnail
            const thumb = document.createElement('img');
            thumb.src = imageUrl;
            thumb.alt = `Product thumbnail ${index + 1}`;
            thumb.dataset.index = index; // Store the index
            if (index === 0) thumb.classList.add('active-thumb');
            
            thumbnailGallery.appendChild(thumb);
        });


        // --- 4. Fill Reviews ---
        // Clear placeholder
        productReviews.innerHTML = '<h2>Customer Reviews</h2>'; 
        if (product.reviews.length === 0) {
            productReviews.innerHTML += '<p>No reviews yet.</p>';
        } else {
            product.reviews.forEach(review => {
                const reviewCard = document.createElement('div');
                reviewCard.classList.add('review-card');
                reviewCard.innerHTML = `
                    <div class="review-header">
                        <span class="review-author">${review.username}</span>
                        <span class="review-rating">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</span>
                    </div>
                    <p class="review-body">${review.comment}</p>
                `;
                productReviews.appendChild(reviewCard);
            });
        }
    }
// --- NEW: Gallery Click Handlers ---
    
    function showImage(index) {
        // Set main image
        mainImage.src = productImages[index];
        currentImageIndex = index;

        // Update active thumbnail
        thumbnailGallery.querySelectorAll('img').forEach((img, i) => {
            img.classList.toggle('active-thumb', i === index);
        });
    }

    // Previous button
    prevButton.addEventListener('click', () => {
        let newIndex = currentImageIndex - 1;
        if (newIndex < 0) newIndex = productImages.length - 1; // Wrap around
        showImage(newIndex);
    });

    // Next button
    nextButton.addEventListener('click', () => {
        let newIndex = currentImageIndex + 1;
        if (newIndex >= productImages.length) newIndex = 0; // Wrap around
        showImage(newIndex);
    });

    // Thumbnail click
    thumbnailGallery.addEventListener('click', (e) => {
        if (e.target.tagName === 'IMG') {
            const index = parseInt(e.target.dataset.index);
            showImage(index);
        }
    });

    
    // --- NEW: Add to Cart Logic ---
    const addToCartButton = document.querySelector('.product-actions .cta-button');
    const quantityInput = document.getElementById('quantity');

    addToCartButton.addEventListener('click', () => {
        const productId = localStorage.getItem('selectedProductId');
        const qty = parseInt(quantityInput.value);

        if (qty <= 0) {
            alert('Quantity must be at least 1.');
            return;
        }

        // We need the product's details to store in the cart
        // Let's grab them from the page (since they're already loaded)
        const name = productTitle.textContent;
        const price = parseFloat(productPrice.textContent.replace('$', ''));
        const image = mainImage.src;

        // 1. Get the existing cart from localStorage (or create a new one)
        // We'll store items as an object, using the product ID as the key
        let cart = JSON.parse(localStorage.getItem('animerchCart')) || {};

        // 2. Add or update the item
        if (cart[productId]) {
            // If item is already in cart, update its quantity
            cart[productId].qty += qty;
        } else {
            // If new item, add it
            cart[productId] = {
                id: productId,
                name: name,
                price: price,
                image: image,
                qty: qty
            };
        }

        // 3. Save the updated cart back to localStorage
        localStorage.setItem('animerchCart', JSON.stringify(cart));

        // 4. Send the user to the cart page
        alert(`${qty} x ${name} added to cart!`);
        window.location.href = 'cart.html';
    });

    // Call the initial fetch function
    fetchProductDetails();

});