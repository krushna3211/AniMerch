document.addEventListener('DOMContentLoaded', () => {
    
    // Get the product ID from localStorage
    const productId = localStorage.getItem('selectedProductId');
    const token = localStorage.getItem('userToken');
    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || null;
    
    if (!productId) {
        alert('No product selected. Redirecting to homepage.');
        window.location.href = 'index.html';
        return;
    }

    const API_URL = `http://localhost:5000/api/products/${productId}`;
    const API_BASE_URL = 'http://localhost:5000';

    // Get all the HTML elements
    const mainImage = document.getElementById('main-product-image');
    const thumbnailGallery = document.querySelector('.gallery-thumbnails');
    const productTitle = document.querySelector('.product-info h1');
    const productPrice = document.querySelector('.product-info-price');
    const productStock = document.querySelector('.product-info-stock');
    const productDescription = document.querySelector('.product-description');
    const productReviews = document.querySelector('.product-reviews');
    
    // --- NEW: Find form elements AFTER they are displayed ---
    let reviewFormContainer;
    let reviewForm;

    // Gallery variables
    const prevButton = document.getElementById('gallery-prev');
    const nextButton = document.getElementById('gallery-next');
    let currentImageIndex = 0;
    let productImages = [];

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
            displayProduct(product); // Display product and reviews first

            // --- Check if user can add a review ---
            if (userInfo && userInfo.role === 'customer') {
                
                // --- THIS IS THE UPDATED, SIMPLER CHECK ---
                // It runs *after* the backend fix is applied
                const alreadyReviewed = product.reviews.find(
                    r => r.user && r.user._id === userInfo._id
                );
                // --- END OF FIX ---

                if (!alreadyReviewed) {
                    // Now that we've displayed the form, we can find it
                    reviewFormContainer = document.getElementById('add-review-form-container');
                    if(reviewFormContainer) {
                        reviewFormContainer.style.display = 'block'; // Show the form
                    }
                }
            }
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
            document.querySelector('.product-actions .cta-button').disabled = true;
            document.querySelector('.product-actions .cta-button').textContent = 'Out of Stock';
        }

        // --- 2. Fill Description ---
        productDescription.innerHTML = '<h3>Description</h3>'; 
        const descriptionParagraph = document.createElement('p');
        descriptionParagraph.textContent = product.description;
        productDescription.appendChild(descriptionParagraph);

        // --- 3. Fill Image Gallery ---
        productImages = product.images && product.images.length > 0 
            ? product.images.map(img => `${API_BASE_URL}${img}`)
            : ['https://via.placeholder.com/500x500.png?text=No+Image'];
        
        thumbnailGallery.innerHTML = '';
        
        productImages.forEach((imageUrl, index) => {
            if (index === 0) {
                mainImage.src = imageUrl;
                mainImage.alt = product.name;
            }
            const thumb = document.createElement('img');
            thumb.src = imageUrl;
            thumb.alt = `Product thumbnail ${index + 1}`;
            thumb.dataset.index = index;
            if (index === 0) thumb.classList.add('active-thumb');
            thumbnailGallery.appendChild(thumb);
        });

        // --- 4. Fill Reviews ---
        productReviews.innerHTML = '<h2>Customer Reviews</h2>'; 
        if (product.reviews.length === 0) {
            productReviews.innerHTML += '<p>No reviews yet.</p>';
        } else {
            product.reviews.forEach(review => {
                const reviewCard = document.createElement('div');
                reviewCard.classList.add('review-card');
                // Added a safety check for review.username
                reviewCard.innerHTML = `
                    <div class="review-header">
                        <span class="review-author">${review.username || 'User'}</span>
                        <span class="review-rating">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</span>
                    </div>
                    <p class="review-body">${review.comment}</p>
                `;
                productReviews.appendChild(reviewCard);
            });
        }

        // --- 5. Add the review form HTML (it's already in your file, this is a fallback) ---
        if (!document.getElementById('add-review-form-container')) {
             const reviewFormHtml = `
                <div id="add-review-form-container" style="display: none;">
                    <h3>Leave a Review</h3>
                    <form id="add-review-form" class="dashboard-form">
                        <div class="input-group">
                            <label for="review-rating">Rating</label>
                            <select id="review-rating">
                                <option value="">Select...</option>
                                <option value="1">1 - Poor</option>
                                <option value="2">2 - Fair</option>
                                <option value="3">3 - Good</option>
                                <option value="4">4 - Very Good</option>
                                <option value="5">5 - Excellent</option>
                            </select>
                        </div>
                        <div class="input-group">
                            <label for="review-comment">Comment</label>
                            <textarea id="review-comment" rows="3" required></textarea>
                        </div>
                        <button type="submit" class="cta-button">Submit Review</button>
                    </form>
                </div>
            `;
            productReviews.insertAdjacentHTML('beforeend', reviewFormHtml);
        }
        
        // --- 6. Now that the form is on the page, add the listener ---
        reviewForm = document.getElementById('add-review-form');
        if (reviewForm) {
            reviewForm.addEventListener('submit', handleReviewSubmit);
        }
    }

    // --- Gallery Click Handlers ---
    function showImage(index) {
        mainImage.src = productImages[index];
        currentImageIndex = index;
        thumbnailGallery.querySelectorAll('img').forEach((img, i) => {
            img.classList.toggle('active-thumb', i === index);
        });
    }
    prevButton.addEventListener('click', () => {
        let newIndex = currentImageIndex - 1;
        if (newIndex < 0) newIndex = productImages.length - 1;
        showImage(newIndex);
    });
    nextButton.addEventListener('click', () => {
        let newIndex = currentImageIndex + 1;
        if (newIndex >= productImages.length) newIndex = 0;
        showImage(newIndex);
    });
    thumbnailGallery.addEventListener('click', (e) => {
        if (e.target.tagName === 'IMG') {
            const index = parseInt(e.target.dataset.index);
            showImage(index);
        }
    });

    // --- Add to Cart Logic ---
    const addToCartButton = document.querySelector('.product-actions .cta-button');
    const quantityInput = document.getElementById('quantity');
    addToCartButton.addEventListener('click', () => {
        const qty = parseInt(quantityInput.value);
        if (qty <= 0) { alert('Quantity must be at least 1.'); return; }
        const name = productTitle.textContent;
        const price = parseFloat(productPrice.textContent.replace('$', ''));
        const image = mainImage.src;
        let cart = JSON.parse(localStorage.getItem('animerchCart')) || {};
        if (cart[productId]) {
            cart[productId].qty += qty;
        } else {
            cart[productId] = { id: productId, name: name, price: price, image: image, qty: qty };
        }
        localStorage.setItem('animerchCart', JSON.stringify(cart));
        alert(`${qty} x ${name} added to cart!`);
        window.location.href = 'cart.html';
    });

    // --- REVIEW FORM SUBMISSION (Moved to its own function) ---
    async function handleReviewSubmit(e) {
        e.preventDefault();

        const rating = document.getElementById('review-rating').value;
        const comment = document.getElementById('review-comment').value;
        if (!rating) {
            alert('Please select a rating.');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ rating, comment })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to submit review.');
            }
            alert('Review submitted successfully!');
            window.location.reload();
        } catch (error) {
            console.error('Review submit error:', error);
            alert(`Error: ${error.message}`);
        }
    }

    // Call the initial fetch function
    fetchProductDetails();
});
