// public/js/shop.js

import { db } from './firebase-config.js';
import { collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
    await fetchAndRenderProducts();
    initCategoryFilters();
    initQuickViewModal();
    initGridAddToCart();
});

async function fetchAndRenderProducts() {
    const productGrid = document.getElementById('product-grid');
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        let htmlString = "";
        
        querySnapshot.forEach((doc) => {
            const product = doc.data();
            htmlString += `
                <div class="product-card group flex flex-col gap-4 cursor-pointer" 
                     data-category="${product.categories}" 
                     data-title="${product.title}" 
                     data-price="${product.price}" 
                     data-image="${product.image}" 
                     data-desc="${product.desc}">
                    <div class="relative aspect-[4/5] overflow-hidden bg-stone-100 rounded-md">
                        <img src="${product.image}" alt="${product.title}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105">
                        <div class="absolute inset-0 bg-stone-900/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <button class="grid-add-to-cart-btn absolute bottom-6 left-6 right-6 bg-stone-900 text-white font-sans text-sm tracking-wide py-3.5 rounded-md opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-sm z-10 hover:bg-stone-800">
                            Add to Cart
                        </button>
                    </div>
                    <div class="flex justify-between items-start">
                        <div>
                            <h3 class="font-serif text-lg text-stone-900">${product.title}</h3>
                            <p class="font-sans text-sm text-stone-500 mt-1">${product.subtitle}</p>
                        </div>
                        <span class="font-sans text-stone-900 font-medium">€${product.price.toLocaleString()}</span>
                    </div>
                </div>
            `;
        });

        if (productGrid) {
            productGrid.innerHTML = htmlString;
        }
    } catch (error) {
        console.error("Error fetching products from Firebase:", error);
        if (productGrid) {
            productGrid.innerHTML = `<p class="col-span-full text-center text-stone-500">Failed to load collection. Please try again later.</p>`;
        }
    }
}

function initCategoryFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn, .nav-filter');
    const products = document.querySelectorAll('.product-card');
    const mainFilterBtns = document.querySelectorAll('.filter-btn');

    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const selectedCategory = btn.getAttribute('data-category');

            if (btn.classList.contains('filter-btn')) {
                mainFilterBtns.forEach(b => {
                    b.classList.remove('border-stone-900', 'text-stone-900');
                    b.classList.add('border-transparent', 'text-stone-500');
                });
                btn.classList.remove('border-transparent', 'text-stone-500');
                btn.classList.add('border-stone-900', 'text-stone-900');
            }

            products.forEach(product => {
                const productCategories = product.getAttribute('data-category').split(' ');
                
                if (selectedCategory === 'all' || productCategories.includes(selectedCategory)) {
                    product.classList.remove('hidden');
                    product.classList.add('flex');
                    product.style.opacity = '0';
                    setTimeout(() => product.style.opacity = '1', 50);
                } else {
                    product.classList.add('hidden');
                    product.classList.remove('flex');
                }
            });

            if (btn.classList.contains('nav-filter')) {
                document.getElementById('shop').scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

function initQuickViewModal() {
    const products = document.querySelectorAll('.product-card');
    const modal = document.getElementById('quick-view-modal');
    const backdrop = document.getElementById('modal-backdrop');
    const content = document.getElementById('modal-content');
    const closeBtn = document.getElementById('close-modal-btn');
    
    const mImage = document.getElementById('modal-image');
    const mTitle = document.getElementById('modal-title');
    const mPrice = document.getElementById('modal-price');
    const mDesc = document.getElementById('modal-desc');
    const mAddBtn = document.getElementById('modal-add-to-cart-btn');

    products.forEach(product => {
        product.addEventListener('click', (e) => {
            if (e.target.closest('.grid-add-to-cart-btn')) return;

            const title = product.getAttribute('data-title');
            const price = product.getAttribute('data-price');
            const image = product.getAttribute('data-image');
            const desc = product.getAttribute('data-desc');

            mTitle.textContent = title;
            mPrice.textContent = `€${parseInt(price).toLocaleString()}`;
            mImage.src = image;
            mImage.alt = title;
            mDesc.textContent = desc;

            mAddBtn.dataset.title = title;
            mAddBtn.dataset.price = price;
            mAddBtn.dataset.image = image;

            modal.classList.remove('hidden');
            setTimeout(() => {
                backdrop.classList.remove('opacity-0');
                backdrop.classList.add('opacity-100');
                content.classList.remove('opacity-0', 'scale-95');
                content.classList.add('opacity-100', 'scale-100');
            }, 10);
            
            document.body.style.overflow = 'hidden';
        });
    });

    const closeModal = () => {
        backdrop.classList.remove('opacity-100');
        backdrop.classList.add('opacity-0');
        content.classList.remove('opacity-100', 'scale-100');
        content.classList.add('opacity-0', 'scale-95');
        
        setTimeout(() => {
            modal.classList.add('hidden');
            document.body.style.overflow = ''; 
        }, 300);
    };

    closeBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', closeModal);

    mAddBtn.addEventListener('click', () => {
        const productData = {
            title: mAddBtn.dataset.title,
            price: parseInt(mAddBtn.dataset.price),
            image: mAddBtn.dataset.image
        };
        // Delegate to Global State
        window.addToCart(productData, mAddBtn);
    });
}

function initGridAddToCart() {
    const gridBtns = document.querySelectorAll('.grid-add-to-cart-btn');
    gridBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            const productCard = btn.closest('.product-card');
            const productData = {
                title: productCard.getAttribute('data-title'),
                price: parseInt(productCard.getAttribute('data-price')),
                image: productCard.getAttribute('data-image')
            };
            // Delegate to Global State
            window.addToCart(productData, btn);
        });
    });
}
