// public/js/collection.js

import { db } from './firebase-config.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
    await fetchAndRenderCollection();
    initScrollAnimations();
    initFilters();
    initQuickAdd();
});

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

            const mtClass = (index % 3 === 1) ? "lg:mt-24" : "";
            const hoverImg = product.hoverImage ? product.hoverImage : product.image;

            htmlString += `
                <article class="product-card fade-in-up group flex flex-col gap-6 ${mtClass}" data-category="${product.categories}">
                    <div class="relative aspect-[4/5] overflow-hidden bg-stone-100">
                        <img src="${product.image}" alt="${product.title}" class="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out group-hover:opacity-0 z-10">
                        <img src="${hoverImg}" alt="${product.title} Lifestyle" class="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out opacity-0 group-hover:opacity-100 z-0">
                        
                        <!-- Added Data Attributes to properly interface with global cart -->
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
                </article>
            `;
            index++;
        });

        productGrid.innerHTML = htmlString;
        countDisplay.textContent = `Showing ${totalItems} piece${totalItems !== 1 ? 's' : ''}`;

    } catch (error) {
        console.error("Error fetching collection from Firebase:", error);
        productGrid.innerHTML = `<p class="col-span-full text-center text-stone-500">Failed to load collection. Please try again later.</p>`;
        countDisplay.textContent = "Error loading pieces";
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

function initFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const products = document.querySelectorAll('.product-card');
    const countDisplay = document.getElementById('item-count');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => {
                b.classList.remove('border-stone-900', 'text-stone-900');
                b.classList.add('border-transparent', 'text-stone-400');
            });
            
            btn.classList.remove('border-transparent', 'text-stone-400');
            btn.classList.add('border-stone-900', 'text-stone-900');

            const selectedCategory = btn.getAttribute('data-filter');
            let visibleCount = 0;

            products.forEach(product => {
                const productCategories = product.getAttribute('data-category') || "";
                const categoryArray = productCategories.split(' ');

                if (selectedCategory === 'all' || categoryArray.includes(selectedCategory)) {
                    product.style.display = 'flex';
                    visibleCount++;
                    product.classList.remove('is-visible');
                    setTimeout(() => product.classList.add('is-visible'), 50);
                } else {
                    product.style.display = 'none';
                    product.classList.remove('is-visible');
                }
            });

            countDisplay.textContent = `Showing ${visibleCount} piece${visibleCount !== 1 ? 's' : ''}`;
        });
    });
}

function initQuickAdd() {
    const addBtns = document.querySelectorAll('.quick-add-btn');
    addBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const productData = {
                title: btn.getAttribute('data-title'),
                price: parseInt(btn.getAttribute('data-price')),
                image: btn.getAttribute('data-image')
            };

            // Delegate to Global State
            window.addToCart(productData, btn);
        });
    });
}
