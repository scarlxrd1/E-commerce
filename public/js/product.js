import { db } from './firebase-config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
            renderProduct(container, { id: docSnap.id, ...docSnap.data() });
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
    // Determine images (fallback to main image if hoverImage is missing)
    const mainImg = product.image || '';
    const hoverImg = product.hoverImage || mainImg;

    // Update document title for SEO/UX
    document.title = `AURA | ${product.title}`;

    // Remove the centering classes used for the loading state
    container.classList.remove('flex', 'items-center', 'justify-center');
    
    // Inject stunning editorial layout
    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 items-start">
            
            <!-- Left Column: Image Gallery -->
            <div class="flex flex-col gap-6">
                <div class="aspect-[4/5] w-full bg-stone-100 overflow-hidden rounded-sm">
                    <img src="${mainImg}" alt="${product.title}" class="w-full h-full object-cover">
                </div>
                ${hoverImg !== mainImg ? `
                <div class="aspect-[4/5] w-full bg-stone-100 overflow-hidden rounded-sm">
                    <img src="${hoverImg}" alt="${product.title} Detail" class="w-full h-full object-cover">
                </div>
                ` : ''}
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
                <p class="font-sans text-xl text-stone-500 mb-8 font-medium">€${product.price.toLocaleString()}</p>
                
                <div class="w-12 h-px bg-stone-300 mb-8"></div>
                
                <div class="prose prose-stone font-sans text-stone-500 leading-relaxed mb-10">
                    <p>${product.desc || 'No description available for this piece.'}</p>
                </div>

                <!-- Shipping Perks -->
                <div class="space-y-6 mb-12">
                    <div class="flex items-center gap-4 text-sm font-sans text-stone-600">
                        <svg class="w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 13l4 4L19 7"></path></svg>
                        Complimentary Standard Shipping
                    </div>
                    <div class="flex items-center gap-4 text-sm font-sans text-stone-600">
                        <svg class="w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        Estimated Dispatch: 3-5 Business Days
                    </div>
                </div>

                <!-- Add to Cart Action -->
                <button id="add-to-cart-btn" class="w-full bg-stone-900 text-white font-sans text-sm tracking-widest uppercase py-5 rounded-sm hover:bg-stone-800 transition-colors shadow-sm mb-8"
                    data-title="${product.title}"
                    data-price="${product.price}"
                    data-image="${product.image}">
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

    // Hook up Add to Cart functionality with Global State
    const addBtn = document.getElementById('add-to-cart-btn');
    addBtn.addEventListener('click', () => {
        const productData = {
            title: addBtn.getAttribute('data-title'),
            price: parseInt(addBtn.getAttribute('data-price')),
            image: addBtn.getAttribute('data-image')
        };
        // Delegate to global.js
        window.addToCart(productData, addBtn);
    });
}
