/**
 * AURA Collection Page Logic
 * Handles fetching from Firebase, scroll animations, category filtering, and quick add interactions.
 */

import { db } from './firebase-config.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Fetch products from Firestore and build the HTML first
    await fetchAndRenderCollection();

    // 2. Initialize UI interactions only AFTER products exist in the DOM
    initScrollAnimations();
    initFilters();
    initQuickAdd();
});

/**
 * Fetches products from Firestore and dynamically builds the grid HTML.
 */
async function fetchAndRenderCollection() {
    const productGrid = document.getElementById('product-grid');
    const countDisplay = document.getElementById('item-count');

    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        let htmlString = "";
        let totalItems = 0;
        let index = 0;

        querySnapshot.forEach((doc) => {
            const product = doc.data();
            totalItems++;

            // Replicate the asymmetric layout: Push down the middle column on large screens
            // (Indexes 1, 4, 7... get the lg:mt-24 class)
            const mtClass = (index % 3 === 1) ? "lg:mt-24" : "";
            
            // If you add a 'hoverImage' to your DB later, it will use it. Otherwise, it defaults back to the main image.
            const hoverImg = product.hoverImage ? product.hoverImage : product.image;

            htmlString += `
                <article class="product-card fade-in-up group flex flex-col gap-6 ${mtClass}" data-category="${product.categories}">
                    <div class="relative aspect-[4/5] overflow-hidden bg-stone-100">
                        <!-- Plain Image -->
                        <img src="${product.image}" alt="${product.title}" class="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out group-hover:opacity-0 z-10">
                        <!-- Lifestyle/Hover Image -->
                        <img src="${hoverImg}" alt="${product.title} Lifestyle" class="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out opacity-0 group-hover:opacity-100 z-0">
                        <!-- Quick Add Button -->
                        <button class="quick-add-btn absolute bottom-0 left-0 w-full bg-stone-900 text-white font-sans text-xs tracking-widest uppercase py-5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out z-20 hover:bg-stone-800">
                            Quick Add
                        </button>
                    </div>
                    <div class="flex flex-col items-center text-center">
                        <h2 class="font-serif text-xl text-stone-900 mb-2">${product.title}</h2>
                        <p class="font-sans text-sm text-stone-500">€${product.price.toLocaleString()}</p>
                    </div>
                </article>
            `;
            index++;
        });

        // Inject into the DOM
        productGrid.innerHTML = htmlString;
        
        // Update initial item count
        countDisplay.textContent = `Showing ${totalItems} piece${totalItems !== 1 ? 's' : ''}`;

    } catch (error) {
        console.error("Error fetching collection from Firebase:", error);
        productGrid.innerHTML = `<p class="col-span-full text-center text-stone-500">Failed to load collection. Please try again later.</p>`;
        countDisplay.textContent = "Error loading pieces";
    }
}

/**
 * Uses Intersection Observer to fade in products as they scroll into view.
 */
function initScrollAnimations() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Add class to trigger CSS transition
                entry.target.classList.add('is-visible');
                // Unobserve after animating once
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-in-up').forEach(el => {
        observer.observe(el);
    });
}

/**
 * Handles the filtering of the product grid based on category selection.
 */
function initFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const products = document.querySelectorAll('.product-card');
    const countDisplay = document.getElementById('item-count');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Reset all buttons styling
            filterBtns.forEach(b => {
                b.classList.remove('border-stone-900', 'text-stone-900');
                b.classList.add('border-transparent', 'text-stone-400');
            });
            
            // Apply active styling to clicked button
            btn.classList.remove('border-transparent', 'text-stone-400');
            btn.classList.add('border-stone-900', 'text-stone-900');

            const selectedCategory = btn.getAttribute('data-filter');
            let visibleCount = 0;

            // Filter products
            products.forEach(product => {
                // Retrieve categories from the data attribute (e.g., "seating living bedroom")
                const productCategories = product.getAttribute('data-category') || "";
                const categoryArray = productCategories.split(' ');

                // Check if it matches "all" or if the specific category exists in the array
                if (selectedCategory === 'all' || categoryArray.includes(selectedCategory)) {
                    product.style.display = 'flex';
                    visibleCount++;
                    
                    // Re-trigger the fade-in animation slightly for a smooth UI refresh
                    product.classList.remove('is-visible');
                    setTimeout(() => product.classList.add('is-visible'), 50);
                } else {
                    product.style.display = 'none';
                    product.classList.remove('is-visible');
                }
            });

            // Update item count text based on visible filtered items
            countDisplay.textContent = `Showing ${visibleCount} piece${visibleCount !== 1 ? 's' : ''}`;
        });
    });
}

/**
 * Handles the "Quick Add" button interactions and UI feedback.
 */
function initQuickAdd() {
    const addBtns = document.querySelectorAll('.quick-add-btn');
    const cartBadge = document.getElementById('cart-badge');
    let cartCount = 0;

    addBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            // Increment cart logic
            cartCount++;
            cartBadge.textContent = cartCount;
            cartBadge.classList.remove('opacity-0');
            cartBadge.classList.add('opacity-100');

            // Visual feedback on the button
            const originalText = btn.textContent;
            btn.textContent = 'Added';
            btn.classList.remove('bg-stone-900', 'hover:bg-stone-800');
            btn.classList.add('bg-stone-400', 'text-stone-900');

            // Revert button text after delay
            setTimeout(() => {
                btn.textContent = originalText;
                btn.classList.remove('bg-stone-400', 'text-stone-900');
                btn.classList.add('bg-stone-900', 'hover:bg-stone-800');
            }, 2000);
        });
    });
}
