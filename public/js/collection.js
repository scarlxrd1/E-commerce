import { db } from './firebase-config.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Master array to hold all fetched products for client-side filtering
let allProducts = [];

document.addEventListener('DOMContentLoaded', async () => {
    await fetchAndRenderCollection();
    initFilters();
});

async function fetchAndRenderCollection() {
    const productGrid = document.getElementById('product-grid');
    const countDisplay = document.getElementById('item-count');

    try {
        // 1. Fetch all products once
        const querySnapshot = await getDocs(collection(db, "products"));
        querySnapshot.forEach((doc) => {
            // Include document ID for linking to single product page
            allProducts.push({ id: doc.id, ...doc.data() });
        });

        // 2. Apply initial filters (incorporates URL search, category, and price)
        applyFilters();

    } catch (error) {
        console.error("Error fetching collection from Firebase:", error);
        if (productGrid) {
            productGrid.innerHTML = `<p class="col-span-full text-center text-stone-500">Failed to load collection. Please try again later.</p>`;
        }
        if (countDisplay) {
            countDisplay.textContent = "Error loading pieces";
        }
    }
}

// Consolidates all filter logic: Search, Category, and Price
function applyFilters() {
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search') ? urlParams.get('search').toLowerCase() : null;
    
    const activeCategoryBtn = document.querySelector('.filter-btn.border-stone-900');
    const selectedCategory = activeCategoryBtn ? activeCategoryBtn.getAttribute('data-filter') : 'all';
    
    const minPriceInput = document.getElementById('min-price').value;
    const maxPriceInput = document.getElementById('max-price').value;
    const minPrice = minPriceInput ? parseFloat(minPriceInput) : 0;
    const maxPrice = maxPriceInput ? parseFloat(maxPriceInput) : Infinity;

    const filteredProducts = allProducts.filter(p => {
        // Evaluate Search Match
        let matchesSearch = true;
        if (searchQuery) {
            const titleMatch = p.title && p.title.toLowerCase().includes(searchQuery);
            const descMatch = p.desc && p.desc.toLowerCase().includes(searchQuery);
            matchesSearch = titleMatch || descMatch;
        }

        // Evaluate Category Match
        let matchesCategory = true;
        if (selectedCategory !== 'all') {
            const categories = p.categories || "";
            matchesCategory = categories.split(' ').includes(selectedCategory);
        }

        // Evaluate Price Match
        const price = p.price || 0;
        const matchesPrice = price >= minPrice && price <= maxPrice;

        return matchesSearch && matchesCategory && matchesPrice;
    });

    renderGrid(filteredProducts);
}

// Helper to generate HTML and inject it based on a provided array
function renderGrid(productsToRender) {
    const productGrid = document.getElementById('product-grid');
    const countDisplay = document.getElementById('item-count');
    if (!productGrid) return;

    let htmlString = "";
    let index = 0;

    productsToRender.forEach((product) => {
        const mtClass = (index % 3 === 1) ? "lg:mt-24" : "";
        const hoverImg = product.hoverImage ? product.hoverImage : product.image;

        // Wrap entirely in an anchor tag pointing to the new product page
        htmlString += `
            <a href="product.html?id=${product.id}" target="_blank" class="product-card fade-in-up group flex flex-col gap-6 ${mtClass}" data-category="${product.categories}">
                <div class="relative aspect-[4/5] overflow-hidden bg-stone-100">
                    <img src="${product.image}" alt="${product.title}" class="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out group-hover:opacity-0 z-10">
                    <img src="${hoverImg}" alt="${product.title} Lifestyle" class="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out opacity-0 group-hover:opacity-100 z-0">
                    
                    <button class="quick-add-btn absolute bottom-0 left-0 w-full bg-stone-900 text-white font-sans text-xs tracking-widest uppercase py-5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out z-20 hover:bg-stone-800"
                        data-title="${product.title}"
                        data-price="${product.price}"
                        data-image="${product.image}">
                        Quick Add
                    </button>
                </div>
                <div class="flex flex-col items-center text-center">
                    <h2 class="font-serif text-xl text-stone-900 mb-2">${product.title}</h2>
                    <p class="font-sans text-sm text-stone-500">€${product.price.toLocaleString()}</p>
                </div>
            </a>
        `;
        index++;
    });

    if (productsToRender.length === 0) {
        htmlString = `<p class="col-span-full text-center text-stone-500 py-12">No pieces found matching your criteria.</p>`;
    }

    productGrid.innerHTML = htmlString;

    // Update Counter UI dynamically
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search');
    
    if (countDisplay) {
        if (searchQuery) {
            countDisplay.textContent = `Search results for: '${searchQuery}' (${productsToRender.length})`;
        } else {
            countDisplay.textContent = `Showing ${productsToRender.length} piece${productsToRender.length !== 1 ? 's' : ''}`;
        }
    }

    // Re-initialize dynamic interactions for newly created DOM elements
    initScrollAnimations();
    initQuickAdd();
}

function initFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const applyPriceBtn = document.getElementById('apply-price-filter');

    // Category Buttons
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // 1. Update UI Styling for the Active Button
            filterBtns.forEach(b => {
                b.classList.remove('border-stone-900', 'text-stone-900');
                b.classList.add('border-transparent', 'text-stone-400');
            });
            btn.classList.remove('border-transparent', 'text-stone-400');
            btn.classList.add('border-stone-900', 'text-stone-900');

            // 2. Clear the Search Parameter from the URL without reloading the page
            const url = new URL(window.location);
            if (url.searchParams.has('search')) {
                url.searchParams.delete('search');
                window.history.pushState({}, '', url);
            }

            // 3. Apply all active filters
            applyFilters();
        });
    });

    // Price Filter Button
    if (applyPriceBtn) {
        applyPriceBtn.addEventListener('click', () => {
            applyFilters();
        });
    }
}

function initScrollAnimations() {
    const observerOptions = { root: null, rootMargin: '0px', threshold: 0.15 };
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-in-up').forEach(el => { observer.observe(el); });
}

function initQuickAdd() {
    const addBtns = document.querySelectorAll('.quick-add-btn');
    addBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Prevent the anchor tag from triggering a new tab
            e.preventDefault();
            e.stopPropagation();

            const productData = {
                title: btn.getAttribute('data-title'),
                price: parseInt(btn.getAttribute('data-price')),
                image: btn.getAttribute('data-image')
            };

            // Delegate to Global State (global.js)
            window.addToCart(productData, btn);
        });
    });
}
