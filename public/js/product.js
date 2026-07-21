import { app, db } from './firebase-config.js';
import { doc, getDoc, collection, query, where, getDocs, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('single-product-container');
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        renderError(container, "No product ID specified in the URL.");
        return;
    }

    try {
        const docRef = doc(db, "products", productId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            // 1. Render the main product
            renderProduct(container, { id: docSnap.id, ...docSnap.data() });
            
            // 2. Initialize the Reviews System (which also populates the header rating)
            initReviewsSystem(productId);
        } else {
            renderError(container, "The requested piece could not be found.");
        }
    } catch (error) {
        console.error("Error fetching product:", error);
        renderError(container, "An error occurred while loading the product from the database.");
    }
});

function renderError(container, message) {
    container.innerHTML = `
        <div class="text-center flex flex-col items-center">
            <h1 class="font-serif text-4xl text-stone-900 mb-6">Not Found</h1>
            <p class="font-sans text-stone-500 mb-10">${message}</p>
            <a href="collection.html" class="font-sans text-sm tracking-widest uppercase border-b border-stone-900 text-stone-900 pb-1 hover:text-stone-600 hover:border-stone-600 transition-colors">
                Return to Collection
            </a>
        </div>
    `;
}

function renderProduct(container, product) {
    // Determine images for gallery
    let images = product.images || [];
    if (images.length === 0) {
        if (product.image) images.push(product.image);
        if (product.hoverImage && product.hoverImage !== product.image) images.push(product.hoverImage);
    }
    images = [...new Set(images)];
    if (images.length === 0) images.push('');

    // Update document title for SEO
    document.title = `AURA | ${product.title}`;

    container.classList.remove('flex', 'items-center', 'justify-center');
    
    // Build Thumbnails HTML
    let thumbnailsHTML = '';
    if (images.length > 1) {
        thumbnailsHTML = `
            <div class="flex gap-4 overflow-x-auto no-scrollbar py-4">
                ${images.map((img, index) => `
                    <button class="gallery-thumbnail flex-shrink-0 w-20 h-24 bg-stone-100 overflow-hidden rounded-sm border-2 ${index === 0 ? 'border-stone-900' : 'border-transparent'} transition-colors" data-index="${index}">
                        <img src="${img}" alt="Thumbnail ${index + 1}" class="w-full h-full object-cover pointer-events-none">
                    </button>
                `).join('')}
            </div>
        `;
    }

    // Build Slider HTML
    let sliderHTML = `
        <div class="relative aspect-[4/5] w-full bg-stone-100 overflow-hidden rounded-sm group">
            <img id="main-gallery-image" src="${images[0]}" alt="${product.title}" class="w-full h-full object-cover transition-opacity duration-300">
            ${images.length > 1 ? `
                <button id="prev-image-btn" class="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur hover:bg-white text-stone-900 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
                    <i class="fa-solid fa-chevron-left"></i>
                </button>
                <button id="next-image-btn" class="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur hover:bg-white text-stone-900 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
                    <i class="fa-solid fa-chevron-right"></i>
                </button>
            ` : ''}
        </div>
        ${thumbnailsHTML}
    `;

    // Inject layout (Including Dynamic Product Description & Dispatch Time)
    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 items-start">
            
            <!-- Left Column: Image Gallery Slider -->
            <div class="flex flex-col w-full max-w-2xl mx-auto md:max-w-none">
                ${sliderHTML}
            </div>

            <!-- Right Column: Product Info (Sticky) -->
            <div class="flex flex-col sticky top-32">
                <!-- Breadcrumbs -->
                <nav class="flex text-xs font-sans tracking-widest uppercase text-stone-400 mb-8 gap-2">
                    <a href="index.html" class="hover:text-stone-900 transition-colors">Home</a>
                    <span>/</span>
                    <a href="collection.html" class="hover:text-stone-900 transition-colors">Collection</a>
                    <span>/</span>
                    <span class="text-stone-900">${product.title}</span>
                </nav>

                <h1 class="font-serif text-4xl md:text-5xl text-stone-900 mb-4">${product.title}</h1>
                
                <!-- Dynamic Header Rating Placeholder -->
                <div id="header-rating-container" class="flex items-center gap-3 mb-6 h-6">
                    <!-- Injected by initReviewsSystem -->
                </div>

                <p class="font-sans text-xl text-stone-500 mb-8 font-medium">€${product.price.toLocaleString()}</p>
                
                <div class="w-12 h-px bg-stone-300 mb-8"></div>
                
                <!-- Dynamic Description Injection -->
                <div class="prose prose-stone font-sans text-stone-500 leading-relaxed mb-10">
                    <p id="product-description">${product.description || product.desc || 'No description available for this piece.'}</p>
                </div>

                <!-- Shipping Perks -->
                <div class="space-y-6 mb-12">
                    <div class="flex items-center gap-4 text-sm font-sans text-stone-600">
                        <svg class="w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 13l4 4L19 7"></path></svg>
                        Complimentary Standard Shipping
                    </div>
                    <div class="flex items-center gap-4 text-sm font-sans text-stone-600">
                        <svg class="w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        Estimated Dispatch: <span id="product-dispatch">${product.estimated_dispatch || '3-5 Business Days'}</span>
                    </div>
                </div>

                <!-- Add to Cart Action -->
                <button id="add-to-cart-btn" class="w-full bg-stone-900 text-white font-sans text-sm tracking-widest uppercase py-5 rounded-sm hover:bg-stone-800 transition-colors shadow-sm mb-8"
                    data-id="${product.id}"
                    data-title="${product.title}"
                    data-price="${product.price}"
                    data-image="${product.image}"
                    data-stock="${product.stock || 0}">
                    Add to Cart
                </button>

                <!-- Accordion Details -->
                <div class="border-t border-stone-200">
                    <details class="group border-b border-stone-200 py-5" open>
                        <summary class="font-sans text-sm font-medium tracking-wide text-stone-900 cursor-pointer flex justify-between items-center list-none [&::-webkit-details-marker]:hidden">
                            Details & Dimensions
                            <span class="text-stone-400 transition-transform duration-300 group-open:rotate-45">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v16m8-8H4"></path></svg>
                            </span>
                        </summary>
                        <div class="font-sans text-sm text-stone-500 mt-4 leading-relaxed space-y-2">
                            <p><strong>Materials:</strong> FSC-Certified Timber, Organic Finishes</p>
                            <p><strong>Care:</strong> Wipe clean with a soft, dry cloth. Avoid harsh chemicals.</p>
                            <p><strong>Dimensions:</strong> Varies by piece. Contact us for specifics.</p>
                        </div>
                    </details>
                </div>
            </div>
        </div>
    `;

    // Initialize Gallery Logic
    if (images.length > 1) {
        let currentIndex = 0;
        const mainImageEl = document.getElementById('main-gallery-image');
        const thumbnails = document.querySelectorAll('.gallery-thumbnail');
        const prevBtn = document.getElementById('prev-image-btn');
        const nextBtn = document.getElementById('next-image-btn');

        const updateGallery = (index) => {
            mainImageEl.style.opacity = 0;
            setTimeout(() => {
                mainImageEl.src = images[index];
                mainImageEl.style.opacity = 1;
            }, 150);

            thumbnails.forEach(t => t.classList.remove('border-stone-900'));
            thumbnails.forEach(t => t.classList.add('border-transparent'));
            thumbnails[index].classList.remove('border-transparent');
            thumbnails[index].classList.add('border-stone-900');
            currentIndex = index;
        };

        prevBtn.addEventListener('click', () => {
            let newIndex = currentIndex - 1;
            if (newIndex < 0) newIndex = images.length - 1;
            updateGallery(newIndex);
        });

        nextBtn.addEventListener('click', () => {
            let newIndex = currentIndex + 1;
            if (newIndex >= images.length) newIndex = 0;
            updateGallery(newIndex);
        });

        thumbnails.forEach(thumb => {
            thumb.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.getAttribute('data-index'));
                if (index !== currentIndex) {
                    updateGallery(index);
                }
            });
        });
    }

    // Hook up Add to Cart
    const addBtn = document.getElementById('add-to-cart-btn');
    addBtn.addEventListener('click', () => {
        const productData = {
            id: addBtn.getAttribute('data-id'),
            title: addBtn.getAttribute('data-title'),
            price: parseInt(addBtn.getAttribute('data-price')),
            image: addBtn.getAttribute('data-image'),
            stock: parseInt(addBtn.getAttribute('data-stock'))
        };
        
        const success = window.addToCart(productData);
        const originalText = "Add to Cart";

        if (success) {
            addBtn.textContent = 'Added';
            addBtn.classList.remove('bg-stone-900', 'hover:bg-stone-800');
            addBtn.classList.add('bg-stone-400', 'text-stone-900');
        } else {
            addBtn.textContent = 'Max Limit Reached';
            addBtn.classList.remove('bg-stone-900', 'hover:bg-stone-800');
            addBtn.classList.add('bg-stone-300', 'text-stone-600');
        }

        setTimeout(() => {
            addBtn.textContent = originalText;
            addBtn.classList.remove('bg-stone-400', 'bg-stone-300', 'text-stone-900', 'text-stone-600');
            addBtn.classList.add('bg-stone-900', 'hover:bg-stone-800');
        }, 2000);
    });
}

// ==========================================
// REVIEWS SYSTEM INITIALIZATION
// ==========================================
function initReviewsSystem(productId) {
    const auth = getAuth(app);
    let currentUser = null;
    let currentRating = 0;

    // DOM Elements
    const reviewsSection = document.getElementById('reviews-section');
    const loggedOutEl = document.getElementById('review-logged-out');
    const alreadyReviewedEl = document.getElementById('review-already-submitted');
    const reviewForm = document.getElementById('review-form');
    const starContainer = document.getElementById('star-rating-container');
    const stars = document.querySelectorAll('.star-icon');
    const submitBtn = document.getElementById('submit-review-btn');
    const reviewsListContainer = document.getElementById('reviews-list-container');
    const headerRatingContainer = document.getElementById('header-rating-container');

    if (!reviewsSection) return;

    // Unhide the reviews section wrapper
    reviewsSection.classList.remove('hidden');

    // 1. Auth State Listener & One-Review Check
    onAuthStateChanged(auth, async (user) => {
        currentUser = user;
        if (user) {
            loggedOutEl.classList.add('hidden');
            
            // Check if this user has already reviewed this exact product
            const reviewId = `${productId}_${user.uid}`;
            const reviewRef = doc(db, "reviews", reviewId);
            
            try {
                const reviewSnap = await getDoc(reviewRef);
                if (reviewSnap.exists()) {
                    // User already reviewed it
                    reviewForm.classList.add('hidden');
                    reviewForm.classList.remove('flex');
                    alreadyReviewedEl.classList.remove('hidden');
                } else {
                    // User hasn't reviewed it yet
                    alreadyReviewedEl.classList.add('hidden');
                    reviewForm.classList.remove('hidden');
                    reviewForm.classList.add('flex');
                }
            } catch (error) {
                console.error("Error checking existing review:", error);
                // Fallback: show form if error occurs
                reviewForm.classList.remove('hidden');
                reviewForm.classList.add('flex');
            }

        } else {
            reviewForm.classList.add('hidden');
            reviewForm.classList.remove('flex');
            alreadyReviewedEl.classList.add('hidden');
            loggedOutEl.classList.remove('hidden');
        }
    });

    // 2. Helper to Render Header Stars
    function renderHeaderStars(sum, count) {
        if (!headerRatingContainer) return;
        
        if (count === 0 || isNaN(sum) || isNaN(count)) {
            headerRatingContainer.innerHTML = `<span class="font-sans text-xs text-stone-400 italic">No reviews yet</span>`;
            return;
        }

        // Calculate exact decimal average
        const exactAvg = sum / count;
        const displayAvg = (Math.round(exactAvg * 10) / 10).toFixed(1); 
        
        // Round to nearest whole number for the star loop
        const roundedAvg = Math.round(exactAvg);

        let starsHtml = '<div class="flex gap-1 text-sm">';
        for (let i = 1; i <= 5; i++) {
            starsHtml += `<i class="fa-solid fa-star ${i <= roundedAvg ? 'text-stone-900' : 'text-stone-200'}"></i>`;
        }
        starsHtml += `</div><span class="font-sans text-sm text-stone-500 ml-2 font-medium">${displayAvg} <span class="font-normal text-stone-400">(${count})</span></span>`;
        
        headerRatingContainer.innerHTML = starsHtml;
    }

    // 3. Fetch and Render Reviews
    async function fetchAndRenderReviews() {
        try {
            const q = query(collection(db, "reviews"), where("productId", "==", productId));
            const snapshot = await getDocs(q);
            
            let reviews = [];
            let totalScore = 0;

            snapshot.forEach(doc => {
                const data = doc.data();
                reviews.push({ id: doc.id, ...data });
                
                // Force Type Casting to Number
                totalScore += Number(data.rating) || 0; 
            });

            // Update Header Rating
            renderHeaderStars(totalScore, reviews.length);

            // Sort Descending
            reviews.sort((a, b) => {
                const timeA = a.timestamp ? a.timestamp.toMillis() : Date.now();
                const timeB = b.timestamp ? b.timestamp.toMillis() : Date.now();
                return timeB - timeA;
            });

            if (reviews.length === 0) {
                reviewsListContainer.innerHTML = `
                    <div class="bg-white border border-stone-100 p-16 rounded-sm text-center flex flex-col items-center shadow-sm">
                        <svg class="w-12 h-12 text-stone-300 mb-4 stroke-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                        <h3 class="font-serif text-xl text-stone-900 mb-2">No reviews yet</h3>
                        <p class="font-sans text-sm text-stone-500">Be the first to review this piece and share your thoughts.</p>
                    </div>
                `;
                return;
            }

            let html = '';
            reviews.forEach(review => {
                let starsHtml = '';
                const revRating = Number(review.rating) || 0;
                for(let i = 1; i <= 5; i++) {
                    starsHtml += `<i class="fa-solid fa-star ${i <= revRating ? 'text-stone-900' : 'text-stone-200'}"></i>`;
                }

                const dateObj = review.timestamp ? review.timestamp.toDate() : new Date();
                const dateStr = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

                html += `
                    <div class="bg-white border border-stone-100 p-8 md:p-10 rounded-sm shadow-sm flex flex-col gap-5">
                        <div class="flex justify-between items-start">
                            <div>
                                <h4 class="font-sans font-semibold text-stone-900 text-sm md:text-base">${review.userName}</h4>
                                <span class="font-sans text-xs text-stone-400 tracking-wider uppercase">${dateStr}</span>
                            </div>
                            <div class="text-xs flex gap-1">
                                ${starsHtml}
                            </div>
                        </div>
                        <p class="font-sans text-sm text-stone-600 leading-relaxed">${review.comment}</p>
                    </div>
                `;
            });
            
            reviewsListContainer.innerHTML = html;

        } catch (error) {
            console.error("Error fetching reviews:", error);
            reviewsListContainer.innerHTML = `<div class="text-red-500 font-sans text-sm p-4 bg-red-50 border border-red-100 rounded-sm">Failed to load reviews. Please refresh the page.</div>`;
        }
    }

    // Initial Fetch
    fetchAndRenderReviews();

    // 4. Star Rating Interactive Logic
    function updateStarsUI(rating) {
        stars.forEach(star => {
            const starVal = parseInt(star.getAttribute('data-rating'));
            if (starVal <= rating) {
                star.classList.remove('text-stone-200');
                star.classList.add('text-stone-900');
            } else {
                star.classList.remove('text-stone-900');
                star.classList.add('text-stone-200');
            }
        });
    }

    stars.forEach(star => {
        star.addEventListener('mouseenter', (e) => {
            const hoverVal = parseInt(e.target.getAttribute('data-rating'));
            updateStarsUI(hoverVal);
        });
        
        star.addEventListener('click', (e) => {
            currentRating = parseInt(e.target.getAttribute('data-rating'));
            updateStarsUI(currentRating);
        });
    });

    starContainer.addEventListener('mouseleave', () => {
        updateStarsUI(currentRating);
    });

    // 5. Form Submission Logic
    reviewForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!currentUser) return;
        
        if (currentRating === 0) {
            alert("Please select a star rating before submitting.");
            return;
        }

        const comment = document.getElementById('review-comment').value.trim();
        if (!comment) return;

        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Posting...';
        submitBtn.disabled = true;
        submitBtn.classList.add('opacity-70', 'cursor-not-allowed');

        try {
            let userName = currentUser.email.split('@')[0];
            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            
            if (userDoc.exists()) {
                const data = userDoc.data();
                if (data.firstName || data.lastName) {
                    userName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
                }
            }

            // Deterministic Document ID to enforce One-Review-Per-User
            const reviewId = `${productId}_${currentUser.uid}`;

            await setDoc(doc(db, "reviews", reviewId), {
                productId: productId,
                userId: currentUser.uid,
                userName: userName,
                rating: Number(currentRating),
                comment: comment,
                timestamp: serverTimestamp()
            });

            // Transition UI State
            reviewForm.classList.add('hidden');
            reviewForm.classList.remove('flex');
            alreadyReviewedEl.classList.remove('hidden');

            // Re-render the reviews list and header rating seamlessly
            await fetchAndRenderReviews();

        } catch (error) {
            console.error("Error posting review:", error);
            alert("Failed to post your review. Please try again.");
            
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            submitBtn.classList.remove('opacity-70', 'cursor-not-allowed');
        }
    });
}
