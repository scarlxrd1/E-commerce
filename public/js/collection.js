import { db } from './firebase-config.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Master arrays for client-side filtering
let allProducts = [];
let ratingsMap = {}; // Will hold { productId: { sum: X, count: Y } }

document.addEventListener('DOMContentLoaded', async () => {
    ensureFontAwesome();
    await fetchAndRenderCollection();
    initFilters();
});

// Utility to inject FontAwesome if missing (needed for stars)
function ensureFontAwesome() {
    if (!document.querySelector('link[href*="font-awesome"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
        document.head.appendChild(link);
    }
}

async function fetchAndRenderCollection() {
    const productGrid = document.getElementById('product-grid');
    const countDisplay = document.getElementById('item-count');

    try {
        // 1. Fetch All Reviews to calculate averages
        const reviewsSnap = await getDocs(collection(db, "reviews"));
        reviewsSnap.forEach(doc => {
            const data = doc.data();
            if (!ratingsMap[data.productId]) {
                ratingsMap[data.productId] = { sum: 0, count: 0 };
            }
            ratingsMap[data.productId].sum += data.rating;
            ratingsMap[data.productId].count += 1;
        });

        // 2. Fetch all products once
        const querySnapshot = await getDocs(collection(db, "products"));
        querySnapshot.forEach((doc) => {
            allProducts.push({ id: doc.id, ...doc.data() });
        });

        // 3. Apply initial filters (incorporates URL search, category, and price)
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

// Helper to generate Star Rating HTML
function generateStarsHTML(ratingObj) {
    if (!ratingObj || ratingObj.count === 0) {
        return `<span class="font-sans text-[10px] tracking-widest uppercase text-stone-400">No reviews yet</span>`;
    }
    const avg = Math.round(ratingObj.sum / ratingObj.count);
    let starsHtml = '<div class="flex gap-[2px] text-xs">';
    for (let i = 1; i <= 5; i++) {
        starsHtml += `<i class="fa-solid fa-star ${i <= avg ? 'text-stone-900' : 'text-stone-200'}"></i>`;
    }
    starsHtml += `</div><span class="font-sans text-xs text-stone-500 ml-2">(${ratingObj.count})</span>`;
    return `<div class="flex items-center justify-center">${starsHtml}</div>`;
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

        // Get rating data
        const ratingData = ratingsMap[product.id] || { sum: 0, count: 0 };
        const ratingHTML = generateStarsHTML(ratingData);

        htmlString += `
            <a href="product.html?id=${product.id}" target="_blank" class="product-card fade-in-up group flex flex-col gap-6 ${mtClass}" data-category="${product.categories}">
                <div class="relative aspect-[4/5] overflow-hidden bg-stone-100">
                    <img src="${product.image}" alt="${product.title}" class="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out group-hover:opacity-0 z-10">
                    <img src="${hoverImg}" alt="${product.title} Lifestyle" class="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out opacity-0 group-hover:opacity-100 z-0">
                    
                    <button class="quick-add-btn absolute bottom-0 left-0 w-full bg-stone-900 text-white font-sans text-xs tracking-widest uppercase py-5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out z-20 hover:bg-stone-800"
                        data-id="${product.id}"
                        data-title="${product.title}"
                        data-price="${product.price}"
                        data-image="${product.image}"
                        data-stock="${product.stock || 0}">
                        Quick Add
                    </button>
                </div>
                <div class="flex flex-col items-center text-center">
                    <h2 class="font-serif text-xl text-stone-900 mb-2">${product.title}</h2>
                    <div class="mb-3">${ratingHTML}</div>
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

    initScrollAnimations();
    initQuickAdd();
}

function initFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const applyPriceBtn = document.getElementById('apply-price-filter');

    // Category Buttons
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => {
                b.classList.remove('border-stone-900', 'text-stone-900');
                b.classList.add('border-transparent', 'text-stone-400');
            });
            btn.classList.remove('border-transparent', 'text-stone-400');
            btn.classList.add('border-stone-900', 'text-stone-900');

            const url = new URL(window.location);
            if (url.searchParams.has('search')) {
                url.searchParams.delete('search');
                window.history.pushState({}, '', url);
            }

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
            e.preventDefault();
            e.stopPropagation();

            const productData = {
                id: btn.getAttribute('data-id'),
                title: btn.getAttribute('data-title'),
                price: parseInt(btn.getAttribute('data-price')),
                image: btn.getAttribute('data-image'),
                stock: parseInt(btn.getAttribute('data-stock'))
            };

            const success = window.addToCart(productData);
            const originalText = "Quick Add";

            if (success) {
                btn.textContent = 'Added';
                btn.classList.remove('bg-stone-900', 'hover:bg-stone-800');
                btn.classList.add('bg-stone-400', 'text-stone-900');
            } else {
                btn.textContent = 'Max Limit Reached';
                btn.classList.remove('bg-stone-900', 'hover:bg-stone-800');
                btn.classList.add('bg-stone-300', 'text-stone-600');
            }

            setTimeout(() => {
                btn.textContent = originalText;
                btn.classList.remove('bg-stone-400', 'bg-stone-300', 'text-stone-900', 'text-stone-600');
                btn.classList.add('bg-stone-900', 'hover:bg-stone-800');
            }, 2000);
        });
    });
}
