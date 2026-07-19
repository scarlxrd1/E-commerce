import { db } from './firebase-config.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Master arrays for client-side category filtering
let allProducts = [];
let ratingsMap = {}; // Will hold { productId: { sum: X, count: Y } }

document.addEventListener('DOMContentLoaded', async () => {
    ensureFontAwesome();
    await fetchAndRenderProducts();
    initCategoryFilters();
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

async function fetchAndRenderProducts() {
    const productGrid = document.getElementById('product-grid');
    try {
        // 1. Fetch All Reviews to calculate averages
        const reviewsSnap = await getDocs(collection(db, "reviews"));
        reviewsSnap.forEach(doc => {
            const data = doc.data();
            if (!ratingsMap[data.productId]) {
                ratingsMap[data.productId] = { sum: 0, count: 0 };
            }
            // CRITICAL FIX: Force Type Casting to Number
            ratingsMap[data.productId].sum += Number(data.rating) || 0;
            ratingsMap[data.productId].count += 1;
        });

        // 2. Fetch Products
        const querySnapshot = await getDocs(collection(db, "products"));
        querySnapshot.forEach((doc) => {
            allProducts.push({ id: doc.id, ...doc.data() });
        });

        // Initial render: show all products
        renderGrid(allProducts);

    } catch (error) {
        console.error("Error fetching products from Firebase:", error);
        if (productGrid) {
            productGrid.innerHTML = `<p class="col-span-full text-center text-stone-500">Failed to load collection. Please try again later.</p>`;
        }
    }
}

// Helper to generate Star Rating HTML (FIXED MATH LOGIC)
function generateStarsHTML(ratingObj) {
    if (!ratingObj || ratingObj.count === 0 || isNaN(ratingObj.sum) || isNaN(ratingObj.count)) {
        return `<span class="font-sans text-[10px] tracking-widest uppercase text-stone-400">No reviews yet</span>`;
    }
    
    // Calculate exact decimal average
    const exactAvg = ratingObj.sum / ratingObj.count;
    
    // Round to nearest whole number for the star loop
    const roundedAvg = Math.round(exactAvg);
    
    let starsHtml = '<div class="flex gap-[2px] text-xs">';
    for (let i = 1; i <= 5; i++) {
        starsHtml += `<i class="fa-solid fa-star ${i <= roundedAvg ? 'text-stone-900' : 'text-stone-200'}"></i>`;
    }
    starsHtml += `</div><span class="font-sans text-xs text-stone-500 ml-2">(${ratingObj.count})</span>`;
    
    return `<div class="flex items-center">${starsHtml}</div>`;
}

function renderGrid(productsToRender) {
    const productGrid = document.getElementById('product-grid');
    if (!productGrid) return;

    let htmlString = "";

    productsToRender.forEach((product) => {
        const hoverImg = product.hoverImage ? product.hoverImage : product.image;
        
        // Get rating data
        const ratingData = ratingsMap[product.id] || { sum: 0, count: 0 };
        const ratingHTML = generateStarsHTML(ratingData);
        
        htmlString += `
            <a href="product.html?id=${product.id}" class="product-card group flex flex-col gap-5 cursor-pointer transition-all" data-category="${product.categories}">
                <div class="relative aspect-[4/5] overflow-hidden bg-stone-100 rounded-md">
                    <img src="${product.image}" alt="${product.title}" class="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out group-hover:opacity-0 z-10">
                    <img src="${hoverImg}" alt="${product.title} Lifestyle" class="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out opacity-0 group-hover:opacity-100 z-0">
                    
                    <div class="absolute inset-0 bg-stone-900/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none"></div>
                    
                    <button class="grid-add-to-cart-btn absolute bottom-6 left-6 right-6 bg-stone-900 text-white font-sans text-sm tracking-wide py-3.5 rounded-md opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-sm z-20 hover:bg-stone-800 pointer-events-auto"
                        data-id="${product.id}"
                        data-title="${product.title}"
                        data-price="${product.price}"
                        data-image="${product.image}"
                        data-stock="${product.stock || 0}">
                        Add to Cart
                    </button>
                </div>
                <div class="flex justify-between items-start">
                    <div class="flex flex-col gap-1.5">
                        <h3 class="font-serif text-lg text-stone-900 leading-none">${product.title}</h3>
                        ${ratingHTML}
                    </div>
                    <span class="font-sans text-stone-900 font-medium">€${(product.price || 0).toLocaleString()}</span>
                </div>
            </a>
        `;
    });

    if (productsToRender.length === 0) {
        htmlString = `<p class="col-span-full text-center text-stone-500 py-12">No pieces found in this category.</p>`;
    }

    productGrid.innerHTML = htmlString;
    
    // Re-initialize event listeners for the newly injected buttons
    initGridAddToCart();
}

function initCategoryFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const mainFilterBtns = Array.from(filterButtons).filter(btn => !btn.classList.contains('nav-filter'));

    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const selectedCategory = btn.getAttribute('data-category');

            // Handle active state styling
            if (btn.classList.contains('filter-btn')) {
                mainFilterBtns.forEach(b => {
                    b.classList.remove('border-stone-900', 'text-stone-900');
                    b.classList.add('border-transparent', 'text-stone-500');
                });
                btn.classList.remove('border-transparent', 'text-stone-500');
                btn.classList.add('border-stone-900', 'text-stone-900');
            }

            // Filter the master array
            const filtered = selectedCategory === 'all' 
                ? allProducts 
                : allProducts.filter(p => p.categories && p.categories.includes(selectedCategory));

            // Re-render the grid
            renderGrid(filtered);

            // Scroll down if initiated from a nav link
            if (btn.classList.contains('nav-filter')) {
                document.getElementById('shop').scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

function initGridAddToCart() {
    const gridBtns = document.querySelectorAll('.grid-add-to-cart-btn');
    
    gridBtns.forEach(btn => {
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
            const originalText = "Add to Cart";

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
